import { InvalidArgumentException } from '../exceptions/InvalidArgumentException';

interface ThreadProps {
  id: string;
  authorID: string;
  content: string;
  replyCount?: number;
  createdAt?: Date;
}

export class Thread {
  private static readonly MAX_CONTENT_CHAR = 280;

  public readonly id: string;
  public readonly authorID: string;
  public readonly content: string;
  public readonly replyCount: number;
  public readonly createdAt: Date;

  private constructor(props: ThreadProps) {
    this.id = props.id;
    this.authorID = props.authorID;
    this.content = props.content;
    this.replyCount = props.replyCount || 0;
    this.createdAt = props.createdAt || new Date();

    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new InvalidArgumentException('THREAD_INVALID_ID_ERROR', 'ID cannot be empty');
    }
    if (!this.authorID || this.authorID.trim().length === 0) {
      throw new InvalidArgumentException(
        'THREAD_INVALID_AUTHOR_ID_ERROR',
        'Author ID cannot be empty',
      );
    }
    if (!this.content || this.content.trim().length === 0) {
      throw new InvalidArgumentException(
        'THREAD_CONTENT_EMPTY_ERROR',
        'Thread content cannot be empty',
      );
    }
    if (this.replyCount < 0) {
      throw new InvalidArgumentException(
        'THREAD_INVALID_REPLY_COUNT_ERROR',
        'Reply count cannot be negative',
      );
    }
  }

  static create(props: Omit<ThreadProps, 'replyCount' | 'createdAt'>): Thread {
    if (props.content.length > this.MAX_CONTENT_CHAR) {
      throw new InvalidArgumentException(
        'THREAD_CONTENT_TOO_LONG_ERROR',
        `Thread content exceeds the limit of ${this.MAX_CONTENT_CHAR} characters`,
      );
    }
    return new Thread(props);
  }

  static reconstitute(props: Required<ThreadProps>): Thread {
    return new Thread(props);
  }
}
