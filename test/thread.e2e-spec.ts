import request from 'supertest';
import {
  expectErrorResponse,
  expectThreadStructure,
  expectReplyStructure,
  expectUserStructure,
} from './helpers/assertions';
import { cleanDatabase, createTestApp, TestContext } from './helpers/setup';
import { createExpiredToken, createMalformedToken } from './helpers/token';
import { setupTestUser, TestUser, createThread, createReply } from './helpers/entities';

describe('ThreadController (e2e)', () => {
  let ctx: TestContext;
  let user1: TestUser;
  let user2: TestUser;

  const config = {
    JWT_ACCESS_TOKEN_SECRET: 'test-secret',
    PASSWORD_HASH_SALT: 'test-salt',
  };

  beforeAll(async () => {
    ctx = await createTestApp(config);
  });

  afterAll(async () => {
    await ctx.app.close();
    await ctx.pool.end();
    await ctx.postgresContainer.stop();
    await ctx.redisContainer.stop();
  });

  beforeEach(async () => {
    await cleanDatabase(ctx.pool);
    user1 = await setupTestUser(ctx.app, 'testuser1', 'Test123!');
    user2 = await setupTestUser(ctx.app, 'testuser2', 'Test123!');
  });

  describe('POST /threads', () => {
    it('should return 401 for missing Authorization header', () => {
      return request(ctx.app.getHttpServer())
        .post('/threads')
        .send({ content: 'Test thread' })
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED_ERROR',
            message: 'No access token provided',
            path: '/threads',
          });
        });
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = await createExpiredToken(
        user1.userID,
        config.JWT_ACCESS_TOKEN_SECRET,
      );

      return request(ctx.app.getHttpServer())
        .post('/threads')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ content: 'Test thread' })
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED_ERROR',
            message: 'Authentication token has expired',
            path: '/threads',
          });
        });
    });

    it('should return 401 for malformed Bearer token', () => {
      const malformedToken = createMalformedToken(user1.authToken);

      return request(ctx.app.getHttpServer())
        .post('/threads')
        .set('Authorization', `Bearer ${malformedToken}`)
        .send({ content: 'Test thread' })
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED_ERROR',
            message: 'Failed to verify authentication token',
            path: '/threads',
          });
        });
    });

    it('should return 400 for missing content field', () => {
      return request(ctx.app.getHttpServer())
        .post('/threads')
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({})
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'INVALID_INPUT_REQUEST_ERROR',
            message: 'Input invalid',
            path: '/threads',
            details: { content: ['Invalid input: expected string, received undefined'] },
          });
        });
    });

    it('should return 400 for empty content', () => {
      return request(ctx.app.getHttpServer())
        .post('/threads')
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: '' })
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'THREAD_CONTENT_EMPTY_ERROR',
            message: 'Thread content cannot be empty',
            path: '/threads',
          });
        });
    });

    it('should return 400 for non-string content', () => {
      return request(ctx.app.getHttpServer())
        .post('/threads')
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: 123 })
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'INVALID_INPUT_REQUEST_ERROR',
            message: 'Input invalid',
            path: '/threads',
            details: { content: ['Invalid input: expected string, received number'] },
          });
        });
    });

    it('should create a thread successfully', () => {
      return request(ctx.app.getHttpServer())
        .post('/threads')
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: 'This is my first thread!' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id');
          expect(typeof res.body.data.id).toBe('string');
          expect(res.body.data.id.length).toBeGreaterThan(0);
        });
    });

    it('should create multiple threads by same user', async () => {
      const thread1Response = await request(ctx.app.getHttpServer())
        .post('/threads')
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: 'First thread' });

      const thread2Response = await request(ctx.app.getHttpServer())
        .post('/threads')
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: 'Second thread' });

      expect(thread1Response.body.data.id).not.toEqual(thread2Response.body.data.id);
    });

    it('should create threads by different users', async () => {
      const thread1Response = await request(ctx.app.getHttpServer())
        .post('/threads')
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: 'Thread by user 1' });

      const thread2Response = await request(ctx.app.getHttpServer())
        .post('/threads')
        .set('Authorization', `Bearer ${user2.authToken}`)
        .send({ content: 'Thread by user 2' });

      expect(thread1Response.statusCode).toBe(201);
      expect(thread2Response.statusCode).toBe(201);
      expect(thread1Response.body.data.id).not.toEqual(thread2Response.body.data.id);
    });
  });

  describe('GET /threads/:thread_id', () => {
    it('should return 400 for invalid thread_id format', () => {
      return request(ctx.app.getHttpServer())
        .get('/threads/invalid-id')
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'INVALID_INPUT_REQUEST_ERROR',
            message: 'Input invalid',
            path: '/threads/invalid-id',
            details: { threadID: ['Invalid nanoid'] },
          });
        });
    });

    it('should return 404 for non-existent thread', () => {
      const fakeThreadID = 'V1StGXR8_Z5jdHi6B-myT';

      return request(ctx.app.getHttpServer())
        .get(`/threads/${fakeThreadID}`)
        .expect(404)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 404,
            errorCode: 'THREAD_NOT_FOUND_ERROR',
            message: `Thread with ID "${fakeThreadID}" was not found`,
            path: `/threads/${fakeThreadID}`,
          });
        });
    });

    it('should return thread details with author info', async () => {
      const threadID = await createThread(ctx.app, user1.authToken, 'Hello World!');

      return request(ctx.app.getHttpServer())
        .get(`/threads/${threadID}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('includes');

          expectThreadStructure(res.body.data, {
            id: threadID,
            authorID: user1.userID,
            text: 'Hello World!',
            replyCount: 0,
          });

          expect(res.body.includes).toHaveProperty('users');
          expect(Array.isArray(res.body.includes.users)).toBe(true);
          expect(res.body.includes.users).toHaveLength(1);
          expectUserStructure(res.body.includes.users[0], {
            id: user1.userID,
            username: user1.username,
          });
        });
    });

    it('should return thread with updated reply count after replies are added', async () => {
      const threadID = await createThread(ctx.app, user1.authToken, 'Original thread');
      await createReply(ctx.app, user2.authToken, threadID, 'First reply');
      await createReply(ctx.app, user2.authToken, threadID, 'Second reply');

      return request(ctx.app.getHttpServer())
        .get(`/threads/${threadID}`)
        .expect(201)
        .expect((res) => {
          expectThreadStructure(res.body.data, {
            id: threadID,
            authorID: user1.userID,
            replyCount: 2,
          });
        });
    });

    it('should not require authentication to view thread', async () => {
      const threadID = await createThread(ctx.app, user1.authToken, 'Public thread');

      return request(ctx.app.getHttpServer()).get(`/threads/${threadID}`).expect(201);
    });
  });

  describe('POST /threads/:thread_id/replies', () => {
    let threadID: string;

    beforeEach(async () => {
      threadID = await createThread(ctx.app, user1.authToken, 'Original thread');
    });

    it('should return 401 for missing Authorization header', () => {
      return request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .send({ content: 'Test reply' })
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED_ERROR',
            message: 'No access token provided',
            path: `/threads/${threadID}/replies`,
          });
        });
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = await createExpiredToken(
        user1.userID,
        config.JWT_ACCESS_TOKEN_SECRET,
      );

      return request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ content: 'Test reply' })
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED_ERROR',
            message: 'Authentication token has expired',
            path: `/threads/${threadID}/replies`,
          });
        });
    });

    it('should return 401 for malformed Bearer token', () => {
      const malformedToken = createMalformedToken(user1.authToken);

      return request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .set('Authorization', `Bearer ${malformedToken}`)
        .send({ content: 'Test reply' })
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED_ERROR',
            message: 'Failed to verify authentication token',
            path: `/threads/${threadID}/replies`,
          });
        });
    });

    it('should return 400 for invalid thread_id format', () => {
      return request(ctx.app.getHttpServer())
        .post('/threads/invalid-id/replies')
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: 'Test reply' })
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'INVALID_INPUT_REQUEST_ERROR',
            message: 'Input invalid',
            path: '/threads/invalid-id/replies',
            details: { threadID: ['Invalid nanoid'] },
          });
        });
    });

    it('should return 404 for non-existent thread', () => {
      const fakeThreadID = 'V1StGXR8_Z5jdHi6B-myT';

      return request(ctx.app.getHttpServer())
        .post(`/threads/${fakeThreadID}/replies`)
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: 'Test reply' })
        .expect(404)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 404,
            errorCode: 'THREAD_NOT_FOUND_ERROR',
            message: `Thread with ID "${fakeThreadID}" was not found`,
            path: `/threads/${fakeThreadID}/replies`,
          });
        });
    });

    it('should return 400 for missing content field', () => {
      return request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({})
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'INVALID_INPUT_REQUEST_ERROR',
            message: 'Input invalid',
            path: `/threads/${threadID}/replies`,
            details: { content: ['Invalid input: expected string, received undefined'] },
          });
        });
    });

    it('should return 400 for empty content', () => {
      return request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: '' })
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'REPLY_CONTENT_EMPTY_ERROR',
            message: 'Reply content cannot be empty',
            path: `/threads/${threadID}/replies`,
          });
        });
    });

    it('should return 400 for non-string content', () => {
      return request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: 123 })
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'INVALID_INPUT_REQUEST_ERROR',
            message: 'Input invalid',
            path: `/threads/${threadID}/replies`,
            details: { content: ['Invalid input: expected string, received number'] },
          });
        });
    });

    it('should create a reply successfully', () => {
      return request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .set('Authorization', `Bearer ${user2.authToken}`)
        .send({ content: 'This is a reply!' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id');
          expect(typeof res.body.data.id).toBe('string');
          expect(res.body.data.id.length).toBeGreaterThan(0);
        });
    });

    it('should allow thread author to reply to their own thread', () => {
      return request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: 'Self reply' })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
        });
    });

    it('should create multiple replies to same thread', async () => {
      const reply1Response = await request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .set('Authorization', `Bearer ${user2.authToken}`)
        .send({ content: 'First reply' });

      const reply2Response = await request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .set('Authorization', `Bearer ${user2.authToken}`)
        .send({ content: 'Second reply' });

      expect(reply1Response.statusCode).toBe(201);
      expect(reply2Response.statusCode).toBe(201);
      expect(reply1Response.body.data.id).not.toEqual(reply2Response.body.data.id);
    });

    it('should allow different users to reply to same thread', async () => {
      const reply1Response = await request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: 'Reply by user1' });

      const reply2Response = await request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .set('Authorization', `Bearer ${user2.authToken}`)
        .send({ content: 'Reply by user2' });

      expect(reply1Response.statusCode).toBe(201);
      expect(reply2Response.statusCode).toBe(201);
    });
  });

  describe('GET /threads/:thread_id/replies/:reply_id', () => {
    let threadID: string;
    let replyID: string;

    beforeEach(async () => {
      threadID = await createThread(ctx.app, user1.authToken, 'Original thread');
      replyID = await createReply(ctx.app, user2.authToken, threadID, 'Test reply');
    });

    it('should return 400 for invalid thread_id format', () => {
      return request(ctx.app.getHttpServer())
        .get(`/threads/invalid-id/replies/${replyID}`)
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'INVALID_INPUT_REQUEST_ERROR',
            message: 'Input invalid',
            path: `/threads/invalid-id/replies/${replyID}`,
            details: { threadID: ['Invalid nanoid'] },
          });
        });
    });

    it('should return 400 for invalid reply_id format', () => {
      return request(ctx.app.getHttpServer())
        .get(`/threads/${threadID}/replies/invalid-id`)
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'INVALID_INPUT_REQUEST_ERROR',
            message: 'Input invalid',
            path: `/threads/${threadID}/replies/invalid-id`,
            details: { replyID: ['Invalid nanoid'] },
          });
        });
    });

    it('should return 404 for non-existent thread', () => {
      const fakeThreadID = 'V1StGXR8_Z5jdHi6B-myT';

      return request(ctx.app.getHttpServer())
        .get(`/threads/${fakeThreadID}/replies/${replyID}`)
        .expect(404)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 404,
            errorCode: 'REPLY_NOT_FOUND_ERROR',
            message: `Reply with ID "${replyID}" was not found`,
            path: `/threads/${fakeThreadID}/replies/${replyID}`,
          });
        });
    });

    it('should return 404 for non-existent reply', () => {
      const fakeReplyID = 'V1StGXR8_Z5jdHi6B-myT';

      return request(ctx.app.getHttpServer())
        .get(`/threads/${threadID}/replies/${fakeReplyID}`)
        .expect(404)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 404,
            errorCode: 'REPLY_NOT_FOUND_ERROR',
            message: `Reply with ID "${fakeReplyID}" was not found`,
            path: `/threads/${threadID}/replies/${fakeReplyID}`,
          });
        });
    });

    it('should return 404 when reply exists but belongs to different thread', async () => {
      const otherThreadID = await createThread(ctx.app, user1.authToken, 'Other thread');

      return request(ctx.app.getHttpServer())
        .get(`/threads/${otherThreadID}/replies/${replyID}`)
        .expect(404)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 404,
            errorCode: 'REPLY_NOT_FOUND_ERROR',
            message: `Reply with ID "${replyID}" was not found`,
            path: `/threads/${otherThreadID}/replies/${replyID}`,
          });
        });
    });

    it('should return reply details with thread and users info', () => {
      return request(ctx.app.getHttpServer())
        .get(`/threads/${threadID}/replies/${replyID}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('includes');

          expectReplyStructure(res.body.data, {
            id: replyID,
            authorID: user2.userID,
            text: 'Test reply',
            threadID: threadID,
          });

          expect(res.body.includes).toHaveProperty('threads');
          expect(Array.isArray(res.body.includes.threads)).toBe(true);
          expect(res.body.includes.threads).toHaveLength(1);
          expectThreadStructure(res.body.includes.threads[0], {
            id: threadID,
            authorID: user1.userID,
          });

          expect(res.body.includes).toHaveProperty('users');
          expect(Array.isArray(res.body.includes.users)).toBe(true);
          expect(res.body.includes.users.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('should not require authentication to view reply', () => {
      return request(ctx.app.getHttpServer())
        .get(`/threads/${threadID}/replies/${replyID}`)
        .expect(201);
    });

    it('should return correct referenced thread information', async () => {
      const newThreadID = await createThread(
        ctx.app,
        user1.authToken,
        'Thread with specific content',
      );
      const newReplyID = await createReply(
        ctx.app,
        user2.authToken,
        newThreadID,
        'Reply content',
      );

      return request(ctx.app.getHttpServer())
        .get(`/threads/${newThreadID}/replies/${newReplyID}`)
        .expect(201)
        .expect((res) => {
          expectReplyStructure(res.body.data, {
            id: newReplyID,
            threadID: newThreadID,
          });
          expectThreadStructure(res.body.includes.threads[0], {
            id: newThreadID,
            text: 'Thread with specific content',
          });
        });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete thread lifecycle: create, reply, view', async () => {
      const createThreadRes = await request(ctx.app.getHttpServer())
        .post('/threads')
        .set('Authorization', `Bearer ${user1.authToken}`)
        .send({ content: 'My thread' });

      const threadID = createThreadRes.body.data.id;

      const viewThreadRes1 = await request(ctx.app.getHttpServer()).get(
        `/threads/${threadID}`,
      );

      expect(viewThreadRes1.body.data.public_metrics.reply_count).toBe(0);

      const createReplyRes = await request(ctx.app.getHttpServer())
        .post(`/threads/${threadID}/replies`)
        .set('Authorization', `Bearer ${user2.authToken}`)
        .send({ content: 'Great thread!' });

      const replyID = createReplyRes.body.data.id;

      const viewThreadRes2 = await request(ctx.app.getHttpServer()).get(
        `/threads/${threadID}`,
      );

      expect(viewThreadRes2.body.data.public_metrics.reply_count).toBe(1);

      const viewReplyRes = await request(ctx.app.getHttpServer()).get(
        `/threads/${threadID}/replies/${replyID}`,
      );

      expectReplyStructure(viewReplyRes.body.data, {
        id: replyID,
        threadID: threadID,
      });
    });

    it('should handle multiple replies increasing thread reply count', async () => {
      const threadID = await createThread(ctx.app, user1.authToken, 'Popular thread');

      await createReply(ctx.app, user2.authToken, threadID, 'Reply 1');
      await createReply(ctx.app, user2.authToken, threadID, 'Reply 2');
      await createReply(ctx.app, user1.authToken, threadID, 'Reply 3');

      const viewThreadRes = await request(ctx.app.getHttpServer()).get(
        `/threads/${threadID}`,
      );

      expect(viewThreadRes.body.data.public_metrics.reply_count).toBe(3);
    });

    it('should keep separate reply counts for different threads', async () => {
      const thread1ID = await createThread(ctx.app, user1.authToken, 'Thread 1');
      const thread2ID = await createThread(ctx.app, user1.authToken, 'Thread 2');

      await createReply(ctx.app, user2.authToken, thread1ID, 'Reply to thread 1');
      await createReply(ctx.app, user2.authToken, thread2ID, 'Reply to thread 2');
      await createReply(ctx.app, user2.authToken, thread2ID, 'Another reply to thread 2');

      const thread1Res = await request(ctx.app.getHttpServer()).get(
        `/threads/${thread1ID}`,
      );
      const thread2Res = await request(ctx.app.getHttpServer()).get(
        `/threads/${thread2ID}`,
      );

      expect(thread1Res.body.data.public_metrics.reply_count).toBe(1);
      expect(thread2Res.body.data.public_metrics.reply_count).toBe(2);
    });
  });
});
