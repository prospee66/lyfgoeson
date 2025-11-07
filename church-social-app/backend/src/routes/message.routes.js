import express from 'express';
import { getConversations, getConversation, getMessages, sendMessage, createConversation, markAsRead } from '../controllers/message.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/conversations/:id', protect, getConversation);
router.get('/conversations/:conversationId/messages', protect, getMessages);
router.post('/conversations', protect, createConversation);
router.post('/', protect, sendMessage);
router.put('/conversations/:conversationId/read', protect, markAsRead);

export default router;
