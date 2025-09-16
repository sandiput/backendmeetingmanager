const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateAdmin, requireAdminRole } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/rateLimiter');

// Apply authentication middleware to all routes
router.use(authenticateAdmin);

// Apply rate limiting
router.use(rateLimiters.api);

// GET /api/users - Get all users with pagination and search
router.get('/', 
  requireAdminRole(['super_admin', 'admin']),
  userController.getAllUsers
);

// GET /api/users/stats - Get user statistics
router.get('/stats',
  requireAdminRole(['super_admin', 'admin']),
  userController.getUserStats
);

// GET /api/users/:id - Get single user by ID
router.get('/:id',
  requireAdminRole(['super_admin', 'admin']),
  userController.getUserById
);

// POST /api/users - Create new user
router.post('/',
  requireAdminRole(['super_admin']), // Only super admin can create users
  userController.createUser
);

// PUT /api/users/:id - Update user
router.put('/:id',
  requireAdminRole(['super_admin']), // Only super admin can update users
  userController.updateUser
);

// PUT /api/users/:id/password - Update user password
router.put('/:id/password',
  requireAdminRole(['super_admin']), // Only super admin can change passwords
  userController.updateUserPassword
);

// DELETE /api/users/:id - Delete user
router.delete('/:id',
  requireAdminRole(['super_admin']), // Only super admin can delete users
  userController.deleteUser
);

module.exports = router;