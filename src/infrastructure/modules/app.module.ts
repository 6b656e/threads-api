import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigSchema } from '../commons/AppConfig';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from 'src/presentation/filters/GlobalExceptionFilter';
import { AuthModule } from './auth.module';
import { RequestLoggerMiddleware } from 'src/presentation/middlewares/RequestLoggerMiddleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate(config: Record<string, unknown>) {
        return AppConfigSchema.parse(config);
      },
      isGlobal: true,
    }),
    AuthModule,
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
