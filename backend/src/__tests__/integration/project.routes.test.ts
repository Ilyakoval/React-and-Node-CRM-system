jest.mock('../../config/database', () => ({
  pgPool: { query: jest.fn() },
  initPostgres: jest.fn(),
  connectMongo: jest.fn(),
}));
jest.mock('../../services/project.service');
// Use real auth middleware so we also exercise JWT validation on protected routes
jest.mock('../../config/env', () => ({ env: { jwtSecret: 'test-secret', githubToken: '' } }));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app';
import * as projectService from '../../services/project.service';

const mockList    = projectService.getUserProjects as jest.Mock;
const mockAdd     = projectService.addProject      as jest.MockedFunction<typeof projectService.addProject>;
const mockRefresh = projectService.refreshProject  as jest.Mock;
const mockDelete  = projectService.deleteProject   as jest.Mock;

const app = createApp();

/** Creates a valid Bearer token signed with the test secret. */
function token(userId = 1): string {
  return `Bearer ${jwt.sign({ userId }, 'test-secret', { expiresIn: '1h' })}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Auth guard – every route should reject unauthenticated requests
// ──────────────────────────────────────────────────────────────────────────────
describe('Project routes – auth guard', () => {
  it.each([
    ['GET',    '/api/projects'],
    ['POST',   '/api/projects'],
    ['PUT',    '/api/projects/abc123'],
    ['DELETE', '/api/projects/abc123'],
  ])('%s %s → 401 without token', async (method, path) => {
    const res = await (request(app) as any)[method.toLowerCase()](path);
    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/projects
// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/projects', () => {
  it('200 – returns the user\'s project list', async () => {
    const docs = [{ name: 'react', owner: 'facebook' }];
    mockList.mockResolvedValue(docs);

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', token());

    expect(res.status).toBe(200);
    expect(res.body).toEqual(docs);
    expect(mockList).toHaveBeenCalledWith(1);
  });

  it('500 – when the service throws', async () => {
    mockList.mockRejectedValue(new Error('db error'));

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', token());

    expect(res.status).toBe(500);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/projects
// ──────────────────────────────────────────────────────────────────────────────
describe('POST /api/projects', () => {
  it('202 – enqueues background fetch for a valid repoPath', async () => {
    mockAdd.mockReturnValue(undefined);

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', token())
      .send({ repoPath: 'facebook/react' });

    expect(res.status).toBe(202);
    expect(mockAdd).toHaveBeenCalledWith(1, 'facebook/react');
  });

  it('400 – when repoPath is missing', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', token())
      .send({});

    expect(res.status).toBe(400);
  });

  it.each([
    ['spaces in name',     { repoPath: 'face book/react' }],
    ['no slash',           { repoPath: 'noslash' }],
    ['empty string',       { repoPath: '' }],
  ])('400 – invalid repoPath: %s', async (_label, body) => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', token())
      .send(body);

    expect(res.status).toBe(400);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/projects/:id  (refresh)
// ──────────────────────────────────────────────────────────────────────────────
describe('PUT /api/projects/:id', () => {
  it('200 – returns updated project', async () => {
    const updated = { _id: 'abc123', name: 'react', stars: 220_000 };
    mockRefresh.mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/projects/abc123')
      .set('Authorization', token());

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(mockRefresh).toHaveBeenCalledWith('abc123', 1);
  });

  it('404 – when project is not found', async () => {
    mockRefresh.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/projects/abc123')
      .set('Authorization', token());

    expect(res.status).toBe(404);
  });

  it('502 – when GitHub fetch fails', async () => {
    mockRefresh.mockRejectedValue(new Error('GitHub API rate limit exceeded'));

    const res = await request(app)
      .put('/api/projects/abc123')
      .set('Authorization', token());

    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({ message: 'GitHub API rate limit exceeded' });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/projects/:id
// ──────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/projects/:id', () => {
  it('204 – when project is deleted successfully', async () => {
    mockDelete.mockResolvedValue(true);

    const res = await request(app)
      .delete('/api/projects/abc123')
      .set('Authorization', token());

    expect(res.status).toBe(204);
    expect(mockDelete).toHaveBeenCalledWith('abc123', 1);
  });

  it('404 – when project does not belong to the user', async () => {
    mockDelete.mockResolvedValue(false);

    const res = await request(app)
      .delete('/api/projects/abc123')
      .set('Authorization', token());

    expect(res.status).toBe(404);
  });

  it('500 – when the service throws', async () => {
    mockDelete.mockRejectedValue(new Error('db error'));

    const res = await request(app)
      .delete('/api/projects/abc123')
      .set('Authorization', token());

    expect(res.status).toBe(500);
  });
});
