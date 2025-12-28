import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import clubService from '../../services/clubService';
import { useRouter } from 'next/router';
import { Users, MapPin, Calendar, Mail, Search, Plus, Trash2, Edit } from 'lucide-react';

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

    if (authLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>Club Management | Admin | Smart Campus</title>
            </Head>
            <Navbar userData={user} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">🏢 Club Management</h1>
                        <p className="text-gray-500 mt-1">Manage student organizations and clubs</p>
                    </div>
                    <button
                        onClick={handleCreateClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Club
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading clubs...</div>
                    ) : clubs.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <div className="mb-3 text-4xl">📭</div>
                            No clubs found matching your criteria.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-sm font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Club Name</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Leadership</th>
                                        <th className="px-6 py-4">Location & Time</th>
                                        <th className="px-6 py-4">Members</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {clubs.map(club => (
                                        <tr key={club.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{club.name}</div>
                                                <div className="text-sm text-gray-500 truncate max-w-xs">{club.description}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${getCategoryBadgeClass(club.category)}`}>
                                                    {club.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="text-gray-900">Pres: {club.president ? `${club.president.first_name} ${club.president.last_name}` : 'N/A'}</div>
                                                <div className="text-gray-500">Adv: {club.advisor ? `${club.advisor.first_name} ${club.advisor.last_name}` : 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {club.location || 'N/A'}</div>
                                                <div className="flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" /> {club.meeting_schedule || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span>{club.member_count}</span>
                                                    {club.max_members && <span className="text-gray-400">/ {club.max_members}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(club)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(club.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-900">
                                {isEditing ? 'Edit Club' : 'Create New Club'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none capitalize"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Optional"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">President ID</label>
                                    <input
                                        type="text"
                                        value={formData.president_id}
                                        onChange={e => setFormData({ ...formData, president_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="User UUID"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Advisor ID</label>
                                    <input
                                        type="text"
                                        value={formData.advisor_id}
                                        onChange={e => setFormData({ ...formData, advisor_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="User UUID"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Schedule</label>
                                    <input
                                        type="text"
                                        value={formData.meeting_schedule}
                                        onChange={e => setFormData({ ...formData, meeting_schedule: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. Fridays 15:00"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                    <input
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                    <input
                                        type="text"
                                        value={formData.image_url}
                                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-4 mt-8 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : isEditing ? 'Update Club' : 'Create Club'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
