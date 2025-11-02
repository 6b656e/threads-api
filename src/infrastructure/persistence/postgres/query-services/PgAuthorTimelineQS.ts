import { Pool } from 'pg';
import { AuthorDTO } from 'src/application/ports/query-services/dtos/AuthorDTO';
import { AuthorTimelineDTO } from 'src/application/ports/query-services/dtos/AuthorTimelineDTO';
import { ReplyDTO } from 'src/application/ports/query-services/dtos/ReplyDTO';
import { ThreadDTO } from 'src/application/ports/query-services/dtos/ThreadDTO';
import { IAuthorTimelineQS } from 'src/application/ports/query-services/IAuthorTimelineQS';
import { DatabaseQueryException } from 'src/infrastructure/exceptions/DatabaseQueryException';

export class PgAuthorTimelineQS implements IAuthorTimelineQS {
  constructor(private readonly pool: Pool) {}

  async getAuthorTimeline(authorID: string): Promise<AuthorTimelineDTO> {
    const client = await this.pool.connect();
    try {
      const repliesQuery = `
        SELECT
          id,
          thread_id as "threadID",
          author_id as "authorID",
          content,
          created_at as "createdAt"
        FROM replies
        WHERE author_id = $1
        ORDER BY created_at DESC`;

      const threadsQuery = `
        SELECT
          t.id,
          t.author_id AS "authorID",
          t.content,
          (SELECT COUNT(*)
           FROM replies
           WHERE thread_id = t.id) AS "replyCount",
          t.created_at AS "createdAt"
        FROM threads t
        WHERE
          t.author_id = $1 OR
          EXISTS (
            SELECT 1
            FROM replies
            WHERE
                thread_id = t.id AND
                author_id = $1)
        ORDER BY t.created_at DESC`;

      const authorsQuery = `
        SELECT DISTINCT u.id, u.username
        FROM users u
        LEFT JOIN threads t ON
            t.author_id = u.id AND
            t.author_id = $1
        LEFT JOIN replies r ON
            r.author_id = u.id AND
            r.author_id = $1
        LEFT JOIN replies r2 ON r2.author_id = $1
        LEFT JOIN threads replied_to_threads ON
            replied_to_threads.id = r2.thread_id AND
            replied_to_threads.author_id = u.id
        WHERE
          t.id IS NOT NULL OR
          r.id IS NOT NULL OR
          replied_to_threads.id IS NOT NULL`;

      const [replies, threads, authors] = await Promise.all([
        client.query<ReplyDTO>(repliesQuery, [authorID]),
        client.query<ThreadDTO>(threadsQuery, [authorID]),
        client.query<AuthorDTO>(authorsQuery, [authorID]),
      ]);
      return {
        replies: replies.rows,
        threads: threads.rows,
        authors: authors.rows,
      };
    } catch (err) {
      throw new DatabaseQueryException(
        `Failed to get author timeline with id: ${authorID}`,
        err,
      );
    } finally {
      client.release();
    }
  }
}
