import { Pool } from 'pg';
import { IThreadRepository } from 'src/application/ports/repositories/IThreadRepository';
import { Thread } from 'src/domain/entities/Thread';
import { DatabaseQueryException } from 'src/infrastructure/exceptions/DatabaseQueryException';

export class PgThreadRepository implements IThreadRepository {
  constructor(private readonly pool: Pool) {}

  async save(thread: Thread): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query({
        text: `
          INSERT INTO threads (
            id,
            author_id,
            content,
            created_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO
          UPDATE SET content = $3`,
        values: [thread.id, thread.authorID, thread.content, thread.createdAt],
      });
    } catch (err) {
      throw new DatabaseQueryException('Failed to save thread', err);
    } finally {
      client.release();
    }
  }

  async findByID(id: string): Promise<Thread | null> {
    const client = await this.pool.connect();
    try {
      const { rowCount, rows } = await client.query<Thread>({
        text: `
          SELECT
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
    } catch (err) {
      throw new DatabaseQueryException(`Failed to find thread with id: ${id}`, err);
    } finally {
      client.release();
    }
  }
}
