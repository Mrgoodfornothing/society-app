const Notice = require('../models/Notice');

// @desc    Get all notices
// @route   GET /api/notices
// @access  Private
const getNotices = async (req, res) => {
  const notices = await Notice.find({}).sort({ createdAt: -1 }); // Newest first
  res.json(notices);
};

// @desc    Create a notice
// @route   POST /api/notices
// @access  Private/Admin
const createNotice = async (req, res) => {
  const { title, description, type } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  const notice = await Notice.create({
    title,
    description,
    type,
    createdBy: req.user._id
  });

  res.status(201).json(notice);
};

module.exports = { getNotices, createNotice };