import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, RefreshControl } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useGoalStore } from '@/store/useGoalStore'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useUserStore } from '@/store/useUserStore'

const GOAL_TYPES = [
  { label: '1 Week', value: 'week' },
  { label: '1 Month', value: 'month' },
  { label: '3 Months', value: '3_month' },
  { label: '6 Months', value: '6_month' },
  { label: '1 Year', value: 'year' },
  { label: 'Other', value: 'other' },
];

const Goals = () => {
  const { goals, isLoading, error, createGoal, getGoals, toggleGoalCompletion, deleteGoal } = useGoalStore();
  const { user } = useUserStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [selectedType, setSelectedType] = useState('month');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const [togglingGoalId, setTogglingGoalId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (user?._id) {
        getGoals(user._id);
      }
    }, [user?._id])
  );

  const onRefresh = React.useCallback(async () => {
    if (user?._id) {
      setRefreshing(true);
      await getGoals(user._id);
      setRefreshing(false);
    }
  }, [user?._id]);

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    if (!selectedType) {
      Alert.alert('Error', 'Please select a goal duration');
      return;
    }

    if (selectedType === 'other') {
      if (!customDays.trim()) {
        Alert.alert('Error', 'Please enter the number of days');
        return;
      }
      const days = parseInt(customDays);
      if (isNaN(days) || days <= 0) {
        Alert.alert('Error', 'Please enter a valid number of days (greater than 0)');
        return;
      }
    }

    try {
      const goalData = {
        title: newGoalTitle.trim(),
        description: newGoalDescription.trim(),
        type: selectedType,
      };

      if (selectedType === 'other') {
        goalData.customDays = parseInt(customDays);
      }

      console.log('Creating goal with data:', goalData);
      await createGoal(user._id, goalData);

      setNewGoalTitle('');
      setNewGoalDescription('');
      setSelectedType('month');
      setCustomDays('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  const handleDeleteGoal = (goalId) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goalId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete goal');
            }
          }
        }
      ]
    );
  };

  const getGoalStats = () => {
    const total = goals.length;
    const completed = goals.filter(goal => goal.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, completionRate };
  };

  const getTypeLabel = (typeValue, goal = null) => {
    if (typeValue === 'other' && goal && goal.startDate && goal.endDate) {
      const start = new Date(goal.startDate);
      const end = new Date(goal.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return `${days} Days`;
    }
    const type = GOAL_TYPES.find(t => t.value === typeValue);
    return type ? type.label : 'Unknown';
  };

  const stats = getGoalStats();

  const handleToggleGoal = async (goalId) => {
    if (togglingGoalId) return; // Prevent multiple toggles

    setTogglingGoalId(goalId);
    try {
      await toggleGoalCompletion(goalId);
    } catch (error) {
      Alert.alert('Error', 'Failed to update goal');
    } finally {
      setTogglingGoalId(null);
    }
  };

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
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-3xl font-bold text-white">Goals</Text>
                {isLoading && !refreshing && (
                  <ActivityIndicator size="small" color="#10B981" style={{ marginLeft: 12 }} />
                )}
              </View>
              <Text className="text-gray-400 mt-1">Define your targets, track your progress</Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center rounded-xl bg-gray-800/50 border border-gray-700"
              onPress={() => setIsCreating(!isCreating)}
            >
              <Ionicons name={isCreating ? "close" : "add"} size={24} color="#10B981" />
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View className="flex-row justify-between space-x-4">
            <View className="flex-1 bg-gray-800/50 rounded-2xl p-4 border border-emerald-900/30">
              <Text className="text-2xl font-bold text-white">{stats.total}</Text>
              <Text className="text-gray-400 text-xs mt-1">Total Goals</Text>
            </View>

            <View className="flex-1 bg-gray-800/50 rounded-2xl p-4 border border-emerald-900/30 mx-2">
              <Text className="text-2xl font-bold text-white">{stats.completed}</Text>
              <Text className="text-gray-400 text-xs mt-1">Completed</Text>
            </View>

            <View className="flex-1 bg-gray-800/50 rounded-2xl p-4 border border-emerald-900/30">
              <Text className="text-2xl font-bold text-white">{stats.completionRate}%</Text>
              <Text className="text-gray-400 text-xs mt-1">Rate</Text>
            </View>
          </View>
        </View>

        {/* Create Goal Form */}
        {isCreating && (
          <View className="mx-6 mb-6">
            <View className="bg-gray-800/50 rounded-2xl p-4 border border-emerald-800/30">
              <Text className="text-emerald-400 font-semibold mb-3">Create New Goal</Text>

              {/* Title Input */}
              <View className="mb-3">
                <Text className="text-gray-400 text-sm mb-2">Title *</Text>
                <TextInput
                  className="bg-gray-900/50 rounded-xl px-4 py-3 border border-gray-700 text-white text-base"
                  placeholder="Enter your goal title..."
                  placeholderTextColor="#6B7280"
                  value={newGoalTitle}
                  onChangeText={setNewGoalTitle}
                  autoFocus
                />
              </View>

              {/* Description Input */}
              <View className="mb-3">
                <Text className="text-gray-400 text-sm mb-2">Description (Optional)</Text>
                <TextInput
                  className="bg-gray-900/50 rounded-xl px-4 py-3 border border-gray-700 text-white text-base"
                  placeholder="Add more details about your goal..."
                  placeholderTextColor="#6B7280"
                  value={newGoalDescription}
                  onChangeText={setNewGoalDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Type Selector */}
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">Duration *</Text>
                <TouchableOpacity
                  className="bg-gray-900/50 rounded-xl px-4 py-3 border border-gray-700"
                  onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white text-base">
                      {getTypeLabel(selectedType)}
                    </Text>
                    <Ionicons
                      name={showTypeDropdown ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </View>
                </TouchableOpacity>

                {showTypeDropdown && (
                  <View className="mt-1 bg-gray-800/90 rounded-xl border border-gray-700">
                    {GOAL_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        className="px-4 py-3 border-b border-gray-700 last:border-b-0"
                        onPress={() => {
                          setSelectedType(type.value);
                          setShowTypeDropdown(false);
                        }}
                      >
                        <Text className={`text-base ${selectedType === type.value ? 'text-emerald-400 font-semibold' : 'text-white'}`}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Custom Days Input - Only shown when "Other" is selected */}
              {selectedType === 'other' && (
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Number of Days *</Text>
                  <TextInput
                    className="bg-gray-900/50 rounded-xl px-4 py-3 border border-gray-700 text-white text-base"
                    placeholder="Enter number of days..."
                    placeholderTextColor="#6B7280"
                    value={customDays}
                    onChangeText={setCustomDays}
                    keyboardType="numeric"
                  />
                </View>
              )}

              {/* Create Button */}
              <TouchableOpacity
                className="bg-emerald-600 rounded-xl py-3 items-center"
                onPress={handleCreateGoal}
                disabled={!newGoalTitle.trim() || !selectedType || (selectedType === 'other' && !customDays.trim())}
              >
                <Text className="text-white font-semibold text-base">Create Goal</Text>
              </TouchableOpacity>

              <Text className="text-gray-500 text-xs mt-3 px-1">
                Set a specific, measurable goal to track your progress
              </Text>
            </View>
          </View>
        )}

        {/* Goals List */}
        <View className="px-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-white">
              Your Goals ({goals.length})
            </Text>
            <Text className="text-emerald-400 text-sm">
              {stats.completed}/{stats.total} completed
            </Text>
          </View>

          {goals.length === 0 ? (
            <View className="items-center justify-center py-12">
              <View className="w-24 h-24 bg-emerald-500/10 rounded-full items-center justify-center mb-4">
                <Ionicons name="flag-outline" size={48} color="#10B981" />
              </View>
              <Text className="text-white text-lg font-semibold mb-2">No Goals Yet</Text>
              <Text className="text-gray-400 text-center mb-6">
                Create your first goal to start tracking your progress
              </Text>
              <TouchableOpacity
                className="bg-emerald-600 rounded-xl px-6 py-3"
                onPress={() => setIsCreating(true)}
              >
                <Text className="text-white font-semibold">Create First Goal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="space-y-3">
              {goals.map((goal) => (
                <View
                  key={goal._id}
                  className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700/50 mb-2"
                >
                  <View className="flex-row items-start justify-between">
                    <TouchableOpacity
                      className="flex-row items-start flex-1"
                      onPress={() => handleToggleGoal(goal._id)}
                      disabled={togglingGoalId === goal._id}
                    >
                      <View className={`w-6 h-6 rounded-lg items-center justify-center mr-3 mt-1 ${goal.completed
                        ? 'bg-emerald-500'
                        : 'bg-gray-700/50 border border-gray-600'
                        } ${togglingGoalId === goal._id ? 'opacity-50' : ''}`}>
                        {togglingGoalId === goal._id ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : goal.completed ? (
                          <Ionicons name="checkmark" size={16} color="white" />
                        ) : null}
                      </View>
                      <View className="flex-1">
                        <Text className={`text-base font-medium ${goal.completed
                          ? 'text-emerald-400 line-through'
                          : 'text-white'
                          }`}>
                          {goal.title}
                        </Text>
                        {goal.description ? (
                          <Text className="text-gray-500 text-sm mt-1">
                            {goal.description}
                          </Text>
                        ) : null}
                        <View className="flex-row flex-wrap items-center mt-2">
                          <View className="bg-emerald-500/20 px-2 py-1 rounded mr-2 mb-1">
                            <Text className="text-emerald-400 text-xs">
                              {getTypeLabel(goal.type, goal)}
                            </Text>
                          </View>
                          <Text className="text-gray-500 text-xs mr-2 mb-1">
                            Created: {new Date(goal.createdAt).toLocaleDateString()}
                          </Text>
                          {goal.endDate && (
                            <Text className="text-gray-500 text-xs mb-1">
                              Due: {new Date(goal.endDate).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteGoal(goal._id)}
                      className="p-2"
                    >
                      <Ionicons name="trash-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  {/* Progress based on time elapsed */}
                  {goal.startDate && goal.endDate && (
                    <View className="mt-4">
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-gray-500 text-xs">
                          Start: {new Date(goal.startDate).toLocaleDateString()}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          End: {new Date(goal.endDate).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Tips Section */}
          <View className="mt-8 bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
            <View className="flex-row items-start mb-3">
              <Ionicons name="bulb-outline" size={20} color="#10B981" className="mr-2 mt-1" />
              <Text className="text-white font-semibold flex-1">Tips for Effective Goals</Text>
            </View>
            <View className="space-y-2">
              <View className="flex-row items-start">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2" />
                <Text className="text-gray-400 text-sm flex-1">Be specific and measurable</Text>
              </View>
              <View className="flex-row items-start">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2" />
                <Text className="text-gray-400 text-sm flex-1">Set realistic deadlines</Text>
              </View>
              <View className="flex-row items-start">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2" />
                <Text className="text-gray-400 text-sm flex-1">Break big goals into smaller steps</Text>
              </View>
              <View className="flex-row items-start">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2" />
                <Text className="text-gray-400 text-sm flex-1">Review and adjust regularly</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Goals