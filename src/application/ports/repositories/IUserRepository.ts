import { User } from 'src/domain/entities/User';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findByID(id: string): Promise<User | null>;
  userWithCredentials(username: string): Promise<User | null>;
}
