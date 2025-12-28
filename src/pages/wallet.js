/**
 * Wallet Page
 * 
 * Enhanced wallet with top-up modal and transaction history.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Clock, Wallet as WalletIcon, RefreshCw, Layers } from 'lucide-react';

export default function WalletPage() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useAuth();

    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Top-up modal state
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('100');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardName, setCardName] = useState('');
    const [topUpLoading, setTopUpLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchWalletData();
        }
    }, [user, authLoading]);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const [balanceRes, transactionsRes] = await Promise.all([
                api.get('/wallet/balance'),
                api.get('/wallet/transactions?limit=50')
            ]);
            setWallet(balanceRes.data.data);
            setTransactions(transactionsRes.data.data || []);
        } catch (err) {
            console.error('Error fetching wallet:', err);
            setFeedback({ type: 'error', message: 'Failed to load wallet data' });
        } finally {
            setLoading(false);
        }
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(' ') : value;
    };

    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const handleTopUp = async (e) => {
        e.preventDefault();
        const amount = parseFloat(topUpAmount);

        if (isNaN(amount) || amount < 10 || amount > 10000) {
            setFeedback({ type: 'error', message: 'Amount must be between 10 and 10,000 TRY' });
            return;
        }

        if (cardNumber.replace(/\s/g, '').length < 16) {
            setFeedback({ type: 'error', message: 'Please enter a valid card number' });
            return;
        }

        try {
            setTopUpLoading(true);
            setFeedback({ type: '', message: '' });

            await api.post('/wallet/topup', {
                amount,
                payment_method: 'card'
            });

            setFeedback({ type: 'success', message: `Successfully added ${amount} TRY to your wallet!` });
            setShowTopUpModal(false);

            // Reset form
            setCardNumber('');
            setCardExpiry('');
            setCardCvv('');
            setCardName('');
            setTopUpAmount('100');

            fetchWalletData();
        } catch (err) {
            console.error('Top-up error:', err);
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Top-up failed. Please try again.' });
        } finally {
            setTopUpLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTransactionStyle = (type, amount) => {
        const styles = {
            deposit: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <ArrowDownLeft className="h-5 w-5" />, label: 'Top Up' },
            withdrawal: { color: 'text-red-600', bg: 'bg-red-50', icon: <ArrowUpRight className="h-5 w-5" />, label: 'Withdrawal' },
            meal_payment: { color: 'text-orange-600', bg: 'bg-orange-50', icon: <CreditCard className="h-5 w-5" />, label: 'Meal Payment' },
            event_payment: { color: 'text-purple-600', bg: 'bg-purple-50', icon: <CreditCard className="h-5 w-5" />, label: 'Event Ticket' },
            refund: { color: 'text-blue-600', bg: 'bg-blue-50', icon: <RefreshCw className="h-5 w-5" />, label: 'Refund' }
        };
        return styles[type] || { color: 'text-gray-600', bg: 'bg-gray-50', icon: <Layers className="h-5 w-5" />, label: type?.replace('_', ' ') };
    };

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>My Wallet - Smart Campus</title>
            </Head>

            <FeedbackMessage
                type={feedback.type}
                message={feedback.message}
                onClose={() => setFeedback({ type: '', message: '' })}
            />

            <div className="mb-8 animate-in slide-in-from-bottom-2 duration-500">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Wallet</h1>
                <p className="text-gray-500 mt-1">Manage funds and track your expenses</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Balance Card */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <WalletIcon className="h-64 w-64" />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm mb-2">Available Balance</h3>
                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-5xl font-bold tracking-tight">
                                    {wallet?.balance?.toFixed(2) || '0.00'}
                                </span>
                                <span className="text-2xl text-slate-400 font-medium">{wallet?.currency || 'TRY'}</span>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => setShowTopUpModal(true)}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    <ArrowDownLeft className="h-5 w-5" />
                                    Top Up Balance
                                </button>
                                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg backdrop-blur-sm transition-colors flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Statements
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats or secondary info could go here */}
                </div>

                {/* Right Column: Mini Stats or Info */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-gray-400" />
                            Payment Methods
                        </h3>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-4 mb-4">
                            <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-[8px] text-white font-bold tracking-widest">VISA</div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">•••• 4242</p>
                                <p className="text-xs text-gray-500">Expires 12/25</p>
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Primary</span>
                        </div>
                        <button className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
                            + Add New Card
                        </button>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-900">Recent Transactions</h2>
                    <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
                </div>

                {loading ? (
                    <div className="p-10 flex justify-center">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin"></div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <WalletIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p>No transactions yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {transactions.map((tx) => {
                            const style = getTransactionStyle(tx.type, tx.amount);
                            const isPositive = tx.amount >= 0;
                            return (
                                <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bg} ${style.color}`}>
                                            {style.icon}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{style.label}</p>
                                            <p className="text-xs text-gray-500">{formatDate(tx.transaction_date)}</p>
                                        </div>
                                    </div>
                                    <div className={`text-right font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-gray-900'}`}>
                                        {isPositive ? '+' : ''}{tx.amount?.toFixed(2)} TRY
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Top-Up Modal */}
            {showTopUpModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setShowTopUpModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Top Up Wallet</h2>
                            <button className="text-gray-400 hover:text-gray-600 text-2xl leading-none" onClick={() => setShowTopUpModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleTopUp} className="p-6 space-y-5">
                            {/* Amount Selection */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Select Amount</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['50', '100', '200', '500'].map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            className={`py-2 text-sm font-bold rounded-lg border transition-all ${topUpAmount === amt
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            onClick={() => setTopUpAmount(amt)}
                                        >
                                            {amt}₺
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">₺</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={topUpAmount}
                                        onChange={(e) => setTopUpAmount(e.target.value)}
                                        className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-slate-900 focus:border-slate-900"
                                        placeholder="Or enter custom amount"
                                        min="10"
                                        max="10000"
                                    />
                                </div>
                            </div>

                            {/* Card Visual */}
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                                <div className="flex justify-between items-start mb-6">
                                    <CreditCard className="h-8 w-8 text-white/80" />
                                    <span className="font-bold tracking-widest text-sm opacity-75">VISA</span>
                                </div>
                                <div className="font-mono text-xl tracking-widest mb-6 opacity-90 truncate">
                                    {cardNumber || '•••• •••• •••• ••••'}
                                </div>
                                <div className="flex justify-between text-xs uppercase tracking-wider opacity-75">
                                    <div className="truncate pr-4 max-w-[70%]">{cardName || 'CARDHOLDER NAME'}</div>
                                    <div>{cardExpiry || 'MM/YY'}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Card Number</label>
                                    <input
                                        type="text"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                                        placeholder="0000 0000 0000 0000"
                                        maxLength="19"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Expiry Date</label>
                                        <input
                                            type="text"
                                            value={cardExpiry}
                                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                                            placeholder="MM/YY"
                                            maxLength="5"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">CVV / CVC</label>
                                        <input
                                            type="password"
                                            value={cardCvv}
                                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                                            placeholder="123"
                                            maxLength="3"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cardholder Name</label>
                                    <input
                                        type="text"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                                        placeholder="JOHN DOE"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={topUpLoading}
                                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all transform active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                {topUpLoading ? 'Processing...' : `Pay ${topUpAmount} TRY`}
                            </button>

                            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Secure 256-bit SSL Encrypted Payment
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
