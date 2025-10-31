import { InfrastructureException } from './InfrastructureException';

export class CacheQueryException extends InfrastructureException {
  constructor(errorCode: string, message: string, cause?: unknown) {
    super(errorCode, message, cause);
    this.name = this.constructor.name;
  }
}
