import { InvalidArgumentException } from '../exceptions/InvalidArgumentException';
import { Reply } from './Reply';

interface ThreadProps {
  id: string;
  authorID: string;
  content: string;
  replies?: Reply[];
  createdAt?: Date;
}

export class Thread {
  public readonly id: string;
  public readonly authorID: string;
  public readonly content: string;
  public readonly replies: Reply[];
  public readonly createdAt: Date;

  private constructor(props: ThreadProps) {
    this.id = props.id;
    this.authorID = props.authorID;
    this.content = props.content;
    this.replies = props.replies || [];
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
  }

  replyThread(reply: Reply) {
    this.replies.push(reply);
  }

  static create(props: Omit<ThreadProps, 'replies' | 'createdAt'>): Thread {
    return new Thread(props);
  }

  static reconstitute(props: Required<ThreadProps>): Thread {
    return new Thread(props);
  }
}
