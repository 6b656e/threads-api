import { InfrastructureException } from './InfrastructureException';

export class CacheConnectionException extends InfrastructureException {
  constructor(errorCode: string, message: string) {
    super(errorCode, message);
    this.name = this.constructor.name;
  }
}
