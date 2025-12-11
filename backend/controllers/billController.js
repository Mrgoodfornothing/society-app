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

const createBill = async (req, res) => {
  const { residentId, title, amount, dueDate } = req.body;

  if (!title || !amount || !dueDate) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  // Logic: If Admin provides a residentId, use it. Otherwise, fallback to self (for testing)
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

module.exports = { getMyBills, createBill };