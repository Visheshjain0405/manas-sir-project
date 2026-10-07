import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use '192.168.1.14' for physical Android phone connected over Wi-Fi
// Use '10.0.2.2' if running in Android Emulator
const DEV_MACHINE_IP = '10.146.87.96';
const PORT = '5001';

export const API_BASE_URL = Platform.OS === 'android'
  ? `http://${DEV_MACHINE_IP}:${PORT}/api`
  : `http://localhost:${PORT}/api`;

console.log(API_BASE_URL);

export const getMeApi = async (token) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (error) {
    console.error('getMeApi error:', error);
    return { success: false, message: error.message || 'Network connection error' };
  }
};

export const sendOtpApi = async (phone) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return await res.json();
  } catch (error) {
    console.error('sendOtpApi error:', error);
    return { success: false, message: error.message || 'Network connection error' };
  }
};

export const verifyOtpApi = async (phone, otp, name = '') => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, name }),
    });
    return await res.json();
  } catch (error) {
    console.error('verifyOtpApi error:', error);
    return { success: false, message: error.message || 'Network connection error' };
  }
};

export const updateLocationApi = async (token, latitude, longitude, addressDetails) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ latitude, longitude, addressDetails }),
    });
    return await res.json();
  } catch (error) {
    console.error('updateLocationApi error:', error);
    return { success: false, message: error.message || 'Network connection error' };
  }
};

/**
 * Upload Service Request with multipart/form-data for image buffers or JSON
 */
export const createServiceRequestApi = async (token, requestData) => {
  try {
    const isFormData = requestData && (requestData instanceof FormData || typeof requestData.append === 'function' || Boolean(requestData._parts));
    const headers = {
      'Authorization': `Bearer ${token}`,
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE_URL}/service-requests`, {
      method: 'POST',
      headers,
      body: isFormData ? requestData : JSON.stringify(requestData),
    });
    return await res.json();
  } catch (error) {
    console.error('createServiceRequestApi error:', error);
    return { success: false, message: error.message || 'Network connection error' };
  }
};

/**
 * Upload User Avatar image via PUT /api/auth/profile-image
 */
export const updateProfileImageApi = async (token, imageUri) => {
  try {
    const formData = new FormData();
    const uriStr = typeof imageUri === 'string' ? imageUri : imageUri?.uri || '';
    if (!uriStr) {
      throw new Error('Invalid image URI');
    }

    const fileUri = Platform.OS === 'android'
      ? (uriStr.startsWith('file://') || uriStr.startsWith('content://') ? uriStr : `file://${uriStr}`)
      : (uriStr.startsWith('file://') ? uriStr : `file://${uriStr}`);

    const filename = uriStr.split('/').pop() || `avatar_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('avatar', {
      uri: fileUri,
      name: String(filename),
      type: String(type),
    });

    const res = await fetch(`${API_BASE_URL}/auth/profile-image`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return await res.json();
  } catch (error) {
    console.error('updateProfileImageApi error:', error);
    return { success: false, message: error.message || 'Network connection error' };
  }
};

export const getMyRequestsApi = async (token, statusFilter = '') => {
  try {
    const url = statusFilter
      ? `${API_BASE_URL}/service-requests/my-requests?status=${statusFilter}`
      : `${API_BASE_URL}/service-requests/my-requests`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (error) {
    console.error('getMyRequestsApi error:', error);
    return { success: false, message: error.message || 'Network connection error' };
  }
};

export const getServiceRequestByIdApi = async (requestId) => {
  try {
    const token = await AsyncStorage.getItem('@user_jwt_token');
    const res = await fetch(`${API_BASE_URL}/service-requests/${requestId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (error) {
    console.error('getServiceRequestByIdApi error:', error);
    return { success: false, message: error.message };
  }
};

export const getOffersByRequestIdApi = async (requestId) => {
  try {
    const token = await AsyncStorage.getItem('@user_jwt_token');
    const res = await fetch(`${API_BASE_URL}/offers/request/${requestId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (error) {
    console.error('getOffersByRequestIdApi error:', error);
    return { success: false, message: error.message };
  }
};

export const acceptOfferApi = async (offerId) => {
  try {
    const token = await AsyncStorage.getItem('@user_jwt_token');
    const res = await fetch(`${API_BASE_URL}/offers/${offerId}/accept`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (error) {
    console.error('acceptOfferApi error:', error);
    return { success: false, message: error.message };
  }
};
