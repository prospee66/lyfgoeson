import Sermon from '../models/Sermon.model.js';

export const getSermons = async (req, res, next) => {
  try {
    const { series, pastor, page = 1, limit = 20 } = req.query;
    let query = {};

    if (series) query.series = series;
    if (pastor) query.pastor = pastor;

    const sermons = await Sermon.find(query)
      .populate('pastor', 'firstName lastName profilePicture role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ isFeatured: -1, sermonDate: -1 });

    const count = await Sermon.countDocuments(query);

    res.status(200).json({
      success: true,
      data: sermons,
      pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
};

export const getSermon = async (req, res, next) => {
  try {
    const sermon = await Sermon.findById(req.params.id)
      .populate('pastor', 'firstName lastName profilePicture role')
      .populate('comments.user', 'firstName lastName profilePicture');

    if (!sermon) {
      return res.status(404).json({ success: false, message: 'Sermon not found' });
    }

    // Increment views
    sermon.views += 1;
    await sermon.save();

    res.status(200).json({ success: true, data: sermon });
  } catch (error) {
    next(error);
  }
};

export const createSermon = async (req, res, next) => {
  try {
    const { title, description, pastor, sermonDate, series, scripture, mediaType, youtubeVideoUrl, duration, tags, isFeatured, transcription } = req.body;

    // Process uploaded files
    let videoUrl = null;
    let audioUrl = null;
    let thumbnail = null;

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const isVideo = file.mimetype.startsWith('video/');
        const isAudio = file.mimetype.startsWith('audio/');
        const isImage = file.mimetype.startsWith('image/');

        if (isVideo) {
          videoUrl = `/uploads/${file.filename}`;
        } else if (isAudio) {
          audioUrl = `/uploads/${file.filename}`;
        } else if (isImage) {
          thumbnail = `/uploads/${file.filename}`;
        }
      });
    }

    const sermonData = {
      title,
      description,
      pastor: pastor || req.user.id,
      sermonDate,
      mediaType: mediaType || 'video'
    };

    if (series) sermonData.series = series;
    if (scripture) sermonData.scripture = scripture;
    if (videoUrl) sermonData.videoUrl = videoUrl;
    if (audioUrl) sermonData.audioUrl = audioUrl;
    if (youtubeVideoUrl) sermonData.youtubeVideoUrl = youtubeVideoUrl;
    if (thumbnail) sermonData.thumbnail = thumbnail;
    if (duration) sermonData.duration = duration;
    if (tags) sermonData.tags = tags;
    if (isFeatured !== undefined) sermonData.isFeatured = isFeatured;
    if (transcription) sermonData.transcription = transcription;

    const sermon = await Sermon.create(sermonData);

    const populatedSermon = await Sermon.findById(sermon._id)
      .populate('pastor', 'firstName lastName profilePicture role');

    res.status(201).json({ success: true, data: populatedSermon });
  } catch (error) {
    next(error);
  }
};

export const updateSermon = async (req, res, next) => {
  try {
    let sermon = await Sermon.findById(req.params.id);

    if (!sermon) {
      return res.status(404).json({ success: false, message: 'Sermon not found' });
    }

    if (sermon.pastor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    sermon = await Sermon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    res.status(200).json({ success: true, data: sermon });
  } catch (error) {
    next(error);
  }
};

export const deleteSermon = async (req, res, next) => {
  try {
    const sermon = await Sermon.findById(req.params.id);

    if (!sermon) {
      return res.status(404).json({ success: false, message: 'Sermon not found' });
    }

    if (sermon.pastor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await sermon.deleteOne();

    // Emit socket event to notify all users about the deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('sermon-deleted', { sermonId: req.params.id });
    }

    res.status(200).json({ success: true, message: 'Sermon deleted' });
  } catch (error) {
    next(error);
  }
};

export const likeSermon = async (req, res, next) => {
  try {
    const sermon = await Sermon.findById(req.params.id);

    if (!sermon) {
      return res.status(404).json({ success: false, message: 'Sermon not found' });
    }

    const likeIndex = sermon.likes.indexOf(req.user.id);

    if (likeIndex > -1) {
      sermon.likes.splice(likeIndex, 1);
    } else {
      sermon.likes.push(req.user.id);
    }

    await sermon.save();

    res.status(200).json({ success: true, data: sermon.likes });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const sermon = await Sermon.findById(req.params.id);

    if (!sermon) {
      return res.status(404).json({ success: false, message: 'Sermon not found' });
    }

    sermon.comments.push({
      user: req.user.id,
      comment: req.body.comment
    });

    await sermon.save();

    const populatedSermon = await Sermon.findById(sermon._id)
      .populate('comments.user', 'firstName lastName profilePicture');

    res.status(200).json({ success: true, data: populatedSermon });
  } catch (error) {
    next(error);
  }
};
