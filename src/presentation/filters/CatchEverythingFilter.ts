import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DuplicationException } from 'src/application/exceptions/DuplicationException';
import { InvalidCredentialsException } from 'src/application/exceptions/InvalidCredentials';
import { NotFoundException } from 'src/application/exceptions/NotFoundException';
import { ValidationException } from 'src/application/exceptions/ValidationException';
import { InvalidArgumentException } from 'src/domain/exceptions/InvalidArgumentException';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const { code, status, message, error } = this.mapException(exception);
    const responseBody = { code, message, error };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
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
      const status = exception.getStatus();
      const response = exception.getResponse();
      const code = exception.name
        .replace(/Exception$/, '')
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toUpperCase();

      if (response && typeof response === 'object') {
        const { message, statusCode } = response as {
          message: string;
          statusCode: number;
        };

        return {
          status: statusCode,
          code: `HTTP_${code}_ERROR`,
          message: message,
        };
      }

      return {
        status,
        code: `HTTP_${code}_ERROR`,
        message: exception.message,
      };
    }

    // Domain Exception
    if (exception instanceof InvalidArgumentException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: exception.errorCode,
        message: exception.message,
      };
    }

    // Application Exception
    if (exception instanceof DuplicationException) {
      return {
        status: HttpStatus.CONFLICT,
        code: exception.errorCode,
        message: exception.message,
      };
    } else if (exception instanceof InvalidCredentialsException) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        code: exception.errorCode,
        message: exception.message,
      };
    } else if (exception instanceof NotFoundException) {
      return {
        status: HttpStatus.NOT_FOUND,
        code: exception.errorCode,
        message: exception.message,
      };
    } else if (exception instanceof ValidationException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: exception.errorCode,
        message: exception.message,
        error: exception.errors,
      };
    }

    // Infra Exception
    // if (exception instanceof InfrastructureException) {
    // }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      code: 'HTTP_INTERNAL_SERVER_ERROR',
    };
  }
}
