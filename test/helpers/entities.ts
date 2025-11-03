import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export interface TestUser {
  username: string;
  password: string;
  authToken: string;
  userID: string;
}

export async function setupTestUser(
  app: INestApplication,
  username: string,
  password: string,
): Promise<TestUser> {
  await request(app.getHttpServer()).post('/auth/register').send({ username, password });

  const loginResp = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ username, password });

  const authToken = loginResp.body.data.access_token as string;

  const payload = JSON.parse(
    Buffer.from(authToken.split('.')[1], 'base64').toString(),
  ) as { sub: string };

  return {
    username,
    password,
    authToken,
    userID: payload.sub,
  };
}

export async function createThread(
  app: INestApplication,
  authToken: string,
  content: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/threads')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ content });

  if (!response.body?.data?.id) {
    throw new Error(
      `Failed to create thread. Response: ${JSON.stringify(response.body)}`,
    );
  }

  return response.body.data.id as string;
}

export async function createReply(
  app: INestApplication,
  authToken: string,
  threadID: string,
  content: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post(`/threads/${threadID}/replies`)
    .set('Authorization', `Bearer ${authToken}`)
    .send({ content });

  if (!response.body?.data?.id) {
    throw new Error(
      `Failed to create thread. Response: ${JSON.stringify(response.body)}`,
    );
  }

  return response.body.data.id as string;
}
