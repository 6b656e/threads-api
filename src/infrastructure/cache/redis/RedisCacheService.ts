import { createClient, RedisClientType } from 'redis';
import { ICacheService } from 'src/application/ports/services/ICacheService';
import { CacheConnectionException } from 'src/infrastructure/exceptions/CacheConnectionException';

export class RedisCacheService implements ICacheService {
  private readonly redisClient: RedisClientType<any>;
  private readonly isConnected = false;

  constructor(redisHost: string, redisPort: number) {
    this.redisClient = createClient({
      socket: { host: redisHost, port: redisPort },
    });
  }

  async connect(): Promise<void> {
    await this.redisClient.connect();
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isConnected) this.redisClient.destroy();
      resolve();
    });
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.ensureConnected();
    await this.redisClient.setEx(key, ttlSeconds, value);
  }

  async get(key: string): Promise<string | null> {
    this.ensureConnected();
    const value = await this.redisClient.get(key);
    return value ? value : null;
  }

  async delete(key: string): Promise<void> {
    this.ensureConnected();
    await this.redisClient.del(key);
  }

  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new CacheConnectionException(
        'REDIS_NOT_CONNECTED_ERROR',
        'Redis client is not connected',
      );
    }
  }
}
