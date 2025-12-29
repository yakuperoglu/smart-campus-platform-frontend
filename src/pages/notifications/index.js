import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Bell, Settings, Filter, Trash2, Check, Mail, MessageSquare, AlertTriangle, XCircle, Info, CheckCircle2 } from 'lucide-react';
import notificationService from '../../services/notificationService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function NotificationsPage() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchNotifications();
        }
    }, [user, authLoading, router]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications({ limit: 50 });
            setNotifications(data.data || []);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this notification?')) return;
        try {
            await notificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        return true;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <div className="p-2 bg-green-100 text-green-600 rounded-full flex-shrink-0"><CheckCircle2 className="h-5 w-5" /></div>;
            case 'warning': return <div className="p-2 bg-amber-100 text-amber-600 rounded-full flex-shrink-0"><AlertTriangle className="h-5 w-5" /></div>;
            case 'error': return <div className="p-2 bg-red-100 text-red-600 rounded-full flex-shrink-0"><XCircle className="h-5 w-5" /></div>;
            default: return <div className="p-2 bg-blue-100 text-blue-600 rounded-full flex-shrink-0"><Bell className="h-5 w-5" /></div>;
        }
    };

    if (authLoading || !user) return null;

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>Notifications | Smart Campus</title>
            </Head>

            <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Bell className="h-6 w-6 text-indigo-600" />
                            Notification Center
                        </h1>
                        <p className="mt-1 text-gray-500">Stay updated with your latest alerts and messages</p>
                    </div>
                    <button
                        onClick={() => router.push('/notifications/settings')}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-fit">
                    <button
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'all'
                                ? 'bg-gray-100 text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        onClick={() => setFilter('all')}
                    >
                        All Notifications
                    </button>
                    <button
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'unread'
                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        onClick={() => setFilter('unread')}
                    >
                        Unread
                    </button>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="h-8 w-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                            </h3>
                            <p className="text-gray-500">You're all caught up!</p>
                        </div>
                    ) : (
                        filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`group bg-white rounded-xl p-4 border transition-all duration-200 hover:shadow-md ${!notification.is_read
                                        ? 'border-blue-200 bg-blue-50/10 shadow-sm border-l-4 border-l-blue-500 pl-[13px]'
                                        : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={`text-sm font-bold ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${!notification.is_read ? 'text-gray-800' : 'text-gray-500'}`}>
                                            {notification.message}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notification.is_read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notification.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
