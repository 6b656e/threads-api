import { IUserRepository } from 'src/application/ports/repositories/IUserRepository';
import { User } from 'src/domain/entities/User';
import { Pool } from 'pg';

export class PgUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async save(user: User): Promise<void> {
    const client = await this.pool.connect();
    try {
      await this.pool.query({
        text: `
          INSERT INTO users (
            id,
            username,
            password,
            created_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO
          UPDATE SET
            username = $2,
            password = $3`,
        values: [user.id, user.username, user.hashedPassword, user.createdAt],
      });
    } finally {
      client.release();
    }
  }

  async findByID(id: string): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const { rowCount, rows } = await this.pool.query<User>({
        text: `
          SELECT
            id,
            username,
            password AS "hashedPassword",
            created_at AS "createdAt"
          FROM users
          WHERE id = $1`,
        values: [id],
      });
      if (!rowCount) return null;
      return User.reconstitute({
        id: rows[0].id,
        username: rows[0].username,
        hashedPassword: rows[0].hashedPassword,
        createdAt: rows[0].createdAt,
      });
    } finally {
      client.release();
    }
  }

  async findByCredentials(username: string): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const { rowCount, rows } = await this.pool.query<User>({
        text: `
          SELECT
            id,
            username,
            password AS "hashedPassword",
            created_at AS "createdAt"
          FROM users
          WHERE username = $1`,
        values: [username],
      });
      if (!rowCount) return null;
      return User.reconstitute({
        id: rows[0].id,
        username: rows[0].username,
        hashedPassword: rows[0].hashedPassword,
        createdAt: rows[0].createdAt,
      });
    } finally {
      client.release();
    }
  }
}
