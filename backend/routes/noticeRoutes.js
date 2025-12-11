const express = require('express');
const router = express.Router();
const { getNotices, createNotice } = require('../controllers/noticeController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getNotices);
router.post('/', protect, admin, createNotice);

module.exports = router;