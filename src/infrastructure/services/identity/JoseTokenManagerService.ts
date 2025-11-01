import { jwtVerify, SignJWT } from 'jose';
import { ICacheService } from 'src/application/ports/services/caching/ICacheService';
import { IHasherService } from 'src/application/ports/services/identity/IHasherService';
import { ITokenManagerService } from 'src/application/ports/services/identity/ITokenManagerService';

export class JoseTokenManagerService implements ITokenManagerService {
  private readonly TOKEN_BLACKLIST_PREFIX = 'blacklist:token';

  constructor(
    private readonly jwtExpirationTime: string,
    private readonly jwtSecret: string,
    private readonly cacheService: ICacheService,
    private readonly hasherService: IHasherService,
  ) {}

  async generate(
    sub: string,
    payload?: Record<string, string | number>,
  ): Promise<string> {
    const alg = 'HS256';
    const accessToken = await new SignJWT(payload)
      .setSubject(sub)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime(this.jwtExpirationTime)
      .sign(new TextEncoder().encode(this.jwtSecret));
    return accessToken;
  }

  async verify(token: string): Promise<Record<string, unknown>> {
    const result = await jwtVerify(token, new TextEncoder().encode(this.jwtSecret));
    return result.payload;
  }

  async blacklist(token: string, userID: string, expiresAt: Date): Promise<void> {
    const hashedToken = await this.hasherService.hash(token);
    const key = this.TOKEN_BLACKLIST_PREFIX + hashedToken;

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const expiresAtSeconds = Math.floor(expiresAt.getTime() / 1000);
    const ttlSeconds = expiresAtSeconds - nowInSeconds;

    await this.cacheService.connect();
    await this.cacheService.set(key, userID, ttlSeconds);
    await this.cacheService.disconnect();
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const hashedToken = await this.hasherService.hash(token);
    const key = this.TOKEN_BLACKLIST_PREFIX + hashedToken;

    await this.cacheService.connect();
    const userID = await this.cacheService.get(key);
    await this.cacheService.disconnect();

    return userID ? true : false;
  }
}
