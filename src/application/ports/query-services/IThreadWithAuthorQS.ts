interface ThreadWithAuthor {
  thread: {
    id: string;
    authorID: string;
    content: string;
    replyCount: number;
    createdAt: Date;
  };
  authors: Array<{
    id: string;
    username: string;
  }>;
}

export interface IThreadWithAuthorQS {
  getThreadWithAuthor(threadID: string): Promise<ThreadWithAuthor | null>;
}
