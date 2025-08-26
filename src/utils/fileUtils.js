const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileUtils {
  // Generate unique filename
  static generateUniqueFilename(originalFilename) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalFilename);
    const sanitizedName = path.basename(originalFilename, ext)
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();

    return `${sanitizedName}-${timestamp}-${random}${ext}`;
  }

  // Ensure directory exists
  static async ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  // Save file with unique name
  static async saveFile(file, uploadDir) {
    try {
      await this.ensureDirectory(uploadDir);

      const uniqueFilename = this.generateUniqueFilename(file.originalname);
      const filePath = path.join(uploadDir, uniqueFilename);

      await fs.writeFile(filePath, file.buffer);

      return {
        filename: uniqueFilename,
        path: filePath,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  // Delete file
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false; // File doesn't exist
      }
      throw error;
    }
  }

  // Get file info
  static async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        extension: path.extname(filePath),
        filename: path.basename(filePath)
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  }

  // Clean old files
  static async cleanOldFiles(directory, maxAge) {
    try {
      const files = await fs.readdir(directory);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          await this.deleteFile(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning old files:', error);
      throw error;
    }
  }

  // Get directory size
  static async getDirectorySize(directory) {
    try {
      const files = await fs.readdir(directory);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile()) {
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error getting directory size:', error);
      throw error;
    }
  }

  // Check if file exists
  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Get file extension
  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  // Check if file type is allowed
  static isAllowedFileType(filename, allowedTypes) {
    const ext = this.getFileExtension(filename);
    return allowedTypes.includes(ext);
  }

  // Format file size
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = FileUtils;