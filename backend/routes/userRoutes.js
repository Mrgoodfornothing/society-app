const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  authUser, 
  getMe, 
  googleLogin // <--- Import the correct function name
} = require('../controllers/userController'); 

const { protect } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', authUser);
router.post('/google-login', googleLogin); // <--- FIXED: Matches Frontend URL
router.get('/me', protect, getMe);

module.exports = router;