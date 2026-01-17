import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import { useSessionStore } from '@/store/useSessionStore';

const { width } = Dimensions.get('window');

const LoadingOverlay = ({ message }) => (
  <View className="absolute inset-0 bg-gray-900/80 justify-center items-center z-50">
    <View className="bg-gray-800 p-6 rounded-3xl items-center border border-gray-700 shadow-2xl">
      <ActivityIndicator size="large" color="#10B981" />
      <Text className="text-emerald-400 mt-4 text-base font-medium font-medium">{message || "Loading..."}</Text>
    </View>
  </View>
);

const SessionTimer = () => {
  const { sessionId } = useLocalSearchParams();
  const { user, refreshUser } = useUserStore();
  const {
    currentSession: session,
    secondsLeft,
    isActive,
    isLoading,
    fetchSession,
    continueSession,
    tick,
    pauseSession,
    closeSession
  } = useSessionStore();
  const router = useRouter();

  // Determine if we need a hard loading screen (no data yet)
  const isInitialLoad = isLoading && (!session || session._id !== sessionId);

  useEffect(() => {
    const initSession = async () => {
      if (sessionId) {
        // Fetch session first
        const s = await fetchSession(sessionId);

        // If it's abandoned, we must explicitly resume it to reset timestamps
        // But only if we are here in the timer screen intended to resume it
        if (s && s.status === 'abandoned') {
          await continueSession(sessionId);
        }
      }
    };
    initSession();
  }, [sessionId]);

  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    } else if (secondsLeft <= 0 && isActive) {
      handleComplete(); // Auto-complete
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft]);

  const handlePauseResume = async () => {
    try {
      await pauseSession(sessionId);
    } catch (error) {
      Alert.alert("Error", "Failed to update session state.");
    }
  };

  const handleComplete = async () => {
    // If timer is already at 0, it's an auto-complete
    if (secondsLeft === 0) {
      try {
        await closeSession(user._id, sessionId);
        await refreshUser();
      } catch (error) {
        console.error("Auto-close error:", error);
      }
      return;
    }

    Alert.alert(
      "End Session Early?",
      "Are you sure you want to end this session before the timer finishes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Session",
          onPress: async () => {
            try {
              await closeSession(user._id, sessionId);
              await refreshUser();
              // Don't redirect immediately. Let status change drive the UI.
            } catch (error) {
              Alert.alert("Error", "Failed to close session.");
            }
          }
        }
      ]
    );
  };

  const formatTime = (seconds) => {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
      return `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    }
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const getProgressPercentage = () => {
    if (!session || !session.intendedDuration) return 0;
    const totalSeconds = session.intendedDuration * 60;
    return Math.min(100, Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100));
  };

  if (isInitialLoad) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <View className="items-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-emerald-400 mt-4 text-lg">Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Views based on Status ---

  // 1. Completed View
  if (session?.status === 'completed') {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 px-6">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
          <View className="items-center mb-8">
            <View className="w-24 h-24 bg-emerald-500/20 rounded-full items-center justify-center mb-6">
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            <Text className="text-white text-3xl font-bold text-center">Focus Complete!</Text>
            <Text className="text-emerald-400 text-lg font-medium mt-2">Excellent Discipline</Text>
          </View>

          <View className="w-full bg-gray-800/50 rounded-3xl p-6 border border-emerald-500/20 mb-8 items-center">
            <Text className="text-gray-400 text-xs uppercase tracking-widest mb-2">Total Focus Time</Text>
            <View className="flex-row items-baseline mb-4">
              <Text className="text-emerald-400 text-6xl font-black">{Math.round(session.actualDuration)}</Text>
              <Text className="text-emerald-500/60 text-lg font-bold ml-2 uppercase tracking-widest">min</Text>
            </View>

            <View className="h-px bg-gray-700/50 w-full mb-6" />

            {/* AI Rating Section */}
            <View className="flex-row mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= (session.rating || 5) ? "star" : "star-outline"}
                  size={24}
                  color={star <= (session.rating || 5) ? "#FBBF24" : "#4B5563"}
                  style={{ marginHorizontal: 2 }}
                />
              ))}
            </View>

            <Text className="text-white text-xl font-bold text-center mb-3">
              {session.rating >= 4 ? "Legendary Performance!" : session.rating >= 3 ? "Solid Progress!" : "Discipline is Key!"}
            </Text>

            <Text className="text-gray-300 text-center text-base leading-6 px-2 mb-6">
              {session.notes || "Outstanding effort today! Every minute spent in deep work is a massive step toward your goals."}
            </Text>

            {/* AI Tips Section */}
            {session.aiTips && (
              <View className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="bulb" size={18} color="#10B981" />
                  <Text className="text-emerald-400 font-bold ml-2 uppercase tracking-widest text-xs">AI Tip for Next Time</Text>
                </View>
                <Text className="text-gray-400 text-sm leading-5">
                  {session.aiTips}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            className="bg-emerald-500 w-full py-4 rounded-2xl items-center shadow-lg shadow-emerald-500/20"
          >
            <Text className="text-white text-xl font-bold">Finish Session</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 2. Abandoned View (Ended Early)
  if (session?.status === 'abandoned') {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 px-6">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
          <View className="items-center mb-10">
            <View className="w-24 h-24 bg-red-500/20 rounded-full items-center justify-center mb-6">
              <Ionicons name="close-circle" size={64} color="#EF4444" />
            </View>
            <Text className="text-white text-3xl font-bold text-center">Session Ended Early</Text>
            <Text className="text-gray-400 text-lg font-medium mt-2 text-center px-4">
              Progress is rarely a straight line.
            </Text>
          </View>

          <View className="w-full bg-gray-800/50 rounded-3xl p-6 border border-gray-700 mb-8 items-center">
            <View className="w-full flex-row justify-between mb-6">
              <View>
                <Text className="text-gray-400 text-xs uppercase tracking-widest mb-1">Actual Time</Text>
                <Text className="text-white text-xl font-bold">{Math.round(session.actualDuration || 0)} min</Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-400 text-xs uppercase tracking-widest mb-1">Status</Text>
                <Text className="text-red-400 text-xl font-bold uppercase">Stopped Early</Text>
              </View>
            </View>

            <View className="h-px bg-gray-700/50 w-full mb-6" />

            {/* AI Rating Section (Shown even on abandonment for feedback) */}
            <View className="flex-row mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= (session.rating || 2) ? "star" : "star-outline"}
                  size={20}
                  color={star <= (session.rating || 2) ? "#FBBF24" : "#4B5563"}
                  style={{ marginHorizontal: 2 }}
                />
              ))}
            </View>

            <Text className="text-white text-lg font-bold text-center mb-3">
              Coaching Note
            </Text>

            <Text className="text-gray-300 text-center text-sm leading-6 px-2 mb-6">
              {session.notes || "Don't be discouraged! Even a short session builds the habit of showing up. Let's try to beat this time in your next session."}
            </Text>

            {/* AI Tips Section */}
            {session.aiTips && (
              <View className="w-full bg-gray-700/30 border border-gray-600 rounded-2xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="bulb" size={16} color="#9CA3AF" />
                  <Text className="text-gray-400 font-bold ml-2 uppercase tracking-widest text-[10px]">How to improve next time</Text>
                </View>
                <Text className="text-gray-400 text-xs leading-5">
                  {session.aiTips}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            className="bg-gray-700 w-full py-4 rounded-2xl items-center border border-gray-600"
          >
            <Text className="text-white text-xl font-bold">Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. Active Timer View
  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Show overlay if processing action but session is visible */}
      {isLoading && <LoadingOverlay message={isActive ? "Syncing..." : "Analyzing Session..."} />}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-800/50 border border-gray-700/50"
          >
            <Ionicons name="chevron-back" size={24} color="#D1D5DB" />
          </TouchableOpacity>
          <View className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Text className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
              Session #{session?.sessionNumber || 1}
            </Text>
          </View>
          <View className="w-10" />
        </View>

        <View className="flex-1 justify-center items-center px-6 py-10">
          <View className="mb-10 items-center">
            <View className="flex-row items-center mb-2">
              <View className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-emerald-500' : 'bg-gray-500'}`} />
              <Text className="text-gray-400 text-sm font-medium uppercase tracking-[2px]">
                {isActive ? 'Concentrating' : 'Paused'}
              </Text>
            </View>
            <Text className="text-white text-3xl font-bold text-center mb-2">
              {session?.title || 'Focus Session'}
            </Text>
            {!!session?.description && (
              <Text className="text-gray-400 text-center text-base italic max-w-xs leading-6">
                "{session.description}"
              </Text>
            )}
          </View>

          <View className="mb-12">
            <View className="w-72 h-72 rounded-full items-center justify-center relative">
              <View className="absolute w-full h-full rounded-full border-[2px] border-gray-800" />

              <View
                className="absolute w-full h-full rounded-full border-[6px] border-emerald-500/10"
              />

              <View className="items-center">
                <Text className="text-white text-7xl font-bold tracking-tight">
                  {formatTime(secondsLeft)}
                </Text>
                <View className="h-px w-12 bg-gray-700 my-4" />
                <Text className="text-emerald-400/80 text-sm font-medium">
                  GOAL: {session?.intendedDuration || 25} MIN
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row space-x-10 mb-12">
            <View className="items-center mr-2">
              <TouchableOpacity
                onPress={handlePauseResume}
                className={`w-20 h-20 rounded-3xl items-center justify-center ${isActive
                  ? 'bg-amber-500/10 border border-amber-500/30'
                  : 'bg-emerald-500/10 border border-emerald-500/30'
                  }`}
                activeOpacity={0.7}
              >
                <View className={`w-14 h-14 rounded-2xl items-center justify-center ${isActive ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>
                  <Ionicons
                    name={isActive ? "pause" : "play"}
                    size={32}
                    color="white"
                  />
                </View>
              </TouchableOpacity>
              <Text className="text-gray-500 text-xs font-bold mt-3 uppercase tracking-wider">
                {isActive ? 'Pause' : 'Resume'}
              </Text>
            </View>

            <View className="items-center ml-2">
              <TouchableOpacity
                onPress={handleComplete}
                className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/30 items-center justify-center"
                activeOpacity={0.7}
              >
                <View className="w-14 h-14 rounded-2xl bg-red-500 items-center justify-center">
                  <Ionicons name="stop" size={32} color="white" />
                </View>
              </TouchableOpacity>
              <Text className="text-gray-500 text-xs font-bold mt-3 uppercase tracking-wider">
                End Early
              </Text>
            </View>
          </View>

          <View className="w-full space-y-4">
            <View className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700/30 flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-emerald-500/10 items-center justify-center mr-3">
                  <Ionicons name="time" size={18} color="#10B981" />
                </View>
                <Text className="text-gray-300 font-medium">Progress</Text>
              </View>
              <Text className="text-white font-bold">{Math.round(getProgressPercentage())}%</Text>
            </View>

            <View className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700/30 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-blue-500/10 items-center justify-center mr-3">
                  <Ionicons name="flame" size={18} color="#3B82F6" />
                </View>
                <Text className="text-gray-300 font-medium">Daily Streak</Text>
              </View>
              <Text className="text-white font-bold">{user?.currentStreak || 0} Days</Text>
            </View>
          </View>

          <View className="flex-1 justify-center items-center mt-10 px-8 py-5 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 w-full mb-10">
            <Ionicons name="chatbox-ellipses" size={20} color="#10B981" style={{ opacity: 0.3, marginBottom: 8 }} />
            <Text className="text-white text-sm text-center italic leading-6">
              "Stay focused. The only way to achieve discipline is through consistent action."
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-800/50 bg-gray-900/80">
        <View className="flex-row items-center justify-between">
          <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-xs font-medium mr-2">System Status:</Text>
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
            <Text className="text-white text-[10px] font-bold uppercase">Syncing</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SessionTimer;
