interface UserProfile {
  id: string;
  username: string;
  threadCount: number;
  replyCount: number;
  createdAt: Date;
}

export interface IUserProfileQueryService {
  getUserProfile(userID: string): Promise<UserProfile | null>;
}
