const Razorpay = require('razorpay');
const crypto = require('crypto');
const Bill = require('../models/Bill');
const User = require('../models/User'); // <--- Import User
const sendEmail = require('../utils/sendEmail'); // <--- Import Email Utility

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

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    // 1. Update Database
    const bill = await Bill.findById(billId);
    if (bill) {
      bill.status = 'paid';
      bill.paymentId = razorpay_payment_id;
      await bill.save();

      // 2. SEND EMAIL RECEIPT (The New Logic)
      try {
        const user = await User.findById(bill.resident);
        if (user) {
          const message = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 600px;">
              <h2 style="color: #4F46E5; text-align: center;">Payment Receipt</h2>
              <p>Dear <strong>${user.name}</strong>,</p>
              <p>We have successfully received your payment. Thank you for being a valued resident!</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Bill Title</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${bill.title}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount Paid</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd; color: #10B981; font-weight: bold;">₹ ${bill.amount}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Transaction ID</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${razorpay_payment_id}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${new Date().toLocaleDateString()}</td>
                </tr>
              </table>

              <p style="margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
                This is an automated email from Society Connect.
              </p>
            </div>
          `;

          await sendEmail({
            email: user.email,
            subject: `Payment Successful - ${bill.title}`,
            message,
          });
          console.log("Email sent successfully");
        }
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // We don't stop the response if email fails, payment is still successful
      }

      res.json({ message: "Payment Successful", success: true });
    } else {
      res.status(404).json({ message: "Bill not found" });
    }
  } else {
    res.status(400).json({ message: "Invalid Signature", success: false });
  }
};

module.exports = { createOrder, verifyPayment };