/**
 * Meal Menu Page
 * 
 * Browse daily menus with date picker, nutrition info, and reservation logic.
 */

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';

export default function MealMenuPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useContext(AuthContext);

    const [menus, setMenus] = useState([]);
    const [cafeterias, setCafeterias] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [studentInfo, setStudentInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Filters
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCafeteria, setSelectedCafeteria] = useState('');
    const [reservingMenuId, setReservingMenuId] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchInitialData();
        }
    }, [user, authLoading]);

    useEffect(() => {
        if (user) {
            fetchMenus();
        }
    }, [selectedDate, selectedCafeteria]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [cafRes, balanceRes] = await Promise.all([
                api.get('/meals/cafeterias'),
                api.get('/wallet/balance').catch(() => ({ data: { data: { balance: 0 } } }))
            ]);

            setCafeterias(cafRes.data.data || []);
            setWalletBalance(balanceRes.data.data?.balance || 0);

            // Check if student has scholarship
            if (user.role === 'student' && user.studentProfile) {
                setStudentInfo({
                    hasScholarship: user.studentProfile.has_scholarship,
                    dailyQuota: user.studentProfile.meal_quota_daily || 2
                });
            }

            await fetchMenus();
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load cafeteria data');
        } finally {
            setLoading(false);
        }
    };

    const fetchMenus = async () => {
        try {
            let url = `/meals/menus?date=${selectedDate}`;
            if (selectedCafeteria) {
                url += `&cafeteria_id=${selectedCafeteria}`;
            }
            const response = await api.get(url);
            setMenus(response.data.data || []);
        } catch (err) {
            console.error('Error fetching menus:', err);
        }
    };

    const handleReserve = async (menu) => {
        setError(null);

        // Pre-flight checks
        if (!studentInfo?.hasScholarship && menu.price > 0) {
            // Check wallet balance for paid users
            if (walletBalance < menu.price) {
                setError(`Insufficient balance. You need ${menu.price} TRY but have ${walletBalance.toFixed(2)} TRY. Please top up your wallet.`);
                return;
            }
        }

        try {
            setReservingMenuId(menu.id);
            await api.post('/meals/reservations', { menu_id: menu.id });

            setSuccess('Meal reserved successfully! Check your reservations for the QR code.');

            // Refresh balance if paid
            if (!studentInfo?.hasScholarship && menu.price > 0) {
                const balanceRes = await api.get('/wallet/balance');
                setWalletBalance(balanceRes.data.data?.balance || 0);
            }

            fetchMenus();
        } catch (err) {
            console.error('Reservation error:', err);
            const errorMsg = err.response?.data?.message || 'Failed to reserve meal';

            // Handle specific error cases
            if (errorMsg.includes('quota')) {
                setError('You have reached your daily meal quota. Scholarship students can reserve up to 2 meals per day.');
            } else if (errorMsg.includes('balance')) {
                setError('Insufficient wallet balance. Please top up your wallet.');
            } else if (errorMsg.includes('already')) {
                setError('You already have a reservation for this meal.');
            } else {
                setError(errorMsg);
            }
        } finally {
            setReservingMenuId(null);
        }
    };

    const getMealTypeData = (type) => {
        const data = {
            breakfast: { icon: '🌅', time: '07:00 - 10:00', color: '#F59E0B' },
            lunch: { icon: '☀️', time: '11:30 - 14:00', color: '#10B981' },
            dinner: { icon: '🌙', time: '17:30 - 20:00', color: '#6366F1' }
        };
        return data[type] || { icon: '🍽️', time: '', color: '#6B7280' };
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (dateStr === today.toISOString().split('T')[0]) return 'Today';
        if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';

        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const getDateOptions = () => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    };

    if (authLoading || loading) {
        return (
            <>
                <Head><title>Meal Menu - Smart Campus</title></Head>
                <Navbar />
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p>Loading menus...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Meal Menu - Smart Campus</title>
            </Head>
            <Navbar />

            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Cafeteria Menu</h1>
                        <p style={styles.subtitle}>{formatDate(selectedDate)}</p>
                    </div>
                    <Link href="/meals/reservations" style={styles.viewReservationsBtn}>
                        🎫 My Reservations
                    </Link>
                </div>

                {/* User Status Card */}
                <div style={styles.statusCard}>
                    {studentInfo?.hasScholarship ? (
                        <div style={styles.scholarshipBadge}>
                            <span style={styles.badgeIcon}>🎓</span>
                            <div>
                                <span style={styles.badgeTitle}>Scholarship Meals</span>
                                <span style={styles.badgeSubtitle}>Up to {studentInfo.dailyQuota} free meals daily</span>
                            </div>
                        </div>
                    ) : (
                        <div style={styles.balanceBadge}>
                            <span style={styles.badgeIcon}>💳</span>
                            <div>
                                <span style={styles.badgeTitle}>Wallet Balance</span>
                                <span style={styles.badgeAmount}>{walletBalance.toFixed(2)} TRY</span>
                            </div>
                            <Link href="/wallet" style={styles.topUpLink}>Top Up</Link>
                        </div>
                    )}
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

                {/* Date Picker */}
                <div style={styles.datePicker}>
                    <div style={styles.dateScroll}>
                        {getDateOptions().map(date => {
                            const d = new Date(date);
                            const isSelected = date === selectedDate;
                            return (
                                <button
                                    key={date}
                                    onClick={() => setSelectedDate(date)}
                                    style={isSelected ? styles.dateButtonActive : styles.dateButton}
                                >
                                    <span style={styles.dateDay}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span style={styles.dateNum}>{d.getDate()}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Cafeteria Filter */}
                <div style={styles.filterRow}>
                    <select
                        value={selectedCafeteria}
                        onChange={(e) => setSelectedCafeteria(e.target.value)}
                        style={styles.filterSelect}
                    >
                        <option value="">All Cafeterias</option>
                        {cafeterias.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Menu Cards */}
                <div style={styles.menuGrid}>
                    {menus.length === 0 ? (
                        <div style={styles.emptyState}>
                            <span style={styles.emptyIcon}>🍽️</span>
                            <p>No menus available for this date</p>
                            <p style={styles.emptyHint}>Try selecting a different day</p>
                        </div>
                    ) : (
                        menus.map(menu => {
                            const mealData = getMealTypeData(menu.type);
                            const items = menu.items_json || menu.items || [];
                            const nutrition = menu.nutritional_info_json || menu.nutritional_info || {};

                            return (
                                <div key={menu.id} style={styles.menuCard}>
                                    <div style={{ ...styles.menuHeader, backgroundColor: mealData.color }}>
                                        <span style={styles.menuIcon}>{mealData.icon}</span>
                                        <div style={styles.menuMeta}>
                                            <span style={styles.menuType}>{menu.type}</span>
                                            <span style={styles.menuTime}>{mealData.time}</span>
                                        </div>
                                        <span style={styles.menuPrice}>
                                            {studentInfo?.hasScholarship ? 'FREE' : `${menu.price} TRY`}
                                        </span>
                                    </div>

                                    <div style={styles.menuBody}>
                                        <div style={styles.cafeteriaName}>
                                            📍 {menu.cafeteria?.name || 'Campus Cafeteria'}
                                        </div>

                                        <div style={styles.menuItems}>
                                            {items.map((item, idx) => (
                                                <div key={idx} style={styles.menuItem}>
                                                    <span style={styles.itemBullet}>•</span>
                                                    <span>{item.name || item}</span>
                                                    {item.category && (
                                                        <span style={styles.itemCategory}>{item.category}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Nutrition Info */}
                                        {(nutrition.calories || nutrition.protein) && (
                                            <div style={styles.nutritionRow}>
                                                {nutrition.calories && (
                                                    <span style={styles.nutritionItem}>🔥 {nutrition.calories} kcal</span>
                                                )}
                                                {nutrition.protein && (
                                                    <span style={styles.nutritionItem}>💪 {nutrition.protein}g protein</span>
                                                )}
                                                {nutrition.carbs && (
                                                    <span style={styles.nutritionItem}>🌾 {nutrition.carbs}g carbs</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Availability */}
                                        {menu.max_reservations && (
                                            <div style={styles.availabilityBar}>
                                                <div
                                                    style={{
                                                        ...styles.availabilityFill,
                                                        width: `${Math.min((menu.current_reservations / menu.max_reservations) * 100, 100)}%`,
                                                        backgroundColor: menu.current_reservations >= menu.max_reservations ? '#EF4444' : mealData.color
                                                    }}
                                                ></div>
                                                <span style={styles.availabilityText}>
                                                    {menu.max_reservations - (menu.current_reservations || 0)} spots left
                                                </span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleReserve(menu)}
                                            disabled={reservingMenuId === menu.id}
                                            style={{
                                                ...styles.reserveBtn,
                                                backgroundColor: mealData.color
                                            }}
                                        >
                                            {reservingMenuId === menu.id ? 'Reserving...' : 'Reserve Meal'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
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
        marginBottom: '20px',
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
    viewReservationsBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: '#F3F4F6',
        color: '#374151',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: '500',
        fontSize: '14px'
    },
    statusCard: {
        marginBottom: '20px'
    },
    scholarshipBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        backgroundColor: '#FEF3C7',
        borderRadius: '12px',
        border: '1px solid #FCD34D'
    },
    balanceBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        backgroundColor: '#EFF6FF',
        borderRadius: '12px',
        border: '1px solid #BFDBFE'
    },
    badgeIcon: {
        fontSize: '28px'
    },
    badgeTitle: {
        display: 'block',
        fontSize: '13px',
        color: '#6B7280'
    },
    badgeSubtitle: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#92400E'
    },
    badgeAmount: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1E40AF'
    },
    topUpLink: {
        marginLeft: 'auto',
        padding: '8px 16px',
        backgroundColor: '#3B82F6',
        color: 'white',
        borderRadius: '8px',
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
    datePicker: {
        marginBottom: '16px',
        overflowX: 'auto'
    },
    dateScroll: {
        display: 'flex',
        gap: '8px',
        paddingBottom: '8px'
    },
    dateButton: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        cursor: 'pointer',
        minWidth: '60px'
    },
    dateButtonActive: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#F59E0B',
        border: '1px solid #F59E0B',
        borderRadius: '12px',
        cursor: 'pointer',
        minWidth: '60px',
        color: 'white'
    },
    dateDay: {
        fontSize: '12px',
        fontWeight: '500',
        marginBottom: '4px'
    },
    dateNum: {
        fontSize: '18px',
        fontWeight: '700'
    },
    filterRow: {
        marginBottom: '20px'
    },
    filterSelect: {
        padding: '10px 16px',
        border: '1px solid #E5E7EB',
        borderRadius: '10px',
        fontSize: '14px',
        backgroundColor: 'white',
        minWidth: '200px'
    },
    menuGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
    },
    emptyState: {
        gridColumn: '1 / -1',
        textAlign: 'center',
        padding: '60px 20px',
        color: '#6B7280'
    },
    emptyIcon: {
        fontSize: '48px',
        display: 'block',
        marginBottom: '16px'
    },
    emptyHint: {
        fontSize: '14px',
        opacity: 0.7
    },
    menuCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
    },
    menuHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        color: 'white'
    },
    menuIcon: {
        fontSize: '32px'
    },
    menuMeta: {
        flex: 1
    },
    menuType: {
        display: 'block',
        fontSize: '18px',
        fontWeight: '700',
        textTransform: 'capitalize'
    },
    menuTime: {
        fontSize: '13px',
        opacity: 0.9
    },
    menuPrice: {
        fontSize: '20px',
        fontWeight: '700'
    },
    menuBody: {
        padding: '20px'
    },
    cafeteriaName: {
        fontSize: '14px',
        color: '#6B7280',
        marginBottom: '16px'
    },
    menuItems: {
        marginBottom: '16px'
    },
    menuItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 0',
        fontSize: '15px',
        color: '#374151'
    },
    itemBullet: {
        color: '#9CA3AF'
    },
    itemCategory: {
        marginLeft: 'auto',
        fontSize: '11px',
        padding: '2px 8px',
        backgroundColor: '#F3F4F6',
        borderRadius: '4px',
        color: '#6B7280',
        textTransform: 'capitalize'
    },
    nutritionRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 0',
        borderTop: '1px solid #F3F4F6',
        marginBottom: '16px'
    },
    nutritionItem: {
        fontSize: '13px',
        color: '#6B7280'
    },
    availabilityBar: {
        height: '4px',
        backgroundColor: '#E5E7EB',
        borderRadius: '2px',
        marginBottom: '8px',
        position: 'relative'
    },
    availabilityFill: {
        height: '100%',
        borderRadius: '2px',
        transition: 'width 0.3s'
    },
    availabilityText: {
        fontSize: '12px',
        color: '#6B7280'
    },
    reserveBtn: {
        width: '100%',
        padding: '14px',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '8px',
        transition: 'opacity 0.2s'
    }
};

// Force SSR to prevent static generation errors
export async function getServerSideProps() {
    return { props: {} };
}
