import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, Plus, MapPin, CheckCircle2, Trash2, Edit2, X } from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';

export default function ManageAddressesScreen({ navigation }) {
  const { user } = useAuth();
  
  const initialAddresses = user?.savedAddresses?.length > 0 
    ? user.savedAddresses 
    : user?.addressDetails?.formattedAddress || user?.addressDetails?.area
      ? [{
          id: '1',
          title: 'Primary Location',
          address: user.addressDetails.formattedAddress || user.addressDetails.area || '',
          city: user.addressDetails.city || '',
          state: user.addressDetails.state || '',
          pincode: user.addressDetails.pincode || '',
          isDefault: true
        }]
      : [];

  const [addresses, setAddresses] = useState(initialAddresses);

  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({ title: '', address: '', city: '', state: '', pincode: '' });

  const handleSave = () => {
    if (editingAddress) {
      setAddresses(addresses.map(a => a.id === editingAddress.id ? { ...a, ...formData } : a));
    } else {
      setAddresses([...addresses, { ...formData, id: Date.now().toString(), isDefault: addresses.length === 0 }]);
    }
    setShowModal(false);
    setEditingAddress(null);
    setFormData({ title: '', address: '', city: '', state: '', pincode: '' });
  };

  const setAsDefault = (id) => {
    setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const deleteAddress = (id) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setFormData(addr);
    setShowModal(true);
  };

  return (
    <View className="flex-1 bg-[#f6f7f8]">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={24} color="#0f1729" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-[#0f1729]">Manage Addresses</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} className="w-10 h-10 items-center justify-center bg-[#0f1729] rounded-full">
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {addresses.map((addr) => (
          <View key={addr.id} className={`bg-white rounded-2xl border mb-4 p-4 ${addr.isDefault ? 'border-[#0f1729]' : 'border-gray-200'}`}>
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-row items-center">
                <MapPin size={20} color={addr.isDefault ? '#0f1729' : '#6b7280'} className="mr-2" />
                <Text className="text-base font-bold text-[#0f1729]">{addr.title}</Text>
                {addr.isDefault && (
                  <View className="bg-blue-50 px-2 py-0.5 rounded-full ml-3 border border-blue-100">
                    <Text className="text-xs font-bold text-[#0f1729]">Default</Text>
                  </View>
                )}
              </View>
              <View className="flex-row">
                <TouchableOpacity onPress={() => openEditModal(addr)} className="mr-4">
                  <Edit2 size={18} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteAddress(addr.id)}>
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text className="text-sm text-[#6b7280] leading-5 mb-4 ml-7">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</Text>
            
            {!addr.isDefault && (
              <TouchableOpacity onPress={() => setAsDefault(addr.id)} className="ml-7 flex-row items-center">
                <CheckCircle2 size={16} color="#6b7280" className="mr-1.5" />
                <Text className="text-sm font-bold text-[#6b7280]">Set as Default</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {addresses.length === 0 && (
          <View className="items-center justify-center py-10">
            <Text className="text-base text-[#6b7280]">No saved addresses yet.</Text>
          </View>
        )}
      </ScrollView>

      {/* Address Form Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-6 border-t border-gray-200">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-[#0f1729]">{editingAddress ? 'Edit Address' : 'Add New Address'}</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); setEditingAddress(null); setFormData({ title: '', address: '', city: '', state: '', pincode: '' }); }} className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
                <X size={20} color="#0f1729" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4 mb-6">
              <TextInput value={formData.title} onChangeText={(t) => setFormData({...formData, title: t})} placeholder="Title (e.g. Home, Office)" className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-[#0f1729] bg-[#f6f7f8]" placeholderTextColor="#9ca3af" />
              <TextInput value={formData.address} onChangeText={(t) => setFormData({...formData, address: t})} placeholder="Street Address" multiline className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-[#0f1729] bg-[#f6f7f8] h-24 text-vertical-top" placeholderTextColor="#9ca3af" />
              <View className="flex-row space-x-3">
                <TextInput value={formData.city} onChangeText={(t) => setFormData({...formData, city: t})} placeholder="City" className="flex-1 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-[#0f1729] bg-[#f6f7f8]" placeholderTextColor="#9ca3af" />
                <TextInput value={formData.pincode} onChangeText={(t) => setFormData({...formData, pincode: t})} placeholder="Pincode" keyboardType="number-pad" className="flex-1 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-[#0f1729] bg-[#f6f7f8]" placeholderTextColor="#9ca3af" />
              </View>
              <TextInput value={formData.state} onChangeText={(t) => setFormData({...formData, state: t})} placeholder="State" className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-[#0f1729] bg-[#f6f7f8]" placeholderTextColor="#9ca3af" />
            </View>

            <TouchableOpacity onPress={handleSave} className="bg-[#0f1729] py-4 rounded-xl items-center justify-center">
              <Text className="text-white font-bold text-base">Save Address</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
