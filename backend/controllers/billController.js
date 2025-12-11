// backend/controllers/billController.js
const Bill = require('../models/Bill');

// @desc    Get all bills for the logged in user
// @route   GET /api/bills/mybills
// @access  Private
const getMyBills = async (req, res) => {
  // Find bills where 'resident' matches the logged-in user's ID
  const bills = await Bill.find({ resident: req.user._id }).sort({ createdAt: -1 });
  res.json(bills);
};

// @desc    Create a new bill (For Admin/Testing)
// @route   POST /api/bills
// @access  Private
const createBill = async (req, res) => {
  const { title, amount, dueDate } = req.body;

  if (!title || !amount || !dueDate) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  const bill = await Bill.create({
    resident: req.user._id, // Assigning bill to YOURSELF for testing
    title,
    amount,
    dueDate,
    status: 'pending'
  });

  res.status(201).json(bill);
};

module.exports = { getMyBills, createBill };