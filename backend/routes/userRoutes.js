const express = require('express');
const router = express.Router();
const { 
  registerUser, authUser, getMe, googleLogin, getResidents, getAllUsers, updateUserProfile 
} = require('../controllers/userController'); 
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', authUser);
router.post('/google-login', googleLogin);
router.get('/me', protect, getMe);
router.get('/', protect, admin, getResidents); // Or getAllUsers depending on your naming

// NEW: Profile Update Route
router.put('/profile', protect, updateUserProfile);

module.exports = router;