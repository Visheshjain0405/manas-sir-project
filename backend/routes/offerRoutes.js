import express from 'express';
import { getOffersByRequestId, acceptOffer } from '../controllers/offerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply JWT protection to all offer routes
router.use(protect);

router.get('/request/:requestId', getOffersByRequestId);
router.put('/:offerId/accept', acceptOffer);

export default router;
