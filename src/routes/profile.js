const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadProfilePicture, upload } = require('../controllers/profileController');
const { authenticateAdmin } = require('../middleware/auth');

// All profile routes require authentication
router.use(authenticateAdmin);

// Get current user profile
router.get('/', getProfile);

// Update user profile
router.put('/', updateProfile);

// Upload profile picture
router.post('/upload-picture', upload.single('profile_picture'), uploadProfilePicture);

module.exports = router;