import { INestApplication } from '@nestjs/common';
import { Pool } from 'pg';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import runner from 'node-pg-migrate';
import { join } from 'node:path';
import { createClient, RedisClientType } from 'redis';
import { RedisCacheService } from 'src/infrastructure/services/caching/RedisCacheService';
import { ScryptHasherService } from 'src/infrastructure/services/identity/ScryptHasherService';
import { JoseTokenManagerService } from 'src/infrastructure/services/identity/JoseTokenManagerService';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/infrastructure/modules/AppModule';
import { POSTGRES_CONNECTION_TOKEN } from 'src/infrastructure/modules/SharedModule';
import { CACHE_SERVICE_TOKEN } from 'src/application/ports/services/caching/ICacheService';
import { HASHER_SERVICE_TOKEN } from 'src/application/ports/services/identity/IHasherService';
import { TOKEN_MANAGER_SERVICE_TOKEN } from 'src/application/ports/services/identity/ITokenManagerService';
import { AppConfig } from 'src/infrastructure/commons/AppConfig';

export interface TestContext {
  app: INestApplication;
  pool: Pool;
  postgresContainer: StartedPostgreSqlContainer;
  redisContainer: StartedRedisContainer;
}

type TestAppConfig = Partial<
  Pick<AppConfig, 'JWT_ACCESS_TOKEN_SECRET' | 'PASSWORD_HASH_SALT'>
>;

export async function createTestApp(config?: TestAppConfig): Promise<TestContext> {
  const { container: postgresContainer, pool } = await createPostgresContainer();
  const { container: redisContainer, redisClient } = await createRedisContainer();

  const cacheService = new RedisCacheService(redisClient as RedisClientType<any>);

  const testingModule = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(POSTGRES_CONNECTION_TOKEN)
    .useValue(pool)
    .overrideProvider(CACHE_SERVICE_TOKEN)
    .useValue(cacheService);

  if (config?.JWT_ACCESS_TOKEN_SECRET && config?.PASSWORD_HASH_SALT) {
    const hasherService = new ScryptHasherService(config.PASSWORD_HASH_SALT);
    const tokenManagerService = new JoseTokenManagerService(
      '1m',
      config.JWT_ACCESS_TOKEN_SECRET,
      cacheService,
      hasherService,
    );

    testingModule
      .overrideProvider(HASHER_SERVICE_TOKEN)
      .useValue(hasherService)
      .overrideProvider(TOKEN_MANAGER_SERVICE_TOKEN)
      .useValue(tokenManagerService);
  }

  const moduleFixture = await testingModule.compile();
  const app = moduleFixture.createNestApplication();
  await app.init();

  return {
    app,
    pool,
    postgresContainer,
    redisContainer,
  };
}

export async function cleanDatabase(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM replies');
  await pool.query('DELETE FROM threads');
  await pool.query('DELETE FROM users');
}

export async function createPostgresContainer(): Promise<{
  container: StartedPostgreSqlContainer;
  pool: Pool;
}> {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_pass')
    .start();

  await runner({
    databaseUrl: container.getConnectionUri(),
    direction: 'up',
    migrationsTable: 'pgmigrations',
    dir: join(__dirname, '../../migrations'),
    checkOrder: false,
    verbose: false,
    log() {},
  });

  const pool = new Pool({ connectionString: container.getConnectionUri() });

  return { container, pool };
}

export async function createRedisContainer(): Promise<{
  container: StartedRedisContainer;
  redisClient: ReturnType<typeof createClient>;
}> {
  const container = await new RedisContainer('redis:8').start();
  const redisClient = createClient({ url: container.getConnectionUrl() });
  return { container, redisClient };
}
