import express from 'express';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  duplicateCampaign,
  importCampaigns,
} from '../controllers/campaignController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { campaignCreateSchema, campaignUpdateSchema } from '../validators/schemas.js';

const router = express.Router();

// All authenticated users can read campaigns
router.get('/', protect, getCampaigns);
router.get('/:id', protect, getCampaignById);

// Editors, Admins, and SuperAdmins can create/update/duplicate campaigns
router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), validate(campaignCreateSchema), createCampaign);
router.patch('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), validate(campaignUpdateSchema), updateCampaign);
router.post('/:id/duplicate', protect, authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), duplicateCampaign);

// Only Admins and SuperAdmins can delete/import campaigns
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteCampaign);
router.post('/import', protect, authorize('SUPER_ADMIN', 'ADMIN'), importCampaigns);

export default router;
