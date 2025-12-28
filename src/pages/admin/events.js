import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '../../config/api';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';

export default function AdminEvents() {
    const router = useRouter();
    const { user } = useAuth();
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
        if (user && user.role !== 'admin') {
            router.push('/dashboard');
        } else if (user) {
            fetchEvents();
        }
    }, [user, router]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/events');
            if (res.data.success) {
                // Handle both cases: data could be an array or object with events property
                const eventsData = Array.isArray(res.data.data) ? res.data.data : (res.data.data || []);
                setEvents(eventsData);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
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

    if (!user || user.role !== 'admin') {
        return <div>Access denied. Admin only.</div>;
    }

    return (
        <div className="page-container">
            <Head>
                <title>Event Management | Admin | Smart Campus</title>
            </Head>
            <Navbar userData={user} />

            <div className="content">
                <div className="header-row">
                    <h1>🎉 Event Management</h1>
                    <button className="btn-primary" onClick={() => { resetForm(); setEditingEvent(null); setShowForm(true); }}>
                        + Create Event
                    </button>
                </div>

                {feedback.message && (
                    <div className={`feedback ${feedback.type}`}>
                        {feedback.message}
                        <button onClick={() => setFeedback({ type: '', message: '' })}>×</button>
                    </div>
                )}

                {showForm && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h2>{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Title *</label>
                                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date *</label>
                                        <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Location</label>
                                        <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Capacity</label>
                                        <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })} min="1" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                            <option value="academic">Academic</option>
                                            <option value="social">Social</option>
                                            <option value="sports">Sports</option>
                                            <option value="cultural">Cultural</option>
                                            <option value="career">Career</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <input type="checkbox" checked={form.is_paid} onChange={e => setForm({ ...form, is_paid: e.target.checked })} />
                                            {' '}Paid Event
                                        </label>
                                        {form.is_paid && (
                                            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} placeholder="Price" min="0" step="0.01" />
                                        )}
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingEvent(null); }}>Cancel</button>
                                    <button type="submit" className="btn-primary">{editingEvent ? 'Update' : 'Create'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="loading">Loading events...</div>
                ) : events.length === 0 ? (
                    <div className="empty">No events found. Create your first event!</div>
                ) : (
                    <div className="events-grid">
                        {events.map(event => (
                            <div key={event.id} className="event-card">
                                <div className="event-header">
                                    <span className={`category-badge ${event.category}`}>{event.category}</span>
                                    {event.is_paid && <span className="paid-badge">₺{event.price}</span>}
                                </div>
                                <h3>{event.title}</h3>
                                <p className="event-date">📅 {new Date(event.date).toLocaleString()}</p>
                                <p className="event-location">📍 {event.location || 'TBA'}</p>
                                <p className="event-capacity">👥 {event.registrations_count || 0}/{event.capacity}</p>
                                <div className="event-actions">
                                    <button onClick={() => handleEdit(event)}>Edit</button>
                                    <button className="delete" onClick={() => handleDelete(event.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .page-container { background: #f3f4f6; min-height: 100vh; }
                .content { max-width: 1200px; margin: 20px auto; padding: 20px; }
                .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                h1 { font-size: 1.75rem; font-weight: bold; color: #1a202c; }
                .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
                .btn-secondary { background: #e5e7eb; color: #374151; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
                .feedback { padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                .feedback.success { background: #d1fae5; color: #065f46; }
                .feedback.error { background: #fee2e2; color: #991b1b; }
                .feedback button { background: none; border: none; font-size: 1.2rem; cursor: pointer; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal { background: white; padding: 30px; border-radius: 12px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
                .modal h2 { margin-bottom: 20px; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
                .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
                .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
                .event-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
                .event-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .category-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
                .category-badge.academic { background: #dbeafe; color: #1e40af; }
                .category-badge.social { background: #fce7f3; color: #9d174d; }
                .category-badge.sports { background: #d1fae5; color: #065f46; }
                .category-badge.cultural { background: #fef3c7; color: #92400e; }
                .category-badge.career { background: #e0e7ff; color: #3730a3; }
                .paid-badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
                .event-card h3 { margin: 0 0 10px 0; font-size: 1.1rem; }
                .event-date, .event-location, .event-capacity { color: #6b7280; font-size: 0.9rem; margin: 5px 0; }
                .event-actions { display: flex; gap: 10px; margin-top: 15px; }
                .event-actions button { flex: 1; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 500; }
                .event-actions button:first-child { background: #e0e7ff; color: #3730a3; border: none; }
                .event-actions button.delete { background: #fee2e2; color: #991b1b; border: none; }
                .loading, .empty { text-align: center; padding: 40px; color: #6b7280; }
            `}</style>
        </div>
    );
}
