import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import Bugsnag from '@bugsnag/js';
import { BaseError } from '../../shared/errorResponse/base.error.response';
import { ConfigService } from '@nestjs/config';

@Catch()
export class BugsnagExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BugsnagExceptionFilter.name);
  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // Keep void here
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProd =
      (this.configService.get('NODE_ENV') || '').toLowerCase() === 'production';

    // Report to Bugsnag first
    this.reportToBugsnag(exception, request, isProd);

    // Log the error
    this.logError(exception, request, isProd);

    // Send standardized response
    this.sendResponse(exception, response, isProd);
  }

  /**
   * Report exception to Bugsnag
   */
  private reportToBugsnag(
    exception: unknown,
    request: Request,
    isProd: boolean,
  ): void {
    if (!(exception instanceof Error)) return;

    const status = this.getStatusCode(exception);

    Bugsnag.notify(exception, (event) => {
      if (!isProd) {
        // Dev only — detailed context
        event.request = {
          url: request.url,
          method: request.method,
          headers: request.headers as any,
        };
        event.addMetadata('request', {
          body: request.body,
          query: request.query,
          params: request.params,
          ip: request.ip,
          userAgent: request.get('user-agent'),
        });
      } else {
        // Prod — only essentials, no sensitive data
        event.request = {
          url: request.url,
          method: request.method,
        };
      }

      // Add error metadata if BaseError
      if (exception instanceof BaseError) {
        event.addMetadata('customError', {
          code: exception.code,
          statusCode: exception.statusCode,
          data: exception.data,
        });
      }

      event.addMetadata('response', { statusCode: status });
      event.severity =
        status >= 500 ? 'error' : status >= 400 ? 'warning' : 'info';

      // Hide sensitive messages in prod
      if (
        isProd &&
        (exception.message?.toLowerCase().includes('password') ||
          exception.message?.toLowerCase().includes('database'))
      ) {
        event.context = 'Sanitized Error (Prod)';
      }
    });
  }

  /**
   * Log error to console
   */
  private logError(
    exception: unknown,
    request: Request,
    isProd: boolean,
  ): void {
    if (!(exception instanceof Error)) return;

    const status = this.getStatusCode(exception);

    if (isProd) {
      // Log only essential data
      this.logger.error(
        `Error: ${request.method} ${request.url} [${status}] - ${exception.message}`,
      );
    } else {
      // Full debug logs in dev
      this.logger.error(
        `${request.method} ${request.url}`,
        exception.stack,
        BugsnagExceptionFilter.name,
      );
    }
  }

  /**
   * Send standardized response
   */
  private sendResponse(
    exception: unknown,
    response: Response,
    isProd: boolean,
  ): void {
    // Changed to void (don't return the response object)
    // Handle BaseError and its subclasses
    if (exception instanceof BaseError) {
      response.status(exception.statusCode).json(exception.toJSON());
      return; // Just return without value
    }

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Special handling for validation errors
      if (exception instanceof BadRequestException) {
        const responseBody: any = exceptionResponse;

        if (Array.isArray(responseBody.message)) {
          response.status(status).json({
            success: false,
            message: 'Validation failed',
            statusCode: status,
            code: 'VALIDATION_ERROR',
            data: {
              errors: responseBody.message,
            },
          });
          return; // Just return without value
        }
      }

      // Handle other HttpExceptions
      response.status(status).json({
        success: false,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || 'Error occurred',
        statusCode: status,
        code: (exceptionResponse as any).error || 'HTTP_EXCEPTION',
        data: null,
      });
      return; // Just return without value
    }

    // Handle unknown errors
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: isDevelopment
        ? (exception as Error)?.message || 'Internal server error'
        : 'Internal server error',
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      data: isDevelopment ? { stack: (exception as Error)?.stack } : null,
    });
    // No return statement needed at the end
  }

  /**
   * Get status code from exception
   */
  private getStatusCode(exception: unknown): number {
    if (exception instanceof BaseError) {
      return exception.statusCode;
    }
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
