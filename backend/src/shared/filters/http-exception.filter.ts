import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { BaseError } from '../errorResponse/base.error.response';
import { ConfigService } from '@nestjs/config';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle BaseError and its subclasses
    if (exception instanceof BaseError) {
      return response.status(exception.statusCode).json(exception.toJSON());
    }

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Special handling for validation errors (BadRequestException with array messages)
      if (exception instanceof BadRequestException) {
        const responseBody: any = exceptionResponse;

        // Check if it's a validation error (has message array)
        if (Array.isArray(responseBody.message)) {
          return response.status(status).json({
            success: false,
            message: 'Validation failed',
            statusCode: status,
            code: 'VALIDATION_ERROR',
            data: {
              errors: responseBody.message, // Array of validation errors
            },
          });
        }
      }

      // Handle other HttpExceptions
      return response.status(status).json({
        success: false,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || 'Error occurred',
        statusCode: status,
        code: (exceptionResponse as any).error || 'HTTP_EXCEPTION',
        data: null,
      });
    }

    // Handle unknown errors (don't expose internal details in production)
    console.error('Unhandled exception:', exception);
    const isDevelopment =
      this.configService.get<string>('NODE_ENV') === 'development';
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: isDevelopment
        ? (exception as Error)?.message || 'Internal server error'
        : 'Internal server error',
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      data: isDevelopment ? { stack: (exception as Error)?.stack } : null,
    });
  }
}
