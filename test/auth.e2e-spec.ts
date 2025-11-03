import request from 'supertest';
import { expectErrorResponse } from './helpers/assertions';
import { cleanDatabase, createTestApp, TestContext } from './helpers/setup';
import { createExpiredToken, createMalformedToken } from './helpers/token';
import { setupTestUser } from './helpers/entities';

describe('AuthController (e2e)', () => {
  let ctx: TestContext;
  let authToken: string;
  let userID: string;

  const config = {
    JWT_ACCESS_TOKEN_SECRET: 'test-secret',
    PASSWORD_HASH_SALT: 'test-salt',
  };

  const testUser = {
    username: 'testuser',
    password: 'Test123!',
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
  });

  describe('POST /auth/register', () => {
    it('should return 400 for invalid username format', () => {
      return request(ctx.app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, username: 'a' })
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'INVALID_INPUT_REQUEST_ERROR',
            message: 'Input invalid',
            path: '/auth/register',
            details: { username: ['Username must be at least 3 characters'] },
          });
        });
    });

    it('should return 400 for missing required fields', () => {
      return request(ctx.app.getHttpServer())
        .post('/auth/register')
        .send({ username: testUser.username })
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'INVALID_INPUT_REQUEST_ERROR',
            message: 'Input invalid',
            path: '/auth/register',
            details: { password: ['Invalid input: expected string, received undefined'] },
          });
        });
    });

    it('should return 400 for password too short', () => {
      return request(ctx.app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, password: 'pw' })
        .expect(400)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 400,
            errorCode: 'INVALID_INPUT_REQUEST_ERROR',
            message: 'Input invalid',
            path: '/auth/register',
            details: { password: ['Password must be at least 8 characters'] },
          });
        });
    });

    it('should register a new user', () => {
      return request(ctx.app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toEqual('User registered successfully');
        });
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(ctx.app.getHttpServer()).post('/auth/register').send(testUser);
    });

    it('should return 401 for non-existent username', () => {
      return request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ ...testUser, username: 'non_exsitent' })
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'USER_INVALID_CREDENTIALS_ERROR',
            message: 'Invalid username or password',
            path: '/auth/login',
          });
        });
    });

    it('should return 401 for invalid password', () => {
      return request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ ...testUser, password: 'not_match_password' })
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'USER_INVALID_CREDENTIALS_ERROR',
            message: 'Invalid username or password',
            path: '/auth/login',
          });
        });
    });

    it('should handle case-insensitive username', () => {
      return request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ ...testUser, username: testUser.username.toUpperCase() })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('access_token');
          const token = res.body.data.access_token as string;
          const parts = token.split('.');
          expect(parts).toHaveLength(3);
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          expect(payload).toHaveProperty('sub');
          expect(payload).toHaveProperty('exp');
          expect(payload).toHaveProperty('iat');
        });
    });
  });

  describe('GET /auth/me', () => {
    beforeEach(async () => {
      const user = await setupTestUser(ctx.app, testUser.username, testUser.password);
      authToken = user.authToken;
      userID = user.userID;
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = await createExpiredToken(
        userID,
        config.JWT_ACCESS_TOKEN_SECRET,
      );

      return request(ctx.app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED_ERROR',
            message: 'Authentication token has expired',
            path: '/auth/me',
          });
        });
    });

    it('should return 401 for missing Authorization header', () => {
      return request(ctx.app.getHttpServer())
        .get('/auth/me')
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED_ERROR',
            message: 'No access token provided',
            path: '/auth/me',
          });
        });
    });

    it('should return 401 for malformed Bearer token', () => {
      const malformedToken = createMalformedToken(authToken);

      return request(ctx.app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${malformedToken}`)
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED_ERROR',
            message: 'Failed to verify authentication token',
            path: '/auth/me',
          });
        });
    });

    it('should return user profile', () => {
      return request(ctx.app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('username');
          expect(res.body.data).toHaveProperty('thread_count');
          expect(res.body.data).toHaveProperty('reply_count');
          expect(res.body.data).toHaveProperty('created_at');
          const { data } = res.body;
          expect(data.username).toEqual(testUser.username);
          expect(data.thread_count).toEqual(0);
          expect(data.reply_count).toEqual(0);
        });
    });
  });

  describe('POST /auth/logout', () => {
    beforeEach(async () => {
      const user = await setupTestUser(ctx.app, testUser.username, testUser.password);
      authToken = user.authToken;
      userID = user.userID;
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = await createExpiredToken(
        userID,
        config.JWT_ACCESS_TOKEN_SECRET,
      );

      return request(ctx.app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED_ERROR',
            message: 'Authentication token has expired',
            path: '/auth/logout',
          });
        });
    });

    it('should return 401 for missing Authorization header', () => {
      return request(ctx.app.getHttpServer())
        .post('/auth/logout')
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED_ERROR',
            message: 'No access token provided',
            path: '/auth/logout',
          });
        });
    });

    it('should return 401 for malformed Bearer token', () => {
      const malformedToken = createMalformedToken(authToken);

      return request(ctx.app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${malformedToken}`)
        .expect(401)
        .expect((res) => {
          expectErrorResponse(res, {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED_ERROR',
            message: 'Failed to verify authentication token',
            path: '/auth/logout',
          });
        });
    });

    it('should logged out user', () => {
      return request(ctx.app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toEqual('User successfully logged out');
        });
    });
  });
});
