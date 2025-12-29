import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Calendar,
    Plus,
    Search,
    Trash2,
    Edit2,
    MapPin,
    Users,
    DollarSign,
    PartyPopper,
    Trophy,
    Briefcase,
    BookOpen,
    Clock,
    X,
    Check
} from 'lucide-react';
import api from '../../config/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function AdminEvents() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const [form, setForm] = useState({
        title: '',
        description: '',
        date: '',
        end_date: '',
        location: '',
        capacity: 100,
        category: 'academic',
        is_paid: false,
        price: 0
    });

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
        } else if (user) {
            fetchEvents();
        }
    }, [user, authLoading, router]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/events');
            if (res.data.success) {
                const eventsData = Array.isArray(res.data.data) ? res.data.data : (res.data.data || []);
                setEvents(eventsData);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            setFeedback({ type: 'error', message: 'Failed to load events' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            title: '',
            description: '',
            date: '',
            end_date: '',
            location: '',
            capacity: 100,
            category: 'academic',
            is_paid: false,
            price: 0
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEvent) {
                await api.put(`/events/${editingEvent.id}`, form);
                setFeedback({ type: 'success', message: 'Event updated successfully!' });
            } else {
                await api.post('/events', form);
                setFeedback({ type: 'success', message: 'Event created successfully!' });
            }
            setShowForm(false);
            setEditingEvent(null);
            resetForm();
            fetchEvents();
        } catch (error) {
            setFeedback({ type: 'error', message: error.response?.data?.message || 'Failed to save event' });
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setForm({
            title: event.title,
            description: event.description || '',
            date: event.date?.slice(0, 16) || '',
            end_date: event.end_date?.slice(0, 16) || '',
            location: event.location || '',
            capacity: event.capacity || 100,
            category: event.category || 'academic',
            is_paid: event.is_paid || false,
            price: event.price || 0
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            await api.delete(`/events/${id}`);
            setFeedback({ type: 'success', message: 'Event deleted!' });
            fetchEvents();
        } catch (error) {
            setFeedback({ type: 'error', message: 'Failed to delete event' });
        }
    };

    const getCategoryDetails = (category) => {
        const details = {
            academic: { color: 'blue', icon: BookOpen, label: 'Academic' },
            social: { color: 'pink', icon: PartyPopper, label: 'Social' },
            sports: { color: 'green', icon: Trophy, label: 'Sports' },
            cultural: { color: 'orange', icon: Users, label: 'Cultural' },
            career: { color: 'indigo', icon: Briefcase, label: 'Career' }
        };
        return details[category] || details.academic;
    };

    if (authLoading || !user || user.role !== 'admin') return null;

    return (
        <DashboardLayout user={user}>
            <Head>
                <title>Event Management | Admin | Smart Campus</title>
            </Head>

            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Calendar className="h-6 w-6 text-purple-600" />
                            Event Management
                        </h1>
                        <p className="mt-1 text-gray-500">Create and manage campus events</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setEditingEvent(null); setShowForm(true); }}
                        className="btn-primary-gradient flex items-center justify-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Create Event
                    </button>
                </div>

                {/* Feedback */}
                {feedback.message && (
                    <div className={`p-4 rounded-xl flex items-center justify-between ${feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        <div className="flex items-center gap-2">
                            {feedback.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                            <span>{feedback.message}</span>
                        </div>
                        <button onClick={() => setFeedback({ type: '', message: '' })} className="hover:opacity-70">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{events.length}</h3>
                                <p className="text-sm text-gray-500">Total Events</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-lg text-green-600">
                                <Trophy className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {events.filter(e => new Date(e.date) > new Date()).length}
                                </h3>
                                <p className="text-sm text-gray-500">Upcoming</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {events.filter(e => e.is_paid).length}
                                </h3>
                                <p className="text-sm text-gray-500">Paid Events</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading events...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                        <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No events yet</h3>
                        <p className="text-gray-500 mt-1">Create your first campus event!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map(event => {
                            const catDetails = getCategoryDetails(event.category);
                            const Icon = catDetails.icon;
                            return (
                                <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                                    <div className="p-6 flex-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-${catDetails.color}-50 text-${catDetails.color}-700 uppercase tracking-wide`}>
                                                <Icon className="h-3 w-3" /> {catDetails.label}
                                            </span>
                                            {event.is_paid && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                                                    ₺{event.price}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
                                            {event.title}
                                        </h3>

                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <span>
                                                    {new Date(event.date).toLocaleDateString()} • {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                <span className="line-clamp-1">{event.location || 'TBA'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span>{event.registrations_count || 0}/{event.capacity} registered</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="flex-1 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit2 className="h-4 w-4" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="flex-1 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" /> Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowForm(false)} aria-hidden="true"></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-start mb-5">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                            {editingEvent ? 'Edit Event' : 'Create New Event'}
                                        </h3>
                                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-500">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                                            <input
                                                type="text"
                                                value={form.title}
                                                onChange={e => setForm({ ...form, title: e.target.value })}
                                                required
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                value={form.description}
                                                onChange={e => setForm({ ...form, description: e.target.value })}
                                                rows={3}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                                <input
                                                    type="datetime-local"
                                                    value={form.date}
                                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                                    required
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                                <input
                                                    type="datetime-local"
                                                    value={form.end_date}
                                                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                                <input
                                                    type="text"
                                                    value={form.location}
                                                    onChange={e => setForm({ ...form, location: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                                                <input
                                                    type="number"
                                                    value={form.capacity}
                                                    onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })}
                                                    min="1"
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                                <select
                                                    value={form.category}
                                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                                >
                                                    <option value="academic">Academic</option>
                                                    <option value="social">Social</option>
                                                    <option value="sports">Sports</option>
                                                    <option value="cultural">Cultural</option>
                                                    <option value="career">Career</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-2 cursor-pointer mt-6">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.is_paid}
                                                        onChange={e => setForm({ ...form, is_paid: e.target.checked })}
                                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">Paid Event</span>
                                                </label>
                                                {form.is_paid && (
                                                    <input
                                                        type="number"
                                                        value={form.price}
                                                        onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                                                        placeholder="Price (₺)"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full mt-2 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => setShowForm(false)}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700"
                                            >
                                                {editingEvent ? 'Save Changes' : 'Create Event'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
