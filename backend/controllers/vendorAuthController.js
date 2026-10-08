import jwt from 'jsonwebtoken';
import Vendor from '../models/Vendor.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Send OTP to Vendor for Login/Signup
 * @route   POST /api/vendor/auth/send-otp
 * @access  Public
 */
export const sendVendorOtp = async (req, res) => {
  try {
    const { mobileNumber, type } = req.body;

    if (!mobileNumber || mobileNumber.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid mobile number is required' });
    }

    const vendor = await Vendor.findOne({ mobileNumber });

    if (type === 'login' && !vendor) {
      return res.status(404).json({ success: false, message: 'No vendor account found with this number. Please sign up.' });
    }

    if (type === 'signup' && vendor) {
      return res.status(400).json({ success: false, message: 'Account already exists. Please log in.' });
    }

    // In a real app, integrate SMS provider (Twilio, MSG91, AWS SNS) here
    // Using a static/test OTP for development
    const otp = '123456'; 

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp, // Test environment only - normally we do not return OTP in response
    });
  } catch (error) {
    console.error('Send Vendor OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

/**
 * @desc    Verify OTP for Vendor Login/Signup
 * @route   POST /api/vendor/auth/verify-otp
 * @access  Public
 */
export const verifyVendorOtp = async (req, res) => {
  try {
    const { mobileNumber, otp, name, email, businessName, category, subServices, experienceYears, pincodes, address, serviceRadiusKm } = req.body;

    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    let vendor = await Vendor.findOne({ mobileNumber });

    if (!vendor) {
      // Must be a signup flow
      vendor = await Vendor.create({
        mobileNumber,
        name: name || 'Vendor Partner',
        email: email || '',
        role: 'vendor',
        businessName: businessName || '',
        category: category || '',
        subServices: subServices || [],
        experienceYears: experienceYears || '',
        pincodes: pincodes || ['395007'], 
        address: address || {},
        serviceRadiusKm: serviceRadiusKm || 10,
      });
    }

    const token = generateToken(vendor._id);

    res.status(200).json({
      success: true,
      token,
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        mobileNumber: vendor.mobileNumber,
        businessName: vendor.businessName,
        category: vendor.category,
        pincodes: vendor.pincodes,
      },
    });
  } catch (error) {
    console.error('Verify Vendor OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

/**
 * @desc    Get Current Logged in Vendor Profile
 * @route   GET /api/vendor/auth/me
 * @access  Private (Vendor)
 */
export const getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    res.status(200).json({ success: true, vendor });
  } catch (error) {
    console.error('Get Vendor Profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Update Vendor Profile Details
 * @route   PUT /api/vendor/auth/profile
 * @access  Private (Vendor)
 */
export const updateVendorProfile = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { pincodes, baseVisitingCharge, upiId } = req.body;

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    if (pincodes !== undefined) {
      if (!Array.isArray(pincodes) || pincodes.length === 0) {
         return res.status(400).json({ success: false, message: 'At least one pincode is required' });
      }
      vendor.pincodes = pincodes;
    }

    if (baseVisitingCharge !== undefined) {
      vendor.baseVisitingCharge = Number(baseVisitingCharge);
    }

    if (upiId !== undefined) {
      vendor.upiId = upiId.trim();
    }

    await vendor.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      vendor
    });

  } catch (error) {
    console.error('Error in updateVendorProfile:', error);
    return res.status(500).json({ success: false, message: 'Server error updating vendor profile' });
  }
};
