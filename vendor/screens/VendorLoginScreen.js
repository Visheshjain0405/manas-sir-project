import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendVendorOtpApi, verifyVendorOtpApi } from '../services/api';
import { VendorAuthContext } from '../src/context/VendorAuthContext';

export default function VendorLoginScreen({ navigation }) {
  const { login } = useContext(VendorAuthContext);
  const [step, setStep] = useState(1);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [testOtp, setTestOtp] = useState('');
  
  const [timer, setTimer] = useState(30);
  const timerRef = useRef(null);

  useEffect(() => {
    if (step === 2) {
      setTimer(30);
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const handleSendOtp = async () => {
    setErrorMsg('');
    if (mobileNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendVendorOtpApi(`+91${mobileNumber}`, 'login');

      if (res.success) {
        setTestOtp(res.otp);
        setStep(2);
      } else {
        setErrorMsg(res.message || 'Failed to send OTP. Try again.');
      }
    } catch (error) {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');
    if (otp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyVendorOtpApi({
        mobileNumber: `+91${mobileNumber}`,
        otp,
      });

      if (res.success) {
        await login(res.token, res.vendor);
      } else {
        setErrorMsg(res.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingVertical: 40, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
          
          <View className="items-center mb-12">
            <View className="shadow-lg shadow-[#0f1729]/10 rounded-full mb-8">
              <Image 
                source={require('../assets/logo.jpg')} 
                className="w-28 h-28 rounded-full"
                resizeMode="cover"
              />
            </View>
            <Text className="text-3xl font-extrabold text-[#0f1729] mt-2 mb-2 tracking-tight">Partner Login</Text>
            <Text className="text-base text-[#6b7280] text-center font-medium">Access your dashboard to manage jobs.</Text>
          </View>

          {step === 1 ? (
            <View>
              <Text className="text-sm font-bold text-[#0f1729] mb-3 ml-1 uppercase tracking-widest">Mobile Number</Text>
              <View className="flex-row items-center bg-[#f6f7f8] rounded-3xl px-5 py-5 shadow-sm border border-gray-100">
                <Text className="text-lg font-bold text-[#0f1729] mr-4">+91</Text>
                <View className="w-[1px] h-6 bg-gray-300 mr-4" />
                <TextInput
                  value={mobileNumber}
                  onChangeText={(text) => {
                    setMobileNumber(text.replace(/[^0-9]/g, '').slice(0, 10));
                    setErrorMsg('');
                  }}
                  keyboardType="phone-pad"
                  placeholder="Enter 10 digit number"
                  placeholderTextColor="#9ca3af"
                  className="flex-1 text-lg font-bold text-[#0f1729]"
                />
              </View>

              {errorMsg ? (
                <Text className="text-sm text-red-500 mt-4 text-center font-semibold">{errorMsg}</Text>
              ) : null}

              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={loading}
                className="bg-[#0f1729] py-5 rounded-3xl items-center justify-center mt-10 shadow-lg shadow-[#0f1729]/30"
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-extrabold text-lg tracking-wide">Continue Securely</Text>
                )}
              </TouchableOpacity>

              <View className="flex-row items-center mt-12 mb-6">
                <View className="flex-1 h-[1px] bg-gray-200" />
                <Text className="text-sm text-gray-400 font-bold px-4 uppercase tracking-wider">New Vendor?</Text>
                <View className="flex-1 h-[1px] bg-gray-200" />
              </View>

              <TouchableOpacity 
                onPress={() => navigation.navigate('VendorSignup')} 
                className="py-4 rounded-3xl border-2 border-[#0f1729] items-center justify-center bg-white"
              >
                <Text className="text-lg text-[#0f1729] font-extrabold tracking-wide">Apply as Partner</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              
              {testOtp ? (
                <View className="bg-[#f0fdf4] border border-[#bbf7d0] p-5 rounded-3xl mb-8 items-center shadow-sm">
                  <Text className="text-xs font-bold text-[#166534] uppercase tracking-widest mb-1">
                    Test OTP Code
                  </Text>
                  <Text className="text-2xl font-black text-[#15803d] tracking-[8px]">
                    {testOtp}
                  </Text>
                </View>
              ) : null}

              <View className="items-center mb-8">
                <Text className="text-lg font-bold text-[#0f1729] mb-2">Verify Mobile Number</Text>
                <Text className="text-sm text-[#6b7280] font-medium text-center">
                  We sent a 6-digit secure code to +91 {mobileNumber}
                </Text>
              </View>

              <TextInput
                value={otp}
                onChangeText={(text) => {
                  setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                  setErrorMsg('');
                }}
                keyboardType="number-pad"
                placeholder="0 0 0 0 0 0"
                placeholderTextColor="#d1d5db"
                className={`text-center text-4xl tracking-[12px] font-black bg-[#f6f7f8] border ${errorMsg ? 'border-red-400 text-red-500' : 'border-gray-100 text-[#0f1729]'} rounded-3xl py-6 shadow-sm mb-2`}
              />

              {errorMsg ? (
                <Text className="text-sm text-red-500 mt-3 text-center font-semibold">{errorMsg}</Text>
              ) : null}

              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={loading}
                className="bg-[#0f1729] py-5 rounded-3xl items-center justify-center mt-8 shadow-lg shadow-[#0f1729]/30"
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-extrabold text-lg tracking-wide">Verify & Log In</Text>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-between items-center mt-10 px-2">
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text className="text-base font-bold text-[#0f1729] opacity-70">Change Number</Text>
                </TouchableOpacity>

                <TouchableOpacity disabled={timer > 0} onPress={handleSendOtp}>
                  <Text className={`text-base font-bold ${timer > 0 ? 'text-gray-400' : 'text-[#0f1729]'}`}>
                    Resend Code {timer > 0 ? `(${timer}s)` : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
