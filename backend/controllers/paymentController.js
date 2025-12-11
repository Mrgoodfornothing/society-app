const Razorpay = require('razorpay');
const crypto = require('crypto');
const Bill = require('../models/Bill');
// const User = require('../models/User'); // Commented out to prevent crash
// const sendEmail = require('../utils/sendEmail'); // Commented out to prevent crash

console.log("Payment Controller Loaded"); // <--- Debug Log 1

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
  console.log("-> Create Order Request Received"); // <--- Debug Log
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Math.random().toString(36).substring(7),
    };
    const order = await razorpay.orders.create(options);
    console.log("-> Razorpay Order ID generated:", order.id);
    res.json(order);
  } catch (error) {
    console.error("-> Create Order Error:", error);
    res.status(500).send(error);
  }
};

const verifyPayment = async (req, res) => {
  console.log("-> Verify Payment Request Received"); // <--- Debug Log
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    console.log(`-> Sig Match? Expected: ${expectedSignature.substring(0,5)}... Received: ${razorpay_signature.substring(0,5)}...`);

    if (expectedSignature === razorpay_signature) {
      const bill = await Bill.findById(billId);
      if (bill) {
        bill.status = 'paid';
        bill.paymentId = razorpay_payment_id;
        await bill.save();
        console.log("-> Bill Updated to PAID in DB");
        return res.json({ message: "Payment Successful", success: true });
      } else {
        console.error("-> Bill ID not found in DB");
        return res.status(404).json({ message: "Bill not found" });
      }
    } else {
      console.error("-> Signature Mismatch!");
      return res.status(400).json({ message: "Invalid Signature", success: false });
    }
  } catch (error) {
    console.error("-> Verify Function CRASHED:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// CRITICAL: Ensure these names match EXACTLY what we import in routes
module.exports = { createOrder, verifyPayment };