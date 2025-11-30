export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RAFFLE_NOT_FOUND: 'RAFFLE_NOT_FOUND',
  RAFFLE_EXPIRED: 'RAFFLE_EXPIRED',
  RAFFLE_CLOSED: 'RAFFLE_CLOSED',
  RAFFLE_FULL: 'RAFFLE_FULL',
  DUPLICATE_PARTICIPATION: 'DUPLICATE_PARTICIPATION',
  QUEUE_ERROR: 'QUEUE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
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
    this.errorCode = errorCode
    this.details = details
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
  constructor(
    message,
    details = {},
    errorCode = ErrorCodes.DUPLICATE_PARTICIPATION
  ) {
    super(message)
    this.name = 'ConflictError'
    this.statusCode = 409
    this.errorCode = errorCode
    this.details = details
  }
}
