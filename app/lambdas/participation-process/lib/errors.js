export class ProcessingError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'ProcessingError'
    this.details = details
  }
}

export class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}
