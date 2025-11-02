import { z } from 'zod';

export const AppConfigSchema = z.object({
  APP_PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string(),

  REDIS_URL: z.string(),

  PASSWORD_HASH_SALT: z.string().min(20),

  JWT_ACCESS_TOKEN_SECRET: z.string().min(20),
  JWT_ACCESS_TOKEN_EXP_TIME: z.string().default('2h'),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
