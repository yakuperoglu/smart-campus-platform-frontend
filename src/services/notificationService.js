/**
 * Notification Service
 * 
 * API calls for user notifications.
 */

import api from '../config/api';

const notificationService = {
    /**
     * Get user notifications
     * @param {Object} [options] - Filter options
     * @param {number} [options.page] - Page number
     * @param {number} [options.limit] - Items per page
     * @param {boolean} [options.unreadOnly] - Filter by unread status
     * @returns {Promise<{data: Object[]}>}
     */
    async getNotifications(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.page) params.append('page', options.page);
            if (options.limit) params.append('limit', options.limit);
            if (options.unreadOnly) params.append('unread_only', options.unreadOnly);

            const response = await api.get(`/notifications?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     * @returns {Promise<Object>}
     */
    async markAsRead(notificationId) {
        try {
            const response = await api.put(`/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Mark all notifications as read
     * @returns {Promise<Object>}
     */
    async markAllAsRead() {
        try {
            const response = await api.put('/notifications/read-all');
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Delete a notification
     * @param {string} notificationId - Notification ID
     * @returns {Promise<Object>}
     */
    async deleteNotification(notificationId) {
        try {
            const response = await api.delete(`/notifications/${notificationId}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Handle API errors consistently
     * @private
     */
    _handleError(error) {
        const message = error.response?.data?.message || error.message || 'Notification operation failed';
        const code = error.response?.data?.error?.code || 'NOTIFICATION_ERROR';
        const err = new Error(message);
        err.code = code;
        err.status = error.response?.status;
        return err;
    }
};

export default notificationService;
