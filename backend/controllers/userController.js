const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Bill = require('../models/Bill'); // Import Bill for welcome gift

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, flatNumber, phone } = req.body;

  if (!name || !email || !password || !flatNumber || !phone) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    flatNumber,
    phone,
    role: 'resident' 
  });

  if (user) {
    // Auto-create Welcome Bill
    await Bill.create({
      resident: user._id,
      title: 'Welcome Maintenance Bill (Demo)',
      amount: 1500,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      status: 'pending'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get all residents
// @route   GET /api/users
// @access  Private/Admin
const getResidents = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'resident' }).select('-password');
  res.json(users);
});

// @desc    Auth with Google
// @route   POST /api/users/google-login
// @access  Public
const googleLogin = async (req, res) => {
  const { email, name, googlePhoto } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      // User exists -> Log in
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        flatNumber: user.flatNumber,
        token: generateToken(user._id),
      });
    } else {
      // User doesn't exist -> Register
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      const newUser = await User.create({
        name,
        email,
        password: randomPassword, 
        flatNumber: 'Not Assigned',
        phone: '0000000000', // Default phone for Google users
        role: 'resident'
      });

      if (newUser) {
        // Welcome Bill
        await Bill.create({
          resident: newUser._id,
          title: 'Welcome Maintenance Bill',
          amount: 1000,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
          status: 'pending'
        });

        res.status(201).json({
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          flatNumber: newUser.flatNumber,
          token: generateToken(newUser._id),
        });
      }
    }
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(400).json({ message: 'Google Login Failed' });
  }
};

module.exports = { registerUser, authUser, getResidents, googleLogin };