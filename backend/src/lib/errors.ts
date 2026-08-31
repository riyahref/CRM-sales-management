export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  public statusCode: number;
  public errorCode: string;
  public fields?: FieldError[];

  constructor(statusCode: number, errorCode: string, message: string, fields?: FieldError[]) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.fields = fields;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends ApiError {
  constructor(fields: FieldError[], message: string = "One or more fields are invalid.") {
    super(400, "VALIDATION_ERROR", message, fields);
  }
}

export class InvalidCredentialsError extends ApiError {
  constructor(message: string = "Invalid email or password") {
    super(401, "INVALID_CREDENTIALS", message);
  }
}

export class AccountInactiveError extends ApiError {
  constructor(message: string = "This account is inactive. Contact your administrator.") {
    super(401, "ACCOUNT_INACTIVE", message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Your session expired — please log in again.") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "You don't have access to this record.") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "This record could not be found.") {
    super(404, "NOT_FOUND", message);
  }
}
