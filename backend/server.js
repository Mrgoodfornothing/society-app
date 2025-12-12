const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/messageModel');

//const port = process.env.PORT || 5000;
// backend/server.js
const port = process.env.PORT || 5001; // Change 5000 to 5001

connectDB();
const app = express();

// 1. Allow CORS for both Express (API) and Socket.io
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 2. Route to Fetch Old Messages
app.get('/api/messages/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room });
    res.json(messages);
  } catch (error) {
    console.log("Error fetching messages:", error);
    res.status(500).json({ message: error.message });
  }
});

// Existing Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));

app.use(errorHandler);

// 3. Socket.io Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all frontends (dev mode)
    methods: ["GET", "POST"],
  },
});

io.on('connection', (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('send_message', async (data) => {
    console.log("📩 Message received on server:", data);

    // Save to MongoDB
    try {
      const newMessage = new Message(data);
      await newMessage.save();
      console.log("💾 Message saved to DB");
    } catch (err) {
      console.log("❌ Error saving to DB:", err);
    }

    // Broadcast to others in the room
    socket.to(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ User Disconnected', socket.id);
  });
});

server.listen(port, () => console.log(`Server started on port ${port}`));