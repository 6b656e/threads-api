import { ReplyDTO } from 'src/application/ports/query-services/dtos/ReplyDTO';

export class ReplyMapper {
  static toResponse(reply: ReplyDTO) {
    return {
      id: reply.id,
      author_id: reply.authorID,
      text: reply.content,
      created_at: reply.createdAt.toISOString(),
      referenced_threads: [
        {
          type: 'replied_to',
          id: reply.threadID,
        },
      ],
    };
  }

  static toResponseList(replies: ReplyDTO[]) {
    return replies.map((reply) => this.toResponse(reply));
  }
}
