import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Settings,
    ArrowLeft,
    Bell,
    Mail,
    Smartphone,
    Save,
    Check
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function NotificationSettings() {
    const { user, logout, loading: authLoading } = useAuth();
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
            alert('Preferences saved successfully!'); // Could use a toast here ideally
        } catch (error) {
            console.error(error);
            alert('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || !user) return null;

    // Define available categories based on channel
    const channels = [
        { id: 'email', label: 'Email Notifications', icon: <Mail className="w-5 h-5" />, description: 'Receive updates via email' },
        { id: 'push', label: 'Push Notifications', icon: <Bell className="w-5 h-5" />, description: 'Receive push notifications on your device' },
        { id: 'sms', label: 'SMS Notifications', icon: <Smartphone className="w-5 h-5" />, description: 'Receive text messages' }
    ];

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>Notification Settings | Smart Campus</title>
            </Head>

            <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Settings className="h-6 w-6 text-indigo-600" />
                            Notification Preferences
                        </h1>
                        <p className="mt-1 text-gray-500">Manage how you receive updates and alerts</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500">Loading preferences...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {channels.map(channel => (
                                <div key={channel.id} className="p-6">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                            {channel.icon}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">{channel.label}</h2>
                                            <p className="text-gray-500 text-sm">{channel.description}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-0 md:pl-16">
                                        {Object.keys(preferences?.[channel.id] || {}).length === 0 ? (
                                            <p className="text-sm text-gray-400 italic">No options available for this channel</p>
                                        ) : (
                                            Object.keys(preferences?.[channel.id] || {}).map(type => (
                                                <div key={type} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                                        {type.replace(/_/g, ' ')} Updates
                                                    </span>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={preferences[channel.id][type]}
                                                            onChange={() => handleToggle(channel.id, type)}
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Preferences
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
