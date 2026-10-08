import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Grid, Briefcase, MessageSquare, User } from 'lucide-react-native';

import VendorDashboardScreen from '../screens/VendorDashboardScreen';
import VendorJobsScreen from '../screens/VendorJobsScreen';
import VendorEarningsScreen from '../screens/VendorEarningsScreen';
import VendorProfileScreen from '../screens/VendorProfileScreen';

const Tab = createBottomTabNavigator();

export default function VendorBottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0f1729',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          paddingTop: 8,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: 'bold',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={VendorDashboardScreen} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Grid size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Jobs" 
        component={VendorJobsScreen} 
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={VendorEarningsScreen} 
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={VendorProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
