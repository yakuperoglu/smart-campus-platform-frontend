/**
 * Events/Clubs Hub Page
 * 
 * Discover campus events, filter by category, and buy tickets.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import FeedbackMessage from '../../components/FeedbackMessage';
import { Search, Calendar, MapPin, Users, Ticket, Filter, ArrowRight, UserPlus, Heart } from 'lucide-react';

export default function EventsIndexPage() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useAuth();

    // State
    const [events, setEvents] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [activeTab, setActiveTab] = useState('events'); // 'events' or 'clubs'

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchData();
        }
    }, [user, authLoading]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [eventsRes, clubsRes] = await Promise.all([
                api.get('/events').catch(() => ({ data: { data: [] } })),
                api.get('/clubs').catch(() => ({ data: { data: [] } }))
            ]);

            const eventsData = eventsRes.data.data;
            const clubsData = clubsRes.data.data;

            setEvents(Array.isArray(eventsData) ? eventsData : []);
            setClubs(Array.isArray(clubsData) ? clubsData : []);
        } catch (err) {
            console.error('Error fetching events:', err);
            setFeedback({ type: 'error', message: 'Failed to load campus buzz' });
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClub = async (clubId) => {
        try {
            await api.post(`/clubs/${clubId}/join`);
            setFeedback({ type: 'success', message: 'Joined club successfully!' });
            // Ideally refetch or update local state
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to join club' });
        }
    };

    const filteredEvents = events.filter(e =>
        (e.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (e.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const filteredClubs = clubs.filter(c =>
        (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>Campus Life - Smart Campus</title>
            </Head>

            <FeedbackMessage
                type={feedback.type}
                message={feedback.message}
                onClose={() => setFeedback({ type: '', message: '' })}
            />

            {/* Header with Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 animate-in slide-in-from-bottom-2 duration-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campus Life</h1>
                    <p className="text-gray-500 mt-1">Discover events, clubs, and activities around you.</p>
                </div>

                <div className="mt-4 md:mt-0 flex gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full md:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                        />
                    </div>
                    <Link href="/events/my-tickets" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
                        <Ticket className="h-4 w-4" /> My Tickets
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('events')}
                    className={`pb-4 px-6 text-sm font-medium transition-colors relative whitespace-nowrap
                        ${activeTab === 'events' ? 'text-slate-900' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    Upcoming Events
                    {activeTab === 'events' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('clubs')}
                    className={`pb-4 px-6 text-sm font-medium transition-colors relative whitespace-nowrap
                        ${activeTab === 'clubs' ? 'text-slate-900' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    Student Clubs
                    {activeTab === 'clubs' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full"></span>
                    )}
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading campus buzz...</p>
                </div>
            ) : (
                <div className="animate-in slide-in-from-bottom-4 duration-500">

                    {/* Events Grid */}
                    {activeTab === 'events' && (
                        filteredEvents.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">No events found</h3>
                                <p className="text-gray-500">Try adjusting your search terms.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredEvents.map(event => (
                                    <Link href={`/events/${event.id}`} key={event.id} className="group block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all h-full flex flex-col">
                                        <div className="h-48 bg-slate-100 relative overflow-hidden">
                                            {event.poster_url ? (
                                                <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                                                    <Calendar className="h-16 w-16 text-white/20" />
                                                </div>
                                            )}

                                            {event.price === 0 && (
                                                <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                                    FREE
                                                </span>
                                            )}

                                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                                                <p className="text-white text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(event.date).toLocaleDateString()} • {event.time}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{event.title}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                                <MapPin className="h-4 w-4" />
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                                                {event.description}
                                            </p>
                                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {event.price > 0 ? `${event.price} TRY` : 'Free Entry'}
                                                </div>
                                                <span className="text-xs font-medium text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                    Details <ArrowRight className="h-3 w-3" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )
                    )}

                    {/* Clubs Grid */}
                    {activeTab === 'clubs' && (
                        filteredClubs.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">No clubs found</h3>
                                <p className="text-gray-500">Try adjusting your search terms.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredClubs.map(club => (
                                    <div key={club.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="h-32 bg-slate-900 relative">
                                            <div className="absolute inset-0 bg-pattern opacity-10"></div>
                                            <div className="absolute -bottom-8 left-6">
                                                <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-md">
                                                    {club.logo_url ? (
                                                        <img src={club.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                            <Users className="h-8 w-8" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-10 px-6 pb-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900 text-lg">{club.name}</h3>
                                                {/* <button className="text-gray-400 hover:text-red-500 transition-colors">
                                                    <Heart className="h-5 w-5" />
                                                </button> */}
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{club.description || 'Join us to connect with like-minded students and participate in exciting activities!'}</p>

                                            <button
                                                onClick={() => handleJoinClub(club.id)}
                                                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm font-semibold rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <UserPlus className="h-4 w-4" /> Join Club
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                </div>
            )}
        </DashboardLayout>
    );
}
