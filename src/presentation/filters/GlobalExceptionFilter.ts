import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DuplicationException } from 'src/application/exceptions/DuplicationException';
import { InvalidCredentialsException } from 'src/application/exceptions/InvalidCredentials';
import { NotFoundException } from 'src/application/exceptions/NotFoundException';
import { ValidationException } from 'src/application/exceptions/ValidationException';
import { InvalidArgumentException } from 'src/domain/exceptions/InvalidArgumentException';
import { InfrastructureException } from 'src/infrastructure/exceptions/InfrastructureException';
import { Request } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionHandler');
  private readonly securityLogger = new Logger('SecurityAudit');

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const {
      code: errorCode,
      status: statusCode,
      message,
      error,
    } = this.mapException(exception);

    if (statusCode == HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logServerError(exception, request, statusCode, errorCode);
    } else if (this.isSecurityEvent(statusCode, errorCode)) {
      this.logSecurityEvent(exception, request, statusCode, errorCode);
    }

    const responseBody = {
      statusCode,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(error && { details: error }),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
  }

  private mapException(exception: unknown): {
    code: string;
    status: HttpStatus;
    message: string;
    error?: Record<string, any>;
  } {
    if (
      exception instanceof HttpException &&
      !(exception instanceof InternalServerErrorException)
    ) {
      return this.handleHttpException(exception);
    }

    if (exception instanceof InvalidArgumentException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: exception.errorCode,
        message: exception.message,
      };
    }

    if (exception instanceof DuplicationException) {
      return {
        status: HttpStatus.CONFLICT,
        code: exception.errorCode,
        message: exception.message,
      };
    }

    if (exception instanceof InvalidCredentialsException) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        code: exception.errorCode,
        message: exception.message,
      };
    }

    if (exception instanceof NotFoundException) {
      return {
        status: HttpStatus.NOT_FOUND,
        code: exception.errorCode,
        message: exception.message,
      };
    }

    if (exception instanceof ValidationException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: exception.errorCode,
        message: exception.message,
        error: exception.errors,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    };
  }

  private handleHttpException(exception: HttpException): {
    code: string;
    status: HttpStatus;
    message: string;
    error?: Record<string, any>;
  } {
    const status = exception.getStatus();
    const response = exception.getResponse();

    const code =
      exception.constructor.name
        .replace(/Exception$/, '')
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toUpperCase() + '_ERROR';

    if (typeof response === 'object' && response !== null) {
      const { message } = response as { message: string };
      return {
        status,
        code,
        message: message || exception.message,
      };
    }

    return {
      status,
      code,
      message: typeof response === 'string' ? response : exception.message,
    };
  }

  private logServerError(
    exception: unknown,
    request: Request,
    status: number,
    code: string,
  ): void {
    const errorDetails = {
      event: 'SERVER_ERROR',
      statusCode: status,
      errorCode: code,
      path: request.url,
      method: request.method,
      requestId: request['requestId'] as string | undefined,
      token: request.headers.authorization,
      timestamp: new Date().toISOString(),
    };

    if (
      exception instanceof InfrastructureException &&
      exception.cause instanceof Error
    ) {
      this.logger.error(
        {
          ...errorDetails,
          message: exception.message,
          cause: exception.cause.message,
        },
        exception.cause.stack,
        exception.errorCode,
      );
      return;
    }

    if (exception instanceof Error) {
      this.logger.error(
        {
          ...errorDetails,
          message: exception.message,
          errorName: exception.name,
        },
        exception.stack,
      );
      return;
    }

    this.logger.error({
      ...errorDetails,
      message: 'Unknown error type',
      exception: String(exception),
    });
  }

  private logSecurityEvent(
    exception: unknown,
    request: Request,
    status: number,
    code: string,
  ): void {
    const message = exception instanceof Error ? exception.message : String(exception);

    this.securityLogger.warn({
      event: this.getSecurityEventType(status, code),
      statusCode: status,
      errorCode: code,
      message,
      path: request.url,
      method: request.method,
      requestId: request['requestId'] as string | undefined,
      token: request.headers.authorization,
      timestamp: new Date().toISOString(),
    });
  }

  private isSecurityEvent(status: number, code: string): boolean {
    if (status === 401 || status === 403) {
      return true;
    }

    if (code.includes('VALIDATION') || code.includes('INVALID_ARGUMENT')) {
      return true;
    }

    return false;
  }

  private getSecurityEventType(status: number, code: string): string {
    if (status === 401) return 'AUTHENTICATION_FAILED';
    if (status === 403) return 'AUTHORIZATION_FAILED';
    if (code.includes('VALIDATION')) return 'VALIDATION_ERROR';
    if (code.includes('INVALID_CREDENTIALS')) return 'INVALID_CREDENTIALS_ATTEMPT';
    return 'SECURITY_EVENT';
  }
}
