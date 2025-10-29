import { ApplicationException } from './ApplicationException';

export class DuplicationException extends ApplicationException {
  constructor(errorCode: string, domain: string, prop: string, value: string) {
    super(errorCode, `${domain} with ${prop} "${value}" already exists`);
    this.name = this.constructor.name;
  }
}
