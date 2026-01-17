import api from "@/lib/axios";
import { create } from "zustand";

export const useAnalysisStore = create((set) => ({
    currentData: null,
    donutChartData: null,
    overallConsistencyData: null,
    todayWork: null,
    isLoadingData: false,
    error: null,

    getUserCurrentData: async (userId) => {
        try {
            const response = await api.get(`/daily-stats/current/${userId}`)
            set({
                currentData: response.data,
                isLoading: false,
                error: null
            })
        } catch (error) {
            set({
                isLoading: false,
                error: error.response.data.message
            })
        }
    },

    getDonutChartData: async (userId) => {
        try {
            const response = await api.get(`/daily-stats/donut-chart-data/${userId}`)
            set({
                donutChartData: response.data,
                isLoading: false,
                error: null
            })
        } catch (error) {
            set({
                isLoading: false,
                error: error.response.data.message
            })
        }
    },

    getTodaysSessions: async (userId) => {
        try {
            const response = await api.get(`/daily-stats/today/${userId}`)
            set({
                todayWork: response.data,
                isLoading: false,
                error: null
            })
        } catch (error) {
            set({
                isLoading: false,
                error: error.response.data.message
            })
        }
    },

    getOverallConsistencyDays: async (userId) => {
        try {
            const response = await api.get(`/daily-stats/consistency/${userId}`)
            set({
                overallConsistencyData: response.data,
                isLoading: false,
                error: null
            })
        } catch (error) {
            set({
                isLoading: false,
                error: error.response.data.message
            })
        }
    }
}))