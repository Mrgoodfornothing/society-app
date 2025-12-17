const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    room: { type: String, required: true },
    author: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'resident' },
    message: { type: String, required: true },
    time: { type: String, required: true },
    type: { type: String, default: 'text' }, 
    
    hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For "Delete for Me"
    
    expiresAt: { type: Date, default: null }, // For "Global Disappearing"

    // NEW: Reactions Feature
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId },
        userName: String,
        emoji: String
      }
    ]
  },
  { timestamps: true }
);

messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Message', messageSchema);