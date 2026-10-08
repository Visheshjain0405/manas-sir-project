import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Briefcase } from 'lucide-react-native';

export default function VendorBookingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-[#f6f7f8] items-center justify-center p-6">
      <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center mb-6">
        <Briefcase size={40} color="#6b7280" />
      </View>
      <Text className="text-xl font-bold text-[#0f1729] mb-2 text-center">Active Bookings</Text>
      <Text className="text-[#6b7280] text-center">
        This screen will display your accepted jobs, allow you to start jobs with OTP verification, and track completion status.
      </Text>
    </SafeAreaView>
  );
}
