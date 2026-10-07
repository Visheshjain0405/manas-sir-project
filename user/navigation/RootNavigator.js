import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../src/context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import LocationSetupScreen from '../screens/LocationSetupScreen';
import CreateRequestScreen from '../screens/CreateRequestScreen';
import ManageAddressesScreen from '../screens/ManageAddressesScreen';
import PaymentOptionsScreen from '../screens/PaymentOptionsScreen';
import SafetyPrivacyScreen from '../screens/SafetyPrivacyScreen';
import CustomerSupportScreen from '../screens/CustomerSupportScreen';
import RequestDetailsScreen from '../screens/RequestDetailsScreen';
import BottomTabNavigator from './BottomTabNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { token, user, isLoading, login, updateUser } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f7f8' }}>
        <ActivityIndicator size="large" color="#0f1729" />
      </View>
    );
  }

  const hasSavedAddress = user?.address?.pincode || user?.addressDetails?.pincode;
  const initialRouteName = token && user ? (hasSavedAddress ? 'MainTabs' : 'LocationSetup') : 'Login';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen
            {...props}
            onNavigateToSignup={() => props.navigation.navigate('Signup')}
            onLoginSuccess={async (userData, newToken) => {
              await login(newToken, userData);
              const addr = userData.address || userData.addressDetails;
              if (addr?.street || addr?.pincode || addr?.houseNo) {
                props.navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
              } else {
                props.navigation.navigate('LocationSetup');
              }
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Signup">
        {(props) => (
          <SignupScreen
            {...props}
            onNavigateToLogin={() => props.navigation.navigate('Login')}
            onSignupSuccess={async (userData, newToken) => {
              await login(newToken, userData);
              const addr = userData.address || userData.addressDetails;
              if (addr?.street || addr?.pincode || addr?.houseNo) {
                props.navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
              } else {
                props.navigation.navigate('LocationSetup');
              }
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="LocationSetup">
        {(props) => (
          <LocationSetupScreen
            {...props}
            userToken={token}
            onCompleteSetup={async (address) => {
              if (address) {
                await updateUser({ addressDetails: address, address });
              }
              props.navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="CreateRequest">
        {(props) => (
          <CreateRequestScreen
            {...props}
            userToken={token}
            userAddress={user?.addressDetails || user?.address}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="ManageAddresses" component={ManageAddressesScreen} />
      <Stack.Screen name="PaymentOptions" component={PaymentOptionsScreen} />
      <Stack.Screen name="SafetyPrivacy" component={SafetyPrivacyScreen} />
      <Stack.Screen name="CustomerSupport" component={CustomerSupportScreen} />
      <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
    </Stack.Navigator>
  );
}
