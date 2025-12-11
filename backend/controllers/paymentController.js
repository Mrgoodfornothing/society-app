const Razorpay = require('razorpay');
const crypto = require('crypto');
const Bill = require('../models/Bill');
const User = require('../models/User'); 
const sendEmail = require('../utils/sendEmail'); 

// 1. Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Order
const createOrder = async (req, res) => {
  const { amount } = req.body;
  try {
    const options = {
      amount: amount * 100, 
      currency: "INR",
      receipt: "receipt_" + Math.random().toString(36).substring(7),
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
};

// @desc    Verify Payment & Send Email
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;

  try {
    // 1. Validate Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // 2. Update Database
      const bill = await Bill.findById(billId);
      if (bill) {
        bill.status = 'paid';
        bill.paymentId = razorpay_payment_id;
        await bill.save();

        // 3. Send Email (Wrapped in try-catch so it doesn't crash payment)
        try {
          const user = await User.findById(bill.resident);
          if (user) {
            const message = `
              <h2>Payment Successful</h2>
              <p>Hi ${user.name}, we received your payment of ₹${bill.amount}.</p>
              <p>Transaction ID: ${razorpay_payment_id}</p>
            `;
            await sendEmail({
              email: user.email,
              subject: 'Payment Receipt',
              message,
            });
            console.log("Email sent to:", user.email);
          }
        } catch (emailError) {
          console.error("Email failed:", emailError.message);
        }

        return res.json({ message: "Payment Successful", success: true });
      }
    } else {
      return res.status(400).json({ message: "Invalid Signature", success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// CRITICAL EXPORT LINE - Do not delete!
module.exports = { createOrder, verifyPayment };