import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  listProjectsHandler,
  addProjectHandler,
  refreshProjectHandler,
  deleteProjectHandler,
} from '../controllers/project.controller';

const router = Router();

// All project routes require a valid JWT
router.use(authMiddleware);

router.get('/', listProjectsHandler);
router.post('/', addProjectHandler);
router.put('/:id', refreshProjectHandler);
router.delete('/:id', deleteProjectHandler);

export default router;
