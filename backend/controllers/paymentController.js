const Razorpay = require('razorpay');
const crypto = require('crypto');
const Bill = require('../models/Bill');
const User = require('../models/User'); // <--- Enabled
const sendEmail = require('../utils/sendEmail'); // <--- Enabled

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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
    console.error("Order Error:", error);
    res.status(500).send(error);
  }
};

const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;

  try {
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

        // 2. SEND EMAIL (Now Enabled)
        try {
          const user = await User.findById(bill.resident);
          if (user) {
            console.log(`Attempting to send email to: ${user.email}`); // <--- Debug Log
            
            const message = `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #4F46E5;">Payment Successful!</h2>
                <p>Hi ${user.name},</p>
                <p>We received your payment of <strong>₹${bill.amount}</strong> for <strong>${bill.title}</strong>.</p>
                <p>Transaction ID: ${razorpay_payment_id}</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
                <br>
                <p>Regards,<br>Society Connect Team</p>
              </div>
            `;

            await sendEmail({
              email: user.email,
              subject: 'Payment Receipt - Society Connect',
              message,
            });
            console.log("Email sent successfully!");
          }
        } catch (emailError) {
          console.error("Email Sending Failed (Check .env credentials):", emailError.message);
        }

        return res.json({ message: "Payment Successful", success: true });
      }
    } else {
      return res.status(400).json({ message: "Invalid Signature", success: false });
    }
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { createOrder, verifyPayment };