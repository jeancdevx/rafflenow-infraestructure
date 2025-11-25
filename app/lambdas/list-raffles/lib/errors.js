export class ValidationError extends Error {
  constructor(message, statusCode = 400, details = {}) {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = statusCode
    this.details = details
  }
}
