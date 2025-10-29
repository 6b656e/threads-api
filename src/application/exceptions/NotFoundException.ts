import { ApplicationException } from './ApplicationException';

export class NotFoundException extends ApplicationException {
  constructor(errorCode: string, domain: string, prop: string, value: string) {
    super(errorCode, `${domain} with ${prop} "${value}" was not found`);
    this.name = this.constructor.name;
  }
}
