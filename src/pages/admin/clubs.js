import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Users,
    MapPin,
    Calendar,
    Mail,
    Search,
    Plus,
    Trash2,
    Edit,
    X
} from 'lucide-react';
import clubService from '../../services/clubService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function ClubManagement() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentClub, setCurrentClub] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'general',
        image_url: '',
        president_id: '',
        advisor_id: '',
        location: '',
        meeting_schedule: '',
        max_members: '',
        contact_email: '',
        social_links: {}
    });
    const [saving, setSaving] = useState(false);

    const categories = ['technology', 'arts', 'academic', 'sports', 'volunteer', 'cultural', 'social', 'general'];

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
        } else if (user) {
            fetchClubs();
        }
    }, [user, authLoading, router, categoryFilter]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (user && user.role === 'admin') fetchClubs();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchClubs = async () => {
        setLoading(true);
        try {
            const params = {
                search,
                category: categoryFilter !== 'all' ? categoryFilter : undefined
            };
            const res = await clubService.getAllClubs(params);
            if (res.data.success) {
                setClubs(res.data.data.clubs);
            }
        } catch (error) {
            console.error('Fetch clubs error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (clubId) => {
        if (!window.confirm('Are you sure you want to delete this club? This action cannot be undone.')) return;
        try {
            await clubService.deleteClub(clubId);
            setClubs(clubs.filter(c => c.id !== clubId));
        } catch (error) {
            alert('Failed to delete club');
            console.error(error);
        }
    };

    const handleEditClick = (club) => {
        setIsEditing(true);
        setCurrentClub(club);
        setFormData({
            name: club.name || '',
            description: club.description || '',
            category: club.category || 'general',
            image_url: club.image_url || '',
            president_id: club.president_id || '',
            advisor_id: club.advisor_id || '',
            location: club.location || '',
            meeting_schedule: club.meeting_schedule || '',
            max_members: club.max_members || '',
            contact_email: club.contact_email || '',
            social_links: club.social_links || {}
        });
        setShowModal(true);
    };

    const handleCreateClick = () => {
        setIsEditing(false);
        setCurrentClub(null);
        setFormData({
            name: '',
            description: '',
            category: 'general',
            image_url: '',
            president_id: '',
            advisor_id: '',
            location: '',
            meeting_schedule: '',
            max_members: '',
            contact_email: '',
            social_links: {}
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                await clubService.updateClub(currentClub.id, formData);
                alert('Club updated successfully');
            } else {
                await clubService.createClub(formData);
                alert('Club created successfully');
            }
            setShowModal(false);
            fetchClubs();
        } catch (error) {
            console.error('Save error:', error);
            alert(error.response?.data?.message || 'Failed to save club');
        } finally {
            setSaving(false);
        }
    };

    const getCategoryBadgeClass = (cat) => {
        const colors = {
            technology: 'bg-blue-100 text-blue-800',
            arts: 'bg-purple-100 text-purple-800',
            academic: 'bg-green-100 text-green-800',
            sports: 'bg-orange-100 text-orange-800',
            volunteer: 'bg-pink-100 text-pink-800',
            cultural: 'bg-yellow-100 text-yellow-800',
            social: 'bg-teal-100 text-teal-800',
            general: 'bg-gray-100 text-gray-800'
        };
        return colors[cat] || colors.general;
    };

    if (authLoading || !user || user.role !== 'admin') return null;

    return (
        <DashboardLayout user={user}>
            <Head>
                <title>Club Management | Admin | Smart Campus</title>
            </Head>

            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Users className="h-6 w-6 text-blue-600" />
                            Club Management
                        </h1>
                        <p className="mt-1 text-gray-500">Manage student organizations and clubs</p>
                    </div>
                    <button
                        onClick={handleCreateClick}
                        className="btn-primary-gradient flex items-center justify-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Create New Club
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search clubs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat} className="capitalize">{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Clubs List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                            Loading clubs...
                        </div>
                    ) : clubs.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No clubs found</h3>
                            <p className="text-gray-500 mt-1">Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Club Name</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Leadership</th>
                                        <th className="px-6 py-4">Location & Time</th>
                                        <th className="px-6 py-4">Members</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {clubs.map(club => (
                                        <tr key={club.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{club.name}</div>
                                                <div className="text-sm text-gray-500 truncate max-w-xs">{club.description}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${getCategoryBadgeClass(club.category)}`}>
                                                    {club.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="text-gray-900 font-medium">Pres: {club.president ? `${club.president.first_name} ${club.president.last_name}` : 'N/A'}</div>
                                                <div className="text-gray-500">Adv: {club.advisor ? `${club.advisor.first_name} ${club.advisor.last_name}` : 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {club.location || 'N/A'}</div>
                                                <div className="flex items-center gap-1.5 mt-1"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {club.meeting_schedule || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900">{club.member_count}</span>
                                                    {club.max_members && <span className="text-gray-400">/ {club.max_members}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(club)}
                                                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(club.id)}
                                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} aria-hidden="true"></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-start mb-5">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                            {isEditing ? 'Edit Club' : 'Create New Club'}
                                        </h3>
                                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSave} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <textarea
                                                    rows={3}
                                                    value={formData.description}
                                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                                <select
                                                    value={formData.category}
                                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 capitalize"
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Members</label>
                                                <input
                                                    type="number"
                                                    value={formData.max_members}
                                                    onChange={e => setFormData({ ...formData, max_members: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="Optional"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">President ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.president_id}
                                                    onChange={e => setFormData({ ...formData, president_id: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="User UUID"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Advisor ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.advisor_id}
                                                    onChange={e => setFormData({ ...formData, advisor_id: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="User UUID"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                                <input
                                                    type="text"
                                                    value={formData.location}
                                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Schedule</label>
                                                <input
                                                    type="text"
                                                    value={formData.meeting_schedule}
                                                    onChange={e => setFormData({ ...formData, meeting_schedule: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="e.g. Fridays 15:00"
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.contact_email}
                                                    onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                                <input
                                                    type="text"
                                                    value={formData.image_url}
                                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => setShowModal(false)}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {saving ? 'Saving...' : isEditing ? 'Update Club' : 'Create Club'}
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
