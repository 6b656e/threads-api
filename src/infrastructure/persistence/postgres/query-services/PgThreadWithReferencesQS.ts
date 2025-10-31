import { Pool } from 'pg';
import { AuthorDTO } from 'src/application/ports/query-services/dtos/AuthorDTO';
import { ThreadDTO } from 'src/application/ports/query-services/dtos/ThreadDTO';
import { ThreadWithReferencesDTO } from 'src/application/ports/query-services/dtos/ThreadWithReferencesDTO';
import { IThreadWithReferencesQS } from 'src/application/ports/query-services/IThreadWithReferencesQS';
import { DatabaseQueryException } from 'src/infrastructure/exceptions/DatabaseQueryException';

export class PgThreadWithReferencesQS implements IThreadWithReferencesQS {
  constructor(private readonly pool: Pool) {}

  async getThreadWithReferences(
    threadID: string,
  ): Promise<ThreadWithReferencesDTO | null> {
    const client = await this.pool.connect();
    try {
      const threadQuery = `
        SELECT
          t.id,
          t.author_id AS "authorID",
          t.content,
          t.created_at AS "createdAt",
          COUNT(r.id) AS "replyCount"
        FROM threads t
        LEFT JOIN replies r ON r.thread_id = t.id
        WHERE t.id = $1
        GROUP BY t.id, t.author_id, t.content, t.created_at`;

      const authorsQuery = `
        SELECT id, username
        FROM users
        WHERE id IN (
          SELECT author_id FROM threads WHERE id = $1)`;

      const [threads, authors] = await Promise.all([
        client.query<ThreadDTO>(threadQuery, [threadID]),
        client.query<AuthorDTO>(authorsQuery, [threadID]),
      ]);
      if (!authors.rowCount) return null;
      return {
        thread: threads.rows[0],
        author: authors.rows[0],
      };
    } catch (err) {
      throw new DatabaseQueryException(
        `Failed to get thread with threadID: ${threadID}`,
        err,
      );
    } finally {
      client.release();
    }
  }
}
