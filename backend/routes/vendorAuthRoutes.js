import express from 'express';
import { sendVendorOtp, verifyVendorOtp, getVendorProfile, updateVendorProfile } from '../controllers/vendorAuthController.js';
import { protectVendor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-otp', sendVendorOtp);
router.post('/verify-otp', verifyVendorOtp);
router.get('/me', protectVendor, getVendorProfile);
router.put('/profile', protectVendor, updateVendorProfile);

export default router;
