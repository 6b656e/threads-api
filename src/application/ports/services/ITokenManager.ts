export interface ITokenManager {
  generate(payload: Record<string, string>): Promise<string>;
  verify(token: string): Promise<boolean>;
  blacklist(token: string, userID: string, expiresAt: Date): Promise<void>;
  isBlacklisted(token: string): Promise<boolean>;
}
