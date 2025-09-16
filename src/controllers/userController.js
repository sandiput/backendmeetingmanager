const { Admin } = require('../models');
const { AppError, catchAsync } = require('../utils/logger');
const { validateUserData } = require('../utils/validator');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Get all users with pagination
const getAllUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  const whereClause = {};
  if (search) {
    whereClause[Op.or] = [
      { username: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { full_name: { [Op.like]: `%${search}%` } }
    ];
  }

  const { count, rows } = await Admin.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['password'] }
  });

  res.json({
    success: true,
    data: {
      users: rows,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: limit
      }
    }
  });
});

// Get single user by ID
const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await Admin.findByPk(id, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
});

// Create new user
const createUser = catchAsync(async (req, res) => {
  const { username, email, password, full_name, role, whatsapp_number, is_active } = req.body;

  // Validate input data
  const validation = validateUserData(req.body);
  if (validation.length > 0) {
    throw new AppError(`Validation errors: ${validation.join(', ')}`, 400);
  }

  // Check if username or email already exists
  const existingUser = await Admin.findOne({
    where: {
      [Op.or]: [
        { username },
        { email }
      ]
    }
  });

  if (existingUser) {
    throw new AppError('Username or email already exists', 400);
  }

  // Create new user
  const newUser = await Admin.create({
    username,
    email,
    password,
    full_name,
    role: role || 'admin',
    whatsapp_number,
    is_active: is_active !== undefined ? is_active : true
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser
  });
});

// Update user
const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { username, email, full_name, role, whatsapp_number, is_active } = req.body;

  const user = await Admin.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if username or email already exists (excluding current user)
  if (username || email) {
    const whereClause = {
      id: { [Op.ne]: id }
    };

    if (username && email) {
      whereClause[Op.or] = [
        { username },
        { email }
      ];
    } else if (username) {
      whereClause.username = username;
    } else if (email) {
      whereClause.email = email;
    }

    const existingUser = await Admin.findOne({ where: whereClause });
    if (existingUser) {
      throw new AppError('Username or email already exists', 400);
    }
  }

  // Update user data
  const updateData = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (full_name) updateData.full_name = full_name;
  if (role) updateData.role = role;
  if (whatsapp_number !== undefined) updateData.whatsapp_number = whatsapp_number;
  if (is_active !== undefined) updateData.is_active = is_active;

  await user.update(updateData);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

// Update user password
const updateUserPassword = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { password, confirm_password } = req.body;

  if (!password || !confirm_password) {
    throw new AppError('Password and confirm password are required', 400);
  }

  if (password !== confirm_password) {
    throw new AppError('Passwords do not match', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  const user = await Admin.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await user.update({ password });

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

// Delete user
const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Prevent deleting current user
  if (req.user && req.user.id === id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  const user = await Admin.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await user.destroy();

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Get user statistics
const getUserStats = catchAsync(async (req, res) => {
  const totalUsers = await Admin.count();
  const activeUsers = await Admin.count({ where: { is_active: true } });
  const inactiveUsers = totalUsers - activeUsers;
  
  const superAdmins = await Admin.count({ where: { role: 'super_admin' } });
  const admins = await Admin.count({ where: { role: 'admin' } });

  const recentUsers = await Admin.findAll({
    limit: 5,
    order: [['created_at', 'DESC']],
    attributes: ['id', 'username', 'full_name', 'created_at', 'is_active']
  });

  res.json({
    success: true,
    data: {
      total_users: totalUsers,
      active_users: activeUsers,
      inactive_users: inactiveUsers,
      super_admins: superAdmins,
      admins: admins,
      recent_users: recentUsers
    }
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getUserStats
};