import { create } from 'zustand';
import api from '../lib/axios';
import * as SecureStore from 'expo-secure-store';

export const useUserStore = create((set) => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    checkingAuth: true,

    checkAuth: async (silent = false) => {
        if (!silent) set({ checkingAuth: true });

        try {
            const token = await SecureStore.getItemAsync("accessToken");

            if (!token) {
                console.log("checkAuth: No token found in SecureStore");
                set({
                    user: null,
                    isAuthenticated: false,
                    checkingAuth: false,
                });
                return;
            }

            console.log("checkAuth: Token found, verifying with backend...");
            const response = await api.get("/auth/me");
            console.log("checkAuth: Backend verification success");

            set({
                user: response.data.userData,
                isAuthenticated: true,
                checkingAuth: false,
            });
        } catch (error) {
            console.error("checkAuth: Verification failed", error);
            if (!silent) {
                await SecureStore.deleteItemAsync("accessToken");
                await SecureStore.deleteItemAsync("refreshToken");
                set({
                    user: null,
                    isAuthenticated: false,
                });
            }
            set({ checkingAuth: false });
        }
    },

    refreshUser: async () => {
        try {
            // Check if user has valid token before making API call
            const token = await SecureStore.getItemAsync("accessToken");
            if (!token) {
                console.log("refreshUser: No access token, skipping refresh");
                return;
            }

            const response = await api.get("/auth/me");
            set({ user: response.data.userData });
        } catch (error) {
            console.error("refreshUser: Failed to refresh user data", error);
            // If it's a 401 and we're supposedly authenticated, something is wrong
            if (error.response?.status === 401) {
                console.log("refreshUser: Unauthorized, clearing authentication state");
                set({ user: null, isAuthenticated: false });
            }
        }
    },

    register: async (userInfo) => {
        set({ isLoading: true });
        try {
            const response = await api.post("/auth/register", userInfo);
            const { accessToken, refreshToken, user } = response.data;

            console.log("Register success. Storing tokens:", { accessToken: accessToken ? "YES" : "NO", refreshToken: refreshToken ? "YES" : "NO" });

            await SecureStore.setItemAsync("accessToken", accessToken);
            await SecureStore.setItemAsync("refreshToken", refreshToken);

            const storedToken = await SecureStore.getItemAsync("accessToken");
            console.log("Verify stored accessToken:", storedToken ? "Existent" : "Missing");

            set({ user, isAuthenticated: true, isLoading: false });
            return true;
        } catch (error) {
            console.error("Registration error:", error);
            set({ isLoading: false });
            throw error;
        }
    },

    login: async (credentials) => {
        set({ isLoading: true });
        try {
            const response = await api.post("/auth/login", credentials);
            const { accessToken, refreshToken, user } = response.data;

            console.log("Login success. Storing tokens:", { accessToken: accessToken ? "YES" : "NO", refreshToken: refreshToken ? "YES" : "NO" });

            await SecureStore.setItemAsync("accessToken", accessToken);
            await SecureStore.setItemAsync("refreshToken", refreshToken);

            const storedToken = await SecureStore.getItemAsync("accessToken");
            console.log("Verify stored accessToken:", storedToken ? "Existent" : "Missing");

            set({ user, isAuthenticated: true, isLoading: false });
            return true;
        } catch (error) {
            console.error("Login error:", error);
            set({ isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        console.log("Starting logout - clearing local state first");

        try {
            // Get refresh token BEFORE deleting it
            const refreshToken = await SecureStore.getItemAsync("refreshToken");

            // Clear local state FIRST to prevent race conditions
            set({ user: null, isAuthenticated: false, isLoading: false });

            // Delete tokens from storage
            await SecureStore.deleteItemAsync("accessToken");
            await SecureStore.deleteItemAsync("refreshToken");

            // Then notify backend (non-blocking) if we had a token
            if (refreshToken) {
                api.post("/auth/logout", { refreshToken }).catch(err => {
                    console.error("Logout backend notification failed:", err);
                });
            }
        } catch (error) {
            console.error("Logout process error:", error);
            // Ensure state is cleared even if storage fails
            set({ user: null, isAuthenticated: false });
        }

        console.log("Logout complete");
    },

    verifyOtp: async (otp) => {
        set({ isLoading: true });
        try {
            const response = await api.post("/auth/verify-the-otp", { otp });
            set((state) => ({
                user: { ...state.user, isAccountVerified: response.data.data.isAccountVerified },
                isLoading: false
            }));
            return true;
        } catch (error) {
            console.error("Verify OTP error:", error);
            set({ isLoading: false });
            throw error;
        }
    },

    sendOtp: async () => {
        set({ isLoading: true });
        try {
            await api.post("/auth/send-verification-otp");
            set({ isLoading: false });
            return true;
        } catch (error) {
            console.error("Send OTP error:", error);
            set({ isLoading: false });
            throw error;
        }
    },

    resetOtp: async (email) => {
        set({ isLoading: true });
        try {
            await api.post("/auth/reset-otp", { email });
            set({ isLoading: false });
            return true;
        } catch (error) {
            console.error("Reset OTP error:", error);
            set({ isLoading: false });
            throw error;
        }
    },

    resetPassword: async (data) => {
        set({ isLoading: true });
        try {
            await api.post("/auth/reset-password", data);
            set({ isLoading: false });
            return true;
        } catch (error) {
            console.error("Reset Password error:", error);
            set({ isLoading: false });
            throw error;
        }
    },

    syncClerkUser: async (clerkData) => {
        try {
            console.log("Syncing Clerk user with backend:", clerkData);

            // OPTIMISTIC UPDATE: Set authenticated immediately for instant navigation
            // This allows the user to see the app while sync happens in background
            set({
                checkingAuth: false,
                isAuthenticated: true,
                isLoading: false
            });

            console.log("Starting background sync with backend...");
            const response = await api.post("/auth/sync-clerk", clerkData);
            const { accessToken, refreshToken, user } = response.data;

            if (accessToken) {
                await SecureStore.setItemAsync("accessToken", accessToken);
            }
            if (refreshToken) {
                await SecureStore.setItemAsync("refreshToken", refreshToken);
            }

            console.log("Background sync completed, updating user data");
            set({
                user,
                isAuthenticated: true,
                isLoading: false
            });
            return user;
        } catch (error) {
            console.error("Sync Clerk User error:", error);
            // On error, revert the optimistic update
            set({
                isAuthenticated: false,
                isLoading: false,
                checkingAuth: false,
                user: null
            });
            throw error;
        }
    },

    updateSettings: async (settings) => {
        set({ isLoading: true });
        try {
            const response = await api.patch("/auth/settings", settings);
            set({ user: response.data.user, isLoading: false });
            return response.data;
        } catch (error) {
            console.error("Update settings error:", error);
            set({ isLoading: false });
            throw error;
        }
    },

    setCheckingAuth: (value) => {
        set({ checkingAuth: value });
    }
}));