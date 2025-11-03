/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { join } from 'node:path';
import { AppModule } from 'src/infrastructure/modules/AppModule';
import { expectErrorResponse } from './helpers/assertions';
import { SignJWT } from 'jose';

dotenv.config({
  path: join(__dirname, '..', '.env.test.local'),
});

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool;
  let authToken: string;
  let userId: string;

  const testUser = {
    username: 'testuser',
    password: 'Test123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  });

  afterAll(async () => {
    await pool.end();
    await app.close();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM replies');
    await pool.query('DELETE FROM threads');
    await pool.query('DELETE FROM users');
  });

  describe('POST /auth/register', () => {
    it('should return 400 for invalid username format', () => {
      return request(app.getHttpServer())
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
      return request(app.getHttpServer())
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
      return request(app.getHttpServer())
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
      return request(app.getHttpServer())
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
      await request(app.getHttpServer()).post('/auth/register').send(testUser);
    });

    it('should return 401 for non-existent username', () => {
      return request(app.getHttpServer())
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
      return request(app.getHttpServer())
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
      return request(app.getHttpServer())
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
      await request(app.getHttpServer()).post('/auth/register').send(testUser);
      const loginResp = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUser);
      authToken = loginResp.body.data.access_token as string;
      const parts = authToken.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      userId = payload.sub;
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = await new SignJWT()
        .setSubject(userId)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
        .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
        .sign(new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN_SECRET));

      return request(app.getHttpServer())
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
      return request(app.getHttpServer())
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
      const tokenParts = authToken.split('.');
      const malformedPayload =
        'eyJzdWIiOiJLcDI4OTUyYWI1SWwyZ1ducUswVkQiLCJpYXQiOjI3NjIxMjYxMzksImV4cCI6Mjc2MjEyNzkzOX0';
      const malformedToken = `${tokenParts[0]}.${malformedPayload}.${tokenParts[1]}`;

      return request(app.getHttpServer())
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
      return request(app.getHttpServer())
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
      await request(app.getHttpServer()).post('/auth/register').send(testUser);
      const loginResp = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUser);
      authToken = loginResp.body.data.access_token as string;
      const payload = JSON.parse(
        Buffer.from(authToken.split('.')[1], 'base64').toString(),
      ) as { sub: string };
      userId = payload.sub;
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = await new SignJWT()
        .setSubject(userId)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
        .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
        .sign(new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN_SECRET));

      return request(app.getHttpServer())
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
      return request(app.getHttpServer())
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
      const tokenParts = authToken.split('.');
      const malformedPayload =
        'eyJzdWIiOiJLcDI4OTUyYWI1SWwyZ1ducUswVkQiLCJpYXQiOjI3NjIxMjYxMzksImV4cCI6Mjc2MjEyNzkzOX0';
      const malformedToken = `${tokenParts[0]}.${malformedPayload}.${tokenParts[1]}`;

      return request(app.getHttpServer())
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
      return request(app.getHttpServer())
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
