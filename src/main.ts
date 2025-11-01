import { NestFactory } from '@nestjs/core';
import { AppModule } from './infrastructure/modules/AppModule';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './infrastructure/commons/AppConfig';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);
  const port = config.get('APP_PORT', { infer: true });
  await app.listen(port);
}
bootstrap();
