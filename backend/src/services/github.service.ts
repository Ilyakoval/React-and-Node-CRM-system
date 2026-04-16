import axios, { AxiosError } from 'axios';
import { env } from '../config/env';

export interface GithubRepoData {
  owner: string;
  name: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  createdAtUnix: number;
}

export async function fetchRepo(repoPath: string): Promise<GithubRepoData> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (env.githubToken) {
    headers['Authorization'] = `Bearer ${env.githubToken}`;
  }

  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${repoPath}`,
      { headers, timeout: 10_000 },
    );

    return {
      owner: data.owner.login,
      name: data.name,
      url: data.html_url,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      createdAtUnix: Math.floor(new Date(data.created_at).getTime() / 1000),
    };
  } catch (err) {
    if (err instanceof AxiosError && err.response) {
      const status = err.response.status;
      if (status === 404) throw new Error(`Repository "${repoPath}" not found`);
      if (status === 403) throw new Error('GitHub API rate limit exceeded');
    }
    throw err;
  }
}
