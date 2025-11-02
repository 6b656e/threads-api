import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../commons/AppConfig';
import { Pool } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { CACHE_SERVICE_TOKEN } from 'src/application/ports/services/caching/ICacheService';
import { RedisCacheService } from '../services/caching/RedisCacheService';
import { HASHER_SERVICE_TOKEN } from 'src/application/ports/services/identity/IHasherService';
import { ScryptHasherService } from '../services/identity/ScryptHasherService';
import { TOKEN_MANAGER_SERVICE_TOKEN } from 'src/application/ports/services/identity/ITokenManagerService';
import { JoseTokenManagerService } from '../services/identity/JoseTokenManagerService';
import { USER_REPOSITORY_TOKEN } from 'src/application/ports/repositories/IUserRepository';
import { PgUserRepository } from '../persistence/postgres/repositories/PgUserRepository';
import { THREAD_REPOSITORY_TOKEN } from 'src/application/ports/repositories/IThreadRepository';
import { PgThreadRepository } from '../persistence/postgres/repositories/PgThreadRepository';
import { REPLY_REPOSITORY_TOKEN } from 'src/application/ports/repositories/IReplyRepository';
import { PgReplyRepository } from '../persistence/postgres/repositories/PgReplyRepository';
import { AUTHOR_PROFILE_QUERY_TOKEN } from 'src/application/ports/query-services/IAuthorProfileQS';
import { PgAuthorProfileQS } from '../persistence/postgres/query-services/PgAuthorProfileQS';
import { AUTHOR_TIMELINE_QUERY_TOKEN } from 'src/application/ports/query-services/IAuthorTimelineQS';
import { PgAuthorTimelineQS } from '../persistence/postgres/query-services/PgAuthorTimelineQS';
import { REPLY_WITH_REF_QUERY_TOKEN } from 'src/application/ports/query-services/IReplyWithReferencesQS';
import { PgReplyWithReferencesQS } from '../persistence/postgres/query-services/PgReplyWithReferencesQS';
import { THREAD_WITH_REF_QUERY_TOKEN } from 'src/application/ports/query-services/IThreadWithReferencesQS';
import { PgThreadWithReferencesQS } from '../persistence/postgres/query-services/PgThreadWithReferencesQS';

export const POSTGRES_CONNECTION_TOKEN = Symbol('POSTGRES_CONNECTION');
export const REDIS_CONNECTION_TOKEN = Symbol('REDIS_CONNECTION');

@Module({
  providers: [
    {
      provide: POSTGRES_CONNECTION_TOKEN,
      useFactory(config: ConfigService<AppConfig, true>) {
        const connectionString = config.get('DATABASE_URL', { infer: true });
        return new Pool({ connectionString });
      },
      inject: [ConfigService],
    },
    {
      provide: REDIS_CONNECTION_TOKEN,
      useFactory(config: ConfigService<AppConfig, true>) {
        const url = config.get('REDIS_URL', { infer: true });
        return createClient({ url });
      },
      inject: [ConfigService],
    },
    {
      provide: CACHE_SERVICE_TOKEN,
      useFactory(redisClient: RedisClientType<any>) {
        return new RedisCacheService(redisClient);
      },
      inject: [REDIS_CONNECTION_TOKEN],
    },
    {
      provide: HASHER_SERVICE_TOKEN,
      useFactory(config: ConfigService<AppConfig, true>) {
        const salt = config.get('PASSWORD_HASH_SALT', { infer: true });
        return new ScryptHasherService(salt);
      },
      inject: [ConfigService],
    },
    {
      provide: TOKEN_MANAGER_SERVICE_TOKEN,
      useFactory(
        config: ConfigService<AppConfig, true>,
        cacheService: RedisCacheService,
        hasherService: ScryptHasherService,
      ) {
        const secret = config.get('JWT_ACCESS_TOKEN_SECRET', { infer: true });
        const expTime = config.get('JWT_ACCESS_TOKEN_EXP_TIME', { infer: true });
        return new JoseTokenManagerService(expTime, secret, cacheService, hasherService);
      },
      inject: [ConfigService, CACHE_SERVICE_TOKEN, HASHER_SERVICE_TOKEN],
    },
    {
      provide: USER_REPOSITORY_TOKEN,
      useFactory(pool: Pool) {
        return new PgUserRepository(pool);
      },
      inject: [POSTGRES_CONNECTION_TOKEN],
    },
    {
      provide: THREAD_REPOSITORY_TOKEN,
      useFactory(pool: Pool) {
        return new PgThreadRepository(pool);
      },
      inject: [POSTGRES_CONNECTION_TOKEN],
    },
    {
      provide: REPLY_REPOSITORY_TOKEN,
      useFactory(pool: Pool) {
        return new PgReplyRepository(pool);
      },
      inject: [POSTGRES_CONNECTION_TOKEN],
    },
    {
      provide: AUTHOR_PROFILE_QUERY_TOKEN,
      useFactory(pool: Pool) {
        return new PgAuthorProfileQS(pool);
      },
      inject: [POSTGRES_CONNECTION_TOKEN],
    },
    {
      provide: AUTHOR_TIMELINE_QUERY_TOKEN,
      useFactory(pool: Pool) {
        return new PgAuthorTimelineQS(pool);
      },
      inject: [POSTGRES_CONNECTION_TOKEN],
    },
    {
      provide: REPLY_WITH_REF_QUERY_TOKEN,
      useFactory(pool: Pool) {
        return new PgReplyWithReferencesQS(pool);
      },
      inject: [POSTGRES_CONNECTION_TOKEN],
    },
    {
      provide: THREAD_WITH_REF_QUERY_TOKEN,
      useFactory(pool: Pool) {
        return new PgThreadWithReferencesQS(pool);
      },
      inject: [POSTGRES_CONNECTION_TOKEN],
    },
  ],
  exports: [
    POSTGRES_CONNECTION_TOKEN,
    REDIS_CONNECTION_TOKEN,
    CACHE_SERVICE_TOKEN,
    HASHER_SERVICE_TOKEN,
    TOKEN_MANAGER_SERVICE_TOKEN,
    USER_REPOSITORY_TOKEN,
    THREAD_REPOSITORY_TOKEN,
    REPLY_REPOSITORY_TOKEN,
    AUTHOR_PROFILE_QUERY_TOKEN,
    AUTHOR_TIMELINE_QUERY_TOKEN,
    REPLY_WITH_REF_QUERY_TOKEN,
    THREAD_WITH_REF_QUERY_TOKEN,
  ],
})
export class SharedModule {}
