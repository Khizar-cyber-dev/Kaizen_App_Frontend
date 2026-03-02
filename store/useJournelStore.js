// legacy file kept for backwards compatibility; re-export everything from the correctly named store
export * from "./useJournalStore";

export const useJournalStore = create((set) => ({
    journals: [],
    isLoading: false,
    error: null,
    createMorningJournal: async (userId, morningData) => {
        set({ isLoading: true })
        try {            
            const response = await api.post(`/journals/morning`, { ...morningData, userId });
            set((state) => ({ journals: [...state.journals, response.data.journal], isLoading: false }))
            return response.data.journal;
        } catch (error) {
            console.log(error)
            set({ error: error.message, isLoading: false })
            throw error;
        }
    },

    createEveningJournal: async (userId, eveningData) => {
        set({ isLoading: true })
        try {
            const response = await api.post(`/journals/evening`, { ...eveningData, userId });
            set((state) => ({ journals: [...state.journals, response.data.journal], isLoading: false }))
            return response.data.journal;
        } catch (error) {
            console.log(error)
            set({ error: error.message, isLoading: false })
            throw error;
        }
        },
    getJournals: async (userId, date) => {
        if (!userId) return;
        set({ isLoading: true })
        try {
            const response = await api.get(`/journals/${userId}/${date}`);
            set({ journals: response.data.journals, isLoading: false })
            return response.data.journals;
        } catch (error) {
            console.log(error)
            set({ error: error.message, isLoading: false })
            throw error;
        }
    },
    getJournalHistory: async (userId, range) => {
        if (!userId || !range) return;
        set({ isLoading: true })
        try {
            const response = await api.get(`/journals/range/${userId}/${range}`);
            set({ journals: response.data.journals, isLoading: false })
            return response.data.journals;
        } catch (error) {
            console.log(error)
            set({ error: error.message, isLoading: false })
            throw error;
        }
    },
    getWeeklyInsight: async (userId, questions, askAdvice) => {
        if (!userId) return;
        set({ isLoading: true })
        try {
            const response = await api.get(`/journals/weekly-insight`, { userId, questions, askAdvice });
            set({ isLoading: false })
            return response.data;
        } catch (error) {
            console.log(error)
            set({ error: error.message, isLoading: false })
            throw error;
        }
    },
    getDailyAIReflection: async (userId, askAdvice, userQuestion) => {
        if (!userId) return;
        set({ isLoading: true })
        try {
            const response = await api.get(`/journals/daily-reflection`, { userId, askAdvice, userQuestion });
            set({ isLoading: false })
            return response.data;
        } catch (error) {
            console.log(error)
            set({ error: error.message, isLoading: false })
            throw error;
        }
    }
}));