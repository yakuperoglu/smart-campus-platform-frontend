/**
 * My Excuses Page
 * Students can view their excuse request history and submit new ones
 * Uses modern DashboardLayout
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../config/api';
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

export default function MyExcuses() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'student')) {
            router.push('/dashboard');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        const fetchRequests = async () => {
            if (!user || user.role !== 'student') return;

            try {
                setLoading(true);
                const response = await api.get('/excuses/my-requests');
                if (response.data.success) {
                    setRequests(response.data.data.requests || []);
                }
            } catch (err) {
                console.error('Error fetching requests:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [user]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-yellow-500" />;
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            approved: 'bg-green-50 text-green-700 border-green-100',
            rejected: 'bg-red-50 text-red-700 border-red-100',
            pending: 'bg-yellow-50 text-yellow-700 border-yellow-100'
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                {getStatusIcon(status)}
                {status.toUpperCase()}
            </span>
        );
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const approvedCount = requests.filter(r => r.status === 'approved').length;
    const rejectedCount = requests.filter(r => r.status === 'rejected').length;

    if (authLoading || (!user || user.role !== 'student')) {
        return null;
    }

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>My Excuses - Smart Campus</title>
            </Head>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-in slide-in-from-bottom-2 duration-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" />
                        My Excuse Requests
                    </h1>
                    <p className="mt-1 text-gray-500">View your excuse history and submit new requests</p>
                </div>

                <Link
                    href="/excuse-request"
                    className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-sm text-white bg-slate-900 hover:bg-black transition-all transform hover:-translate-y-0.5"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Excuse Request
                </Link>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 text-sm">Loading excuse requests...</p>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 animate-in slide-in-from-bottom-3 duration-500 delay-100">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Clock className="h-16 w-16 text-yellow-500" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pending</h3>
                            <div className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{pendingCount}</div>
                            <div className="inline-flex items-center text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md">
                                Awaiting Review
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Approved</h3>
                            <div className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{approvedCount}</div>
                            <div className="inline-flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                                Excuses Accepted
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <XCircle className="h-16 w-16 text-red-500" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rejected</h3>
                            <div className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{rejectedCount}</div>
                            <div className="inline-flex items-center text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                                Not Approved
                            </div>
                        </div>
                    </div>

                    {/* Requests List */}
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                        {requests.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No Excuse Requests</h3>
                                <p className="text-gray-500 max-w-sm mx-auto text-sm mb-4">
                                    You haven't submitted any excuse requests yet.
                                </p>
                                <Link
                                    href="/excuse-request"
                                    className="inline-flex items-center px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Submit Your First Request
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                        All Requests ({requests.length})
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {requests.map((req) => (
                                        <div key={req.id} className="p-6 hover:bg-blue-50/30 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-bold text-gray-900">
                                                            {req.session?.section?.course?.name || 'Course'}
                                                        </h4>
                                                        {getStatusBadge(req.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-3">
                                                        <span className="font-medium">Session:</span>{' '}
                                                        {req.session?.start_time
                                                            ? new Date(req.session.start_time).toLocaleString()
                                                            : 'N/A'}
                                                    </p>
                                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                                        <p className="text-sm text-gray-700">
                                                            <span className="font-semibold">Reason:</span> {req.reason}
                                                        </p>
                                                    </div>
                                                    {req.notes && (
                                                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                                            <p className="text-sm text-blue-800">
                                                                <span className="font-semibold">Instructor Note:</span> {req.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-xs text-gray-400">
                                                        Submitted: {new Date(req.created_at).toLocaleDateString()}
                                                    </span>
                                                    {req.document_url && (
                                                        <a
                                                            href={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000'}${req.document_url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            View Document
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
