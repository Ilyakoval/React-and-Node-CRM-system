import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('crm_token')) {
      localStorage.removeItem('crm_token');
      window.location.replace('/login');
    }
    return Promise.reject(error);
  },
);

export interface Project {
  _id: string;
  owner: string;
  name: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  createdAtUnix: number;
}

export const authApi = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post<{ token: string }>('/auth/login', { email, password }),
};

export const projectsApi = {
  list: () => api.get<Project[]>('/projects'),
  add: (repoPath: string) => api.post('/projects', { repoPath }),
  refresh: (id: string) => api.put<Project>(`/projects/${id}`),
  delete: (id: string) => api.delete(`/projects/${id}`),
};
