
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import notificationService from '../services/notificationService';

export default function NotificationsPopover() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const popoverRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every minute
        const interval = setInterval(fetchNotifications, 60000);

        // Click outside to close
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            clearInterval(interval);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            if (data) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const handleToggle = () => {
        if (!isOpen) {
            // Re-fetch when expanding
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all notifications:', err);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        // Less than 24 hours
        if (diff < 86400000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'waitlist_promotion': return '🎉';
            case 'survey_reminder': return '📝';
            case 'grade_posted': return '📊';
            case 'schedule_change': return '🗓️';
            default: return '🔔';
        }
    };

    return (
        <div className="notification-wrapper" ref={popoverRef}>
            <button className="bell-btn" onClick={handleToggle}>
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="popover">
                    <div className="popover-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="mark-all-btn">
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="popover-content">
                        {loading && <div className="p-loading">Loading...</div>}

                        {!loading && notifications.length === 0 && (
                            <div className="empty-state">
                                <span className="empty-icon">🔕</span>
                                <p>No notifications yet</p>
                            </div>
                        )}

                        {notifications.map(notif => (
                            <div
                                key={notif.id}
                                className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                            >
                                <div className="notif-icon">{getIcon(notif.type)}</div>
                                <div className="notif-body">
                                    <div className="notif-title">{notif.title}</div>
                                    <div className="notif-message">{notif.message}</div>
                                    <div className="notif-date">{formatDate(notif.created_at)}</div>
                                </div>
                                {!notif.is_read && <div className="unread-dot"></div>}
                            </div>
                        ))}
                    </div>
                    <div className="popover-footer">
                        <button className="view-all-btn" onClick={() => { setIsOpen(false); router.push('/notifications'); }}>
                            View All Notifications
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .notification-wrapper {
                    position: relative;
                }
                .bell-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    position: relative;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                .bell-btn:hover {
                    background: #F3F4F6;
                }
                .bell-icon {
                    font-size: 20px;
                }
                .badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: #EF4444;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                    min-width: 16px;
                    height: 16px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                    border: 2px solid white;
                }
                .popover {
                    position: absolute;
                    top: 100%;
                    right: -10px;
                    width: 320px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    border: 1px solid #E5E7EB;
                    z-index: 1000;
                    margin-top: 8px;
                    overflow: hidden;
                }
                .popover-header {
                    padding: 12px 16px;
                    border-bottom: 1px solid #F3F4F6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #FAFAFA;
                }
                .popover-header h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #111827;
                }
                .mark-all-btn {
                    background: none;
                    border: none;
                    color: #3B82F6;
                    font-size: 12px;
                    cursor: pointer;
                    padding: 0;
                }
                .popover-content {
                    max-height: 400px;
                    overflow-y: auto;
                }
                .notification-item {
                    padding: 12px 16px;
                    border-bottom: 1px solid #F3F4F6;
                    display: flex;
                    gap: 12px;
                    cursor: pointer;
                    transition: background 0.2s;
                    position: relative;
                }
                .notification-item:hover {
                    background: #F9FAFB;
                }
                .notification-item.unread {
                    background: #F0F9FF;
                }
                .notif-icon {
                    font-size: 20px;
                    margin-top: 2px;
                }
                .notif-body {
                    flex: 1;
                }
                .notif-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1F2937;
                    margin-bottom: 2px;
                }
                .notif-message {
                    font-size: 12px;
                    color: #4B5563;
                    margin-bottom: 4px;
                    line-height: 1.4;
                }
                .notif-date {
                    font-size: 11px;
                    color: #9CA3AF;
                }
                .unread-dot {
                    width: 8px;
                    height: 8px;
                    background: #3B82F6;
                    border-radius: 50%;
                    position: absolute;
                    top: 16px;
                    right: 16px;
                }
                .empty-state {
                    padding: 40px 20px;
                    text-align: center;
                    color: #6B7280;
                }
                .empty-icon {
                    font-size: 32px;
                    color: #D1D5DB;
                    display: block;
                    margin-bottom: 8px;
                }
                .popover-footer {
                    padding: 8px;
                    border-top: 1px solid #F3F4F6;
                    text-align: center;
                    background: #FAFAFA;
                }
                .view-all-btn {
                    background: none;
                    border: none;
                    color: #3B82F6;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    width: 100%;
                    padding: 4px;
                }
                .view-all-btn:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
