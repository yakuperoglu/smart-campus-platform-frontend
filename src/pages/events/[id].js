/**
 * Event Details Page
 * 
 * View detailed info about an event and purchase/register.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import FeedbackMessage from '../../components/FeedbackMessage';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Ticket, Share2, CreditCard } from 'lucide-react';

export default function EventDetailsPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user, logout, loading: authLoading } = useAuth();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (id && user) {
            fetchEventDetails();
        }
    }, [id, user, authLoading]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/events/${id}`);
            setEvent(response.data.data);
        } catch (err) {
            console.error('Error fetching event:', err);
            setFeedback({ type: 'error', message: 'Failed to load event details' });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!confirm(`Confirm registration for ${event.title}? ${event.price > 0 ? `This will cost ${event.price} TRY.` : 'This event is free.'}`)) {
            return;
        }

        setPurchasing(true);
        setFeedback({ type: '', message: '' });

        try {
            await api.post('/events/register', { event_id: event.id });
            setFeedback({ type: 'success', message: 'Successfully registered! Check My Tickets.' });

            // Refresh data to update capacity
            fetchEventDetails();

            // Optional: Redirect to tickets after short delay
            setTimeout(() => {
                router.push('/events/my-tickets');
            }, 2000);
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Registration failed' });
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout user={user} onLogout={logout}>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading details...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!event) {
        return (
            <DashboardLayout user={user} onLogout={logout}>
                <div className="text-center py-20">
                    <h2 className="text-xl font-bold text-gray-900">Event not found</h2>
                    <Link href="/events" className="text-blue-600 hover:underline mt-2 inline-block">Back to Events</Link>
                </div>
            </DashboardLayout>
        );
    }

    const isFull = event.max_participants && event.participants_count >= event.max_participants;
    const isPast = new Date(event.date) < new Date();

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>{event.title} - Smart Campus</title>
            </Head>

            <FeedbackMessage
                type={feedback.type}
                message={feedback.message}
                onClose={() => setFeedback({ type: '', message: '' })}
            />

            <div className="mb-6 animate-in slide-in-from-bottom-2 duration-500">
                <Link href="/events" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to Events
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-5 duration-500">

                {/* Left Column: Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Hero Image */}
                    <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-sm relative bg-gray-100">
                        {event.poster_url ? (
                            <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center">
                                <Calendar className="h-24 w-24 text-white/10" />
                            </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-bold shadow-sm">
                            {event.category || 'General'}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

                        <div className="flex flex-wrap gap-6 text-gray-600 mb-8 pb-8 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">{event.location}</span>
                            </div>
                        </div>

                        <div className="prose max-w-none text-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">About this event</h3>
                            <p className="whitespace-pre-wrap leading-relaxed">{event.description}</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Ticket / Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Price per person</p>
                                <div className="text-3xl font-bold text-gray-900">
                                    {event.price > 0 ? `${event.price} TRY` : 'Free'}
                                </div>
                            </div>
                            {event.max_participants && (
                                <div className="text-right">
                                    <div className={`text-sm font-bold ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                                        {isFull ? 'Sold Out' : 'Available'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {event.participants_count || 0} / {event.max_participants} joined
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleRegister}
                            disabled={purchasing || isFull || isPast}
                            className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95
                                ${isFull || isPast
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-slate-900 hover:bg-black text-white hover:shadow-xl'
                                }`}
                        >
                            {purchasing ? (
                                'Processing...'
                            ) : isPast ? (
                                'Event Ended'
                            ) : isFull ? (
                                'Sold Out'
                            ) : (
                                <>
                                    {event.price > 0 ? <CreditCard className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
                                    {event.price > 0 ? 'Buy Ticket' : 'Register for Free'}
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-gray-400 mt-4">
                            {event.price > 0
                                ? 'Secure payment via Campus Wallet. Refundable up to 24h before.'
                                : 'Instant confirmation sent to your email.'}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="h-4 w-4" /> Organizer
                        </h3>
                        {event.club ? (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    {event.club.logo_url ? (
                                        <img src={event.club.logo_url} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <Users className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{event.club.name}</p>
                                    <Link href={`/clubs/${event.club.id}`} className="text-xs text-blue-600 hover:underline">View Club Page</Link>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Campus Administration</p>
                        )}
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
