import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '@/store/useHabitStore';
import { useUserStore } from '@/store/useUserStore';

const CreateHabitModal = ({ visible, onClose, onSuccess }) => {
    const { user } = useUserStore();
    const { createHabit, isLoading } = useHabitStore();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState(null);
    const [useSessionDuration, setUseSessionDuration] = useState(false);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setDuration(null);
        setUseSessionDuration(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a habit title');
            return;
        }

        if (useSessionDuration && (!duration || duration < 0.5 || duration > 120)) {
            Alert.alert('Error', 'Please select a valid duration');
            return;
        }

        try {
            const habitData = {
                userId: user._id,
                title: title.trim(),
                description: description.trim() || undefined,
                sessionMinutes: useSessionDuration ? duration : undefined,
                color: '#10B981'
            };

            await createHabit(habitData);
            Alert.alert('Success', 'Habit created successfully!');
            handleClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to create habit');
        }
    };

    const durations = [5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 90, 120];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 bg-black/60"
            >
                <View className="flex-1 justify-end">
                    {/* Main Content */}
                    <View className="bg-gray-900 rounded-t-3xl max-h-[85%]">
                        {/* Header */}
                        <View className="px-4 py-4 border-b border-gray-800">
                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Text className="text-white text-xl font-bold">New Habit</Text>
                                    <Text className="text-gray-400 text-sm">Build your daily routine</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={handleClose}
                                    className="p-2"
                                >
                                    <Ionicons name="close" size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView
                            className="px-4 py-4"
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Title */}
                            <View className="mb-4">
                                <Text className="text-gray-300 text-sm mb-2">Title *</Text>
                                <TextInput
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Morning Meditation"
                                    placeholderTextColor="#6B7280"
                                    className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white"
                                    maxLength={50}
                                />
                            </View>

                            {/* Description */}
                            <View className="mb-6">
                                <Text className="text-gray-300 text-sm mb-2">Description</Text>
                                <TextInput
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="What's this habit about?"
                                    placeholderTextColor="#6B7280"
                                    className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white h-20"
                                    multiline
                                    maxLength={200}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Session Duration Switch */}
                            <View className="mb-4 bg-gray-800/50 rounded-xl p-4">
                                <View className="flex-row justify-between items-center mb-3">
                                    <View className="flex-1">
                                        <Text className="text-gray-300 text-base font-medium mb-1">
                                            Add Session Duration
                                        </Text>
                                        <Text className="text-gray-400 text-sm">
                                            {useSessionDuration ? 'Timed focus session' : 'Simple daily task'}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={useSessionDuration}
                                        onValueChange={(value) => {
                                            setUseSessionDuration(value);
                                            if (value && !duration) {
                                                setDuration(25); // Default duration
                                            }
                                        }}
                                        trackColor={{ false: '#374151', true: '#10B981' }}
                                        thumbColor="#FFFFFF"
                                        ios_backgroundColor="#374151"
                                    />
                                </View>

                                {/* Duration Selector */}
                                {useSessionDuration && (
                                    <View className="mt-4 pt-4 border-t border-gray-700">
                                        <Text className="text-gray-300 text-sm mb-3">Intended Duration (min)</Text>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            className="mb-3"
                                        >
                                            {durations.map((t) => (
                                                <TouchableOpacity
                                                    key={t}
                                                    onPress={() => setDuration(t)}
                                                    className={`w-14 h-14 rounded-2xl items-center justify-center mr-3 border ${duration === t
                                                        ? 'bg-emerald-500 border-emerald-400'
                                                        : 'bg-gray-800/80 border-gray-700'
                                                        }`}
                                                >
                                                    <Text className={`text-lg font-bold ${duration === t ? 'text-white' : 'text-gray-400'
                                                        }`}>
                                                        {t}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                        {duration && (
                                            <Text className="text-emerald-400 text-sm text-center">
                                                Selected: {duration} minutes
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Create Button */}
                            <TouchableOpacity
                                onPress={handleCreate}
                                disabled={isLoading}
                                className={`rounded-xl py-4 items-center mb-4 ${isLoading ? 'bg-emerald-700' : 'bg-emerald-500'
                                    }`}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-base">Create Habit</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default CreateHabitModal;