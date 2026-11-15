import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { EmailModule } from './utils/sendgrid/email.module';
import { HealthModule } from './modules/health/health.module';
import { BugsnagModule } from './utils/bugsnag/bugsnag.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () => console.log('MongoDB connected'));
          connection.on('error', (err) => console.error('MongoDB error:', err));
          connection.on('disconnected', () =>
            console.warn('MongoDB disconnected'),
          );
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    EmailModule.forRoot(),
    AuthModule,
    UserModule,
    HealthModule,
    BugsnagModule,
    ProductModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
