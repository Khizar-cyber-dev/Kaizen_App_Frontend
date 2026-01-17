import api from "@/lib/axios";
import { create } from "zustand";

export const useAchievementStore = create((set) => ({
    achievements: [],
    isLoading: false,
    error: null,

    getAchievements: async (userId) => {
        try {
            set({ isLoading: true });
            const response = await api.get(`/achievements/${userId}`);
            const data = response.data;
            set({ achievements: data.achievements, isLoading: false });
        } catch (error) {
            set({ error, isLoading: false });
        }
    },

}))