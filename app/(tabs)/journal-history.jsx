import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';

const JournalHistory = () => {
  const { user } = useUserStore();
  const router = useRouter();
  const {
    journals,
    isLoading,
    getJournalHistory,
    getDailyAIReflection,
    getWeeklyInsight,
  } = useJournalStore();

  const [selectedRange, setSelectedRange] = useState('week'); // 'day' | 'week' | 'month'
  const [showAIFeedbackModal, setShowAIFeedbackModal] = useState(false);
  const [showWeeklyInsightModal, setShowWeeklyInsightModal] = useState(false);
  const [selectedJournalForAI, setSelectedJournalForAI] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [weeklyInsightData, setWeeklyInsightData] = useState('');
  const [userAIQuestion, setUserAIQuestion] = useState('');

  useEffect(() => {
    fetchJournalHistory();
  }, [selectedRange, user?._id]);

  const fetchJournalHistory = async () => {
    if (!user?._id) return;
    try {
      await getJournalHistory(user._id, selectedRange);
    } catch (error) {
      console.error('Error fetching journal history:', error);
      Alert.alert('Error', 'Failed to load journal history');
    }
  };

  const handleGetAIFeedback = async (journal) => {
    setSelectedJournalForAI(journal);
    setShowAIFeedbackModal(true);
    setAiLoading(true);
    try {
      const journalDate = journal.date || journal.createdAt;
      const response = await getDailyAIReflection(
        user._id,
        false,
        userAIQuestion || 'Provide feedback on my journal entry',
        journalDate
      );
      setAiResponse(response?.reflection || 'No response received');
    } catch (error) {
      console.error('Error fetching AI feedback:', error);
      Alert.alert('Error', 'Failed to get AI feedback');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGetWeeklyInsight = async () => {
    setShowWeeklyInsightModal(true);
    setWeeklyLoading(true);
    try {
      const response = await getWeeklyInsight(
        user._id,
        [],
        false
      );
      setWeeklyInsightData(response?.insights || 'No insight generated');
    } catch (error) {
      console.error('Error fetching weekly insight:', error);
      Alert.alert('Error', 'Failed to get weekly insight');
    } finally {
      setWeeklyLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header with Back Button */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-white">Journal History</Text>
          {isLoading && (
            <ActivityIndicator size="small" color="#10B981" style={{ marginLeft: 12 }} />
          )}
        </View>

        {/* Filter Tabs */}
        <View className="flex-row bg-gray-800 rounded-xl p-1 mb-6">
          {['today', 'week', 'month'].map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setSelectedRange(r)}
              className={`flex-1 py-2 rounded-lg items-center ${selectedRange === r ? 'bg-emerald-600' : ''}`}
            >
              <Text
                className={`font-semibold capitalize ${
                  selectedRange === r ? 'text-white' : 'text-gray-400'
                }`}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Loading State */}
        {isLoading ? (
          <View className="py-12 justify-center items-center">
            <ActivityIndicator size="large" color="#10B981" />
            <Text className="text-gray-400 mt-4">Loading your journals...</Text>
          </View>
        ) : journals.length === 0 ? (
          <View className="py-12 justify-center items-center">
            <Ionicons name="book-outline" size={48} color="#6B7280" />
            <Text className="text-gray-400 mt-4 text-center">
              No journals found for this period.{'\n'}Start reflecting to build your history!
            </Text>
          </View>
        ) : (
          <View>
            {/* Weekly Insight Button (shown only when week is selected) */}
            {selectedRange === 'week' && journals.length > 6 && (
              <View className="mb-6">
                <TouchableOpacity
                  onPress={handleGetWeeklyInsight}
                  activeOpacity={0.8}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 flex-row items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
                >
                  <Ionicons name="sparkles" size={20} color="white" />
                  <Text className="text-white font-bold text-lg">Get Weekly Insight</Text>
                </TouchableOpacity>
              </View>
            )}
            <View>
            {journals.map((journal, index) => (
              <View
                key={journal._id || index}
                className="bg-gray-800/40 rounded-2xl p-5 mb-5 border border-emerald-800/30"
              >
                {/* Date */}
                <Text className="text-gray-400 text-sm mb-3">
                  {new Date(journal.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>

                {/* Morning Journal */}
                {journal.morning && (
                  <View className="mb-5 pb-5 border-b border-gray-700">
                    <View className="flex-row items-center mb-3">
                      <View className="w-8 h-8 bg-yellow-500/20 rounded-lg items-center justify-center mr-2">
                        <Ionicons name="sunny" size={16} color="#FBBF24" />
                      </View>
                      <Text className="text-yellow-300 font-semibold">Morning</Text>
                    </View>
                    {journal.morning.gratefulFor && journal.morning.gratefulFor.length > 0 && (
                      <View className="mb-2">
                        <Text className="text-gray-300 text-xs font-semibold mb-1">Grateful for:</Text>
                        {journal.morning.gratefulFor.map((item, i) => (
                          <Text key={i} className="text-gray-400 text-sm ml-2">
                            • {item}
                          </Text>
                        ))}
                      </View>
                    )}
                    {journal.morning.topPriorities && journal.morning.topPriorities.length > 0 && (
                      <View className="mb-2">
                        <Text className="text-gray-300 text-xs font-semibold mb-1">Priorities:</Text>
                        {journal.morning.topPriorities.map((item, i) => (
                          <Text key={i} className="text-gray-400 text-sm ml-2">
                            • {item}
                          </Text>
                        ))}
                      </View>
                    )}
                    {journal.morning.affirmation && (
                      <View>
                        <Text className="text-gray-300 text-xs font-semibold mb-1">Affirmation:</Text>
                        <Text className="text-emerald-300 text-sm ml-2 italic">"{journal.morning.affirmation}"</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Evening Journal */}
                {journal.evening && (
                  <View className="mb-3">
                    <View className="flex-row items-center mb-3">
                      <View className="w-8 h-8 bg-blue-500/20 rounded-lg items-center justify-center mr-2">
                        <Ionicons name="moon" size={16} color="#3B82F6" />
                      </View>
                      <Text className="text-blue-300 font-semibold">Evening</Text>
                    </View>
                    {journal.evening.amazingThings && journal.evening.amazingThings.length > 0 && (
                      <View className="mb-2">
                        <Text className="text-gray-300 text-xs font-semibold mb-1">Wins:</Text>
                        {journal.evening.amazingThings.map((item, i) => (
                          <Text key={i} className="text-gray-400 text-sm ml-2">
                            • {item}
                          </Text>
                        ))}
                      </View>
                    )}
                    {journal.evening.prioritiesStatus && (
                      <View className="mb-2">
                        <Text className="text-gray-300 text-xs font-semibold mb-1">Priorities Status:</Text>
                        <Text className="text-emerald-300 text-sm ml-2">
                          {journal.evening.prioritiesStatus === 'yes'
                            ? '✓ Yes'
                            : journal.evening.prioritiesStatus === 'partially'
                            ? '◐ Partial'
                            : '✕ No'}
                        </Text>
                      </View>
                    )}
                    {journal.evening.improveTomorrow && (
                      <View>
                        <Text className="text-gray-300 text-xs font-semibold mb-1">Improve Tomorrow:</Text>
                        <Text className="text-gray-400 text-sm ml-2">{journal.evening.improveTomorrow}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* AI Feedback Button */}
                <TouchableOpacity
                  onPress={() => handleGetAIFeedback(journal)}
                  activeOpacity={0.8}
                  className="bg-emerald-600/20 border border-emerald-500/40 rounded-xl py-3 mt-4 flex-row items-center justify-center gap-2"
                >
                  <Ionicons name="bulb-outline" size={18} color="#10B981" />
                  <Text className="text-emerald-300 font-semibold">Get AI Feedback</Text>
                </TouchableOpacity>
              </View>
            ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* AI Feedback Modal */}
      <Modal visible={showAIFeedbackModal} animationType="slide" transparent>
        <SafeAreaView className="flex-1 bg-black/50">
          <View className="flex-1 justify-end">
            <View className="bg-gray-900 rounded-t-3xl h-[90%] flex-1">
              {/* Header */}
              <View className="px-6 pt-6 pb-4 border-b border-gray-800">
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-emerald-500/20 rounded-xl items-center justify-center">
                      <Ionicons name="bulb" size={20} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-white text-lg font-bold">AI Feedback</Text>
                      <Text className="text-emerald-300 text-xs">Insights for growth</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setShowAIFeedbackModal(false)}>
                    <Ionicons name="close" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                {selectedJournalForAI && (
                  <Text className="text-gray-400 text-sm">
                    {new Date(selectedJournalForAI.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                )}
              </View>

              {/* Content */}
              <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={true}>
                {aiLoading ? (
                  <View className="py-20 justify-center items-center">
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text className="text-gray-300 mt-6 text-base font-semibold">Analyzing your reflection...</Text>
                    <Text className="text-gray-500 text-sm mt-2">Please wait</Text>
                  </View>
                ) : (
                  <View>
                    <View className="bg-emerald-900/10 rounded-2xl p-5 border border-emerald-800/30 mb-6">
                      <Text className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">AI Analysis</Text>
                      <Text className="text-gray-100 text-base leading-7">{aiResponse}</Text>
                    </View>

                    <View className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                      <View className="flex-row items-start gap-3">
                        <Ionicons name="star" size={16} color="#FBBF24" style={{ marginTop: 2 }} />
                        <View className="flex-1">
                          <Text className="text-yellow-300 font-semibold text-sm mb-1">Key Takeaway</Text>
                          <Text className="text-gray-400 text-xs leading-5">Reflect on this feedback and apply it to strengthen your mindset and habits.</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Button */}
              <View className="px-6 pb-6 pt-4 border-t border-gray-800">
                <TouchableOpacity
                  onPress={() => setShowAIFeedbackModal(false)}
                  activeOpacity={0.7}
                  className="bg-emerald-600 rounded-xl p-4"
                >
                  <Text className="text-white text-center font-bold text-base">Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Weekly Insight Modal */}
      <Modal visible={showWeeklyInsightModal} animationType="slide" transparent>
        <SafeAreaView className="flex-1 bg-black/50">
          <View className="flex-1 justify-end">
            <View className="bg-gray-900 rounded-t-3xl p-6 h-[90%] flex-1">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="sparkles" size={28} color="#3B82F6" />
                  <Text className="text-white text-xl font-bold">Weekly Insight</Text>
                </View>
                <TouchableOpacity onPress={() => setShowWeeklyInsightModal(false)}>
                  <Ionicons name="close" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView showsVerticalScrollIndicator={true} className="flex-1 mb-4">
                {weeklyLoading ? (
                  <View className="py-12 justify-center items-center">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text className="text-gray-400 mt-4">Generating your weekly insight...</Text>
                  </View>
                ) : (
                  <View className="bg-gradient-to-br from-blue-900/20 to-gray-800/40 rounded-xl p-5 border border-blue-800/30">
                    <Text className="text-gray-100 text-base leading-6">{weeklyInsightData}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setShowWeeklyInsightModal(false)}
                activeOpacity={0.8}
                className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4"
              >
                <Text className="text-white text-center font-bold text-lg">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default JournalHistory;