import { AuthorDTO } from 'src/application/ports/query-services/dtos/AuthorDTO';
import { AuthorProfileDTO } from 'src/application/ports/query-services/dtos/AuthorProfileDTO';

export class UserMapper {
  static toResponse(author: AuthorDTO) {
    return {
      id: author.id,
      username: author.username,
    };
  }

  static toResponseList(authors: AuthorDTO[]) {
    return authors.map((author) => this.toResponse(author));
  }

  static toProfileResponse(profile: AuthorProfileDTO) {
    return {
      id: profile.id,
      username: profile.username,
      thread_count: profile.threadCount,
      reply_count: profile.replyCount,
      created_at: profile.createdAt.toISOString(),
    };
  }
}
