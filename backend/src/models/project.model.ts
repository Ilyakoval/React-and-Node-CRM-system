import { Schema, model, Document } from 'mongoose';

/** MongoDB document for a tracked GitHub repository. */
export interface IProject extends Document {
  /** ID of the owning user (from PostgreSQL). */
  userId: number;
  owner: string;
  name: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  /** UTC Unix timestamp of the GitHub repository creation date. */
  createdAtUnix: number;
}

const projectSchema = new Schema<IProject>(
  {
    userId: { type: Number, required: true, index: true },
    owner: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    openIssues: { type: Number, default: 0 },
    createdAtUnix: { type: Number, required: true },
  },
  { timestamps: true },
);

export const Project = model<IProject>('Project', projectSchema);
