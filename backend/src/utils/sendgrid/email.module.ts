import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from './email.service';
import { OtpSessionRepository } from 'src/modules/user/repositories/otpSessions.repository';
import { UserRepository } from 'src/modules/user/repositories/user.repository';

import { OtpSession, OtpSessionSchema } from 'src/modules/user/schemas/otpSessions.schema';
import { User, UserSchema } from 'src/modules/user/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { ResetSessions, ResetSessionsSchema } from 'src/modules/user/schemas/resetSessions.schema';
import { ResetSessionsRepository } from 'src/modules/user/repositories/resetSessions.repository';

@Module({})
export class EmailModule {
  static forRoot(): DynamicModule {
    return {
      module: EmailModule,
      imports: [
        ConfigModule,
        MongooseModule.forFeature([
          { name: OtpSession.name, schema: OtpSessionSchema },
          { name: User.name, schema: UserSchema },
          { name: ResetSessions.name, schema: ResetSessionsSchema },
        ]),
      ],
      providers: [
        JwtService,
        {
          provide: 'SENDGRID_OPTIONS',
          useFactory: (config: ConfigService) => {
            const apiKey = config.get('SENDGRID_API_KEY');
            const fromEmail = config.get('SENDGRID_FROM_EMAIL');
            return { apiKey, fromEmail };
          },
          inject: [ConfigService],
        },
        OtpSessionRepository,
        UserRepository,
        ResetSessionsRepository,
        {
          provide: EmailService,
          useFactory: (
            options: any,
            otpRepo: OtpSessionRepository,
            userRepo: UserRepository,
            jwtService: JwtService,
            resetSessionsRepo: ResetSessionsRepository
          ) => new EmailService(options, otpRepo, userRepo, jwtService, resetSessionsRepo),
          inject: ['SENDGRID_OPTIONS', OtpSessionRepository, UserRepository, JwtService, ResetSessionsRepository],
        },
      ],
      exports: [EmailService],
    };
  }
}