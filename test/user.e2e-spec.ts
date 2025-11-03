import request from 'supertest';
import {
  expectErrorResponse,
  expectSortedByCreatedAtDesc,
  expectThreadStructure,
  expectReplyStructure,
  expectUserStructure,
} from './helpers/assertions';
import { cleanDatabase, createTestApp, TestContext } from './helpers/setup';
import { createReply, createThread, setupTestUser, TestUser } from './helpers/entities';

describe('UserController (e2e)', () => {
  let ctx: TestContext;
  let user1: TestUser;
  let user2: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp();
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

  describe('GET /users/:author_id/timeline', () => {
    it('should return 400 for invalid author_id format', () => {
      return request(ctx.app.getHttpServer())
        .get('/users/invalid-id/timeline')
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'INVALID_INPUT_REQUEST_ERROR',
            message: 'Input invalid',
            path: '/users/invalid-id/timeline',
            details: { authorID: ['Invalid nanoid'] },
          });
        });
    });

    it('should return empty timeline for user with no activity', () => {
      return request(ctx.app.getHttpServer())
        .get(`/users/${user1.userID}/timeline`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('includes');
          expect(res.body.data).toEqual([]);
          expect(res.body.includes.threads).toEqual([]);
          expect(res.body.includes.users).toEqual([]);
        });
    });

    it('should return user timeline with threads only', async () => {
      const threadId1 = await createThread(
        ctx.app,
        user1.authToken,
        'First thread by user1',
      );
      const threadId2 = await createThread(
        ctx.app,
        user1.authToken,
        'Second thread by user1',
      );

      return request(ctx.app.getHttpServer())
        .get(`/users/${user1.userID}/timeline`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data).toHaveLength(2);
          expectSortedByCreatedAtDesc(res.body.data);
          expectThreadStructure(res.body.data[1], {
            id: threadId1,
            authorID: user1.userID,
            replyCount: 0,
          });
          expectThreadStructure(res.body.data[0], {
            id: threadId2,
            authorID: user1.userID,
            replyCount: 0,
          });
          expect(res.body.includes.threads).toEqual([]);
          expect(res.body.includes.users).toHaveLength(1);
          expectUserStructure(res.body.includes.users[0], {
            id: user1.userID,
            username: user1.username,
          });
        });
    });

    it('should return user timeline with replies only', async () => {
      const threadID = await createThread(ctx.app, user2.authToken, 'Thread by user2');
      const replyID = await createReply(
        ctx.app,
        user1.authToken,
        threadID,
        'Reply from user1',
      );

      return request(ctx.app.getHttpServer())
        .get(`/users/${user1.userID}/timeline`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expectReplyStructure(res.body.data[0], {
            id: replyID,
            authorID: user1.userID,
            text: 'Reply from user1',
            threadID,
          });
          expect(Array.isArray(res.body.includes.threads)).toBe(true);
          expect(res.body.includes.threads).toHaveLength(1);
          expectThreadStructure(res.body.includes.threads[0], {
            id: threadID,
            authorID: user2.userID,
          });
          expect(res.body.includes.users.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('should return user timeline with mixed threads and replies sorted by date', async () => {
      await createThread(ctx.app, user1.authToken, 'Thread by user1');
      const threadId2 = await createThread(ctx.app, user2.authToken, 'Thread by user2');
      await createReply(ctx.app, user1.authToken, threadId2, 'Reply from user1');

      return request(ctx.app.getHttpServer())
        .get(`/users/${user1.userID}/timeline`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data).toHaveLength(2);
          expectSortedByCreatedAtDesc(res.body.data);
          (res.body.data as any[]).forEach((item: any) => {
            expect(item.author_id).toEqual(user1.userID);
          });
        });
    });

    it('should not include threads from other users in data array', async () => {
      await createThread(ctx.app, user2.authToken, 'Thread by user2');

      return request(ctx.app.getHttpServer())
        .get(`/users/${user1.userID}/timeline`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toEqual([]);
        });
    });
  });
});
