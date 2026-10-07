import Offer from '../models/Offer.js';
import ServiceRequest from '../models/ServiceRequest.js';
import User from '../models/User.js';

/**
 * @desc    Get all offers for a specific service request
 * @route   GET /api/offers/request/:requestId
 * @access  Private
 */
export const getOffersByRequestId = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Verify request exists
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    // Check if user owns the request (optional but good practice)
    // if (request.user.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ success: false, message: 'Unauthorized' });
    // }

    const offers = await Offer.find({ serviceRequest: requestId })
      .populate('vendor', 'businessName ownerName rating completedJobsCount profileImage mobileNumber')
      .sort({ bidAmount: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: offers.length, data: offers });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offers' });
  }
};

/**
 * @desc    Accept an offer for a service request
 * @route   PUT /api/offers/:offerId/accept
 * @access  Private
 */
export const acceptOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user._id;

    // 1. Find the offer
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    // 2. Find the associated service request
    const serviceRequest = await ServiceRequest.findById(offer.serviceRequest);
    if (!serviceRequest) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    // 3. Ensure the requesting user owns the service request
    if (serviceRequest.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to accept this offer' });
    }

    // 4. Atomic check: Ensure request is still pending
    if (serviceRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Offer already accepted for this request' });
    }

    // 5. Update the selected offer to 'accepted'
    offer.status = 'accepted';
    await offer.save();

    // 6. Bulk update all other offers for this request to 'rejected'
    await Offer.updateMany(
      { serviceRequest: serviceRequest._id, _id: { $ne: offer._id } },
      { $set: { status: 'rejected' } }
    );

    // 7. Update the service request
    serviceRequest.status = 'accepted';
    serviceRequest.assignedVendor = offer.vendor;
    serviceRequest.finalAmount = offer.bidAmount;
    await serviceRequest.save();

    // 8. Socket Notifications
    const io = req.app.get('socketio');
    if (io) {
      // Notify customer (in case they are listening on another device/screen)
      io.to(`request_${serviceRequest._id}`).emit('offerAccepted', { 
        offerId: offer._id, 
        assignedVendor: offer.vendor 
      });
      
      // Notify the winning vendor
      io.to(`vendor_${offer.vendor}`).emit('bidAccepted', { 
        requestId: serviceRequest._id, 
        offerId: offer._id 
      });
      
      // Notify all other vendors that they lost (broadcast to pincode room or specific vendor rooms)
      // They can listen to requestUpdated event
      io.to(`pincode_${serviceRequest.address.pincode}`).emit('requestUpdated', {
        requestId: serviceRequest._id,
        status: 'accepted'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer accepted successfully',
      data: serviceRequest
    });

  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ success: false, message: 'Failed to accept offer' });
  }
};
