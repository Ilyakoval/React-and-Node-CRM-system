import { AxiosError } from 'axios';

jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  get: jest.fn(),
}));
jest.mock('../../config/env', () => ({ env: { githubToken: '' } }));

import axios from 'axios';
import { fetchRepo } from '../../services/github.service';

const mockGet = axios.get as jest.Mock;

const githubResponse = {
  owner: { login: 'facebook' },
  name: 'react',
  html_url: 'https://github.com/facebook/react',
  stargazers_count: 215_000,
  forks_count: 45_000,
  open_issues_count: 1_200,
  created_at: '2013-05-24T16:15:54Z',
};

describe('fetchRepo', () => {
  it('maps GitHub API response to GithubRepoData', async () => {
    mockGet.mockResolvedValue({ data: githubResponse });

    const result = await fetchRepo('facebook/react');

    expect(result).toEqual({
      owner: 'facebook',
      name: 'react',
      url: 'https://github.com/facebook/react',
      stars: 215_000,
      forks: 45_000,
      openIssues: 1_200,
      createdAtUnix: Math.floor(new Date('2013-05-24T16:15:54Z').getTime() / 1000),
    });
  });

  it('calls the correct GitHub API URL', async () => {
    mockGet.mockResolvedValue({ data: githubResponse });

    await fetchRepo('facebook/react');

    expect(mockGet).toHaveBeenCalledWith(
      'https://api.github.com/repos/facebook/react',
      expect.any(Object),
    );
  });

  it('throws a descriptive error on 404', async () => {
    const err = new AxiosError('Not Found');
    err.response = { status: 404 } as any;
    mockGet.mockRejectedValue(err);

    await expect(fetchRepo('nobody/norepo')).rejects.toThrow('Repository "nobody/norepo" not found');
  });

  it('throws a rate-limit error on 403', async () => {
    const err = new AxiosError('Forbidden');
    err.response = { status: 403 } as any;
    mockGet.mockRejectedValue(err);

    await expect(fetchRepo('facebook/react')).rejects.toThrow('GitHub API rate limit exceeded');
  });

  it('re-throws non-axios errors as-is', async () => {
    mockGet.mockRejectedValue(new Error('network timeout'));

    await expect(fetchRepo('a/b')).rejects.toThrow('network timeout');
  });

  it('adds Authorization header when githubToken is set', async () => {
    jest.resetModules();
    jest.doMock('../../config/env', () => ({ env: { githubToken: 'ghp_abc123' } }));
    jest.doMock('axios', () => ({ ...jest.requireActual('axios'), get: jest.fn() }));

    const { fetchRepo: fetchRepoWithToken } = await import('../../services/github.service');
    const axiosWithToken = (await import('axios')).default;
    (axiosWithToken.get as jest.Mock).mockResolvedValue({ data: githubResponse });

    await fetchRepoWithToken('facebook/react');

    expect((axiosWithToken.get as jest.Mock).mock.calls[0][1].headers['Authorization']).toBe('Bearer ghp_abc123');
  });
});
