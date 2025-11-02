import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { scrypt } from 'node:crypto';
import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { User, Thread, Reply } from './types';

dotenv.config({
  path: join(__dirname, '..', '.env'),
});

const SCRYPT_CONFIG = {
  keylen: 64,
  N: Math.pow(2, 17),
  r: 8,
  p: 1,
  get maxmem() {
    return 128 * this.N * this.r + 1024 * 1024;
  },
};

const DATA_FOLDER = 'data';

const connectionString = process.env.DATABASE_URL;
const passwordHashSalt = process.env.PASSWORD_HASH_SALT;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

if (!passwordHashSalt) {
  console.error('PASSWORD_HASH_SALT environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString });

export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

function loadJsonData<T>(filename: string): T {
  const filepath = join(__dirname, DATA_FOLDER, filename);
  const rawData = readFileSync(filepath, 'utf-8');
  return JSON.parse(rawData) as T;
}

async function hashPassword(plain: string): Promise<string> {
  const passwordHashSalt = process.env.PASSWORD_HASH_SALT;
  if (!passwordHashSalt) throw Error('Please provide a connection string argument');

  return new Promise((resolve, reject) => {
    const { keylen, N, r, p, maxmem } = SCRYPT_CONFIG;
    scrypt(plain, passwordHashSalt, keylen, { N, r, p, maxmem }, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
}

async function seedEntitity<T extends User | Thread | Reply>(
  client: PoolClient,
  tableName: string,
  values: T[],
): Promise<void> {
  if (values.length === 0) throw new Error('Values are empty');

  const rowCount = values.length;
  const columnCount = Object.keys(values[0]).length;
  const placeholders = Array.from({ length: rowCount }, (_, rowIndex) => {
    const startIndex = rowIndex * columnCount + 1;
    const row = Array.from(
      { length: columnCount },
      (_, colIndex) => `$${startIndex + colIndex}`,
    ).join(', ');
    return `(${row})`;
  }).join(', ');
  const insertQuery = `INSERT INTO ${tableName} (${Object.keys(values[0]).join(', ')}) VALUES ${placeholders}`;
  const valuesQuery = values.map((v) => Object.values(v) as T[]).flat();

  await client.query(insertQuery, valuesQuery);

  console.info(`${tableName} inserted successfully`);
}

function validateData(
  users: User[],
  threads: Thread[],
  replies: Reply[],
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const userIds = new Set(users.map((u) => u.id));
  const threadIds = new Set(threads.map((t) => t.id));

  for (const thread of threads) {
    if (!userIds.has(thread.author_id)) {
      errors.push(`Thread ${thread.id} references non-existent user ${thread.author_id}`);
    }
  }

  for (const reply of replies) {
    if (!userIds.has(reply.author_id)) {
      errors.push(`Reply ${reply.id} references non-existent user ${reply.author_id}`);
    }
    if (!threadIds.has(reply.thread_id)) {
      errors.push(`Reply ${reply.id} references non-existent thread ${reply.thread_id}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

async function seed(): Promise<void> {
  let client: PoolClient | null = null;

  try {
    await testConnection();

    const usersData = loadJsonData<{ data: User[] }>('users.json');
    const threadsData = loadJsonData<{ data: Thread[] }>('threads.json');
    const repliesData = loadJsonData<{ data: Reply[] }>('replies.json');

    const validation = validateData(usersData.data, threadsData.data, repliesData.data);
    if (!validation.isValid) {
      validation.errors.forEach((error) => console.error(`  - ${error}`));
      throw new Error('Data validation failed');
    }

    client = await pool.connect();

    await client.query('BEGIN');

    try {
      const transformedUsers = await Promise.all(
        usersData.data.map(async (user) => {
          const password = await hashPassword(user.password);
          return { ...user, password };
        }),
      );

      await seedEntitity(client, 'users', transformedUsers);
      await seedEntitity(client, 'threads', threadsData.data);
      await seedEntitity(client, 'replies', repliesData.data);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

seed()
  .then(() => {
    console.info('\nDatabase seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database seeding failed:', error);
    process.exit(1);
  });
