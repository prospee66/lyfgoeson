import express from 'express';
import { getUsers, getUserById, updateUser, deleteUser, deleteProfilePicture } from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadProfilePhotos } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, uploadProfilePhotos, updateUser);
router.delete('/:id/profile-picture', protect, deleteProfilePicture);
router.delete('/:id', protect, authorize('pastor'), deleteUser);

export default router;
