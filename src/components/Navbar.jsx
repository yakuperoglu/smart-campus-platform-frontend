import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import NotificationsPopover from './NotificationsPopover';

const Navbar = ({ userData: propUserData }) => {
    const router = useRouter();
    const { logout, user: authUser } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Use prop userData if provided, otherwise use auth context user
    const userData = propUserData || authUser;

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;

        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
        const rootUrl = apiBase.replace(/\/api\/v1\/?$/, '');

        return `${rootUrl}${url}`;
    };

    // Helper to get initials or placeholder if no image
    const renderAvatar = () => {
        if (userData?.profile_picture_url) {
            return (
                <img
                    src={getImageUrl(userData.profile_picture_url)}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
            );
        }
        return (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {userData?.email?.charAt(0).toUpperCase()}
            </div>
        );
    };

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" style={{ textDecoration: 'none' }} prefetch={false}>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">🎓 Smart Campus</h1>
                </Link>
            </div>
            <div className="flex items-center gap-4">
                {userData && <NotificationsPopover />}

                <div className="relative">
                    <button
                        className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors focus:outline-none"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        {renderAvatar()}
                        <div className="text-left hidden md:block">
                            <span className="block text-sm font-semibold text-gray-900 leading-tight">
                                {userData?.first_name || userData?.email?.split('@')[0] || userData?.email || 'User'}
                            </span>
                        </div>
                        <span className="text-gray-400 text-xs">▼</span>
                    </button>

                    {showProfileMenu && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-900 truncate">{userData?.email}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-xs font-semibold text-gray-600 rounded uppercase tracking-wider">
                                    {userData?.role}
                                </span>
                            </div>

                            <div className="py-1">
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                        router.push('/profile');
                                    }}
                                >
                                    <span className="text-lg">👤</span>
                                    My Profile
                                </button>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                        handleLogout();
                                    }}
                                >
                                    <span className="text-lg">🚪</span>
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
