import React, { useMemo, useRef } from 'react';
import { View, Text, ScrollView } from "react-native";

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

const CELL_SIZE = 14;
const CELL_GP = 4;
const COL_WIDTH = CELL_SIZE + CELL_GP;
const DAY_COL_WIDTH = 40;

const getUTCDateKey = (date) => {
    try {
        const d = new Date(date);
        // Standardize to YYYY-MM-DD using UTC components to avoid timezone shifts
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return "";
    }
};

const buildWeeks = (contributionsProp = [], daysToShow = 105) => {
    // Defensive check: if contributions is the user object, extract the array
    const contributions = Array.isArray(contributionsProp)
        ? contributionsProp
        : (contributionsProp?.contributions || []);

    const now = new Date();
    // Normalize "now" to midnight UTC for calculations
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayKey = getUTCDateKey(todayUTC);

    // Create a lookup map for faster and more reliable matching
    const contributionMap = {};
    contributions.forEach(c => {
        if (c.date) contributionMap[c.date] = c.showedUp;
    });

    // End on the last day of the current week (Sunday)
    const localDay = todayUTC.getUTCDay(); // 0 is Sunday
    const diffToSunday = localDay === 0 ? 0 : 7 - localDay;

    const endDate = new Date(todayUTC);
    endDate.setUTCDate(todayUTC.getUTCDate() + diffToSunday);

    // Calculate start date to cover daysToShow
    const startDate = new Date(endDate);
    startDate.setUTCDate(endDate.getUTCDate() - daysToShow + 1);

    // Ensure we start on a Monday
    const startDayOfWeek = startDate.getUTCDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    startDate.setUTCDate(startDate.getUTCDate() - diffToMonday);

    const weeks = [];
    let currentDayIter = new Date(startDate);

    // 15 weeks = 105 days
    for (let w = 0; w < 15; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            const dateObj = new Date(currentDayIter);
            const key = getUTCDateKey(dateObj);

            week.push({
                key,
                showedUp: !!contributionMap[key],
                isToday: key === todayKey,
                monthName: dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
                dayOfMonth: dateObj.getUTCDate()
            });
            currentDayIter.setUTCDate(currentDayIter.getUTCDate() + 1);
        }
        weeks.push(week);
    }
    return weeks;
};

const getCellColor = (cell) => {
    if (cell.isToday) return "#34D399";
    if (cell.showedUp) return "#059669";
    return "#1F2937";
};

export default function GithubHeatmap({ contributions = [] }) {
    const scrollViewRef = useRef(null);
    const hasScrolledRef = useRef(false);
    const weeks = useMemo(() => buildWeeks(contributions), [contributions]);

    const activeDays = useMemo(() => {
        const data = Array.isArray(contributions) ? contributions : (contributions?.contributions || []);
        return data.filter(c => c.showedUp).length;
    }, [contributions]);

    const handleContentSizeChange = () => {
        if (!hasScrolledRef.current && weeks.length > 0) {
            scrollViewRef.current?.scrollToEnd({ animated: false });
            hasScrolledRef.current = true;
        }
    };

    return (
        <View className="mx-6 mb-8 bg-gray-800/10 rounded-[32px] border border-gray-700/20 p-6">
            <View className="flex-row justify-between items-center mb-8">
                <View>
                    <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Overview</Text>
                    <Text className="text-white text-2xl font-bold italic">Discipline</Text>
                </View>
                <View className="flex-row items-center bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/10 items-end">
                    <Text className="text-emerald-400 text-lg font-bold px-2">{activeDays}</Text>
                    <Text className="text-emerald-500/50 text-[8px] font-bold uppercase px-2">Days Active</Text>
                </View>
            </View>

            <View className="flex-row">
                {/* Fixed Day Labels Column */}
                <View style={{ width: DAY_COL_WIDTH }} className="justify-start pr-3">
                    <View style={{ height: 32, marginBottom: 16 }} />
                    {DAY_LABELS.map((label, idx) => (
                        <View key={idx} style={{ height: CELL_SIZE + CELL_GP, justifyContent: 'center' }}>
                            <Text className="text-gray-600 text-[9px] font-bold uppercase">
                                {label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Scrollable Month Labels and Heatmap Grid */}
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="overflow-visible"
                    onContentSizeChange={handleContentSizeChange}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    <View>
                        {/* Month Headers */}
                        <View className="flex-row items-end h-8 mb-4">
                            {weeks.map((week, i) => {
                                const showMonth = i === 0 || week[0].monthName !== weeks[i - 1][0].monthName;
                                const isTooClose = i > 0 && i < 2;

                                return (
                                    <View key={i} style={{ width: COL_WIDTH }}>
                                        {showMonth && !isTooClose && (
                                            <Text
                                                className="text-gray-500 text-[10px] font-bold absolute bottom-2 left-0"
                                                style={{ width: 40, zIndex: 20 }}
                                            >
                                                {week[0].monthName}
                                            </Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>

                        {/* Weeks Grid */}
                        <View className="flex-row">
                            {weeks.map((week, wi) => (
                                <View key={wi} style={{ marginRight: CELL_GP }}>
                                    {week.map((cell, di) => (
                                        <View
                                            key={di}
                                            style={{
                                                width: CELL_SIZE,
                                                height: CELL_SIZE,
                                                backgroundColor: getCellColor(cell),
                                                borderRadius: 3,
                                                marginBottom: CELL_GP,
                                                borderWidth: cell.isToday ? 1.5 : 0,
                                                borderColor: '#FFFFFF',
                                            }}
                                        />
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </View>

            <View className="flex-row justify-between items-center mt-6 pt-4 border-t border-gray-700/10">
                <View className="flex-row items-center">
                    <Text className="text-gray-600 text-[9px] font-bold uppercase mr-3">Progress</Text>
                    <View className="flex-row space-x-1">
                        <View className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#1F2937' }} />
                        <View className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#065f46' }} />
                        <View className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#059669' }} />
                        <View className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#34D399' }} />
                    </View>
                </View>
                <Text className="text-gray-500 text-[9px] font-bold uppercase">Sliding 105 Day View</Text>
            </View>
        </View>
    );
}
