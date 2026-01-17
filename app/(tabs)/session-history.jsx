import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '@/store/useSessionStore';
import { useUserStore } from '@/store/useUserStore';
import { useRouter } from 'expo-router';

const SessionHistory = () => {
    const { user } = useUserStore();
    const { sessions, isLoading, fetchSessionHistory, continueSession } = useSessionStore();
    const [range, setRange] = useState('today');
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const loadHistory = async () => {
        if (user?._id) {
            await fetchSessionHistory(user._id, range);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [user?._id, range])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadHistory();
        setRefreshing(false);
    }, [user?._id, range]);

    const handleContinue = async (sessionId) => {
        try {
            const response = await continueSession(sessionId);
            // Navigate to the session timer screen with the resumed session
            router.push({
                pathname: '/(tabs)/session',
                params: { sessionId: response._id }
            });
        } catch (error) {
            Alert.alert("Error", "Failed to continue session.");
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-emerald-400';
            case 'abandoned': return 'text-red-400';
            case 'in_progress': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return 'checkmark-circle';
            case 'abandoned': return 'close-circle';
            case 'in_progress': return 'play-circle';
            default: return 'help-circle';
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            {/* Header with Back Button */}
            <View className="px-6 pt-4 pb-2">
                <View className="flex-row items-center mb-6">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-4"
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text className="text-3xl font-bold text-white">Session History</Text>
                    {isLoading && !refreshing && (
                        <ActivityIndicator size="small" color="#10B981" style={{ marginLeft: 12 }} />
                    )}
                </View>

                {/* Filter Tabs */}
                <View className="flex-row bg-gray-800 rounded-xl p-1 mb-6">
                    {['today', 'week', 'month'].map((r) => (
                        <TouchableOpacity
                            key={r}
                            onPress={() => setRange(r)}
                            className={`flex-1 py-2 rounded-lg items-center ${range === r ? 'bg-emerald-600' : ''}`}
                        >
                            <Text className={`font-semibold capitalize ${range === r ? 'text-white' : 'text-gray-400'}`}>
                                {r}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#10B981"
                        colors={['#10B981']}
                    />
                }
            >
                {sessions.length === 0 && !isLoading ? (
                    <View className="items-center mt-20">
                        <Ionicons name="calendar-outline" size={64} color="#374151" />
                        <Text className="text-gray-500 mt-4 text-lg">No sessions found for this period.</Text>
                    </View>
                ) : (
                    sessions.map((session) => (
                        <View
                            key={session._id}
                            className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 mb-4"
                        >
                            {/* Session Type Badge */}
                            <View className="flex-row items-center mb-3">
                                <View className={`px-3 py-1 rounded-full ${session.sessionType === 'habit'
                                    ? 'bg-emerald-500/20 border border-emerald-500/30'
                                    : 'bg-blue-500/20 border border-blue-500/30'
                                    }`}>
                                    <View className="flex-row items-center">
                                        <Ionicons
                                            name={session.sessionType === 'habit' ? 'flame' : 'bulb'}
                                            size={12}
                                            color={session.sessionType === 'habit' ? '#10B981' : '#3B82F6'}
                                        />
                                        <Text className={`text-xs font-bold ml-1 uppercase tracking-wider ${session.sessionType === 'habit' ? 'text-emerald-400' : 'text-blue-400'
                                            }`}>
                                            {session.sessionType === 'habit' ? 'Habit Session' : 'General Session'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-start mb-3">
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-lg mb-1">{session.title || 'Focus Session'}</Text>
                                    <Text className="text-gray-400 text-sm">
                                        {formatDate(session.startTime)}
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Ionicons
                                        name={getStatusIcon(session.status)}
                                        size={20}
                                        color={session.status === 'completed' ? '#10B981' : session.status === 'abandoned' ? '#EF4444' : '#3B82F6'}
                                        className="mr-1"
                                    />
                                    <Text className={`font-semibold capitalize ${getStatusColor(session.status)}`}>
                                        {session.status}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center bg-gray-900/50 rounded-xl p-3 mb-3">
                                <View className="items-center">
                                    <Text className="text-gray-400 text-xs mb-1">Target</Text>
                                    <Text className="text-white font-semibold">{Math.round(session.intendedDuration)}m</Text>
                                </View>
                                <View className="w-[1px] h-8 bg-gray-700" />
                                <View className="items-center">
                                    <Text className="text-gray-400 text-xs mb-1">Actual</Text>
                                    <Text className="text-white font-semibold">{Math.round(session.actualDuration || 0)}m</Text>
                                </View>
                                <View className="w-[1px] h-8 bg-gray-700" />
                                <View className="items-center">
                                    <Text className="text-gray-400 text-xs mb-1">Interruptions</Text>
                                    <Text className="text-white font-semibold">{session.interruptions || 0}</Text>
                                </View>
                            </View>

                            {session.status === 'abandoned' && (
                                <TouchableOpacity
                                    onPress={() => handleContinue(session._id)}
                                    className="bg-emerald-600/20 py-3 rounded-xl items-center flex-row justify-center border border-emerald-600/30"
                                >
                                    <Ionicons name="refresh" size={18} color="#10B981" className="mr-2" />
                                    <Text className="text-emerald-400 font-bold">Continue Session</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default SessionHistory;