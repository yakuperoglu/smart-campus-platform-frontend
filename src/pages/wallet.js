/**
 * Wallet Page
 * 
 * Enhanced wallet with top-up modal and transaction history.
 */

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import api from '../config/api';

export default function WalletPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useContext(AuthContext);

    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

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
            setError(null);
        } catch (err) {
            console.error('Error fetching wallet:', err);
            setError('Failed to load wallet data');
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
            setError('Amount must be between 10 and 10,000 TRY');
            return;
        }

        // Validate card (mock validation)
        if (cardNumber.replace(/\s/g, '').length < 16) {
            setError('Please enter a valid card number');
            return;
        }

        try {
            setTopUpLoading(true);
            setError(null);

            await api.post('/wallet/topup', {
                amount,
                payment_method: 'card'
            });

            setSuccess(`Successfully added ${amount} TRY to your wallet!`);
            setShowTopUpModal(false);
            setCardNumber('');
            setCardExpiry('');
            setCardCvv('');
            setCardName('');
            setTopUpAmount('100');
            fetchWalletData();
        } catch (err) {
            console.error('Top-up error:', err);
            setError(err.response?.data?.message || 'Top-up failed. Please try again.');
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
            deposit: { color: '#10B981', icon: '↓', label: 'Top Up' },
            withdrawal: { color: '#EF4444', icon: '↑', label: 'Withdrawal' },
            meal_payment: { color: '#F59E0B', icon: '🍽️', label: 'Meal' },
            event_payment: { color: '#8B5CF6', icon: '🎫', label: 'Event' },
            refund: { color: '#3B82F6', icon: '↩', label: 'Refund' }
        };
        return styles[type] || { color: '#6B7280', icon: '•', label: type };
    };

    if (authLoading || loading) {
        return (
            <>
                <Head><title>My Wallet - Smart Campus</title></Head>
                <Navbar />
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p>Loading wallet...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>My Wallet - Smart Campus</title>
            </Head>
            <Navbar />

            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.title}>My Wallet</h1>
                </div>

                {/* Alerts */}
                {error && (
                    <div style={styles.errorAlert}>
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError(null)} style={styles.alertClose}>×</button>
                    </div>
                )}
                {success && (
                    <div style={styles.successAlert}>
                        <span>✓ {success}</span>
                        <button onClick={() => setSuccess(null)} style={styles.alertClose}>×</button>
                    </div>
                )}

                {/* Balance Card */}
                <div style={styles.balanceCard}>
                    <div style={styles.balanceLeft}>
                        <span style={styles.balanceLabel}>Available Balance</span>
                        <div style={styles.balanceRow}>
                            <span style={styles.balanceAmount}>
                                {wallet?.balance?.toFixed(2) || '0.00'}
                            </span>
                            <span style={styles.balanceCurrency}>{wallet?.currency || 'TRY'}</span>
                        </div>
                    </div>
                    <button
                        style={styles.topUpBtn}
                        onClick={() => setShowTopUpModal(true)}
                    >
                        <span style={styles.topUpIcon}>+</span>
                        Top Up
                    </button>
                </div>

                {/* Transaction History */}
                <div style={styles.historySection}>
                    <h2 style={styles.sectionTitle}>Transaction History</h2>

                    {transactions.length === 0 ? (
                        <div style={styles.emptyState}>
                            <p>No transactions yet</p>
                            <p style={styles.emptyHint}>Top up your wallet to get started</p>
                        </div>
                    ) : (
                        <div style={styles.transactionList}>
                            {transactions.map((tx) => {
                                const style = getTransactionStyle(tx.type, tx.amount);
                                const isPositive = tx.amount >= 0;
                                return (
                                    <div key={tx.id} style={styles.transactionRow}>
                                        <div style={styles.txLeft}>
                                            <div style={{ ...styles.txIcon, backgroundColor: `${style.color}20`, color: style.color }}>
                                                {style.icon}
                                            </div>
                                            <div style={styles.txInfo}>
                                                <span style={styles.txLabel}>{style.label}</span>
                                                <span style={styles.txDate}>{formatDate(tx.transaction_date)}</span>
                                            </div>
                                        </div>
                                        <div style={{
                                            ...styles.txAmount,
                                            color: isPositive ? '#10B981' : '#EF4444'
                                        }}>
                                            {isPositive ? '+' : ''}{tx.amount?.toFixed(2)} TRY
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Top-Up Modal */}
            {showTopUpModal && (
                <div style={styles.modalOverlay} onClick={() => setShowTopUpModal(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>Top Up Wallet</h2>
                            <button style={styles.modalClose} onClick={() => setShowTopUpModal(false)}>×</button>
                        </div>

                        <form onSubmit={handleTopUp} style={styles.modalForm}>
                            {/* Amount Selection */}
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Amount (TRY)</label>
                                <div style={styles.amountGrid}>
                                    {['50', '100', '200', '500'].map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            style={topUpAmount === amt ? styles.amountBtnActive : styles.amountBtn}
                                            onClick={() => setTopUpAmount(amt)}
                                        >
                                            {amt}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="number"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    style={styles.formInput}
                                    placeholder="Or enter custom amount"
                                    min="10"
                                    max="10000"
                                />
                            </div>

                            {/* Card Form */}
                            <div style={styles.cardPreview}>
                                <div style={styles.cardTop}>
                                    <span style={styles.cardChip}>💳</span>
                                    <span style={styles.cardType}>VISA</span>
                                </div>
                                <div style={styles.cardNumber}>
                                    {cardNumber || '•••• •••• •••• ••••'}
                                </div>
                                <div style={styles.cardBottom}>
                                    <span>{cardName || 'CARDHOLDER NAME'}</span>
                                    <span>{cardExpiry || 'MM/YY'}</span>
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Card Number</label>
                                <input
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    style={styles.formInput}
                                    placeholder="1234 5678 9012 3456"
                                    maxLength="19"
                                    required
                                />
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroupHalf}>
                                    <label style={styles.formLabel}>Expiry</label>
                                    <input
                                        type="text"
                                        value={cardExpiry}
                                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                        style={styles.formInput}
                                        placeholder="MM/YY"
                                        maxLength="5"
                                        required
                                    />
                                </div>
                                <div style={styles.formGroupHalf}>
                                    <label style={styles.formLabel}>CVV</label>
                                    <input
                                        type="password"
                                        value={cardCvv}
                                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                        style={styles.formInput}
                                        placeholder="•••"
                                        maxLength="3"
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Cardholder Name</label>
                                <input
                                    type="text"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                    style={styles.formInput}
                                    placeholder="JOHN DOE"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                style={styles.submitBtn}
                                disabled={topUpLoading}
                            >
                                {topUpLoading ? (
                                    <span>Processing...</span>
                                ) : (
                                    <span>Pay {topUpAmount} TRY</span>
                                )}
                            </button>

                            <p style={styles.secureNote}>
                                🔒 Your payment is secure and encrypted
                            </p>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </>
    );
}

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        color: '#6B7280'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid #E5E7EB',
        borderTop: '3px solid #3B82F6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
    },
    header: {
        marginBottom: '24px'
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#111827',
        margin: 0
    },
    errorAlert: {
        backgroundColor: '#FEF2F2',
        border: '1px solid #FECACA',
        color: '#DC2626',
        padding: '12px 16px',
        borderRadius: '10px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    successAlert: {
        backgroundColor: '#F0FDF4',
        border: '1px solid #BBF7D0',
        color: '#16A34A',
        padding: '12px 16px',
        borderRadius: '10px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    alertClose: {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        opacity: 0.7
    },
    balanceCard: {
        background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #60A5FA 100%)',
        borderRadius: '20px',
        padding: '32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)'
    },
    balanceLeft: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    balanceLabel: {
        fontSize: '14px',
        opacity: 0.9,
        fontWeight: '500'
    },
    balanceRow: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px'
    },
    balanceAmount: {
        fontSize: '48px',
        fontWeight: '700',
        letterSpacing: '-1px'
    },
    balanceCurrency: {
        fontSize: '20px',
        opacity: 0.9
    },
    topUpBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '14px 28px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '12px',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    topUpIcon: {
        fontSize: '20px',
        fontWeight: '700'
    },
    historySection: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '20px'
    },
    emptyState: {
        textAlign: 'center',
        padding: '48px 20px',
        color: '#6B7280'
    },
    emptyHint: {
        fontSize: '14px',
        marginTop: '8px',
        opacity: 0.7
    },
    transactionList: {
        display: 'flex',
        flexDirection: 'column'
    },
    transactionRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 0',
        borderBottom: '1px solid #F3F4F6'
    },
    txLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    txIcon: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: '600'
    },
    txInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    txLabel: {
        fontSize: '15px',
        fontWeight: '500',
        color: '#111827'
    },
    txDate: {
        fontSize: '13px',
        color: '#9CA3AF'
    },
    txAmount: {
        fontSize: '16px',
        fontWeight: '600'
    },
    // Modal styles
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '420px',
        maxHeight: '90vh',
        overflow: 'auto'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '1px solid #F3F4F6'
    },
    modalTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#111827',
        margin: 0
    },
    modalClose: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        color: '#9CA3AF',
        cursor: 'pointer'
    },
    modalForm: {
        padding: '24px'
    },
    formGroup: {
        marginBottom: '20px'
    },
    formGroupHalf: {
        flex: 1
    },
    formRow: {
        display: 'flex',
        gap: '16px',
        marginBottom: '20px'
    },
    formLabel: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px'
    },
    formInput: {
        width: '100%',
        padding: '12px 16px',
        border: '1px solid #E5E7EB',
        borderRadius: '10px',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box'
    },
    amountGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '12px'
    },
    amountBtn: {
        padding: '10px',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '14px'
    },
    amountBtnActive: {
        padding: '10px',
        border: '2px solid #3B82F6',
        borderRadius: '8px',
        backgroundColor: '#EFF6FF',
        color: '#3B82F6',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px'
    },
    cardPreview: {
        background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        marginBottom: '24px'
    },
    cardTop: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '24px'
    },
    cardChip: {
        fontSize: '24px'
    },
    cardType: {
        fontSize: '18px',
        fontWeight: '700',
        letterSpacing: '2px'
    },
    cardNumber: {
        fontSize: '20px',
        letterSpacing: '3px',
        marginBottom: '20px',
        fontFamily: 'monospace'
    },
    cardBottom: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    },
    submitBtn: {
        width: '100%',
        padding: '16px',
        backgroundColor: '#3B82F6',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    secureNote: {
        textAlign: 'center',
        fontSize: '13px',
        color: '#9CA3AF',
        marginTop: '16px'
    }
};
