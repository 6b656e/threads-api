import { User } from 'src/domain/entities/User';

export interface IUserRepository {
  register(user: User): Promise<void>;
  findByID(id: string): Promise<User | null>;
  userWithCredentials(username: string): Promise<User | null>;
}
