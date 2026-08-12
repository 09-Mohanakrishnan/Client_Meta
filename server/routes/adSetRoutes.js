import express from 'express';
import {
  getAdSets,
  getAdSetById,
  createAdSet,
  updateAdSet,
  deleteAdSet,
  duplicateAdSet,
  importAdSets,
} from '../controllers/adSetController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { adSetCreateSchema, adSetUpdateSchema } from '../validators/schemas.js';

const router = express.Router();

router.get('/', protect, getAdSets);
router.get('/:id', protect, getAdSetById);

router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), validate(adSetCreateSchema), createAdSet);
router.patch('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), validate(adSetUpdateSchema), updateAdSet);
router.post('/:id/duplicate', protect, authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), duplicateAdSet);

router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteAdSet);
router.post('/import', protect, authorize('SUPER_ADMIN', 'ADMIN'), importAdSets);

export default router;
