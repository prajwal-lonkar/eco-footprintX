import { UnauthorizedError, NotFoundError } from './common.errors';

export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message: string = 'Invalid credentials', data?: any) {
    super(message, data);
    this.code = 'INVALID_CREDENTIALS';
  }
}

export class MissingRefreshTokenError extends UnauthorizedError {
  constructor(message: string = 'Missing refresh token', data?: any) {
    super(message, data);
    this.code = 'MISSING_REFRESH_TOKEN';
  }
}

export class MissingSessionIdError extends UnauthorizedError {
  constructor(message: string = 'Missing session ID', data?: any) {
    super(message, data);
    this.code = 'MISSING_SESSION_ID';
  }
}

export class SessionNotFoundError extends UnauthorizedError {
  constructor(message: string = 'Session not found or invalid', data?: any) {
    super(message, data);
    this.code = 'SESSION_NOT_FOUND';
  }
}

export class InvalidRefreshTokenError extends UnauthorizedError {
  constructor(message: string = 'Invalid refresh token', data?: any) {
    super(message, data);
    this.code = 'INVALID_REFRESH_TOKEN';
  }
}

export class RefreshTokenExpiredError extends UnauthorizedError {
  constructor(message: string = 'Refresh token expired', data?: any) {
    super(message, data);
    this.code = 'REFRESH_TOKEN_EXPIRED';
  }
}

export class SessionInvalidError extends UnauthorizedError {
  constructor(message: string = 'Session invalid', data?: any) {
    super(message, data);
    this.code = 'SESSION_INVALID';
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(message: string = 'User not found', data?: any) {
    super(message, data);
    this.code = 'USER_NOT_FOUND';
  }
}

export class EmailAlreadyExistsError extends UnauthorizedError {
  constructor(message: string = 'Email already exists', data?: any) {
    super(message, data);
    this.code = 'EMAIL_ALREADY_EXISTS';
    this.statusCode = 409; // Conflict
  }
}

export class WeakPasswordError extends UnauthorizedError {
  constructor(
    message: string = 'Password does not meet requirements',
    data?: any,
  ) {
    super(message, data);
    this.code = 'WEAK_PASSWORD';
    this.statusCode = 400; // Bad Request
  }
}

export class MissingAccessTokenError extends UnauthorizedError {
  constructor(message: string = 'Missing access token', data?: any) {
    super(message, data);
    this.code = 'MISSING_ACCESS_TOKEN';
  }
}

export class UserRoleNotFoundError extends NotFoundError {
  constructor(message: string = 'User role not found', data?: any) {
    super(message, data);
    this.code = 'USER_ROLE_NOT_FOUND';
  }
}

export class UserAccountBlockedError extends UnauthorizedError {
  constructor(message: string = 'Account is blocked', data?: any) {
    super(message, data);
    this.code = 'USER_ACCOUNT_BLOCKED';
  }
}
