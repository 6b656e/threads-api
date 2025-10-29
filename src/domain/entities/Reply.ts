import { InvalidArgumentException } from '../exceptions/InvalidArgumentException';

interface ReplyProps {
  id: string;
  threadID: string;
  authorID: string;
  content: string;
  createdAt?: Date;
}

export class Reply {
  private static readonly MAX_CONTENT_CHAR = 280;

  public readonly id: string;
  public readonly threadID: string;
  public readonly authorID: string;
  public readonly content: string;
  public readonly createdAt: Date;

  private constructor(props: ReplyProps) {
    this.id = props.id;
    this.threadID = props.threadID;
    this.authorID = props.authorID;
    this.content = props.content;
    this.createdAt = props.createdAt || new Date();

    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new InvalidArgumentException('REPLY_INVALID_ID_ERROR', 'ID cannot be empty');
    }
    if (!this.threadID || this.threadID.trim().length === 0) {
      throw new InvalidArgumentException(
        'REPLY_INVALID_THREAD_ID_ERROR',
        'Thread ID cannot be empty',
      );
    }
    if (!this.authorID || this.authorID.trim().length === 0) {
      throw new InvalidArgumentException(
        'REPLY_INVALID_AUTHOR_ID_ERROR',
        'Author ID cannot be empty',
      );
    }
    if (!this.content || this.content.trim().length === 0) {
      throw new InvalidArgumentException(
        'REPLY_CONTENT_TOO_SHORT_ERROR',
        'Author ID cannot be empty',
      );
    }
  }

  static create(props: Omit<ReplyProps, 'createdAt'>): Reply {
    if (props.content.length > this.MAX_CONTENT_CHAR) {
      throw new InvalidArgumentException(
        'REPLY_CONTENT_TOO_LONG_ERROR',
        `Reply content exceeds the limit of ${this.MAX_CONTENT_CHAR} characters`,
      );
    }
    return new Reply(props);
  }

  static reconstitute(props: Required<ReplyProps>): Reply {
    return new Reply(props);
  }
}
