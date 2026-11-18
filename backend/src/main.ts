// **************** Development Environment *******************
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { BugsnagExceptionFilter } from './utils/bugsnag/bugsnag-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { VersioningType } from '@nestjs/common';
import { BugsnagService } from './utils/bugsnag/bugsnag.service';
import { ConfigService } from '@nestjs/config';
import { loadAwsSecrets } from './config//aws/aws-secrets-loader';

async function bootstrap() {
  const isLocal = true;

  if (!isLocal) {
    console.log('Loading AWS Secrets Manager...');
    const secrets = await loadAwsSecrets();
    // Merge secrets into environment
    for (const [key, value] of Object.entries(secrets)) {
      process.env[key] = value;
    }

    console.log('AWS Secrets loaded successfully.');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  // Get initialized BugsnagService
  const bugsnagService = app.get(BugsnagService);

  // Use middleware from BugsnagService
  if (bugsnagService.middleware) {
    app.use(bugsnagService.middleware.requestHandler);
  }

  // Cookie parser
  app.use(cookieParser());
  app.disable('etag');

  // CORS setup
  app.enableCors({
    origin: true, // <-- Allow all origins
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  // Enable global DTO validation (important)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown fields from body
      forbidNonWhitelisted: true, // throws error if extra fields present
      transform: true, // auto convert types (string → number, etc.)
    }),
  );

  // Bugsnag error handler
  if (bugsnagService.middleware) {
    app.use(bugsnagService.middleware.errorHandler);
  }

  // Global exception filter
  app.useGlobalFilters(new BugsnagExceptionFilter(configService));

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

bootstrap();
