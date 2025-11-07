import Prayer from '../models/Prayer.model.js';

export const getPrayers = async (req, res, next) => {
  try {
    const { category, status, page = 1, limit = 20 } = req.query;
    let query = { isPublic: true };

    if (category) query.category = category;
    if (status) query.status = status;

    const prayers = await Prayer.find(query)
      .populate('author', 'firstName lastName profilePicture')
      .populate('prayedBy.user', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ isUrgent: -1, createdAt: -1 });

    const count = await Prayer.countDocuments(query);

    res.status(200).json({
      success: true,
      data: prayers,
      pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
};

export const getPrayer = async (req, res, next) => {
  try {
    const prayer = await Prayer.findById(req.params.id)
      .populate('author', 'firstName lastName profilePicture')
      .populate('prayedBy.user', 'firstName lastName profilePicture')
      .populate('responses.user', 'firstName lastName profilePicture');

    if (!prayer) {
      return res.status(404).json({ success: false, message: 'Prayer request not found' });
    }

    res.status(200).json({ success: true, data: prayer });
  } catch (error) {
    next(error);
  }
};

export const createPrayer = async (req, res, next) => {
  try {
    req.body.author = req.user.id;
    const prayer = await Prayer.create(req.body);

    const populatedPrayer = await Prayer.findById(prayer._id)
      .populate('author', 'firstName lastName profilePicture');

    res.status(201).json({ success: true, data: populatedPrayer });
  } catch (error) {
    next(error);
  }
};

export const updatePrayer = async (req, res, next) => {
  try {
    let prayer = await Prayer.findById(req.params.id);

    if (!prayer) {
      return res.status(404).json({ success: false, message: 'Prayer request not found' });
    }

    if (prayer.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    prayer = await Prayer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    res.status(200).json({ success: true, data: prayer });
  } catch (error) {
    next(error);
  }
};

export const deletePrayer = async (req, res, next) => {
  try {
    const prayer = await Prayer.findById(req.params.id);

    if (!prayer) {
      return res.status(404).json({ success: false, message: 'Prayer request not found' });
    }

    if (prayer.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await prayer.deleteOne();

    res.status(200).json({ success: true, message: 'Prayer request deleted' });
  } catch (error) {
    next(error);
  }
};

export const prayForRequest = async (req, res, next) => {
  try {
    const prayer = await Prayer.findById(req.params.id);

    if (!prayer) {
      return res.status(404).json({ success: false, message: 'Prayer request not found' });
    }

    const alreadyPrayed = prayer.prayedBy.some(p => p.user.toString() === req.user.id);

    if (!alreadyPrayed) {
      prayer.prayedBy.push({ user: req.user.id });
      prayer.prayerCount += 1;
      await prayer.save();
    }

    res.status(200).json({ success: true, data: prayer });
  } catch (error) {
    next(error);
  }
};

export const addResponse = async (req, res, next) => {
  try {
    const prayer = await Prayer.findById(req.params.id);

    if (!prayer) {
      return res.status(404).json({ success: false, message: 'Prayer request not found' });
    }

    prayer.responses.push({
      user: req.user.id,
      message: req.body.message
    });

    await prayer.save();

    const populatedPrayer = await Prayer.findById(prayer._id)
      .populate('responses.user', 'firstName lastName profilePicture');

    res.status(200).json({ success: true, data: populatedPrayer });
  } catch (error) {
    next(error);
  }
};
