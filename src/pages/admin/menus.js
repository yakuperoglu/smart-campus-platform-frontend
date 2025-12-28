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

    if (!user || user.role !== 'admin') {
        return <div>Access denied. Admin only.</div>;
    }

    return (
        <div className="page-container">
            <Head>
                <title>Menu Management | Admin | Smart Campus</title>
            </Head>
            <Navbar userData={user} />

            <div className="content">
                <div className="header-row">
                    <h1>🍽️ Menu Management</h1>
                    <button className="btn-primary" onClick={() => { resetForm(); setEditingMenu(null); setShowForm(true); }}>
                        + Create Menu
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
                            <h2>{editingMenu ? 'Edit Menu' : 'Create Menu'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Cafeteria *</label>
                                        <select value={form.cafeteria_id} onChange={e => setForm({ ...form, cafeteria_id: e.target.value })} required>
                                            <option value="">Select Cafeteria</option>
                                            {cafeterias.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Date *</label>
                                        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Meal Type</label>
                                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                            <option value="breakfast">Breakfast</option>
                                            <option value="lunch">Lunch</option>
                                            <option value="dinner">Dinner</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Price (₺)</label>
                                        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} min="0" step="0.01" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Max Reservations</label>
                                    <input type="number" value={form.max_reservations} onChange={e => setForm({ ...form, max_reservations: parseInt(e.target.value) })} min="1" />
                                </div>
                                <div className="form-group">
                                    <label>Menu Items</label>
                                    <div className="items-list">
                                        {form.items_json.map((item, i) => (
                                            <div key={i} className="item-chip">
                                                <span>{item.name} ({item.category})</span>
                                                <button type="button" onClick={() => handleRemoveItem(i)}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="add-item-row">
                                        <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name" />
                                        <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                                            <option value="soup">Soup</option>
                                            <option value="main">Main</option>
                                            <option value="side">Side</option>
                                            <option value="dessert">Dessert</option>
                                            <option value="drink">Drink</option>
                                        </select>
                                        <button type="button" onClick={handleAddItem}>Add</button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>
                                        <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
                                        {' '}Published
                                    </label>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingMenu(null); }}>Cancel</button>
                                    <button type="submit" className="btn-primary">{editingMenu ? 'Update' : 'Create'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="loading">Loading menus...</div>
                ) : menus.length === 0 ? (
                    <div className="empty">No menus found. Create your first menu!</div>
                ) : (
                    <div className="table-wrapper">
                        <table>
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
                                        <td>{new Date(menu.date).toLocaleDateString()}</td>
                                        <td>{menu.cafeteria?.name || '-'}</td>
                                        <td className="capitalize">{menu.type}</td>
                                        <td>{menu.items_json?.length || 0} items</td>
                                        <td>₺{menu.price}</td>
                                        <td>{menu.current_reservations || 0}/{menu.max_reservations}</td>
                                        <td>
                                            <span className={`badge ${menu.is_published ? 'published' : 'draft'}`}>
                                                {menu.is_published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-icon" onClick={() => handleEdit(menu)}>✏️</button>
                                            <button className="btn-icon delete" onClick={() => handleDelete(menu.id)}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style jsx>{`
                .page-container { background: #f3f4f6; min-height: 100vh; }
                .content { max-width: 1200px; margin: 20px auto; padding: 20px; }
                .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                h1 { font-size: 1.75rem; font-weight: bold; color: #1a202c; }
                .btn-primary { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
                .btn-secondary { background: #e5e7eb; color: #374151; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
                .feedback { padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; }
                .feedback.success { background: #d1fae5; color: #065f46; }
                .feedback.error { background: #fee2e2; color: #991b1b; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal { background: white; padding: 30px; border-radius: 12px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
                .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .items-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
                .item-chip { background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 16px; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; }
                .item-chip button { background: none; border: none; cursor: pointer; font-size: 1rem; }
                .add-item-row { display: flex; gap: 8px; }
                .add-item-row input { flex: 1; }
                .add-item-row button { background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
                .table-wrapper { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
                table { width: 100%; border-collapse: collapse; }
                th { text-align: left; padding: 14px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 0.85rem; }
                td { padding: 14px; border-bottom: 1px solid #e5e7eb; }
                .capitalize { text-transform: capitalize; }
                .badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
                .badge.published { background: #d1fae5; color: #065f46; }
                .badge.draft { background: #fef3c7; color: #92400e; }
                .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 5px; }
                .btn-icon.delete:hover { color: #ef4444; }
                .loading, .empty { text-align: center; padding: 40px; color: #6b7280; }
            `}</style>
        </div>
    );
}
