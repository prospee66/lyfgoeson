import Group from '../models/Group.model.js';
import Notification from '../models/Notification.model.js';

export const getGroups = async (req, res, next) => {
  try {
    const { groupType, search, page = 1, limit = 20 } = req.query;
    let query = {};

    if (groupType) query.groupType = groupType;
    if (search) query.name = { $regex: search, $options: 'i' };

    const groups = await Group.find(query)
      .populate('leader', 'firstName lastName profilePicture')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Group.countDocuments(query);

    res.status(200).json({
      success: true,
      data: groups,
      pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
};

export const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('leader', 'firstName lastName profilePicture')
      .populate('moderators', 'firstName lastName profilePicture')
      .populate('members.user', 'firstName lastName profilePicture');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    req.body.leader = req.user.id;
    req.body.members = [{ user: req.user.id, role: 'leader' }];

    const group = await Group.create(req.body);

    const populatedGroup = await Group.findById(group._id)
      .populate('leader', 'firstName lastName profilePicture');

    res.status(201).json({ success: true, data: populatedGroup });
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    let group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.leader.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.leader.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await group.deleteOne();

    res.status(200).json({ success: true, message: 'Group deleted' });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.user.toString() === req.user.id);

    if (isMember) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    if (group.requiresApproval) {
      group.membershipRequests.push({ user: req.user.id, message: req.body.message });
      await group.save();

      await Notification.create({
        recipient: group.leader,
        sender: req.user.id,
        type: 'group-request',
        title: 'New Group Join Request',
        message: `${req.user.firstName} ${req.user.lastName} requested to join ${group.name}`,
        relatedGroup: group._id
      });

      return res.status(200).json({ success: true, message: 'Request sent' });
    }

    group.members.push({ user: req.user.id, role: 'member' });
    await group.save();

    res.status(200).json({ success: true, message: 'Joined group' });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    group.members = group.members.filter(m => m.user.toString() !== req.user.id);
    await group.save();

    res.status(200).json({ success: true, message: 'Left group' });
  } catch (error) {
    next(error);
  }
};
