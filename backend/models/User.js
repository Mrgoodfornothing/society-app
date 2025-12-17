// models/User.js
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // We will hash this later
  flatNumber: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'resident'], // Only two types of users
    default: 'resident'
  },
  phone: { type: String, required: true },
  isMuted: { type: Boolean, default: false },
  mutedUntil: { type: Date, default: null }
},{
  timestamps: true // Automatically adds 'createdAt' and 'updatedAt'
});

module.exports = mongoose.model('User', userSchema);