import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Head from 'next/head';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';

export default function NotificationSettings() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchPreferences();
        }
    }, [user, authLoading, router]);

    const fetchPreferences = async () => {
        try {
            const data = await notificationService.getPreferences();
            setPreferences(data.data);
        } catch (error) {
            console.error('Failed to fetch preferences', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (channel, type) => {
        setPreferences(prev => ({
            ...prev,
            [channel]: {
                ...prev[channel],
                [type]: !prev[channel][type]
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await notificationService.updatePreferences(preferences);
            alert('Preferences saved successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-loading">Loading...</div>;

    // Define available categories based on channel
    const channels = [
        { id: 'email', label: '📧 Email Notifications' },
        { id: 'push', label: '🔔 Push Notifications' },
        { id: 'sms', label: '📱 SMS Notifications' }
    ];

    return (
        <>
            <Head>
                <title>Notification Settings - Smart Campus</title>
            </Head>
            <div className="page-container">
                <Navbar userData={user} />
                <div className="content">
                    <div className="header-row">
                        <button className="back-btn" onClick={() => router.back()}>← Back</button>
                        <h1>Notification Preferences</h1>
                    </div>

                    <div className="settings-card">
                        {channels.map(channel => (
                            <div key={channel.id} className="channel-section">
                                <h2>{channel.label}</h2>
                                <div className="toggles-grid">
                                    {Object.keys(preferences?.[channel.id] || {}).map(type => (
                                        <div key={type} className="toggle-item">
                                            <label className="toggle-label">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences[channel.id][type]}
                                                    onChange={() => handleToggle(channel.id, type)}
                                                />
                                                <span className="slider"></span>
                                                <span className="label-text">
                                                    {type.charAt(0).toUpperCase() + type.slice(1)} Updates
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="actions">
                            <button
                                className="save-btn"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .page-container { min-height: 100vh; background: #f9fafb; }
                    .content { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }
                    .header-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
                    .back-btn { background: none; border: none; font-size: 1rem; color: #6b7280; cursor: pointer; }
                    .settings-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                    .channel-section { margin-bottom: 2.5rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 1.5rem; }
                    .channel-section:last-child { border-bottom: none; }
                    .channel-section h2 { font-size: 1.25rem; color: #1f2937; margin-bottom: 1.5rem; }
                    .toggles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
                    
                    /* Custom Toggle Switch */
                    .toggle-label { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; }
                    .toggle-label input { display: none; }
                    .slider { position: relative; width: 44px; height: 24px; background: #e5e7eb; border-radius: 99px; transition: 0.3s; }
                    .slider:before { content: ""; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
                    input:checked + .slider { background: #3b82f6; }
                    input:checked + .slider:before { transform: translateX(20px); }
                    .label-text { font-size: 0.95rem; color: #4b5563; }

                    .actions { margin-top: 2rem; display: flex; justify-content: flex-end; }
                    .save-btn { background: #3b82f6; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
                    .save-btn:hover { background: #2563eb; }
                    .save-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                `}</style>
            </div>
        </>
    );
}
