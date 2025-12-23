/**
 * Event Service
 * 
 * API calls for event management and registrations.
 */

import api from '../config/api';

/**
 * @typedef {Object} Event
 * @property {string} id - Event ID
 * @property {string} title - Event title
 * @property {string} description - Event description
 * @property {string} date - Event date/time (ISO string)
 * @property {string} [end_date] - End date if multi-day
 * @property {string} location - Event location
 * @property {string} category - Event category
 * @property {number} capacity - Maximum attendees
 * @property {number} registered_count - Current registrations
 * @property {number} available_spots - Available spots
 * @property {boolean} is_paid - Whether event requires payment
 * @property {number} [price] - Price if paid
 * @property {string} [image_url] - Event image
 */

/**
 * @typedef {Object} EventRegistration
 * @property {string} id - Registration ID
 * @property {string} status - Status (registered, waitlisted, cancelled, attended)
 * @property {string} [qr_code] - QR code for check-in
 * @property {boolean} checked_in - Whether checked in
 * @property {string} [check_in_time] - Check-in timestamp
 */

const eventService = {
    /**
     * Get events with filters
     * @param {Object} [options] - Filter options
     * @param {string} [options.category] - Filter by category
     * @param {string} [options.startDate] - Filter from date
     * @param {string} [options.endDate] - Filter to date
     * @param {number} [options.page] - Page number
     * @param {number} [options.limit] - Items per page
     * @returns {Promise<{data: Event[]}>}
     */
    async getEvents(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.category) params.append('category', options.category);
            if (options.startDate) params.append('start_date', options.startDate);
            if (options.endDate) params.append('end_date', options.endDate);
            if (options.page) params.append('page', options.page);
            if (options.limit) params.append('limit', options.limit);

            const response = await api.get(`/events?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get event details by ID
     * @param {string} eventId - Event ID
     * @returns {Promise<{data: Event}>}
     */
    async getEventDetails(eventId) {
        try {
            const response = await api.get(`/events/${eventId}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Register for an event
     * @param {string} eventId - Event ID
     * @returns {Promise<{data: {registration: EventRegistration, event?: Object, payment?: Object, waitlist?: Object}}>}
     */
    async registerForEvent(eventId) {
        try {
            const response = await api.post(`/events/${eventId}/register`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get user's event registrations
     * @param {Object} [options] - Query options
     * @param {string} [options.status] - Filter by status
     * @returns {Promise<{data: EventRegistration[]}>}
     */
    async getMyRegistrations(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.status) params.append('status', options.status);

            const response = await api.get(`/events/registrations?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Cancel an event registration
     * @param {string} registrationId - Registration ID
     * @returns {Promise<Object>}
     */
    async cancelRegistration(registrationId) {
        try {
            const response = await api.delete(`/events/registrations/${registrationId}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Check in attendee (staff/admin only)
     * @param {string} eventId - Event ID
     * @param {string} qrCode - QR code from registration
     * @returns {Promise<Object>}
     */
    async checkInUser(eventId, qrCode) {
        try {
            const response = await api.post(`/events/${eventId}/checkin`, { qr_code: qrCode });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Create an event (admin/staff/faculty only)
     * @param {Object} eventData - Event data
     * @returns {Promise<{data: Event}>}
     */
    async createEvent(eventData) {
        try {
            const response = await api.post('/events', eventData);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    // ==================== Survey Methods ====================

    /**
     * Get survey for an event
     * @param {string} eventId
     * @returns {Promise<{data: Object}>}
     */
    async getSurvey(eventId) {
        try {
            const response = await api.get(`/events/${eventId}/survey`);
            return response.data;
        } catch (error) {
            // Return null if not found instead of throwing, to handle UI gracefully
            if (error.response?.status === 404) return null;
            throw this._handleError(error);
        }
    },

    /**
     * Submit survey response
     * @param {string} eventId
     * @param {Object} responses - Key-value pair of responses
     * @returns {Promise<Object>}
     */
    async submitSurvey(eventId, responses) {
        try {
            const response = await api.post(`/events/${eventId}/survey/response`, { responses });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get survey results (admin/organizer)
     * @param {string} eventId
     * @returns {Promise<{data: Object}>}
     */
    async getSurveyResults(eventId) {
        try {
            const response = await api.get(`/events/${eventId}/survey/results`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Update an event (admin/staff/faculty only)
     * @param {string} eventId - Event ID
     * @param {Object} eventData - Updated event data
     * @returns {Promise<{data: Event}>}
     */
    async updateEvent(eventId, eventData) {
        try {
            const response = await api.put(`/events/${eventId}`, eventData);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Delete an event (admin/staff/faculty only)
     * @param {string} eventId - Event ID
     * @returns {Promise<Object>}
     */
    async deleteEvent(eventId) {
        try {
            const response = await api.delete(`/events/${eventId}`);
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
        const message = error.response?.data?.message || error.message || 'Event operation failed';
        const code = error.response?.data?.error?.code || 'EVENT_ERROR';
        const err = new Error(message);
        err.code = code;
        err.status = error.response?.status;
        return err;
    }
};

export default eventService;
