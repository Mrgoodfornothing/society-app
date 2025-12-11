const express = require('express');
const router = express.Router();
const { createComplaint, getMyComplaints, getAllComplaints, updateComplaintStatus } = require('../controllers/complaintController');
const { protect, admin } = require('../middleware/authMiddleware');

// Resident Routes
router.post('/', protect, createComplaint);
router.get('/my', protect, getMyComplaints);

// Admin Routes
router.get('/all', protect, admin, getAllComplaints);
router.put('/:id', protect, admin, updateComplaintStatus);

module.exports = router;