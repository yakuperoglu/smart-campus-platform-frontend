/**
 * Meal Menu Page
 * 
 * Browse daily menus with date picker, nutrition info, and reservation logic.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import FeedbackMessage from '../../components/FeedbackMessage';
import { Calendar, Info, Clock, Utensils, Award, CreditCard, ChevronLeft, ChevronRight, Flame, Dumbbell } from 'lucide-react';

export default function MealMenuPage() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useAuth();

    const [menus, setMenus] = useState([]);
    const [cafeterias, setCafeterias] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [studentInfo, setStudentInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

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
            setFeedback({ type: 'error', message: 'Failed to load cafeteria data' });
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
        setFeedback({ type: '', message: '' });

        // Pre-flight checks
        if (!studentInfo?.hasScholarship && menu.price > 0) {
            // Check wallet balance for paid users
            if (walletBalance < menu.price) {
                setFeedback({ type: 'error', message: `Insufficient balance. You need ${menu.price} TRY but have ${walletBalance.toFixed(2)} TRY.` });
                return;
            }
        }

        try {
            setReservingMenuId(menu.id);
            await api.post('/meals/reservations', { menu_id: menu.id });

            setFeedback({ type: 'success', message: 'Meal reserved successfully! Check your reservations for the QR code.' });

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
                setFeedback({ type: 'error', message: 'Daily meal quota reached (2/day for scholarships).' });
            } else if (errorMsg.includes('balance')) {
                setFeedback({ type: 'error', message: 'Insufficient wallet balance.' });
            } else if (errorMsg.includes('already')) {
                setFeedback({ type: 'warning', message: 'You already reserved this meal.' });
            } else {
                setFeedback({ type: 'error', message: errorMsg });
            }
        } finally {
            setReservingMenuId(null);
        }
    };

    const getMealTypeData = (type) => {
        const data = {
            breakfast: { icon: '🌅', time: '07:00 - 10:00', color: 'bg-amber-500', text: 'text-amber-700', bgSoft: 'bg-amber-50' },
            lunch: { icon: '☀️', time: '11:30 - 14:00', color: 'bg-emerald-500', text: 'text-emerald-700', bgSoft: 'bg-emerald-50' },
            dinner: { icon: '🌙', time: '17:30 - 20:00', color: 'bg-indigo-500', text: 'text-indigo-700', bgSoft: 'bg-indigo-50' }
        };
        return data[type] || { icon: '🍽️', time: '', color: 'bg-gray-500', text: 'text-gray-700', bgSoft: 'bg-gray-50' };
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

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>Meal Menu - Smart Campus</title>
            </Head>

            <FeedbackMessage
                type={feedback.type}
                message={feedback.message}
                onClose={() => setFeedback({ type: '', message: '' })}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 animate-in slide-in-from-bottom-2 duration-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cafeteria Menu</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(selectedDate)}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <Link href="/meals/reservations" className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                        <Utensils className="h-4 w-4" />
                        My Reservations
                    </Link>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in slide-in-from-bottom-3 duration-500 delay-75">
                {/* Balance/Scholarship status */}
                <div className="md:col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Utensils className="h-32 w-32" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-1">Dietary Status</h3>

                        {studentInfo?.hasScholarship ? (
                            <div className="flex items-center gap-4">
                                <span className="text-3xl font-bold text-yellow-400">Scholarship Active</span>
                                <span className="bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold border border-yellow-400/30 flex items-center gap-1">
                                    <Award className="h-3 w-3" />
                                    Details
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <span className="text-3xl font-bold text-white">{walletBalance.toFixed(2)} <span className="text-lg text-slate-400">TRY</span></span>
                                <Link href="/wallet" className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 transition-colors flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    Top Up
                                </Link>
                            </div>
                        )}

                        <p className="mt-2 text-slate-400 text-sm max-w-lg">
                            {studentInfo?.hasScholarship
                                ? `You have a daily quota of ${studentInfo.dailyQuota} free meals. Additional meals will be charged.`
                                : "Balance is automatically deducted when you confirm a reservation."}
                        </p>
                    </div>
                </div>

                {/* Date Picker (Horizontal Scroll) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select Date</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1 items-center">
                        {getDateOptions().map(date => {
                            const d = new Date(date);
                            const isSelected = date === selectedDate;
                            return (
                                <button
                                    key={date}
                                    onClick={() => setSelectedDate(date)}
                                    className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-xl border transition-all duration-200
                                        ${isSelected
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-md transform scale-105'
                                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-xs font-medium">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className="text-xl font-bold">{d.getDate()}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex justify-end mb-6">
                <select
                    value={selectedCafeteria}
                    onChange={(e) => setSelectedCafeteria(e.target.value)}
                    className="block w-full md:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg border bg-white"
                >
                    <option value="">All Cafeterias</option>
                    {cafeterias.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Menu Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading daily menu...</p>
                </div>
            ) : menus.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No Menus Available</h3>
                    <p className="text-gray-500">There are no meals scheduled for this day.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-5 duration-500">
                    {menus.map(menu => {
                        const mealData = getMealTypeData(menu.type);
                        const items = menu.items_json || menu.items || [];
                        const nutrition = menu.nutritional_info_json || menu.nutritional_info || {};
                        const available = menu.max_reservations ? menu.max_reservations - (menu.current_reservations || 0) : 999;
                        const progress = menu.max_reservations ? Math.min((menu.current_reservations / menu.max_reservations) * 100, 100) : 0;

                        return (
                            <div key={menu.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full group">
                                {/* Header */}
                                <div className={`${mealData.color} p-5 text-white relative overflow-hidden`}>
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div>
                                            <span className="inline-flex items-center gap-1 bg-black/20 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-2">
                                                {mealData.icon} {menu.type}
                                            </span>
                                            <div className="text-sm opacity-90 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {mealData.time}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">
                                                {studentInfo?.hasScholarship ? 'FREE' : `${menu.price}₺`}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Decorative BG Icon */}
                                    <div className="absolute -bottom-4 -right-4 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                        <Utensils className="h-32 w-32" />
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-grow">
                                    <div className="text-xs font-medium text-gray-500 mb-4 flex items-center gap-1">
                                        <MapPinIcon className="h-3 w-3" />
                                        {menu.cafeteria?.name || 'Main Cafeteria'}
                                    </div>

                                    {/* Menu Items */}
                                    <div className="space-y-3 mb-6 flex-grow">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-3 text-sm text-gray-700 bg-gray-50/50 p-2 rounded-lg">
                                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300 flex-shrink-0"></div>
                                                <span className="flex-grow">{item.name || item}</span>
                                                {item.category && (
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Nutrition Pills */}
                                    {(nutrition.calories || nutrition.protein) && (
                                        <div className="flex flex-wrap gap-2 mb-4 pt-4 border-t border-gray-100">
                                            {nutrition.calories && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                                                    <Flame className="h-3 w-3" /> {nutrition.calories} kcal
                                                </span>
                                            )}
                                            {nutrition.protein && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                                    <Dumbbell className="h-3 w-3" /> {nutrition.protein}g prot
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Availability Bar */}
                                    {menu.max_reservations && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className={`${available < 20 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                    {available} spots left
                                                </span>
                                                <span className="text-gray-400">{Math.round(progress)}% booked</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${available < 20 ? 'bg-red-500' : 'bg-slate-900'}`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleReserve(menu)}
                                        disabled={reservingMenuId === menu.id || available <= 0}
                                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-sm transition-all transform active:scale-95
                                            ${reservingMenuId === menu.id
                                                ? 'bg-gray-100 text-gray-400 cursor-wait'
                                                : available <= 0
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-slate-900 text-white hover:bg-black hover:shadow-md'
                                            }`}
                                    >
                                        {reservingMenuId === menu.id ? 'Processing...' : available <= 0 ? 'Sold Out' : 'Reserve Meal'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </DashboardLayout>
    );
}

function MapPinIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
    )
}
