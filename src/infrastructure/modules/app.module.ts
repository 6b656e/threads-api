import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigSchema } from '../commons/AppConfig';
import { APP_FILTER } from '@nestjs/core';
import { CatchEverythingFilter } from 'src/presentation/filters/CatchEverythingFilter';
import { AuthModule } from './auth.module';

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
      useClass: CatchEverythingFilter,
    },
  ],
})
export class AppModule {}
