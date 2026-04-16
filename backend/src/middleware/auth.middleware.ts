import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/** Extends Express `Request` with the authenticated user's PostgreSQL id. */
export interface AuthRequest extends Request {
  userId?: number;
}

/**
 * Express middleware that validates the `Authorization: Bearer <token>` header.
 * Attaches `req.userId` on success; responds 401 otherwise.
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret) as { userId: number };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
