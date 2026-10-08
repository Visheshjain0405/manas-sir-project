import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ChevronRight, MapPin, CreditCard, ShieldCheck, HeadphonesIcon, LogOut, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const menuItems = [
    {
      title: 'Manage Addresses',
      description: 'Add, edit, or delete delivery addresses',
      icon: MapPin,
      route: 'ManageAddresses',
    },
    {
      title: 'Payment Options',
      description: 'Manage cards, UPI, and payment preferences',
      icon: CreditCard,
      route: 'PaymentOptions',
    },
    {
      title: 'Safety & Privacy',
      description: 'Privacy settings, Terms of Service, Account data',
      icon: ShieldCheck,
      route: 'SafetyPrivacy',
    },
    {
      title: 'Customer Support',
      description: 'FAQs, Help Center, WhatsApp Support',
      icon: HeadphonesIcon,
      route: 'CustomerSupport',
    },
  ];

  return (
    <View className="flex-1 bg-[#f6f7f8]">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-200">
        <Text className="text-2xl font-bold text-[#0f1729] mb-6 mt-4">My Account</Text>
        
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-[#f6f7f8] border-2 border-gray-100 items-center justify-center mr-4">
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} className="w-full h-full rounded-full" />
            ) : (
              <UserIcon size={32} color="#0f1729" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-[#0f1729]">{user?.name || 'Guest User'}</Text>
            <Text className="text-base text-[#6b7280] mt-1">{user?.phone || '+91 -'}</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {/* Menu Items */}
        <View className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(item.route)}
              className={`flex-row items-center p-4 bg-white ${
                index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="w-10 h-10 rounded-full bg-[#f6f7f8] items-center justify-center mr-4">
                <item.icon size={20} color="#0f1729" />
              </View>
              <View className="flex-1 pr-4">
                <Text className="text-base font-bold text-[#0f1729]">{item.title}</Text>
                <Text className="text-sm text-[#6b7280] mt-0.5">{item.description}</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }}
          className="bg-white rounded-2xl border border-red-100 p-4 flex-row items-center justify-center mb-10 shadow-sm"
        >
          <LogOut size={20} color="#ef4444" className="mr-2" />
          <Text className="text-base font-bold text-red-500">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
