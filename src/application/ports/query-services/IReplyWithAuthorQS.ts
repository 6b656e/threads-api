interface ReplyWithAuthor {
  reply: {
    id: string;
    threadID: string;
    authorID: string;
    content: string;
    createdAt: Date;
  };
  threads: Array<{
    id: string;
    authorID: string;
    content: string;
    createdAt: Date;
  }>;
  authors: Array<{
    id: string;
    username: string;
  }>;
}

export interface IReplyWithAuthorQS {
  getReplyWithAuthor(threadID: string, replyID: string): Promise<ReplyWithAuthor | null>;
}
