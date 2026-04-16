import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  return app;
}
