import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';

// Multer in-memory storage setup
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const isImageMime = file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/webp' ||
      file.mimetype.startsWith('image/');
    
    // React Native's Blob fetch polyfill often sends text/plain and might strip the originalname
    const isOctetStream = file.mimetype === 'application/octet-stream' || file.mimetype === 'text/plain' || file.mimetype === '';

    if (isImageMime || isOctetStream) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type! Only image files (JPEG, PNG, WEBP) are allowed. Received: ${file.mimetype}`), false);
    }
  },
});

/**
 * Upload buffer directly to Cloudinary using upload_stream
 * @param {Buffer} buffer - File buffer
 * @param {String} folder - Cloudinary folder destination
 * @returns {Promise<String>} Secure image URL
 */
export const uploadBufferToCloudinary = (buffer, folder = 'local_vendor/uploads') => {
  return new Promise((resolve, reject) => {
    // If Cloudinary keys are not set, return fallback data URI for local testing
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME === 'your_cloudinary_cloud_name'
    ) {
      const base64 = buffer.toString('base64');
      return resolve(`data:image/jpeg;base64,${base64}`);
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]', error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};
