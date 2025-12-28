import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '../../config/api';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';

export default function AdminMenus() {
    const router = useRouter();
    const { user } = useAuth();
    const [menus, setMenus] = useState([]);
    const [cafeterias, setCafeterias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMenu, setEditingMenu] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const [form, setForm] = useState({
        cafeteria_id: '',
        date: '',
        type: 'lunch',
        items_json: [],
        price: 0,
        max_reservations: 500,
        is_published: true
    });

    const [newItem, setNewItem] = useState({ name: '', category: 'main' });

    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/dashboard');
        } else if (user) {
            fetchMenus();
            fetchCafeterias();
        }
    }, [user, router]);

    const fetchMenus = async () => {
        setLoading(true);
        try {
            const res = await api.get('/meals/menus');
            if (res.data.success) {
                setMenus(res.data.data.menus || res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching menus:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCafeterias = async () => {
        try {
            const res = await api.get('/meals/cafeterias');
            if (res.data.success) {
                setCafeterias(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching cafeterias:', error);
        }
    };

    const resetForm = () => {
        setForm({
            cafeteria_id: cafeterias[0]?.id || '',
            date: '',
            type: 'lunch',
            items_json: [],
            price: 0,
            max_reservations: 500,
            is_published: true
        });
    };

    const handleAddItem = () => {
        if (newItem.name.trim()) {
            setForm({ ...form, items_json: [...form.items_json, { ...newItem }] });
            setNewItem({ name: '', category: 'main' });
        }
    };

    const handleRemoveItem = (index) => {
        setForm({ ...form, items_json: form.items_json.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMenu) {
                await api.put(`/meals/menus/${editingMenu.id}`, form);
                setFeedback({ type: 'success', message: 'Menu updated successfully!' });
            } else {
                await api.post('/meals/menus', form);
                setFeedback({ type: 'success', message: 'Menu created successfully!' });
            }
            setShowForm(false);
            setEditingMenu(null);
            resetForm();
            fetchMenus();
        } catch (error) {
            setFeedback({ type: 'error', message: error.response?.data?.message || 'Failed to save menu' });
        }
    };

    const handleEdit = (menu) => {
        setEditingMenu(menu);
        setForm({
            cafeteria_id: menu.cafeteria_id,
            date: menu.date?.slice(0, 10) || '',
            type: menu.type || 'lunch',
            items_json: menu.items_json || [],
            price: menu.price || 0,
            max_reservations: menu.max_reservations || 500,
            is_published: menu.is_published !== false
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this menu?')) return;
        try {
            await api.delete(`/meals/menus/${id}`);
            setFeedback({ type: 'success', message: 'Menu deleted!' });
            fetchMenus();
        } catch (error) {
            setFeedback({ type: 'error', message: 'Failed to delete menu' });
        }
    };

    const getMealTypeIcon = (type) => {
        switch (type) {
            case 'breakfast': return '🌅';
            case 'lunch': return '☀️';
            case 'dinner': return '🌙';
            default: return '🍽️';
        }
    };

    if (!user || user.role !== 'admin') {
        return <div>Access denied. Admin only.</div>;
    }

    return (
        <div className="admin-page-container">
            <Head>
                <title>Menu Management | Admin | Smart Campus</title>
            </Head>
            <Navbar userData={user} />

            <div className="admin-content">
                <div className="admin-header">
                    <div className="admin-header-left">
                        <h1>🍽️ Menu Management</h1>
                        <p>Create and manage cafeteria menus</p>
                    </div>
                    <button className="btn-primary-gradient" onClick={() => { resetForm(); setEditingMenu(null); setShowForm(true); }}>
                        + Create Menu
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
                        <div className="stat-icon green">🍽️</div>
                        <div className="stat-info">
                            <h3>{menus.length}</h3>
                            <p>Total Menus</p>
                        </div>
                    </div>
                    <div className="stat-card-modern">
                        <div className="stat-icon blue">🏪</div>
                        <div className="stat-info">
                            <h3>{cafeterias.length}</h3>
                            <p>Cafeterias</p>
                        </div>
                    </div>
                    <div className="stat-card-modern">
                        <div className="stat-icon purple">✅</div>
                        <div className="stat-info">
                            <h3>{menus.filter(m => m.is_published).length}</h3>
                            <p>Published</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading menus...</p>
                    </div>
                ) : menus.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🍽️</div>
                        <h3>No menus yet</h3>
                        <p>Create your first cafeteria menu!</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <div className="table-header">
                            <h2>All Menus</h2>
                        </div>
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Cafeteria</th>
                                    <th>Type</th>
                                    <th>Items</th>
                                    <th>Price</th>
                                    <th>Reservations</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {menus.map(menu => (
                                    <tr key={menu.id}>
                                        <td style={{ fontWeight: '600' }}>{new Date(menu.date).toLocaleDateString()}</td>
                                        <td>{menu.cafeteria?.name || '-'}</td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {getMealTypeIcon(menu.type)} {menu.type}
                                            </span>
                                        </td>
                                        <td>{menu.items_json?.length || 0} items</td>
                                        <td style={{ fontWeight: '600' }}>₺{menu.price}</td>
                                        <td>{menu.current_reservations || 0}/{menu.max_reservations}</td>
                                        <td>
                                            <span className={`badge ${menu.is_published ? 'badge-verified' : 'badge-pending'}`}>
                                                {menu.is_published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="btn-action edit" onClick={() => handleEdit(menu)}>✏️</button>
                                                <button className="btn-action delete" onClick={() => handleDelete(menu.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-modern" style={{ maxWidth: '640px' }}>
                        <div className="modal-header">
                            <h2>{editingMenu ? 'Edit Menu' : 'Create Menu'}</h2>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingMenu(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Cafeteria *</label>
                                        <select className="form-select" value={form.cafeteria_id} onChange={e => setForm({ ...form, cafeteria_id: e.target.value })} required>
                                            <option value="">Select Cafeteria</option>
                                            {cafeterias.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Date *</label>
                                        <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Meal Type</label>
                                        <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                            <option value="breakfast">🌅 Breakfast</option>
                                            <option value="lunch">☀️ Lunch</option>
                                            <option value="dinner">🌙 Dinner</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Price (₺)</label>
                                        <input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} min="0" step="0.01" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Max Reservations</label>
                                    <input className="form-input" type="number" value={form.max_reservations} onChange={e => setForm({ ...form, max_reservations: parseInt(e.target.value) })} min="1" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Menu Items</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                        {form.items_json.map((item, i) => (
                                            <span key={i} style={{
                                                background: '#e0e7ff',
                                                color: '#3730a3',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                {item.name}
                                                <button type="button" onClick={() => handleRemoveItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            className="form-input"
                                            type="text"
                                            value={newItem.name}
                                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                            placeholder="Item name"
                                            style={{ flex: 1 }}
                                        />
                                        <select className="form-select" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} style={{ width: '120px' }}>
                                            <option value="soup">Soup</option>
                                            <option value="main">Main</option>
                                            <option value="side">Side</option>
                                            <option value="dessert">Dessert</option>
                                            <option value="drink">Drink</option>
                                        </select>
                                        <button type="button" onClick={handleAddItem} className="btn-success" style={{ padding: '10px 16px' }}>Add</button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
                                        <span className="form-label" style={{ margin: 0 }}>Published</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingMenu(null); }}>Cancel</button>
                                <button type="submit" className="btn-primary-gradient">{editingMenu ? 'Update Menu' : 'Create Menu'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
