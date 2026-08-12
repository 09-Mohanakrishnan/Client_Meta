import express from 'express';
import {
  getAds,
  getAdById,
  createAd,
  updateAd,
  deleteAd,
  duplicateAd,
  importAds,
} from '../controllers/adController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { adCreateSchema, adUpdateSchema } from '../validators/schemas.js';

const router = express.Router();

router.get('/', protect, getAds);
router.get('/:id', protect, getAdById);

router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), validate(adCreateSchema), createAd);
router.patch('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), validate(adUpdateSchema), updateAd);
router.post('/:id/duplicate', protect, authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), duplicateAd);

router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteAd);
router.post('/import', protect, authorize('SUPER_ADMIN', 'ADMIN'), importAds);

export default router;
