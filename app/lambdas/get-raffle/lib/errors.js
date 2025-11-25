export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
    this.statusCode = 404
  }
}

export class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = statusCode
  }
}
