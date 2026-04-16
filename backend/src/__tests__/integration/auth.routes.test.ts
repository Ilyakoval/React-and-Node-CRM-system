// Mock DB connections so importing the app doesn't attempt real connections
jest.mock('../../config/database', () => ({
  pgPool: { query: jest.fn() },
  initPostgres: jest.fn(),
  connectMongo: jest.fn(),
}));
jest.mock('../../services/auth.service');

import request from 'supertest';
import { createApp } from '../../app';
import * as authService from '../../services/auth.service';

const mockRegister = authService.register as jest.Mock;
const mockLogin    = authService.login    as jest.Mock;

const app = createApp();

describe('POST /api/auth/register', () => {
  it('201 – returns user id and email on successful registration', async () => {
    mockRegister.mockResolvedValue({ id: 1, email: 'alice@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'secret' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, email: 'alice@example.com' });
  });

  it('400 – when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'secret' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: expect.any(String) });
  });

  it('400 – when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com' });

    expect(res.status).toBe(400);
  });

  it('409 – when email is already taken', async () => {
    mockRegister.mockRejectedValue(new Error('Email already registered'));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'secret' });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ message: 'Email already registered' });
  });
});

describe('POST /api/auth/login', () => {
  it('200 – returns token on valid credentials', async () => {
    mockLogin.mockResolvedValue('jwt-token');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'secret' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: 'jwt-token' });
  });

  it('400 – when body fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
  });

  it('401 – when credentials are invalid', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: 'Invalid email or password' });
  });
});

describe('GET /health', () => {
  it('returns { status: "ok" }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
