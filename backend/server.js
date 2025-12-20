const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/messageModel');
const User = require('./models/User'); // Import User model

const port = process.env.PORT || 5001;

connectDB();
const app = express();

// --- CORS CONFIGURATION ---
// Update CORS to allow your frontend URLs (Local + Vercel)
// IMPORTANT: Do NOT add a trailing slash '/' at the end of URLs
const allowedOrigins = [
  "http://localhost:5173", 
  "https://society-app-dusky.vercel.app" 
];

app.use(cors({
  origin: allowedOrigins,
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

// --- FILE UPLOAD SETUP ---
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Storage (Smart Extension Handling)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Fix: Ensure we preserve the valid extension
        // This is critical for Audio/Video playback
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.webm'; // Default to webm if blob is unnamed
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage });

// Serve Uploads Folder Statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');
    
    // Return the URL to the frontend
    // NOTE: In production (Render Free Tier), files in 'uploads' might disappear on sleep.
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl, fileName: req.file.originalname, type: req.file.mimetype });
});
// -------------------------

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
app.use('/api/bills', require('./routes/billRoutes')); // Ensure you have this
app.use('/api/notices', require('./routes/noticeRoutes')); // Ensure you have this
app.use('/api/complaints', require('./routes/complaintRoutes')); // Ensure you have this

app.use(errorHandler);

const server = http.createServer(app);

// --- SOCKET.IO CONFIGURATION ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

io.on('connection', (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    // Send current settings to the user who just joined
    socket.emit('settings_update', chatSettings);
  });

  // --- REACTION LOGIC ---
  socket.on('add_reaction', async ({ messageId, userId, userName, emoji }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      // Check if user already reacted with this emoji (Toggle)
      const existingIndex = msg.reactions.findIndex(
        (r) => r.userId.toString() === userId && r.emoji === emoji
      );

      if (existingIndex > -1) {
        msg.reactions.splice(existingIndex, 1); // Remove
      } else {
        // Optional: Replace previous reaction from this user so they only have 1
        const userReactionIndex = msg.reactions.findIndex(r => r.userId.toString() === userId);
        if(userReactionIndex > -1) {
            msg.reactions[userReactionIndex].emoji = emoji; // Update existing
        } else {
            msg.reactions.push({ userId, userName, emoji }); // Add new
        }
      }

      await msg.save();
      io.emit('message_updated', msg); 
    } catch (error) {
      console.log("Reaction Error:", error);
    }
  });

  // --- SEND MESSAGE LOGIC ---
  socket.on('send_message', async (data) => {
    const { authorId, role, room } = data;

    // RULE 1: Admins Only Mode
    if (chatSettings.adminsOnly && role !== 'admin') {
      return socket.emit('error_message', "Chat is currently locked to Admins only.");
    }

    // RULE 2: Check if User is Muted
    // We check the DB every time to ensure Ban is instant
    const user = await User.findById(authorId);
    if (user && user.isMuted) {
      return socket.emit('error_message', "You have been muted by an Admin.");
    }

    // RULE 3: Disappearing Messages
    let expiresAt = null;
    if (chatSettings.globalDisappearingTime > 0) {
      expiresAt = new Date(Date.now() + chatSettings.globalDisappearingTime * 1000);
    } else if (data.localTimeout > 0) {
      expiresAt = new Date(Date.now() + data.localTimeout * 1000);
    }

    try {
      const newMessage = new Message({
        ...data,
        expiresAt: expiresAt
      });
      const savedMsg = await newMessage.save();
      
      io.to(room).emit('receive_message', savedMsg);
    } catch (err) {
      console.log("Save Error:", err);
    }
  });

  // --- DELETE LOGIC ---
  socket.on('delete_message', async ({ messageId, userId, type, isAdmin }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      if (type === 'everyone') {
        // "Delete for Everyone"
        const isOwner = msg.authorId && (msg.authorId.toString() === userId);
        
        // 1 Hour Limit Check
        const msgTime = new Date(msg.createdAt).getTime();
        const timeDiff = Date.now() - msgTime;
        const ONE_HOUR = 60 * 60 * 1000; 
        const isRecent = timeDiff < ONE_HOUR;

        // Admin can delete ANYTHING. Users can delete OWN RECENT messages.
        if (isAdmin || (isOwner && isRecent)) {
          await Message.findByIdAndDelete(messageId);
          io.emit('message_deleted', { id: messageId, type: 'everyone' });
        } else {
            socket.emit('error_message', "You can only delete messages for everyone within 1 hour.");
        }

      } else if (type === 'me') {
        // "Delete for Me"
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

  // --- ADMIN SETTINGS ---
  socket.on('admin_update_settings', (newSettings) => {
    chatSettings = { ...chatSettings, ...newSettings };
    io.emit('settings_update', chatSettings);
    
    if (newSettings.adminsOnly) {
      io.emit('system_notification', "🔒 Chat has been locked to Admins Only.");
    } else {
      io.emit('system_notification', "🔓 Chat is open to everyone.");
    }
  });

  // --- ADMIN BAN/UNBAN (TOGGLE) ---
  socket.on('admin_mute_user', async ({ userId }) => {
    try {
      console.log(`🔒 Admin is trying to ban/unban User ID: ${userId}`);
      
      const userToUpdate = await User.findById(userId);
      
      if (!userToUpdate) {
        console.log("❌ User not found!");
        return;
      }

      // TOGGLE STATUS: If true -> make false. If false -> make true.
      const newStatus = !userToUpdate.isMuted;
      
      userToUpdate.isMuted = newStatus;
      await userToUpdate.save();

      console.log(`✅ Success! User ${userToUpdate.name} isMuted set to: ${newStatus}`);

      // Notify everyone (or just admin)
      socket.emit('system_notification', `User ${userToUpdate.name} has been ${newStatus ? 'MUTED 🔴' : 'UNMUTED 🟢'}.`);

    } catch (error) {
      console.log("❌ Ban Error:", error);
    }
  });
});

server.listen(port, () => console.log(`Server started on port ${port}`));