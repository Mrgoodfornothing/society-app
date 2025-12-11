const express = require('express');
const router = express.Router();

// 1. Import the controller
// We use a try-catch require to see if it fails loading
let paymentController;
try {
  paymentController = require('../controllers/paymentController');
  console.log("Payment Routes: Controller imported successfully.");
} catch (e) {
  console.error("Payment Routes Error: Could not import controller!", e);
}

const { createOrder, verifyPayment } = paymentController;

// 2. Define Middleware
const { protect } = require('../middleware/authMiddleware');

// 3. Debug Logs to check if functions exist
if (!createOrder || !verifyPayment) {
  console.error("CRITICAL ERROR: createOrder or verifyPayment is UNDEFINED. Check controller exports.");
}

// 4. The Routes
router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;