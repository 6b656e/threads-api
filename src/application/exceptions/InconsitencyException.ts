import { ApplicationException } from './ApplicationException';

export class InconsistencyException extends ApplicationException {
  constructor(errorCode: string, message: string) {
    super(errorCode, message);
    this.name = this.constructor.name;
  }
}
