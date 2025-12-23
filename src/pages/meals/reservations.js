/**
 * My Meal Reservations Page
 * 
 * View upcoming meal reservations with QR codes for pickup.
 */

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../../components/Navbar';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';

export default function MealReservationsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useContext(AuthContext);

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [filter, setFilter] = useState('upcoming');
    const [expandedQR, setExpandedQR] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchReservations();
        }
    }, [user, authLoading, filter]);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            let url = '/meals/reservations?limit=50';
            if (filter === 'upcoming') {
                url += '&status=reserved';
            } else if (filter !== 'all') {
                url += `&status=${filter}`;
            }
            const response = await api.get(url);
            setReservations(response.data.data || []);
        } catch (err) {
            console.error('Error fetching reservations:', err);
            setError('Failed to load reservations');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (reservationId) => {
        if (!confirm('Are you sure you want to cancel this reservation? Any payment will be refunded.')) {
            return;
        }

        try {
            await api.delete(`/meals/reservations/${reservationId}`);
            setSuccess('Reservation cancelled successfully');
            fetchReservations();
        } catch (err) {
            console.error('Cancel error:', err);
            setError(err.response?.data?.message || 'Failed to cancel reservation');
        }
    };

    const getMealTypeData = (type) => {
        const data = {
            breakfast: { icon: '🌅', label: 'Breakfast', color: '#F59E0B' },
            lunch: { icon: '☀️', label: 'Lunch', color: '#10B981' },
            dinner: { icon: '🌙', label: 'Dinner', color: '#6366F1' }
        };
        return data[type] || { icon: '🍽️', label: type, color: '#6B7280' };
    };

    const getStatusBadge = (status) => {
        const badges = {
            reserved: { label: 'Active', color: '#10B981', bg: '#D1FAE5' },
            confirmed: { label: 'Confirmed', color: '#3B82F6', bg: '#DBEAFE' },
            consumed: { label: 'Used', color: '#6B7280', bg: '#F3F4F6' },
            cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEE2E2' },
            no_show: { label: 'No Show', color: '#DC2626', bg: '#FEE2E2' }
        };
        return badges[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' };
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateOnly = dateStr?.split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        if (dateOnly === todayStr) return 'Today';
        if (dateOnly === tomorrowStr) return 'Tomorrow';

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const isUpcoming = (reservation) => {
        if (reservation.status !== 'reserved') return false;
        const menuDate = new Date(reservation.menu?.date || reservation.reservation_time);
        return menuDate >= new Date(new Date().setHours(0, 0, 0, 0));
    };

    const upcomingReservations = reservations.filter(r => r.status === 'reserved');
    const pastReservations = reservations.filter(r => r.status !== 'reserved');

    if (authLoading || loading) {
        return (
            <>
                <Head><title>My Reservations - Smart Campus</title></Head>
                <Navbar />
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p>Loading reservations...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>My Reservations - Smart Campus</title>
            </Head>
            <Navbar />

            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>My Meal Reservations</h1>
                        <p style={styles.subtitle}>{upcomingReservations.length} upcoming meals</p>
                    </div>
                    <Link href="/meals/menu" style={styles.browseBtn}>
                        📋 Browse Menu
                    </Link>
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

                {/* Filter Tabs */}
                <div style={styles.tabs}>
                    {['upcoming', 'consumed', 'cancelled', 'all'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            style={filter === tab ? styles.tabActive : styles.tab}
                        >
                            {tab === 'upcoming' && '🎫 '}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Reservations List */}
                {reservations.length === 0 ? (
                    <div style={styles.emptyState}>
                        <span style={styles.emptyIcon}>🍽️</span>
                        <p>No reservations found</p>
                        <Link href="/meals/menu" style={styles.emptyBtn}>
                            Browse Menu & Reserve
                        </Link>
                    </div>
                ) : (
                    <div style={styles.reservationList}>
                        {reservations.map(reservation => {
                            const mealData = getMealTypeData(reservation.menu?.type);
                            const statusBadge = getStatusBadge(reservation.status);
                            const isActive = reservation.status === 'reserved';

                            return (
                                <div key={reservation.id} style={styles.reservationCard}>
                                    <div style={styles.cardLeft}>
                                        {/* Date Badge */}
                                        <div style={{ ...styles.dateBadge, backgroundColor: mealData.color }}>
                                            <span style={styles.dateBadgeDay}>
                                                {formatDate(reservation.menu?.date || reservation.reservation_time)}
                                            </span>
                                            <span style={styles.dateBadgeType}>{mealData.icon} {mealData.label}</span>
                                        </div>

                                        {/* Details */}
                                        <div style={styles.details}>
                                            <div style={styles.detailRow}>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    backgroundColor: statusBadge.bg,
                                                    color: statusBadge.color
                                                }}>
                                                    {statusBadge.label}
                                                </span>
                                            </div>
                                            <div style={styles.cafeteriaName}>
                                                📍 {reservation.cafeteria?.name || reservation.menu?.cafeteria?.name || 'Campus Cafeteria'}
                                            </div>

                                            {/* Menu Items Preview */}
                                            {reservation.menu?.items_json && (
                                                <div style={styles.itemsPreview}>
                                                    {(reservation.menu.items_json || []).slice(0, 3).map((item, idx) => (
                                                        <span key={idx} style={styles.itemTag}>
                                                            {item.name || item}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Cancel Button */}
                                            {isActive && (
                                                <button
                                                    onClick={() => handleCancel(reservation.id)}
                                                    style={styles.cancelBtn}
                                                >
                                                    Cancel Reservation
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* QR Code Section */}
                                    {isActive && reservation.qr_code && (
                                        <div
                                            style={styles.qrSection}
                                            onClick={() => setExpandedQR(expandedQR === reservation.id ? null : reservation.id)}
                                        >
                                            <div style={styles.qrContainer}>
                                                <QRCodeSVG
                                                    value={reservation.qr_code}
                                                    size={expandedQR === reservation.id ? 180 : 100}
                                                    level="H"
                                                    includeMargin={true}
                                                />
                                            </div>
                                            <span style={styles.qrLabel}>
                                                {expandedQR === reservation.id ? 'Tap to shrink' : 'Tap to enlarge'}
                                            </span>
                                            <span style={styles.qrHint}>Show at cafeteria</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Expanded QR Modal */}
            {expandedQR && (
                <div style={styles.qrModal} onClick={() => setExpandedQR(null)}>
                    <div style={styles.qrModalContent} onClick={e => e.stopPropagation()}>
                        <div style={styles.qrModalHeader}>
                            <span>Your Meal QR Code</span>
                            <button style={styles.qrModalClose} onClick={() => setExpandedQR(null)}>×</button>
                        </div>
                        <div style={styles.qrModalBody}>
                            {reservations.find(r => r.id === expandedQR)?.qr_code && (
                                <QRCodeSVG
                                    value={reservations.find(r => r.id === expandedQR).qr_code}
                                    size={280}
                                    level="H"
                                    includeMargin={true}
                                />
                            )}
                        </div>
                        <p style={styles.qrModalHint}>Show this code at the cafeteria counter</p>
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
        maxWidth: '900px',
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
        borderTop: '3px solid #F59E0B',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#111827',
        margin: 0
    },
    subtitle: {
        fontSize: '16px',
        color: '#6B7280',
        marginTop: '4px'
    },
    browseBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: '#F59E0B',
        color: 'white',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: '500',
        fontSize: '14px'
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
    tabs: {
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap'
    },
    tab: {
        padding: '10px 18px',
        backgroundColor: '#F3F4F6',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#6B7280',
        cursor: 'pointer'
    },
    tabActive: {
        padding: '10px 18px',
        backgroundColor: '#F59E0B',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        color: 'white',
        cursor: 'pointer'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#6B7280'
    },
    emptyIcon: {
        fontSize: '48px',
        display: 'block',
        marginBottom: '16px'
    },
    emptyBtn: {
        display: 'inline-block',
        marginTop: '16px',
        padding: '12px 24px',
        backgroundColor: '#F59E0B',
        color: 'white',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: '600'
    },
    reservationList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    reservationCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        gap: '20px',
        flexWrap: 'wrap'
    },
    cardLeft: {
        display: 'flex',
        gap: '16px',
        flex: 1,
        minWidth: '280px'
    },
    dateBadge: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        borderRadius: '12px',
        color: 'white',
        minWidth: '80px',
        textAlign: 'center'
    },
    dateBadgeDay: {
        fontSize: '15px',
        fontWeight: '700',
        marginBottom: '4px'
    },
    dateBadgeType: {
        fontSize: '12px',
        opacity: 0.9
    },
    details: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    detailRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    statusBadge: {
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600'
    },
    cafeteriaName: {
        fontSize: '14px',
        color: '#6B7280'
    },
    itemsPreview: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginTop: '4px'
    },
    itemTag: {
        padding: '4px 8px',
        backgroundColor: '#F3F4F6',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#374151'
    },
    cancelBtn: {
        marginTop: 'auto',
        padding: '8px 16px',
        backgroundColor: '#FEF2F2',
        color: '#DC2626',
        border: 'none',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        alignSelf: 'flex-start'
    },
    qrSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px',
        backgroundColor: '#F9FAFB',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    qrContainer: {
        padding: '8px',
        backgroundColor: 'white',
        borderRadius: '8px'
    },
    qrLabel: {
        fontSize: '11px',
        color: '#9CA3AF'
    },
    qrHint: {
        fontSize: '13px',
        fontWeight: '500',
        color: '#374151'
    },
    // QR Modal
    qrModal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
    },
    qrModalContent: {
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '24px',
        textAlign: 'center',
        maxWidth: '360px',
        width: '100%'
    },
    qrModalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        fontSize: '18px',
        fontWeight: '600'
    },
    qrModalClose: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#9CA3AF'
    },
    qrModalBody: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '16px'
    },
    qrModalHint: {
        fontSize: '14px',
        color: '#6B7280'
    }
};

// Force SSR to prevent static generation errors
export async function getServerSideProps() {
    return { props: {} };
}
