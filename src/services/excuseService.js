import api from '../config/api';

const excuseService = {
    // Student
    createExcuseRequest: async (formData) => {
        try {
            const response = await api.post('/excuses', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getMyRequests: async () => {
        try {
            const response = await api.get('/excuses/my-requests');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Faculty
    getFacultyRequests: async () => {
        try {
            const response = await api.get('/excuses/faculty');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateStatus: async (id, status, notes) => {
        try {
            const response = await api.put(`/excuses/${id}/status`, { status, notes });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Admin
    getAllRequests: async (status) => {
        try {
            const params = status ? { status } : {};
            const response = await api.get('/excuses/admin/all', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default excuseService;
