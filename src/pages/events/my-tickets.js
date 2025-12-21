/**
 * My Event Tickets Page
 * 
 * View all event registrations with QR codes.
 */

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../../components/Navbar';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';

export default function MyTicketsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useContext(AuthContext);

    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('upcoming');
    const [expandedTicket, setExpandedTicket] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchRegistrations();
        }
    }, [user, authLoading]);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/events/registrations');
            setRegistrations(response.data.data || []);
        } catch (err) {
            console.error('Error fetching registrations:', err);
            setError('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (registrationId) => {
        if (!confirm('Cancel this registration?')) return;

        try {
            await api.delete(`/events/registrations/${registrationId}`);
            fetchRegistrations();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cancel');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusData = (status) => {
        const statuses = {
            registered: { label: 'Confirmed', color: '#10B981', bg: '#D1FAE5' },
            waitlisted: { label: 'Waitlisted', color: '#F59E0B', bg: '#FEF3C7' },
            cancelled: { label: 'Cancelled', color: '#6B7280', bg: '#F3F4F6' },
            attended: { label: 'Attended', color: '#3B82F6', bg: '#DBEAFE' }
        };
        return statuses[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' };
    };

    const getCategoryIcon = (cat) => {
        const icons = {
            conference: '🎤', workshop: '🛠️', seminar: '📚',
            sports: '⚽', social: '🎊', cultural: '🎭'
        };
        return icons[cat] || '🎉';
    };

    const filteredRegistrations = registrations.filter(reg => {
        if (filter === 'upcoming') {
            return ['registered', 'waitlisted'].includes(reg.status) &&
                new Date(reg.event?.date) >= new Date();
        }
        if (filter === 'past') {
            return reg.status === 'attended' || new Date(reg.event?.date) < new Date();
        }
        if (filter === 'cancelled') {
            return reg.status === 'cancelled';
        }
        return true;
    });

    if (authLoading || loading) {
        return (
            <>
                <Head><title>My Tickets - Smart Campus</title></Head>
                <Navbar />
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p>Loading tickets...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>My Event Tickets - Smart Campus</title>
            </Head>
            <Navbar />

            <div style={styles.container}>
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>🎫 My Tickets</h1>
                        <p style={styles.subtitle}>
                            {filteredRegistrations.length} {filter === 'upcoming' ? 'upcoming' : ''} events
                        </p>
                    </div>
                    <Link href="/events" style={styles.browseBtn}>
                        Browse Events →
                    </Link>
                </div>

                {error && (
                    <div style={styles.errorAlert}>
                        {error}
                        <button onClick={() => setError(null)} style={styles.alertClose}>×</button>
                    </div>
                )}

                {/* Filter Tabs */}
                <div style={styles.tabs}>
                    {['upcoming', 'past', 'cancelled', 'all'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            style={filter === tab ? styles.tabActive : styles.tab}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tickets List */}
                {filteredRegistrations.length === 0 ? (
                    <div style={styles.emptyState}>
                        <span style={styles.emptyIcon}>🎫</span>
                        <p>No tickets found</p>
                        <Link href="/events" style={styles.emptyBtn}>
                            Browse Events
                        </Link>
                    </div>
                ) : (
                    <div style={styles.ticketList}>
                        {filteredRegistrations.map(reg => {
                            const statusData = getStatusData(reg.status);
                            const isActive = ['registered', 'waitlisted'].includes(reg.status);
                            const event = reg.event || {};

                            return (
                                <div key={reg.id} style={styles.ticketCard}>
                                    <div style={styles.ticketLeft}>
                                        <div style={styles.eventIcon}>
                                            {getCategoryIcon(event.category)}
                                        </div>

                                        <div style={styles.ticketInfo}>
                                            <Link href={`/events/${event.id}`} style={styles.eventTitle}>
                                                {event.title || 'Event'}
                                            </Link>

                                            <div style={styles.eventMeta}>
                                                <span>📅 {formatDate(event.date)}</span>
                                                <span>📍 {event.location || 'TBA'}</span>
                                            </div>

                                            <span style={{
                                                ...styles.statusBadge,
                                                backgroundColor: statusData.bg,
                                                color: statusData.color
                                            }}>
                                                {statusData.label}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={styles.ticketRight}>
                                        {isActive && reg.qr_code && (
                                            <div
                                                style={styles.qrWrapper}
                                                onClick={() => setExpandedTicket(expandedTicket === reg.id ? null : reg.id)}
                                            >
                                                <QRCodeSVG
                                                    value={reg.qr_code}
                                                    size={80}
                                                    level="H"
                                                />
                                                <span style={styles.qrHint}>Tap to enlarge</span>
                                            </div>
                                        )}

                                        {isActive && (
                                            <button
                                                onClick={() => handleCancel(reg.id)}
                                                style={styles.cancelBtn}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Expanded QR Modal */}
            {expandedTicket && (
                <div style={styles.modal} onClick={() => setExpandedTicket(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button style={styles.modalClose} onClick={() => setExpandedTicket(null)}>×</button>

                        {(() => {
                            const reg = registrations.find(r => r.id === expandedTicket);
                            if (!reg) return null;
                            return (
                                <>
                                    <h3 style={styles.modalTitle}>{reg.event?.title}</h3>
                                    <p style={styles.modalDate}>{formatDate(reg.event?.date)}</p>

                                    <div style={styles.modalQr}>
                                        <QRCodeSVG
                                            value={reg.qr_code}
                                            size={240}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    </div>

                                    <p style={styles.modalHint}>Show this at the entrance</p>
                                </>
                            );
                        })()}
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
        borderTop: '3px solid #8B5CF6',
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
        gap: '16px'
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
        padding: '10px 20px',
        backgroundColor: '#8B5CF6',
        color: 'white',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: '500'
    },
    errorAlert: {
        backgroundColor: '#FEF2F2',
        color: '#DC2626',
        padding: '12px 16px',
        borderRadius: '10px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between'
    },
    alertClose: {
        background: 'none',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer'
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
        backgroundColor: '#8B5CF6',
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
        backgroundColor: '#8B5CF6',
        color: 'white',
        borderRadius: '10px',
        textDecoration: 'none'
    },
    ticketList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    ticketCard: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        gap: '20px',
        flexWrap: 'wrap'
    },
    ticketLeft: {
        display: 'flex',
        gap: '16px',
        flex: 1,
        minWidth: '280px'
    },
    eventIcon: {
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        backgroundColor: '#F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        flexShrink: 0
    },
    ticketInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    eventTitle: {
        fontSize: '17px',
        fontWeight: '600',
        color: '#111827',
        textDecoration: 'none'
    },
    eventMeta: {
        display: 'flex',
        gap: '16px',
        fontSize: '13px',
        color: '#6B7280',
        flexWrap: 'wrap'
    },
    statusBadge: {
        alignSelf: 'flex-start',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600'
    },
    ticketRight: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
    },
    qrWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '12px',
        backgroundColor: '#F9FAFB',
        borderRadius: '12px',
        cursor: 'pointer'
    },
    qrHint: {
        fontSize: '11px',
        color: '#9CA3AF'
    },
    cancelBtn: {
        padding: '8px 16px',
        backgroundColor: '#FEF2F2',
        color: '#DC2626',
        border: 'none',
        borderRadius: '8px',
        fontSize: '13px',
        cursor: 'pointer'
    },
    modal: {
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
    modalContent: {
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '24px',
        textAlign: 'center',
        maxWidth: '340px',
        width: '100%',
        position: 'relative'
    },
    modalClose: {
        position: 'absolute',
        top: '12px',
        right: '16px',
        background: 'none',
        border: 'none',
        fontSize: '28px',
        color: '#9CA3AF',
        cursor: 'pointer'
    },
    modalTitle: {
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '4px'
    },
    modalDate: {
        fontSize: '14px',
        color: '#6B7280',
        marginBottom: '20px'
    },
    modalQr: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '16px'
    },
    modalHint: {
        fontSize: '14px',
        color: '#6B7280'
    }
};

// Force SSR to prevent static generation errors
export async function getServerSideProps() {
    return { props: {} };
}
