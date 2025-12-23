/**
 * Meal Service
 * 
 * API calls for cafeteria menus and meal reservations.
 */

import api from '../config/api';

/**
 * @typedef {Object} MenuItem
 * @property {string} name - Item name
 * @property {string} category - Category (main, side, dessert, etc.)
 */

/**
 * @typedef {Object} MealMenu
 * @property {string} id - Menu ID
 * @property {string} cafeteria_id - Cafeteria ID
 * @property {string} date - Date (YYYY-MM-DD)
 * @property {string} type - Meal type (breakfast, lunch, dinner)
 * @property {MenuItem[]} items - Menu items
 * @property {number} price - Price in TRY
 * @property {boolean} is_published - Whether menu is published
 */

/**
 * @typedef {Object} MealReservation
 * @property {string} id - Reservation ID
 * @property {string} qr_code - QR code for pickup
 * @property {string} status - Status (reserved, consumed, cancelled, no_show)
 * @property {string} reservation_time - ISO date string
 */

const mealService = {
    /**
     * Get cafeteria list
     * @returns {Promise<{data: Object[]}>}
     */
    async getCafeterias() {
        try {
            const response = await api.get('/meals/cafeterias');
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get menus with filters
     * @param {Object} [options] - Filter options
     * @param {string} [options.date] - Filter by date (YYYY-MM-DD)
     * @param {string} [options.cafeteriaId] - Filter by cafeteria
     * @param {string} [options.type] - Filter by type (breakfast, lunch, dinner)
     * @param {string} [options.startDate] - Filter from date
     * @param {string} [options.endDate] - Filter to date
     * @returns {Promise<{data: MealMenu[]}>}
     */
    async getMenus(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.date) params.append('date', options.date);
            if (options.cafeteriaId) params.append('cafeteria_id', options.cafeteriaId);
            if (options.type) params.append('type', options.type);
            if (options.startDate) params.append('start_date', options.startDate);
            if (options.endDate) params.append('end_date', options.endDate);

            const response = await api.get(`/meals/menus?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get menu by ID
     * @param {string} menuId - Menu ID
     * @returns {Promise<{data: MealMenu}>}
     */
    async getMenuById(menuId) {
        try {
            const response = await api.get(`/meals/menus/${menuId}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Create a meal reservation
     * @param {string} menuId - ID of menu to reserve
     * @returns {Promise<{data: {reservation: MealReservation, payment?: Object}}>}
     */
    async createReservation(menuId) {
        try {
            const response = await api.post('/meals/reservations', { menu_id: menuId });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get user's reservations
     * @param {Object} [options] - Query options
     * @param {string} [options.status] - Filter by status
     * @param {number} [options.page] - Page number
     * @param {number} [options.limit] - Items per page
     * @returns {Promise<{data: MealReservation[]}>}
     */
    async getMyReservations(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.status) params.append('status', options.status);
            if (options.page) params.append('page', options.page);
            if (options.limit) params.append('limit', options.limit);

            const response = await api.get(`/meals/reservations?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Cancel a reservation
     * @param {string} reservationId - Reservation ID
     * @returns {Promise<Object>}
     */
    async cancelReservation(reservationId) {
        try {
            const response = await api.delete(`/meals/reservations/${reservationId}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Validate/use a reservation (staff only)
     * @param {string} qrCode - QR code from reservation
     * @returns {Promise<Object>}
     */
    async useReservation(qrCode) {
        try {
            const response = await api.post('/meals/reservations/use', { qr_code: qrCode });
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
        const message = error.response?.data?.message || error.message || 'Meal operation failed';
        const code = error.response?.data?.error?.code || 'MEAL_ERROR';
        const err = new Error(message);
        err.code = code;
        err.status = error.response?.status;
        return err;
    }
};

export default mealService;
