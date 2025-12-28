import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Head from 'next/head';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth();
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
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return '📢';
        }
    };

    if (loading && notifications.length === 0) return <div className="p-loading">Loading...</div>;

    return (
        <>
            <Head>
                <title>Notifications - Smart Campus</title>
            </Head>
            <div className="page-container">
                <Navbar userData={user} />
                <div className="content">
                    <div className="header-row">
                        <h1>🔔 Notification Center</h1>
                        <div className="actions">
                            <button className="btn-secondary" onClick={() => router.push('/notifications/settings')}>
                                ⚙️ Settings
                            </button>
                        </div>
                    </div>

                    <div className="filters">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Unread
                        </button>
                    </div>

                    <div className="notification-list">
                        {filteredNotifications.length === 0 ? (
                            <div className="empty-state">No notifications found</div>
                        ) : (
                            filteredNotifications.map(notification => (
                                <div key={notification.id} className={`notification-card ${!notification.is_read ? 'unread' : ''}`}>
                                    <div className="icon-col">{getIcon(notification.type)}</div>
                                    <div className="content-col">
                                        <div className="n-header">
                                            <h3>{notification.title}</h3>
                                            <span className="date">{new Date(notification.created_at).toLocaleString()}</span>
                                        </div>
                                        <p>{notification.message}</p>
                                    </div>
                                    <div className="actions-col">
                                        {!notification.is_read && (
                                            <button className="btn-icon" onClick={() => handleMarkAsRead(notification.id)} title="Mark as read">
                                                ✔️
                                            </button>
                                        )}
                                        <button className="btn-icon delete" onClick={() => handleDelete(notification.id)} title="Delete">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <style jsx>{`
                    .page-container { min-height: 100vh; background: #f9fafb; }
                    .content { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }
                    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                    .filters { margin-bottom: 1.5rem; display: flex; gap: 0.5rem; }
                    .filter-btn { padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid #ddd; background: white; cursor: pointer; }
                    .filter-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
                    .notification-list { display: flex; flex-direction: column; gap: 1rem; }
                    .notification-card { 
                        display: flex; gap: 1rem; background: white; padding: 1rem; border-radius: 8px; 
                        box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #eee;
                    }
                    .notification-card.unread { border-left: 4px solid #3b82f6; background: #f0f9ff; }
                    .icon-col { font-size: 1.5rem; padding-top: 0.2rem; }
                    .content-col { flex: 1; }
                    .n-header { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
                    .n-header h3 { margin: 0; font-size: 1rem; color: #1f2937; }
                    .date { font-size: 0.8rem; color: #6b7280; }
                    .actions-col { display: flex; flex-direction: column; gap: 0.5rem; }
                    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px; border-radius: 4px; opacity: 0.6; transition: opacity 0.2s; }
                    .btn-icon:hover { opacity: 1; background: rgba(0,0,0,0.05); }
                    .btn-icon.delete:hover { background: #fee2e2; }
                    .btn-secondary { background: white; border: 1px solid #d1d5db; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500; }
                `}</style>
            </div>
        </>
    );
}
