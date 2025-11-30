export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_TITLE: 'INVALID_TITLE',
  INVALID_DESCRIPTION: 'INVALID_DESCRIPTION',
  INVALID_PRIZE_VALUE: 'INVALID_PRIZE_VALUE',
  INVALID_PRIZE_IMAGES: 'INVALID_PRIZE_IMAGES',
  INVALID_DURATION: 'INVALID_DURATION',
  INVALID_END_DATE: 'INVALID_END_DATE',

  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',

  RAFFLE_ID_COLLISION: 'RAFFLE_ID_COLLISION',

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

export class ConflictError extends Error {
  constructor(
    message = 'Resource already exists',
    errorCode = ErrorCodes.RAFFLE_ID_COLLISION
  ) {
    super(message)
    this.name = 'ConflictError'
    this.statusCode = 409
    this.errorCode = errorCode
  }
}
