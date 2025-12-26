import api from '../config/api';

const userService = {
    getAllUsers: (params) => api.get('/users', { params }),
    getUserById: (id) => api.get(`/users/${id}`),
    updateUser: (id, data) => api.put(`/users/${id}`, data),
    deleteUser: (id) => api.delete(`/users/${id}`),
    uploadProfilePicture: (formData) => api.post('/users/me/profile-picture', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
};

export default userService;
