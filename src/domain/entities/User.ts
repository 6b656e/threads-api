import { InvalidArgumentException } from '../exceptions/InvalidArgumentException';

interface UserProps {
  id: string;
  username: string;
  hashedPassword: string;
  createdAt?: Date;
}

export class User {
  public readonly id: string;
  public readonly username: string;
  public readonly hashedPassword: string;
  public readonly createdAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.username = props.username;
    this.hashedPassword = props.hashedPassword;
    this.createdAt = props.createdAt || new Date();

    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new InvalidArgumentException('USER_INVALID_ID_ERROR', 'ID cannot be empty');
    }
    if (!this.username || this.username.trim().length === 0) {
      throw new InvalidArgumentException(
        'USER_INVALID_USERNAME_ERROR',
        'Username cannot be empty',
      );
    }
    if (this.username.length < 3) {
      throw new InvalidArgumentException(
        'USER_INVALID_USERNAME_FORMAT_ERROR',
        'Username must be at least 3 characters long',
      );
    }
    if (!/^[a-z0-9][a-z0-9_]+$/.test(this.username)) {
      throw new InvalidArgumentException(
        'USER_INVALID_USERNAME_FORMAT_ERROR',
        'Username must start with a letter or number and can only contain letters, numbers, and underscores',
      );
    }
    if (!this.hashedPassword) {
      throw new InvalidArgumentException(
        'USER_INVALID_PASSWORD_ERROR',
        'Password is required',
      );
    }
  }

  static create(props: Omit<UserProps, 'createdAt'>): User {
    return new User(props);
  }

  static reconstitute(props: Required<UserProps>): User {
    return new User(props);
  }
}
