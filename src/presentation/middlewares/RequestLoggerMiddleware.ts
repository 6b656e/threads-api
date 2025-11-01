import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = nanoid();
    req['requestId'] = requestId;

    const startTime = Date.now();
    const { method, originalUrl } = req;

    this.logger.log({
      event: 'REQUEST_START',
      requestId,
      method,
      url: this.sanitizeUrl(originalUrl),
      userAgent: this.sanitizeUserAgent(req.headers['user-agent']),
      timestamp: new Date().toISOString(),
    });

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      const logData = {
        event: 'REQUEST_END',
        requestId,
        method,
        url: this.sanitizeUrl(originalUrl),
        statusCode,
        duration: `${duration}ms`,
        token: req.headers.authorization,
        timestamp: new Date().toISOString(),
      };

      if (statusCode >= 500) {
        this.logger.error(logData);
      } else if (statusCode >= 400) {
        this.logger.warn(logData);
      } else {
        this.logger.log(logData);
      }
    });

    next();
  }

  private sanitizeUrl(url: string): string {
    const urlObj = new URL(url, 'http://dummy.com');
    const path = urlObj.pathname;

    return path.length > 200 ? path.substring(0, 200) + '...' : path;
  }

  private sanitizeUserAgent(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    return userAgent.length > 100 ? userAgent.substring(0, 100) + '...' : userAgent;
  }
}
