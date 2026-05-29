const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 }); // Newest first

    res.json({ success: true, count: posts.length, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name email');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, coverImage, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please add a title and content' });
    }

    // Process tags into array of strings if they are sent as comma separated
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.map(tag => tag.trim());
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }

    const post = await Post.create({
      title,
      content,
      coverImage,
      tags: processedTags,
      author: req.user._id,
    });

    const populatedPost = await post.populate('author', 'name email');

    res.status(201).json({ success: true, data: populatedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Make sure user is post author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized to update this post' });
    }

    const { title, content, coverImage, tags } = req.body;

    let processedTags = post.tags;
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        processedTags = tags.map(tag => tag.trim());
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }

    post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        title: title || post.title,
        content: content || post.content,
        coverImage: coverImage !== undefined ? coverImage : post.coverImage,
        tags: processedTags,
      },
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    res.json({ success: true, data: post });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Make sure user is post author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized to delete this post' });
    }

    // Delete post
    await Post.findByIdAndDelete(req.params.id);

    // Delete associated comments
    await Comment.deleteMany({ post: req.params.id });

    res.json({ success: true, message: 'Post and associated comments removed' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
