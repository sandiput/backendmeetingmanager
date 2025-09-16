const Admin = require('../models/admin');
const { AppError } = require('../utils/logger');
const { Op } = require('sequelize');

// Get all admins with pagination and search
const getAllAdmins = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause for search
    const whereClause = search ? {
      [Op.or]: [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    // Get admins with pagination
    const { count, rows: admins } = await Admin.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['password'] } // Exclude password from response
    });

    res.status(200).json({
      success: true,
      data: {
        admins: admins.map(admin => {
          const adminObj = admin.toJSON();
          return {
            ...adminObj,
            ip_address: adminObj.ip_address // pastikan field ip_address ikut di response
          };
        }),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all admins error:', error);
    next(new AppError('Terjadi kesalahan saat mengambil data admin.', 500));
  }
};

// Get admin by ID
const getAdminById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!admin) {
      return next(new AppError('Admin tidak ditemukan.', 404));
    }

    res.status(200).json({
      success: true,
      data: { admin }
    });

  } catch (error) {
    console.error('Get admin by ID error:', error);
    next(new AppError('Terjadi kesalahan saat mengambil data admin.', 500));
  }
};

// Create new admin
const createAdmin = async (req, res, next) => {
  try {
    const { username, email, password, full_name, role = 'admin', whatsapp_number } = req.body;

    // Validation
    if (!username || !email || !password || !full_name) {
      return next(new AppError('Username, email, password, dan nama lengkap harus diisi.', 400));
    }

    // Check if username or email already exists
    const existingAdmin = await Admin.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingAdmin) {
      return next(new AppError('Username atau email sudah digunakan.', 400));
    }

    // Create new admin
    const newAdmin = await Admin.create({
      username,
      email,
      password,
      full_name,
      role,
      whatsapp_number,
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: 'Admin berhasil dibuat.',
      data: {
        admin: {
          id: newAdmin.id,
          username: newAdmin.username,
          email: newAdmin.email,
          full_name: newAdmin.full_name,
          role: newAdmin.role,
          whatsapp_number: newAdmin.whatsapp_number,
          is_active: newAdmin.is_active,
          created_at: newAdmin.created_at
        }
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    if (error.name === 'SequelizeValidationError') {
      return next(new AppError('Data tidak valid: ' + error.errors.map(e => e.message).join(', '), 400));
    }
    next(new AppError('Terjadi kesalahan saat membuat admin.', 500));
  }
};

// Update admin
const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, role, whatsapp_number, is_active } = req.body;

    // Find admin
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return next(new AppError('Admin tidak ditemukan.', 404));
    }

    // Check if username or email already exists (excluding current admin)
    if (username || email) {
      const whereClause = {
        id: { [Op.ne]: id }
      };

      if (username && email) {
        whereClause[Op.or] = [{ username }, { email }];
      } else if (username) {
        whereClause.username = username;
      } else if (email) {
        whereClause.email = email;
      }

      const existingAdmin = await Admin.findOne({ where: whereClause });
      if (existingAdmin) {
        return next(new AppError('Username atau email sudah digunakan.', 400));
      }
    }

    // Update admin
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role !== undefined) updateData.role = role;
    if (whatsapp_number !== undefined) updateData.whatsapp_number = whatsapp_number;
    if (is_active !== undefined) updateData.is_active = is_active;

    await admin.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Admin berhasil diperbarui.',
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          full_name: admin.full_name,
          role: admin.role,
          whatsapp_number: admin.whatsapp_number,
          is_active: admin.is_active,
          updated_at: admin.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Update admin error:', error);
    if (error.name === 'SequelizeValidationError') {
      return next(new AppError('Data tidak valid: ' + error.errors.map(e => e.message).join(', '), 400));
    }
    next(new AppError('Terjadi kesalahan saat memperbarui admin.', 500));
  }
};

// Delete admin
const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find admin
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return next(new AppError('Admin tidak ditemukan.', 404));
    }

    // Prevent deleting current logged in admin
    if (req.admin && req.admin.id === id) {
      return next(new AppError('Tidak dapat menghapus akun yang sedang digunakan.', 400));
    }

    // Delete admin
    await admin.destroy();

    res.status(200).json({
      success: true,
      message: 'Admin berhasil dihapus.'
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    next(new AppError('Terjadi kesalahan saat menghapus admin.', 500));
  }
};

// Update admin password
const updateAdminPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return next(new AppError('Password harus diisi.', 400));
    }

    if (password.length < 6) {
      return next(new AppError('Password minimal 6 karakter.', 400));
    }

    // Find admin
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return next(new AppError('Admin tidak ditemukan.', 404));
    }

    // Update password
    await admin.update({ password });

    res.status(200).json({
      success: true,
      message: 'Password admin berhasil diperbarui.'
    });

  } catch (error) {
    console.error('Update admin password error:', error);
    next(new AppError('Terjadi kesalahan saat memperbarui password admin.', 500));
  }
};

// Toggle admin status (activate/deactivate)
const toggleAdminStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find admin
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return next(new AppError('Admin tidak ditemukan.', 404));
    }

    // Prevent deactivating current logged in admin
    if (req.admin && req.admin.id === id && admin.is_active) {
      return next(new AppError('Tidak dapat menonaktifkan akun yang sedang digunakan.', 400));
    }

    // Toggle status
    await admin.update({ is_active: !admin.is_active });

    res.status(200).json({
      success: true,
      message: `Admin berhasil ${admin.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`,
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          is_active: admin.is_active
        }
      }
    });

  } catch (error) {
    console.error('Toggle admin status error:', error);
    next(new AppError('Terjadi kesalahan saat mengubah status admin.', 500));
  }
};

module.exports = {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  updateAdminPassword,
  toggleAdminStatus
};