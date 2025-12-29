/**
 * Clubs Page
 * Student clubs listing with join/leave functionality
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../config/api';
import { Users, MapPin, Calendar, Mail, ExternalLink, Plus, Check, LogOut } from 'lucide-react';

const categoryColors = {
    technology: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    arts: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    academic: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    sports: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    volunteer: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    cultural: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    social: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    general: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
};

const categoryIcons = {
    technology: '🤖',
    arts: '🎨',
    academic: '📚',
    sports: '⚽',
    volunteer: '🤝',
    cultural: '🌍',
    social: '🎉',
    general: '🏛️'
};

export default function ClubsPage() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useAuth();
    const [clubs, setClubs] = useState([]);
    const [myClubs, setMyClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [activeTab, setActiveTab] = useState('all');
    const [joiningClub, setJoiningClub] = useState(null);

    const categories = ['all', 'technology', 'arts', 'academic', 'sports', 'volunteer', 'cultural'];

    useEffect(() => {
        fetchClubs();
        if (user) {
            fetchMyClubs();
        }
    }, [user, selectedCategory]);

    const fetchClubs = async () => {
        try {
            setLoading(true);
            const params = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
            const response = await api.get(`/clubs${params}`);
            if (response.data.success) {
                // Controller returns { data: [clubs] } not { data: { clubs: [] } }
                setClubs(Array.isArray(response.data.data) ? response.data.data : []);
            }
        } catch (error) {
            console.error('Error fetching clubs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyClubs = async () => {
        try {
            const response = await api.get('/clubs/user/my-clubs');
            if (response.data.success) {
                setMyClubs(response.data.data.clubs || []);
            }
        } catch (error) {
            console.error('Error fetching my clubs:', error);
        }
    };

    const handleJoinClub = async (clubId) => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            setJoiningClub(clubId);
            await api.post(`/clubs/${clubId}/join`);
            await fetchClubs();
            await fetchMyClubs();
        } catch (error) {
            console.error('Error joining club:', error);
            alert(error.response?.data?.message || 'Failed to join club');
        } finally {
            setJoiningClub(null);
        }
    };

    const handleLeaveClub = async (clubId) => {
        try {
            setJoiningClub(clubId);
            await api.delete(`/clubs/${clubId}/leave`);
            await fetchClubs();
            await fetchMyClubs();
        } catch (error) {
            console.error('Error leaving club:', error);
            alert(error.response?.data?.message || 'Failed to leave club');
        } finally {
            setJoiningClub(null);
        }
    };

    const isMember = (clubId) => {
        return myClubs.some(c => c.id === clubId);
    };

    const displayClubs = activeTab === 'my' ? myClubs : clubs;

    if (authLoading) {
        return null;
    }

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>Student Clubs - Smart Campus</title>
            </Head>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-in slide-in-from-bottom-2 duration-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Users className="h-6 w-6 text-blue-600" />
                        Student Clubs
                    </h1>
                    <p className="mt-1 text-gray-500">Join clubs, meet people, and pursue your passions</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    All Clubs
                </button>
                {user && (
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === 'my'
                            ? 'bg-slate-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        My Clubs ({myClubs.length})
                    </button>
                )}
            </div>

            {/* Category Filter (only for All Clubs) */}
            {activeTab === 'all' && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${selectedCategory === cat
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat === 'all' ? '🏛️ All' : `${categoryIcons[cat] || '📁'} ${cat}`}
                        </button>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-3xl font-bold text-gray-900">{clubs.length}</div>
                    <div className="text-sm text-gray-500">Total Clubs</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-3xl font-bold text-blue-600">{myClubs.length}</div>
                    <div className="text-sm text-gray-500">My Memberships</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-3xl font-bold text-green-600">
                        {clubs.reduce((sum, c) => sum + (c.member_count || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-500">Total Members</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-3xl font-bold text-purple-600">{categories.length - 1}</div>
                    <div className="text-sm text-gray-500">Categories</div>
                </div>
            </div>

            {/* Clubs Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 text-sm">Loading clubs...</p>
                </div>
            ) : displayClubs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {activeTab === 'my' ? 'No Memberships Yet' : 'No Clubs Found'}
                    </h3>
                    <p className="text-gray-500 max-w-sm mx-auto text-sm">
                        {activeTab === 'my'
                            ? 'Join a club to see it here!'
                            : 'No clubs match your filter criteria.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayClubs.map(club => {
                        const colors = categoryColors[club.category] || categoryColors.general;
                        const memberStatus = isMember(club.id);

                        return (
                            <div
                                key={club.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group"
                            >
                                {/* Club Header */}
                                <div className={`p-6 ${colors.bg} border-b ${colors.border}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="text-4xl mb-2">{categoryIcons[club.category] || '🏛️'}</div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${colors.text} ${colors.bg} border ${colors.border}`}>
                                            {club.category}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">{club.name}</h3>
                                </div>

                                {/* Club Body */}
                                <div className="p-6">
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{club.description}</p>

                                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            <span>{club.member_count || 0} members</span>
                                            {club.max_members && <span className="text-gray-400">/ {club.max_members} max</span>}
                                        </div>
                                        {club.meeting_schedule && (
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{club.meeting_schedule}</span>
                                            </div>
                                        )}
                                        {club.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{club.location}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    {user ? (
                                        memberStatus ? (
                                            <button
                                                onClick={() => handleLeaveClub(club.id)}
                                                disabled={joiningClub === club.id}
                                                className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                {joiningClub === club.id ? (
                                                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <LogOut className="w-4 h-4" />
                                                        Leave Club
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleJoinClub(club.id)}
                                                disabled={joiningClub === club.id || (club.max_members && club.member_count >= club.max_members)}
                                                className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm bg-slate-900 text-white hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {joiningClub === club.id ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : club.max_members && club.member_count >= club.max_members ? (
                                                    'Club Full'
                                                ) : (
                                                    <>
                                                        <Plus className="w-4 h-4" />
                                                        Join Club
                                                    </>
                                                )}
                                            </button>
                                        )
                                    ) : (
                                        <Link
                                            href="/login"
                                            className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            Login to Join
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </DashboardLayout>
    );
}
