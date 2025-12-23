const express = require('express');
const router = express.Router();
const { 
  getMyBills, createBill, getAllBills, createOrder, verifyPayment, createBulkBill 
} = require('../controllers/billController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/mybills', protect, getMyBills);
router.post('/', protect, admin, createBill);
router.get('/all', protect, admin, getAllBills);

// NEW: Bulk Bill Route
router.post('/bulk', protect, admin, createBulkBill); 

router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);

module.exports = router;