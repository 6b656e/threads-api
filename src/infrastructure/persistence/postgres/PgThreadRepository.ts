import { Pool } from 'pg';
import { IThreadRepository } from 'src/application/ports/repositories/IThreadRepository';
import { Thread } from 'src/domain/entities/Thread';

export class PgThreadRepository implements IThreadRepository {
  constructor(private readonly pool: Pool) {}

  async save(thread: Thread): Promise<void> {
    await this.pool.query({
      text: `INSERT INTO threads (
            id,
            author_id,
            content,
            created_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO
          UPDATE SET content = $3`,
      values: [thread.id, thread.authorID, thread.content, thread.createdAt],
    });
  }

  async findByID(id: string): Promise<Thread | null> {
    const { rowCount, rows } = await this.pool.query<Thread>({
      text: `SELECT
            id,
            author_id AS "authorID",
            content,
            created_at AS "createdAt"
          FROM threads
          WHERE id = $1`,
      values: [id],
    });
    if (!rowCount) return null;
    return Thread.reconstitute({
      id: rows[0].id,
      authorID: rows[0].authorID,
      content: rows[0].content,
      createdAt: rows[0].createdAt,
    });
  }
}
