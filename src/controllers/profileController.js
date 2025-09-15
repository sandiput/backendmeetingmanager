const Admin = require('../models/admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/profiles');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: admin.toJSON()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { full_name, username, email, whatsapp_number, password } = req.body;
    const admin = await Admin.findByPk(req.admin.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if username or email already exists (excluding current user)
    if (username && username !== admin.username) {
      const existingUsername = await Admin.findOne({
        where: { username },
        attributes: ['id']
      });
      if (existingUsername && existingUsername.id !== admin.id) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    if (email && email !== admin.email) {
      const existingEmail = await Admin.findOne({
        where: { email },
        attributes: ['id']
      });
      if (existingEmail && existingEmail.id !== admin.id) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update fields
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (whatsapp_number) updateData.whatsapp_number = whatsapp_number;
    if (password) updateData.password = password; // Will be hashed by model hook

    await admin.update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: admin.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const admin = await Admin.findByPk(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture if exists
    if (admin.profile_picture) {
      const oldImagePath = path.join(__dirname, '../../uploads/profiles', path.basename(admin.profile_picture));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update profile picture path
    const profilePicturePath = `uploads/profiles/${req.file.filename}`;
    await admin.update({ profile_picture: profilePicturePath });

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profile_picture: profilePicturePath
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  upload
};