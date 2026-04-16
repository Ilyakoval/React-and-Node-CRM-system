import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pgPool } from '../config/database';
import { env } from '../config/env';
import type { User } from '../models/user.model';

const SALT_ROUNDS = 10;

export async function register(email: string, password: string): Promise<User> {
  const normalized = email.toLowerCase().trim();
  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const { rows } = await pgPool.query<User>(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
      [normalized, hash],
    );
    return rows[0];
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') {
      throw new Error('Email already registered');
    }
    throw err;
  }
}

export async function login(email: string, password: string): Promise<string> {
  const normalized = email.toLowerCase().trim();

  const { rows } = await pgPool.query<User>(
    'SELECT * FROM users WHERE email = $1',
    [normalized],
  );
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid email or password');
  }

  return jwt.sign({ userId: user.id }, env.jwtSecret, { expiresIn: '7d' });
}
