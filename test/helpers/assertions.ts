/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
