import { useState, useEffect } from 'react';
import { Search, Bell, Menu, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function TopNavbar({ collapsed, setCollapsed, user, onLogout }) {
    const [notifications, setNotifications] = useState([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Mock notifications for now (would invoke WebSocket here in real app)
    useEffect(() => {
        setNotifications([
            { id: 1, title: 'New Grade Posted', message: 'Calculus II Midterm results are out.', time: '2m ago', read: false },
            { id: 2, title: 'Event Reminder', message: 'hackathon starts in 1 hour.', time: '1h ago', read: true },
        ]);
    }, []);

    return (
        <header className={`h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 right-0 z-20 transition-all duration-300 ease-in-out ${collapsed ? 'left-20' : 'left-64'} flex items-center justify-between px-6`}>

            {/* Left: Search & Toggle */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                    {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </button>

                <div className="relative w-full max-w-md hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search courses, events, or resources..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">

                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative"
                    >
                        <Bell className="h-5 w-5" />
                        {notifications.some(n => !n.read) && (
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                                <span className="text-xs text-blue-600 cursor-pointer">Mark all read</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.map(n => (
                                    <div key={n.id} className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}>
                                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-gray-100">
                            {user?.first_name ? user.first_name[0] : 'U'}
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-in fade-in slide-in-from-top-2">
                            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile Settings</Link>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                                onClick={onLogout}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                Log Out
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
}
