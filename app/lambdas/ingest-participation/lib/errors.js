export class ValidationError extends Error {
  constructor(message, statusCode = 400, details = {}) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
    this.statusCode = 403;
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

export class ConflictError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
    this.details = details;
  }
}
