const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    room: { type: String, required: true },
    author: { type: String, required: true },
    message: { type: String, required: true },
    time: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);