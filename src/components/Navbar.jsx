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
                {userData && <NotificationsPopover />}

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
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            router.push('/admin/scheduling');
                                        }}
                                    >
                                        <span className="item-icon">🗓️</span>
                                        Schedule Generator
                                    </button>
                                    <div className="dropdown-divider"></div>
                                </>
                            )}

                            {/* Staff/Admin QR Scanner */}
                            {['admin', 'staff', 'faculty'].includes(userData?.role) && (
                                <>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            router.push('/staff/scan');
                                        }}
                                    >
                                        <span className="item-icon">📱</span>
                                        QR Scanner
                                    </button>
                                    <div className="dropdown-divider"></div>
                                </>
                            )}

                            {/* Faculty Links */}
                            {userData?.role === 'faculty' && (
                                <>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            router.push('/attendance-open');
                                        }}
                                    >
                                        <span className="item-icon">📋</span>
                                        My Sessions
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            router.push('/excuse-management');
                                        }}
                                    >
                                        <span className="item-icon">📩</span>
                                        Excuse Requests
                                    </button>
                                    <div className="dropdown-divider"></div>
                                </>
                            )}

                            {/* Student Links */}
                            {userData?.role === 'student' && (
                                <>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            router.push('/my-courses');
                                        }}
                                    >
                                        <span className="item-icon">📚</span>
                                        My Courses
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            router.push('/my-grades');
                                        }}
                                    >
                                        <span className="item-icon">📊</span>
                                        Grades & Transcript
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            router.push('/my-excuses');
                                        }}
                                    >
                                        <span className="item-icon">📝</span>
                                        My Excuses
                                    </button>

                                    <div className="dropdown-divider"></div>
                                </>
                            )}

                            <button
                                className="dropdown-item"
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    router.push('/wallet');
                                }}
                            >
                                <span className="item-icon">💳</span>
                                My Wallet
                            </button>
                            <button
                                className="dropdown-item"
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    router.push('/meals');
                                }}
                            >
                                <span className="item-icon">🍽️</span>
                                Meals
                            </button>
                            <button
                                className="dropdown-item"
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    router.push('/events');
                                }}
                            >
                                <span className="item-icon">🎉</span>
                                Events
                            </button>
                            <button
                                className="dropdown-item"
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    router.push('/schedule');
                                }}
                            >
                                <span className="item-icon">📅</span>
                                Schedule
                            </button>
                            <div className="dropdown-divider"></div>

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
