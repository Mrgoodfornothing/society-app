const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  authUser, 
  getMe, 
  googleLogin,
  getResidents // <--- IMPORT THIS
} = require('../controllers/userController'); 

// Import 'admin' middleware along with 'protect'
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', authUser);
router.post('/google-login', googleLogin);
router.get('/me', protect, getMe);

// --- ADD THIS MISSING ROUTE ---
// This tells the server: "When Admin goes to /api/users, run getResidents function"
router.get('/', protect, admin, getResidents); 
// ------------------------------

module.exports = router;