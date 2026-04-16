import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('../../config/env', () => ({ env: { jwtSecret: 'test-secret' } }));

import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware';

const mockVerify = jwt.verify as jest.Mock;

function makeRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeReq(authHeader?: string): AuthRequest {
  return { headers: authHeader ? { authorization: authHeader } : {} } as AuthRequest;
}

describe('authMiddleware', () => {
  const next = jest.fn() as NextFunction;

  it('attaches userId and calls next() for a valid token', () => {
    mockVerify.mockReturnValue({ userId: 42 });
    const req = makeReq('Bearer valid-token');
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(req.userId).toBe(42);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is absent', () => {
    const req = makeReq();
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with "Bearer "', () => {
    const req = makeReq('Basic dXNlcjpwYXNz');
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when jwt.verify throws (invalid or expired token)', () => {
    mockVerify.mockImplementation(() => { throw new Error('invalid signature'); });
    const req = makeReq('Bearer bad-token');
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect((res.json as jest.Mock).mock.calls[0][0]).toMatchObject({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });
});
