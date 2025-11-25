export class ValidationError extends Error {
  constructor(message, statusCode = 400, details = {}) {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = statusCode
    this.details = details
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
    this.statusCode = 401
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
    this.statusCode = 403
  }
}
