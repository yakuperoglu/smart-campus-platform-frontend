import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Utensils,
    Plus,
    Calendar,
    Coffee,
    Sun,
    Moon,
    DollarSign,
    Trash2,
    Edit2,
    Check,
    X,
    Search,
    ShoppingBag
} from 'lucide-react';
import api from '../../config/api';
import mealService from '../../services/mealService';
import DashboardLayout from '../../components/layout/DashboardLayout';
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
            const res = await mealService.getMenus();
            if (res.success) {
                setMenus(res.data.menus || res.data || []);
            }
        } catch (error) {
            console.error('Error fetching menus:', error);
            setFeedback({ type: 'error', message: 'Failed to fetch menus' });
        } finally {
            setLoading(false);
        }
    };

    const fetchCafeterias = async () => {
        try {
            const res = await mealService.getCafeterias();
            if (res.success) {
                setCafeterias(res.data || []);
            }
        } catch (error) {
            console.error('Error fetching cafeterias:', error);
            setFeedback({ type: 'error', message: 'Failed to fetch cafeterias. Please ensure backend is running.' });
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
                await mealService.updateMenu(editingMenu.id, form);
                setFeedback({ type: 'success', message: 'Menu updated successfully!' });
            } else {
                await mealService.createMenu(form);
                setFeedback({ type: 'success', message: 'Menu created successfully!' });
            }
            setShowForm(false);
            setEditingMenu(null);
            resetForm();
            fetchMenus();
        } catch (error) {
            setFeedback({ type: 'error', message: error.message || 'Failed to save menu' });
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
            await mealService.deleteMenu(id);
            setFeedback({ type: 'success', message: 'Menu deleted!' });
            fetchMenus();
        } catch (error) {
            setFeedback({ type: 'error', message: 'Failed to delete menu' });
        }
    };

    const getMealTypeIcon = (type) => {
        switch (type) {
            case 'breakfast': return <Coffee className="h-4 w-4" />;
            case 'lunch': return <Sun className="h-4 w-4" />;
            case 'dinner': return <Moon className="h-4 w-4" />;
            default: return <Utensils className="h-4 w-4" />;
        }
    };

    if (!user || user.role !== 'admin') return null;

    return (
        <DashboardLayout user={user}>
            <Head>
                <title>Menu Management | Admin | Smart Campus</title>
            </Head>

            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Utensils className="h-6 w-6 text-orange-500" />
                            Menu Management
                        </h1>
                        <p className="mt-1 text-gray-500">Create and schedule cafeteria menus</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setEditingMenu(null); setShowForm(true); }}
                        className="btn-primary-gradient flex items-center justify-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Create Menu
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
                            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                                <Utensils className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{menus.length}</h3>
                                <p className="text-sm text-gray-500">Total Menus</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <ShoppingBag className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{cafeterias.length}</h3>
                                <p className="text-sm text-gray-500">Cafeterias</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-lg text-green-600">
                                <Check className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{menus.filter(m => m.is_published).length}</h3>
                                <p className="text-sm text-gray-500">Published</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">All Menus</h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading menus...</p>
                        </div>
                    ) : menus.length === 0 ? (
                        <div className="text-center py-12">
                            <Utensils className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No menus yet</h3>
                            <p className="text-gray-500 mt-1">Create your first cafeteria menu.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Cafeteria</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Items</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {menus.map(menu => (
                                        <tr key={menu.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {new Date(menu.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {menu.cafeteria?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                                                    {getMealTypeIcon(menu.type)}
                                                    {menu.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {menu.items_json?.length || 0} items
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                ₺{menu.price}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${menu.is_published
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {menu.is_published ? 'Published' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(menu)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(menu.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
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
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowForm(false)} aria-hidden="true"></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-start mb-5">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                            {editingMenu ? 'Edit Menu' : 'Create New Menu'}
                                        </h3>
                                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-500">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Cafeteria</label>
                                                <select
                                                    value={form.cafeteria_id}
                                                    onChange={e => setForm({ ...form, cafeteria_id: e.target.value })}
                                                    required
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                                >
                                                    <option value="">Select Cafeteria</option>
                                                    {cafeterias.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                                <input
                                                    type="date"
                                                    value={form.date}
                                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                                    required
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                                                <select
                                                    value={form.type}
                                                    onChange={e => setForm({ ...form, type: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                                >
                                                    <option value="breakfast">Breakfast</option>
                                                    <option value="lunch">Lunch</option>
                                                    <option value="dinner">Dinner</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₺)</label>
                                                <input
                                                    type="number"
                                                    value={form.price}
                                                    onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Menu Items</label>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {form.items_json.map((item, i) => (
                                                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-50 text-orange-700 border border-orange-100">
                                                        {item.name}
                                                        <button type="button" onClick={() => handleRemoveItem(i)} className="ml-2 hover:text-orange-900">
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newItem.name}
                                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                                    placeholder="Item name"
                                                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                                />
                                                <select
                                                    value={newItem.category}
                                                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                                    className="w-32 rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                                >
                                                    <option value="soup">Soup</option>
                                                    <option value="main">Main</option>
                                                    <option value="side">Side</option>
                                                    <option value="dessert">Dessert</option>
                                                    <option value="drink">Drink</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={handleAddItem}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={form.is_published}
                                                    onChange={e => setForm({ ...form, is_published: e.target.checked })}
                                                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Published</span>
                                            </label>
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
                                                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700"
                                            >
                                                {editingMenu ? 'Save Changes' : 'Create Menu'}
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
