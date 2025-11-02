import { ThreadDTO } from 'src/application/ports/query-services/dtos/ThreadDTO';

export class ThreadMapper {
  static toResponse(thread: ThreadDTO) {
    return {
      id: thread.id,
      author_id: thread.authorID,
      text: thread.content,
      created_at: thread.createdAt.toISOString(),
      public_metrics: {
        reply_count: thread.replyCount,
      },
    };
  }

  static toResponseList(threads: ThreadDTO[]) {
    return threads.map((thread) => this.toResponse(thread));
  }
}
