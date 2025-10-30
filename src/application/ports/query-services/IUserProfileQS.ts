interface UserProfile {
  id: string;
  username: string;
  threadCount: number;
  replyCount: number;
  createdAt: Date;
}

export interface IUserProfileQS {
  getUserProfile(userID: string): Promise<UserProfile | null>;
}
