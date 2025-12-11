const mongoose = require('mongoose');

const noticeSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'urgent', 'event'], 
    default: 'info' 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notice', noticeSchema);