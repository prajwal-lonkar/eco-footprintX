import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from './common.errors';

export class UnsupportedImageTypeError extends BadRequestError {
  constructor(message: string = 'Unsupported image type', data?: any) {
    super(message, data);
    this.code = 'UNSUPPORTED_IMAGE_TYPE';
  }
}

export class ImageSizeExceededError extends BadRequestError {
  constructor(
    message: string = 'Image size exceeds allowed limit',
    data?: any,
  ) {
    super(message, data);
    this.code = 'IMAGE_SIZE_EXCEEDED';
  }
}

export class InvalidImageKeyError extends BadRequestError {
  constructor(message: string = 'Invalid or missing image key', data?: any) {
    super(message, data);
    this.code = 'INVALID_IMAGE_KEY';
  }
}

export class ProductAlreadyExistsError extends ConflictError {
  constructor(message: string = 'Product already exists', data?: any) {
    super(message, data);
    this.code = 'PRODUCT_ALREADY_EXISTS';
  }
}

export class InvalidProductDataError extends BadRequestError {
  constructor(message: string = 'Invalid product data', data?: any) {
    super(message, data);
    this.code = 'INVALID_PRODUCT_DATA';
  }
}

export class CompanyNotFoundError extends NotFoundError {
  constructor(message: string = 'Company not found', data?: any) {
    super(message, data);
    this.code = 'COMPANY_NOT_FOUND';
  }
}

export class CompanyIdRequiredError extends BadRequestError {
  constructor(message: string = 'companyId is required', data?: any) {
    super(message, data);
    this.code = 'COMPANY_ID_REQUIRED';
  }
}

export class ProductNotFoundError extends NotFoundError {
  constructor(message: string = 'Product not found', data?: any) {
    super(message, data);
    this.code = 'PRODUCT_NOT_FOUND';
  }
}

export class ComponentNotFoundError extends NotFoundError {
  constructor(message: string = 'Component not found', data?: any) {
    super(message, data);
    this.code = 'COMPONENT_NOT_FOUND';
  }
}

export class ImpactCategoryDataAlreadyExistsError extends ConflictError {
  constructor(
    message: string = 'Impact category data for component already exists',
    data?: any,
  ) {
    super(message, data);
    this.code = 'IMPACT_CATEGORY_DATA_ALREADY_EXISTS';
  }
}

export class IncompatibleUnitError extends BadRequestError {
  constructor(message: string = 'Incompatible unit error', data?: any) {
    super(message, data);
    this.code = 'INCOMPATIBLE_UNIT_ERROR';
  }
}

export class BenchmarkingDataDoesNotExistError extends NotFoundError {
  constructor(
    message: string = 'Benchmarking data does not exist error',
    data?: any,
  ) {
    super(message, data);
    this.code = 'BENCHMARKING_DATA_DOES_NOT_EXIST_ERROR ';
  }
}

export class ProductLimitExceededError extends BadRequestError {
  constructor(limit: number) {
    super(`Product limit of ${limit} reached for current subscription plan`);
    this.code = 'PRODUCT_LIMIT_EXCEEDED';
  }
}

export class SubscriptionRequiredError extends ForbiddenError {
  constructor() {
    super(
      'Subscription required to create additional products. Please upgrade your plan.',
    );
    this.code = 'SUBSCRIPTION_REQUIRED';
  }
}
