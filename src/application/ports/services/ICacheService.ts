export interface ICacheService {
  set(key: string, value: string, expiresIn: Date): Promise<void>;
  get(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
