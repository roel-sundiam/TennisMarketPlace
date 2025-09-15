import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base uploads directory inside public folder
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log('✅ Created uploads directory');
  }
};

// Ensure folder exists within uploads directory
const ensureFolder = async (folder) => {
  const folderPath = path.join(UPLOADS_DIR, folder);
  try {
    await fs.access(folderPath);
  } catch {
    await fs.mkdir(folderPath, { recursive: true });
  }
  return folderPath;
};

// Upload file to local storage
export const uploadToLocalStorage = async (buffer, fileName, contentType, folder = 'products') => {
  try {
    await ensureUploadsDir();
    const folderPath = await ensureFolder(folder);
    const filePath = path.join(folderPath, fileName);
    
    // Write file to disk
    await fs.writeFile(filePath, buffer);
    
    // Generate public URL (served by Express static middleware)
    // Use full URL with backend server address for frontend consumption
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const publicUrl = `${baseUrl}/uploads/${folder}/${fileName}`;
    
    console.log('✅ File uploaded successfully:', fileName);
    return {
      url: publicUrl,
      fileName,
      size: buffer.length,
      contentType,
      path: filePath
    };
  } catch (error) {
    console.error('❌ Error uploading to local storage:', error);
    throw error;
  }
};

// Delete file from local storage
export const deleteFromLocalStorage = async (fileName, folder = 'products') => {
  try {
    const filePath = path.join(UPLOADS_DIR, folder, fileName);
    await fs.unlink(filePath);
    console.log('✅ File deleted successfully:', fileName);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('⚠️  File not found:', fileName);
      return false;
    }
    console.error('❌ Error deleting from local storage:', error);
    throw error;
  }
};

// Generate a unique filename
export const generateFileName = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop().toLowerCase();
  
  return `${prefix}${prefix ? '_' : ''}${timestamp}_${random}.${extension}`;
};

// Validate image file
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  return true;
};

// Process image buffer (basic implementation - for production consider using sharp)
export const processImageBuffer = (buffer, maxWidth = 800, quality = 80) => {
  // For now, return the original buffer
  // In production, you would use a library like sharp to resize and optimize
  return buffer;
};

// Get uploads directory info
export const getUploadsInfo = async () => {
  try {
    await ensureUploadsDir();
    const stats = await fs.stat(UPLOADS_DIR);
    
    // Get folder sizes
    const folders = ['products', 'profiles', 'temp'];
    const folderInfo = {};
    
    for (const folder of folders) {
      const folderPath = path.join(UPLOADS_DIR, folder);
      try {
        const files = await fs.readdir(folderPath);
        folderInfo[folder] = {
          fileCount: files.length,
          exists: true
        };
      } catch {
        folderInfo[folder] = {
          fileCount: 0,
          exists: false
        };
      }
    }
    
    return {
      uploadsDir: UPLOADS_DIR,
      created: stats.birthtime,
      folders: folderInfo
    };
  } catch (error) {
    console.error('Error getting uploads info:', error);
    return null;
  }
};

export default {
  uploadToLocalStorage,
  deleteFromLocalStorage,
  generateFileName,
  validateImageFile,
  processImageBuffer,
  getUploadsInfo
};