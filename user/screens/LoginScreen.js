import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowRight, ChevronDown, Check, Smartphone, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react-native';
import { sendOtpApi, verifyOtpApi } from '../services/api';

const COUNTRY_CODES = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
];

export default function LoginScreen({ onNavigateToSignup, onLoginSuccess }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [testOtpBanner, setTestOtpBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const otpInputs = useRef([]);

  const handleSendOtp = async () => {
    setErrorMessage('');
    if (!phone.trim()) {
      setErrorMessage('Please enter a valid mobile number.');
      return;
    }

    setLoading(true);
    const fullPhone = `${selectedCountry.code}${phone.trim()}`;
    const res = await sendOtpApi(fullPhone);
    setLoading(false);

    if (res.success) {
      // Display received OTP directly on the screen in test banner as per Rule #3
      if (res.otp) {
        setTestOtpBanner(res.otp);
        // Pre-fill digits for quick test verification
        const digits = res.otp.split('');
        if (digits.length === 6) setOtp(digits);
      }
      setStep('otp');
    } else {
      setErrorMessage(res.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    const fullPhone = `${selectedCountry.code}${phone.trim()}`;
    const res = await verifyOtpApi(fullPhone, fullOtp);
    setLoading(false);

    if (res.success) {
      if (onLoginSuccess) {
        onLoginSuccess(res.user, res.token);
      }
    } else {
      setErrorMessage(res.message || 'Invalid OTP code. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#f6f7f8]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
        className="px-6 py-12"
      >
        {step === 'otp' && (
          <TouchableOpacity
            onPress={() => {
              setStep('phone');
              setErrorMessage('');
            }}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center mb-4 shadow-sm"
          >
            <ArrowLeft size={20} color="#0f1729" />
          </TouchableOpacity>
        )}

        {/* Centered Circular Logo */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-white shadow-md p-1 border-2 border-[#0f1729] items-center justify-center">
            <Image
              source={require('../assets/logo.png')}
              style={{ width: 84, height: 84, borderRadius: 42 }}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Header */}
        <View className="mb-6 items-center">
          <Text className="text-3xl font-extrabold text-[#0f1729] tracking-tight font-display mb-2 text-center">
            {step === 'phone' ? 'Welcome Back' : 'Verify Mobile'}
          </Text>
          <Text className="text-base text-[#6b7280] text-center">
            {step === 'phone'
              ? 'Enter your mobile number to receive a 6-digit OTP'
              : `Enter the 6-digit OTP sent to ${selectedCountry.code} ${phone}`}
          </Text>
        </View>

        {/* Test OTP Banner as per Rule #3 */}
        {testOtpBanner !== '' && step === 'otp' && (
          <View className="mb-6 bg-amber-50 border-2 border-amber-400 p-4 rounded-xl flex-row items-center justify-between shadow-sm">
            <View className="flex-row items-center flex-1 mr-2">
              <KeyRound size={22} color="#d97706" />
              <View className="ml-3">
                <Text className="text-xs font-bold text-amber-800 uppercase tracking-wider">Test Verification Mode</Text>
                <Text className="text-base font-extrabold text-amber-900">
                  Received OTP: <Text className="text-lg underline">{testOtpBanner}</Text>
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Error Feedback Message */}
        {errorMessage !== '' && (
          <View className="mb-4 bg-red-50 border border-red-200 p-3 rounded-xl">
            <Text className="text-sm font-semibold text-red-600 text-center">{errorMessage}</Text>
          </View>
        )}

        {step === 'phone' ? (
          /* Step 1: Mobile Number Input */
          <View className="space-y-4 mb-6">
            <View>
              <Text className="text-xs font-semibold text-[#0f1729] uppercase tracking-wider mb-2">
                Mobile Number
              </Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3.5 shadow-sm">
                <TouchableOpacity
                  onPress={() => setShowCountryModal(true)}
                  className="flex-row items-center pr-3 border-r border-gray-200"
                >
                  <Text className="text-base mr-1">{selectedCountry.flag}</Text>
                  <Text className="text-base font-semibold text-[#0f1729] mr-1">
                    {selectedCountry.code}
                  </Text>
                  <ChevronDown size={16} color="#6b7280" />
                </TouchableOpacity>
                <Smartphone size={20} color="#6b7280" className="ml-3 mr-2" />
                <TextInput
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    setErrorMessage('');
                  }}
                  placeholder="98765 43210"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  className="flex-1 text-base text-[#0f1729]"
                />
              </View>
            </View>

            {/* Send OTP Action Button */}
            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={loading}
              style={{ backgroundColor: '#0f1729' }}
              className="bg-[#0f1729] py-4 rounded-xl flex-row items-center justify-center shadow-md active:opacity-90 mt-4"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text className="text-white font-bold text-base mr-2">Send OTP Code</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Step 2: 6-Digit OTP Verification */
          <View className="space-y-6 mb-6">
            <View className="flex-row justify-between my-4">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (otpInputs.current[index] = ref)}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={{ borderColor: digit ? '#0f1729' : '#e5e7eb' }}
                  className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-bold text-[#0f1729] bg-white ${
                    digit ? 'border-[#0f1729]' : 'border-gray-200'
                  }`}
                />
              ))}
            </View>

            {/* Resend Code Option */}
            <TouchableOpacity onPress={handleSendOtp} className="flex-row items-center justify-center space-x-1 mb-4">
              <RefreshCw size={16} color="#0f1729" />
              <Text style={{ color: '#0f1729' }} className="text-sm font-semibold text-[#0f1729] ml-1">
                Resend OTP Code
              </Text>
            </TouchableOpacity>

            {/* Verify & Proceed Button */}
            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={loading}
              style={{ backgroundColor: '#0f1729' }}
              className="bg-[#0f1729] py-4 rounded-xl flex-row items-center justify-center shadow-md active:opacity-90"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text className="text-white font-bold text-base mr-2">Verify & Sign In</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Footer Link to Signup */}
        <View className="flex-row justify-center items-center mt-6">
          <Text className="text-sm text-[#6b7280]">Don't have an account? </Text>
          <TouchableOpacity onPress={onNavigateToSignup}>
            <Text className="text-sm font-bold text-[#0f1729]">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Country Code Modal */}
      <Modal visible={showCountryModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6 max-h-[60%] border-t border-gray-100">
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <Text className="text-lg font-bold text-[#0f1729]">Select Country Code</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Text className="text-sm font-bold text-[#6b7280]">Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowCountryModal(false);
                  }}
                  className="flex-row items-center justify-between p-3.5 border-b border-gray-100"
                >
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">{item.flag}</Text>
                    <Text className="text-base font-semibold text-[#0f1729]">
                      {item.name} ({item.code})
                    </Text>
                  </View>
                  {selectedCountry.code === item.code && (
                    <Check size={18} color="#0f1729" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
