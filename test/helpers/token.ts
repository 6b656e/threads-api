import { SignJWT } from 'jose';

export async function createExpiredToken(
  userID: string,
  secret: string,
): Promise<string> {
  return await new SignJWT()
    .setSubject(userID)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
    .sign(new TextEncoder().encode(secret));
}

export function createMalformedToken(validToken: string): string {
  const tokenParts = validToken.split('.');
  const malformedPayload = {
    sub: 'randomSubjectID',
    iat: Math.floor(Date.now() / 1000) - 3600,
    exp: Math.floor(Date.now() / 1000) - 1800,
  };
  const tokenPayload = Buffer.from(JSON.stringify(malformedPayload)).toString('base64');
  return `${tokenParts[0]}.${tokenPayload}.${tokenParts[1]}`;
}

export function extractUserIdFromToken(token: string): string {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) as {
    sub: string;
  };
  return payload.sub;
}

export function isValidJWTFormat(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3;
}
