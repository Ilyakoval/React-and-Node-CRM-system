import express from 'express';
import cors from 'cors';
import { initPostgres, connectMongo, pgPool } from './config/database';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

async function bootstrap(): Promise<void> {
  await connectMongo();
  console.log('Connected to MongoDB');

  await initPostgres();
  console.log('Connected to PostgreSQL and migrations applied');

  const server = app.listen(env.port, () => {
    console.log(`Backend listening on port ${env.port}`);
  });

  async function shutdown(signal: string) {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await pgPool.end();
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});
