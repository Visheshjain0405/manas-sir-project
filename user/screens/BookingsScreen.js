import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Star,
  MapPin,
  RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';
import { getMyRequestsApi } from '../services/api';

export default function BookingsScreen({ navigation }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (token) {
      setLoading(true);
      fetchUserBookings().finally(() => {
        if (isActive) setLoading(false);
      });
    }

    return () => {
      isActive = false;
    };
  }, [token, activeTab]);

  const fetchUserBookings = async () => {
    try {
      const res = await getMyRequestsApi(token, activeTab === 'active' ? 'active' : 'completed');
      if (res.success && res.requests) {
        setRequests(res.requests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.warn('Error fetching bookings:', error);
      setRequests([]);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Awaiting Vendor Bids', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Clock };
      case 'accepted':
        return { label: 'Vendor Accepted', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: Clock };
      case 'in_progress':
      case 'work_started':
        return { label: 'Service In Progress', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', icon: Clock };
      case 'completed':
        return { label: 'Completed', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 };
      case 'cancelled':
        return { label: 'Cancelled', bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: AlertCircle };
      default:
        return { label: status, bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', icon: Clock };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-[#f6f7f8]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header Bar */}
      <View className="bg-white border-b border-gray-200 px-5 pt-4 pb-4 shadow-sm">
        <Text className="text-2xl font-extrabold text-[#0f1729] font-display mb-3">
          My Orders & Requests
        </Text>

        {/* Tab Switcher */}
        <View className="flex-row bg-[#f6f7f8] p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setActiveTab('active')}
            className="flex-1 py-2 rounded-lg items-center"
            style={activeTab === 'active' ? { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : {}}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: activeTab === 'active' ? '#0f1729' : '#6b7280' }}
            >
              Active Requests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            className="flex-1 py-2 rounded-lg items-center"
            style={activeTab === 'history' ? { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : {}}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: activeTab === 'history' ? '#0f1729' : '#6b7280' }}
            >
              Order History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5 pt-5 pb-8">
        <View className="space-y-4 gap-4 pb-6">
          {loading ? (
            <View key="loading-state" className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#0f1729" />
              <Text className="text-xs text-[#6b7280] mt-2">Loading your requests...</Text>
            </View>
          ) : !requests || requests.length === 0 ? (
            <View key="empty-state" className="bg-white border border-gray-200 rounded-2xl p-8 items-center justify-center my-6">
              <Clock size={36} color="#9ca3af" className="mb-2" />
              <Text className="text-base font-bold text-[#0f1729]">
                {activeTab === 'active' ? 'No Active Service Requests' : 'No Order History Yet'}
              </Text>
              <Text className="text-xs text-[#6b7280] text-center mt-1">
                {activeTab === 'active'
                  ? 'Tap any service category on Home to post a new request and receive vendor bids.'
                  : 'Your completed and past service requests will show up here.'}
              </Text>
            </View>
          ) : (
            requests.map((item) => {
              const badge = getStatusBadge(item.status);
              const BadgeIcon = badge.icon;
              return (
                <View
                  key={item._id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className={`flex-row items-center px-2.5 py-1 rounded-full border ${badge.bg}`}>
                      <BadgeIcon size={12} className={badge.text} />
                      <Text className={`text-[11px] font-bold ml-1 uppercase ${badge.text}`}>
                        {badge.label}
                      </Text>
                    </View>
                    <Text className="text-xs font-mono text-gray-400">
                      #ORD-{item._id.slice(-4).toUpperCase()}
                    </Text>
                  </View>

                  <Text className="text-base font-extrabold text-[#0f1729] mb-1">
                    {item.title || `${item.category} Service`}
                  </Text>
                  <Text className="text-xs text-[#6b7280] mb-2" numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View className="bg-[#f6f7f8] p-2.5 rounded-xl border border-gray-200 mb-3 flex-row items-center justify-between">
                    <Text className="text-xs text-[#6b7280]">
                      Schedule: <Text className="font-semibold text-[#0f1729]">{item.schedule?.date} ({item.schedule?.timeSlot})</Text>
                    </Text>
                    <Text className="text-xs font-bold text-[#0f1729]">
                      📍 {item.address?.city || 'Local'}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
                    <View>
                      <Text className="text-[10px] uppercase text-[#6b7280]">Assigned Vendor</Text>
                      <Text className="text-xs font-bold text-[#0f1729]">
                        {item.assignedVendor
                          ? (item.assignedVendor.businessName || item.assignedVendor.name)
                          : 'Bids Pending'}
                      </Text>
                    </View>

                    {activeTab === 'active' ? (
                      <TouchableOpacity
                        key="view-details"
                        onPress={() => navigation && navigation.navigate('RequestDetails', { requestId: item._id })}
                        style={{ backgroundColor: '#0f1729' }}
                        className="bg-[#0f1729] px-4 py-2 rounded-xl flex-row items-center active:opacity-90"
                      >
                        <Text className="text-xs font-bold text-white mr-1">View Details</Text>
                        <ArrowRight size={14} color="#ffffff" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        key="rebook"
                        onPress={() => navigation && navigation.navigate('CreateRequest', { category: item.category })}
                        style={{ backgroundColor: '#f6f7f8' }}
                        className="bg-[#f6f7f8] border border-gray-200 px-4 py-2 rounded-xl flex-row items-center active:opacity-80"
                      >
                        <RefreshCw size={12} color="#0f1729" className="mr-1" />
                        <Text className="text-xs font-bold text-[#0f1729]">Rebook</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
