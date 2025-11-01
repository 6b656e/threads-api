import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { JWTPayload } from 'jose';

export type Payload = Required<Pick<JWTPayload, 'sub' | 'iat' | 'exp'>>;
type AuthorizedRequest = Request & { token: string; payload: Payload };

export const TokenPayload = createParamDecorator(
  (data: 'token' | 'payload', ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthorizedRequest>();
    const token = request.token;
    const payload = request.payload;
    if (!payload) {
      const handler = ctx.getHandler();
      const className = ctx.getClass().name;
      const methodName = handler.name;

      throw new InternalServerErrorException(
        `@TokenPayload() decorator used without authentication guard at ${className}.${methodName}`,
      );
    }
    return data === 'token' ? token : payload;
  },
);
