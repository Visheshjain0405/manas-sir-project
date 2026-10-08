import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  MapPin,
  CheckCircle,
  Star,
  MessageSquare,
  Phone,
  Zap,
} from 'lucide-react-native';
import io from 'socket.io-client';
import { getServiceRequestByIdApi } from '../services/api';
// We assume we have api methods for fetching offers and accepting offer
import { getOffersByRequestIdApi, acceptOfferApi, API_BASE_URL } from '../services/api';

export default function RequestDetailsScreen({ route, navigation }) {
  const { requestId } = route.params;

  const [requestDetails, setRequestDetails] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetchRequestDetailsAndOffers();
    
    // Connect to Socket.IO
    const newSocket = io(API_BASE_URL.replace('/api', ''));
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket in RequestDetailsScreen');
      // In a real app we'd join a room for this specific request to listen for 'newOffer'
      newSocket.emit('joinRequestRoom', requestId);
    });

    newSocket.on('newOffer', (newBid) => {
      // Append the new bid to our list dynamically
      setOffers(prev => [newBid, ...prev].sort((a, b) => a.bidAmount - b.bidAmount));
    });

    newSocket.on('offerAccepted', (data) => {
      // Another device might have accepted it, refresh details
      fetchRequestDetailsAndOffers();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [requestId]);

  const fetchRequestDetailsAndOffers = async () => {
    setLoading(true);
    try {
      const [reqRes, offersRes] = await Promise.all([
        getServiceRequestByIdApi(requestId),
        getOffersByRequestIdApi(requestId)
      ]);

      if (reqRes.success) {
        setRequestDetails(reqRes.request);
      }
      if (offersRes.success) {
        setOffers(offersRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!selectedOffer) return;
    setAccepting(true);
    try {
      const res = await acceptOfferApi(selectedOffer._id);
      if (res.success) {
        setShowAcceptModal(false);
        // Refresh details
        fetchRequestDetailsAndOffers();
      } else {
        alert(res.message || 'Failed to accept offer');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setAccepting(false);
    }
  };

  const openAcceptModal = (offer) => {
    setSelectedOffer(offer);
    setShowAcceptModal(true);
  };

  if (loading && !requestDetails) {
    return (
      <View className="flex-1 bg-[#f6f7f8] items-center justify-center">
        <ActivityIndicator size="large" color="#0f1729" />
      </View>
    );
  }

  if (!requestDetails) {
    return (
      <View className="flex-1 bg-[#f6f7f8] items-center justify-center">
        <Text className="text-gray-500">Request not found.</Text>
      </View>
    );
  }

  const isAssigned = requestDetails.status === 'accepted' || requestDetails.status === 'in_progress';
  const assignedVendor = requestDetails.assignedVendor || (selectedOffer ? selectedOffer.vendor : null);

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      className="flex-1 bg-[#f6f7f8]"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />

      {/* Header */}
      <View className="bg-white px-5 py-3.5 border-b border-gray-200 flex-row items-center relative z-10 shadow-sm">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-[#f6f7f8] items-center justify-center border border-gray-200"
        >
          <ArrowLeft color="#0f1729" size={20} />
        </TouchableOpacity>
        <View className="flex-1 items-center mr-10">
          <Text className="text-sm font-bold text-gray-400 tracking-widest uppercase">
            {requestDetails.category}
          </Text>
          <Text className="text-base font-extrabold text-[#0f1729]">
            #ORD-{requestDetails._id.substring(0, 6).toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Order Overview Card */}
        <View className="bg-white m-4 p-5 rounded-2xl shadow-sm border border-gray-100">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 pr-4">
              <Text className="text-xl font-bold text-[#0f1729] mb-1">{requestDetails.title}</Text>
              <Text className="text-sm text-gray-500 leading-relaxed">{requestDetails.description}</Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${isAssigned ? 'bg-[#10b981]/10' : 'bg-orange-100'}`}>
              <Text className={`text-xs font-bold ${isAssigned ? 'text-[#10b981]' : 'text-orange-600'}`}>
                {isAssigned ? 'Assigned' : 'Pending Bids'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-2">
            <Clock size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2 font-medium">
              {requestDetails.schedule.date} • {requestDetails.schedule.timeSlot}
            </Text>
          </View>
          
          <View className="flex-row items-center mb-4">
            <MapPin size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2 font-medium">
              {requestDetails.address.street}, {requestDetails.address.city} {requestDetails.address.pincode}
            </Text>
          </View>

          {/* Attached Images */}
          {requestDetails.images && requestDetails.images.length > 0 && (
            <View className="flex-row mt-2">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {requestDetails.images.map((img, idx) => (
                  <View key={idx} className="mr-3 rounded-lg overflow-hidden border border-gray-200">
                    <Image source={{ uri: img }} style={{ width: 64, height: 64 }} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Dynamic Status / Bids Section */}
        {!isAssigned ? (
          <View className="px-4">
            <View className="flex-row items-center mb-4 px-1">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              <Text className="text-[#0f1729] font-bold text-base flex-1">
                {offers.length > 0 ? `${offers.length} Vendors Placed Bids` : `Broadcasting to nearby verified pros in ${requestDetails.address.pincode}...`}
              </Text>
            </View>

            {offers.length === 0 ? (
              <View className="bg-white p-8 rounded-2xl items-center border border-dashed border-gray-300 mt-2">
                <Zap size={40} color="#9ca3af" className="mb-4" />
                <Text className="text-gray-500 text-center font-medium">
                  Waiting for nearby pros to review your request. Bids typically arrive in 2–5 minutes.
                </Text>
              </View>
            ) : (
              offers.map((offer) => (
                <View key={offer._id} className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <Image 
                        source={{ uri: offer.vendor?.profileImage || 'https://via.placeholder.com/150' }} 
                        className="w-12 h-12 rounded-full bg-gray-100 mr-3"
                      />
                      <View>
                        <Text className="font-bold text-[#0f1729] text-base">{offer.vendor?.businessName || 'Pro Vendor'}</Text>
                        <View className="flex-row items-center mt-0.5">
                          <Star size={14} color="#f59e0b" fill="#f59e0b" />
                          <Text className="text-xs font-bold text-gray-700 ml-1">{offer.vendor?.rating || '4.9'}</Text>
                          <Text className="text-xs text-gray-400 ml-1">• {offer.vendor?.completedJobsCount || '12'} jobs</Text>
                        </View>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-extrabold text-[#0f1729] text-xl">₹{offer.bidAmount}</Text>
                      <View className="bg-blue-50 px-2 py-1 rounded-md mt-1">
                        <Text className="text-xs font-bold text-blue-600">⚡ {offer.estimatedTime || 'Arrives soon'}</Text>
                      </View>
                    </View>
                  </View>

                  {offer.message ? (
                    <View className="bg-[#f6f7f8] p-3 rounded-xl mb-4">
                      <Text className="text-sm text-gray-600 italic">"{offer.message}"</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity 
                    onPress={() => openAcceptModal(offer)}
                    className="w-full bg-[#0f1729] py-3 rounded-xl items-center shadow-md active:opacity-90"
                  >
                    <Text className="text-white font-bold text-base">Accept Offer</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          /* Assigned State */
          <View className="px-4">
            <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 items-center">
              <View className="w-16 h-16 rounded-full bg-[#10b981]/10 items-center justify-center mb-4">
                <CheckCircle size={32} color="#10b981" />
              </View>
              <Text className="text-xl font-bold text-[#0f1729] mb-1">Pro Assigned!</Text>
              <Text className="text-sm text-gray-500 text-center mb-6">
                Your service has been successfully booked with {assignedVendor?.businessName || 'Vendor'}. They will arrive at the scheduled time.
              </Text>
              
              <View className="w-full flex-row justify-between">
                <TouchableOpacity className="flex-1 bg-[#0f1729] py-3 rounded-xl items-center flex-row justify-center mr-2">
                  <Phone size={18} color="#fff" />
                  <Text className="text-white font-bold ml-2">Call Pro</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-[#f6f7f8] border border-gray-200 py-3 rounded-xl items-center flex-row justify-center ml-2">
                  <MessageSquare size={18} color="#0f1729" />
                  <Text className="text-[#0f1729] font-bold ml-2">Live Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Accept Offer Bottom Sheet / Modal */}
      <Modal visible={showAcceptModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white w-full rounded-t-3xl p-6 pb-10 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-[#0f1729]">Review & Accept</Text>
              <TouchableOpacity onPress={() => setShowAcceptModal(false)} className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
                <Text className="text-gray-500 font-bold">X</Text>
              </TouchableOpacity>
            </View>

            {selectedOffer && (
              <>
                <View className="flex-row items-center mb-6 bg-[#f6f7f8] p-4 rounded-2xl">
                  <Image source={{ uri: selectedOffer.vendor?.profileImage || 'https://via.placeholder.com/150' }} className="w-12 h-12 rounded-full mr-4" />
                  <View className="flex-1">
                    <Text className="font-bold text-[#0f1729] text-base">{selectedOffer.vendor?.businessName}</Text>
                    <Text className="text-sm text-gray-500">Agreed Price: ₹{selectedOffer.bidAmount}</Text>
                  </View>
                  <Text className="font-extrabold text-[#0f1729] text-lg">₹{selectedOffer.bidAmount}</Text>
                </View>

                <View className="mb-8 px-2">
                  <View className="flex-row items-center mb-3">
                    <CheckCircle size={16} color="#10b981" />
                    <Text className="text-sm text-gray-600 ml-2">Pay securely after service completion</Text>
                  </View>
                  <View className="flex-row items-center">
                    <CheckCircle size={16} color="#10b981" />
                    <Text className="text-sm text-gray-600 ml-2">Verified professional background check</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={handleAcceptOffer}
                  disabled={accepting}
                  className="w-full bg-[#10b981] py-4 rounded-xl items-center shadow-lg active:opacity-90 flex-row justify-center"
                >
                  {accepting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-lg">Confirm & Book Pro</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
