const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/messageModel'); // <--- NEW: Import Model

const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- NEW: Route to get old messages ---
app.get('/api/messages/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// --------------------------------------

// Existing Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));

app.get('/', (req, res) => res.send('Server is ready'));

app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('join_room', (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on('send_message', async (data) => { // <--- Make this async
    // 1. Save to Database (NEW)
    try {
      const newMessage = new Message(data);
      await newMessage.save();
    } catch (err) {
      console.log("Error saving message:", err);
    }

    // 2. Broadcast to others
    socket.to(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

server.listen(port, () => console.log(`Server started on port ${port}`));