import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt-helper/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './schemas/session.schema';
import { SessionRepository } from './repositories/session.repository';
import { UserRepository } from '../user/repositories/user.repository';
import { UserModule } from '../user/user.module';
import { RoleRepository } from '../user/repositories/role.repository';
import { Role, RoleSchema } from '../user/schemas/role.schema';
import { RolesGuard } from './jwt-helper/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
    UserModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        privateKey: configService.get<string>('JWT_ACCESS_TOKEN_PRIVATE_KEY'),
        publicKey: configService.get<string>('JWT_ACCESS_TOKEN_PUBLIC_KEY'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: configService.get('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SessionRepository, RoleRepository, RolesGuard],
  exports: [RolesGuard],
})
export class AuthModule {}
