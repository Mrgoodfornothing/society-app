// backend/routes/billRoutes.js
const express = require('express');
const router = express.Router();
const { getMyBills, createBill } = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');

// Check the token (protect), then run the logic
router.get('/mybills', protect, getMyBills);
router.post('/', protect, createBill);

module.exports = router;