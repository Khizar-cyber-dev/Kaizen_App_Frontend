import React, { useMemo, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';

const CELL_SIZE = 14;
const CELL_GP = 4;
const COL_WIDTH = CELL_SIZE + CELL_GP;

const getUTCDateKey = (date) => {
    try {
        const d = new Date(date);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return "";
    }
};

const buildWeeks = (contributionsProp = [], daysToShow = 105) => {
    const contributions = Array.isArray(contributionsProp)
        ? contributionsProp
        : (contributionsProp?.contributions || []);

    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayKey = getUTCDateKey(todayUTC);

    // Create a lookup map
    const contributionMap = {};
    contributions.forEach(c => {
        if (c.date) contributionMap[c.date] = c.level || 0;
    });

    // End on the last day of the current week (Sunday)
    const localDay = todayUTC.getUTCDay();
    const diffToSunday = localDay === 0 ? 0 : 7 - localDay;

    const endDate = new Date(todayUTC);
    endDate.setUTCDate(todayUTC.getUTCDate() + diffToSunday);

    // Calculate start date
    const startDate = new Date(endDate);
    startDate.setUTCDate(endDate.getUTCDate() - daysToShow + 1);

    // Ensure we start on a Monday
    const startDayOfWeek = startDate.getUTCDay();
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
                level: contributionMap[key] || 0,
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
    if (cell.level === 2) return "#059669";
    if (cell.level === 1) return "#065f46";
    // Keep today's date distinct or just let the border handle it? 
    // User requested "disappear today green box if he undo it", so we rely on level.
    // The previous code had: if (cell.isToday) return "#34D399";
    // We remove that default return for isToday so it defaults to background color (dark)
    // The border will still be applied in the render method below if isToday is true.
    return "#1F2937";
};

export default function ContributionGraph({ contributions = [] }) {
    const scrollViewRef = useRef(null);
    const hasScrolledRef = useRef(false);
    const weeks = useMemo(() => buildWeeks(contributions), [contributions]);

    const activeDays = useMemo(() => {
        const data = Array.isArray(contributions) ? contributions : (contributions?.contributions || []);
        return data.filter(c => c.level > 0).length;
    }, [contributions]);

    const handleContentSizeChange = () => {
        if (!hasScrolledRef.current && weeks.length > 0) {
            scrollViewRef.current?.scrollToEnd({ animated: false });
            hasScrolledRef.current = true;
        }
    };

    return (
        <View>
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

            {/* Legend */}
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
