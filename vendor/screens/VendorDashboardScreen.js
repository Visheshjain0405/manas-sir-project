import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LogOut,
  List,
  Briefcase,
  Wallet,
  MapPin,
  User,
  ArrowRight,
  ChevronRight,
  X,
  Radio,
  Clock,
  MessageSquare
} from 'lucide-react-native';
import client from '../services/client';
import { VendorAuthContext } from '../src/context/VendorAuthContext';
import io from 'socket.io-client';

const getSocketUrl = () => {
  const baseURL = client.defaults.baseURL;
  if (!baseURL) return 'http://10.0.2.2:5001';
  return baseURL.replace('/api', '');
};

const ARRIVAL_TIMES = ['15 mins', '30 mins', '45 mins', '1 hour', 'Tomorrow'];

export default function VendorDashboardScreen({ navigation }) {
  const { vendor, vendorToken, logout, isOnline, toggleOnline } = useContext(VendorAuthContext);

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'recent'

  const [leads, setLeads] = useState([]);
  const [bids, setBids] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [socket, setSocket] = useState(null);

  const [selectedLead, setSelectedLead] = useState(null);
  const [bidAmount, setBidAmount] = useState(vendor?.baseVisitingCharge?.toString() || '150');
  const [estimatedTime, setEstimatedTime] = useState('30 mins');
  const [bidMessage, setBidMessage] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidError, setBidError] = useState('');

  const fetchDashboardData = async () => {
    setLoadingInitial(true);
    try {
      const leadsRes = await client.get('/api/service-requests/available', {
        headers: { Authorization: `Bearer ${vendorToken}` }
      });
      if (leadsRes.data?.success) setLeads(leadsRes.data.requests || []);

      const bidsRes = await client.get('/api/offers/my-bids', {
        headers: { Authorization: `Bearer ${vendorToken}` }
      });
      if (bidsRes.data?.success) setBids(bidsRes.data.offers || []);

      const jobsRes = await client.get('/api/service-requests/assigned', {
        headers: { Authorization: `Bearer ${vendorToken}` }
      });
      if (jobsRes.data?.success) setAssignedJobs(jobsRes.data.requests || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (vendorToken) fetchDashboardData();
    }, [vendorToken])
  );

  useEffect(() => {
    if (!vendorToken || !vendor) return;
    let newSocket;
    if (isOnline) {
      newSocket = io(getSocketUrl(), { auth: { token: vendorToken } });
      newSocket.on('connect', () => {
        vendor.pincodes?.forEach(pin => newSocket.emit('joinRoom', `pincode_${pin}`));
        newSocket.on('newServiceRequest', (newReq) => {
          if (newReq.category === vendor.category) {
            setLeads(prev => [newReq, ...prev]);
          }
        });
        newSocket.on('bidAccepted', () => fetchDashboardData());
        newSocket.on('requestRemoved', (data) => {
          setLeads(prev => prev.filter(l => l._id !== data.requestId));
        });
      });
      setSocket(newSocket);
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
    return () => { if (newSocket) newSocket.disconnect(); };
  }, [isOnline, vendorToken, vendor]);

  const submitBid = async () => {
    setBidError('');
    if (!bidAmount || isNaN(bidAmount)) return setBidError('Enter a valid numeric quote.');
    setSubmittingBid(true);
    try {
      const res = await client.post('/api/offers', {
        serviceRequest: selectedLead._id,
        bidAmount: Number(bidAmount),
        estimatedTime,
        message: bidMessage.trim()
      }, { headers: { Authorization: `Bearer ${vendorToken}` } });
      if (res.data.success) {
        setSelectedLead(null);
        setLeads(prev => prev.filter(l => l._id !== selectedLead._id));
        fetchDashboardData();
      }
    } catch (err) {
      setBidError(err.response?.data?.message || 'Failed to submit quote.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const getBusinessInitial = () => {
    return vendor?.businessName ? vendor.businessName.charAt(0).toUpperCase() : 'V';
  };

  const totalEarnings = assignedJobs
    .filter(job => job.status === 'completed')
    .reduce((sum, job) => sum + (job.finalAmount || 0), 0);

  const todayEarnings = assignedJobs
    .filter(job => {
      if (job.status !== 'completed') return false;
      const jobDate = new Date(job.updatedAt);
      const today = new Date();
      return jobDate.toDateString() === today.toDateString();
    })
    .reduce((sum, job) => sum + (job.finalAmount || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-[#f6f7f8]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* 1. Header Bar */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-[#0f1729] rounded-full items-center justify-center mr-3">
              <Text className="text-white font-extrabold text-xl">{getBusinessInitial()}</Text>
            </View>
            <View>
              <Text className="text-[#0f1729] font-extrabold text-xl">Hello, {vendor?.name?.split(' ')[0] || 'Partner'}</Text>
              <View className="flex-row items-center mt-0.5">
                <View className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-[#10b981]' : 'bg-gray-400'}`} />
                <Text className={`font-bold text-xs ${isOnline ? 'text-[#10b981]' : 'text-gray-400'}`}>
                  Status: {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center">
            <Switch 
              value={isOnline} 
              onValueChange={toggleOnline} 
              trackColor={{ false: '#e5e7eb', true: '#10b981' }}
              thumbColor={'#ffffff'}
              className="mr-3"
            />
            <TouchableOpacity onPress={logout} className="w-10 h-10 bg-red-50 rounded-full items-center justify-center border border-red-100">
              <LogOut size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Segmented Pill Switcher */}
        <View className="bg-gray-200/50 p-1 rounded-full flex-row mb-6">
          <TouchableOpacity 
            onPress={() => setActiveTab('dashboard')} 
            className={`flex-1 py-2.5 items-center rounded-full ${activeTab === 'dashboard' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'dashboard' ? 'text-[#0f1729]' : 'text-[#6b7280]'}`}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('recent')} 
            className={`flex-1 py-2.5 items-center rounded-full ${activeTab === 'recent' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'recent' ? 'text-[#0f1729]' : 'text-[#6b7280]'}`}>Recent Jobs</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'dashboard' ? (
          <>
            {/* 3. Top Metrics Row */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1 bg-white rounded-2xl border border-gray-100/80 shadow-xs p-4 relative">
                <View className="flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-2">
                    <List size={16} color="#3b82f6" />
                  </View>
                  <Text className="text-[#6b7280] font-bold text-xs uppercase tracking-wider">New Requests</Text>
                </View>
                <Text className="text-4xl font-black text-[#0f1729]">{leads.length}</Text>
                {leads.length > 0 && (
                  <View className="absolute top-4 right-4 bg-red-500 px-2 py-0.5 rounded-md">
                    <Text className="text-white text-[10px] font-bold">NEW</Text>
                  </View>
                )}
              </View>

              <View className="flex-1 bg-white rounded-2xl border border-gray-100/80 shadow-xs p-4">
                <View className="flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-purple-50 rounded-full items-center justify-center mr-2">
                    <Briefcase size={16} color="#8b5cf6" />
                  </View>
                  <Text className="text-[#6b7280] font-bold text-xs uppercase tracking-wider">Active Jobs</Text>
                </View>
                <Text className="text-4xl font-black text-[#0f1729]">{assignedJobs.length}</Text>
              </View>
            </View>

            {/* 4. Hero Navy Earnings Card */}
            <View className="bg-[#0f1729] rounded-3xl p-6 shadow-md mb-6 relative overflow-hidden">
              <View className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full" />
              
              <View className="flex-row justify-between items-start mb-6">
                <View>
                  <Text className="text-white/70 font-bold text-xs uppercase tracking-wider mb-1">Total Earnings</Text>
                  <Text className="text-white font-black text-4xl">₹{totalEarnings}</Text>
                </View>
                <View className="w-12 h-12 bg-white/10 rounded-full items-center justify-center border border-white/20">
                  <Wallet size={20} color="#ffffff" />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 bg-white/10 rounded-2xl p-4 border border-white/5">
                  <Text className="text-white/70 font-bold text-[10px] uppercase tracking-wider mb-1">TODAY</Text>
                  <Text className="text-white font-extrabold text-xl">₹{todayEarnings}</Text>
                </View>
                <View className="flex-1 bg-white/10 rounded-2xl p-4 border border-white/5">
                  <Text className="text-white/70 font-bold text-[10px] uppercase tracking-wider mb-1">ACTIVE BIDS</Text>
                  <Text className="text-white font-extrabold text-xl">{bids.filter(b => b.status === 'pending').length}</Text>
                </View>
              </View>
            </View>

            {/* 5. Quick Actions Section */}
            <Text className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3 px-1">Quick Actions</Text>
            <View className="flex-row justify-between mb-8">
              {[
                { label: 'My Bids', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', nav: 'Jobs' },
                { label: 'Earnings', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', nav: 'Messages' },
                { label: 'Area', icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50', nav: 'Profile' },
                { label: 'Profile', icon: User, color: 'text-amber-600', bg: 'bg-amber-50', nav: 'Profile' },
              ].map((action, idx) => (
                <TouchableOpacity key={idx} onPress={() => navigation.navigate(action.nav)} className="items-center">
                  <View className={`w-14 h-14 ${action.bg} rounded-2xl items-center justify-center mb-2 shadow-xs border border-white/50`}>
                    <action.icon size={24} className={action.color} />
                  </View>
                  <Text className="text-[#0f1729] font-bold text-[11px]">{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 6. Recent Activity Section */}
            <View className="flex-row justify-between items-center mb-4 px-1">
              <Text className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Recent Activity</Text>
              <TouchableOpacity onPress={() => setActiveTab('recent')}>
                <Text className="text-blue-600 font-bold text-xs">View All</Text>
              </TouchableOpacity>
            </View>

            {loadingInitial ? (
              <ActivityIndicator color="#0f1729" />
            ) : leads.length > 0 ? (
              leads.slice(0, 3).map((lead) => (
                <View key={lead._id} className="bg-white rounded-2xl p-5 mb-4 border border-gray-100/80 shadow-xs">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-lg font-bold text-[#0f1729] flex-1 mr-2">{lead.title}</Text>
                    <View className="bg-blue-50 px-2 py-1 rounded border border-blue-100">
                      <Text className="text-blue-700 font-bold text-[10px] uppercase">NEW LEAD</Text>
                    </View>
                  </View>
                  <Text className="text-[#6b7280] mb-3 text-sm" numberOfLines={2}>{lead.description}</Text>
                  
                  <View className="flex-row items-center mb-4">
                    <MapPin size={12} color="#6b7280" className="mr-1" />
                    <Text className="text-xs font-bold text-[#6b7280]">{lead.address?.city} • Pincode: {lead.address?.pincode}</Text>
                  </View>

                  <TouchableOpacity 
                    onPress={() => setSelectedLead(lead)}
                    className="bg-[#0f1729] py-3 rounded-xl items-center justify-center w-full flex-row"
                  >
                    <Text className="text-white font-bold mr-2">Send Quote</Text>
                    <ArrowRight size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View className="bg-white rounded-2xl p-6 items-center justify-center border border-gray-100/80 border-dashed">
                <Radio size={30} color="#9ca3af" className="mb-2" />
                <Text className="text-[#0f1729] font-bold">Listening for Leads</Text>
                <Text className="text-[#6b7280] text-xs text-center mt-1">
                  You'll be notified when a customer in your pincode requests a {vendor?.category}.
                </Text>
              </View>
            )}
          </>
        ) : (
          <View>
            <Text className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3 px-1">All Available Leads</Text>
            {leads.length > 0 ? leads.map((lead) => (
              <View key={lead._id} className="bg-white rounded-2xl p-5 mb-4 border border-gray-100/80 shadow-xs">
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-lg font-bold text-[#0f1729] flex-1 mr-2">{lead.title}</Text>
                  <View className="bg-blue-50 px-2 py-1 rounded border border-blue-100">
                    <Text className="text-blue-700 font-bold text-[10px] uppercase">NEW LEAD</Text>
                  </View>
                </View>
                <Text className="text-[#6b7280] mb-3 text-sm">{lead.description}</Text>
                
                <View className="flex-row items-center mb-4">
                  <MapPin size={12} color="#6b7280" className="mr-1" />
                  <Text className="text-xs font-bold text-[#6b7280]">{lead.address?.city} • Pincode: {lead.address?.pincode}</Text>
                </View>

                <TouchableOpacity 
                  onPress={() => setSelectedLead(lead)}
                  className="bg-[#0f1729] py-3 rounded-xl items-center justify-center w-full flex-row"
                >
                  <Text className="text-white font-bold mr-2">Send Quote</Text>
                  <ArrowRight size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )) : (
               <View className="bg-white rounded-2xl p-8 items-center justify-center border border-gray-100/80 border-dashed">
                 <Text className="text-[#6b7280] font-bold">No leads available.</Text>
               </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bid Submission Bottom Sheet Modal */}
      <Modal visible={!!selectedLead} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 shadow-xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-extrabold text-[#0f1729]">Submit Quote</Text>
              <TouchableOpacity onPress={() => setSelectedLead(null)} className="p-2 bg-gray-100 rounded-full">
                <X size={20} color="#0f1729" />
              </TouchableOpacity>
            </View>

            <Text className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2">Quote Price (₹)</Text>
            <View className="flex-row items-center border border-gray-200 rounded-2xl px-5 py-4 bg-[#f6f7f8] mb-3">
              <Text className="text-xl font-black text-[#0f1729] mr-2 border-r border-gray-300 pr-3">₹</Text>
              <TextInput
                value={bidAmount}
                onChangeText={setBidAmount}
                keyboardType="numeric"
                className="flex-1 text-2xl font-black text-[#0f1729]"
              />
            </View>
            
            <View className="flex-row gap-3 mb-6">
              {[50, 100, 200].map(inc => (
                <TouchableOpacity 
                  key={inc}
                  onPress={() => setBidAmount((Number(bidAmount || 0) + inc).toString())}
                  className="flex-1 bg-white border border-gray-200 py-2 rounded-xl items-center shadow-sm"
                >
                  <Text className="font-bold text-[#0f1729]">+₹{inc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2">Arrival Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 flex-row">
              {ARRIVAL_TIMES.map(time => {
                const isActive = estimatedTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    onPress={() => setEstimatedTime(time)}
                    className={`mr-3 px-5 py-2.5 rounded-2xl border ${isActive ? 'bg-[#0f1729] border-[#0f1729]' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`font-bold ${isActive ? 'text-white' : 'text-[#6b7280]'}`}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2">Note to Customer</Text>
            <View className="bg-[#f6f7f8] rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
              <TextInput
                value={bidMessage}
                onChangeText={setBidMessage}
                placeholder="e.g. Includes diagnostic check and minor repairs."
                placeholderTextColor="#9ca3af"
                className="text-base text-[#0f1729]"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {bidError ? <Text className="text-sm text-red-500 font-bold mb-4 text-center">{bidError}</Text> : null}

            <TouchableOpacity
              onPress={submitBid}
              disabled={submittingBid}
              className="bg-[#0f1729] py-5 rounded-2xl items-center justify-center shadow-lg shadow-[#0f1729]/30 mb-safe"
            >
              {submittingBid ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-extrabold text-lg">Submit Quote Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
