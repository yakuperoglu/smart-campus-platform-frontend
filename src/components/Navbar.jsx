import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

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
                    className="nav-avatar"
                />
            );
        }
        return (
            <div className="nav-avatar-placeholder">
                {userData?.email?.charAt(0).toUpperCase()}
            </div>
        );
    };

    return (
        <nav className="dashboard-nav">
            <div className="nav-brand">
                <Link href="/dashboard" style={{ textDecoration: 'none' }} prefetch={false}>
                    <h1>🎓 Smart Campus</h1>
                </Link>
            </div>
            <div className="nav-actions">
                {/* Simple navigation links could go here if needed */}

                <div className="profile-menu-container">
                    <button
                        className="profile-menu-button"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        {renderAvatar()}
                        <span className="profile-name">
                            {userData?.first_name || userData?.email?.split('@')[0] || userData?.email || 'User'}
                        </span>
                        <span className="dropdown-arrow">▼</span>
                    </button>

                    {showProfileMenu && (
                        <div className="profile-dropdown">
                            <div className="dropdown-header">
                                <p className="dropdown-email">{userData?.email}</p>
                                <span className="dropdown-role">{userData?.role?.toUpperCase()}</span>
                            </div>
                            <div className="dropdown-divider"></div>

                            {/* Admin Panel Link */}
                            {userData?.role === 'admin' && (
                                <>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            router.push('/admin/courses');
                                        }}
                                    >
                                        <span className="item-icon">⚙️</span>
                                        Admin Panel
                                    </button>
                                    <div className="dropdown-divider"></div>
                                </>
                            )}

                            <button
                                className="dropdown-item"
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    router.push('/profile');
                                }}
                            >
                                <span className="item-icon">👤</span>
                                My Profile
                            </button>
                            <div className="dropdown-divider"></div>
                            <button
                                className="dropdown-item logout-item"
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    handleLogout();
                                }}
                            >
                                <span className="item-icon">🚪</span>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
