const express = require('express');
const router = express.Router();
const { 
  getMyBills, 
  createBill, 
  getAllBills, 
  createOrder, 
  verifyPayment 
} = require('../controllers/billController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route 1: For Residents to see their own bills
router.get('/mybills', protect, getMyBills);

// Route 2: For Admins to create bills
router.post('/', protect, admin, createBill);

// Route 3: For Admins to see ALL bills
router.get('/all', protect, admin, getAllBills);

// Route 4: Create Razorpay Order
router.post('/create-order', protect, createOrder);

// Route 5: Verify Payment & Update DB
router.post('/verify-payment', protect, verifyPayment);

module.exports = router;