import React, { useState, useContext, useEffect } from 'react';
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
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Plus, LocateFixed } from 'lucide-react-native';
import { sendVendorOtpApi, verifyVendorOtpApi } from '../services/api';
import { VendorAuthContext } from '../src/context/VendorAuthContext';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

const CATEGORIES = ['Electrician', 'Plumbing', 'AC Repair', 'Home Cleaning', 'Appliance Repair', 'Carpentry', 'Painting'];

const SUB_SERVICES_MAP = {
  'Electrician': ['Wiring', 'MCB / Fuse Repair', 'Ceiling Fan', 'Inverter Setup', 'Switchboard'],
  'Plumbing': ['Leakage Repair', 'Tap Installation', 'Pipe Fitting', 'Water Heater', 'Toilet Repair'],
  'AC Repair': ['AC Service', 'Gas Filling', 'Installation', 'Uninstallation', 'PCB Repair'],
  'Home Cleaning': ['Deep Cleaning', 'Bathroom Cleaning', 'Sofa Cleaning', 'Kitchen Cleaning'],
  'Appliance Repair': ['Washing Machine', 'Refrigerator', 'Microwave', 'Water Purifier'],
  'Carpentry': ['Furniture Assembly', 'Door Repair', 'Custom Woodwork', 'Lock Repair'],
  'Painting': ['Full Home Painting', 'Touchups', 'Waterproofing', 'Texture Painting'],
};

const EXPERIENCE_LEVELS = ['1-2 Years', '3-5 Years', '5-10 Years', '10+ Years'];

export default function VendorSignupScreen({ navigation }) {
  const { login } = useContext(VendorAuthContext);
  
  const [step, setStep] = useState(1); // 1 = Personal, 2 = Business, 3 = Location, 4 = OTP
  
  // Form State
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [subServices, setSubServices] = useState([]);
  const [experience, setExperience] = useState('');
  
  // Location State
  const webViewRef = React.useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [addressLine, setAddressLine] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(10);
  const [locationLoading, setLocationLoading] = useState(false);

  const [otp, setOtp] = useState('');
  const [testOtp, setTestOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const validateEmail = (emailStr) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!name.trim() || name.length < 3) return setErrorMsg('Name must be at least 3 characters.');
      if (mobileNumber.length < 10) return setErrorMsg('Enter a valid 10-digit mobile number.');
      if (email.trim() && !validateEmail(email)) return setErrorMsg('Enter a valid email address.');
      setStep(2);
    } else if (step === 2) {
      if (!businessName.trim()) return setErrorMsg('Business Name is required.');
      if (!category) return setErrorMsg('Please select a Primary Service Category.');
      if (!experience) return setErrorMsg('Please select Years of Experience.');
      setStep(3);
      if (!selectedLocation) locateMe(); // Attempt to locate as soon as they hit step 3
    }
  };

  const locateMe = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied. Please select manually on map.');
        setLocationLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setSelectedLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      updateMapPosition(loc.coords.latitude, loc.coords.longitude);
      
      // Reverse geocode
      let addressData = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });

      if (addressData && addressData.length > 0) {
        const addr = addressData[0];
        setAddressLine(addr.street || addr.name || '');
        setArea(addr.district || addr.subregion || '');
        setCity(addr.city || addr.region || '');
        setPincode(addr.postalCode || '');
      }
    } catch (err) {
      console.warn("Location error:", err);
    } finally {
      setLocationLoading(false);
    }
  };

  const updateMapPosition = (lat, lng) => {
    if (webViewRef.current) {
      const script = `if (window.updatePin) { window.updatePin(${lat}, ${lng}); } true;`;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleWebMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.lat && data.lng) {
        const latitude = data.lat;
        const longitude = data.lng;
        setSelectedLocation({ latitude, longitude });

        let addressData = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (addressData && addressData.length > 0) {
          const addr = addressData[0];
          setAddressLine(addr.street || addr.name || '');
          setArea(addr.district || addr.subregion || '');
          setCity(addr.city || addr.region || '');
          setPincode(addr.postalCode || '');
        }
      }
    } catch (e) {
      console.warn('Error handling web map message:', e);
    }
  };

  const currentLat = selectedLocation?.latitude || 21.1702;
  const currentLng = selectedLocation?.longitude || 72.8311;

  const leafletHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #e5e7eb; }
          .leaflet-control-attribution { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([${currentLat}, ${currentLng}], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          var marker = L.marker([${currentLat}, ${currentLng}], { draggable: true }).addTo(map);
          var circle = L.circle([${currentLat}, ${currentLng}], {
            color: '#0f1729',
            fillColor: 'rgba(15, 23, 41, 0.15)',
            fillOpacity: 0.5,
            radius: ${serviceRadiusKm * 1000}
          }).addTo(map);

          marker.on('dragend', function(e) {
            var position = marker.getLatLng();
            circle.setLatLng(position);
            window.ReactNativeWebView.postMessage(JSON.stringify({ lat: position.lat, lng: position.lng }));
          });

          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            circle.setLatLng(e.latlng);
            window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
          });

          window.updatePin = function(lat, lng) {
            map.setView([lat, lng], 13);
            marker.setLatLng([lat, lng]);
            circle.setLatLng([lat, lng]);
          };

          window.updateRadius = function(radiusMeters) {
            circle.setRadius(radiusMeters);
          };
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    if (webViewRef.current && step === 3) {
      const script = `if (window.updateRadius) { window.updateRadius(${serviceRadiusKm * 1000}); } true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [serviceRadiusKm, step]);

  const toggleSubService = (service) => {
    setSubServices(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const handlePrimaryCategorySelect = (cat) => {
    setCategory(cat);
    setSubServices([]); 
  };

  const handleSendOtp = async () => {
    setErrorMsg('');
    if (!selectedLocation || !pincode) return setErrorMsg('Please pin your location and ensure pincode is detected.');

    setLoading(true);
    try {
      const res = await sendVendorOtpApi(`+91${mobileNumber}`, 'signup');

      if (res.success) {
        setTestOtp(res.otp);
        setStep(4); // Go to OTP Step
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
    if (otp.length !== 6) return setErrorMsg('Please enter the 6-digit OTP.');

    setLoading(true);
    try {
      const payload = {
        mobileNumber: `+91${mobileNumber}`,
        otp,
        name: name.trim(),
        email: email.trim(),
        businessName: businessName.trim(),
        category,
        subServices,
        experienceYears: experience,
        pincodes: [pincode], // Operating pincode
        // Pass location payload safely
        address: {
          street: addressLine,
          area: area,
          city: city,
          pincode: pincode,
          location: {
            type: 'Point',
            coordinates: [selectedLocation.longitude, selectedLocation.latitude]
          }
        },
        serviceRadiusKm
      };
      const res = await verifyVendorOtpApi(payload);

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

  const renderProgressBar = () => {
    const titles = ['Personal Details', 'Trade & Business', 'Workshop Location', 'Verify OTP'];
    return (
      <View className="mb-6 px-4 pt-6">
        <View className="flex-row justify-between mb-2">
          <Text className="text-xs font-bold text-[#0f1729] uppercase">Step {step > 3 ? 3 : step} of 3</Text>
          <Text className="text-xs font-bold text-[#0f1729] uppercase">{titles[step - 1]}</Text>
        </View>
        <View className="flex-row h-2 bg-gray-200 rounded-full overflow-hidden">
          <View className="flex-1 bg-[#0f1729]" />
          <View className={`flex-1 ${step >= 2 ? 'bg-[#0f1729]' : 'bg-transparent'}`} />
          <View className={`flex-1 ${step >= 3 ? 'bg-[#0f1729]' : 'bg-transparent'}`} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-[#f6f7f8]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        
        {/* Header */}
        <View className="flex-row items-center px-4 py-4 border-b border-gray-200 bg-white shadow-sm z-10">
          <TouchableOpacity 
            onPress={() => {
              if (step > 1) setStep(step - 1);
              else navigation.goBack();
            }} 
            className="w-10 h-10 rounded-full bg-[#f6f7f8] items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color="#0f1729" />
          </TouchableOpacity>
          <Text className="text-lg font-extrabold text-[#0f1729]">Partner Registration</Text>
        </View>

        {step < 4 && renderProgressBar()}

        {step === 3 ? (
          // Location Map View - takes full space
          <View className="flex-1">
            <View className="flex-1 relative bg-slate-200">
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: leafletHTML }}
                style={{ flex: 1 }}
                onMessage={handleWebMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
              <TouchableOpacity 
                onPress={locateMe}
                className="absolute top-4 right-4 bg-white w-12 h-12 rounded-full items-center justify-center shadow-lg border border-gray-100"
              >
                {locationLoading ? <ActivityIndicator color="#0f1729" /> : <LocateFixed size={20} color="#0f1729" />}
              </TouchableOpacity>
            </View>

            {/* Bottom Form Sheet */}
            <View className="bg-white rounded-t-3xl p-5 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)]">
              <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider mb-2 ml-1">Service Coverage Radius</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 flex-row">
                {[3, 5, 10, 15, 25].map(km => {
                  const isActive = serviceRadiusKm === km;
                  return (
                    <TouchableOpacity
                      key={km}
                      onPress={() => setServiceRadiusKm(km)}
                      className={`mr-3 px-4 py-2 rounded-2xl border ${isActive ? 'bg-[#0f1729] border-[#0f1729]' : 'bg-white border-gray-200'}`}
                    >
                      <Text className={`font-bold ${isActive ? 'text-white' : 'text-[#6b7280]'}`}>{km} km</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text className="text-[#6b7280] text-[10px] ml-1 mb-4 italic">You will receive instant customer leads within this coverage zone.</Text>

              <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider mb-2 ml-1">Workshop / Base Address</Text>
              <TextInput
                value={addressLine}
                onChangeText={setAddressLine}
                placeholder="Street / Shop Address"
                className="bg-[#f6f7f8] border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-[#0f1729] mb-3"
              />
              <View className="flex-row gap-3 mb-4">
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  className="flex-1 bg-[#f6f7f8] border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-[#0f1729]"
                />
                <TextInput
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="Pincode"
                  keyboardType="numeric"
                  className="flex-1 bg-[#f6f7f8] border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-[#0f1729]"
                />
              </View>

              {errorMsg ? <Text className="text-sm text-red-500 font-bold mb-3 text-center">{errorMsg}</Text> : null}

              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={loading}
                className="bg-[#0f1729] py-4 rounded-xl items-center justify-center shadow-md shadow-[#0f1729]/30"
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-extrabold text-lg">Confirm Location</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {step === 1 && (
              <View className="mt-4">
                <View className="items-center mb-8">
                  <View className="relative">
                    <View className="w-24 h-24 bg-white rounded-full items-center justify-center shadow-sm border border-gray-200">
                      <Image 
                        source={require('../assets/logo.jpg')} 
                        className="w-full h-full rounded-full"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="absolute bottom-0 right-0 w-8 h-8 bg-[#0f1729] rounded-full items-center justify-center border-2 border-white">
                      <Plus size={16} color="#ffffff" strokeWidth={3} />
                    </View>
                  </View>
                  <Text className="text-2xl font-extrabold text-[#0f1729] mt-4 tracking-tight">Create Account</Text>
                </View>

                <View className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6">
                  
                  <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider mb-2 ml-1">Full Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={(t) => { setName(t); setErrorMsg(''); }}
                    placeholder="e.g. Vishesh Jain"
                    placeholderTextColor="#9ca3af"
                    className={`bg-[#f6f7f8] border ${errorMsg && !name.trim() ? 'border-red-400' : 'border-gray-100'} rounded-2xl px-5 py-4 text-base font-semibold text-[#0f1729] mb-5`}
                  />

                  <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider mb-2 ml-1">Mobile Number</Text>
                  <View className={`flex-row items-center border ${errorMsg && mobileNumber.length < 10 ? 'border-red-400' : 'border-gray-100'} rounded-2xl px-5 py-4 bg-[#f6f7f8] mb-5`}>
                    <Text className="text-base font-bold text-[#0f1729] mr-3 border-r border-gray-300 pr-3">+91 🇮🇳</Text>
                    <TextInput
                      value={mobileNumber}
                      onChangeText={(text) => {
                        setMobileNumber(text.replace(/[^0-9]/g, '').slice(0, 10));
                        setErrorMsg('');
                      }}
                      keyboardType="phone-pad"
                      placeholder="10 digit number"
                      placeholderTextColor="#9ca3af"
                      className="flex-1 text-base font-semibold text-[#0f1729]"
                    />
                  </View>

                  <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider mb-2 ml-1">Email Address (Optional)</Text>
                  <TextInput
                    value={email}
                    onChangeText={(t) => { setEmail(t); setErrorMsg(''); }}
                    placeholder="e.g. contact@business.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="bg-[#f6f7f8] border border-gray-100 rounded-2xl px-5 py-4 text-base font-semibold text-[#0f1729] mb-2"
                  />
                </View>
                {errorMsg ? <Text className="text-sm text-red-500 font-bold mb-4 text-center">{errorMsg}</Text> : null}
              </View>
            )}

            {step === 2 && (
              <View className="mt-4">
                <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider mb-2 ml-1">Business / Trade Name</Text>
                <View className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1 mb-6">
                  <TextInput
                    value={businessName}
                    onChangeText={(t) => { setBusinessName(t); setErrorMsg(''); }}
                    placeholder="e.g. Jain Electricals & Repairs"
                    placeholderTextColor="#9ca3af"
                    className="px-5 py-4 text-base font-semibold text-[#0f1729]"
                  />
                </View>

                <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider mb-2 ml-1">Primary Service Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 flex-row">
                  {CATEGORIES.map(cat => {
                    const isActive = category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => handlePrimaryCategorySelect(cat)}
                        className={`mr-3 px-5 py-3 rounded-2xl border ${isActive ? 'bg-[#0f1729] border-[#0f1729]' : 'bg-white border-gray-200'}`}
                      >
                        <Text className={`font-bold ${isActive ? 'text-white' : 'text-[#6b7280]'}`}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {category ? (
                  <>
                    <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider mb-2 ml-1">Sub-Services / Specializations</Text>
                    <View className="flex-row flex-wrap gap-2 mb-6">
                      {SUB_SERVICES_MAP[category]?.map(sub => {
                        const isSelected = subServices.includes(sub);
                        return (
                          <TouchableOpacity
                            key={sub}
                            onPress={() => toggleSubService(sub)}
                            className={`flex-row items-center px-4 py-2.5 rounded-2xl border ${isSelected ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-gray-200'}`}
                          >
                            {isSelected && <Check size={14} color="#10b981" className="mr-1.5" />}
                            <Text className={`font-bold text-sm ${isSelected ? 'text-emerald-800' : 'text-[#6b7280]'}`}>{sub}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                <Text className="text-xs font-bold text-[#0f1729] uppercase tracking-wider mb-2 ml-1">Years of Experience</Text>
                <View className="flex-row flex-wrap gap-3 mb-6">
                  {EXPERIENCE_LEVELS.map(exp => {
                    const isActive = experience === exp;
                    return (
                      <TouchableOpacity
                        key={exp}
                        onPress={() => setExperience(exp)}
                        className={`w-[47%] py-3.5 rounded-2xl items-center border ${isActive ? 'bg-[#0f1729] border-[#0f1729]' : 'bg-white border-gray-200'}`}
                      >
                        <Text className={`font-bold ${isActive ? 'text-white' : 'text-[#6b7280]'}`}>{exp}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {errorMsg ? <Text className="text-sm text-red-500 font-bold mb-4 text-center">{errorMsg}</Text> : null}
              </View>
            )}

            {step === 4 && (
              <View className="mt-12 items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                {testOtp ? (
                  <View className="bg-[#f0fdf4] border border-[#bbf7d0] p-5 rounded-3xl mb-8 items-center shadow-sm w-full">
                    <Text className="text-xs font-bold text-[#166534] uppercase tracking-widest mb-1">
                      Test OTP Code
                    </Text>
                    <Text className="text-2xl font-black text-[#15803d] tracking-[8px]">
                      {testOtp}
                    </Text>
                  </View>
                ) : null}

                <Text className="text-lg font-bold text-[#0f1729] mb-2">Verify Mobile Number</Text>
                <Text className="text-sm text-[#6b7280] font-medium text-center mb-8">
                  We sent a 6-digit secure code to +91 {mobileNumber}
                </Text>

                <TextInput
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                    setErrorMsg('');
                  }}
                  keyboardType="number-pad"
                  placeholder="0 0 0 0 0 0"
                  placeholderTextColor="#d1d5db"
                  className={`w-full text-center text-4xl tracking-[12px] font-black bg-[#f6f7f8] border ${errorMsg ? 'border-red-400 text-red-500' : 'border-gray-100 text-[#0f1729]'} rounded-3xl py-6 shadow-sm mb-2`}
                />

                {errorMsg ? <Text className="text-sm text-red-500 mt-3 text-center font-semibold">{errorMsg}</Text> : null}
                
                <TouchableOpacity onPress={() => setStep(3)} className="mt-8 items-center">
                  <Text className="text-sm font-bold text-[#6b7280] underline">Go back & edit location</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        )}
        
        {/* Sticky Bottom Footer for Buttons (Only for Step 1 & 2 & 4) */}
        {step !== 3 && (
          <View className="bg-white border-t border-gray-200 px-5 pt-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            {step === 1 && (
              <TouchableOpacity
                onPress={handleNextStep}
                className="bg-[#0f1729] py-5 rounded-2xl items-center justify-center shadow-md shadow-[#0f1729]/30"
              >
                <Text className="text-white font-extrabold text-lg">Continue to Business Details</Text>
              </TouchableOpacity>
            )}
            {step === 2 && (
              <TouchableOpacity
                onPress={handleNextStep}
                disabled={loading}
                className="bg-[#0f1729] py-5 rounded-2xl items-center justify-center shadow-md shadow-[#0f1729]/30"
              >
                <Text className="text-white font-extrabold text-lg">Set Service Area</Text>
              </TouchableOpacity>
            )}
            {step === 4 && (
              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={loading}
                className="bg-[#0f1729] py-5 rounded-2xl items-center justify-center shadow-md shadow-[#0f1729]/30"
              >
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-extrabold text-lg tracking-wide">Verify OTP & Log In</Text>}
              </TouchableOpacity>
            )}
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
