import { IUserRepository } from 'src/application/ports/repositories/IUserRepository';
import { User } from 'src/domain/entities/User';
import { Pool } from 'pg';

export class PgUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async save(user: User): Promise<void> {
    await this.pool.query({
      text: `INSERT INTO users (
            id,
            username,
            password,
            created_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO
          UPDATE SET
            name = $2,
            username = $3,
            password = $4`,
      values: [user.id, user.username, user.hashedPassword, user.createdAt],
    });
  }

  async findByID(id: string): Promise<User | null> {
    const { rowCount, rows } = await this.pool.query<User>({
      text: `SELECT
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
  }

  async findByCredentials(username: string): Promise<User | null> {
    const { rowCount, rows } = await this.pool.query<User>({
      text: `SELECT
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
  }
}
