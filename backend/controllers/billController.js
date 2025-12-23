const asyncHandler = require('express-async-handler');
const Bill = require('../models/Bill');
const User = require('../models/User'); // Import User model
const Razorpay = require('razorpay');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// --- CONFIGURATION ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RqD258d3jIqnzq',
  key_secret: process.env.RAZORPAY_KEY_SECRET 
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  }
});

const sendInvoiceEmail = async (userEmail, userName, bill) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `Payment Successful - ${bill.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #4F46E5;">Payment Successful</h2>
        <p>Hi ${userName},</p>
        <p>We have received your payment for <strong>${bill.title}</strong>.</p>
        <p>Amount: <strong>₹${bill.amount}</strong></p>
        <p>Status: <span style="color: green; font-weight: bold;">PAID ✅</span></p>
      </div>
    `
  };
  try { await transporter.sendMail(mailOptions); } catch (error) { console.error("Email Error:", error); }
};

// --- CONTROLLERS ---

const getMyBills = asyncHandler(async (req, res) => {
  const bills = await Bill.find({ resident: req.user.id }).sort({ createdAt: -1 });
  res.json(bills);
});

const getAllBills = asyncHandler(async (req, res) => {
  const bills = await Bill.find({}).populate('resident', 'name flatNumber');
  res.json(bills);
});

const createBill = asyncHandler(async (req, res) => {
  const { residentId, title, amount, dueDate } = req.body;
  const bill = await Bill.create({
    resident: residentId,
    title,
    amount,
    dueDate,
    status: 'pending'
  });
  res.status(201).json(bill);
});

// --- NEW: BULK BILL CREATION ---
const createBulkBill = asyncHandler(async (req, res) => {
  const { title, amount, dueDate } = req.body;
  
  // 1. Find all residents
  const residents = await User.find({ role: 'resident' });
  
  if (!residents || residents.length === 0) {
    res.status(400);
    throw new Error('No residents found');
  }

  // 2. Prepare bills array
  const billsToCreate = residents.map(resident => ({
    resident: resident._id,
    title,
    amount,
    dueDate,
    status: 'pending'
  }));

  // 3. Insert all at once
  await Bill.insertMany(billsToCreate);

  res.status(201).json({ message: `Successfully sent bills to ${residents.length} residents.` });
});
// ------------------------------

const createOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const options = { amount: amount * 100, currency: "INR", receipt: "receipt_" + Math.random().toString(36).substring(7) };
  try { const order = await razorpay.orders.create(options); res.json(order); } 
  catch (error) { res.status(500); throw new Error("Payment Gateway Error"); }
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest("hex");

  if (expectedSignature === razorpay_signature) {
    const bill = await Bill.findById(billId).populate('resident');
    if(bill) {
        bill.status = 'paid';
        bill.paymentDate = Date.now();
        bill.paymentId = razorpay_payment_id;
        await bill.save();
        if (bill.resident && bill.resident.email) await sendInvoiceEmail(bill.resident.email, bill.resident.name, bill);
        res.json({ status: "success", message: "Payment Verified" });
    } else { res.status(404); throw new Error("Bill not found"); }
  } else { res.status(400); throw new Error("Invalid Signature"); }
});

module.exports = { getMyBills, createBill, getAllBills, createOrder, verifyPayment, createBulkBill };