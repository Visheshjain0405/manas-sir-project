import ServiceRequest from '../models/ServiceRequest.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

/**
 * @desc    Create a new Service Request & Broadcast to vendors in pincode via Socket.IO
 * @route   POST /api/service-requests
 * @access  Private (User)
 */
export const createServiceRequest = async (req, res) => {
  try {
    // Parse body parameters (supports both JSON and multipart form data fields)
    let { category, subCategory, title, description, images, schedule, address } = req.body;

    if (typeof schedule === 'string') {
      try { schedule = JSON.parse(schedule); } catch (e) {}
    }
    if (typeof address === 'string') {
      try { address = JSON.parse(address); } catch (e) {}
    }

    if (!category || !description) {
      return res.status(400).json({ success: false, message: 'Category and description are required' });
    }

    if (!schedule || !schedule.date || !schedule.timeSlot) {
      return res.status(400).json({ success: false, message: 'Schedule date and time slot are required' });
    }

    const streetVal = address?.street || address?.houseNo || address?.formattedAddress || '';
    const cityVal = address?.city || address?.state || '';
    const pincodeVal = address?.pincode || address?.zipCode || '400001';

    if (!streetVal || !cityVal || !pincodeVal) {
      return res.status(400).json({ success: false, message: 'Address street, city, and pincode are required' });
    }

    // Process memory buffer file uploads with Cloudinary streamifier helper
    let requestImages = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, 'local_vendor/requests')
      );
      requestImages = await Promise.all(uploadPromises);
    } else if (images && Array.isArray(images)) {
      requestImages = images;
    }

    const newRequest = new ServiceRequest({
      customer: req.user._id,
      category: category.trim(),
      subCategory: subCategory ? subCategory.trim() : '',
      title: title ? title.trim() : `${category.trim()} Service Request`,
      description: description.trim(),
      images: requestImages,
      schedule: {
        date: schedule.date,
        timeSlot: schedule.timeSlot,
      },
      address: {
        label: address.label || 'Home',
        street: streetVal,
        city: cityVal,
        pincode: pincodeVal,
        location: {
          type: 'Point',
          coordinates: address.location && address.location.coordinates 
            ? address.location.coordinates 
            : (req.user.location && req.user.location.coordinates ? req.user.location.coordinates : [0, 0]),
        },
      },
      status: 'pending',
    });

    await newRequest.save();

    // Populate user info for broadcasting
    const populatedRequest = await ServiceRequest.findById(newRequest._id).populate('customer', 'name phone location');

    // Broadcast WebSocket event to pincode room using app Socket.IO instance
    const io = req.app.get('socketio');
    if (io) {
      const roomName = `pincode_${newRequest.address.pincode}`;
      io.to(roomName).emit('newServiceRequest', populatedRequest);
      console.log(`[Socket.IO] Broadcasted newServiceRequest ${newRequest._id} to room: ${roomName}`);
    }

    return res.status(201).json({
      success: true,
      message: 'Request created and broadcasted successfully',
      request: populatedRequest,
    });
  } catch (error) {
    console.error('Error in createServiceRequest:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating service request' });
  }
};

/**
 * @desc    Get all service requests created by the authenticated user with optional status filter (?status=active vs ?status=completed)
 * @route   GET /api/service-requests/my-requests
 * @access  Private (User)
 */
export const getMyRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = { customer: req.user._id };

    if (status === 'active') {
      filter.status = { $in: ['pending', 'accepted', 'in_progress', 'work_started'] };
    } else if (status === 'completed') {
      filter.status = { $in: ['completed', 'cancelled'] };
    } else if (status) {
      filter.status = status;
    }

    const requests = await ServiceRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('assignedVendor', 'name businessName ownerName phone mobileNumber rating profilePic');

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error('Error in getMyRequests:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching user requests' });
  }
};

/**
 * @desc    Get single service request details by ID
 * @route   GET /api/service-requests/:id
 * @access  Private (User)
 */
export const getServiceRequestById = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('assignedVendor', 'name businessName ownerName phone mobileNumber rating profilePic');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    // Verify ownership
    if (request.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this request' });
    }

    return res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    console.error('Error in getServiceRequestById:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching request details' });
  }
};

/**
 * @desc    Get available service requests matching vendor's pincodes and category
 * @route   GET /api/service-requests/available
 * @access  Private (Vendor)
 */
export const getAvailableRequests = async (req, res) => {
  try {
    const vendor = req.vendor; // Populated by protectVendor middleware
    
    // Find requests that are pending, in the vendor's pincodes, and matching category
    const requests = await ServiceRequest.find({
      status: 'pending',
      category: vendor.category,
      'address.pincode': { $in: vendor.pincodes }
    }).sort({ createdAt: -1 }).populate('customer', 'name profileImage');
    
    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Error in getAvailableRequests:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching available requests' });
  }
};

/**
 * @desc    Get service requests assigned to the vendor
 * @route   GET /api/service-requests/assigned
 * @access  Private (Vendor)
 */
export const getAssignedRequests = async (req, res) => {
  try {
    const vendor = req.vendor;
    
    const requests = await ServiceRequest.find({
      assignedVendor: vendor._id,
      status: { $in: ['accepted', 'in_progress', 'work_started'] }
    }).sort({ createdAt: -1 }).populate('customer', 'name phone location address');
    
    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Error in getAssignedRequests:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching assigned requests' });
  }
};
