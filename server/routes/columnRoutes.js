import express from 'express';
import {
  getColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from '../controllers/columnController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { columnConfigSchema, columnConfigUpdateSchema } from '../validators/schemas.js';

const router = express.Router();

// Fetch columns configs
router.get('/:entityType', protect, getColumns);

// Reorder configurations (Must check bulk reorder before specific ID)
router.patch('/reorder', protect, authorize('SUPER_ADMIN', 'ADMIN'), reorderColumns);

// Modify column config
router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN'), validate(columnConfigSchema), createColumn);
router.patch('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), validate(columnConfigUpdateSchema), updateColumn);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteColumn);

export default router;
