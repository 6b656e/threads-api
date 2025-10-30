export abstract class InfrastructureException extends Error {
  public readonly errorCode: string;

  constructor(errorCode: string, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
  }
}
