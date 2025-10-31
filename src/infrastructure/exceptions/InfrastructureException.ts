export abstract class InfrastructureException extends Error {
  public readonly errorCode: string;
  public readonly cause?: unknown;

  constructor(errorCode: string, message: string, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.cause = cause;
  }
}
