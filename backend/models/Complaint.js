const mongoose = require('mongoose');

const complaintSchema = mongoose.Schema({
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Plumbing', 'Electrical', 'Security', 'Cleanliness', 'Other'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['open', 'resolved'], 
    default: 'open' 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);