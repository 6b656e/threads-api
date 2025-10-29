import { ApplicationException } from './ApplicationException';

export class InvalidCredentialsException extends ApplicationException {
  constructor(errorCode: string, credentials: string) {
    super(errorCode, `Invalid ${credentials}`);
    this.name = this.constructor.name;
  }
}
