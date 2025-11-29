import express from 'express';
import {
  getLiveStreams,
  getLiveStream,
  getCurrentLiveStream,
  createLiveStream,
  updateLiveStream,
  startLiveStream,
  endLiveStream,
  joinLiveStream,
  deleteLiveStream
} from '../controllers/liveStream.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (authenticated users)
router.use(protect);

router.get('/', getLiveStreams);
router.get('/current', getCurrentLiveStream);
router.get('/:id', getLiveStream);
router.post('/:id/join', joinLiveStream);

// Admin routes (Pastor and Sound Engineer only)
router.post('/', authorize('pastor', 'sound_engineer'), createLiveStream);
router.put('/:id', authorize('pastor', 'sound_engineer'), updateLiveStream);
router.post('/:id/start', authorize('pastor', 'sound_engineer'), startLiveStream);
router.post('/:id/end', authorize('pastor', 'sound_engineer'), endLiveStream);
router.delete('/:id', authorize('pastor', 'sound_engineer'), deleteLiveStream);

export default router;
