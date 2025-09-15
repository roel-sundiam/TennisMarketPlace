import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = 'https://tzetbsokiwdcxpxjklmk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6ZXRic29raXdkY3hweGprbG1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzkyNzIxOSwiZXhwIjoyMDczNTAzMjE5fQ.-m0R-JIjkYppmIaY-J0qbAQbDqW1xuNkbv5QutAIfxU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Storage bucket name
const STORAGE_BUCKET = 'product-images';

// Upload file to Supabase Storage
export const uploadToSupabaseStorage = async (buffer, fileName, contentType, folder = 'products') => {
  try {
    const filePath = `${folder}/${fileName}`;

    console.log(`🔄 Uploading file to Supabase: ${filePath}`);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType,
        upsert: false // Don't overwrite existing files
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    console.log('✅ File uploaded successfully to Supabase:', fileName);

    return {
      url: publicUrl,
      fileName,
      size: buffer.length,
      contentType,
      path: filePath,
      bucket: STORAGE_BUCKET
    };
  } catch (error) {
    console.error('❌ Error uploading to Supabase storage:', error);
    throw error;
  }
};

// Delete file from Supabase Storage
export const deleteFromSupabaseStorage = async (fileName, folder = 'products') => {
  try {
    const filePath = `${folder}/${fileName}`;

    console.log(`🗑️  Deleting file from Supabase: ${filePath}`);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('❌ Supabase delete error:', error);
      if (error.message.includes('not found')) {
        console.warn('⚠️  File not found in Supabase storage:', fileName);
        return false;
      }
      throw new Error(`Supabase delete failed: ${error.message}`);
    }

    console.log('✅ File deleted successfully from Supabase:', fileName);
    return true;
  } catch (error) {
    console.error('❌ Error deleting from Supabase storage:', error);
    throw error;
  }
};

// Generate a unique filename
export const generateFileName = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(6).toString('hex');
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

// Process image buffer (basic implementation)
export const processImageBuffer = (buffer, maxWidth = 800, quality = 80) => {
  // For now, return the original buffer
  // In production, you could use sharp to resize and optimize
  return buffer;
};

// Get storage info
export const getSupabaseStorageInfo = async () => {
  try {
    // List files in the bucket to get stats
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('products', {
        limit: 100
      });

    if (error) {
      console.error('Error getting storage info:', error);
      return {
        bucket: STORAGE_BUCKET,
        connected: false,
        error: error.message
      };
    }

    return {
      bucket: STORAGE_BUCKET,
      connected: true,
      filesInProducts: data ? data.length : 0,
      supabaseUrl: supabaseUrl
    };
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return {
      bucket: STORAGE_BUCKET,
      connected: false,
      error: error.message
    };
  }
};

export default {
  uploadToSupabaseStorage,
  deleteFromSupabaseStorage,
  generateFileName,
  validateImageFile,
  processImageBuffer,
  getSupabaseStorageInfo
};