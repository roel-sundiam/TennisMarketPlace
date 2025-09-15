import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import {
  uploadToSupabaseStorage,
  deleteFromSupabaseStorage,
  generateFileName,
  validateImageFile,
  processImageBuffer,
  getSupabaseStorageInfo
} from '../services/supabaseStorage.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    try {
      validateImageFile(file);
      cb(null, true);
    } catch (error) {
      cb(new Error(error.message), false);
    }
  }
});

// POST /api/upload/image - Upload single image
router.post('/image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { folder = 'products' } = req.body;
    const allowedFolders = ['products', 'profiles', 'temp'];
    
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({ error: 'Invalid folder specified' });
    }

    // Generate unique filename
    const fileName = generateFileName(req.file.originalname, req.user._id.toString());
    
    // Process image (resize/optimize if needed)
    const processedBuffer = processImageBuffer(req.file.buffer);
    
    // Upload to Supabase storage
    const uploadResult = await uploadToSupabaseStorage(
      processedBuffer,
      fileName,
      req.file.mimetype,
      folder
    );

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      urls: [uploadResult.url],
      fileNames: [uploadResult.fileName],
      image: uploadResult
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    
    if (error.message.includes('Supabase')) {
      return res.status(503).json({ error: 'Image storage service unavailable' });
    }
    
    res.status(400).json({ error: error.message });
  }
});

// POST /api/upload/images - Upload multiple images
router.post('/images', authenticate, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const { folder = 'products' } = req.body;
    const allowedFolders = ['products', 'profiles', 'temp'];
    
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({ error: 'Invalid folder specified' });
    }

    const uploadPromises = req.files.map(async (file) => {
      try {
        const fileName = generateFileName(file.originalname, req.user._id.toString());
        const processedBuffer = processImageBuffer(file.buffer);
        
        return await uploadToSupabaseStorage(
          processedBuffer,
          fileName,
          file.mimetype,
          folder
        );
      } catch (error) {
        return { error: error.message, originalName: file.originalname };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    // Separate successful uploads from errors
    const successful = results.filter(result => !result.error);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      console.warn('Some uploads failed:', errors);
    }

    res.json({
      success: true,
      message: `${successful.length} of ${req.files.length} images uploaded successfully`,
      urls: successful.map(img => img.url),
      fileNames: successful.map(img => img.fileName),
      images: successful,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// DELETE /api/upload/image/:fileName - Delete image
router.delete('/image/:fileName', authenticate, async (req, res) => {
  try {
    const { fileName } = req.params;
    const { folder = 'products' } = req.query;
    
    // Basic security check - ensure user can only delete their own files
    if (!fileName.includes(req.user._id.toString())) {
      return res.status(403).json({ error: 'You can only delete your own files' });
    }

    await deleteFromSupabaseStorage(fileName, folder);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    
    if (error.code === 404) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// GET /api/upload/health - Check upload service health
router.get('/health', async (req, res) => {
  try {
    const storageInfo = await getSupabaseStorageInfo();

    res.json({
      status: 'OK',
      storage: 'Supabase Storage',
      bucket: storageInfo.bucket,
      connected: storageInfo.connected,
      filesInProducts: storageInfo.filesInProducts,
      supabaseUrl: storageInfo.supabaseUrl,
      maxFileSize: '5MB',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxFiles: 10
    });
  } catch (error) {
    res.json({
      status: 'ERROR',
      storage: 'Supabase Storage',
      maxFileSize: '5MB',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxFiles: 10,
      error: 'Could not connect to Supabase Storage'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  if (error.message) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

export default router;