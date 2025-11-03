import { Response } from 'supertest';

export function expectErrorResponse(
  response: Response,
  expectedValues: {
    statusCode: number;
    errorCode: string;
    message: string;
    path: string;
    details?: any;
  },
) {
  expect(response.body).toHaveProperty('statusCode');
  expect(response.body).toHaveProperty('errorCode');
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('timestamp');
  expect(response.body).toHaveProperty('path');

  expect(response.body.statusCode).toEqual(expectedValues.statusCode);
  expect(response.body.errorCode).toEqual(expectedValues.errorCode);
  expect(response.body.message).toEqual(expectedValues.message);
  expect(response.body.path).toEqual(expectedValues.path);

  if (expectedValues.details) {
    expect(response.body.details).toStrictEqual(expectedValues.details);
  }
}

export function expectThreadStructure(
  thread: any,
  options?: {
    id?: string;
    authorID?: string;
    text?: string;
    replyCount?: number;
  },
) {
  expect(thread).toHaveProperty('id');
  expect(thread).toHaveProperty('author_id');
  expect(thread).toHaveProperty('text');
  expect(thread).toHaveProperty('created_at');
  expect(thread).toHaveProperty('public_metrics');
  expect(thread.public_metrics).toHaveProperty('reply_count');

  if (options?.id) {
    expect(thread.id).toEqual(options.id);
  }
  if (options?.authorID) {
    expect(thread.author_id).toEqual(options.authorID);
  }
  if (options?.text) {
    expect(thread.text).toEqual(options.text);
  }
  if (options?.replyCount !== undefined) {
    expect(thread.public_metrics.reply_count).toEqual(options.replyCount);
  }
}

export function expectReplyStructure(
  reply: any,
  options?: {
    id?: string;
    authorID?: string;
    text?: string;
    threadID?: string;
  },
) {
  expect(reply).toHaveProperty('id');
  expect(reply).toHaveProperty('author_id');
  expect(reply).toHaveProperty('text');
  expect(reply).toHaveProperty('created_at');
  expect(reply).toHaveProperty('referenced_threads');
  expect(Array.isArray(reply.referenced_threads)).toBe(true);
  expect(reply.referenced_threads).toHaveLength(1);
  expect(reply.referenced_threads[0]).toHaveProperty('type', 'replied_to');
  expect(reply.referenced_threads[0]).toHaveProperty('id');

  if (options?.id) {
    expect(reply.id).toEqual(options.id);
  }
  if (options?.authorID) {
    expect(reply.author_id).toEqual(options.authorID);
  }
  if (options?.text) {
    expect(reply.text).toEqual(options.text);
  }
  if (options?.threadID) {
    expect(reply.referenced_threads[0].id).toEqual(options.threadID);
  }
}

export function expectUserStructure(
  user: any,
  options?: {
    id?: string;
    username?: string;
  },
) {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('username');

  if (options?.id) {
    expect(user.id).toEqual(options.id);
  }
  if (options?.username) {
    expect(user.username).toEqual(options.username);
  }
}

export function expectSortedByCreatedAtDesc(items: any[]) {
  const timestamps = items.map((item) => new Date(item.created_at).getTime());
  for (let i = 0; i < timestamps.length - 1; i++) {
    expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
  }
}
