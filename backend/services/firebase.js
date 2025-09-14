import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
let firebaseApp;
let storage;

const initializeFirebase = () => {
  if (firebaseApp) {
    return { app: firebaseApp, storage };
  }

  try {
    // Check if all required Firebase environment variables are set
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID', 
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID',
      'FIREBASE_STORAGE_BUCKET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('Firebase not configured. Missing environment variables:', missingVars);
      return { app: null, storage: null };
    }

    // Create service account configuration
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: `https://www.googleapis.com/oauth2/v1/certs`,
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    // Initialize Firebase app
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    // Get storage instance
    storage = getStorage(firebaseApp);

    console.log('✅ Firebase initialized successfully');
    return { app: firebaseApp, storage };
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    return { app: null, storage: null };
  }
};

// Upload file to Firebase Storage
export const uploadToFirebase = async (buffer, fileName, contentType, folder = 'images') => {
  try {
    const { storage } = initializeFirebase();
    
    if (!storage) {
      throw new Error('Firebase storage not initialized');
    }

    const bucket = storage.bucket();
    const file = bucket.file(`${folder}/${fileName}`);

    // Upload the buffer to Firebase Storage
    await file.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          uploadedAt: new Date().toISOString(),
        }
      },
      public: true,
      validation: 'md5'
    });

    // Make the file public
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${folder}/${fileName}`;

    console.log('✅ File uploaded successfully:', fileName);
    return {
      url: publicUrl,
      fileName,
      size: buffer.length,
      contentType
    };
  } catch (error) {
    console.error('❌ Error uploading to Firebase:', error);
    throw error;
  }
};

// Delete file from Firebase Storage
export const deleteFromFirebase = async (fileName, folder = 'images') => {
  try {
    const { storage } = initializeFirebase();
    
    if (!storage) {
      throw new Error('Firebase storage not initialized');
    }

    const bucket = storage.bucket();
    const file = bucket.file(`${folder}/${fileName}`);

    await file.delete();
    console.log('✅ File deleted successfully:', fileName);
    return true;
  } catch (error) {
    console.error('❌ Error deleting from Firebase:', error);
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

// Resize image buffer (basic implementation - for production consider using sharp)
export const processImageBuffer = (buffer, maxWidth = 800, quality = 80) => {
  // For now, return the original buffer
  // In production, you would use a library like sharp to resize and optimize
  return buffer;
};

export default {
  initializeFirebase,
  uploadToFirebase,
  deleteFromFirebase,
  generateFileName,
  validateImageFile,
  processImageBuffer
};