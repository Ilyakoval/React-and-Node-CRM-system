import { Pool } from 'pg';
import mongoose from 'mongoose';
import { env } from './env';

export const pgPool = new Pool(env.postgres);

pgPool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export async function initPostgres(): Promise<void> {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      email      VARCHAR(255) UNIQUE NOT NULL,
      password   VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function connectMongo(): Promise<void> {
  await mongoose.connect(env.mongoUri);
}
