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

    const getCategoryStyle = (category) => {
        const styles = {
            academic: { bg: '#dbeafe', color: '#1e40af' },
            social: { bg: '#fce7f3', color: '#9d174d' },
            sports: { bg: '#d1fae5', color: '#065f46' },
            cultural: { bg: '#fef3c7', color: '#92400e' },
            career: { bg: '#e0e7ff', color: '#3730a3' }
        };
        return styles[category] || styles.academic;
    };

    if (!user || user.role !== 'admin') {
        return <div>Access denied. Admin only.</div>;
    }

    return (
        <div className="admin-page-container">
            <Head>
                <title>Event Management | Admin | Smart Campus</title>
            </Head>
            <Navbar userData={user} />

            <div className="admin-content">
                <div className="admin-header">
                    <div className="admin-header-left">
                        <h1>🎉 Event Management</h1>
                        <p>Create and manage campus events</p>
                    </div>
                    <button className="btn-primary-gradient" onClick={() => { resetForm(); setEditingEvent(null); setShowForm(true); }}>
                        + Create Event
                    </button>
                </div>

                {feedback.message && (
                    <div style={{
                        padding: '14px 20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: feedback.type === 'success' ? '#d1fae5' : '#fee2e2',
                        color: feedback.type === 'success' ? '#065f46' : '#991b1b'
                    }}>
                        {feedback.message}
                        <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setFeedback({ type: '', message: '' })}>×</button>
                    </div>
                )}

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card-modern">
                        <div className="stat-icon purple">📅</div>
                        <div className="stat-info">
                            <h3>{events.length}</h3>
                            <p>Total Events</p>
                        </div>
                    </div>
                    <div className="stat-card-modern">
                        <div className="stat-icon green">🎯</div>
                        <div className="stat-info">
                            <h3>{events.filter(e => new Date(e.date) > new Date()).length}</h3>
                            <p>Upcoming</p>
                        </div>
                    </div>
                    <div className="stat-card-modern">
                        <div className="stat-icon blue">💰</div>
                        <div className="stat-info">
                            <h3>{events.filter(e => e.is_paid).length}</h3>
                            <p>Paid Events</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading events...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🎉</div>
                        <h3>No events yet</h3>
                        <p>Create your first campus event!</p>
                    </div>
                ) : (
                    <div className="cards-grid">
                        {events.map(event => (
                            <div key={event.id} className="card-modern" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '24px', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <span style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            background: getCategoryStyle(event.category).bg,
                                            color: getCategoryStyle(event.category).color
                                        }}>
                                            {event.category}
                                        </span>
                                        {event.is_paid && (
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: '#fef3c7',
                                                color: '#92400e'
                                            }}>
                                                ₺{event.price}
                                            </span>
                                        )}
                                    </div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#1a202c', margin: '0 0 12px' }}>{event.title}</h3>
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        <p style={{ margin: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            📅 {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p style={{ margin: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            📍 {event.location || 'TBA'}
                                        </p>
                                        <p style={{ margin: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            👥 {event.registrations_count || 0}/{event.capacity} registered
                                        </p>
                                    </div>
                                </div>
                                <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleEdit(event)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: '#e0e7ff',
                                            color: '#4338ca',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: '#fee2e2',
                                            color: '#dc2626',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-modern">
                        <div className="modal-header">
                            <h2>{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingEvent(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Title *</label>
                                    <input className="form-input" type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Start Date *</label>
                                        <input className="form-input" type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Date</label>
                                        <input className="form-input" type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Location</label>
                                        <input className="form-input" type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Capacity</label>
                                        <input className="form-input" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })} min="1" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                            <option value="academic">Academic</option>
                                            <option value="social">Social</option>
                                            <option value="sports">Sports</option>
                                            <option value="cultural">Cultural</option>
                                            <option value="career">Career</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input type="checkbox" checked={form.is_paid} onChange={e => setForm({ ...form, is_paid: e.target.checked })} />
                                            Paid Event
                                        </label>
                                        {form.is_paid && (
                                            <input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} placeholder="Price (₺)" min="0" step="0.01" style={{ marginTop: '8px' }} />
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingEvent(null); }}>Cancel</button>
                                <button type="submit" className="btn-primary-gradient">{editingEvent ? 'Update Event' : 'Create Event'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
