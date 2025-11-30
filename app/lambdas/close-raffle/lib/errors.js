export const ErrorCodes = {
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MISSING_RAFFLE_ID: 'MISSING_RAFFLE_ID',
  RAFFLE_NOT_ACTIVE: 'RAFFLE_NOT_ACTIVE',

  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',

  // Business errors
  RAFFLE_NOT_FOUND: 'RAFFLE_NOT_FOUND',
  CONCURRENT_CLOSE: 'CONCURRENT_CLOSE',

  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  EVENT_PUBLISH_ERROR: 'EVENT_PUBLISH_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
}

export class ValidationError extends Error {
  constructor(
    message,
    statusCode = 400,
    details = {},
    errorCode = ErrorCodes.VALIDATION_FAILED
  ) {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = statusCode
    this.details = details
    this.errorCode = errorCode
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized', errorCode = ErrorCodes.UNAUTHORIZED) {
    super(message)
    this.name = 'UnauthorizedError'
    this.statusCode = 401
    this.errorCode = errorCode
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden', errorCode = ErrorCodes.FORBIDDEN) {
    super(message)
    this.name = 'ForbiddenError'
    this.statusCode = 403
    this.errorCode = errorCode
  }
}

export class NotFoundError extends Error {
  constructor(
    message = 'Resource not found',
    errorCode = ErrorCodes.RAFFLE_NOT_FOUND
  ) {
    super(message)
    this.name = 'NotFoundError'
    this.statusCode = 404
    this.errorCode = errorCode
  }
}

export class ConflictError extends Error {
  constructor(message, details = {}, errorCode = ErrorCodes.CONCURRENT_CLOSE) {
    super(message)
    this.name = 'ConflictError'
    this.statusCode = 409
    this.details = details
    this.errorCode = errorCode
  }
}
