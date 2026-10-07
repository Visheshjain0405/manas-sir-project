import express from 'express';
import {
  createServiceRequest,
  getMyRequests,
  getServiceRequestById,
} from '../controllers/serviceRequestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../utils/cloudinaryUpload.js';

const router = express.Router();

// Apply JWT protection to all service request routes
router.use(protect);

router.post('/', uploadMiddleware.array('images', 5), createServiceRequest);
router.get('/my-requests', getMyRequests);
router.get('/:id', getServiceRequestById);

export default router;
