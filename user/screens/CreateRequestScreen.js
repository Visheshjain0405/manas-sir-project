import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Camera,
  X,
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  ArrowRight,
  FileText,
  AlertCircle,
  Wrench,
  Sparkles,
  CheckCircle,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { createServiceRequestApi } from '../services/api';

const DATE_OPTIONS = ['Today', 'Tomorrow', 'Day After'];

const TIME_SLOTS = [
  'Morning (9 AM - 12 PM)',
  'Afternoon (12 PM - 3 PM)',
  'Evening (3 PM - 7 PM)',
];

export default function CreateRequestScreen({ route, navigation, userToken, userAddress }) {
  const categoryName = route?.params?.category || 'General Service';

  const [issueTitle, setIssueTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Default address backup if userAddress is not set
  const currentAddress = userAddress || {
    street: '42 Wallaby Way',
    city: 'Mumbai',
    pincode: '400001',
    label: 'Home',
    location: { type: 'Point', coordinates: [72.8777, 19.076] },
  };

  const handlePickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can attach a maximum of 5 photos.');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access gallery is required to attach photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages([...images, ...newImages].slice(0, 5));
      }
    } catch (error) {
      console.warn('Image picker error:', error);
    }
  };

  const handleRemoveImage = (index) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  const handleSubmitRequest = async () => {
    setErrorMessage('');

    if (!description.trim()) {
      setErrorMessage('Please describe the issue or service you need.');
      return;
    }

    setLoading(true);

    const addressObj = {
      label: currentAddress.addressTag || currentAddress.label || 'Home',
      street: currentAddress.streetAddress || currentAddress.street || 'Main Street',
      city: currentAddress.cityState || currentAddress.city || 'City Center',
      pincode: currentAddress.zipCode || currentAddress.pincode || '400001',
      location: currentAddress.location || {
        type: 'Point',
        coordinates: [currentAddress.coordinate?.longitude || 72.8777, currentAddress.coordinate?.latitude || 19.076],
      },
    };

    const scheduleObj = {
      date: selectedDate,
      timeSlot: selectedTimeSlot,
    };

    let payload;

    if (images.length > 0) {
      payload = new FormData();
      payload.append('category', String(categoryName || 'General Service'));
      payload.append('title', String(issueTitle.trim() || `${categoryName} Service`));
      payload.append('description', String(description.trim() || ''));
      payload.append('schedule', JSON.stringify(scheduleObj));
      payload.append('address', JSON.stringify(addressObj));

      images.forEach((imgItem, idx) => {
        let uriStr = '';
        if (typeof imgItem === 'string') {
          uriStr = imgItem;
        } else if (imgItem && typeof imgItem === 'object') {
          uriStr = imgItem.uri || '';
        }

        if (!uriStr) return;

        let fileUri = uriStr.split('?')[0];
        try {
          fileUri = decodeURI(fileUri);
        } catch (e) {}

        if (Platform.OS === 'android') {
          if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
            fileUri = `file://${fileUri}`;
          }
        } else {
          if (!fileUri.startsWith('file://') && !fileUri.startsWith('ph://') && !fileUri.startsWith('assets-library://')) {
            fileUri = `file://${fileUri}`;
          }
        }

        const nameOnly = fileUri.split('/').pop() || `image_${idx}.jpg`;
        const extMatch = /\.(\w+)$/.exec(nameOnly);
        let finalType = extMatch ? `image/${extMatch[1].toLowerCase()}` : 'image/jpeg';
        if (finalType === 'image/jpg') finalType = 'image/jpeg';

        payload.append('images', {
          uri: fileUri,
          name: nameOnly,
          type: finalType,
        });
      });
    } else {
      payload = {
        category: categoryName,
        title: issueTitle.trim() || `${categoryName} Service`,
        description: description.trim(),
        images: [],
        schedule: scheduleObj,
        address: addressObj,
      };
    }

    if (payload instanceof FormData) {
      // It is a FormData object, wait we need to append blobs instead of objects
      const finalPayload = new FormData();
      finalPayload.append('category', String(categoryName || 'General Service'));
      finalPayload.append('title', String(issueTitle.trim() || `${categoryName} Service`));
      finalPayload.append('description', String(description.trim() || ''));
      finalPayload.append('schedule', JSON.stringify(scheduleObj));
      finalPayload.append('address', JSON.stringify(addressObj));

      for (let i = 0; i < images.length; i++) {
        let uriStr = typeof images[i] === 'string' ? images[i] : (images[i].uri || '');
        if (!uriStr) continue;

        let fileUri = uriStr.split('?')[0];
        try { fileUri = decodeURI(fileUri); } catch (e) {}

        if (Platform.OS === 'android' && !fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
          fileUri = `file://${fileUri}`;
        } else if (Platform.OS !== 'android' && !fileUri.startsWith('file://') && !fileUri.startsWith('ph://') && !fileUri.startsWith('assets-library://')) {
          fileUri = `file://${fileUri}`;
        }

        const nameOnly = fileUri.split('/').pop() || `image_${i}.jpg`;
        const extMatch = /\\.(\\w+)$/.exec(nameOnly);
        let finalType = extMatch ? `image/${extMatch[1].toLowerCase()}` : 'image/jpeg';
        if (finalType === 'image/jpg') finalType = 'image/jpeg';

        try {
          const fileResp = await fetch(fileUri);
          const fileBlob = await fileResp.blob();
          finalPayload.append('images', fileBlob, nameOnly);
        } catch (e) {
          // fallback to standard object if blob fails
          finalPayload.append('images', { uri: fileUri, name: nameOnly, type: finalType });
        }
      }
      payload = finalPayload;
    }

    const res = await createServiceRequestApi(userToken, payload);
    setLoading(false);

    if (res.success) {
      setShowSuccessModal(true);
    } else {
      setErrorMessage(res.message || 'Failed to submit service request. Please try again.');
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}
      className="flex-1 bg-[#f6f7f8]"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />

      {/* Perfectly Centered Top Header Bar */}
      <View className="bg-white px-5 py-3.5 border-b border-gray-200 flex-row items-center justify-between shadow-sm relative">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-[#f6f7f8] items-center justify-center border border-gray-200 z-10"
        >
          <ArrowLeft size={20} color="#0f1729" />
        </TouchableOpacity>

        {/* Absolute Centered Title */}
        <View className="absolute left-0 right-0 items-center justify-center pointer-events-none">
          <Text className="text-lg font-extrabold text-[#0f1729] font-display">
            Book a Service
          </Text>
        </View>

        {/* Empty Placeholder to preserve flex spacing */}
        <View className="w-10 h-10" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          className="px-5 py-5"
        >
          {/* Category Banner Card */}
          <View className="bg-[#0f1729] p-4 rounded-2xl mb-5 flex-row items-center justify-between shadow-md border border-slate-800">
            <View className="flex-1 pr-2">
              <View className="flex-row items-center mb-1">
                <Sparkles size={14} color="#60A5FA" />
                <Text className="text-[11px] font-bold text-blue-300 ml-1 uppercase tracking-wider">
                  Verified Local Service
                </Text>
              </View>
              <Text className="text-lg font-extrabold text-white">
                {categoryName} Request
              </Text>
              <Text className="text-xs text-slate-300 mt-0.5">
                Describe your issue & get competing bids from top pros
              </Text>
            </View>
            <View className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 items-center justify-center">
              <Wrench size={22} color="#FFFFFF" />
            </View>
          </View>

          {/* Error Alert Message */}
          {errorMessage !== '' && (
            <View className="mb-4 bg-red-50 border border-red-200 p-3.5 rounded-xl flex-row items-center">
              <AlertCircle size={18} color="#dc2626" />
              <Text className="text-sm font-semibold text-red-600 ml-2.5 flex-1">{errorMessage}</Text>
            </View>
          )}

          {/* Category & Issue Details Section */}
          <View className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-5">
            <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider mb-3">
              1. Issue Details
            </Text>

            {/* Title Input */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-[#6b7280] mb-1.5">Specific Issue / Title</Text>
              <View className="flex-row items-center bg-[#f6f7f8] border border-gray-200 rounded-xl px-3.5 py-3">
                <FileText size={18} color="#6b7280" />
                <TextInput
                  value={issueTitle}
                  onChangeText={setIssueTitle}
                  placeholder="e.g. Ceiling fan making clicking noise"
                  placeholderTextColor="#9ca3af"
                  className="flex-1 ml-2.5 text-sm text-[#0f1729]"
                />
              </View>
            </View>

            {/* Multiline Description Area */}
            <View>
              <Text className="text-xs font-semibold text-[#6b7280] mb-1.5">Detailed Description *</Text>
              <TextInput
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setErrorMessage('');
                }}
                placeholder="Describe the issue, required repairs, or specific instructions for the vendor (min 3-4 lines)..."
                placeholderTextColor="#9ca3af"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-[#f6f7f8] border border-gray-200 rounded-xl p-3.5 text-sm text-[#0f1729] min-h-[110px]"
              />
            </View>
          </View>

          {/* Photos Attachment Section */}
          <View className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider">
                2. Attach Issue Photos (Max 5)
              </Text>
              <Text className="text-xs font-semibold text-[#6b7280]">{images.length}/5</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {/* Add Photo Dashed Box */}
              {images.length < 5 && (
                <TouchableOpacity
                  onPress={handlePickImage}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-[#f6f7f8] items-center justify-center mr-3 active:opacity-80"
                >
                  <Camera size={24} color="#0f1729" />
                  <Text className="text-[11px] font-bold text-[#0f1729] mt-1">Add Photo</Text>
                </TouchableOpacity>
              )}

              {/* Thumbnail Previews */}
              {images.map((uri, index) => (
                <View key={index} className="relative w-24 h-24 mr-3 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-black/70 p-1.5 rounded-full"
                  >
                    <X size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Schedule Selector Section */}
          <View className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-5">
            <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider mb-3">
              3. Schedule Date & Time
            </Text>

            {/* Date Options */}
            <Text className="text-xs font-semibold text-[#6b7280] mb-2 flex-row items-center">
              <Calendar size={14} color="#6b7280" /> Preferred Date
            </Text>
            <View className="flex-row space-x-2 gap-2 mb-4">
              {DATE_OPTIONS.map((date) => {
                const isSelected = selectedDate === date;
                return (
                  <TouchableOpacity
                    key={date}
                    onPress={() => setSelectedDate(date)}
                    className={`flex-1 py-3 rounded-xl border items-center justify-center ${
                      isSelected ? 'bg-[#0f1729] border-[#0f1729]' : 'bg-[#f6f7f8] border-gray-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#0f1729]'}`}>
                      {date}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time Slot Chips */}
            <Text className="text-xs font-semibold text-[#6b7280] mb-2 flex-row items-center">
              <Clock size={14} color="#6b7280" /> Time Slot
            </Text>
            <View className="space-y-2 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTimeSlot === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => setSelectedTimeSlot(slot)}
                    className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                      isSelected ? 'bg-[#0f1729] border-[#0f1729]' : 'bg-[#f6f7f8] border-gray-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#0f1729]'}`}>
                      {slot}
                    </Text>
                    {isSelected && <Text className="text-white text-xs font-bold">✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Address Confirmation Card */}
          <View className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6">
            <View className="flex-row justify-between items-center mb-2.5">
              <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider">
                4. Service Address
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('LocationSetup')}>
                <Text className="text-xs font-bold text-[#0f1729] underline">Change Address</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-start bg-[#f6f7f8] p-3.5 rounded-xl border border-gray-200">
              <MapPin size={20} color="#0f1729" className="mt-0.5 mr-2" />
              <View className="flex-1 ml-2">
                <View className="flex-row items-center">
                  <Text className="text-sm font-extrabold text-[#0f1729]">
                    {currentAddress.addressTag || currentAddress.label || 'Saved'} Address
                  </Text>
                  {(currentAddress.zipCode || currentAddress.pincode) && (
                    <View className="ml-2 bg-slate-200 px-2 py-0.5 rounded text-[10px]">
                      <Text className="text-[10px] font-bold text-[#0f1729]">
                        {currentAddress.zipCode || currentAddress.pincode}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-[#6b7280] mt-1 leading-relaxed" numberOfLines={3}>
                  {currentAddress.formattedAddress
                    ? currentAddress.formattedAddress
                    : `${currentAddress.streetAddress || currentAddress.street || ''}${currentAddress.aptSuite ? ', ' + currentAddress.aptSuite : ''}${currentAddress.cityState ? ', ' + currentAddress.cityState : currentAddress.city ? ', ' + currentAddress.city : ''}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Reassurance Banner & Post Request Button */}
          <View className="mb-8">
            <View className="bg-slate-100 p-3.5 rounded-xl flex-row items-center justify-center mb-4 border border-slate-200">
              <ShieldCheck size={18} color="#0f1729" />
              <Text className="text-xs font-semibold text-[#0f1729] ml-2">
                Local verified vendors will send bids within minutes
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSubmitRequest}
              disabled={loading}
              style={{ backgroundColor: '#0f1729' }}
              className="bg-[#0f1729] py-4 rounded-xl flex-row items-center justify-center shadow-lg active:opacity-90"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text className="text-white font-extrabold text-base mr-2">Post Request & Get Bids</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white w-full rounded-2xl p-6 items-center shadow-lg">
            <View className="mb-4 mt-2">
              <CheckCircle size={56} color="#0f1729" />
            </View>
            <Text className="text-xl font-bold text-[#0f1729] mb-3 text-center">
              Request Sent Successfully
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-8 px-2 leading-relaxed">
              Your service request has been securely broadcasted to top verified professionals near you. You will receive competitive bids shortly.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('RequestDetails', { requestId: res.data._id });
              }}
              className="w-full bg-[#0f1729] py-4 rounded-xl items-center shadow-lg active:opacity-90"
            >
              <Text className="text-white font-bold text-base">View My Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
