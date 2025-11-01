import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JWTExpired, JWTInvalid } from 'jose/errors';
import {
  TOKEN_MANAGER_SERVICE_TOKEN,
  type ITokenManagerService,
} from 'src/application/ports/services/identity/ITokenManagerService';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_MANAGER_SERVICE_TOKEN)
    private readonly tokenManagerService: ITokenManagerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    let payload: Record<string, unknown>;
    try {
      payload = await this.tokenManagerService.verify(token);
    } catch (error) {
      if (error instanceof JWTExpired) {
        throw new UnauthorizedException('Authentication token has expired');
      }

      if (error instanceof JWTInvalid) {
        throw new UnauthorizedException('Invalid authentication token');
      }

      throw new UnauthorizedException('Failed to verify authentication token');
    }

    const isBlacklisted = await this.tokenManagerService.isBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked. Please login again');
    }

    request['token'] = token;
    request['payload'] = payload;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
