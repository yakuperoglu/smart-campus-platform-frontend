/**
 * My Meal Reservations Page
 * 
 * View upcoming meal reservations with QR codes for pickup.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import FeedbackMessage from '../../components/FeedbackMessage';
import { Calendar, MapPin, XCircle, QrCode, Clock, Filter, AlertCircle } from 'lucide-react';

export default function MealReservationsPage() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useAuth();

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
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
            setFeedback({ type: 'error', message: 'Failed to load reservations' });
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
            setFeedback({ type: 'success', message: 'Reservation cancelled successfully' });
            fetchReservations();
        } catch (err) {
            console.error('Cancel error:', err);
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to cancel reservation' });
        }
    };

    const getMealTypeData = (type) => {
        const data = {
            breakfast: { icon: '🌅', label: 'Breakfast', color: 'bg-amber-100 text-amber-800 border-amber-200' },
            lunch: { icon: '☀️', label: 'Lunch', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
            dinner: { icon: '🌙', label: 'Dinner', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
        };
        return data[type] || { icon: '🍽️', label: type, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    };

    const getStatusBadge = (status) => {
        const badges = {
            reserved: { label: 'Active', classes: 'bg-green-100 text-green-800 border-green-200' },
            confirmed: { label: 'Confirmed', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
            consumed: { label: 'Used', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
            cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-600 border-red-100 line-through' },
            no_show: { label: 'No Show', classes: 'bg-red-100 text-red-800 border-red-200' }
        };
        return badges[status] || { label: status, classes: 'bg-gray-100 text-gray-800' };
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

    const upcomingReservations = reservations.filter(r => r.status === 'reserved');

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>My Reservations - Smart Campus</title>
            </Head>

            <FeedbackMessage
                type={feedback.type}
                message={feedback.message}
                onClose={() => setFeedback({ type: '', message: '' })}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 animate-in slide-in-from-bottom-2 duration-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Meal Reservations</h1>
                    <p className="text-gray-500 mt-1">{upcomingReservations.length} upcoming meals</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <Link href="/meals/menu" className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-sm">
                        <span>+</span> Reserve Meal
                    </Link>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-xl w-full md:w-auto inline-flex overflow-x-auto">
                {['upcoming', 'consumed', 'cancelled', 'all'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                            ${filter === tab
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                    >
                        {tab === 'upcoming' && '🎫 '}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading reservations...</p>
                </div>
            ) : reservations.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No {filter} reservations found</h3>
                    <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                        {filter === 'upcoming'
                            ? "You don't have any upcoming meal reservations. Check the menu to reserve a meal."
                            : "No reservation history found for this filter."}
                    </p>
                    {filter === 'upcoming' && (
                        <Link href="/meals/menu" className="inline-block mt-4 text-blue-600 font-medium hover:underline">
                            Browse Daily Menu →
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-500">
                    {reservations.map(reservation => {
                        const mealData = getMealTypeData(reservation.menu?.type);
                        const statusBadge = getStatusBadge(reservation.status);
                        const isActive = reservation.status === 'reserved';

                        return (
                            <div key={reservation.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6">
                                {/* Left Section: Date & Icon */}
                                <div className="flex-shrink-0 flex md:flex-col items-center gap-3 md:gap-1 md:w-24 md:border-r md:border-gray-100 md:pr-6">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${mealData.color.split(' ')[0]}`}>
                                        {mealData.icon}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-gray-900 leading-tight">
                                            {formatDate(reservation.menu?.date || reservation.reservation_time)}
                                        </p>
                                    </div>
                                </div>

                                {/* Middle Section: Content */}
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${mealData.color}`}>
                                            {mealData.label}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusBadge.classes}`}>
                                            {statusBadge.label}
                                        </span>
                                    </div>

                                    <h3 className="text-gray-900 font-bold mb-1 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        {reservation.cafeteria?.name || reservation.menu?.cafeteria?.name || 'Campus Cafeteria'}
                                    </h3>

                                    {reservation.menu?.items_json && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {(reservation.menu.items_json || []).slice(0, 3).map((item, idx) => (
                                                <span key={idx} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                    {item.name || item}
                                                </span>
                                            ))}
                                            {(reservation.menu.items_json?.length > 3) && (
                                                <span className="text-xs text-gray-400 px-1 py-1">+{reservation.menu.items_json.length - 3} more</span>
                                            )}
                                        </div>
                                    )}

                                    {isActive && (
                                        <button
                                            onClick={() => handleCancel(reservation.id)}
                                            className="mt-4 text-xs font-medium text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                                        >
                                            <XCircle className="h-3 w-3" /> Cancel Reservation
                                        </button>
                                    )}
                                </div>

                                {/* Right Section: QR Code */}
                                {isActive && reservation.qr_code && (
                                    <div className="flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 pt-4 md:pt-0 flex flex-col items-center justify-center">
                                        <button
                                            onClick={() => setExpandedQR(reservation.id)}
                                            className="group flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="bg-white p-2 rounded border border-gray-200 group-hover:border-blue-300 transition-colors">
                                                <QRCodeSVG
                                                    value={reservation.qr_code}
                                                    size={80}
                                                    level="H"
                                                />
                                            </div>
                                            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                                                <QrCode className="h-3 w-3" /> Show QR
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Expanded QR Modal */}
            {expandedQR && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setExpandedQR(null)}
                >
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 text-lg">Meal Authentication QR</h3>
                            <button onClick={() => setExpandedQR(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-inner flex justify-center mb-6">
                            {reservations.find(r => r.id === expandedQR)?.qr_code && (
                                <QRCodeSVG
                                    value={reservations.find(r => r.id === expandedQR).qr_code}
                                    size={240}
                                    level="H"
                                    includeMargin={true}
                                />
                            )}
                        </div>

                        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex items-start gap-2 text-left">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <p>Show this code to the cafeteria staff to redeem your meal. Brightness up!</p>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
