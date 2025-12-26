import api from '../config/api';

const analyticsService = {
    // Dashboard Stats
    getDashboardStats: async () => {
        try {
            const response = await api.get('/analytics/dashboard');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Academic Performance
    getAcademicPerformance: async () => {
        try {
            const response = await api.get('/analytics/academic-performance');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Attendance Analytics
    getAttendanceAnalytics: async () => {
        try {
            const response = await api.get('/analytics/attendance');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Meal Usage
    getMealUsage: async () => {
        try {
            const response = await api.get('/analytics/meal-usage');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Event Stats
    getEventStats: async () => {
        try {
            const response = await api.get('/analytics/events');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Anti-Fraud & Risk
    getAtRiskAttendance: async (threshold = 20) => {
        try {
            const response = await api.get('/analytics/at-risk', { params: { threshold } });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getFlaggedRecords: async () => {
        try {
            const response = await api.get('/analytics/flagged-records');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Export Helpers (Trigger download)
    exportExcel: () => {
        window.open(`${api.defaults.baseURL}/analytics/export/excel`, '_blank');
    },
    exportPDF: () => {
        window.open(`${api.defaults.baseURL}/analytics/export/pdf`, '_blank');
    },
    exportCSV: () => {
        window.open(`${api.defaults.baseURL}/analytics/export/csv`, '_blank');
    }
};

export default analyticsService;
