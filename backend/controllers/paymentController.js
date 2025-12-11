const Razorpay = require('razorpay');
const crypto = require('crypto');
const Bill = require('../models/Bill');

// 1. Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create a Razorpay Order
// @route   POST /api/payment/order
const createOrder = async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // Razorpay takes amount in paisa (100 paisa = 1 Rupee)
    currency: "INR",
    receipt: "receipt_" + Math.random().toString(36).substring(7),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
};

// @desc    Verify Payment and Update Bill
// @route   POST /api/payment/verify
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;

  // 1. Create the expected signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  // 2. Compare signatures
  if (expectedSignature === razorpay_signature) {
    // Payment is Legit! Update the database.
    const bill = await Bill.findById(billId);
    if (bill) {
      bill.status = 'paid';
      bill.paymentId = razorpay_payment_id;
      await bill.save();
      res.json({ message: "Payment Successful", success: true });
    } else {
      res.status(404).json({ message: "Bill not found" });
    }
  } else {
    res.status(400).json({ message: "Invalid Signature", success: false });
  }
};

module.exports = { createOrder, verifyPayment };