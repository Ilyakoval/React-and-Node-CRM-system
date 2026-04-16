/** Central place for all environment variables with safe defaults for local dev. */
export const env = {
  port: parseInt(process.env.PORT ?? '4000', 10),

  postgres: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    user: process.env.POSTGRES_USER ?? 'pguser',
    password: process.env.POSTGRES_PASSWORD ?? 'pgpassword',
    database: process.env.POSTGRES_DB ?? 'github_crm',
  },

  mongoUri:
    process.env.MONGO_URI ??
    'mongodb://mongouser:mongopassword@localhost:27017/github_crm?authSource=admin',

  jwtSecret: process.env.JWT_SECRET ?? 'supersecretkey',

  /** Personal GitHub token – optional but raises rate limit to 5 000 req/h */
  githubToken: process.env.GITHUB_TOKEN ?? '',
};
