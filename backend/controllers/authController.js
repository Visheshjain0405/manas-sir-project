import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_12345', {
    expiresIn: '30d',
  });
};

// Helper: Generate 6-digit random OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Send OTP to user phone number
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.trim() === '') {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phone.trim();
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    let user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      // Create new customer record with generated OTP
      user = new User({
        phone: cleanPhone,
        otp,
        otpExpires,
      });
    } else {
      user.otp = otp;
      user.otpExpires = otpExpires;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'OTP generated and sent successfully',
      otp: otp,
      isExistingUser: Boolean(user.name && user.isVerified),
    });
  } catch (error) {
    console.error('Error in sendOtp:', error);
    return res.status(500).json({ success: false, message: 'Server error while generating OTP' });
  }
};

/**
 * @desc    Verify OTP and complete Login / Register
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
    }

    const user = await User.findOne({ phone: phone.trim() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please request OTP first.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    if (name && name.trim() !== '') {
      user.name = name.trim();
    }

    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        location: user.location,
        addressDetails: user.addressDetails,
        savedAddresses: user.savedAddresses,
      },
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    return res.status(500).json({ success: false, message: 'Server error while verifying OTP' });
  }
};

/**
 * @desc    Update User Profile Avatar Image via Cloudinary
 * @route   PUT /api/auth/profile-image
 * @access  Private (JWT Protected)
 */
export const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No avatar image file provided' });
    }

    const profileImageUrl = await uploadBufferToCloudinary(req.file.buffer, 'local_vendor/avatars');

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.profileImage = profileImageUrl;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile avatar updated successfully',
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        location: user.location,
        addressDetails: user.addressDetails,
      },
    });
  } catch (error) {
    console.error('Error in updateProfileImage:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating profile avatar' });
  }
};

/**
 * @desc    Update Customer Location & Address Details
 * @route   POST /api/auth/location
 * @access  Private (JWT Protected)
 */
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, addressDetails } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };

    if (addressDetails) {
      user.addressDetails = {
        houseNo: addressDetails.houseNo || '',
        area: addressDetails.area || '',
        landmark: addressDetails.landmark || '',
        city: addressDetails.city || '',
        state: addressDetails.state || '',
        pincode: addressDetails.pincode || '',
        formattedAddress: addressDetails.formattedAddress || '',
      };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        location: user.location,
        addressDetails: user.addressDetails,
      },
    });
  } catch (error) {
    console.error('Error in updateLocation:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating location' });
  }
};

/**
 * @desc    Get Current User Profile
 * @route   GET /api/auth/me
 * @access  Private (JWT Protected)
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otp -otpExpires');
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
};
