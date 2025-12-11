// backend/routes/billRoutes.js
const express = require('express');
const router = express.Router();
const { getMyBills, createBill, getAllBills } = require('../controllers/billController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route 1: For Residents to see their own bills
router.get('/mybills', protect, getMyBills);

// Route 2: For Admins to create bills
router.post('/', protect, createBill);

// Route 3: For Admins to see ALL bills (This is the new one for Charts)
router.get('/all', protect, admin, getAllBills);

module.exports = router;