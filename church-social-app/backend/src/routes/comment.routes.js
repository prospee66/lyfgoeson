import express from 'express';
import { createComment, deleteComment, likeComment } from '../controllers/comment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);

export default router;
