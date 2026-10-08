import "./global.css";
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { VendorAuthProvider } from './src/context/VendorAuthContext';
import VendorRootNavigator from './navigation/VendorRootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f7f8" translucent={false} />
      <VendorAuthProvider>
        <VendorRootNavigator />
      </VendorAuthProvider>
    </SafeAreaProvider>
  );
}
