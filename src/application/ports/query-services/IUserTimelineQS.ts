interface UserTimeline {
  replies: Array<{
    id: string;
    threadID: string;
    authorID: string;
    content: string;
    createdAt: Date;
  }>;
  threads: Array<{
    id: string;
    authorID: string;
    content: string;
    createdAt: Date;
  }>;
  users: Array<{
    id: string;
    username: string;
  }>;
}

export interface IUserTimelineQS {
  getUserTimeline(userID: string): Promise<UserTimeline | null>;
}
