import express from 'express';
import { getSermons, getSermon, createSermon, updateSermon, deleteSermon, likeSermon, addComment } from '../controllers/sermon.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadMultiple } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', protect, getSermons);
router.get('/:id', protect, getSermon);
router.post('/', protect, authorize('pastor', 'sound_engineer'), uploadMultiple, createSermon);
router.put('/:id', protect, authorize('pastor', 'sound_engineer'), updateSermon);
router.delete('/:id', protect, authorize('pastor'), deleteSermon);
router.post('/:id/like', protect, likeSermon);
router.post('/:id/comment', protect, addComment);

export default router;
