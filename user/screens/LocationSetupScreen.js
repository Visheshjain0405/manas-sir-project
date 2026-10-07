import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { MapPin, Navigation, Search, Check, ArrowRight, Home, Briefcase, Building, X, Crosshair } from 'lucide-react-native';
import { updateLocationApi } from '../services/api';

const POPULAR_CITIES = [
  { id: '1', name: 'San Francisco, CA', country: 'United States', lat: 37.7749, lng: -122.4194 },
  { id: '2', name: 'New York, NY', country: 'United States', lat: 40.7128, lng: -74.0060 },
  { id: '3', name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { id: '4', name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { id: '5', name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { id: '6', name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
  { id: '7', name: 'Mumbai, MH', country: 'India', lat: 19.0760, lng: 72.8777 },
  { id: '8', name: 'New Delhi, DL', country: 'India', lat: 28.6139, lng: 77.2090 },
];

export default function LocationSetupScreen({ userToken, onCompleteSetup }) {
  const [coords, setCoords] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
  });

  const webViewRef = useRef(null);
  const [streetAddress, setStreetAddress] = useState('');
  const [aptSuite, setAptSuite] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [landmark, setLandmark] = useState('');
  const [cityState, setCityState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [addressTag, setAddressTag] = useState('Home');
  const [showCityModal, setShowCityModal] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    requestLiveLocation();
  }, []);

  const parseGeocodeResult = (place) => {
    if (!place) return;

    const houseNo = place.streetNumber || place.name || '';
    const streetName = place.street || place.district || '';
    const fullStreet = `${houseNo} ${streetName}`.trim() || place.name || '';

    const subArea = place.district || place.subregion || place.neighborhood || '';

    const city = place.city || place.subregion || place.district || '';
    const state = place.region || '';
    const fullCityState = `${city}${city && state ? ', ' : ''}${state}`.trim();

    if (fullStreet) setStreetAddress(fullStreet);
    if (subArea) setNeighborhood(subArea);
    if (fullCityState) setCityState(fullCityState);
    if (place.postalCode) setZipCode(place.postalCode);
    if (place.country) setCountry(place.country);
  };

  const requestLiveLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission was denied. You can select your address manually or from the city selector.'
        );
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setCoords({ latitude, longitude });
      updateMapPosition(latitude, longitude);

      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseGeocode && reverseGeocode.length > 0) {
        parseGeocodeResult(reverseGeocode[0]);
      }
    } catch (error) {
      console.warn('Error fetching live location:', error);
    } finally {
      setLoadingLocation(false);
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
        setCoords({ latitude, longitude });

        const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocode && reverseGeocode.length > 0) {
          parseGeocodeResult(reverseGeocode[0]);
        }
      }
    } catch (e) {
      console.warn('Error handling web map message:', e);
    }
  };

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
          var map = L.map('map', { zoomControl: false }).setView([${coords.latitude}, ${coords.longitude}], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          var marker = L.marker([${coords.latitude}, ${coords.longitude}], { draggable: true }).addTo(map);

          marker.on('dragend', function(e) {
            var position = marker.getLatLng();
            window.ReactNativeWebView.postMessage(JSON.stringify({ lat: position.lat, lng: position.lng }));
          });

          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
          });

          window.updatePin = function(lat, lng) {
            map.setView([lat, lng], 15);
            marker.setLatLng([lat, lng]);
          };
        </script>
      </body>
    </html>
  `;

  const filteredCities = POPULAR_CITIES.filter((city) =>
    `${city.name} ${city.country}`.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleSaveLocation = async () => {
    const formatted = `${streetAddress}${aptSuite ? ', ' + aptSuite : ''}${neighborhood ? ', ' + neighborhood : ''}${cityState ? ', ' + cityState : ''}`;
    
    const addressDetails = {
      houseNo: aptSuite || streetAddress,
      area: neighborhood,
      landmark,
      city: cityState,
      state: country,
      pincode: zipCode,
      formattedAddress: formatted,
    };

    if (userToken) {
      setSavingLocation(true);
      await updateLocationApi(userToken, coords.latitude, coords.longitude, addressDetails);
      setSavingLocation(false);
    }

    if (onCompleteSetup) {
      onCompleteSetup({
        streetAddress,
        aptSuite,
        cityState,
        zipCode,
        addressTag,
        coordinate: coords,
        formattedAddress: formatted,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#f6f7f8]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Map View Container using Leaflet + OpenStreetMap */}
        <View className="relative w-full h-[300px] bg-slate-200">
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: leafletHTML }}
            style={{ width: '100%', height: '100%' }}
            onMessage={handleWebMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />

          {/* Floating GPS Recenter Button */}
          <TouchableOpacity
            onPress={requestLiveLocation}
            style={{ backgroundColor: '#ffffff' }}
            className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg border border-gray-200 items-center justify-center flex-row"
          >
            {loadingLocation ? (
              <ActivityIndicator size="small" color="#0f1729" />
            ) : (
              <Crosshair size={22} color="#0f1729" />
            )}
          </TouchableOpacity>
        </View>

        {/* Form Container */}
        <View className="px-6 py-6 flex-1">
          {/* Header */}
          <View className="mb-4">
            <Text className="text-2xl font-extrabold text-[#0f1729] tracking-tight font-display mb-1">
              Confirm Delivery Address
            </Text>
            <Text className="text-sm text-[#6b7280]">
              Pinpoint your location on the map or edit the details below
            </Text>
          </View>

          {/* Address Input Form */}
          <View className="space-y-3 mb-6">
            {/* Street Address */}
            <View>
              <Text className="text-xs font-semibold text-[#0f1729] uppercase tracking-wider mb-1">
                House / Street Address <Text className="text-[#ef4444]">*</Text>
              </Text>
              <View className={`flex-row items-center bg-white border rounded-xl px-3.5 py-2.5 shadow-sm ${streetAddress.length > 0 && streetAddress.trim().length < 5 ? 'border-[#ef4444]' : 'border-gray-200'}`}>
                <MapPin size={18} color="#6b7280" />
                <TextInput
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                  placeholder="123 Main Street"
                  placeholderTextColor="#9ca3af"
                  className="flex-1 ml-2.5 text-sm text-[#0f1729]"
                />
              </View>
              {streetAddress.length > 0 && streetAddress.trim().length < 5 && (
                <Text className="text-[#ef4444] text-xs mt-1">Address must be at least 5 characters</Text>
              )}
            </View>

            {/* Apt / Suite / Unit */}
            <View className="mt-2.5">
              <Text className="text-xs font-semibold text-[#0f1729] uppercase tracking-wider mb-1">
                Apt / Flat / Floor (Optional)
              </Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-sm">
                <Building size={18} color="#6b7280" />
                <TextInput
                  value={aptSuite}
                  onChangeText={setAptSuite}
                  placeholder="Apt 4B / Floor 2"
                  placeholderTextColor="#9ca3af"
                  className="flex-1 ml-2.5 text-sm text-[#0f1729]"
                />
              </View>
            </View>

            {/* Neighborhood / Area / Suburb */}
            <View className="mt-2.5">
              <Text className="text-xs font-semibold text-[#0f1729] uppercase tracking-wider mb-1">
                Area / Neighborhood
              </Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-sm">
                <Navigation size={18} color="#6b7280" />
                <TextInput
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                  placeholder="Downtown / Sector 15"
                  placeholderTextColor="#9ca3af"
                  className="flex-1 ml-2.5 text-sm text-[#0f1729]"
                />
              </View>
            </View>

            {/* Nearby Landmark */}
            <View className="mt-2.5">
              <Text className="text-xs font-semibold text-[#0f1729] uppercase tracking-wider mb-1">
                Nearby Landmark (Optional)
              </Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-sm">
                <MapPin size={18} color="#6b7280" />
                <TextInput
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="Near City Hospital / Park"
                  placeholderTextColor="#9ca3af"
                  className="flex-1 ml-2.5 text-sm text-[#0f1729]"
                />
              </View>
            </View>

            {/* City & State Selector */}
            <View className="mt-2.5">
              <Text className="text-xs font-semibold text-[#0f1729] uppercase tracking-wider mb-1">
                City & State <Text className="text-[#ef4444]">*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setShowCityModal(true)}
                className={`flex-row items-center bg-white border rounded-xl px-3.5 py-2.5 shadow-sm ${cityState.length > 0 && cityState.trim().length < 2 ? 'border-[#ef4444]' : 'border-gray-200'}`}
              >
                <Search size={18} color="#6b7280" />
                <Text
                  className={`flex-1 ml-2.5 text-sm ${
                    cityState ? 'text-[#0f1729]' : 'text-gray-400'
                  }`}
                >
                  {cityState || 'Select city & state...'}
                </Text>
              </TouchableOpacity>
              {cityState.length > 0 && cityState.trim().length < 2 && (
                <Text className="text-[#ef4444] text-xs mt-1">City must be at least 2 characters</Text>
              )}
            </View>

            {/* Zip / Postal Code & Country Row */}
            <View className="flex-row space-x-3 gap-3 mt-2.5">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-[#0f1729] uppercase tracking-wider mb-1">
                  Zip / Postal Code <Text className="text-[#ef4444]">*</Text>
                </Text>
                <View className={`flex-row items-center bg-white border rounded-xl px-3.5 py-2.5 shadow-sm ${zipCode.length > 0 && !/^[1-9][0-9]{5}$/.test(zipCode) ? 'border-[#ef4444]' : 'border-gray-200'}`}>
                  <TextInput
                    value={zipCode}
                    onChangeText={setZipCode}
                    placeholder="90210"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    className="flex-1 text-sm text-[#0f1729]"
                    maxLength={6}
                  />
                </View>
                {zipCode.length > 0 && !/^[1-9][0-9]{5}$/.test(zipCode) && (
                  <Text className="text-[#ef4444] text-xs mt-1">Must be exactly 6 digits</Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-xs font-semibold text-[#0f1729] uppercase tracking-wider mb-1">
                  Country
                </Text>
                <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-sm">
                  <TextInput
                    value={country}
                    onChangeText={setCountry}
                    placeholder="United States"
                    placeholderTextColor="#9ca3af"
                    className="flex-1 text-sm text-[#0f1729]"
                  />
                </View>
              </View>
            </View>

            {/* Save Address As Tag (Home, Work, Other) */}
            <View className="mt-3">
              <Text className="text-xs font-semibold text-[#0f1729] uppercase tracking-wider mb-1.5">
                Save Address As
              </Text>
              <View className="flex-row space-x-3 gap-3">
                <TouchableOpacity
                  onPress={() => setAddressTag('Home')}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl border ${
                    addressTag === 'Home'
                      ? 'bg-[#0f1729] border-[#0f1729]'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Home size={16} color={addressTag === 'Home' ? '#ffffff' : '#6b7280'} />
                  <Text
                    className={`ml-1.5 text-xs font-semibold ${
                      addressTag === 'Home' ? 'text-white' : 'text-[#0f1729]'
                    }`}
                  >
                    Home
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAddressTag('Work')}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl border ${
                    addressTag === 'Work'
                      ? 'bg-[#0f1729] border-[#0f1729]'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Briefcase size={16} color={addressTag === 'Work' ? '#ffffff' : '#6b7280'} />
                  <Text
                    className={`ml-1.5 text-xs font-semibold ${
                      addressTag === 'Work' ? 'text-white' : 'text-[#0f1729]'
                    }`}
                  >
                    Work
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAddressTag('Other')}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl border ${
                    addressTag === 'Other'
                      ? 'bg-[#0f1729] border-[#0f1729]'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <MapPin size={16} color={addressTag === 'Other' ? '#ffffff' : '#6b7280'} />
                  <Text
                    className={`ml-1.5 text-xs font-semibold ${
                      addressTag === 'Other' ? 'text-[#ffffff]' : 'text-[#0f1729]'
                    }`}
                  >
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Complete Setup Action Button */}
          <TouchableOpacity
            onPress={handleSaveLocation}
            disabled={savingLocation || streetAddress.trim().length < 5 || cityState.trim().length < 2 || !/^[1-9][0-9]{5}$/.test(zipCode) || !coords.latitude || !coords.longitude}
            style={{ backgroundColor: (streetAddress.trim().length < 5 || cityState.trim().length < 2 || !/^[1-9][0-9]{5}$/.test(zipCode) || !coords.latitude) ? '#9ca3af' : '#0f1729' }}
            className={`py-3.5 rounded-xl flex-row items-center justify-center shadow-md active:opacity-90 mt-2 mb-6`}
          >
            {savingLocation ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text className="text-white font-bold text-sm mr-2">Save Address & Continue</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* City & State Selection Modal */}
      <Modal visible={showCityModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6 h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-[#0f1729]">Select City & State</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* City Search Bar */}
            <View className="flex-row items-center bg-[#f6f7f8] border border-gray-200 rounded-xl px-4 py-2.5 mb-4">
              <Search size={18} color="#6b7280" />
              <TextInput
                value={citySearch}
                onChangeText={setCitySearch}
                placeholder="Search city..."
                placeholderTextColor="#9ca3af"
                className="flex-1 ml-3 text-sm text-[#0f1729]"
              />
            </View>

            {/* City List */}
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = cityState === item.name;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setCityState(item.name);
                      setCoords({ latitude: item.lat, longitude: item.lng });
                      updateMapPosition(item.lat, item.lng);
                      setShowCityModal(false);
                    }}
                    className={`flex-row items-center p-3 rounded-xl mb-2 border ${
                      isSelected ? 'border-[#0f1729] bg-slate-50' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <MapPin size={18} color={isSelected ? '#0f1729' : '#6b7280'} />
                    <View className="flex-1 ml-3">
                      <Text className="text-sm font-semibold text-[#0f1729]">
                        {item.name}
                      </Text>
                      <Text className="text-xs text-[#6b7280]">{item.country}</Text>
                    </View>
                    {isSelected && <Check size={18} color="#0f1729" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
