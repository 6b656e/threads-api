export interface ITokenManagerService {
  generate(sub: string, payload?: Record<string, string | number>): Promise<string>;
  verify(token: string): Promise<Record<string, unknown>>;
  blacklist(token: string, userID: string, expiresAt: Date): Promise<void>;
  isBlacklisted(token: string): Promise<boolean>;
}

export const TOKEN_MANAGER_SERVICE_TOKEN = Symbol('TokenManagerService');
