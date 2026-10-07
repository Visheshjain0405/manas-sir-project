import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMeApi } from '../../services/api';

const TOKEN_KEY = '@user_jwt_token';
const USER_KEY = '@user_profile_data';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Refresh user profile from backend
        const res = await getMeApi(storedToken);
        if (res.success && res.user) {
          setUser(res.user);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user));
        }
      }
    } catch (error) {
      console.error('Error loading stored session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken, userData) => {
    try {
      setToken(newToken);
      setUser(userData);
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving login session:', error);
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const mergedUser = { ...user, ...updatedUserData };
      setUser(mergedUser);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
    } catch (error) {
      console.error('Error updating user state:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        loadStoredSession,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
