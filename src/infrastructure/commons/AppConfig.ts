import { z } from 'zod';

export const AppConfigSchema = z.object({
  APP_PORT: z.coerce.number().default(3000),

  POSTGRES_HOST: z.string().default('127.0.0.1'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DATABASE: z.string().default('postgres'),

  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),

  PASSWORD_HASH_SALT: z.string().min(20),

  JWT_ACCESS_TOKEN_SECRET: z.string().min(20),
  JWT_ACCESS_TOKEN_EXP_TIME: z.string().default('2h'),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
