import express from 'express';
import { getPosts, getPost, createPost, updatePost, deletePost, likePost, sharePost } from '../controllers/post.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadPostMedia } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', protect, getPosts);
router.get('/:id', protect, getPost);
router.post('/', protect, uploadPostMedia, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/share', protect, sharePost);

export default router;
