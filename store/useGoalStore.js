import api from "@/lib/axios";
import { create } from "zustand";

export const useGoalStore = create((set) => ({
    goals: [],
    isLoading: false,
    error: null,

    createGoal: async (userId, goalData) => {
        set({ isLoading: true })
        try {
            const response = await api.post(`/goals`, { ...goalData, userId });
            set((state) => ({ goals: [...state.goals, response.data.goal], isLoading: false }))
            return response.data.goal;
        } catch (error) {
            console.log(error)
            set({ error: error.message, isLoading: false })
            throw error;
        }
    },

    getGoals: async (userId) => {
        if (!userId) return;
        set({ isLoading: true })
        try {
            const response = await api.get(`/goals/${userId}`);
            set({ goals: response.data.goals, isLoading: false })
            return response.data.goals;
        } catch (error) {
            console.log(error)
            set({ error: error.message, isLoading: false })
            throw error;
        }
    },

    toggleGoalCompletion: async (goalId) => {
        set({ isLoading: true })
        try {
            const response = await api.get(`/goals/toggle/${goalId}`);
            set((state) => ({
                goals: state.goals.map(g => g._id === goalId ? response.data.goal : g),
                isLoading: false
            }))
            return response.data.goal;
        } catch (error) {
            console.log(error)
            set({ error: error.message, isLoading: false })
            throw error;
        }
    },

    deleteGoal: async (goalId) => {
        set({ isLoading: true })
        try {
            await api.delete(`/goals/${goalId}`);
            set((state) => ({
                goals: state.goals.filter(g => g._id !== goalId),
                isLoading: false
            }))
            return true;
        } catch (error) {
            console.log(error)
            set({ error: error.message, isLoading: false })
            throw error;
        }
    }
}));
