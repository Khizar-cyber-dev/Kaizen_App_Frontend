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

const buildWeeks = (consistencyData = [], daysToShow = 105) => {
    const data = Array.isArray(consistencyData) ? consistencyData : [];

    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayKey = getUTCDateKey(todayUTC);

    // Create a lookup map for days that were worked
    const workedMap = {};
    data.forEach(item => {
        if (item.date && item.showedUp) {
            workedMap[item.date] = true;
        }
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
            const worked = workedMap[key] || false;

            week.push({
                key,
                worked,
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
    if (cell.worked) return "#059669";  // Worked days - emerald
    if (cell.isToday) return "#374151";  // Today but not worked - gray
    return "#1F2937";  // Default - dark gray
};

export default function ConsistencyHeatmap({ consistencyData = [] }) {
    const scrollViewRef = useRef(null);
    const hasScrolledRef = useRef(false);
    const weeks = useMemo(() => buildWeeks(consistencyData), [consistencyData]);

    const workedDays = useMemo(() => {
        const data = Array.isArray(consistencyData) ? consistencyData : [];
        return data.filter(item => item.showedUp).length;
    }, [consistencyData]);

    const totalDays = useMemo(() => {
        const data = Array.isArray(consistencyData) ? consistencyData : [];
        return data.length;
    }, [consistencyData]);

    const handleContentSizeChange = () => {
        if (!hasScrolledRef.current && weeks.length > 0) {
            scrollViewRef.current?.scrollToEnd({ animated: false });
            hasScrolledRef.current = true;
        }
    };

    return (
        <View>
            {/* Stats Row */}
            <View className="flex-row justify-between items-center mb-6">
                <View className="items-center">
                    <Text className="text-emerald-400 text-2xl font-bold">{workedDays}</Text>
                    <Text className="text-gray-400 text-xs">Worked Days</Text>
                </View>
                <View className="items-center">
                    <Text className="text-red-400 text-2xl font-bold">{totalDays - workedDays}</Text>
                    <Text className="text-gray-400 text-xs">Missed Days</Text>
                </View>
                <View className="items-center">
                    <Text className="text-blue-400 text-2xl font-bold">
                        {totalDays > 0 ? Math.round((workedDays / totalDays) * 100) : 0}%
                    </Text>
                    <Text className="text-gray-400 text-xs">Consistency</Text>
                </View>
            </View>

            {/* Scrollable Heatmap Grid */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                className="overflow-visible"
                onContentSizeChange={handleContentSizeChange}
                contentContainerStyle={{ paddingRight: 20 }}
            >
                <View className='flex-1 flex-row items-center justify-center'>
                    <View>
                        <Text style={{ opacity: 0 }}>Coi</Text>
                    </View>
                    <View className=''>
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
                </View>
            </ScrollView>
        </View>
    ); s
}