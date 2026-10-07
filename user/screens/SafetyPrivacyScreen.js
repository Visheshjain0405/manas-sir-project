import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { ArrowLeft, ShieldAlert, FileText, Lock, AlertTriangle } from 'lucide-react-native';

export default function SafetyPrivacyScreen({ navigation }) {
  const [shareData, setShareData] = useState(false);
  const [promotionalEmails, setPromotionalEmails] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => console.log('Account deleted') }
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#f6f7f8]">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={24} color="#0f1729" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-[#0f1729]">Safety & Privacy</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        
        <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <View className="flex-row items-center mb-4">
            <Lock size={20} color="#0f1729" className="mr-3" />
            <Text className="text-base font-bold text-[#0f1729]">Privacy Settings</Text>
          </View>
          
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-1 pr-4">
              <Text className="text-base font-semibold text-[#0f1729]">Share Usage Data</Text>
              <Text className="text-xs text-[#6b7280] mt-1">Help us improve the app by sharing anonymous usage stats.</Text>
            </View>
            <Switch
              trackColor={{ false: "#e5e7eb", true: "#0f1729" }}
              thumbColor={"#ffffff"}
              onValueChange={setShareData}
              value={shareData}
            />
          </View>
          
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1 pr-4">
              <Text className="text-base font-semibold text-[#0f1729]">Promotional Emails</Text>
              <Text className="text-xs text-[#6b7280] mt-1">Receive offers, updates and newsletters.</Text>
            </View>
            <Switch
              trackColor={{ false: "#e5e7eb", true: "#0f1729" }}
              thumbColor={"#ffffff"}
              onValueChange={setPromotionalEmails}
              value={promotionalEmails}
            />
          </View>
        </View>

        <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <FileText size={20} color="#0f1729" className="mr-3" />
            <Text className="text-base font-bold text-[#0f1729]">Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-4">
            <ShieldAlert size={20} color="#0f1729" className="mr-3" />
            <Text className="text-base font-bold text-[#0f1729]">Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-red-50 rounded-2xl border border-red-100 p-4 mb-8">
          <View className="flex-row items-center mb-3">
            <AlertTriangle size={20} color="#ef4444" className="mr-3" />
            <Text className="text-base font-bold text-red-500">Danger Zone</Text>
          </View>
          <Text className="text-sm text-red-400 mb-4">Deleting your account will remove all your saved data, past bookings, and personal information permanently.</Text>
          <TouchableOpacity onPress={handleDeleteAccount} className="bg-white border border-red-200 py-3 rounded-xl items-center justify-center">
            <Text className="text-red-500 font-bold text-base">Delete Account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
