const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const { AppError } = require('../utils/logger');

// Login admin
const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
      return next(new AppError('Username dan password harus diisi.', 400));
    }

    // Get client IP address
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';

    // Autentikasi admin
    const admin = await Admin.authenticate(username, password, ipAddress);
    
    if (!admin) {
      return next(new AppError('Username atau password salah.', 401));
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin.id,
        username: admin.username,
        role: admin.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    );

    // Set HttpOnly cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/'
    });

    // Response sukses
    res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          full_name: admin.full_name,
          role: admin.role,
          whatsapp_number: admin.whatsapp_number,
          profile_picture: admin.profile_picture,
          last_login: admin.last_login,
          ip_address: admin.ip_address
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    next(new AppError('Terjadi kesalahan saat login.', 500));
  }
};

// Logout admin
const logoutAdmin = async (req, res, next) => {
  try {
    // Clear HttpOnly cookie
    res.clearCookie('admin_token', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    });

    res.status(200).json({
      success: true,
      message: 'Logout berhasil.'
    });

  } catch (error) {
    console.error('Logout error:', error);
    next(new AppError('Terjadi kesalahan saat logout.', 500));
  }
};

// Get current admin profile
const getCurrentAdmin = async (req, res, next) => {
  try {
    if (!req.admin) {
      return next(new AppError('Admin tidak ditemukan.', 401));
    }

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: req.admin.id,
          username: req.admin.username,
          email: req.admin.email,
          full_name: req.admin.full_name,
          role: req.admin.role,
          whatsapp_number: req.admin.whatsapp_number,
          profile_picture: req.admin.profile_picture,
          last_login: req.admin.last_login
        }
      }
    });

  } catch (error) {
    console.error('Get current admin error:', error);
    next(new AppError('Terjadi kesalahan saat mengambil data admin.', 500));
  }
};

// Check auth status
const checkAuthStatus = async (req, res, next) => {
  try {
    const isAuthenticated = !!req.admin;
    
    res.status(200).json({
      success: true,
      data: {
        isAuthenticated,
        admin: isAuthenticated ? {
          id: req.admin.id,
          username: req.admin.username,
          email: req.admin.email,
          full_name: req.admin.full_name,
          role: req.admin.role,
          whatsapp_number: req.admin.whatsapp_number,
          profile_picture: req.admin.profile_picture
        } : null
      }
    });

  } catch (error) {
    console.error('Check auth status error:', error);
    next(new AppError('Terjadi kesalahan saat memeriksa status autentikasi.', 500));
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validasi input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new AppError('Semua field password harus diisi.', 400));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError('Password baru dan konfirmasi password tidak cocok.', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('Password baru minimal 6 karakter.', 400));
    }

    // Verifikasi password lama
    const isValidPassword = await req.admin.validatePassword(currentPassword);
    if (!isValidPassword) {
      return next(new AppError('Password lama tidak benar.', 400));
    }

    // Update password
    await req.admin.update({ password: newPassword });

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    next(new AppError('Terjadi kesalahan saat mengubah password.', 500));
  }
};

module.exports = {
  loginAdmin,
  logoutAdmin,
  getCurrentAdmin,
  checkAuthStatus,
  changePassword
};