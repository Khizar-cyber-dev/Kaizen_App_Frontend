import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/useUserStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { RefreshControl } from 'react-native';
import { Svg, G, Path, Text as SvgText } from 'react-native-svg';
import ContributionGraph from '@/component/ContributionGraph';
import ConsistencyHeatmap from '@/component/OverallConsistency';

const formatDurationHMS = (minutes) => {
    if (!minutes) return "0s";
    const totalSeconds = Math.round(minutes * 60);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    let result = "";
    if (h > 0) result += `${h}h `;
    if (m > 0 || h > 0) result += `${m}m `;
    result += `${s}s`;
    return result.trim();
};

const COLORS = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
    '#06B6D4', '#EC4899', '#6366F1', '#D946EF', '#F97316'
];

const getSessionColor = (index) => COLORS[index % COLORS.length];

const Profile = () => {
    const { user, logout, isLoading: userLoading } = useUserStore();
    const {
        getUserCurrentData,
        getDonutChartData,
        getOverallConsistencyDays,
        getTodaysSessions,
        currentData,
        donutChartData,
        overallConsistencyData,
        todayWork,
        isLoadingData,
        error
    } = useAnalysisStore();
    const router = useRouter();
    const { signOut } = useAuth();

    const [activeSection, setActiveSection] = useState('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (user?._id) {
            fetchAllData();
        }
    }, [user?._id]);

    const fetchAllData = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                getUserCurrentData(user._id),
                getDonutChartData(user._id),
                getOverallConsistencyDays(user._id),
                getTodaysSessions(user._id)
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                            await logout();
                            router.replace('/(auth)/sign-in');
                        } catch (error) {
                            console.error("Logout error:", error);
                            await logout();
                            router.replace('/(auth)/sign-in');
                        }
                    }
                }
            ]
        );
    };

    const handleVerifyAccount = async () => {
        try {
            Alert.alert(
                "Verify Email",
                "We'll send a 6-digit OTP to your email to verify your account.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Send OTP",
                        onPress: async () => {
                            const success = await useUserStore.getState().sendOtp();
                            if (success) {
                                router.push({
                                    pathname: '/(auth)/verifyAccount',
                                    params: { email: user.email }
                                });
                            } else {
                                Alert.alert("Error", "Failed to send OTP. Please try again.");
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert("Error", "Something went wrong. Please try again.");
        }
    };

    const renderDonutChart = () => {
        if (!donutChartData?.chartData || donutChartData.chartData.length === 0) {
            return (
                <View className="items-center justify-center py-8">
                    <View className="w-32 h-32 rounded-full border-4 border-gray-800 items-center justify-center mb-4">
                        <Ionicons name="stats-chart" size={48} color="#4B5563" />
                    </View>
                    <Text className="text-gray-500 text-center">No session data available yet</Text>
                </View>
            );
        }

        const data = donutChartData.chartData.slice(0, 5).map((item, index) => ({
            name: item.title,
            time: item.totalDuration,
            color: getSessionColor(index),
            formattedTime: formatDurationHMS(item.totalDuration)
        }));

        const totalTime = data.reduce((sum, item) => sum + item.time, 0);
        const radius = 80;
        const innerRadius = 50;
        const centerX = 100;
        const centerY = 100;
        let cumulativeAngle = 0;

        return (
            <View className="items-center">
                <View className="flex-row items-center justify-center w-full">
                    <Svg width={200} height={200} viewBox="0 0 200 200">
                        <G transform={`translate(0, 0)`}>
                            {data.map((item, index) => {
                                const angle = (item.time / totalTime) * 360;
                                const startAngle = cumulativeAngle;
                                const endAngle = cumulativeAngle + angle;
                                cumulativeAngle += angle;

                                // Path for the slice
                                const x1 = centerX + radius * Math.cos((Math.PI * (startAngle - 90)) / 180);
                                const y1 = centerY + radius * Math.sin((Math.PI * (startAngle - 90)) / 180);
                                const x2 = centerX + radius * Math.cos((Math.PI * (endAngle - 90)) / 180);
                                const y2 = centerY + radius * Math.sin((Math.PI * (endAngle - 90)) / 180);

                                const x3 = centerX + innerRadius * Math.cos((Math.PI * (endAngle - 90)) / 180);
                                const y3 = centerY + innerRadius * Math.sin((Math.PI * (endAngle - 90)) / 180);
                                const x4 = centerX + innerRadius * Math.cos((Math.PI * (startAngle - 90)) / 180);
                                const y4 = centerY + innerRadius * Math.sin((Math.PI * (startAngle - 90)) / 180);

                                const largeArcFlag = angle > 180 ? 1 : 0;

                                const d = [
                                    `M ${x1} ${y1}`,
                                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                    `L ${x3} ${y3}`,
                                    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                                    "Z"
                                ].join(" ");

                                // Label position (center of the slice)
                                const labelAngle = startAngle + angle / 2;
                                const labelRadius = (radius + innerRadius) / 2;
                                const lx = centerX + (labelRadius + 15) * Math.cos((Math.PI * (labelAngle - 90)) / 180);
                                const ly = centerY + (labelRadius + 15) * Math.sin((Math.PI * (labelAngle - 90)) / 180);

                                return (
                                    <G key={index}>
                                        <Path d={d} fill={item.color} />
                                        {angle > 15 && (
                                            <SvgText
                                                x={lx}
                                                y={ly}
                                                fill="#9CA3AF"
                                                fontSize="10"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                alignmentBaseline="middle"
                                            >
                                                {item.formattedTime}
                                            </SvgText>
                                        )}
                                    </G>
                                );
                            })}
                        </G>
                    </Svg>

                    {/* Legend */}
                    <View className="ml-4 flex-1">
                        {data.map((item, index) => (
                            <View key={index} className="flex-row items-center mb-2">
                                <View
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: item.color }}
                                />
                                <Text className="text-gray-400 text-xs" numberOfLines={1}>
                                    {item.name}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Stats below chart */}
                <View className="flex-row justify-between w-full mt-6">
                    <View className="items-center flex-1">
                        <Text className="text-emerald-400 text-2xl font-bold">
                            {donutChartData.totalTime ? Math.round(donutChartData.totalTime / 60) : 0}
                        </Text>
                        <Text className="text-gray-400 text-sm">Total Hours</Text>
                    </View>
                    <View className="h-10 w-px bg-gray-800" />
                    <View className="items-center flex-1">
                        <Text className="text-blue-400 text-2xl font-bold">
                            {donutChartData.averageTime ? Math.round(donutChartData.averageTime) : 0}
                        </Text>
                        <Text className="text-gray-400 text-sm">Avg Minutes</Text>
                    </View>
                    <View className="h-10 w-px bg-gray-800" />
                    <View className="items-center flex-1">
                        <Text className="text-purple-400 text-2xl font-bold">
                            {donutChartData.successRate ? Math.round(donutChartData.successRate) : 0}%
                        </Text>
                        <Text className="text-gray-400 text-sm">Success Rate</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderHeatmap = () => {
        if (!overallConsistencyData?.consistencyData || overallConsistencyData.consistencyData.length === 0) {
            return (
                <View className="items-center justify-center py-8">
                    <Ionicons name="calendar-outline" size={48} color="#4B5563" />
                    <Text className="text-gray-500 mt-4">No consistency data available</Text>
                </View>
            );
        }

        const last30Days = overallConsistencyData.consistencyData.slice(-30);

        return (
            <View>
                <Text className="text-gray-400 text-sm mb-3">Last 30 Days Consistency</Text>
                <View className="flex-row flex-wrap justify-between">
                    {last30Days.map((day, index) => (
                        <View
                            key={index}
                            className="w-8 h-8 rounded-lg m-0.5"
                            style={{
                                backgroundColor: day.showedUp ? '#10B981' : '#374151'
                            }}
                        />
                    ))}
                </View>
                <View className="flex-row justify-between mt-4">
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 rounded bg-emerald-500 mr-2" />
                        <Text className="text-gray-400 text-xs">Worked</Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 rounded bg-gray-700 mr-2" />
                        <Text className="text-gray-400 text-xs">Missed</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderTodaySessions = () => {
        if (!todayWork?.sessions || todayWork.sessions.length === 0) {
            return (
                <View className="items-center justify-center py-6">
                    <Ionicons name="checkmark-circle-outline" size={40} color="#4B5563" />
                    <Text className="text-gray-500 mt-3">No sessions today</Text>
                </View>
            );
        }

        return (
            <View>
                {todayWork.sessions.slice(0, 10).map((session, index) => (
                    <View key={index} className="flex-row items-center justify-between py-3 border-b border-gray-800/50">
                        <View className="flex-1 mr-4">
                            <Text className="text-gray-300 text-base mb-1" numberOfLines={1}>
                                {session.title}
                            </Text>
                            <View className={`px-2 py-0.5 rounded-md self-start ${session.type === 'habit' ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                                <Text className={`text-[10px] font-bold uppercase tracking-wider ${session.type === 'habit' ? 'text-purple-400' : 'text-blue-400'}`}>
                                    {session.type === 'habit' ? 'Habit' : 'General'}
                                </Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text className="text-emerald-400 font-medium text-base">
                                {session.isTask ? "Done" : formatDurationHMS(session.totalDuration)}
                            </Text>
                            {session.isTask && (
                                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                            )}
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <ActivityIndicator size="large" color="#10B981" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            {/* Header */}
            <View className="pt-4 px-4">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-white text-2xl font-bold">Profile</Text>
                        <Text className="text-gray-400 text-sm">Your journey analytics</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} className="p-2">
                        <Ionicons name="log-out-outline" size={22} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* User Info */}
                <View className="bg-gray-800/50 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center">
                        <View className="w-16 h-16 bg-emerald-500/20 rounded-full items-center justify-center mr-4">
                            <Text className="text-emerald-400 text-2xl font-bold">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-white text-lg font-bold">{user.name || 'User'}</Text>
                            <Text className="text-gray-400 text-sm mb-1">{user.email}</Text>
                            <View className="flex-row items-center">
                                <View className={`w-2 h-2 rounded-full mr-2 ${user.isAccountVerified ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <Text className="text-gray-400 text-xs">
                                    {user.isAccountVerified ? 'Verified' : 'Unverified'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {!user.isAccountVerified && (
                        <TouchableOpacity
                            onPress={handleVerifyAccount}
                            className="mt-4 bg-emerald-500 rounded-lg py-2 items-center"
                        >
                            <Text className="text-white font-medium">Verify Email</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Analytics Sections */}
            <View className="px-4 mb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['overview', 'sessions', 'consistency'].map((section) => (
                        <TouchableOpacity
                            key={section}
                            onPress={() => setActiveSection(section)}
                            className={`px-4 py-2 rounded-full mr-2 ${activeSection === section ? 'bg-emerald-500' : 'bg-gray-800'}`}
                        >
                            <Text className={activeSection === section ? 'text-white font-medium' : 'text-gray-400'}>
                                {section.charAt(0).toUpperCase() + section.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                className="flex-1 px-4"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={fetchAllData}
                        tintColor="#10B981"
                    />
                }
            >
                {isLoadingData ? (
                    <View className="py-20 items-center">
                        <ActivityIndicator size="large" color="#10B981" />
                        <Text className="text-gray-400 mt-4">Loading analytics...</Text>
                    </View>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <View className="mb-6">
                            <View className="flex-row justify-between mb-4">
                                <View className="bg-gray-800/50 rounded-xl p-4 flex-1 mr-2">
                                    <Text className="text-emerald-400 text-2xl font-bold">
                                        {user.currentStreak || 0}
                                    </Text>
                                    <Text className="text-gray-400 text-sm">Current Streak</Text>
                                </View>
                                <View className="bg-gray-800/50 rounded-xl p-4 flex-1 ml-2">
                                    <Text className="text-blue-400 text-2xl font-bold">
                                        {user.totalSessions || 0}
                                    </Text>
                                    <Text className="text-gray-400 text-sm">Total Sessions</Text>
                                </View>
                            </View>
                            <View className="flex-row justify-between">
                                <View className="bg-gray-800/50 rounded-xl p-4 flex-1 mr-2">
                                    <Text className="text-yellow-400 text-2xl font-bold">
                                        {user.longestStreak || 0}
                                    </Text>
                                    <Text className="text-gray-400 text-sm">Longest Streak</Text>
                                </View>
                                <View className="bg-gray-800/50 rounded-xl p-4 flex-1 ml-2">
                                    <Text className="text-red-400 text-2xl font-bold">
                                        {user.missingDays || 0}
                                    </Text>
                                    <Text className="text-gray-400 text-sm">Days Missed</Text>
                                </View>
                            </View>
                        </View>

                        {/* Donut Chart Card */}
                        {activeSection === 'overview' && (
                            <View className="bg-gray-800/30 rounded-xl p-4 mb-4">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-white font-medium">Session Distribution</Text>
                                    <Ionicons name="pie-chart" size={20} color="#10B981" />
                                </View>
                                {renderDonutChart()}
                            </View>
                        )}

                        {/* Today's Sessions Card */}
                        {(activeSection === 'overview' || activeSection === 'sessions') && (
                            <View className="bg-gray-800/30 rounded-xl p-4 mb-4">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-white font-medium">Today's Sessions</Text>
                                    <Ionicons name="today" size={20} color="#3B82F6" />
                                </View>
                                {renderTodaySessions()}
                            </View>
                        )}

                        {/* Heatmap Card */}
                        {(activeSection === 'overview' || activeSection === 'consistency') && (
                            <View className="bg-gray-800/30 rounded-xl p-4 mb-8 justify-center">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-white font-medium">Consistency Heatmap</Text>
                                    <Ionicons name="calendar" size={20} color="#8B5CF6" />
                                </View>
                                {overallConsistencyData?.consistencyData ? (
                                    <ConsistencyHeatmap consistencyData={overallConsistencyData.consistencyData} />
                                ) : (
                                    <View className="items-center justify-center py-6">
                                        <Ionicons name="calendar-outline" size={48} color="#4B5563" />
                                        <Text className="text-gray-500 mt-3">No consistency data available</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;