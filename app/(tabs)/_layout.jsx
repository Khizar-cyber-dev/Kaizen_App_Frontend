import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import '../../global.css';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: '#1F2937',
          borderTopWidth: 1,
          // Perfect bottom padding for each platform
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : (isIOS ? 20 : 8),
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "flag" : "flag-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "repeat" : "repeat-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Wins',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "trophy" : "trophy-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="session-history"
        options={{
          headerShown: false,
          href: null, // hides it completely from bottom tabs
          tabBarStyle: { display: "none" },
        }}
      />

      <Tabs.Screen
        name="journal"
        options={{
          headerShown: false,
          href: null, // hides it completely from bottom tabs
          tabBarStyle: { display: "none" },
        }}
      />

      <Tabs.Screen
        name="session"
        options={{
          headerShown: false,
          href: null, // hides it completely from bottom tabs
          tabBarStyle: { display: "none" },
        }}
      />


      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}