import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

/** POST /api/auth/register */
export async function registerHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  try {
    const user = await authService.register(email, password);
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(409).json({ message });
  }
}

/** POST /api/auth/login */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  try {
    const token = await authService.login(email, password);
    res.json({ token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ message });
  }
}
