import { User } from 'src/domain/entities/User';

export interface ITokenManager {
  generate(payload: Pick<User, 'id'>): Promise<string>;
  verify(token: string): Promise<Pick<User, 'id'> & { expiresAt: Date }>;
  blacklist(token: string, userID: string, expiresAt: Date): Promise<void>;
  isBlacklisted(token: string): Promise<boolean>;
}
