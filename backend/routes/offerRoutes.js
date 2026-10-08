import express from 'express';
import { getOffersByRequestId, acceptOffer, submitOffer, getMyBids } from '../controllers/offerController.js';
import { protect, protectVendor } from '../middleware/authMiddleware.js';

const router = express.Router();

// Vendor Routes
router.post('/', protectVendor, submitOffer);
router.get('/my-bids', protectVendor, getMyBids);

// Customer Routes
router.get('/request/:requestId', protect, getOffersByRequestId);
router.put('/:offerId/accept', protect, acceptOffer);

export default router;
