jest.mock('../../models/project.model', () => ({
  Project: {
    exists: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  },
}));
jest.mock('../../services/github.service');

import { Project } from '../../models/project.model';
import { fetchRepo } from '../../services/github.service';
import * as projectService from '../../services/project.service';

const MockProject  = Project as jest.Mocked<typeof Project>;
const mockFetchRepo = fetchRepo as jest.Mock;

const repoData = {
  owner: 'facebook',
  name: 'react',
  url: 'https://github.com/facebook/react',
  stars: 200_000,
  forks: 40_000,
  openIssues: 1_000,
  createdAtUnix: 1_369_409_754,
};

// Helper: flush micro-task queue (for fire-and-forget addProject)
const flush = () => new Promise<void>((r) => setImmediate(r));

describe('getUserProjects', () => {
  it('returns projects sorted by createdAt descending', async () => {
    const docs = [{ name: 'react' }];
    const sortMock = jest.fn().mockResolvedValue(docs);
    MockProject.find = jest.fn().mockReturnValue({ sort: sortMock });

    const result = await projectService.getUserProjects(1);

    expect(MockProject.find).toHaveBeenCalledWith({ userId: 1 });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual(docs);
  });
});

describe('addProject', () => {
  it('fetches repo and creates a document when project is new', async () => {
    mockFetchRepo.mockResolvedValue(repoData);
    MockProject.exists = jest.fn().mockResolvedValue(null);
    MockProject.create = jest.fn().mockResolvedValue({});

    projectService.addProject(1, 'facebook/react');
    await flush();

    expect(mockFetchRepo).toHaveBeenCalledWith('facebook/react');
    expect(MockProject.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 1,
      owner: 'facebook',
      name: 'react',
    }));
  });

  it('does not create a duplicate document', async () => {
    mockFetchRepo.mockResolvedValue(repoData);
    MockProject.exists = jest.fn().mockResolvedValue(true);
    MockProject.create = jest.fn();

    projectService.addProject(1, 'facebook/react');
    await flush();

    expect(MockProject.create).not.toHaveBeenCalled();
  });

  it('logs an error but does not throw when fetchRepo fails', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchRepo.mockRejectedValue(new Error('rate limited'));

    projectService.addProject(1, 'bad/repo');
    await flush();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('refreshProject', () => {
  it('updates stats and returns the saved document', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const doc = { owner: 'fb', name: 'react', stars: 0, forks: 0, openIssues: 0, save: saveMock };
    MockProject.findOne = jest.fn().mockResolvedValue(doc);
    mockFetchRepo.mockResolvedValue(repoData);

    const result = await projectService.refreshProject('pid', 1);

    expect(MockProject.findOne).toHaveBeenCalledWith({ _id: 'pid', userId: 1 });
    expect(saveMock).toHaveBeenCalled();
    expect(result?.stars).toBe(200_000);
    expect(result?.forks).toBe(40_000);
    expect(result?.openIssues).toBe(1_000);
  });

  it('returns null when project does not belong to the user', async () => {
    MockProject.findOne = jest.fn().mockResolvedValue(null);

    const result = await projectService.refreshProject('pid', 99);

    expect(result).toBeNull();
  });
});

describe('deleteProject', () => {
  it('returns true when exactly one document is deleted', async () => {
    MockProject.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

    expect(await projectService.deleteProject('pid', 1)).toBe(true);
  });

  it('returns false when no document matched', async () => {
    MockProject.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 0 });

    expect(await projectService.deleteProject('pid', 1)).toBe(false);
  });
});
