import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Button,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';

const Journal = () => {
  const { user } = useUserStore();
  const {
    createMorningJournal,
    createEveningJournal,
    isLoading,
  } = useJournalStore();

  const [mode, setMode] = useState(null); // 'morning' | 'evening'

  // morning form state
  const [gratefulFor, setGratefulFor] = useState(["", "", ""]);
  const [topPriorities, setTopPriorities] = useState(["", "", ""]);
  const [affirmation, setAffirmation] = useState("");

  // evening form state
  const [amazingThings, setAmazingThings] = useState(["", "", ""]);
  const [prioritiesStatus, setPrioritiesStatus] = useState("");
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [improveTomorrow, setImproveTomorrow] = useState("");

  const hasMorningReflection =
    gratefulFor.some((item) => item.trim()) ||
    topPriorities.some((item) => item.trim()) ||
    affirmation.trim();

  const hasEveningReflection =
    amazingThings.some((item) => item.trim()) ||
    prioritiesStatus ||
    improveTomorrow.trim();

  const PRIORITY_OPTIONS = [
    { value: 'yes', label: '✓ Yes' },
    { value: 'partially', label: '◐ Partial' },
    { value: 'no', label: '✕ No' },
  ];

  const resetForm = () => {
    setGratefulFor(["", "", ""]);
    setTopPriorities(["", "", ""]);
    setAffirmation("");
    setAmazingThings(["", "", ""]);
    setPrioritiesStatus("");
    setImproveTomorrow("");
  };

  const handleMorningSubmit = async () => {
    if (!user?._id) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const morningData = {
        morning: {
          gratefulFor: gratefulFor.filter((v) => v.trim()),
          topPriorities: topPriorities.filter((v) => v.trim()),
          affirmation: affirmation.trim() || undefined,
        },
      };
      await createMorningJournal(user._id, morningData);
      Alert.alert("Saved", "Morning journal saved successfully");
      resetForm();
      setMode(null);
    } catch (err) {
      Alert.alert("Error", "Could not save morning journal");
    }
  };

  const handleEveningSubmit = async () => {
    if (!user?._id) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const eveningData = {
        evening: {
          amazingThings: amazingThings.filter((v) => v.trim()),
          prioritiesStatus,
          improveTomorrow: improveTomorrow.trim() || undefined,
        },
      };
      await createEveningJournal(user._id, eveningData);
      Alert.alert("Saved", "Evening journal saved successfully");
      resetForm();
      setMode(null);
    } catch (err) {
      Alert.alert("Error", "Could not save evening journal");
    }
  };

  const renderListInputs = (values, setter, placeholder) => (
    values.map((val, idx) => (
      <TextInput
        key={idx}
        value={val}
        onChangeText={(text) => {
          const copy = [...values];
          copy[idx] = text;
          setter(copy);
        }}
        placeholder={`${placeholder} ${idx + 1}`}
        placeholderTextColor="#4B5563"
        className="bg-gray-900/50 text-white rounded-xl p-3 mb-3 border border-emerald-700/30"
      />
    ))
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header */}
          <View className="px-6 pt-6 pb-8 bg-gradient-to-b from-emerald-900/20 to-transparent">
            <View className="flex-row items-center mb-2">
              {mode && (
                <TouchableOpacity onPress={() => setMode(null)} className="mr-4 p-2">
                  <Ionicons name="chevron-back" size={28} color="#10B981" />
                </TouchableOpacity>
              )}
              <Text className="text-white text-3xl font-bold flex-1">
                {mode === 'morning'
                  ? 'Morning Journal'
                  : mode === 'evening'
                  ? 'Evening Journal'
                  : 'Reflect'}
              </Text>
            </View>
            {!mode && (
              <Text className="text-gray-400 text-base px-1">Document your thoughts and emotions</Text>
            )}
          </View>

          {!mode && (
            <View className="px-6 mt-8">
              {/* Morning Card */}
              <TouchableOpacity
                onPress={() => setMode('morning')}
                activeOpacity={0.8}
                className="bg-gradient-to-br from-yellow-900/40 to-emerald-900/20 rounded-3xl p-6 mb-5 border border-emerald-800/40 shadow-lg shadow-emerald-500/10"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View className="w-12 h-12 bg-yellow-500/20 rounded-2xl items-center justify-center mr-3">
                        <Ionicons name="sunny" size={24} color="#FBBF24" />
                      </View>
                      <View>
                        <Text className="text-white text-xl font-bold">Morning</Text>
                        <Text className="text-yellow-300/70 text-sm">Start your day right</Text>
                      </View>
                    </View>
                    <Text className="text-gray-300 text-sm ml-1 mt-2">
                      Gratitude, priorities & affirmations
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={24} color="#10B981" />
                </View>
              </TouchableOpacity>

              {/* Evening Card */}
              <TouchableOpacity
                onPress={() => setMode('evening')}
                activeOpacity={0.8}
                className="bg-gradient-to-br from-blue-900/40 to-emerald-900/20 rounded-3xl p-6 border border-emerald-800/40 shadow-lg shadow-emerald-500/10"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View className="w-12 h-12 bg-blue-500/20 rounded-2xl items-center justify-center mr-3">
                        <Ionicons name="moon" size={24} color="#3B82F6" />
                      </View>
                      <View>
                        <Text className="text-white text-xl font-bold">Evening</Text>
                        <Text className="text-blue-300/70 text-sm">Reflect on your day</Text>
                      </View>
                    </View>
                    <Text className="text-gray-300 text-sm ml-1 mt-2">
                      Wins, priorities & improvements
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={24} color="#10B981" />
                </View>
              </TouchableOpacity>

              {/* Tips Section */}
              <View className="mt-8 bg-gray-800/30 rounded-2xl p-5 border border-emerald-900/30">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 bg-emerald-500/20 rounded-lg items-center justify-center mr-3">
                    <Ionicons name="bulb-outline" size={20} color="#10B981" />
                  </View>
                  <Text className="text-white font-semibold">Journal Tips</Text>
                </View>
                <Text className="text-gray-400 text-sm leading-5">
                  Be honest with yourself • Write freely without judgment • Focus on gratitude • Track your growth
                </Text>
              </View>
            </View>
          )}

          {mode === 'morning' && (
            <View className="px-6 mt-6">
              {/* Gratitude Section */}
              <View className="bg-gray-800/30 rounded-2xl p-5 border border-emerald-800/30 mb-6">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 bg-yellow-500/20 rounded-lg items-center justify-center mr-3">
                    <Ionicons name="heart" size={20} color="#FBBF24" />
                  </View>
                  <Text className="text-white font-semibold text-lg">What are you grateful for?</Text>
                </View>
                {renderListInputs(gratefulFor, setGratefulFor, 'Something you appreciate')}
              </View>

              {/* Priorities Section */}
              <View className="bg-gray-800/30 rounded-2xl p-5 border border-emerald-800/30 mb-6">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 bg-emerald-500/20 rounded-lg items-center justify-center mr-3">
                    <Ionicons name="target" size={20} color="#10B981" />
                  </View>
                  <Text className="text-white font-semibold text-lg">Top priorities today</Text>
                </View>
                {renderListInputs(topPriorities, setTopPriorities, 'Priority')}
              </View>

              {/* Affirmation Section */}
              <View className="bg-gray-800/30 rounded-2xl p-5 border border-emerald-800/30 mb-6">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 bg-emerald-500/20 rounded-lg items-center justify-center mr-3">
                    <Ionicons name="star" size={20} color="#10B981" />
                  </View>
                  <Text className="text-white font-semibold text-lg">Affirmation</Text>
                </View>
                <TextInput
                  value={affirmation}
                  onChangeText={setAffirmation}
                  placeholder="I am capable of achieving my goals..."
                  placeholderTextColor="#4B5563"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-gray-900/50 text-white rounded-xl p-3 border border-emerald-700/30 mb-2"
                />
                <Text className="text-gray-500 text-xs px-1">Think positive, believe in yourself</Text>
              </View>

              <TouchableOpacity
                onPress={handleMorningSubmit}
                disabled={isLoading || !hasMorningReflection}
                activeOpacity={0.8}
                className={`rounded-3xl overflow-hidden ${isLoading || !hasMorningReflection ? 'opacity-60' : ''}`}
              >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View className={`flex-row items-center justify-center gap-2 bg-green-600/80 px-4 py-5 rounded-xl ${isLoading || !hasMorningReflection ? 'bg-emerald-700' : ''}`}>
                      <Ionicons name="save" size={20} color="white" />
                      <Text className="text-white text-center font-bold text-lg">Save Morning Reflection</Text>
                    </View>
                  )}
              </TouchableOpacity>
              {!hasMorningReflection && (
                <Text className="text-gray-400 text-center text-xs mt-3">
                  Add at least one entry before saving your morning reflection.
                </Text>
              )}
            </View>
          )}

          {mode === 'evening' && (
            <View className="px-6 mt-6">
              {/* Amazing Things Section */}
              <View className="bg-gray-800/30 rounded-2xl p-5 border border-emerald-800/30 mb-6">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 bg-blue-500/20 rounded-lg items-center justify-center mr-3">
                    <Ionicons name="sparkles" size={20} color="#3B82F6" />
                  </View>
                  <Text className="text-white font-semibold text-lg">Amazing things that happened</Text>
                </View>
                {renderListInputs(amazingThings, setAmazingThings, 'Win or moment')}
                <Text className="text-gray-500 text-xs px-1">Celebrate your wins, big and small</Text>
              </View>

              {/* Priority Completion Section */}
              <View className="bg-gray-800/30 rounded-2xl p-5 border border-emerald-800/30 mb-6">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 bg-emerald-500/20 rounded-lg items-center justify-center mr-3">
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                  <Text className="text-white font-semibold text-lg">Did you complete your priorities?</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowPriorityDropdown((prev) => !prev)}
                  className="bg-gray-900/50 rounded-xl px-4 py-3 border border-gray-700"
                >
                  <View className="flex-row justify-between items-center">
                    <Text className={`text-base ${prioritiesStatus ? 'text-white' : 'text-gray-400'}`}>
                      {prioritiesStatus
                        ? PRIORITY_OPTIONS.find((option) => option.value === prioritiesStatus)?.label
                        : 'Select status'}
                    </Text>
                    <Ionicons
                      name={showPriorityDropdown ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </View>
                </TouchableOpacity>

                {showPriorityDropdown && (
                  <View className="mt-1 bg-gray-800/90 rounded-xl border border-gray-700">
                    {PRIORITY_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        className="px-4 py-3 border-b border-gray-700 last:border-b-0"
                        onPress={() => {
                          setPrioritiesStatus(option.value);
                          setShowPriorityDropdown(false);
                        }}
                      >
                        <Text className={`text-base ${prioritiesStatus === option.value ? 'text-emerald-400 font-semibold' : 'text-white'}`}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Improvement Section */}
              <View className="bg-gray-800/30 rounded-2xl p-5 border border-emerald-800/30 mb-6">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 bg-emerald-500/20 rounded-lg items-center justify-center mr-3">
                    <Ionicons name="trending-up" size={20} color="#10B981" />
                  </View>
                  <Text className="text-white font-semibold text-lg">How will you improve tomorrow?</Text>
                </View>
                <TextInput
                  value={improveTomorrow}
                  onChangeText={setImproveTomorrow}
                  placeholder="I will focus on... • I will avoid... • I will start..."
                  placeholderTextColor="#4B5563"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-gray-900/50 text-white rounded-xl p-3 border border-emerald-700/30 mb-2"
                />
                <Text className="text-gray-500 text-xs px-1">Growth comes from reflection and action</Text>
              </View>

              <TouchableOpacity
                onPress={handleEveningSubmit}
                disabled={isLoading || !hasEveningReflection}
                activeOpacity={0.8}
                className={`rounded-3xl overflow-hidden ${isLoading || !hasEveningReflection ? 'opacity-60' : ''}`}
              >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View className={`flex-row items-center justify-center gap-2 bg-green-600/80 px-4 py-5 rounded-xl ${isLoading || !hasMorningReflection ? 'bg-emerald-700' : ''}`}>
                      <Ionicons name="save" size={20} color="white" />
                      <Text className="text-white text-center font-bold text-lg">Save Evening Reflection</Text>
                    </View>
                  )}
              </TouchableOpacity>
              {!hasEveningReflection && (
                <Text className="text-gray-400 text-center text-xs mt-3">
                  Add at least one entry before saving your evening reflection.
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Journal;
