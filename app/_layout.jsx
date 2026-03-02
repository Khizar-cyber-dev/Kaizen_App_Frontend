import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { useUserStore } from "@/store/useUserStore";
import { Ionicons } from "@expo/vector-icons";
import { ClerkProvider, ClerkLoaded, useAuth, useUser } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

const tokenCache = {
  async getToken(key) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log("No values stored under key: " + key);
      }
      return item;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (deleteError) {
        console.warn(`SecureStore delete failed for ${key}, falling back to empty value`, deleteError);
        try {
          await SecureStore.setItemAsync(key, "");
        } catch (setError) {
          console.error(`SecureStore fallback clear also failed for ${key}`, setError);
        }
      }
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <RootLayoutContent />
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function RootLayoutContent() {
  const {
    isAuthenticated,
    checkingAuth,
    checkAuth,
    syncClerkUser,
    setCheckingAuth,
  } = useUserStore();

  const { isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  const segments = useSegments();
  const router = useRouter();

  const [rotateAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));
  const [scale] = useState(new Animated.Value(1));

  // Wait for Clerk to load before checking auth
  useEffect(() => {
    // Only run checkAuth if Clerk has loaded
    if (!isLoaded) return;

    // If Clerk user is signed in, skip checkAuth and let syncClerkUser handle it
    if (isSignedIn && clerkUser) {
      console.log("Clerk user signed in, skipping initial checkAuth");
      setCheckingAuth(false);
      return;
    }

    // Otherwise, check for existing token-based auth
    checkAuth();
  }, [isLoaded, isSignedIn, clerkUser]);

  // Handle Clerk authentication and sync
  useEffect(() => {
    let isSyncing = false;

    const syncUser = async () => {
      // Only sync if Clerk user is signed in and we're not already syncing
      if (isLoaded && isSignedIn && clerkUser && !isSyncing) {
        // Skip if already authenticated (prevents unnecessary re-syncs)
        if (isAuthenticated) {
          console.log("Already authenticated, skipping sync");
          return;
        }

        isSyncing = true;
        console.log("Clerk user detected, syncing with backend...");

        try {
          await syncClerkUser({
            clerkId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            name: clerkUser.fullName || clerkUser.username,
          });
          console.log("Clerk sync completed successfully");
        } catch (error) {
          console.error("Failed to sync Clerk user:", error);
          // Even if sync fails, we don't want to block the user
          // They can retry or we can implement retry logic
        }
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, clerkUser, isAuthenticated]);

  useEffect(() => {
    if (checkingAuth) {
      // Start rotation animation (Native)
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Start progress animation (JS - for width)
      Animated.loop(
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      rotateAnim.stopAnimation();
      progressAnim.stopAnimation();
      scale.stopAnimation();
    }
  }, [checkingAuth]);

  useEffect(() => {
    if (checkingAuth) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isVerifyPage = segments[1] === "verifyAccount";

    if (isAuthenticated && inAuthGroup && !isVerifyPage) {
      router.replace("/");
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace("/sign-in");
    }
  }, [isAuthenticated, checkingAuth, segments]);

  if (checkingAuth) {
    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    return (
      <View className="flex-1 items-center justify-center bg-gray-900">
        {/* Animated Icon */}
        <Animated.View
          style={{
            transform: [{ rotate: spin }, { scale }],
            marginBottom: 30
          }}
        >
          <Ionicons name="walk" size={80} color="#10B981" />
        </Animated.View>

        {/* App Name with Gradient Effect */}
        <View className="mb-6">
          <Text className="text-5xl font-bold text-white mb-1">Kizen</Text>
          <View className="h-1 w-40 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full" />
        </View>

        {/* Loading Dots Animation */}
        <View className="flex-row items-center mb-8">
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              className="w-3 h-3 bg-emerald-500 rounded-full mx-1"
              style={{
                opacity: scale.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0.3 + i * 0.3, 0.6 + i * 0.2],
                }),
                transform: [
                  {
                    scale: scale.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [1, 1.2 + i * 0.1],
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>

        {/* Loading Text */}
        <Text className="text-emerald-400 text-lg font-medium mb-2">
          Loading Your Experience
        </Text>

        {/* Progress Bar */}
        <View className="w-72 h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
          <Animated.View
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full"
            style={{
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </View>

        {/* Status Messages */}
        <View className="mt-8">
          <Text className="text-gray-500 text-center">
            Preparing your personalized discipline journey
          </Text>
          <Text className="text-gray-600 text-xs text-center mt-2">
            For Top People Only
          </Text>
        </View>
      </View>
    );
  }

  return <Slot />;
}
