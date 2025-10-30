import { Pool } from 'pg';
import { AuthorProfileDTO } from 'src/application/ports/query-services/dtos/AuthorProfileDTO';
import { IAuthorProfileQS } from 'src/application/ports/query-services/IAuthorProfileQS';

export class PgAuthorProfileQS implements IAuthorProfileQS {
  constructor(private readonly pool: Pool) {}

  async getAuthorProfile(authorID: string): Promise<AuthorProfileDTO | null> {
    const client = await this.pool.connect();
    try {
      const { rowCount, rows } = await client.query<AuthorProfileDTO>({
        text: `
          SELECT
            u.id,
            u.username,
            COALESCE(COUNT(DISTINCT r.id), 0) AS "replyCount",
            COALESCE(COUNT(DISTINCT t.id), 0) AS "threadCount",
            u.created_at AS "createdAt"
          FROM users u
          LEFT JOIN threads t ON t.author_id = u.id
          LEFT JOIN replies r ON r.author_id = u.id
          WHERE u.id = $1
          GROUP BY u.id, u.username, u.created_at`,
        values: [authorID],
      });
      if (!rowCount) return null;
      return rows[0];
    } finally {
      client.release();
    }
  }
}
