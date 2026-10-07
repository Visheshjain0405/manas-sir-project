import express from 'express';
import { sendOtp, verifyOtp, updateLocation, updateProfileImage, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../utils/cloudinaryUpload.js';

const router = express.Router();

// Public routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Protected routes
router.post('/location', protect, updateLocation);
router.put('/profile-image', protect, uploadMiddleware.single('avatar'), updateProfileImage);
router.get('/me', protect, getMe);

export default router;
