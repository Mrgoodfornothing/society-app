// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, authUser, getResidents, googleLogin } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// This handles the Registration
router.post('/', registerUser);

// This handles the Login
router.post('/login', authUser);

router.get('/', protect, admin, getResidents);

router.post('/google-login', googleLogin); // <--- Add this

module.exports = router;