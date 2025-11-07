import express from 'express';
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent, rsvpEvent } from '../controllers/event.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadMultiple } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', protect, getEvents);
router.get('/:id', protect, getEvent);
router.post('/', protect, authorize('admin', 'pastor', 'sound_engineer'), uploadMultiple, createEvent);
router.put('/:id', protect, authorize('admin', 'pastor', 'sound_engineer'), updateEvent);
router.delete('/:id', protect, authorize('admin', 'pastor'), deleteEvent);
router.post('/:id/rsvp', protect, rsvpEvent);

export default router;
