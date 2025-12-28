/**
 * Events List Page
 * 
 * Browse campus events with category filters and registration status.
 * Updated: Event display and registration improvements
 */

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';

const CATEGORIES = [
    { value: '', label: 'All Events', icon: '🎉', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
    { value: 'conference', label: 'Conference', icon: '🎤', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
    { value: 'workshop', label: 'Workshop', icon: '🛠️', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
    { value: 'seminar', label: 'Seminar', icon: '📚', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
    { value: 'sports', label: 'Sports', icon: '⚽', color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' },
    { value: 'social', label: 'Social', icon: '🎊', color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' },
    { value: 'cultural', label: 'Cultural', icon: '🎭', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }
];

export default function EventsListPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useContext(AuthContext);

    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchEvents();
        if (user) {
            fetchRegistrations();
        }
    }, [user, authLoading, category]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            let url = '/events?limit=50';
            if (category) {
                url += `&category=${category}`;
            }
            const response = await api.get(url);
            setEvents(response.data.data || []);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistrations = async () => {
        try {
            const response = await api.get('/events/registrations');
            setRegistrations(response.data.data || []);
        } catch (err) {
            console.error('Error fetching registrations:', err);
        }
    };

    const isRegistered = (eventId) => {
        return registrations.some(r => r.event_id === eventId && !['cancelled'].includes(r.status));
    };

    const getRegistrationStatus = (eventId) => {
        const reg = registrations.find(r => r.event_id === eventId);
        return reg?.status;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryData = (cat) => {
        const found = CATEGORIES.find(c => c.value === cat);
        return found || { icon: '🎉', label: cat, color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' };
    };

    const getEventIcon = (event) => {
        const title = (event.title || '').toLowerCase();
        const description = (event.description || '').toLowerCase();
        const text = `${title} ${description}`;
        
        // Sports - Tennis
        if (text.includes('tennis')) return '🎾';
        // Sports - Basketball
        if (text.includes('basketball')) return '🏀';
        // Sports - Volleyball
        if (text.includes('volleyball')) return '🏐';
        // Sports - Swimming
        if (text.includes('swim')) return '🏊';
        // Sports - Running/Marathon
        if (text.includes('run') || text.includes('marathon')) return '🏃';
        // Sports - Cycling
        if (text.includes('cycl') || text.includes('bike')) return '🚴';
        // Sports - Golf
        if (text.includes('golf')) return '⛳';
        // Sports - Boxing
        if (text.includes('box')) return '🥊';
        // Sports - Badminton
        if (text.includes('badminton')) return '🏸';
        // Sports - Table Tennis
        if (text.includes('table tennis') || text.includes('ping pong')) return '🏓';
        // Sports - Baseball
        if (text.includes('baseball')) return '⚾';
        // Sports - American Football
        if (text.includes('american football') || text.includes('nfl')) return '🏈';
        // Sports - Rugby
        if (text.includes('rugby')) return '🏉';
        // Sports - Cricket
        if (text.includes('cricket')) return '🏏';
        // Sports - Hockey
        if (text.includes('hockey')) return '🏒';
        // Sports - Ice Hockey
        if (text.includes('ice hockey')) return '🥅';
        // Sports - Wrestling
        if (text.includes('wrestl')) return '🤼';
        // Sports - Gymnastics
        if (text.includes('gymnast')) return '🤸';
        // Sports - Weightlifting
        if (text.includes('weight') || text.includes('lift')) return '🏋️';
        // Sports - Football/Soccer
        if (text.includes('football') || text.includes('soccer')) return '⚽';
        // Wellness - Yoga
        if (text.includes('yoga') || text.includes('wellness')) return '🧘';
        // Sports - Default (if category is sports but no match)
        if (event.category === 'sports') return '⚽';
        
        // Return null to use category default icon
        return null;
    };

    const filteredEvents = events.filter(event => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            event.title?.toLowerCase().includes(query) ||
            event.description?.toLowerCase().includes(query) ||
            event.location?.toLowerCase().includes(query)
        );
    });

    const upcomingEvents = filteredEvents.filter(e => new Date(e.date) >= new Date());
    const pastEvents = filteredEvents.filter(e => new Date(e.date) < new Date());

    if (loading && events.length === 0) {
        return (
            <>
                <Head><title>Events - Smart Campus</title></Head>
                <Navbar />
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p>Loading events...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Campus Events - Smart Campus</title>
            </Head>
            <Navbar />

            <div style={styles.container}>
                {/* Hero Section */}
                <div style={styles.hero}>
                    <h1 style={styles.heroTitle}>🎉 Campus Events</h1>
                    <p style={styles.heroSubtitle}>Discover workshops, conferences, and social gatherings</p>

                    {/* Search */}
                    <div style={styles.searchBox}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                </div>

                {/* Category Filters */}
                <div style={styles.categoryScroll}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setCategory(cat.value)}
                            style={category === cat.value ? styles.categoryBtnActive : styles.categoryBtn}
                        >
                            <span style={styles.categoryIcon}>{cat.icon}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* My Registrations Link */}
                {user && registrations.length > 0 && (
                    <Link href="/events/my-tickets" style={styles.myTicketsLink}>
                        🎫 My Tickets ({registrations.filter(r => r.status !== 'cancelled').length})
                    </Link>
                )}

                {/* Error */}
                {error && (
                    <div style={styles.errorAlert}>
                        {error}
                        <button onClick={() => setError(null)} style={styles.alertClose}>×</button>
                    </div>
                )}

                {/* Upcoming Events */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>
                        Upcoming Events
                        <span style={styles.sectionCount}>{upcomingEvents.length}</span>
                    </h2>

                    {upcomingEvents.length === 0 ? (
                        <div style={styles.emptyState}>
                            <span style={styles.emptyIcon}>📅</span>
                            <p>No upcoming events found</p>
                        </div>
                    ) : (
                        <div style={styles.eventGrid}>
                            {upcomingEvents.map(event => {
                                const catData = getCategoryData(event.category);
                                const eventIcon = getEventIcon(event);
                                const displayIcon = eventIcon || catData.icon;
                                const registered = isRegistered(event.id);
                                const regStatus = getRegistrationStatus(event.id);
                                const spotsLeft = event.capacity - (event.registered_count || 0);
                                const isFull = spotsLeft <= 0;

                                return (
                                    <Link
                                        href={`/events/${event.id}`}
                                        key={event.id}
                                        style={styles.eventCard}
                                    >
                                        {/* Image/Header */}
                                        <div style={{
                                            ...styles.eventImage,
                                            backgroundImage: event.image_url ? `url(${event.image_url})` : catData.gradient,
                                            backgroundColor: event.image_url ? 'transparent' : catData.color
                                        }}>
                                            {!event.image_url && (
                                                <span style={styles.eventImageIcon}>{displayIcon}</span>
                                            )}

                                            {/* Badges */}
                                            <div style={styles.badgeRow}>
                                                {event.is_paid && (
                                                    <span style={styles.priceBadge}>{event.price} TRY</span>
                                                )}
                                                {registered && (
                                                    <span style={{
                                                        ...styles.registeredBadge,
                                                        backgroundColor: regStatus === 'waitlisted' ? '#F59E0B' : '#10B981'
                                                    }}>
                                                        {regStatus === 'waitlisted' ? '⏳ Waitlisted' : '✓ Registered'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div style={styles.eventContent}>
                                            <div style={styles.eventMeta}>
                                                <span style={styles.eventCategory}>{catData.icon} {catData.label}</span>
                                                <span style={styles.eventDate}>{formatDate(event.date)}</span>
                                            </div>

                                            <h3 style={styles.eventTitle}>{event.title}</h3>

                                            <p style={styles.eventDesc}>
                                                {event.description?.substring(0, 100)}
                                                {event.description?.length > 100 ? '...' : ''}
                                            </p>

                                            <div style={styles.eventFooter}>
                                                <span style={styles.eventLocation}>📍 {event.location || 'TBA'}</span>
                                                <span style={{
                                                    ...styles.spotsLeft,
                                                    color: isFull ? '#EF4444' : '#10B981'
                                                }}>
                                                    {isFull ? 'Waitlist' : `${spotsLeft} spots`}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Past Events */}
                {pastEvents.length > 0 && (
                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>
                            Past Events
                            <span style={styles.sectionCount}>{pastEvents.length}</span>
                        </h2>
                        <div style={styles.eventGrid}>
                            {pastEvents.slice(0, 6).map(event => {
                                const catData = getCategoryData(event.category);
                                const eventIcon = getEventIcon(event);
                                const displayIcon = eventIcon || catData.icon;
                                return (
                                    <div key={event.id} style={{ ...styles.eventCard, opacity: 0.7 }}>
                                        <div style={{ 
                                            ...styles.eventImage, 
                                            backgroundImage: event.image_url ? `url(${event.image_url})` : catData.gradient,
                                            backgroundColor: event.image_url ? 'transparent' : catData.color,
                                            opacity: 0.6
                                        }}>
                                            {!event.image_url && (
                                                <span style={styles.eventImageIcon}>{displayIcon}</span>
                                            )}
                                            <span style={styles.pastBadge}>Ended</span>
                                        </div>
                                        <div style={styles.eventContent}>
                                            <span style={styles.eventCategory}>{catData.label}</span>
                                            <h3 style={styles.eventTitle}>{event.title}</h3>
                                            <span style={styles.eventDate}>{formatDate(event.date)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>

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
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px 40px',
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
    hero: {
        textAlign: 'center',
        padding: '40px 0 32px'
    },
    heroTitle: {
        fontSize: '36px',
        fontWeight: '800',
        color: '#111827',
        marginBottom: '8px'
    },
    heroSubtitle: {
        fontSize: '18px',
        color: '#6B7280',
        marginBottom: '24px'
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        maxWidth: '400px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    },
    searchIcon: {
        fontSize: '18px',
        marginRight: '12px',
        color: '#9CA3AF'
    },
    searchInput: {
        flex: 1,
        border: 'none',
        outline: 'none',
        fontSize: '16px',
        backgroundColor: 'transparent'
    },
    categoryScroll: {
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '8px 0 24px',
        marginBottom: '8px'
    },
    categoryBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 16px',
        backgroundColor: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
    },
    categoryBtnActive: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 16px',
        backgroundColor: '#8B5CF6',
        border: '1px solid #8B5CF6',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '500',
        color: 'white',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
    },
    categoryIcon: {
        fontSize: '16px'
    },
    myTicketsLink: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#8B5CF6',
        color: 'white',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '14px',
        marginBottom: '24px'
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
    section: {
        marginBottom: '40px'
    },
    sectionTitle: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    sectionCount: {
        fontSize: '14px',
        fontWeight: '500',
        padding: '4px 10px',
        backgroundColor: '#F3F4F6',
        borderRadius: '12px',
        color: '#6B7280'
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
    eventGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px'
    },
    eventCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        textDecoration: 'none',
        display: 'block',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    eventImage: {
        height: '160px',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    },
    eventImageIcon: {
        fontSize: '48px'
    },
    badgeRow: {
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        display: 'flex',
        justifyContent: 'space-between'
    },
    priceBadge: {
        padding: '6px 12px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600'
    },
    registeredBadge: {
        padding: '6px 12px',
        color: 'white',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600'
    },
    pastBadge: {
        position: 'absolute',
        top: '12px',
        right: '12px',
        padding: '6px 12px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        borderRadius: '6px',
        fontSize: '12px'
    },
    eventContent: {
        padding: '20px'
    },
    eventMeta: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
    },
    eventCategory: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#8B5CF6',
        textTransform: 'uppercase'
    },
    eventDate: {
        fontSize: '12px',
        color: '#6B7280'
    },
    eventTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '8px',
        lineHeight: '1.3'
    },
    eventDesc: {
        fontSize: '14px',
        color: '#6B7280',
        lineHeight: '1.5',
        marginBottom: '16px'
    },
    eventFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    eventLocation: {
        fontSize: '13px',
        color: '#6B7280'
    },
    spotsLeft: {
        fontSize: '13px',
        fontWeight: '600'
    }
};
