import express from 'express';
import {
  createServiceRequest,
  getMyRequests,
  getServiceRequestById,
  getAvailableRequests,
  getAssignedRequests
} from '../controllers/serviceRequestController.js';
import { protect, protectVendor } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../utils/cloudinaryUpload.js';

const router = express.Router();

// Customer routes
router.post('/', protect, uploadMiddleware.array('images', 5), createServiceRequest);
router.get('/my-requests', protect, getMyRequests);
// Vendor routes
router.get('/available', protectVendor, getAvailableRequests);
router.get('/assigned', protectVendor, getAssignedRequests);

// Dynamic parameter route must be last
router.get('/:id', protect, getServiceRequestById);

export default router;
