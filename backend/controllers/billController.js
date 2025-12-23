const asyncHandler = require('express-async-handler'); // Ensure you have this or use async/await blocks with try-catch
const Bill = require('../models/Bill');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail'); // Use your existing utility

// --- RAZORPAY CONFIGURATION ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RqD258d3jIqnzq',
  key_secret: process.env.RAZORPAY_KEY_SECRET 
});

// @desc    Get all bills for the logged in user
// @route   GET /api/bills/mybills
const getMyBills = async (req, res) => {
  const bills = await Bill.find({ resident: req.user._id }).sort({ createdAt: -1 });
  res.json(bills);
};

// @desc    Get ALL bills (Admin)
// @route   GET /api/bills/all
const getAllBills = async (req, res) => {
  const bills = await Bill.find({}).populate('resident', 'name flatNumber').sort({ createdAt: -1 });
  res.json(bills);
};

// @desc    Create a new bill
// @route   POST /api/bills
const createBill = async (req, res) => {
  const { residentId, title, amount, dueDate } = req.body;

  if (!title || !amount || !dueDate) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  const targetResident = residentId ? residentId : req.user._id;

  const bill = await Bill.create({
    resident: targetResident,
    title,
    amount,
    dueDate,
    status: 'pending'
  });

  res.status(201).json(bill);
};

// --- PAYMENT HANDLERS ---

// @desc    Create Razorpay Order
// @route   POST /api/bills/create-order
const createOrder = async (req, res) => {
  const { amount } = req.body;
  
  const options = {
    amount: amount * 100, // Convert to paise
    currency: "INR",
    receipt: "receipt_" + Math.random().toString(36).substring(7),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).json({ message: "Payment Gateway Error" });
  }
};

// @desc    Verify Payment, Update DB & Send Email
// @route   POST /api/bills/verify-payment
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    // 1. Payment Verified - Now find the bill
    const bill = await Bill.findById(billId).populate('resident'); // Populate to get email
    
    if(bill) {
        // 2. Update Database Status
        bill.status = 'paid';
        bill.paymentDate = Date.now();
        // bill.paymentId = razorpay_payment_id; // Add this to your Bill Schema if you want to store it
        await bill.save();

        // 3. Send Email Invoice
        if (bill.resident && bill.resident.email) {
            const message = `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
                <h2 style="color: #4F46E5;">Payment Successful</h2>
                <p>Hi ${bill.resident.name},</p>
                <p>We have received your payment for <strong>${bill.title}</strong>.</p>
                <table style="width: 100%; margin-top: 20px;">
                  <tr><td><strong>Amount Paid:</strong></td><td>₹${bill.amount}</td></tr>
                  <tr><td><strong>Transaction ID:</strong></td><td>${razorpay_payment_id}</td></tr>
                  <tr><td><strong>Date:</strong></td><td>${new Date().toLocaleDateString()}</td></tr>
                  <tr><td><strong>Status:</strong></td><td style="color: green; font-weight: bold;">PAID ✅</td></tr>
                </table>
                <p style="margin-top: 20px;">Thank you,<br/>Society Management</p>
              </div>
            `;

            try {
                await sendEmail({
                    email: bill.resident.email,
                    subject: `Payment Receipt - ${bill.title}`,
                    message: message
                });
            } catch (emailError) {
                console.error("Email failed to send:", emailError);
                // Don't fail the response just because email failed
            }
        }

        res.json({ status: "success", message: "Payment Verified & Updated" });
    } else {
        res.status(404).json({ message: "Bill not found" });
    }
  } else {
    res.status(400).json({ message: "Invalid Signature" });
  }
};

module.exports = { 
  getMyBills, 
  createBill, 
  getAllBills, 
  createOrder, 
  verifyPayment 
};