const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    room: { type: String, required: true },
    author: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'resident' },
    message: { type: String }, // Not required anymore (can be just a file)
    time: { type: String, required: true },
    
    // NEW FIELDS FOR MEDIA
    fileUrl: { type: String, default: "" },
    fileType: { type: String, default: "text" }, // 'text', 'image', 'video', 'audio', 'file'
    fileName: { type: String, default: "" },

    // Existing features
    hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: { type: Date, default: null },
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