import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '@/store/useHabitStore';
import { useUserStore } from '@/store/useUserStore';
import HabitCard from '@/component/HabitCard';
import CreateHabitModal from '@/component/CreateHabitModal';

const Habits = () => {
  const { user } = useUserStore();
  const { habits, isLoading, fetchHabits } = useHabitStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?._id) {
      loadHabits();
    }
  }, [user]);

  const loadHabits = async () => {
    if (user?._id) {
      await fetchHabits(user._id);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        loadHabits();
      }
    }, [user])
  );

  const handleHabitCreated = () => {
    loadHabits();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Habits List */}
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
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Text className="text-white text-3xl font-bold">Tracker</Text>
              {isLoading && !refreshing && (
                <ActivityIndicator size="small" color="#10B981" style={{ marginLeft: 12 }} />
              )}
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="w-10 h-10 items-center justify-center rounded-xl bg-gray-800/50 border border-gray-700"
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6">
          {habits.length === 0 && !isLoading ? (
            // Empty State
            <View className="items-center justify-center py-20">
              <View className="w-24 h-24 rounded-full bg-emerald-500/10 items-center justify-center mb-6 border border-emerald-500/20">
                <Ionicons name="flame-outline" size={48} color="#10B981" />
              </View>
              <Text className="text-white text-2xl font-bold mb-2">
                No Habits Yet
              </Text>
              <Text className="text-gray-400 text-center text-base mb-8 px-8 leading-6">
                Start building your discipline by creating your first habit tracker
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-4 rounded-2xl shadow-lg shadow-emerald-500/20"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <Ionicons name="add-circle" size={24} color="white" />
                  <Text className="text-white text-lg font-bold ml-2">
                    Create Your First Habit
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            // Habit Cards
            habits.map((habit) => (
              <HabitCard
                key={habit._id}
                habit={habit}
                onRefresh={loadHabits}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Habit Modal */}
      <CreateHabitModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleHabitCreated}
      />
    </SafeAreaView>
  );
};

export default Habits;
