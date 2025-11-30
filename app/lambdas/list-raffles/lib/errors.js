export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_LIMIT: 'INVALID_LIMIT',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  INVALID_CURSOR: 'INVALID_CURSOR',

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
    this.details = details
    this.errorCode = errorCode
  }
}
