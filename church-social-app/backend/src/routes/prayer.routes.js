import express from 'express';
import { getPrayers, getPrayer, createPrayer, updatePrayer, deletePrayer, prayForRequest, addResponse } from '../controllers/prayer.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getPrayers);
router.get('/:id', protect, getPrayer);
router.post('/', protect, createPrayer);
router.put('/:id', protect, updatePrayer);
router.delete('/:id', protect, deletePrayer);
router.post('/:id/pray', protect, prayForRequest);
router.post('/:id/respond', protect, addResponse);

export default router;
