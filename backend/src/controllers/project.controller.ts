import { Response } from 'express';
import * as projectService from '../services/project.service';
import type { AuthRequest } from '../middleware/auth.middleware';

export async function listProjectsHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const projects = await projectService.getUserProjects(req.userId!);
    res.json(projects);
  } catch {
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
}

export async function addProjectHandler(req: AuthRequest, res: Response): Promise<void> {
  const raw = req.body?.repoPath;
  const repoPath = typeof raw === 'string' ? raw.trim() : '';

  if (!repoPath || !/^[\w.-]+\/[\w.-]+$/.test(repoPath)) {
    res.status(400).json({ message: 'A valid repoPath (e.g. facebook/react) is required' });
    return;
  }

  projectService.addProject(req.userId!, repoPath);
  res.status(202).json({ message: 'Repository is being fetched in the background' });
}

export async function refreshProjectHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const updated = await projectService.refreshProject(req.params.id, req.userId!);
    if (!updated) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Refresh failed';
    res.status(502).json({ message });
  }
}

export async function deleteProjectHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const deleted = await projectService.deleteProject(req.params.id, req.userId!);
    if (!deleted) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Failed to delete project' });
  }
}
