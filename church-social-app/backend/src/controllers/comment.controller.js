import Comment from '../models/Comment.model.js';
import Post from '../models/Post.model.js';
import Notification from '../models/Notification.model.js';

export const createComment = async (req, res, next) => {
  try {
    const { postId, content, parentComment } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user.id,
      content,
      parentComment
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'firstName lastName profilePicture');

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // If it's a reply, add to parent comment
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id }
      });
    }

    // Create notification
    if (post.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: post.author,
        sender: req.user.id,
        type: 'comment',
        title: 'New Comment',
        message: `${req.user.firstName} ${req.user.lastName} commented on your post`,
        relatedPost: postId
      });
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('new-comment', {
        postId: postId,
        comment: populatedComment
      });
    }

    res.status(201).json({ success: true, data: populatedComment });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.id && req.user.role !== 'pastor') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id }
    });

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('comment-deleted', {
        postId: comment.post,
        commentId: req.params.id
      });
    }

    res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

export const likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const likeIndex = comment.likes.indexOf(req.user.id);

    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(req.user.id);
    }

    await comment.save();

    res.status(200).json({ success: true, data: comment.likes });
  } catch (error) {
    next(error);
  }
};
