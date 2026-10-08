import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Zap,
  Wrench,
  Wind,
  Sparkles,
  Tv,
  Hammer,
  Palette,
  Bug,
  Truck,
  Droplet,
  Flame,
  Key,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';

const CATEGORY_GROUPS = [
  {
    groupTitle: 'Home Maintenance & Repair',
    items: [
      { id: 'c1', name: 'Electrician', desc: 'Wiring, fixtures & appliances', icon: Zap, iconColor: '#D97706', bgColor: '#FEF3C7' },
      { id: 'c2', name: 'Plumbing Services', desc: 'Pipes, leakage & fitting', icon: Wrench, iconColor: '#2563EB', bgColor: '#DBEAFE' },
      { id: 'c3', name: 'AC Repair & Service', desc: 'Gas refill, deep clean', icon: Wind, iconColor: '#4F46E5', bgColor: '#E0E7FF' },
      { id: 'c4', name: 'Carpenter Work', desc: 'Furniture repair & assembly', icon: Hammer, iconColor: '#B45309', bgColor: '#FEF3C7' },
      { id: 'c5', name: 'House Painting', desc: 'Interior & exterior paint', icon: Palette, iconColor: '#059669', bgColor: '#D1FAE5' },
      { id: 'c6', name: 'Locksmith & Keys', desc: 'Door locks & key duplicate', icon: Key, iconColor: '#475569', bgColor: '#F1F5F9' },
    ],
  },
  {
    groupTitle: 'Appliance Repairs',
    items: [
      { id: 'c7', name: 'Refrigerator Repair', desc: 'Cooling & motor check', icon: Tv, iconColor: '#9333EA', bgColor: '#F3E8FF' },
      { id: 'c8', name: 'Washing Machine', desc: 'Drum, motor & drain fix', icon: Wrench, iconColor: '#2563EB', bgColor: '#DBEAFE' },
      { id: 'c9', name: 'RO Water Purifier', desc: 'Filter change & servicing', icon: Droplet, iconColor: '#0D9488', bgColor: '#CCFBF1' },
      { id: 'c10', name: 'Gas Stove Repair', desc: 'Burner & pipeline fix', icon: Flame, iconColor: '#EA580C', bgColor: '#FFEDD5' },
    ],
  },
  {
    groupTitle: 'Cleaning & Sanitation',
    items: [
      { id: 'c11', name: 'Full Home Cleaning', desc: 'Deep home scrubbing', icon: Sparkles, iconColor: '#DC2626', bgColor: '#FEE2E2' },
      { id: 'c12', name: 'Bathroom Cleaning', desc: 'Tile stain removal', icon: Droplet, iconColor: '#0284C7', bgColor: '#E0F2FE' },
      { id: 'c13', name: 'Pest Control', desc: 'Termite, cockroach spray', icon: Bug, iconColor: '#E11D48', bgColor: '#FFE4E6' },
      { id: 'c14', name: 'Water Tank Clean', desc: 'Underground & overhead', icon: Droplet, iconColor: '#0D9488', bgColor: '#CCFBF1' },
    ],
  },
  {
    groupTitle: 'Relocation & Logistics',
    items: [
      { id: 'c15', name: 'Packers & Movers', desc: 'Local & intercity shifting', icon: Truck, iconColor: '#0284C7', bgColor: '#E0F2FE' },
      { id: 'c16', name: 'Home Sanitization', desc: 'Disinfection service', icon: ShieldCheck, iconColor: '#059669', bgColor: '#D1FAE5' },
    ],
  },
];

export default function CategoriesScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-[#f6f7f8]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header Bar */}
      <View className="bg-white border-b border-gray-200 px-5 pt-4 pb-4 shadow-sm">
        <Text className="text-2xl font-extrabold text-[#0f1729] font-display mb-3">
          All Services
        </Text>
        <View className="flex-row items-center bg-[#f6f7f8] border border-gray-200 rounded-xl px-3.5 py-2.5">
          <Search size={18} color="#6b7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search service categories..."
            placeholderTextColor="#9ca3af"
            className="flex-1 ml-2.5 text-sm text-[#0f1729]"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5 pt-5 pb-8">
        <View className="space-y-6 gap-6 pb-6">
          {CATEGORY_GROUPS.map((group, gIdx) => {
            const filteredItems = group.items.filter(item =>
              `${item.name} ${item.desc}`.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredItems.length === 0) return null;

            return (
              <View key={gIdx}>
                <Text className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-3">
                  {group.groupTitle}
                </Text>

                <View className="space-y-2.5 gap-2.5">
                  {filteredItems.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => navigation && navigation.navigate('CreateRequest', { category: item.name })}
                        className="bg-white border border-gray-200 rounded-2xl p-3.5 flex-row items-center justify-between shadow-sm active:opacity-80"
                      >
                        <View className="flex-row items-center flex-1 pr-2">
                          <View
                            style={{ backgroundColor: item.bgColor }}
                            className="w-12 h-12 rounded-2xl items-center justify-center mr-3.5"
                          >
                            <IconComp size={22} color={item.iconColor} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-bold text-[#0f1729] mb-0.5">
                              {item.name}
                            </Text>
                            <Text className="text-xs text-[#6b7280]" numberOfLines={1}>
                              {item.desc}
                            </Text>
                          </View>
                        </View>
                        <ChevronRight size={18} color="#6b7280" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
