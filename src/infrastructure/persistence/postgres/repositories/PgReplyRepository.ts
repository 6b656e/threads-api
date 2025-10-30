import { Pool } from 'pg';
import { IReplyRepository } from 'src/application/ports/repositories/IReplyRepository';
import { Reply } from 'src/domain/entities/Reply';

export class PgReplyRepository implements IReplyRepository {
  constructor(private readonly pool: Pool) {}

  async save(reply: Reply): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query({
        text: `
          INSERT INTO replies (
            id,
            thread_id,
            author_id,
            content,
            created_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO
          UPDATE SET content = $4`,
        values: [
          reply.id,
          reply.threadID,
          reply.authorID,
          reply.content,
          reply.createdAt,
        ],
      });
    } finally {
      client.release();
    }
  }

  async findByID(id: string): Promise<Reply | null> {
    const client = await this.pool.connect();
    try {
      const { rowCount, rows } = await this.pool.query<Reply>({
        text: `
          SELECT
            id,
            thread_id AS "threadID",
            author_id AS "authorID",
            content,
            created_at AS "createdAt"
          FROM replies
          WHERE id = $1`,
        values: [id],
      });
      if (!rowCount) return null;
      return Reply.reconstitute({
        id: rows[0].id,
        threadID: rows[0].threadID,
        authorID: rows[0].authorID,
        content: rows[0].content,
        createdAt: rows[0].createdAt,
      });
    } finally {
      client.release();
    }
  }
}
