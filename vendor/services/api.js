import client from './client';

export const sendVendorOtpApi = async (mobileNumber, type) => {
  try {
    const res = await client.post('/api/vendor/auth/send-otp', {
      mobileNumber,
      type,
    });
    return res.data;
  } catch (error) {
    console.error('sendVendorOtpApi error:', error);
    return error.response?.data || { success: false, message: 'Network connection error' };
  }
};

export const verifyVendorOtpApi = async (data) => {
  try {
    const res = await client.post('/api/vendor/auth/verify-otp', data);
    return res.data;
  } catch (error) {
    console.error('verifyVendorOtpApi error:', error);
    return error.response?.data || { success: false, message: 'Invalid OTP or network error' };
  }
};

export const getVendorProfileApi = async (token) => {
  try {
    const res = await client.get('/api/vendor/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  } catch (error) {
    console.error('getVendorProfileApi error:', error);
    return error.response?.data || { success: false, message: 'Network error fetching profile' };
  }
};

export const updateVendorLocationApi = async (data, token) => {
  try {
    const res = await client.post('/api/vendor/auth/location', data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  } catch (error) {
    console.error('updateVendorLocationApi error:', error);
    return error.response?.data || { success: false, message: 'Network error updating location' };
  }
};
