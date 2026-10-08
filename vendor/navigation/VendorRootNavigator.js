import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { VendorAuthContext } from '../src/context/VendorAuthContext';

import VendorWelcomeScreen from '../screens/VendorWelcomeScreen';
import VendorLoginScreen from '../screens/VendorLoginScreen';
import VendorSignupScreen from '../screens/VendorSignupScreen';
import VendorBottomTabNavigator from './VendorBottomTabNavigator';

const Stack = createNativeStackNavigator();

export default function VendorRootNavigator() {
  const { vendor, vendorToken, isLoading } = useContext(VendorAuthContext);

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#f6f7f8] items-center justify-center">
        <ActivityIndicator size="large" color="#0f1729" />
      </View>
    );
  }

  const isAuthenticated = !!vendorToken && !!vendor;
  const isProfileComplete = isAuthenticated && vendor?.category && vendor?.pincodes?.length > 0;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="VendorLogin" component={VendorLoginScreen} />
            <Stack.Screen name="VendorSignup" component={VendorSignupScreen} />
          </>
        ) : !isProfileComplete ? (
          <Stack.Screen name="VendorAppTabs" component={VendorBottomTabNavigator} />
        ) : (
          <Stack.Screen name="VendorAppTabs" component={VendorBottomTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
