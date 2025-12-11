const Complaint = require('../models/Complaint');

// @desc    Raise a new ticket
// @route   POST /api/complaints
// @access  Private (Resident)
const createComplaint = async (req, res) => {
  const { title, description, category } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  const complaint = await Complaint.create({
    resident: req.user._id,
    title,
    description,
    category,
    status: 'open'
  });

  res.status(201).json(complaint);
};

// @desc    Get my tickets
// @route   GET /api/complaints/my
// @access  Private (Resident)
const getMyComplaints = async (req, res) => {
  const complaints = await Complaint.find({ resident: req.user._id }).sort({ createdAt: -1 });
  res.json(complaints);
};

// @desc    Get all tickets & Update status
// @route   GET /api/complaints/all, PUT /api/complaints/:id
// @access  Private (Admin)
const getAllComplaints = async (req, res) => {
  // Populate 'resident' to see who complained (Name, Flat)
  const complaints = await Complaint.find({}).populate('resident', 'name flatNumber').sort({ createdAt: -1 });
  res.json(complaints);
};

const updateComplaintStatus = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (complaint) {
    complaint.status = req.body.status;
    await complaint.save();
    res.json(complaint);
  } else {
    res.status(404).json({ message: 'Complaint not found' });
  }
};

module.exports = { createComplaint, getMyComplaints, getAllComplaints, updateComplaintStatus };