// models/Bill.js
const mongoose = require('mongoose');

const billSchema = mongoose.Schema({
  resident: {
    type: mongoose.Schema.Types.ObjectId, // Links to a specific User
    ref: 'User',
    required: true
  },
  title: { type: String, required: true }, // e.g., "Maintenance Oct 2025"
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paymentId: { type: String } // Will store Razorpay Transaction ID
}, {
  timestamps: true
});

module.exports = mongoose.model('Bill', billSchema);