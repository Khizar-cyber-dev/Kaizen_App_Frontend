import { create } from 'zustand';
import api from '../lib/axios';

export const useHabitStore = create((set, get) => ({
    habits: [],
    isLoading: false,
    error: null,

    // Fetch all habits for a user
    fetchHabits: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/habits/${userId}`);
            set({
                habits: response.data.habits || [],
                isLoading: false
            });
        } catch (error) {
            console.error('Error fetching habits:', error);
            set({
                error: error.response?.data?.message || 'Failed to fetch habits',
                isLoading: false
            });
        }
    },

    // Create a new habit
    createHabit: async (habitData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/habits', habitData);

            // Refresh habits list after creation
            await get().fetchHabits(habitData.userId);

            set({ isLoading: false });
            return response.data.habit;
        } catch (error) {
            console.error('Error creating habit:', error);
            set({
                error: error.response?.data?.message || 'Failed to create habit',
                isLoading: false
            });
            throw error;
        }
    },

    // Update an existing habit
    updateHabit: async (habitId, updates) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.put(`/habits/${habitId}`, updates);

            // Update the habit in the local state
            set((state) => ({
                habits: state.habits.map(habit =>
                    habit._id === habitId ? response.data.habit : habit
                ),
                isLoading: false
            }));

            return response.data.habit;
        } catch (error) {
            console.error('Error updating habit:', error);
            set({
                error: error.response?.data?.message || 'Failed to update habit',
                isLoading: false
            });
            throw error;
        }
    },

    // Delete a habit
    deleteHabit: async (habitId) => {
        set({ isLoading: true, error: null });
        try {
            await api.delete(`/habits/${habitId}`);

            // Remove the habit from local state
            set((state) => ({
                habits: state.habits.filter(habit => habit._id !== habitId),
                isLoading: false
            }));
        } catch (error) {
            console.error('Error deleting habit:', error);
            set({
                error: error.response?.data?.message || 'Failed to delete habit',
                isLoading: false
            });
            throw error;
        }
    },

    // Toggle task habit completion
    toggleTaskHabit: async (userId, habitId) => {
        set({ isLoading: true, error: null });
        try {
            // Use the session start endpoint which handles task toggling
            const response = await api.post('/sessions/start', {
                userId,
                habitId
            });

            // Refresh habits to get updated state
            await get().fetchHabits(userId);

            set({ isLoading: false });
            return response.data;
        } catch (error) {
            console.error('Error toggling task habit:', error);
            set({
                error: error.response?.data?.message || 'Failed to toggle task',
                isLoading: false
            });
            throw error;
        }
    },

    // Start a habit session and return sessionId for navigation
    startHabitSession: async (userId, habitId, habitTitle, sessionMinutes) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/sessions/start', {
                userId,
                habitId,
                title: habitTitle,
                intendedDuration: sessionMinutes
            });

            set({ isLoading: false });
            return response.data.session._id; // Return sessionId for navigation
        } catch (error) {
            console.error('Error starting habit session:', error);
            set({
                error: error.response?.data?.message || 'Failed to start session',
                isLoading: false
            });
            throw error;
        }
    },

    // Clear error
    clearError: () => set({ error: null })
}));