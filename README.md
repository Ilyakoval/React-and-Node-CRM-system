# GitHub CRM

A simple project-management system for public GitHub repositories.

## Tech stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Backend   | Node.js · Express · TypeScript          |
| Frontend  | React 18 · Vite · Ant Design            |
| Users DB  | PostgreSQL 16                           |
| Projects  | MongoDB 7                               |
| Auth      | JWT (7-day expiry) + bcrypt             |
| Infra     | Docker · Docker Compose                 |

## Features

- **Registration & login** via email + password
- **Project list** — owner, name, URL, stars, forks, open issues, creation Unix timestamp
- **Add repository** by path (e.g. `facebook/react`); GitHub data is fetched in the background
- **Update** — re-fetches live stats from GitHub API
- **Delete** — removes the project from the database

## Quick start

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd <repo-dir>

# 2. Copy environment variables
cp .env.example .env
# Edit .env if you want to set a custom JWT_SECRET or GITHUB_TOKEN

# 3. Start everything
docker compose up --build
```

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:3000  |
| Backend  | http://localhost:4000  |

## Project structure

```
.
├── backend/                  Node.js API
│   └── src/
│       ├── config/           DB connections & env
│       ├── controllers/      Request handlers
│       ├── middleware/        JWT auth middleware
│       ├── models/           User (PG) & Project (Mongo) types
│       ├── routes/           Express routers
│       └── services/         Business logic + GitHub API client
├── frontend/                 React SPA
│   └── src/
│       ├── api/              Axios client
│       ├── components/       Reusable UI (AddProjectModal)
│       ├── context/          Auth context (JWT storage)
│       └── pages/            Login · Register · Projects
├── docker-compose.yml
└── .env.example
```

## API endpoints

```
POST  /api/auth/register       { email, password }
POST  /api/auth/login          { email, password } → { token }

GET   /api/projects            List user's projects          [auth]
POST  /api/projects            { repoPath } → 202 Accepted   [auth]
PUT   /api/projects/:id        Re-fetch & update             [auth]
DELETE /api/projects/:id       Remove project                [auth]
GET   /health                  Liveness probe
```

## Environment variables

| Variable          | Default          | Description                              |
|-------------------|------------------|------------------------------------------|
| `POSTGRES_USER`   | `pguser`         |                                          |
| `POSTGRES_PASSWORD` | `pgpassword`   |                                          |
| `POSTGRES_DB`     | `github_crm`     |                                          |
| `MONGO_USER`      | `mongouser`      |                                          |
| `MONGO_PASSWORD`  | `mongopassword`  |                                          |
| `JWT_SECRET`      | `supersecretkey` | Change in production                     |
| `GITHUB_TOKEN`    | *(empty)*        | Optional; raises rate limit 60→5000 req/h |

## Local development (without Docker)

```bash
# Terminal 1 – backend
cd backend
npm install
npm run dev      # ts-node-dev with hot reload

# Terminal 2 – frontend
cd frontend
npm install
npm run dev      # Vite dev server with /api proxy to :4000
```

Requires local PostgreSQL on port 5432 and MongoDB on port 27017 with the credentials from `.env`.
