import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../config/database', () => ({
  pgPool: { query: jest.fn() },
}));
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../config/env', () => ({ env: { jwtSecret: 'test-secret' } }));

import { pgPool } from '../../config/database';
import * as authService from '../../services/auth.service';

const mockQuery   = pgPool.query as jest.Mock;
const mockHash    = bcrypt.hash as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;
const mockSign    = jwt.sign as jest.Mock;

describe('authService.register', () => {
  it('normalises email, hashes password and returns the created user', async () => {
    mockHash.mockResolvedValue('hashed');
    mockQuery.mockResolvedValue({ rows: [{ id: 1, email: 'test@example.com', password: 'hashed' }] });

    const user = await authService.register('TEST@EXAMPLE.COM ', 'secret');

    expect(mockHash).toHaveBeenCalledWith('secret', 10);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT'),
      ['test@example.com', 'hashed'],
    );
    expect(user).toMatchObject({ id: 1, email: 'test@example.com' });
  });

  it('throws "Email already registered" on PostgreSQL unique-constraint violation (code 23505)', async () => {
    mockHash.mockResolvedValue('hashed');
    const pgError = Object.assign(new Error('dup key'), { code: '23505' });
    mockQuery.mockRejectedValue(pgError);

    await expect(authService.register('dup@example.com', 'secret')).rejects.toThrow('Email already registered');
  });

  it('re-throws other database errors', async () => {
    mockHash.mockResolvedValue('hashed');
    mockQuery.mockRejectedValue(new Error('connection refused'));

    await expect(authService.register('a@b.com', 'pw')).rejects.toThrow('connection refused');
  });
});

describe('authService.login', () => {
  it('returns a JWT when credentials are valid', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1, email: 'a@b.com', password: 'hashed' }] });
    mockCompare.mockResolvedValue(true);
    mockSign.mockReturnValue('jwt-token');

    const token = await authService.login('a@b.com', 'secret');

    expect(token).toBe('jwt-token');
    expect(mockSign).toHaveBeenCalledWith({ userId: 1 }, 'test-secret', expect.any(Object));
  });

  it('throws when user is not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await expect(authService.login('nobody@b.com', 'pw')).rejects.toThrow('Invalid email or password');
  });

  it('throws when password does not match', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 2, email: 'a@b.com', password: 'hashed' }] });
    mockCompare.mockResolvedValue(false);

    await expect(authService.login('a@b.com', 'wrong')).rejects.toThrow('Invalid email or password');
  });

  it('normalises email before querying', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await authService.login('  A@B.COM  ', 'pw').catch(() => {});

    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      ['a@b.com'],
    );
  });
});
