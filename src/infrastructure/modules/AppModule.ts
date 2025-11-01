import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigSchema } from '../commons/AppConfig';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from 'src/presentation/filters/GlobalExceptionFilter';
import { AuthModule } from './AuthModule';
import { RequestLoggerMiddleware } from 'src/presentation/middlewares/RequestLoggerMiddleware';
import { UserModule } from './UserModule';
import { ThreadModule } from './ThreadModule';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate(config: Record<string, unknown>) {
        return AppConfigSchema.parse(config);
      },
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    ThreadModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('/');
  }
}
