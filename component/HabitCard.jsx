import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ContributionGraph from './ContributionGraph';
import { useHabitStore } from '@/store/useHabitStore';
import { useUserStore } from '@/store/useUserStore';

const HabitCard = ({ habit, onRefresh }) => {
    const router = useRouter();
    const { user } = useUserStore();
    const { deleteHabit, toggleTaskHabit, startHabitSession } = useHabitStore();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDelete = () => {
        Alert.alert(
            'Delete Habit',
            `Are you sure you want to delete "${habit.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteHabit(habit._id);
                            if (onRefresh) onRefresh();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete habit');
                        }
                    }
                }
            ]
        );
    };

    const handleTaskToggle = async () => {
        if (isProcessing || isTodayDone()) return;

        Alert.alert(
            'Mark as Complete',
            'Mark this habit as completed for today?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Complete',
                    style: 'default',
                    onPress: async () => {
                        setIsProcessing(true);
                        try {
                            await toggleTaskHabit(user._id, habit._id);
                            if (onRefresh) onRefresh();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update habit');
                        } finally {
                            setIsProcessing(false);
                        }
                    }
                }
            ]
        );
    };

    const handleStartSession = async () => {
        if (isProcessing) return;

        setIsProcessing(true);
        try {
            const sessionId = await startHabitSession(
                user._id,
                habit._id,
                habit.title,
                habit.sessionMinutes
            );
            router.push(`/(tabs)/session?sessionId=${sessionId}`);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to start session');
        } finally {
            setIsProcessing(false);
        }
    };

    const isTodayDone = () => {
        const today = new Date().toISOString().split('T')[0];
        const todayContribution = habit.contributions?.find(c => c.date === today);
        return todayContribution && todayContribution.level === 2;
    };

    const isSessionHabit = habit.type === 'session';
    const todayCompleted = isTodayDone();
    const activeDays = habit.contributions?.filter(c => c.level > 0).length || 0;

    return (
        <View className="bg-gray-800/20 rounded-3xl p-5 mb-4 border border-gray-700/30">
            {/* Header */}
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 pr-3">
                    <View className="flex-row items-center mb-2">
                        <View className={`w-2 h-2 rounded-full mr-2 ${todayCompleted ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                        <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                            {isSessionHabit ? 'Session' : 'Task'}
                        </Text>

                        {/* Tier Badge */}
                        <View
                            className="ml-3 px-2 py-0.5 rounded-md flex-row items-center"
                            style={{ backgroundColor: `${habit.tier?.color || '#10B981'}20`, borderWeight: 1, borderColor: `${habit.tier?.color || '#10B981'}40` }}
                        >
                            <Ionicons name={habit.tier?.icon || 'leaf'} size={12} color={habit.tier?.color || '#10B981'} />
                            <Text
                                className="text-[10px] font-bold ml-1 uppercase"
                                style={{ color: habit.tier?.color || '#10B981' }}
                            >
                                {habit.tier?.name || 'Unranked'}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center mb-1">
                        <Text className="text-white text-xl font-bold flex-1">
                            {habit.title}
                        </Text>
                    </View>

                    {habit.description && (
                        <Text className="text-gray-400 text-sm" numberOfLines={2}>
                            {habit.description}
                        </Text>
                    )}

                    <View className="mt-2 flex-row items-center">
                        <Text className="text-gray-500 text-[10px] font-medium uppercase tracking-widest">
                            Current Title:
                        </Text>
                        <Text
                            className="ml-1 text-[10px] font-bold"
                            style={{ color: habit.tier?.color || '#10B981' }}
                        >
                            {habit.tier?.title || 'Seedling'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleDelete}
                    className="w-9 h-9 rounded-lg bg-gray-800/50 items-center justify-center"
                    activeOpacity={0.6}
                >
                    <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View className="flex-row justify-between items-center mb-4 bg-gray-800/30 rounded-2xl p-3">
                <View className="items-center flex-1">
                    <View className="flex-row items-center">
                        <Text className="text-emerald-400 text-lg font-bold">
                            {habit.currentStreak || 0}
                        </Text>
                        <Text className="text-emerald-500/60 text-xs ml-1">🔥</Text>
                    </View>
                    <Text className="text-gray-500 text-xs mt-1">Streak</Text>
                </View>

                <View className="h-8 w-px bg-gray-700" />

                <View className="items-center flex-1">
                    <Text className="text-white text-lg font-bold">
                        {activeDays}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">Active Days</Text>
                </View>

                {isSessionHabit && habit.sessionMinutes && (
                    <>
                        <View className="h-8 w-px bg-gray-700" />
                        <View className="items-center flex-1">
                            <Text className="text-blue-400 text-lg font-bold">
                                {habit.sessionMinutes}
                            </Text>
                            <Text className="text-gray-500 text-xs mt-1">Minutes</Text>
                        </View>
                    </>
                )}
            </View>

            {/* Graph */}
            <View className="mb-4">
                <ContributionGraph contributions={habit.contributions || []} />
            </View>

            {/* Action Button */}
            {isSessionHabit ? (
                todayCompleted ? (
                    <View className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                        <View className="flex-row items-center justify-center">
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text className="text-emerald-400 font-medium ml-2">
                                Session Completed
                            </Text>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => {
                            if (habit.activeSessionId) {
                                router.push(`/(tabs)/session?sessionId=${habit.activeSessionId}`);
                            } else {
                                handleStartSession();
                            }
                        }}
                        disabled={isProcessing}
                        className={`rounded-xl p-3 ${habit.activeSessionId
                            ? 'bg-amber-500 shadow-lg shadow-amber-500/20'
                            : isProcessing ? 'bg-emerald-500 opacity-80' : 'bg-emerald-500'
                            }`}
                        activeOpacity={0.8}
                    >
                        <View className="flex-row items-center justify-center">
                            <Ionicons
                                name={habit.activeSessionId ? "play-skip-forward-circle" : "play-circle"}
                                size={20}
                                color="white"
                            />
                            <Text className="text-white font-medium ml-2">
                                {isProcessing
                                    ? 'Starting...'
                                    : habit.activeSessionId
                                        ? 'Continue Session'
                                        : `Start ${habit.sessionMinutes}min Session`
                                }
                            </Text>
                        </View>
                    </TouchableOpacity>
                )
            ) : (
                <TouchableOpacity
                    onPress={handleTaskToggle}
                    disabled={isProcessing || todayCompleted}
                    className={`rounded-xl p-3 ${todayCompleted
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-gray-800/50'
                        } ${(isProcessing || todayCompleted) ? 'opacity-80' : ''}`}
                    activeOpacity={0.7}
                >
                    <View className="flex-row items-center justify-center">
                        {todayCompleted ? (
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        ) : (
                            <Ionicons name="checkbox-outline" size={20} color="#9CA3AF" />
                        )}
                        <Text className={`font-medium ml-2 ${todayCompleted ? 'text-emerald-400' : 'text-gray-400'}`}>
                            {isProcessing ? 'Updating...' : todayCompleted ? 'Completed Today' : 'Mark as Complete'}
                        </Text>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default HabitCard;