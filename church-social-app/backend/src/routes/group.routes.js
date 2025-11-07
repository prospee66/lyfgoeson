import express from 'express';
import { getGroups, getGroup, createGroup, updateGroup, deleteGroup, joinGroup, leaveGroup } from '../controllers/group.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getGroups);
router.get('/:id', protect, getGroup);
router.post('/', protect, authorize('admin', 'pastor'), createGroup);
router.put('/:id', protect, authorize('admin', 'pastor'), updateGroup);
router.delete('/:id', protect, authorize('admin', 'pastor'), deleteGroup);
router.post('/:id/join', protect, joinGroup);
router.post('/:id/leave', protect, leaveGroup);

export default router;
