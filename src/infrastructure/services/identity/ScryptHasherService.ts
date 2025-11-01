import { scrypt } from 'node:crypto';
import { IHasherService } from 'src/application/ports/services/identity/IHasherService';

export class ScryptHasherService implements IHasherService {
  constructor(private readonly salt: string) {}

  async hash(plain: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const keylen = 64;
      const N = Math.pow(2, 17); // CPU/memory cost parameter
      const r = 8; // Block size parameter (8 * 128 = 1024 bytes)
      const p = 1; // Parallelization parameter
      const maxmem = 128 * N * r + 1024 * 1024; // Required memory + 1 MB buffer

      scrypt(plain, this.salt, keylen, { N, r, p, maxmem }, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex'));
      });
    });
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    const result = await this.hash(plain);
    return result === hashed;
  }
}
