const express = require('express');
const router = express.Router();
const { 
  loginAdmin, 
  logoutAdmin, 
  getCurrentAdmin, 
  checkAuthStatus, 
  changePassword 
} = require('../controllers/authController');
const { 
  authenticateAdmin, 
  checkAdminAuthStatus 
} = require('../middleware/auth');
const { adminValidation } = require('../middleware/validator');

// Routes use adminValidation from validator middleware

// Public routes
router.post('/login', adminValidation.login, loginAdmin);
router.post('/logout', logoutAdmin);
router.get('/status', checkAdminAuthStatus, checkAuthStatus);

// Protected routes (require authentication)
router.get('/me', authenticateAdmin, getCurrentAdmin);
router.post('/change-password', authenticateAdmin, adminValidation.changePassword, changePassword);

// Test route to check if admin is authenticated
router.get('/test', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin authenticated successfully',
    admin: {
      id: req.admin.id,
      username: req.admin.username,
      role: req.admin.role
    }
  });
});

module.exports = router;