import { create } from 'zustand';
import api from '../lib/axios';

export const useSessionStore = create((set) => ({
    sessions: [],
    currentSession: null,
    secondsLeft: 0,
    isActive: false,
    isLoading: false,
    timerEndTime: null,

    startSession: async (sessionData) => {
        set({ isLoading: true });
        try {
            const response = await api.post(`/sessions/start`, sessionData);
            const session = response.data.session;
            set({
                currentSession: session,
                secondsLeft: session.intendedDuration * 60,
                timerEndTime: Date.now() + session.intendedDuration * 60 * 1000,
                isActive: true,
                isLoading: false
            });
            return session;
        } catch (error) {
            console.error("Start session error:", error);
            set({ isLoading: false });
            throw error;
        }
    },

    fetchSession: async (sessionId) => {
        set({ isLoading: true });
        try {
            const response = await api.get(`/sessions/${sessionId}`);
            const session = response.data.session;

            set((state) => {
                // If we already have a countdown running, only sync if drift is > 5s
                const serverSeconds = response.data.remainingSeconds || 0;
                const shouldSync = state.secondsLeft === 0 || Math.abs(state.secondsLeft - serverSeconds) > 5;
                const newSeconds = shouldSync ? serverSeconds : state.secondsLeft;
                const isActive = session.status === 'in_progress' && !session.isPaused;

                return {
                    currentSession: session,
                    secondsLeft: newSeconds,
                    timerEndTime: isActive ? Date.now() + newSeconds * 1000 : null,
                    isActive: isActive,
                    isLoading: false
                };
            });
            return session;
        } catch (error) {
            console.log("Error in fetching the session", error);
            set({ isLoading: false });
            throw error;
        }
    },

    tick: () => {
        set((state) => {
            if (state.isActive && state.timerEndTime) {
                const seconds = Math.round((state.timerEndTime - Date.now()) / 1000);
                return { secondsLeft: Math.max(0, seconds) };
            } else if (state.isActive && state.secondsLeft > 0) {
                return { secondsLeft: state.secondsLeft - 1 };
            }
            return state;
        });
    },

    pauseSession: async (sessionId) => {
        // Optimistic update: Stop timer immediately
        set({ isActive: false });
        try {
            const response = await api.put(`/sessions/pause/${sessionId}`);
            const session = response.data.session;
            const isActive = session.status === 'in_progress' && !session.isPaused;

            set((state) => ({
                currentSession: session,
                isActive: isActive,
                timerEndTime: isActive ? Date.now() + state.secondsLeft * 1000 : null
            }));
            return session;
        } catch (error) {
            console.error("Pause session error:", error);
            // Revert state if needed, though usually we can just show error
            throw error;
        }
    },

    closeSession: async (userId, sessionId, closeData) => {
        // Optimistic update: Stop timer immediately
        // Capture the current secondsLeft before wiping state
        let finalSecondsLeft = 0;
        set((state) => {
            finalSecondsLeft = state.secondsLeft;
            return { isLoading: true, isActive: false, timerEndTime: null };
        });

        try {
            // Send remainingSeconds so server can back-calculate precise endTime
            // unaffected by clock skew or latency
            const data = { ...closeData, remainingSeconds: finalSecondsLeft };
            const response = await api.put(`/sessions/close/${userId}/${sessionId}`, data);
            const session = response.data.session;
            set({
                currentSession: session, // Keep session for summary view
                isActive: false,
                secondsLeft: 0,
                timerEndTime: null,
                isLoading: false
            });
            return session;
        } catch (error) {
            console.error("Close session error:", error);
            set({ isLoading: false });
            throw error;
        }
    },

    continueSession: async (sessionId) => {
        set({ isLoading: true });
        try {
            const response = await api.post(`/sessions/continue/${sessionId}`);
            const session = response.data.session;
            const remainingSeconds = response.data.remainingSeconds || 0;

            set({
                currentSession: session,
                secondsLeft: remainingSeconds,
                timerEndTime: Date.now() + remainingSeconds * 1000,
                isActive: true,
                isLoading: false
            });
            return session;
        } catch (error) {
            console.error("Continue session error:", error);
            set({ isLoading: false });
            throw error;
        }
    },

    fetchSessionHistory: async (userId, range = 'today') => {
        set({ isLoading: true });
        try {
            const response = await api.get(`/sessions/history/${userId}?range=${range}`);
            set({ sessions: response.data.sessions, isLoading: false });
        } catch (error) {
            console.error("Fetch session history error:", error);
            set({ isLoading: false });
        }
    },
}));
