import { InfrastructureException } from './InfrastructureException';

export class DatabaseQueryException extends InfrastructureException {
  constructor(message: string, cause?: unknown) {
    super('DATABASE_QUERY_ERROR', message, cause);
  }
}
