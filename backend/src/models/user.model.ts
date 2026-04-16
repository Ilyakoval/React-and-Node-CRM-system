/** Shape of a row in the PostgreSQL `users` table. */
export interface User {
  id: number;
  email: string;
  password: string;
  created_at: Date;
}
