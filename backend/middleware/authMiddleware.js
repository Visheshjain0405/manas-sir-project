import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';

// Protect routes middleware
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_12345');

      req.user = await User.findById(decoded.id).select('-otp -otpExpires');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      next();
    } catch (error) {
      console.error('JWT Auth Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Protect vendor routes middleware
export const protectVendor = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_12345');

      req.vendor = await Vendor.findById(decoded.id).select('-otp -otpExpires');
      // For legacy controllers that might still use req.user:
      req.user = req.vendor;

      if (!req.vendor) {
        return res.status(401).json({ success: false, message: 'Vendor not found' });
      }

      next();
    } catch (error) {
      console.error('JWT Vendor Auth Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};
