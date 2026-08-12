import express from 'express';
import { getSummaryMetrics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', protect, getSummaryMetrics);

export default router;
