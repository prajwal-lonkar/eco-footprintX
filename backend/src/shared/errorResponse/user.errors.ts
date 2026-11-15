// src/modules/user/errors/user.errors.ts
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from './common.errors';

export class UserNotEligibleError extends BadRequestError {
  constructor(
    message: string = 'User is not eligible to register',
    data?: any,
  ) {
    super(message, data);
    this.code = 'USER_NOT_ELIGIBLE';
  }
}

export class UserCreationFailedError extends InternalServerError {
  constructor(message: string = 'Failed to create user', data?: any) {
    super(message, data);
    this.code = 'USER_CREATION_FAILED';
  }
}

export class EmailAlreadyExistsError extends ConflictError {
  constructor(message: string = 'Email already exists', data?: any) {
    super(message, data);
    this.code = 'EMAIL_ALREADY_EXISTS';
  }
}

export class EligibilityCheckFailedError extends InternalServerError {
  constructor(
    message: string = 'Failed to check user eligibility',
    data?: any,
  ) {
    super(message, data);
    this.code = 'ELIGIBILITY_CHECK_FAILED';
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(message: string = 'User not found', data?: any) {
    super(message, data);
    this.code = 'USER_NOT_FOUND';
  }
}

export class ResetLinkCooldownError extends BadRequestError {
  constructor(
    message: string = 'A reset link was recently sent.Please wait a few minutes before requesting another',
    data?: any,
  ) {
    super(message, data);
    this.code = 'RESET_LINK_COOLDOWN';
  }
}

export class InvalidResetLinkError extends BadRequestError {
  constructor(message: string = 'Invalid reset link', data?: any) {
    super(message, data);
    this.code = 'INVALID_RESET_LINK';
  }
}

export class ResetLinkAlreadyUsedError extends BadRequestError {
  constructor(message: string = 'Reset Link Already Used', data?: any) {
    super(message, data);
    this.code = 'RESET_LINK_ALREADY_USED';
  }
}

export class OldNewPasswordSameError extends BadRequestError {
  constructor(
    message: string = 'Reset Old and New Password cannot be same',
    data?: any,
  ) {
    super(message, data);
    this.code = 'OLD_NEW_PASSWORD_ERROR';
  }
}

export class RoleNotFoundError extends NotFoundError {
  constructor(message: string = 'Role not found', data?: any) {
    super(message, data);
    this.code = 'ROLE_NOT_FOUND';
  }
}

export class EmailToSupplierAlreadySentError extends ForbiddenError {
  constructor(
    message: string = 'An email request has already been sent to this supplier',
    data?: any,
  ) {
    super(message, data);
    this.code = 'EMAIL_REQUEST_ALREADY_SENT';
  }
}

export class SubscriptionPlanNotFoundError extends NotFoundError {
  constructor() {
    super(`Subscription plan not found or not configured`);
    this.code = 'SUBSCRIPTION_PLAN_NOT_FOUND';
  }
}

export class SubscriptionNotAllowedError extends ForbiddenError {
  constructor() {
    super('Subscription is allowed only for company users');
    this.code = 'SUBSCRIPTION_NOT_ALLOWED';
  }
}

export class IdRequiredError extends BadRequestError {
  constructor(message: string = 'Required id is missing', data?: any) {
    super(message, data);
    this.code = 'ID_REQUIRED';
  }
}
