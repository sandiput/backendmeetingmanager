const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Attachment } = require('../models');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine directory based on file category from request body
    const fileCategory = req.body.fileCategory || 'attachment';
    const subDir = fileCategory === 'photo' ? 'photos' : 'attachments';
    const uploadDir = path.join(__dirname, `../../uploads/${subDir}`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept all file types for now
    cb(null, true);
  }
});



// Upload attachment
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { meetingId, fileCategory = 'attachment' } = req.body;
    
    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID is required'
      });
    }

    // Validate file category
    if (!['attachment', 'photo'].includes(fileCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file category'
      });
    }

    // Create relative path for database storage
    const subDir = fileCategory === 'photo' ? 'photos' : 'attachments';
    const relativePath = `uploads/${subDir}/${req.file.filename}`;
    
    const attachment = await Attachment.create({
      meeting_id: meetingId,
      original_filename: req.file.originalname,
      filename: req.file.filename,
      file_path: relativePath,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      file_category: fileCategory
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: attachment.id,
        original_filename: attachment.original_filename,
        file_size: attachment.file_size,
        file_type: attachment.file_type,
        file_category: attachment.file_category,
        file_url: `/api/attachments/download/${attachment.id}`,
        uploaded_at: attachment.created_at
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
});

// Get attachments by meeting ID
router.get('/meeting/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { category } = req.query; // Optional filter by category
    
    const whereClause = { meeting_id: meetingId };
    if (category && ['attachment', 'photo'].includes(category)) {
      whereClause.file_category = category;
    }
    
    const meetingAttachments = await Attachment.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: meetingAttachments.map(att => ({
        id: att.id,
        meeting_id: att.meeting_id,
        original_filename: att.original_filename,
        filename: att.filename,
        file_path: att.file_path,
        file_size: att.file_size,
        file_type: att.file_type,
        file_category: att.file_category,
        file_url: `/api/attachments/download/${att.id}`,
        uploaded_at: att.created_at
      }))
    });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attachments',
      error: error.message
    });
  }
});

// Download attachment
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const attachment = await Attachment.findByPk(id);
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Convert relative path to absolute path
    const absolutePath = path.join(__dirname, '../../', attachment.file_path);
    
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_filename}"`);
    res.setHeader('Content-Type', attachment.file_type);
    
    const fileStream = fs.createReadStream(absolutePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
});

// Delete attachment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const attachment = await Attachment.findByPk(id);
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }
    
    // Delete file from disk
    const absolutePath = path.join(__dirname, '../../', attachment.file_path);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
    
    // Remove from database
    await attachment.destroy();

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
      error: error.message
    });
  }
});

module.exports = router;