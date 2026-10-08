import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VendorWelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-[#f6f7f8]">
      <View className="flex-1 items-center justify-center px-6">
        
        {/* Soft Circular Avatar / Logo Area */}
        <View className="w-32 h-32 bg-white rounded-full items-center justify-center shadow-sm border border-[#e2e8f0] mb-8">
          <Image 
            source={require('../assets/logo.jpg')} 
            className="w-24 h-24 rounded-full"
            resizeMode="cover"
          />
        </View>

        <Text className="text-3xl font-extrabold text-[#0f1729] text-center mb-3">
          Vendor Partner
        </Text>
        
        <Text className="text-base text-[#6b7280] text-center px-4 leading-6 mb-12">
          Join our platform to receive nearby service requests, send quotes, and grow your business effortlessly.
        </Text>

        {/* Full-width Rounded Action Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('VendorSignup')}
          className="w-full bg-[#0f1729] py-4 rounded-2xl items-center justify-center shadow-md active:opacity-90 mb-4"
        >
          <Text className="text-white font-bold text-lg">Get Started</Text>
        </TouchableOpacity>

        {/* Log In Link */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('VendorLogin')}
          className="w-full py-4 rounded-2xl items-center justify-center border border-[#e2e8f0] bg-white active:opacity-70"
        >
          <Text className="text-[#0f1729] font-bold text-lg">I already have an account</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}
