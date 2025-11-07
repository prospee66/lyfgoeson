import Event from '../models/Event.model.js';
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';

export const getEvents = async (req, res, next) => {
  try {
    const { upcoming, past, page = 1, limit = 20 } = req.query;

    let query = { isPublic: true };
    const now = new Date();

    if (upcoming) {
      query.startDate = { $gte: now };
    } else if (past) {
      query.endDate = { $lt: now };
    }

    const events = await Event.find(query)
      .populate('organizer', 'firstName lastName profilePicture')
      .populate('group', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ startDate: upcoming ? 1 : -1 });

    const count = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
      pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName profilePicture')
      .populate('attendees.user', 'firstName lastName profilePicture');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    // Process uploaded files
    const media = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const isVideo = file.mimetype.startsWith('video/');
        media.push({
          type: isVideo ? 'video' : 'image',
          url: `/uploads/${file.filename}`,
          thumbnail: isVideo ? null : `/uploads/${file.filename}`
        });
      });
    }

    // Parse location if it's a JSON string
    let location = req.body.location;
    if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        // If parsing fails, keep it as string
      }
    }

    const eventData = {
      ...req.body,
      location,
      organizer: req.user.id,
      media
    };

    const event = await Event.create(eventData);

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'firstName lastName profilePicture');

    // Send notifications to all users about the new event
    try {
      const allUsers = await User.find({ _id: { $ne: req.user.id } }).select('_id');
      const notifications = allUsers.map(user => ({
        recipient: user._id,
        sender: req.user.id,
        type: 'announcement',
        title: 'New Event Posted',
        message: `New event "${event.title}" has been scheduled for ${new Date(event.startDate).toLocaleDateString()}`,
        link: `/events`,
        relatedEvent: event._id
      }));

      await Notification.insertMany(notifications);

      // Emit socket event for real-time notifications
      const io = req.app.get('io');
      if (io) {
        allUsers.forEach(user => {
          io.to(user._id.toString()).emit('new-notification', {
            type: 'announcement',
            title: 'New Event Posted',
            message: `New event "${event.title}" has been scheduled`,
            relatedEvent: event._id
          });
        });
      }
    } catch (notifError) {
      console.error('Failed to send notifications:', notifError);
      // Don't fail the event creation if notifications fail
    }

    res.status(201).json({ success: true, data: populatedEvent });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('organizer', 'firstName lastName profilePicture');

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await event.deleteOne();

    // Emit socket event to notify all users about the deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('event-deleted', { eventId: req.params.id });
    }

    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};

export const rsvpEvent = async (req, res, next) => {
  try {
    const { status } = req.body; // 'going', 'maybe', 'not-going'
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const existingRSVP = event.attendees.find(a => a.user.toString() === req.user.id);

    if (existingRSVP) {
      existingRSVP.status = status;
    } else {
      event.attendees.push({ user: req.user.id, status });
    }

    await event.save();

    // Create notification for organizer
    if (event.organizer.toString() !== req.user.id && status === 'going') {
      await Notification.create({
        recipient: event.organizer,
        sender: req.user.id,
        type: 'event-invite',
        title: 'New Event RSVP',
        message: `${req.user.firstName} ${req.user.lastName} is attending your event`,
        relatedEvent: event._id
      });
    }

    res.status(200).json({ success: true, data: event.attendees });
  } catch (error) {
    next(error);
  }
};

