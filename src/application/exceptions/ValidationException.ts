import { ApplicationException } from './ApplicationException';

export class ValidationException extends ApplicationException {
  public readonly errors: Record<string, string[]>;

  constructor(errorCode: string, message: string, errors: Record<string, string[]>) {
    super(errorCode, message);
    this.name = this.constructor.name;
    this.errors = errors;
  }
}
