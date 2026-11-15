import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtUserPayload } from '../interfaces/jwt-user-payload.interface';
import { UserRepository } from 'src/modules/user/repositories/user.repository';
import { UserAccountBlockedError } from 'src/shared/errorResponse/auth.errors';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
       Acts as a middleware. This part automatically verifies:
       The token exists
       The token is not expired
       The token signature is valid
       If any of these fail → the request is blocked before it reaches the controller.
       */
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_PUBLIC_KEY'),
      algorithms: ['RS256'],
    });
  }

  /**
   *  If the token is valid, Passport will decode it and call validate().
   *  payload is the decoded token data.
   */
  async validate(payload: JwtUserPayload) {
    const user = await this.userRepository.findById(payload.userId);
    if (!user || user.isActive === false) {
      throw new UserAccountBlockedError();
    }
    // The object returned from here becomes request.user (accessible via @UserToken() decorator)
    return { payload };
  }
}
