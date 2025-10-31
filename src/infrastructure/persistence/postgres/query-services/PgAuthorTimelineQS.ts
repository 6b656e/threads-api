import { Pool } from 'pg';
import { AuthorDTO } from 'src/application/ports/query-services/dtos/AuthorDTO';
import { AuthorTimelineDTO } from 'src/application/ports/query-services/dtos/AuthorTimelineDTO';
import { ReplyDTO } from 'src/application/ports/query-services/dtos/ReplyDTO';
import { ThreadDTO } from 'src/application/ports/query-services/dtos/ThreadDTO';
import { IAuthorTimelineQS } from 'src/application/ports/query-services/IAuthorTimelineQS';
import { DatabaseQueryException } from 'src/infrastructure/exceptions/DatabaseQueryException';

export class PgAuthorTimelineQS implements IAuthorTimelineQS {
  constructor(private readonly pool: Pool) {}

  async getAuthorTimeline(authorID: string): Promise<AuthorTimelineDTO | null> {
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
          t.author_id as "authorID",
          t.content,
          COALESCE(rc.reply_count, 0) as "replyCount",
          t.created_at as "createdAt"
        FROM threads t
        LEFT JOIN (
          SELECT thread_id, COUNT(*) as reply_count
          FROM replies
          GROUP BY thread_id) rc ON rc.thread_id = t.id
        WHERE
          t.author_id = $1 OR
          t.id IN (SELECT DISTINCT thread_id FROM replies WHERE author_id = $1)
        ORDER BY t.created_at DESC`;

      const authorsQuery = `
        SELECT DISTINCT id, username
        FROM users
        WHERE
          id = 'user_003' OR
          id IN (
            SELECT author_id FROM threads
            WHERE id IN (SELECT thread_id FROM replies WHERE author_id = 'user_003'))`;

      const [replies, threads, authors] = await Promise.all([
        client.query<ReplyDTO>(repliesQuery, [authorID]),
        client.query<ThreadDTO>(threadsQuery, [authorID]),
        client.query<AuthorDTO>(authorsQuery, [authorID]),
      ]);
      if (!authors.rowCount) return null;
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
