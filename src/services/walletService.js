/**
 * Wallet Service
 * 
 * API calls for wallet management and payments.
 */

import api from '../config/api';

/**
 * @typedef {Object} WalletBalance
 * @property {number} balance - Current wallet balance
 * @property {string} currency - Currency code (e.g., 'TRY')
 * @property {boolean} is_active - Whether wallet is active
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id - Transaction ID
 * @property {number} amount - Transaction amount
 * @property {string} type - Transaction type (deposit, withdrawal, meal_payment, event_payment, refund)
 * @property {string} description - Transaction description
 * @property {string} status - Transaction status
 * @property {string} transaction_date - ISO date string
 */

const walletService = {
    /**
     * Get current wallet balance
     * @returns {Promise<{data: WalletBalance}>}
     */
    async getBalance() {
        try {
            const response = await api.get('/wallet/balance');
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Top up wallet balance
     * @param {number} amount - Amount to top up (10-10000)
     * @param {string} [paymentMethod='card'] - Payment method
     * @returns {Promise<Object>}
     */
    async topUp(amount, paymentMethod = 'card') {
        try {
            const response = await api.post('/wallet/topup', {
                amount,
                payment_method: paymentMethod
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Get transaction history
     * @param {Object} [options] - Query options
     * @param {number} [options.page=1] - Page number
     * @param {number} [options.limit=20] - Items per page
     * @param {string} [options.type] - Filter by type
     * @param {string} [options.startDate] - Filter from date
     * @param {string} [options.endDate] - Filter to date
     * @returns {Promise<{data: Transaction[]}>}
     */
    async getTransactions(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.page) params.append('page', options.page);
            if (options.limit) params.append('limit', options.limit);
            if (options.type) params.append('type', options.type);
            if (options.startDate) params.append('startDate', options.startDate);
            if (options.endDate) params.append('endDate', options.endDate);

            const response = await api.get(`/wallet/transactions?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Create payment intent for frontend flow
     * @param {number} amount - Amount to pay
     * @returns {Promise<Object>}
     */
    async createPaymentIntent(amount) {
        try {
            const response = await api.post('/wallet/payment-intent', { amount });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    /**
     * Check if user has sufficient balance
     * @param {number} amount - Amount to check
     * @returns {Promise<{hasSufficient: boolean, balance: number}>}
     */
    async checkBalance(amount) {
        try {
            const response = await api.get(`/wallet/check-balance/${amount}`);
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
        const message = error.response?.data?.message || error.message || 'Wallet operation failed';
        const code = error.response?.data?.error?.code || 'WALLET_ERROR';
        const err = new Error(message);
        err.code = code;
        err.status = error.response?.status;
        return err;
    }
};

export default walletService;
