import { Pool } from 'pg';
import { AuthorDTO } from 'src/application/ports/query-services/dtos/AuthorDTO';
import { ReplyDTO } from 'src/application/ports/query-services/dtos/ReplyDTO';
import { ReplyWithReferencesDTO } from 'src/application/ports/query-services/dtos/ReplyWithReferencesDTO';
import { ThreadDTO } from 'src/application/ports/query-services/dtos/ThreadDTO';
import { IReplyWithReferencesQS } from 'src/application/ports/query-services/IReplyWithReferencesQS';
import { DatabaseQueryException } from 'src/infrastructure/exceptions/DatabaseQueryException';

export class PgReplyWithReferencesQS implements IReplyWithReferencesQS {
  constructor(private readonly pool: Pool) {}

  async getReplyWithReferences(
    threadID: string,
    replyID: string,
  ): Promise<ReplyWithReferencesDTO | null> {
    const client = await this.pool.connect();
    try {
      const replyQuery = `
        SELECT
          id,
          thread_id AS "threadID",
          author_id AS "authorID",
          content,
          created_at AS "createdAt"
        FROM replies
        WHERE
          id = $1 AND
          thread_id = $2`;

      const threadQuery = `
        SELECT
          t.id,
          t.author_id AS "authorID",
          t.content,
          t.created_at AS "createdAt",
          COUNT(r.id)::int AS "replyCount"
        FROM threads t
        LEFT JOIN replies r ON r.thread_id = t.id
        WHERE t.id = $1
        GROUP BY t.id, t.author_id, t.content, t.created_at`;

      const authorsQuery = `
        SELECT DISTINCT id, username
        FROM users
        WHERE id IN (
          SELECT author_id FROM replies WHERE id = $1
          UNION
          SELECT author_id FROM threads WHERE id = $2)`;

      const [replies, threads, authors] = await Promise.all([
        client.query<ReplyDTO>(replyQuery, [replyID, threadID]),
        client.query<ThreadDTO>(threadQuery, [threadID]),
        client.query<AuthorDTO>(authorsQuery, [replyID, threadID]),
      ]);
      if (!authors.rowCount) return null;
      return {
        reply: replies.rows[0],
        thread: threads.rows[0],
        authors: authors.rows,
      };
    } catch (err) {
      throw new DatabaseQueryException(
        `Failed to get reply with replyID: ${replyID}; threadID: ${threadID}`,
        err,
      );
    } finally {
      client.release();
    }
  }
}
