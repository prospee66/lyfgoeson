import Post from '../models/Post.model.js';
import Comment from '../models/Comment.model.js';
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';

// @desc    Get all posts (feed)
// @route   GET /api/posts
// @access  Private
export const getPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, postType, groupId } = req.query;

    let query = { isApproved: true };

    if (postType) {
      query.postType = postType;
    }

    if (groupId) {
      query.group = groupId;
    }

    const posts = await Post.find(query)
      .populate('author', 'firstName lastName profilePicture role')
      .populate('group', 'name')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'firstName lastName profilePicture' },
        options: { limit: 3, sort: { createdAt: -1 } }
      })
      .populate({
        path: 'sharedPost',
        populate: {
          path: 'author',
          select: 'firstName lastName profilePicture role'
        }
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ isPinned: -1, createdAt: -1 });

    const count = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
export const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'firstName lastName profilePicture role')
      .populate('group', 'name')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'firstName lastName profilePicture' }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const { content, youtubeUrl, postType, group, visibility } = req.body;

    // Process uploaded files
    const media = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const isVideo = file.mimetype.startsWith('video/');
        media.push({
          type: isVideo ? 'video' : 'image',
          url: `/uploads/${file.filename}`, // Relative path
          thumbnail: isVideo ? null : `/uploads/${file.filename}`
        });
      });
    }

    const postData = {
      author: req.user.id,
      content,
      media,
      postType: postType || 'general',
      visibility: visibility || 'public'
    };

    if (youtubeUrl) {
      postData.youtubeUrl = youtubeUrl;
    }

    if (group) {
      postData.group = group;
    }

    const post = await Post.create(postData);

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'firstName lastName profilePicture role');

    // Send notifications to all users about the new post (only for staff posts)
    if (['pastor', 'sound_engineer'].includes(req.user.role)) {
      try {
        const allUsers = await User.find({ _id: { $ne: req.user.id } }).select('_id');
        const notifications = allUsers.map(user => ({
          recipient: user._id,
          sender: req.user.id,
          type: 'announcement',
          title: 'New Post from Staff',
          message: `${req.user.firstName} ${req.user.lastName} posted: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          link: `/feed`,
          relatedPost: post._id
        }));

        await Notification.insertMany(notifications);

        // Emit socket event for real-time notifications
        const io = req.app.get('io');
        if (io) {
          allUsers.forEach(user => {
            io.to(user._id.toString()).emit('new-notification', {
              type: 'announcement',
              title: 'New Post from Staff',
              message: `${req.user.firstName} ${req.user.lastName} posted an update`,
              relatedPost: post._id
            });
          });
        }
      } catch (notifError) {
        console.error('Failed to send notifications:', notifError);
        // Don't fail the post creation if notifications fail
      }
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('new-post', populatedPost);
    }

    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Make sure user is post owner or pastor
    if (post.author.toString() !== req.user.id && req.user.role !== 'pastor') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('author', 'firstName lastName profilePicture role');

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Make sure user is post owner or pastor
    if (post.author.toString() !== req.user.id && req.user.role !== 'pastor') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await post.deleteOne();

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: req.params.id });

    // Emit socket event to notify all users about the deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('post-deleted', { postId: req.params.id });
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
export const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const likeIndex = post.likes.indexOf(req.user.id);

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(req.user.id);

      // Create notification for post author
      if (post.author.toString() !== req.user.id) {
        await Notification.create({
          recipient: post.author,
          sender: req.user.id,
          type: 'like',
          title: 'New Like',
          message: `${req.user.firstName} ${req.user.lastName} liked your post`,
          relatedPost: post._id
        });
      }
    }

    await post.save();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('post-liked', {
        postId: post._id,
        likes: post.likes
      });
    }

    res.status(200).json({
      success: true,
      data: post.likes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Share post
// @route   POST /api/posts/:id/share
// @access  Private
export const sharePost = async (req, res, next) => {
  try {
    const originalPost = await Post.findById(req.params.id)
      .populate('author', 'firstName lastName profilePicture role');

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Add to original post's shares array
    originalPost.shares.push({
      user: req.user.id
    });
    await originalPost.save();

    // Create a new post that references the shared post
    const sharedPostData = {
      author: req.user.id,
      content: `Shared ${originalPost.author.firstName} ${originalPost.author.lastName}'s post`,
      sharedPost: originalPost._id,
      postType: originalPost.postType,
      visibility: originalPost.visibility
    };

    const newSharedPost = await Post.create(sharedPostData);

    const populatedSharedPost = await Post.findById(newSharedPost._id)
      .populate('author', 'firstName lastName profilePicture role')
      .populate({
        path: 'sharedPost',
        populate: {
          path: 'author',
          select: 'firstName lastName profilePicture role'
        }
      });

    // Create notification for original post author
    if (originalPost.author._id.toString() !== req.user.id) {
      await Notification.create({
        recipient: originalPost.author._id,
        sender: req.user.id,
        type: 'share',
        title: 'New Share',
        message: `${req.user.firstName} ${req.user.lastName} shared your post`,
        relatedPost: originalPost._id
      });
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('new-post', populatedSharedPost);
    }

    res.status(200).json({
      success: true,
      message: 'Post shared successfully',
      data: populatedSharedPost
    });
  } catch (error) {
    next(error);
  }
};
