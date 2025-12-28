import api from '../config/api';

const clubService = {
    getAllClubs: async (params = {}) => {
        return await api.get('/clubs', { params });
    },

    getClubById: async (id) => {
        return await api.get(`/clubs/${id}`);
    },

    createClub: async (data) => {
        return await api.post('/clubs', data);
    },

    updateClub: async (id, data) => {
        return await api.put(`/clubs/${id}`, data);
    },

    deleteClub: async (id) => {
        return await api.delete(`/clubs/${id}`);
    },

    joinClub: async (id) => {
        return await api.post(`/clubs/${id}/join`);
    },

    leaveClub: async (id) => {
        return await api.delete(`/clubs/${id}/leave`);
    },

    getClubMembers: async (id) => {
        return await api.get(`/clubs/${id}/members`);
    }
};

export default clubService;
