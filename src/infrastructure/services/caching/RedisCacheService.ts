import { RedisClientType } from 'redis';
import { ICacheService } from 'src/application/ports/services/caching/ICacheService';
import { CacheConnectionException } from 'src/infrastructure/exceptions/CacheConnectionException';
import { CacheQueryException } from 'src/infrastructure/exceptions/CacheQueryException';

export class RedisCacheService implements ICacheService {
  private isConnected = false;

  constructor(private readonly redisClient: RedisClientType<any>) {
    this.redisClient.on('connect', () => {
      this.isConnected = true;
    });

    this.redisClient.on('error', () => {
      this.isConnected = false;
    });

    this.redisClient.on('end', () => {
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.redisClient.connect();
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      throw new CacheConnectionException(
        'CACHE_CONNECTION_ERROR',
        'Failed to connect to Redis',
        error,
      );
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.redisClient.close();
      this.isConnected = false;
    } catch (err) {
      throw new CacheConnectionException(
        'CACHE_DISCONNECTION_ERROR',
        'Failed to disconnect from Redis',
        err,
      );
    } finally {
      this.redisClient.destroy();
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.ensureConnected();

    try {
      await this.redisClient.setEx(key, ttlSeconds, value);
    } catch (err) {
      throw new CacheQueryException(
        'CACHE_SET_ERROR',
        `Failed to set cache key: ${key}`,
        err,
      );
    }
  }

  async get(key: string): Promise<string | null> {
    this.ensureConnected();

    try {
      const value = await this.redisClient.get(key);
      return value ?? null;
    } catch (err) {
      throw new CacheQueryException(
        'CACHE_GET_ERROR',
        `Failed to get cache key: ${key}`,
        err,
      );
    }
  }

  async delete(key: string): Promise<void> {
    this.ensureConnected();

    try {
      await this.redisClient.del(key);
    } catch (err) {
      throw new CacheQueryException(
        'CACHE_DELETE_ERROR',
        `Failed to delete cache key: ${key}`,
        err,
      );
    }
  }

  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new CacheConnectionException(
        'CACHE_NOT_CONNECTED_ERROR',
        'Redis client is not connected',
      );
    }
  }
}
