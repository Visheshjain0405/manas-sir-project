import React, { useContext, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User, CheckCircle, Star, PenLine, Share, Power,
  Banknote, MapPin, Clock, Wrench, CreditCard,
  HelpCircle, Headset, ChevronRight, LogOut
} from 'lucide-react-native';
import { VendorAuthContext } from '../src/context/VendorAuthContext';

export default function VendorProfileScreen({ navigation }) {
  const { vendor, logout, isOnline, toggleOnline } = useContext(VendorAuthContext);
  
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogoutConfirm = () => {
    setLogoutModalVisible(false);
    logout();
  };

  const GroupedRow = ({ icon: Icon, title, subtitle, onPress, showBorder = true }) => (
    <TouchableOpacity 
      onPress={onPress}
      className={`flex-row items-center py-4 ${showBorder ? 'border-b border-gray-100' : ''}`}
    >
      <View className="w-10 h-10 bg-[#f6f7f8] rounded-full items-center justify-center mr-3 border border-gray-100">
        <Icon size={18} color="#0f1729" />
      </View>
      <View className="flex-1">
        <Text className="font-bold text-[#0f1729] text-base">{title}</Text>
        {subtitle && <Text className="text-[#6b7280] text-xs mt-0.5">{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-[#f6f7f8]">
      {/* 1. Screen Title */}
      <View className="px-5 py-4 border-b border-gray-200 bg-white">
        <Text className="text-xl font-black text-[#0f1729] text-center">Profile & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* 2. Profile Summary Card */}
        <View className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100/80 mb-5 items-center">
          <View className="relative mb-4">
            <View className="w-24 h-24 bg-[#0f1729] rounded-full items-center justify-center border-4 border-white shadow-sm">
              <User size={40} color="#ffffff" />
            </View>
            <View className="absolute bottom-0 right-0 bg-[#0f1729] p-2 rounded-full border-2 border-white shadow-sm">
              <PenLine size={12} color="#ffffff" />
            </View>
          </View>
          
          <View className="flex-row items-center justify-center mb-1">
            <Text className="text-xl font-black text-[#0f1729] mr-1">
              {vendor?.businessName || "Partner's Business"}
            </Text>
            <View className="bg-emerald-500 rounded-full p-0.5">
              <CheckCircle size={12} color="#ffffff" />
            </View>
          </View>
          
          <Text className="text-[#6b7280] font-bold text-sm mb-3">
            {vendor?.category || 'Service'} • {vendor?.pincodes?.[0] ? `Serving Pincode: ${vendor.pincodes[0]}` : 'No Area Set'}
          </Text>
          
          <View className="bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full flex-row items-center mb-6">
            <Star size={14} color="#f59e0b" fill="#f59e0b" className="mr-1" />
            <Text className="text-amber-700 font-bold text-xs">{vendor?.rating?.toFixed(1) || '5.0'} Rating</Text>
          </View>
          
          <View className="flex-row w-full gap-3">
            <TouchableOpacity className="flex-1 bg-[#0f1729] py-3.5 rounded-2xl flex-row items-center justify-center shadow-md shadow-[#0f1729]/20">
              <PenLine size={16} color="#ffffff" className="mr-2" />
              <Text className="text-white font-bold">Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-14 bg-white border border-gray-200 rounded-2xl items-center justify-center shadow-xs">
              <Share size={20} color="#0f1729" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Availability Card */}
        <View className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100/80 mb-6 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-4">
            <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center mr-3 border border-emerald-100">
              <Power size={20} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-[#0f1729] text-base">Available for new jobs</Text>
              <Text className="text-[#6b7280] text-xs mt-0.5">Switch off to stop receiving orders</Text>
            </View>
          </View>
          <Switch 
            value={isOnline} 
            onValueChange={toggleOnline} 
            trackColor={{ false: '#e2e8f0', true: '#10b981' }}
            thumbColor={'#ffffff'}
          />
        </View>

        {/* 4. Grouped Settings Lists */}
        <Text className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2 px-2">Business Settings</Text>
        <View className="bg-white rounded-2xl px-5 shadow-xs border border-gray-100/80 mb-6">
          <GroupedRow 
            icon={Banknote} 
            title="My Bids & Status" 
            subtitle="Track your active offers"
            onPress={() => navigation.navigate('Jobs')}
          />
          <GroupedRow 
            icon={MapPin} 
            title="Service Areas" 
            subtitle={vendor?.pincodes?.length ? vendor.pincodes.join(', ') : 'Not set'} 
            onPress={() => {}}
          />
          <GroupedRow 
            icon={Wrench} 
            title="Services Offered" 
            subtitle={vendor?.subServices?.length ? vendor.subServices.join(', ') : 'All Services'} 
            onPress={() => {}}
            showBorder={false}
          />
        </View>

        <Text className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2 px-2">Account Management</Text>
        <View className="bg-white rounded-2xl px-5 shadow-xs border border-gray-100/80 mb-6">
          <GroupedRow 
            icon={Banknote} 
            title="Total Earnings" 
            subtitle="Check Dashboard"
            onPress={() => navigation.navigate('Earnings')}
          />
          <GroupedRow 
            icon={CreditCard} 
            title="Payout Details" 
            subtitle={vendor?.upiId ? `UPI: ${vendor.upiId}` : 'Not configured'} 
            onPress={() => {}}
            showBorder={false}
          />
        </View>

        <Text className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2 px-2">Support</Text>
        <View className="bg-white rounded-2xl px-5 shadow-xs border border-gray-100/80 mb-6">
          <GroupedRow icon={HelpCircle} title="Help Center" />
          <GroupedRow icon={Headset} title="Contact Support" showBorder={false} />
        </View>

        {/* 5. Log Out & Footer */}
        <TouchableOpacity 
          onPress={() => setLogoutModalVisible(true)}
          className="bg-red-50 rounded-2xl py-4 items-center justify-center mb-4 border border-red-100"
        >
          <Text className="text-red-500 font-bold text-lg">Log Out</Text>
        </TouchableOpacity>
        
        <Text className="text-center text-[#9ca3af] text-xs font-bold mb-6">Version 2.4.1 (Build 204)</Text>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={logoutModalVisible} animationType="fade" transparent={true}>
        <View className="flex-1 justify-center bg-black/50 p-6">
          <View className="bg-white rounded-3xl p-6 shadow-xl items-center">
            <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4 border border-red-100">
              <LogOut size={30} color="#ef4444" />
            </View>
            <Text className="text-xl font-black text-[#0f1729] mb-2 text-center">Log Out?</Text>
            <Text className="text-[#6b7280] text-center mb-6">
              Logging out will pause lead reception and disconnect you from live service requests. Are you sure?
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity 
                onPress={() => setLogoutModalVisible(false)}
                className="flex-1 bg-[#f6f7f8] py-4 rounded-xl items-center border border-gray-200"
              >
                <Text className="font-bold text-[#0f1729]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleLogoutConfirm}
                className="flex-1 bg-[#ef4444] py-4 rounded-xl items-center shadow-md shadow-red-500/30"
              >
                <Text className="font-bold text-white">Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
