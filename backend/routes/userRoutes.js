// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, authUser } = require('../controllers/userController');

// This handles the Registration
router.post('/', registerUser);

// This handles the Login
router.post('/login', authUser);

module.exports = router;