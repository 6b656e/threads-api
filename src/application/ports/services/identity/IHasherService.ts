export interface IHasherService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

export const HASHER_SERVICE_TOKEN = Symbol('HasherService');
