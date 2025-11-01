export interface ICacheService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
}

export const CACHE_SERVICE_TOKEN = Symbol('CacheService');
