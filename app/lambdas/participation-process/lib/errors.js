export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  DUPLICATE_PARTICIPATION: 'DUPLICATE_PARTICIPATION',
  RAFFLE_NOT_FOUND: 'RAFFLE_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
}

export class ProcessingError extends Error {
  constructor(message, details = {}, errorCode = ErrorCodes.PROCESSING_ERROR) {
    super(message)
    this.name = 'ProcessingError'
    this.errorCode = errorCode
    this.details = details
  }
}

export class ValidationError extends Error {
  constructor(message, details = {}, errorCode = ErrorCodes.VALIDATION_FAILED) {
    super(message)
    this.name = 'ValidationError'
    this.errorCode = errorCode
    this.details = details
  }
}
