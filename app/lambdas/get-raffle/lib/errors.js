export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MISSING_RAFFLE_ID: 'MISSING_RAFFLE_ID',

  RAFFLE_NOT_FOUND: 'RAFFLE_NOT_FOUND',

  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
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

export class ValidationError extends Error {
  constructor(
    message,
    statusCode = 400,
    errorCode = ErrorCodes.VALIDATION_FAILED
  ) {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}
