import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRepository } from '../user/repositories/user.repository';
import { Model, Types } from 'mongoose';
import { Response } from 'express';
import { CreateResponse } from 'src/shared/successResponse/create.response';

import { Session, SessionDocument } from './schemas/session.schema';
import { SessionRepository } from './repositories/session.repository';
import { GetResponse } from 'src/shared/successResponse/get.response';
import {
  LoginResponseDto,
  LogoutResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  MissingAccessTokenError,
  MissingRefreshTokenError,
  MissingSessionIdError,
  RefreshTokenExpiredError,
  SessionNotFoundError,
  UserAccountBlockedError,
  UserNotFoundError,
  UserRoleNotFoundError,
} from 'src/shared/errorResponse/auth.errors';
import { DeleteResponse } from 'src/shared/successResponse/delete.response';
import { ConfigService } from '@nestjs/config';
import { RoleRepository } from '../user/repositories/role.repository';
import { BaseError } from 'src/shared/errorResponse/base.error.response';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<Session>,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly configService: ConfigService,
    private readonly roleRepository: RoleRepository,
  ) {}

  //Login user and create session
  async login(
    email: string,
    password: string,
    res: Response,
    isForAdminLogin?,
  ): Promise<CreateResponse<LoginResponseDto>> {
    // Find user
    const user = await this.userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      throw new UserNotFoundError();
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new InvalidCredentialsError();
    }

    // Check if user account is active
    if (user.isActive === false) {
      throw new UserAccountBlockedError();
    }

    // Fetch user's role document
    const userRole = await this.roleRepository.findById(user.role);
    if (!userRole) {
      throw new UserRoleNotFoundError(); // role not found
    }
    if (isForAdminLogin) {
      if (userRole.roleSlug !== 'admin_user') {
        throw new InvalidCredentialsError();
      }
    }

    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    // Fetch the values from environment variables
    const accessExpMs = Number(
      this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
    );
    const refreshExpMs = Number(
      this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_MS'),
    );

    // Create session
    const session = await this.sessionRepository.createSession({
      userId: user._id as Types.ObjectId,
      refreshToken: refreshTokenHash,
      expiresAt: new Date(Date.now() + refreshExpMs),
    });

    // Create access token
    const accessToken = this.jwtService.sign(
      {
        userId: user._id,
        userRole: userRole._id,
        userRoleSlug: userRole.roleSlug,
        sessionId: session._id,
      },
      {
        expiresIn: accessExpMs / 1000,
      },
    );

    // Set cookies (refresh token AND session ID)
    this.setRefreshCookie(res, refreshToken);
    this.setSessionIdCookie(res, String(session._id));
    // Return standardized response
    return new GetResponse<LoginResponseDto>({
      accessToken,
      isEmailVerified: user.isEmailVerified,
      roleSlug: userRole.roleSlug,
    });
  }

  // Refresh token mechanism
  async refresh(
    refreshToken: string,
    sessionId: string,
  ): Promise<GetResponse<RefreshResponseDto>> {
    // Validate inputs
    if (!refreshToken) {
      throw new MissingRefreshTokenError();
    }

    if (!sessionId) {
      throw new MissingSessionIdError();
    }

    // Find session by sessionId and check validity
    const session =
      await this.sessionRepository.findValidSessionById(sessionId);

    if (!session) {
      throw new SessionNotFoundError();
    }

    // Verify the refresh token against the stored hash
    const isMatch = await bcrypt.compare(refreshToken, session.refreshToken);
    if (!isMatch) {
      throw new InvalidRefreshTokenError();
    }

    // Check expiry
    if (new Date() > session.expiresAt) {
      throw new RefreshTokenExpiredError();
    }

    // Get user
    const user = await this.userRepository.findById(session.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Check if user account is active
    if (user.isActive === false) {
      throw new UserAccountBlockedError();
    }

    // Fetch the user role document
    const userRole = await this.roleRepository.findById(user.role);
    if (!userRole) throw new UserRoleNotFoundError();

    const accessExpMs = Number(
      this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
    );
    // Generate new access token with SAME sessionId
    const newAccessToken = this.jwtService.sign(
      {
        userId: user._id,
        userRole: userRole._id,
        userRoleSlug: userRole.roleSlug,
        sessionId: session._id,
      },
      {
        expiresIn: accessExpMs / 1000,
      },
    );

    // Return standardized response (200 OK)
    return new GetResponse<RefreshResponseDto>({ accessToken: newAccessToken });
  }

  // Logout user and invalidate session
  async logout(
    accessToken: string,
    res: Response,
  ): Promise<DeleteResponse<LogoutResponseDto>> {
    if (!accessToken) {
      throw new MissingAccessTokenError();
    }

    try {
      // Decode and verify access token
      const decoded = this.jwtService.verify(accessToken, {
        secret: this.configService.get('JWT_SECRET'),
      }) as {
        userId: string;
        userRole: string[];
        sessionId: string;
      };

      // Invalidate the specific session by userId and sessionId
      if (decoded.userId && decoded.sessionId) {
        const session =
          await this.sessionRepository.findSessionByUserAndSessionId(
            decoded.userId,
            decoded.sessionId,
          );

        if (session) {
          await this.sessionRepository.invalidateSession(decoded.sessionId);
        }
      }
    } catch (error) {
      // Token might be expired or invalid, but we still want to clear cookies
      if (error.name === 'TokenExpiredError') {
        console.log('Expired token during logout - clearing cookies anyway');
      } else if (error.name === 'JsonWebTokenError') {
        console.log('Invalid token during logout - clearing cookies anyway');
        throw error;
      } else {
        console.error('Error during logout:', error);
      }
    }

    // Always clear cookies
    this.clearAuthCookies(res);

    return new DeleteResponse<LogoutResponseDto>({
      message: 'Logged out successfully',
    });
  }

  // Clear authentication cookies
  private clearAuthCookies(res: Response): void {
    const cookieOptions = {
      httpOnly: true,
      secure: this.configService.get<string>('APP_ENV') === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    res.clearCookie('refreshToken', cookieOptions);
    res.clearCookie('sessionId', cookieOptions);
  }

  // Set refresh token cookie
  private setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  //Set session ID cookie
  private setSessionIdCookie(res: Response, sessionId: string): void {
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }
}
