import { Project, IProject } from '../models/project.model';
import { fetchRepo } from './github.service';

export function addProject(userId: number, repoPath: string): void {
  fetchRepo(repoPath)
    .then(async (data) => {
      const exists = await Project.exists({ userId, owner: data.owner, name: data.name });
      if (exists) return;

      await Project.create({
        userId,
        owner: data.owner,
        name: data.name,
        url: data.url,
        stars: data.stars,
        forks: data.forks,
        openIssues: data.openIssues,
        createdAtUnix: data.createdAtUnix,
      });
    })
    .catch((err: Error) =>
      console.error(`[addProject] Failed to process "${repoPath}":`, err.message),
    );
}

export async function getUserProjects(userId: number): Promise<IProject[]> {
  return Project.find({ userId }).sort({ createdAt: -1 });
}

export async function refreshProject(
  projectId: string,
  userId: number,
): Promise<IProject | null> {
  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) return null;

  const data = await fetchRepo(`${project.owner}/${project.name}`);
  project.stars = data.stars;
  project.forks = data.forks;
  project.openIssues = data.openIssues;
  await project.save();

  return project;
}

export async function deleteProject(projectId: string, userId: number): Promise<boolean> {
  const result = await Project.deleteOne({ _id: projectId, userId });
  return result.deletedCount === 1;
}
