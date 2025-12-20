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
const User = require('./models/User');
const Razorpay = require('razorpay'); // <--- RESTORED THIS
const crypto = require('crypto');     // <--- RESTORED THIS

const port = process.env.PORT || 5001;

connectDB();
const app = express();

// --- CORS CONFIGURATION ---
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

// --- RESTORED: RAZORPAY CONFIGURATION ---
// This uses your Test Key. If you have it in .env, it uses that instead.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RqD258d3jIqnzq', 
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET_HERE' 
});

// --- GLOBAL CHAT SETTINGS ---
let chatSettings = {
  adminsOnly: false,
  globalDisappearingTime: 0, 
};

// --- FILE UPLOAD SETUP ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.webm';
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl, fileName: req.file.originalname, type: req.file.mimetype });
});

// --- RESTORED: PAYMENT ROUTES ---
// This handles the "Create Order" request from your dashboard
app.post('/api/payment/order', async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100, // Amount in paise
            currency: "INR",
            receipt: "receipt_" + Math.random().toString(36).substring(7),
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).send("Payment Error");
    }
});

app.post('/api/payment/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        
        // Use the Key Secret to verify
        // NOTE: If you are using a specific key secret, make sure it matches your dashboard
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET_HERE')
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            // In a real app, update the Bill status to 'paid' here
            res.json({ status: "success" });
        } else {
            res.status(400).send("Invalid Signature");
        }
    } catch (error) {
        console.error("Verify Error:", error);
        res.status(500).send("Verification Error");
    }
});

// --- CHAT ROUTES ---
app.get('/api/messages/:room/:userId', async (req, res) => {
  try {
    const { room, userId } = req.params;
    const messages = await Message.find({ room, hiddenBy: { $ne: userId } });
    res.json({ messages, settings: chatSettings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/bills', require('./routes/billRoutes')); 
app.use('/api/notices', require('./routes/noticeRoutes')); 
app.use('/api/complaints', require('./routes/complaintRoutes')); 

app.use(errorHandler);

const server = http.createServer(app);

// --- SOCKET.IO ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

io.on('connection', (socket) => {
  // ... (Your Chat Logic remains the same) ...
  console.log(`✅ User Connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    socket.emit('settings_update', chatSettings);
  });

  socket.on('add_reaction', async ({ messageId, userId, userName, emoji }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      const existingIndex = msg.reactions.findIndex((r) => r.userId.toString() === userId && r.emoji === emoji);
      if (existingIndex > -1) {
        msg.reactions.splice(existingIndex, 1);
      } else {
        const userReactionIndex = msg.reactions.findIndex(r => r.userId.toString() === userId);
        if(userReactionIndex > -1) {
            msg.reactions[userReactionIndex].emoji = emoji; 
        } else {
            msg.reactions.push({ userId, userName, emoji });
        }
      }
      await msg.save();
      io.emit('message_updated', msg); 
    } catch (error) { console.log("Reaction Error:", error); }
  });

  socket.on('send_message', async (data) => {
    const { authorId, role, room } = data;
    if (chatSettings.adminsOnly && role !== 'admin') return socket.emit('error_message', "Chat locked.");
    const user = await User.findById(authorId);
    if (user && user.isMuted) return socket.emit('error_message', "You are muted.");

    let expiresAt = null;
    if (chatSettings.globalDisappearingTime > 0) expiresAt = new Date(Date.now() + chatSettings.globalDisappearingTime * 1000);
    else if (data.localTimeout > 0) expiresAt = new Date(Date.now() + data.localTimeout * 1000);

    try {
      const newMessage = new Message({ ...data, expiresAt });
      const savedMsg = await newMessage.save();
      io.to(room).emit('receive_message', savedMsg);
    } catch (err) { console.log("Save Error:", err); }
  });

  socket.on('delete_message', async ({ messageId, userId, type, isAdmin }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      if (type === 'everyone') {
        const isOwner = msg.authorId && (msg.authorId.toString() === userId);
        const isRecent = (Date.now() - new Date(msg.createdAt).getTime()) < (60 * 60 * 1000);
        if (isAdmin || (isOwner && isRecent)) {
          await Message.findByIdAndDelete(messageId);
          io.emit('message_deleted', { id: messageId, type: 'everyone' });
        } else {
            socket.emit('error_message', "Delete for everyone expired.");
        }
      } else if (type === 'me') {
        if (!msg.hiddenBy.includes(userId)) {
          msg.hiddenBy.push(userId);
          await msg.save();
          socket.emit('message_deleted', { id: messageId, type: 'me' });
        }
      }
    } catch (error) { console.log("Delete Error:", error); }
  });

  socket.on('admin_update_settings', (newSettings) => {
    chatSettings = { ...chatSettings, ...newSettings };
    io.emit('settings_update', chatSettings);
    io.emit('system_notification', newSettings.adminsOnly ? "🔒 Chat locked." : "🔓 Chat open.");
  });

  socket.on('admin_mute_user', async ({ userId }) => {
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) return;
    const newStatus = !userToUpdate.isMuted;
    userToUpdate.isMuted = newStatus;
    await userToUpdate.save();
    socket.emit('system_notification', `User ${userToUpdate.name} has been ${newStatus ? 'MUTED' : 'UNMUTED'}.`);
  });
});

server.listen(port, () => console.log(`Server started on port ${port}`));