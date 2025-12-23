/**
 * Schedule Service
 * 
 * API calls for course scheduling and classroom reservations.
 */

import api from '../config/api';

/**
 * @typedef {Object} ScheduleEntry
 * @property {string} id - Schedule entry ID
 * @property {string} section_id - Course section ID
 * @property {string} classroom_id - Classroom ID
 * @property {string} day_of_week - Day (Monday, Tuesday, etc.)
 * @property {string} start_time - Start time (HH:MM)
 * @property {string} end_time - End time (HH:MM)
 * @property {Object} [section] - Section details
 * @property {Object} [classroom] - Classroom details
 */

/**
 * @typedef {Object} ClassroomReservation
 * @property {string} id - Reservation ID
 * @property {string} classroom_id - Classroom ID
 * @property {string} title - Reservation title
 * @property {string} purpose - Purpose (class, meeting, event, study, exam, other)
 * @property {string} date - Date (YYYY-MM-DD)
 * @property {string} start_time - Start time
 * @property {string} end_time - End time
 * @property {string} status - Status (pending, approved, rejected, cancelled)
 */

const scheduleService = {
    /**
     * Get schedule for a semester
     * @param {Object} options - Query options
     * @param {string} options.semester - Semester (Fall, Spring, Summer)
     * @param {number} options.year - Year
     * @param {string} [options.sectionId] - Filter by section
     * @param {string} [options.classroomId] - Filter by classroom
     * @param {string} [options.instructorId] - Filter by instructor
     * @returns {Promise<{data: ScheduleEntry[]}>}
     */
    async getSchedule(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.semester) params.append('semester', options.semester);
            if (options.year) params.append('year', options.year);
            if (options.sectionId) params.append('section_id', options.sectionId);
            if (options.classroomId) params.append('classroom_id', options.classroomId);
            if (options.instructorId) params.append('instructor_id', options.instructorId);

            const response = await api.get(`/scheduling/schedule?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get user's personal schedule (enrolled courses)
     * This is a convenience method that filters by the user's enrolled sections
     * @param {string} semester - Semester
     * @param {number} year - Year
     * @returns {Promise<{data: ScheduleEntry[]}>}
     */
    async getMySchedule(semester, year) {
        try {
            const response = await api.get(`/scheduling/schedule?semester=${semester}&year=${year}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Export schedule to iCal
     * @returns {Promise<void>} Triggers file download
     */
    async exportToIcal() {
        try {
            const response = await api.get('/scheduling/my-schedule/ical', {
                responseType: 'blob'
            });

            // Trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'course-schedule.ics');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get scheduling configuration info (admin only)
     * @returns {Promise<Object>}
     */
    async getSchedulingInfo() {
        try {
            const response = await api.get('/scheduling/info');
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Generate schedule using CSP algorithm (admin only)
     * @param {Object} params - Generation parameters
     * @param {string} params.semester - Semester (Fall, Spring, Summer)
     * @param {number} params.year - Year
     * @param {boolean} [params.previewOnly=false] - Dry run without saving
     * @returns {Promise<{data: {success: boolean, statistics: Object, assignments: Array, unassigned: Array}}>}
     */
    async generateSchedule(params) {
        try {
            const response = await api.post('/scheduling/generate', {
                semester: params.semester,
                year: params.year,
                preview_only: params.previewOnly || false
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Clear schedule for a semester (admin only)
     * @param {string} semester - Semester
     * @param {number} year - Year
     * @returns {Promise<Object>}
     */
    async clearSchedule(semester, year) {
        try {
            const response = await api.delete('/scheduling/schedule', {
                data: { semester, year }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    // ==================== Classroom Reservations ====================

    /**
     * Request a classroom reservation
     * @param {Object} data - Reservation data
     * @param {string} data.classroom_id - Classroom ID
     * @param {string} data.date - Date (YYYY-MM-DD)
     * @param {string} data.start_time - Start time (HH:MM)
     * @param {string} data.end_time - End time (HH:MM)
     * @param {string} data.title - Reservation title
     * @param {string} data.purpose - Purpose
     * @param {number} [data.attendee_count] - Expected attendees
     * @returns {Promise<{data: ClassroomReservation}>}
     */
    async reserveClassroom(data) {
        try {
            const response = await api.post('/reservations', data);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get user's classroom reservations
     * @returns {Promise<{data: ClassroomReservation[]}>}
     */
    async getMyReservations() {
        try {
            const response = await api.get('/reservations');
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Cancel a classroom reservation
     * @param {string} reservationId - Reservation ID
     * @returns {Promise<Object>}
     */
    async cancelReservation(reservationId) {
        try {
            const response = await api.delete(`/reservations/${reservationId}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get classroom availability for a date
     * @param {string} classroomId - Classroom ID
     * @param {string} date - Date (YYYY-MM-DD)
     * @returns {Promise<Object>}
     */
    async getClassroomAvailability(classroomId, date) {
        try {
            const response = await api.get(`/reservations/availability/${classroomId}?date=${date}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get all classrooms with availability summary
     * @param {string} date - Date to check
     * @returns {Promise<{data: Object[]}>}
     */
    async getClassroomsWithAvailability(date) {
        try {
            const response = await api.get(`/reservations/classrooms?date=${date}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get pending reservations (admin/staff only)
     * @returns {Promise<{data: ClassroomReservation[]}>}
     */
    async getPendingReservations() {
        try {
            const response = await api.get('/reservations/pending');
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Approve a reservation (admin/staff only)
     * @param {string} reservationId - Reservation ID
     * @returns {Promise<Object>}
     */
    async approveReservation(reservationId) {
        try {
            const response = await api.post(`/reservations/${reservationId}/approve`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Reject a reservation (admin/staff only)
     * @param {string} reservationId - Reservation ID
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>}
     */
    async rejectReservation(reservationId, reason) {
        try {
            const response = await api.post(`/reservations/${reservationId}/reject`, { reason });
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
        const message = error.response?.data?.message || error.message || 'Schedule operation failed';
        const code = error.response?.data?.error?.code || 'SCHEDULE_ERROR';
        const err = new Error(message);
        err.code = code;
        err.status = error.response?.status;
        return err;
    }
};

export default scheduleService;
