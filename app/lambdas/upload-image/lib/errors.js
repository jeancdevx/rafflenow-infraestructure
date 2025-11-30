export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  INVALID_FIELD_TYPE: 'INVALID_FIELD_TYPE',
  INVALID_MIME_TYPE: 'INVALID_MIME_TYPE',
  INVALID_EXTENSION: 'INVALID_EXTENSION',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',

  S3_ERROR: 'S3_ERROR',
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
