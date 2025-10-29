import { DomainException } from './DomainException';

export class InvalidArgumentException extends DomainException {
  constructor(errorCode: string, message: string) {
    super(errorCode, message);
    this.name = this.constructor.name;
  }
}
