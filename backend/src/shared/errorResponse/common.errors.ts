// src/shared/errors/common.errors.ts
import { BaseError } from './base.error.response';

export class BadRequestError extends BaseError {
  constructor(message: string = 'Bad Request', data?: any) {
    super(message, 400, 'BAD_REQUEST', data);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized', data?: any) {
    super(message, 401, 'UNAUTHORIZED', data);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = 'Forbidden', data?: any) {
    super(message, 403, 'FORBIDDEN', data);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string = 'Resource not found', data?: any) {
    super(message, 404, 'NOT_FOUND', data);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string = 'Conflict', data?: any) {
    super(message, 409, 'CONFLICT', data);
  }
}

export class UnprocessableEntityError extends BaseError {
  constructor(message: string = 'Unprocessable Entity', data?: any) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', data);
  }
}

export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal Server Error', data?: any) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', data);
  }
}

export class ServiceUnavailableError extends BaseError {
  constructor(message: string = 'Service Unavailable', data?: any) {
    super(message, 503, 'SERVICE_UNAVAILABLE', data);
  }
}

export class DuplicateKeyError extends Error {
  constructor(public original: any) {
    super('Duplicate key error');
  }
}