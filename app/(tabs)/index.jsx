import { useState, useEffect, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "@/store/useUserStore";
import { useSessionStore } from "@/store/useSessionStore";
import { Ionicons } from "@expo/vector-icons";
import GithubHeatmap from "@/component/HeatMap";
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const { user, refreshUser, updateSettings, isAuthenticated } = useUserStore();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { startSession } = useSessionStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTag, setSelectedTag] = useState("Study");
  const [customTag, setCustomTag] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [duration, setDuration] = useState(25);
  const [savedTags, setSavedTags] = useState(["Study", "Workout", "Entertainment", "Reading", "Coding"]);
  const [isStarting, setIsStarting] = useState(false);


  useFocusEffect(
    useCallback(() => {
      // Only refresh user data if authenticated
      if (isAuthenticated) {
        refreshUser();
      }
      loadSavedTags();
    }, [isAuthenticated])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const loadSavedTags = async () => {
    try {
      const stored = await SecureStore.getItemAsync("custom_tags");
      if (stored) {
        setSavedTags(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load tags", e);
    }
  };

  const saveTags = async (newTags) => {
    try {
      await SecureStore.setItemAsync("custom_tags", JSON.stringify(newTags));
    } catch (e) {
      console.error("Failed to save tags", e);
    }
  };

  const handleStartSession = async () => {
    let finalTitle = selectedTag;
    if (showCustomInput && customTag) {
      finalTitle = customTag;
      if (!savedTags.includes(customTag)) {
        const newTags = [...savedTags, customTag];
        setSavedTags(newTags);
        saveTags(newTags);
      }
    }

    setIsStarting(true);
    try {
      const sessionData = {
        userId: user._id,
        title: finalTitle,
        intendedDuration: duration,
      };

      const session = await startSession(sessionData);
      setIsModalVisible(false);
      router.push({
        pathname: '/(tabs)/session',
        params: { sessionId: session._id }
      });
    } catch (error) {
      console.error("Failed to start session", error);
    } finally {
      setIsStarting(false);
    }
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Discipline is choosing between what you want now and what you want most.",
      "The only bad workout is the one that didn't happen.",
      "Consistency is the key to achieving greatness.",
      "Every day is a new opportunity to become stronger.",
      "Small daily improvements lead to stunning results.",
      "Your future self will thank you for today's effort."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const getDaysSinceJoined = () => {
    if (!user || !user.createdAt) return 0;
    const created = new Date(user.createdAt);
    const today = new Date();

    // Set both to start of day (local time) for accurate day counting
    const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffTime = Math.abs(todayDate - createdDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleToggleNotifications = async () => {
    const currentStatus = user.notificationsEnabled === true; // Force boolean
    const newValue = !currentStatus;
    try {
      await updateSettings({ notificationsEnabled: newValue });

      Alert.alert(
        "Notifications Updated",
        newValue ? "Alerts are now ON ✅" : "Alerts are now OFF ❌"
      );
    } catch (error) {
      Alert.alert("System Error", "Failed to reach server");
    }
  };

  console.log(user?.contributions);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <View className="items-center">
          <View className="mb-4">
            <Ionicons name="walk" size={80} color="#10B981" />
          </View>
          <Text className="text-gray-400 text-lg">Loading your journey...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Greeting */}
        <View className="px-6 pt-6 pb-8 bg-gradient-to-b from-emerald-900/20 to-transparent">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1">
              <Text className="text-gray-400 text-lg">{getGreeting()},</Text>
              <Text className="text-3xl font-bold text-white mt-1">{user.name}</Text>
            </View>
            <View className="items-center">
              <TouchableOpacity
                onPress={handleToggleNotifications}
                className="p-3 bg-gray-800 rounded-full border border-gray-700"
              >
                <Ionicons
                  name={user.notificationsEnabled ? "notifications" : "notifications-off"}
                  size={26}
                  color={user.notificationsEnabled ? "#10B981" : "#6B7280"}
                />
              </TouchableOpacity>
              <Text className="text-gray-500 text-[10px] mt-1">
                {user.notificationsEnabled ? "Alerts On" : "Alerts Off"}
              </Text>
            </View>
          </View>

          {/* Stats Overview */}
          <View className="flex-row justify-between bg-gray-800/50 rounded-2xl p-4 border border-emerald-900/30">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-white">{user.currentStreak || 0}</Text>
              <Text className="text-gray-400 text-xs mt-1">Day Streak</Text>
            </View>
            <View className="h-12 w-px bg-gray-700" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-white">{user.totalSessions || 0}</Text>
              <Text className="text-gray-400 text-xs mt-1">Sessions</Text>
            </View>
            <View className="h-12 w-px bg-gray-700" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-white">{user.missingDays || 0}</Text>
              <Text className="text-gray-400 text-xs mt-1">Missed</Text>
            </View>
          </View>
        </View>

        <View className="px-6 mb-6">
          <View className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 rounded-2xl p-5 border border-emerald-800/30">
            <View className="flex-row items-start mb-3">
              <Ionicons name="sparkles" size={24} color="#10B981" />
              <Text className="text-white text-lg font-semibold flex-1 ml-3">Today's Motivation</Text>
            </View>
            <Text className="text-emerald-200 text-base italic">"{getMotivationalQuote()}"</Text>
          </View>
        </View>

        {/* Start Session Card */}
        <View className="px-6 mb-8">
          <View className="bg-gray-800/40 rounded-2xl p-5 mb-4 border border-gray-700/50">
            <Text className="text-white text-lg font-bold mb-2">Ready to Focus? 🎯</Text>
            <Text className="text-gray-400 text-sm mb-3">
              Start a timed session to track your focus quality, interruptions, and build consistency.
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-emerald-500/20 rounded-full items-center justify-center">
                  <Ionicons name="play-circle" size={24} color="#10B981" />
                </View>
                <View className="ml-3">
                  <Text className="text-white font-semibold">Focus Session</Text>
                  <Text className="text-gray-400 text-xs">{duration} min • {selectedTag}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(true)}
                className="bg-emerald-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-bold">START</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add quick session buttons */}
          <Text className="text-gray-400 text-sm mb-3">Quick Start:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            {[
              { time: 15, label: "Quick Focus", tag: "Deep Work" },
              { time: 25, label: "Pomodoro", tag: "Study" },
              { time: 30, label: "Deep Dive", tag: "Work" },
              { time: 45, label: "Long Session", tag: "Project" },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setDuration(item.time);
                  setSelectedTag(item.tag);
                  setIsModalVisible(true);
                }}
                className="bg-gray-800/60 rounded-xl p-4 mr-3 border border-gray-700/50"
              >
                <Text className="text-white font-bold text-lg">{item.time} min</Text>
                <Text className="text-emerald-300 text-sm">{item.label}</Text>
                <Text className="text-gray-400 text-xs mt-1">for {item.tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Heatmap */}
        <GithubHeatmap
          contributions={user.contributions}
        />

        {/* Quick Stats */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-bold text-white mb-4">Your Progress</Text>
          <View className="flex-row justify-between">
            <View className="items-center bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 flex-1 mx-1">
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text className="text-white text-lg font-bold mt-2">{user.currentStreak || 0}</Text>
              <Text className="text-gray-400 text-xs">Current Streak</Text>
            </View>
            <View className="items-center bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 flex-1 mx-1">
              <Ionicons name="trophy" size={24} color="#FBBF24" />
              <Text className="text-white text-lg font-bold mt-2">{user.longestStreak || 0}</Text>
              <Text className="text-gray-400 text-xs">Best Streak</Text>
            </View>
            <View className="items-center bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 flex-1 mx-1">
              <Ionicons name="calendar" size={24} color="#3B82F6" />
              <Text className="text-white text-lg font-bold mt-2">
                {getDaysSinceJoined()}
              </Text>
              <Text className="text-gray-400 text-xs">Total Days</Text>
            </View>
          </View>
        </View>

        {/* Journal Shortcut Container */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/journal')}
            className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-2xl p-5 flex-row items-center border border-emerald-700/40 shadow-lg shadow-emerald-500/20"
          >
            <View className="w-12 h-12 bg-emerald-500/20 rounded-lg items-center justify-center mr-4">
              <Ionicons name="book" size={24} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold">Journal</Text>
              <Text className="text-emerald-200 text-sm">Reflect on your journey</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="px-6">
          <Text className="text-xl font-bold text-white mb-4">Quick Actions</Text>

          <View className="flex-row flex-wrap justify-between">
            {[
              { icon: 'newspaper-outline', label: 'Journal History', screen: '/(tabs)/journal-history' },
              { icon: 'trophy-outline', label: 'Achievements', screen: '/(tabs)/achievements' },
              { icon: 'calendar-outline', label: 'Session History', screen: '/(tabs)/session-history' },
              { icon: 'stats-chart-outline', label: 'Analytics', screen: '/(tabs)/profile' }
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                className="w-[48%] bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 mb-4"
                onPress={() => router.push(item.screen)}
              >
                <View className="w-12 h-12 bg-emerald-500/20 rounded-lg items-center justify-center mb-3">
                  <Ionicons name={item.icon} size={24} color="#10B981" />
                </View>
                <Text className="text-white font-semibold text-base mb-1">{item.label}</Text>
                <Text className="text-gray-400 text-xs">View details</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View className="px-6 mt-8">
          <Text className="text-gray-600 text-center text-sm">
            Keep walking the path of discipline • Day {user.currentStreak || 0}
          </Text>
          <Text className="text-emerald-500/50 text-center text-xs mt-1">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>
      </ScrollView>

      {/* Session Configuration Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/60"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsModalVisible(false)}
            className="flex-1"
          />
          <View className="bg-gray-900 rounded-t-3xl p-6 border-t border-emerald-900/30">
            <View className="w-12 h-1.5 bg-gray-700 rounded-full self-center mb-6" />

            <Text className="text-white text-2xl font-bold mb-6 text-center">Setup Your Session</Text>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[500]">
              <Text className="text-gray-400 font-semibold mb-3">Focus Tag</Text>
              <View className="flex-row flex-wrap mb-6">
                {savedTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => {
                      setSelectedTag(tag);
                      setShowCustomInput(false);
                    }}
                    className={`px-4 py-2 rounded-full mr-2 mb-2 border ${selectedTag === tag && !showCustomInput ? 'bg-emerald-500 border-emerald-400' : 'bg-gray-800 border-gray-700'
                      }`}
                  >
                    <Text className={`font-semibold ${selectedTag === tag && !showCustomInput ? 'text-white' : 'text-gray-400'}`}>{tag}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setShowCustomInput(true)}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 border ${showCustomInput ? 'bg-emerald-500 border-emerald-400' : 'bg-gray-800 border-gray-700'
                    }`}
                >
                  <Text className={`font-semibold ${showCustomInput ? 'text-white' : 'text-gray-400'}`}>+ Other</Text>
                </TouchableOpacity>
              </View>

              {!!showCustomInput && (
                <View className="mb-6">
                  <Text className="text-gray-400 font-semibold mb-3">Custom Tag Name</Text>
                  <TextInput
                    placeholder="E.g. Meditation, Project X..."
                    placeholderTextColor="#4B5563"
                    className="bg-gray-800 text-white rounded-xl p-4 border border-gray-700 focus:border-emerald-500"
                    value={customTag}
                    onChangeText={setCustomTag}
                  />
                </View>
              )}

              <Text className="text-gray-400 font-semibold mb-3">Intended Duration (min)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                {[5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 90, 120].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setDuration(t)}
                    className={`w-14 h-14 rounded-2xl items-center justify-center mr-3 border ${duration === t ? 'bg-emerald-500 border-emerald-400' : 'bg-gray-800 border-gray-700'
                      }`}
                  >
                    <Text className={`text-lg font-bold ${duration === t ? 'text-white' : 'text-gray-400'}`}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={handleStartSession}
                disabled={isStarting}
                className={`bg-emerald-500 rounded-2xl p-4 mt-8 mb-6 shadow-lg shadow-emerald-500/20 ${isStarting ? 'opacity-70' : ''}`}
              >
                {isStarting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center text-xl font-bold">Launch Session</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
