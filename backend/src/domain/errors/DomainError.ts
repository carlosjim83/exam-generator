/**
 * Base class for all domain errors.
 * Domain errors represent expected business rule violations
 * and are safe to expose to the client.
 */
export class DomainError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 409);
  }
}
