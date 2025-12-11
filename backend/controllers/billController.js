// backend/controllers/billController.js
const Bill = require('../models/Bill');

// @desc    Get all bills for the logged in user (Resident view)
// @route   GET /api/bills/mybills
// @access  Private
const getMyBills = async (req, res) => {
  const bills = await Bill.find({ resident: req.user._id }).sort({ createdAt: -1 });
  res.json(bills);
};

// @desc    Get ALL bills (Admin view for Charts/Analytics)
// @route   GET /api/bills/all
// @access  Private/Admin
const getAllBills = async (req, res) => {
  // Find ALL bills, and also "populate" (fetch) the name and flat number of the person who owes it
  const bills = await Bill.find({}).populate('resident', 'name flatNumber').sort({ createdAt: -1 });
  res.json(bills);
};

// @desc    Create a new bill
// @route   POST /api/bills
// @access  Private/Admin
const createBill = async (req, res) => {
  const { residentId, title, amount, dueDate } = req.body;

  if (!title || !amount || !dueDate) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  // If Admin selected a resident, use that ID. Otherwise use own ID (testing).
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

// Export ALL functions including the new getAllBills
module.exports = { getMyBills, createBill, getAllBills };