const dotenv = require('dotenv');
dotenv.config(); // <--- MUST BE THE FIRST LINE EXECUTED

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const billRoutes = require('./routes/billRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const noticeRoutes = require('./routes/noticeRoutes');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notices', noticeRoutes);

app.get('/', (req, res) => {
  res.send('Society App Backend is Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});