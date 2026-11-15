import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import {
  LoginResponseDto,
  LogoutResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { GetResponse } from 'src/shared/successResponse/get.response';
import { CreateResponse } from 'src/shared/successResponse/create.response';
import { MissingAccessTokenError } from 'src/shared/errorResponse/auth.errors';
import { DeleteResponse } from 'src/shared/successResponse/delete.response';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //Login api
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CreateResponse<LoginResponseDto>> {
    return await this.authService.login(loginDto.email, loginDto.password, res);
  }

  // Refresh token api
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GetResponse<RefreshResponseDto>> {
    const refreshToken = req.cookies?.refreshToken;
    const sessionId = req.cookies?.sessionId;

    return await this.authService.refresh(refreshToken, sessionId);
  }

  //Logout endpoint
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Headers('authorization') authorization: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<DeleteResponse<LogoutResponseDto>> {
    const accessToken = this.extractToken(authorization);
    return await this.authService.logout(accessToken, res);
  }

  //Extract and validate Bearer token from Authorization header
  private extractToken(authorization: string | undefined): string {
    if (!authorization) {
      throw new MissingAccessTokenError('Missing authorization header');
    }

    const accessToken = authorization.replace(/^Bearer\s+/i, '').trim();

    if (!accessToken) {
      throw new MissingAccessTokenError('Invalid authorization header format');
    }

    return accessToken;
  }

  //Login api for admin
  @Post('/admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CreateResponse<LoginResponseDto>> {
    return await this.authService.login(
      loginDto.email,
      loginDto.password,
      res,
      true,
    );
  }

  //Logout endpoint for admin
  @Post('/admin/logout')
  @HttpCode(HttpStatus.OK)
  async adminLogout(
    @Headers('authorization') authorization: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<DeleteResponse<LogoutResponseDto>> {
    const accessToken = this.extractToken(authorization);
    return await this.authService.logout(accessToken, res);
  }
}
