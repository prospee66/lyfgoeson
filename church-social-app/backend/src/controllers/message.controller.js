import { Message, Conversation } from '../models/Message.model.js';
import Notification from '../models/Notification.model.js';

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'firstName lastName profilePicture lastSeen')
      .populate('lastMessage')
      .populate('admin', 'firstName lastName')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'firstName lastName profilePicture lastSeen');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      conversation: req.params.conversationId,
      deletedFor: { $ne: req.user.id }
    })
      .populate('sender', 'firstName lastName profilePicture')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content, messageType, media } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      content,
      messageType,
      media
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName profilePicture');

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.updatedAt = Date.now();
    await conversation.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(conversationId).emit('new-message', populatedMessage);

    // Send notifications to other participants
    try {
      const recipients = conversation.participants.filter(p => p.toString() !== req.user.id);
      const notifications = recipients.map(recipientId => ({
        recipient: recipientId,
        sender: req.user.id,
        type: 'message',
        title: 'New Message',
        message: `${req.user.firstName} ${req.user.lastName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        link: `/messages`
      }));

      await Notification.insertMany(notifications);

      // Emit real-time notifications
      if (io) {
        recipients.forEach(recipientId => {
          io.to(recipientId.toString()).emit('new-notification', {
            type: 'message',
            title: 'New Message',
            message: `${req.user.firstName} ${req.user.lastName} sent you a message`,
            link: `/messages`
          });
        });
      }
    } catch (notifError) {
      console.error('Failed to send message notifications:', notifError);
      // Don't fail the message send if notifications fail
    }

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const { participants, isGroup, groupName } = req.body;

    // Add current user to participants if not already included
    if (!participants.includes(req.user.id)) {
      participants.push(req.user.id);
    }

    // Check if conversation already exists (for non-group conversations)
    if (!isGroup && participants.length === 2) {
      const existingConversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 },
        isGroup: false
      });

      if (existingConversation) {
        return res.status(200).json({ success: true, data: existingConversation });
      }
    }

    const conversation = await Conversation.create({
      participants,
      isGroup,
      groupName,
      admin: isGroup ? req.user.id : null
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'firstName lastName profilePicture');

    res.status(201).json({ success: true, data: populatedConversation });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const messages = await Message.updateMany(
      {
        conversation: req.params.conversationId,
        sender: { $ne: req.user.id },
        isRead: false
      },
      {
        $set: { isRead: true },
        $push: { readBy: { user: req.user.id } }
      }
    );

    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};
