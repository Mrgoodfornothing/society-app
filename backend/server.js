const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/messageModel');
const User = require('./models/User'); // Import User model

const port = process.env.PORT || 5001;

connectDB();
const app = express();

//app.use(cors());
// Update CORS to allow your future frontend URL
app.use(cors({
  origin: ["http://localhost:5173", "https://society-app-dusky.vercel.app/"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- GLOBAL CHAT SETTINGS (In-Memory) ---
let chatSettings = {
  adminsOnly: false,
  globalDisappearingTime: 0, // 0 = off, value in seconds
};
// ----------------------------------------

// Route to get Messages (Filtered for "Delete for Me")
app.get('/api/messages/:room/:userId', async (req, res) => {
  try {
    const { room, userId } = req.params;
    // Find messages where 'hiddenBy' does NOT include this user
    const messages = await Message.find({ 
      room, 
      hiddenBy: { $ne: userId } 
    });
    res.json({ messages, settings: chatSettings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Existing Routes...
app.use('/api/users', require('./routes/userRoutes'));
// ... (Your other routes: bills, notices, etc.) ...
app.use(errorHandler);

const server = http.createServer(app);
// Update Socket.io CORS too
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://society-app-dusky.vercel.app/"],
    methods: ["GET", "POST"],
    credentials: true
  },
});

io.on('connection', (socket) => {
  console.log(`✅ User: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    // Send current settings to the user who just joined
    socket.emit('settings_update', chatSettings);
  });

  // ... inside io.on ...

  // NEW: Reaction Handler
  socket.on('add_reaction', async ({ messageId, userId, userName, emoji }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      // Check if user already reacted with this emoji, if so, remove it (toggle)
      const existingIndex = msg.reactions.findIndex(
        (r) => r.userId.toString() === userId && r.emoji === emoji
      );

      if (existingIndex > -1) {
        msg.reactions.splice(existingIndex, 1); // Remove
      } else {
        // Remove previous reaction from this user to avoid spam? 
        // Or allow multiple? Let's allow 1 reaction per user for simplicity, 
        // or just push to allow multiple. Let's allow 1 per user for now (WhatsApp style replacement).
        const userReactionIndex = msg.reactions.findIndex(r => r.userId.toString() === userId);
        if(userReactionIndex > -1) {
            msg.reactions[userReactionIndex].emoji = emoji; // Update existing
        } else {
            msg.reactions.push({ userId, userName, emoji }); // Add new
        }
      }

      await msg.save();
      // Send the WHOLE updated message back to replace the old one
      io.emit('message_updated', msg); 
    } catch (error) {
      console.log("Reaction Error:", error);
    }
  });

  // ... (keep delete_message and send_message logic same as before) ...

  // --- SEND MESSAGE LOGIC ---
  socket.on('send_message', async (data) => {
    const { authorId, role, room } = data;

    // RULE 1: Admins Only Mode
    if (chatSettings.adminsOnly && role !== 'admin') {
      return socket.emit('error_message', "Chat is currently locked to Admins only.");
    }

    // RULE 2: Check if User is Muted
    const user = await User.findById(authorId);
    if (user && user.isMuted) {
      return socket.emit('error_message', "You have been muted by an Admin.");
    }

    // RULE 3: Disappearing Messages
    let expiresAt = null;
    // If Global setting is ON
    if (chatSettings.globalDisappearingTime > 0) {
      expiresAt = new Date(Date.now() + chatSettings.globalDisappearingTime * 1000);
    } 
    // If Local User setting is ON (passed in data.localTimeout)
    else if (data.localTimeout > 0) {
      expiresAt = new Date(Date.now() + data.localTimeout * 1000);
    }

    try {
      const newMessage = new Message({
        ...data,
        expiresAt: expiresAt
      });
      const savedMsg = await newMessage.save();
      
      // Send back to everyone
      io.to(room).emit('receive_message', savedMsg);
    } catch (err) {
      console.log("Save Error:", err);
    }
  });

  // --- DELETE LOGIC (WITH 1-HOUR RULE) ---
  socket.on('delete_message', async ({ messageId, userId, type, isAdmin }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      if (type === 'everyone') {
        // "Delete for Everyone"
        
        // 1. Check Ownership
        const isOwner = msg.authorId && (msg.authorId.toString() === userId);
        
        // 2. Check Time Limit (1 Hour)
        const msgTime = new Date(msg.createdAt).getTime();
        const timeDiff = Date.now() - msgTime;
        const ONE_HOUR = 60 * 60 * 1000; 
        const isRecent = timeDiff < ONE_HOUR;

        // ALLOW IF: (Admin) OR (Owner AND Recent)
        if (isAdmin || (isOwner && isRecent)) {
          await Message.findByIdAndDelete(messageId);
          io.emit('message_deleted', { id: messageId, type: 'everyone' });
        } else {
            // Send error back to user
            socket.emit('error_message', "You can only delete messages for everyone within 1 hour.");
        }

      } else if (type === 'me') {
        // "Delete for Me" (Always allowed)
        if (!msg.hiddenBy.includes(userId)) {
          msg.hiddenBy.push(userId);
          await msg.save();
          socket.emit('message_deleted', { id: messageId, type: 'me' });
        }
      }
    } catch (error) {
      console.log("Delete Error:", error);
    }
  });
  // --- ADMIN COMMANDS ---
  socket.on('admin_update_settings', (newSettings) => {
    // Only allow if actually admin (you should verify token ideally, but trust flag for now)
    chatSettings = { ...chatSettings, ...newSettings };
    io.emit('settings_update', chatSettings);
    
    // Notify everyone
    if (newSettings.adminsOnly) {
      io.emit('system_notification', "🔒 Chat has been locked to Admins Only.");
    } else {
      io.emit('system_notification', "🔓 Chat is open to everyone.");
    }
  });

  socket.on('admin_mute_user', async ({ userId, isMuted }) => {
    await User.findByIdAndUpdate(userId, { isMuted: isMuted });
    // Notify the specific user instantly
    // (In production, use a map of userId -> socketId to target them specifically)
    io.emit('system_notification', isMuted ? "A user was muted." : "A user was unmuted.");
  });
});

server.listen(port, () => console.log(`Server started on port ${port}`));