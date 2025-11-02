/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { join } from 'node:path';
import { AppModule } from 'src/infrastructure/modules/AppModule';

dotenv.config({
  path: join(__dirname, '..', '.env.test.local'),
});

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool;
  let authToken: string;

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
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM replies');
    await pool.query('DELETE FROM threads');
    await pool.query('DELETE FROM users');
  });

  describe('POST /auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toBe('User registered successfully');
        });
    });

    it('should return 400 for invalid username', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, username: 'ab' })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode');
          expect(res.body).toHaveProperty('errorCode');
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path');
          expect(res.body).toHaveProperty('details');
          expect(res.body.statusCode).toEqual(400);
          expect(res.body.errorCode).toEqual('INVALID_INPUT_REQUEST_ERROR');
          expect(res.body.message).toEqual('Input invalid');
          expect(res.body.path).toEqual('/auth/register');
          expect(res.body.details).toStrictEqual({
            username: ['Username must be at least 3 characters'],
          });
        });
    });

    it('should return 409 for duplicate username', async () => {
      await request(app.getHttpServer()).post('/auth/register').send(testUser);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode');
          expect(res.body).toHaveProperty('errorCode');
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path');
          expect(res.body.statusCode).toEqual(409);
          expect(res.body.errorCode).toEqual('USER_NAME_ALREADY_TAKEN_ERROR');
          expect(res.body.message).toEqual(
            `User with username "${testUser.username}" already exists`,
          );
          expect(res.body.path).toEqual('/auth/register');
        });
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send(testUser);
    });

    it('should login successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(testUser)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('access_token');
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode');
          expect(res.body).toHaveProperty('errorCode');
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path');
          expect(res.body.statusCode).toEqual(401);
          expect(res.body.errorCode).toEqual('USER_INVALID_CREDENTIALS_ERROR');
          expect(res.body.message).toEqual('Invalid username or password');
          expect(res.body.path).toEqual('/auth/login');
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
    });

    it('should return profile successfully', () => {
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
          expect(res.body.data.username).toEqual(testUser.username);
          expect(res.body.data.thread_count).toEqual(0);
          expect(res.body.data.reply_count).toEqual(0);
        });
    });

    it('should return 401 for invalid access token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid')
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode');
          expect(res.body).toHaveProperty('errorCode');
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path');
          expect(res.body.statusCode).toEqual(401);
          expect(res.body.errorCode).toEqual('UNAUTHORIZED_ERROR');
          expect(res.body.message).toEqual('Failed to verify authentication token');
          expect(res.body.path).toEqual('/auth/me');
        });
    });
  });
});
