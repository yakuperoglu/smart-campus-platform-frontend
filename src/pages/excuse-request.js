/**
 * Excuse Request Page
 * Students can submit excuse requests for attendance
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';
import {
    FileText,
    Upload,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    History
} from 'lucide-react';

export default function ExcuseRequest() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    const [formData, setFormData] = useState({
        session_id: '',
        reason: ''
    });
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Redirect if not authenticated or not student
    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'student')) {
            router.push('/dashboard');
        }
    }, [authLoading, user, router]);

    // Fetch past attendance sessions (History)
    useEffect(() => {
        const fetchHistory = async () => {
            if (!user || user.role !== 'student') return;

            try {
                setLoadingSessions(true);
                // Fetch attendance history
                const response = await api.get('/attendance/history');

                if (response.data.success) {
                    setSessions(response.data.data.history || []);
                }
            } catch (err) {
                console.error('Error fetching attendance history:', err);
                setMessage({ type: 'error', text: 'Failed to load attendance history.' });
            } finally {
                setLoadingSessions(false);
            }
        };

        fetchHistory();
    }, [user]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.session_id) {
            setMessage({ type: 'error', text: 'Please select a session.' });
            return;
        }
        if (!formData.reason) {
            setMessage({ type: 'error', text: 'Please provide a reason.' });
            return;
        }

        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            // Create FormData
            const data = new FormData();
            data.append('session_id', formData.session_id);
            data.append('reason', formData.reason);
            if (file) {
                data.append('document', file);
            }

            const response = await api.post('/excuses', data);

            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: 'Excuse request submitted successfully!'
                });
                // Reset form
                setFormData({ session_id: '', reason: '' });
                setFile(null);

                // Optional: redirect to history after short delay
                setTimeout(() => {
                    // router.push('/my-excuses'); // If this page existed
                }, 2000);
            }
        } catch (err) {
            console.error('Submit error:', err);
            setMessage({
                type: 'error',
                text: err.response?.data?.error?.message || 'Failed to submit request.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading) return null;
    if (!user || user.role !== 'student') return null;

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>Submit Excuse | Smart Campus</title>
            </Head>

            <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <FileText className="h-6 w-6 text-indigo-600" />
                            Submit Excuse Request
                        </h1>
                        <p className="mt-1 text-gray-500">Provide a reason and documentation for missed classes</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 md:p-8">
                        {message.text && (
                            <FeedbackMessage
                                type={message.type}
                                message={message.text}
                                onClose={() => setMessage({ type: '', text: '' })}
                            />
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Session Selection */}
                            <div className="space-y-2">
                                <label htmlFor="session" className="block text-sm font-semibold text-gray-700">
                                    Select Missed Session <span className="text-red-500">*</span>
                                </label>
                                {loadingSessions ? (
                                    <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-sm flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                                        Loading your sessions...
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            id="session"
                                            value={formData.session_id}
                                            onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 pr-10"
                                            required
                                        >
                                            <option value="">-- Select a Session --</option>
                                            {sessions.map((item) => {
                                                const session = item.session;
                                                const date = new Date(session.start_time).toLocaleDateString();
                                                const time = new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                const courseName = session.section?.course?.name || 'Unknown Course';
                                                const courseCode = session.section?.course?.code || 'N/A';

                                                return (
                                                    <option key={session.id} value={session.id}>
                                                        {date} {time} — {courseCode}: {courseName} ({item.status})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <History className="h-3 w-3" />
                                    Showing recent attendance history
                                </p>
                            </div>

                            {/* Reason */}
                            <div className="space-y-2">
                                <label htmlFor="reason" className="block text-sm font-semibold text-gray-700">
                                    Reason for Absence <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="reason"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[120px]"
                                    placeholder="Please explain why you missed the class in detail..."
                                    required
                                />
                            </div>

                            {/* File Upload */}
                            <div className="space-y-2">
                                <label htmlFor="document" className="block text-sm font-semibold text-gray-700">
                                    Supporting Document (Optional)
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 hover:bg-indigo-50/10 transition-colors cursor-pointer relative">
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <label htmlFor="document-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                                <span>Upload a file</span>
                                                <input
                                                    id="document-upload"
                                                    name="document-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            PDF, PNG, JPG up to 10MB
                                        </p>
                                        {file && (
                                            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600 font-medium bg-green-50 py-1 px-3 rounded-full">
                                                <CheckCircle2 className="h-4 w-4" />
                                                {file.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => router.back()} // Or router.push('/my-excuses') if it exists
                                    className="px-6 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                                >
                                    {submitting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Submitting...
                                        </span>
                                    ) : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        Need to check status? <a href="/my-excuses" className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline">View My Requests History</a>
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
