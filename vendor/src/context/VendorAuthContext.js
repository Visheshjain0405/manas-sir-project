import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../../services/client';

export const VendorAuthContext = createContext();

export const VendorAuthProvider = ({ children }) => {
  const [vendor, setVendor] = useState(null);
  const [vendorToken, setVendorToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVendorSession();
  }, []);

  const loadVendorSession = async () => {
    try {
      const token = await AsyncStorage.getItem('vendor_token');
      if (token) {
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await client.get('/api/vendor/auth/me');
        if (res.data.success) {
          setVendor(res.data.vendor);
          setVendorToken(token);
        } else {
          logout();
        }
      }
    } catch (error) {
      console.log('Failed to load vendor session', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token, vendorData) => {
    try {
      await AsyncStorage.setItem('vendor_token', token);
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setVendor(vendorData);
      setVendorToken(token);
    } catch (error) {
      console.error('Error saving vendor session', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('vendor_token');
      delete client.defaults.headers.common['Authorization'];
      setVendor(null);
      setVendorToken(null);
    } catch (error) {
      console.error('Error clearing vendor session', error);
    }
  };

  return (
    <VendorAuthContext.Provider value={{ vendor, vendorToken, isLoading, login, logout }}>
      {children}
    </VendorAuthContext.Provider>
  );
};
