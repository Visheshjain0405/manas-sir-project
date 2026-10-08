import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin,
  ChevronDown,
  Bell,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  DollarSign,
  Star,
  Clock,
  User,
  X,
  Check,
  Sparkles,
  Wrench,
  Wind,
  Tv,
  Hammer,
  Palette,
  Bug,
  Tag,
} from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';
import { getMyRequestsApi } from '../services/api';

const CATEGORIES = [
  { id: '1', name: 'Electrician', icon: Zap, iconColor: '#D97706', bgColor: '#FEF3C7' },
  { id: '2', name: 'Plumbing', icon: Wrench, iconColor: '#2563EB', bgColor: '#DBEAFE' },
  { id: '3', name: 'AC Repair', icon: Wind, iconColor: '#4F46E5', bgColor: '#E0E7FF' },
  { id: '4', name: 'Cleaning', icon: Sparkles, iconColor: '#DC2626', bgColor: '#FEE2E2' },
  { id: '5', name: 'Appliance', icon: Tv, iconColor: '#9333EA', bgColor: '#F3E8FF' },
  { id: '6', name: 'Carpenter', icon: Hammer, iconColor: '#B45309', bgColor: '#FEF3C7' },
  { id: '7', name: 'Painting', icon: Palette, iconColor: '#059669', bgColor: '#D1FAE5' },
  { id: '8', name: 'Pest Control', icon: Bug, iconColor: '#E11D48', bgColor: '#FFE4E6' },
];

export default function HomeScreen({ navigation }) {
  const { user, token } = useAuth();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeRequest, setActiveRequest] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      // Fetch active request
      const activeRes = await getMyRequestsApi(token, 'active');
      if (activeRes.success && activeRes.requests && activeRes.requests.length > 0) {
        setActiveRequest(activeRes.requests[0]);
      } else {
        setActiveRequest(null);
      }

      // Fetch completed requests
      const completedRes = await getMyRequestsApi(token, 'completed');
      if (completedRes.success && completedRes.requests) {
        setRecentRequests(completedRes.requests);
      }
    } catch (err) {
      console.warn('Error fetching dashboard requests:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Format Address for Active Bar
  const displayAddress = () => {
    if (!user || (!user.addressDetails && !user.address)) {
      return 'Set your delivery location ▾';
    }
    const addr = user.addressDetails || user.address;
    const label = addr.label || 'Home';
    const street = addr.street || addr.houseNo || addr.area || '';
    const city = addr.city || '';
    if (!street && !city) return 'Set your delivery location ▾';
    return `${label}: ${street}${street && city ? ', ' : ''}${city}`;
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-[#f6f7f8]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* 1. Top Header & Address Bar */}
        <View className="bg-white border-b border-gray-200 px-5 pt-4 pb-5 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            {/* Dynamic Address Switcher Chip */}
            <TouchableOpacity
              onPress={() => navigation.navigate('LocationSetup')}
              className="flex-1 flex-row items-center bg-[#f6f7f8] border border-gray-200 rounded-full px-3.5 py-2 mr-3"
            >
              <MapPin size={16} color="#0f1729" />
              <Text
                numberOfLines={1}
                className="flex-1 text-xs font-semibold text-[#0f1729] ml-1.5 mr-1"
              >
                {displayAddress()}
              </Text>
              <ChevronDown size={14} color="#6b7280" />
            </TouchableOpacity>

            {/* Header Right Action Icons */}
            <View className="flex-row items-center space-x-3 gap-3">
              <TouchableOpacity className="relative w-10 h-10 rounded-full bg-[#f6f7f8] border border-gray-200 items-center justify-center">
                <Bell size={18} color="#0f1729" />
                <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation && navigation.navigate('Profile')}
                className="w-10 h-10 rounded-full bg-[#0f1729] items-center justify-center shadow-sm"
              >
                <User size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar Input */}
          <View className="flex-row items-center bg-[#f6f7f8] border border-gray-200 rounded-xl px-3.5 py-2.5">
            <Search size={18} color="#6b7280" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for 'Electrician', 'Plumber'..."
              placeholderTextColor="#9ca3af"
              className="flex-1 ml-2.5 text-sm text-[#0f1729]"
            />
          </View>
        </View>

        <View className="px-5 pt-5 pb-8 space-y-6 gap-6">
          {/* 2. Dynamic Ongoing Booking / Active Status Card */}
          {activeRequest ? (
            <View className="bg-[#0f1729] rounded-2xl p-4 shadow-lg border border-slate-800">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-400/30">
                  <Clock size={12} color="#60A5FA" />
                  <Text className="text-[11px] font-bold text-blue-300 ml-1 uppercase">
                    Status: {activeRequest.status.replace('_', ' ')}
                  </Text>
                </View>
                <Text className="text-xs text-slate-400 font-mono">
                  #ORD-{activeRequest._id.slice(-4).toUpperCase()}
                </Text>
              </View>

              <Text className="text-lg font-bold text-white mb-1">
                {activeRequest.title || activeRequest.category}
              </Text>

              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-800">
                <View>
                  <Text className="text-xs text-slate-400">Assigned Vendor</Text>
                  <Text className="text-sm font-semibold text-white">
                    {activeRequest.assignedVendor
                      ? (activeRequest.assignedVendor.businessName || activeRequest.assignedVendor.name || 'Vendor Assigned')
                      : 'Awaiting Vendor Bids...'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => navigation && navigation.navigate('Bookings')}
                  className="bg-white px-4 py-2 rounded-xl flex-row items-center active:opacity-90"
                >
                  <Text className="text-xs font-bold text-[#0f1729] mr-1">Track Order</Text>
                  <ArrowRight size={14} color="#0f1729" />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* 3. Service Categories Grid */}
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-extrabold text-[#0f1729] font-display">
                Top Services
              </Text>
              <TouchableOpacity onPress={() => navigation && navigation.navigate('Categories')}>
                <Text className="text-xs font-bold text-[#0f1729]">View All →</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap justify-between gap-y-3">
              {CATEGORIES.map((item) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => navigation && navigation.navigate('CreateRequest', { category: item.name })}
                    className="w-[23%] bg-white border border-gray-200 rounded-2xl py-3.5 px-2 items-center shadow-sm active:opacity-80"
                  >
                    <View
                      style={{ backgroundColor: item.bgColor }}
                      className="w-12 h-12 rounded-2xl items-center justify-center mb-2"
                    >
                      <IconComponent size={22} color={item.iconColor} />
                    </View>
                    <Text
                      numberOfLines={1}
                      className="text-xs font-semibold text-[#0f1729] text-center"
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 4. Promotional / Seasonal Offer Banner */}
          <View className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center mb-1">
                <Tag size={14} color="#D97706" />
                <Text className="text-xs font-bold text-amber-600 ml-1 uppercase tracking-wider">
                  Monsoon Special Offer
                </Text>
              </View>
              <Text className="text-base font-extrabold text-[#0f1729] leading-tight mb-1">
                Flat $15 OFF on Home Leakage Repair
              </Text>
              <Text className="text-xs text-[#6b7280] mb-3">
                Valid on orders above $40 • Use code <Text className="font-bold text-[#0f1729]">MONSOON15</Text>
              </Text>
              <TouchableOpacity
                onPress={() => navigation && navigation.navigate('CreateRequest', { category: 'Plumbing' })}
                style={{ backgroundColor: '#0f1729' }}
                className="bg-[#0f1729] px-4 py-2 rounded-xl self-start flex-row items-center"
              >
                <Text className="text-xs font-bold text-white mr-1">Book Now</Text>
                <ArrowRight size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View className="w-16 h-16 rounded-2xl bg-amber-50 items-center justify-center border border-amber-200">
              <Wrench size={28} color="#D97706" />
            </View>
          </View>

          {/* 5. Trust Signals */}
          <View>
            <Text className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2.5">
              Why Choose Local Vendor
            </Text>

            <View className="flex-row justify-between space-x-2 gap-2">
              <View className="flex-1 bg-white border border-gray-200 rounded-xl p-3 items-center shadow-sm">
                <ShieldCheck size={20} color="#0f1729" className="mb-1" />
                <Text className="text-[11px] font-bold text-[#0f1729] text-center">
                  Verified Pros
                </Text>
                <Text className="text-[9px] text-[#6b7280] text-center mt-0.5">
                  100% Background Checked
                </Text>
              </View>

              <View className="flex-1 bg-white border border-gray-200 rounded-xl p-3 items-center shadow-sm">
                <Zap size={20} color="#0f1729" className="mb-1" />
                <Text className="text-[11px] font-bold text-[#0f1729] text-center">
                  Instant Bids
                </Text>
                <Text className="text-[9px] text-[#6b7280] text-center mt-0.5">
                  Quotes in 5 Mins
                </Text>
              </View>

              <View className="flex-1 bg-white border border-gray-200 rounded-xl p-3 items-center shadow-sm">
                <DollarSign size={20} color="#0f1729" className="mb-1" />
                <Text className="text-[11px] font-bold text-[#0f1729] text-center">
                  Fixed Pricing
                </Text>
                <Text className="text-[9px] text-[#6b7280] text-center mt-0.5">
                  No Hidden Charges
                </Text>
              </View>
            </View>
          </View>

          {/* 6. Recent Services / Booking History */}
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-extrabold text-[#0f1729] font-display">
                Recent Services
              </Text>
              <TouchableOpacity onPress={() => navigation && navigation.navigate('Bookings')}>
                <Text className="text-xs font-bold text-[#0f1729]">View All</Text>
              </TouchableOpacity>
            </View>

            {recentRequests.length > 0 ? (
              <View className="space-y-3 gap-3">
                {recentRequests.map((item) => (
                  <View
                    key={item._id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex-row items-center justify-between"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-sm font-bold text-[#0f1729] mb-0.5">
                        {item.title || item.category}
                      </Text>
                      <Text className="text-xs text-[#6b7280] mb-1">
                        {item.assignedVendor?.name || item.assignedVendor?.businessName || 'Local Vendor'} • {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                      <View className="flex-row items-center">
                        <Star size={12} color="#D97706" fill="#D97706" />
                        <Text className="text-xs font-semibold text-[#0f1729] ml-1 mr-2">
                          4.9
                        </Text>
                        <Text className="text-xs font-bold text-[#0f1729]">
                          {item.finalAmount ? `$${item.finalAmount}` : 'Completed'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => navigation.navigate('CreateRequest', { category: item.category })}
                      style={{ backgroundColor: '#f6f7f8' }}
                      className="bg-[#f6f7f8] border border-gray-200 px-3.5 py-2 rounded-xl active:opacity-80"
                    >
                      <Text className="text-xs font-bold text-[#0f1729]">Rebook</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-white border border-gray-200 rounded-2xl p-5 items-center justify-center">
                <Text className="text-sm font-semibold text-[#6b7280]">No past service bookings yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
