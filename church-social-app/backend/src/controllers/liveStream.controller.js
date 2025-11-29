import LiveStream from '../models/LiveStream.model.js';

// Get all live streams (with filters)
export const getLiveStreams = async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const query = { isActive: true };
    if (status) {
      query.status = status;
    }

    const streams = await LiveStream.find(query)
      .populate('createdBy', 'firstName lastName profilePicture role')
      .sort({ scheduledFor: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await LiveStream.countDocuments(query);

    res.status(200).json({
      success: true,
      count: streams.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: streams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Get single live stream
export const getLiveStream = async (req, res, next) => {
  try {
    const stream = await LiveStream.findById(req.params.id)
      .populate('createdBy', 'firstName lastName profilePicture role');

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found'
      });
    }

    res.status(200).json({
      success: true,
      data: stream
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Get current live stream
export const getCurrentLiveStream = async (req, res, next) => {
  try {
    const stream = await LiveStream.findOne({ status: 'live', isActive: true })
      .populate('createdBy', 'firstName lastName profilePicture role')
      .sort({ startedAt: -1 });

    res.status(200).json({
      success: true,
      data: stream
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Create live stream (Admin only)
export const createLiveStream = async (req, res, next) => {
  try {
    const streamData = {
      ...req.body,
      createdBy: req.user.id
    };

    const stream = await LiveStream.create(streamData);

    res.status(201).json({
      success: true,
      message: 'Live stream created successfully',
      data: stream
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Update live stream (Admin only)
export const updateLiveStream = async (req, res, next) => {
  try {
    let stream = await LiveStream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found'
      });
    }

    // Only creator or admin can update
    if (stream.createdBy.toString() !== req.user.id && req.user.role !== 'pastor') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this stream'
      });
    }

    stream = await LiveStream.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName profilePicture role');

    res.status(200).json({
      success: true,
      message: 'Live stream updated successfully',
      data: stream
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Start live stream (Admin only)
export const startLiveStream = async (req, res, next) => {
  try {
    const stream = await LiveStream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found'
      });
    }

    if (stream.status === 'live') {
      return res.status(400).json({
        success: false,
        message: 'Stream is already live'
      });
    }

    stream.status = 'live';
    stream.startedAt = new Date();
    await stream.save();

    res.status(200).json({
      success: true,
      message: 'Live stream started',
      data: stream
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// End live stream (Admin only)
export const endLiveStream = async (req, res, next) => {
  try {
    const stream = await LiveStream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found'
      });
    }

    stream.status = 'ended';
    stream.endedAt = new Date();
    await stream.save();

    res.status(200).json({
      success: true,
      message: 'Live stream ended',
      data: stream
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Join live stream (track viewer)
export const joinLiveStream = async (req, res, next) => {
  try {
    const stream = await LiveStream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found'
      });
    }

    // Add viewer if not already in the list
    if (!stream.viewers.includes(req.user.id)) {
      stream.viewers.push(req.user.id);
      stream.viewCount += 1;
      await stream.save();
    }

    res.status(200).json({
      success: true,
      message: 'Joined live stream',
      data: stream
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Delete live stream (Admin only)
export const deleteLiveStream = async (req, res, next) => {
  try {
    const stream = await LiveStream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found'
      });
    }

    // Only creator or pastor can delete
    if (stream.createdBy.toString() !== req.user.id && req.user.role !== 'pastor') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this stream'
      });
    }

    stream.isActive = false;
    await stream.save();

    res.status(200).json({
      success: true,
      message: 'Live stream deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
