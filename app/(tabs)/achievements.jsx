import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAchievementStore } from '@/store/useAchievementStore';
import { useFocusEffect } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';

const Achievements = () => {
  const { user } = useUserStore();
  const { getAchievements, achievements, isLoading } = useAchievementStore();
  const [activeTab, setActiveTab] = useState('streak');
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAchievements = useCallback(async () => {
    if (user?._id) {
      await getAchievements(user._id);
    }
  }, [user?._id]);

  useFocusEffect(
    useCallback(() => {
      loadAchievements();
    }, [loadAchievements])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  }, [loadAchievements]);

  useEffect(() => {
    if (achievements) {
      // Filter out consistency type achievements as requested
      const filtered = achievements.filter(achievement =>
        achievement.type === activeTab && achievement.type !== 'consistency'
      );
      setFilteredAchievements(filtered);
    }
  }, [achievements, activeTab]);

  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      case 'diamond': return '#B9F2FF';
      case 'elite': return '#00BFFF';
      case 'legendary': return '#FF6347';
      case 'mythic': return '#9400D3';
      default: return '#10B981';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'bronze': return 'trophy';
      case 'silver': return 'ribbon';
      case 'gold': return 'star';
      case 'platinum': return 'diamond';
      case 'diamond': return 'sparkles';
      case 'elite': return 'shield';
      case 'legendary': return 'flash';
      case 'mythic': return 'planet';
      default: return 'trophy';
    }
  };

  const renderAchievementCard = (achievement, index) => {
    const tierColor = getTierColor(achievement.tier);
    const isAchieved = achievement.status === 'achieved';
    const isInProgress = achievement.status === 'in_progress';
    const isLocked = achievement.status === 'locked';

    return (
      <View key={index} className={`mb-4 rounded-2xl p-4 border ${isAchieved ? 'border-emerald-500/30' : 'border-gray-800'}`}
        style={{ backgroundColor: isAchieved ? '#10B98110' : '#1F2937' }}>

        {/* Badge & Title Row */}
        <View className="flex-row items-start mb-3">
          {/* Badge Placeholder */}
          <View className="w-14 h-14 rounded-xl items-center justify-center mr-3"
            style={{
              backgroundColor: isAchieved ? tierColor + '30' : '#374151',
              borderWidth: 2,
              borderColor: isAchieved ? tierColor : '#4B5563'
            }}>
            <Ionicons
              name={getTierIcon(achievement.tier)}
              size={28}
              color={isAchieved ? tierColor : '#6B7280'}
            />
          </View>

          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <Text className="text-white font-bold text-lg flex-1 mr-2">
                {achievement.title}
              </Text>
              <View className={`px-2 py-1 rounded-full ${isAchieved ? 'bg-emerald-500/20' : 'bg-gray-800'}`}>
                <Text className={`text-xs font-bold ${isAchieved ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {achievement.tier}
                </Text>
              </View>
            </View>

            <Text className="text-gray-400 text-sm mt-1">
              {achievement.description}
            </Text>
          </View>
        </View>

        {/* Progress/Status Bar */}
        <View className="mt-3">
          <View className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: isAchieved ? '100%' : isInProgress ? '40%' : '0%',
                backgroundColor: tierColor
              }}
            />
          </View>

          <View className="flex-row justify-between items-center mt-2">
            <View className="flex-row items-center">
              <Ionicons
                name={isAchieved ? 'checkmark-circle' : isInProgress ? 'time' : 'lock-closed'}
                size={16}
                color={isAchieved ? '#10B981' : isInProgress ? '#FBBF24' : '#6B7280'}
              />
              <Text className={`ml-1 text-sm font-medium ${isAchieved ? 'text-emerald-400' : isInProgress ? 'text-yellow-400' : 'text-gray-500'}`}>
                {isAchieved ? 'Achieved' : isInProgress ? 'In Progress' : 'Locked'}
              </Text>
            </View>

            {isAchieved && achievement.dateAchieved && (
              <Text className="text-gray-500 text-xs">
                {new Date(achievement.dateAchieved).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const tabs = [
    { id: 'streak', label: 'Streak', icon: 'flame' },
    { id: 'milestone', label: 'Sessions', icon: 'time' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
            colors={['#10B981']}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-8 bg-gradient-to-b from-emerald-900/20 to-transparent">
          <View className="flex-row items-center">
            <Text className="text-white text-3xl font-bold">Achievements</Text>
            {isLoading && !refreshing && (
              <ActivityIndicator size="small" color="#10B981" style={{ marginLeft: 12 }} />
            )}
          </View>
          <Text className="text-gray-400 mt-1">Track your progress and earn badges</Text>
        </View>

        {/* Tab Selector */}
        <View className="px-6 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-full mr-3 ${activeTab === tab.id ? 'bg-emerald-500' : 'bg-gray-800'}`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={tab.icon}
                    size={18}
                    color={activeTab === tab.id ? 'white' : '#9CA3AF'}
                  />
                  <Text className={`ml-2 font-medium ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <View className="px-6">
          {filteredAchievements.length === 0 && !isLoading ? (
            <View className="items-center justify-center py-20">
              <View className="w-24 h-24 rounded-full bg-gray-800/50 items-center justify-center mb-4">
                <Ionicons name="trophy-outline" size={48} color="#4B5563" />
              </View>
              <Text className="text-gray-400 text-lg font-medium mb-2">
                No achievements yet
              </Text>
              <Text className="text-gray-500 text-center px-10">
                Keep building your {activeTab === 'streak' ? 'daily streak' : 'focus sessions'} to unlock achievements
              </Text>
            </View>
          ) : (
            <>
              {/* Stats Summary */}
              <View className="mb-6 bg-gray-800/30 rounded-2xl p-4">
                <View className="flex-row justify-between">
                  <View className="items-center flex-1">
                    <Text className="text-emerald-400 text-2xl font-bold">
                      {filteredAchievements.filter(a => a.status === 'achieved').length}
                    </Text>
                    <Text className="text-gray-400 text-sm mt-1">Unlocked</Text>
                  </View>
                  <View className="h-12 w-px bg-gray-700" />
                  <View className="items-center flex-1">
                    <Text className="text-white text-2xl font-bold">
                      {filteredAchievements.filter(a => a.status === 'in_progress').length}
                    </Text>
                    <Text className="text-gray-400 text-sm mt-1">In Progress</Text>
                  </View>
                  <View className="h-12 w-px bg-gray-700" />
                  <View className="items-center flex-1">
                    <Text className="text-gray-500 text-2xl font-bold">
                      {filteredAchievements.length}
                    </Text>
                    <Text className="text-gray-400 text-sm mt-1">Total</Text>
                  </View>
                </View>
              </View>

              {/* Achievements List */}
              {filteredAchievements.map((achievement, index) => renderAchievementCard(achievement, index))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
export default Achievements