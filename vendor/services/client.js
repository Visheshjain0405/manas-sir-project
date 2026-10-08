import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

let BACKEND_URL = 'http://localhost:5001';

if (Constants.expoConfig?.hostUri) {
  // Extracts the local Wi-Fi IP address that the Expo bundler is running on
  const host = Constants.expoConfig.hostUri.split(':')[0];
  BACKEND_URL = `http://${host}:5001`;
} else if (Platform.OS === 'android') {
  // Fallback for Android Emulator if hostUri isn't available
  BACKEND_URL = 'http://10.0.2.2:5001';
}

const client = axios.create({
  baseURL: BACKEND_URL,
});

// Assume authentication logic attaches a JWT token here via interceptors in the full app
// client.interceptors.request.use(async (config) => { ... })

export default client;
