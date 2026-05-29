const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// @desc    Get comments for a specific post
// @route   GET /api/comments/post/:postId
// @access  Public
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add a comment to a post
// @route   POST /api/comments/post/:postId
// @access  Private
router.post('/post/:postId', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Please add comment content' });
    }

    // Check if post exists
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      content,
      post: req.params.postId,
      author: req.user._id,
    });

    const populatedComment = await comment.populate('author', 'name email');

    res.status(201).json({ success: true, data: populatedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Find the associated post to check post author
    const post = await Post.findById(comment.post);

    // Only comment author OR post author can delete the comment
    const isCommentAuthor = comment.author.toString() === req.user._id.toString();
    const isPostAuthor = post && post.author.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(401).json({ success: false, message: 'User not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Comment removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
