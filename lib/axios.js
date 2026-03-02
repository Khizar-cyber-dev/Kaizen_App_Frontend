import axios from "axios";
import * as SecureStore from "expo-secure-store";
//

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.134:3000/api";

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

async function clearSecureItem(key) {
    try {
        await SecureStore.deleteItemAsync(key);
    } catch (error) {
        console.warn(`SecureStore delete failed for ${key}, falling back to empty value`, error);
        try {
            await SecureStore.setItemAsync(key, "");
        } catch (setError) {
            console.error(`SecureStore fallback clear also failed for ${key}`, setError);
        }
    }
}

api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and it's not a retry and not a refresh request itself
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
            originalRequest._retry = true;

            try {
                const refreshToken = await SecureStore.getItemAsync("refreshToken");
                if (!refreshToken) {
                    console.log("No refresh token available, user needs to re-authenticate");
                    return Promise.reject(error);
                }

                console.log("Attempting to refresh token...");
                const response = await axios.post(`${BASE_URL}/auth/refresh`, {
                    refreshToken: refreshToken
                });

                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
                console.log("Token refresh successful");

                await SecureStore.setItemAsync("accessToken", newAccessToken);
                if (newRefreshToken) {
                    await SecureStore.setItemAsync("refreshToken", newRefreshToken);
                }

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.log("Token refresh failed, user session expired");
                // Clear state if refresh fails - this will trigger redirect via RootLayout
                await clearSecureItem("accessToken");
                await clearSecureItem("refreshToken");
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
