/**
 * Excuse Management Page
 * Faculty/Admin can view and manage excuse requests
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../config/api';
import {
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    ExternalLink,
    MessageSquare,
    AlertCircle,
    History
} from 'lucide-react';

export default function ExcuseManagement() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Evaluation modal state
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [evalNotes, setEvalNotes] = useState('');

    // Redirect if not authenticated or not faculty/admin
    useEffect(() => {
        if (!authLoading && (!user || (user.role !== 'faculty' && user.role !== 'admin'))) {
            router.push('/dashboard');
        }
    }, [authLoading, user, router]);

    const fetchRequests = async () => {
        if (!user || (user.role !== 'faculty' && user.role !== 'admin')) return;

        try {
            setLoading(true);
            const response = await api.get('/excuses/faculty');
            if (response.data.success) {
                setRequests(response.data.data.requests || []);
            }
        } catch (err) {
            console.error('Error fetching requests:', err);
            setFeedback({ type: 'error', message: 'Failed to load excuse requests.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [user]);

    const handleOpenEvaluate = (request) => {
        setSelectedRequest(request);
        setEvalNotes('');
    };

    const handleCloseEvaluate = () => {
        setSelectedRequest(null);
        setEvalNotes('');
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedRequest) return;

        setProcessingId(selectedRequest.id);
        setFeedback({ type: '', message: '' });

        try {
            const response = await api.put(`/excuses/${selectedRequest.id}/status`, {
                status,
                notes: evalNotes
            });

            if (response.data.success) {
                setFeedback({
                    type: 'success',
                    message: `Request ${status} successfully.`
                });
                fetchRequests();
                handleCloseEvaluate();
            }
        } catch (err) {
            console.error('Update error:', err);
            setFeedback({
                type: 'error',
                message: err.response?.data?.error?.message || 'Failed to update request.'
            });
        } finally {
            setProcessingId(null);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const pastRequests = requests.filter(r => r.status !== 'pending');

    if (authLoading || loading) {
        return (
            <DashboardLayout user={user}>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading excuse requests...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!user || (user.role !== 'faculty' && user.role !== 'admin')) return null;

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>Excuse Management | Smart Campus</title>
            </Head>

            <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <FileText className="h-6 w-6 text-indigo-600" />
                            Excuse Management
                        </h1>
                        <p className="mt-1 text-gray-500">Review and decide on student excuse requests</p>
                    </div>
                </div>

                {feedback.message && (
                    <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm border ${feedback.type === 'success'
                        ? 'bg-green-50 text-green-800 border-green-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                        <div className="flex items-center gap-2">
                            {feedback.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            <span className="font-medium">{feedback.message}</span>
                        </div>
                        <button onClick={() => setFeedback({ type: '', message: '' })} className="hover:opacity-70">
                            <span className="sr-only">Dismiss</span>
                            <div className="w-5 h-5 flex items-center justify-center text-lg">&times;</div>
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-5 rounded-xl text-center border border-orange-100 shadow-sm border-b-4 border-b-orange-400">
                        <div className="inline-flex p-3 rounded-full bg-orange-50 text-orange-600 mb-3">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{pendingRequests.length}</h3>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">Pending Requests</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl text-center border border-green-100 shadow-sm border-b-4 border-b-green-500">
                        <div className="inline-flex p-3 rounded-full bg-green-50 text-green-600 mb-3">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{pastRequests.filter(r => r.status === 'approved').length}</h3>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">Approved</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl text-center border border-red-100 shadow-sm border-b-4 border-b-red-500">
                        <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{pastRequests.filter(r => r.status === 'rejected').length}</h3>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">Rejected</p>
                    </div>
                </div>

                {/* Pending Requests Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <h2>Pending Review</h2>
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                    </div>

                    {pendingRequests.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 text-2xl">✨</div>
                            <h3 className="font-bold text-gray-900">All caught up!</h3>
                            <p className="text-gray-500 mt-1">There are no pending requests waiting for your review.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow relative">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-orange-400"></div>
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-gray-900">
                                                    {req.student?.user?.first_name} {req.student?.user?.last_name || req.student?.user?.email}
                                                </h4>
                                                <p className="text-xs text-gray-500">{req.student?.student_number}</p>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="space-y-3 text-sm text-gray-600 mb-4">
                                            <div className="flex gap-2">
                                                <span className="font-semibold min-w-16 text-gray-500">Course:</span>
                                                <span className="text-gray-900 font-medium">{req.session?.section?.course?.name} ({req.session?.section?.course?.code})</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="font-semibold min-w-16 text-gray-500">Session:</span>
                                                <span>{new Date(req.session?.start_time).toLocaleString()}</span>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <p className="text-gray-900 italic">"{req.reason}"</p>

                                                {req.document_url && (
                                                    <a
                                                        href={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000'}${req.document_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-3 inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-semibold hover:underline"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        View Supporting Document
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                                        <button
                                            onClick={() => handleOpenEvaluate(req)}
                                            className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                                        >
                                            Review Request
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* History Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-2 font-bold text-gray-900">
                            <History size={18} className="text-gray-500" />
                            <h3>Processed History</h3>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Reviewer Note</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pastRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No processed requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    pastRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{req.student?.user?.email}</div>
                                                <div className="text-xs text-gray-500">{req.student?.student_number}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800">{req.session?.section?.course?.code}</div>
                                                <div className="text-xs text-gray-500">{new Date(req.session?.start_time).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs truncate text-gray-600" title={req.reason}>
                                                    {req.reason}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${req.status === 'approved'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 italic">
                                                {req.notes || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Evaluation Modal */}
                {selectedRequest && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={handleCloseEvaluate} aria-hidden="true"></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-xl font-bold text-gray-900" id="modal-title">
                                            Review Request
                                        </h3>
                                        <button onClick={handleCloseEvaluate} className="text-gray-400 hover:text-gray-500">
                                            <span className="sr-only">Close</span>
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <span className="font-semibold text-gray-500">Student:</span>
                                                <span className="col-span-2 text-gray-900">{selectedRequest.student?.user?.first_name} {selectedRequest.student?.user?.last_name}</span>

                                                <span className="font-semibold text-gray-500">Reason:</span>
                                                <span className="col-span-2 text-gray-900 font-medium">"{selectedRequest.reason}"</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Instructor Notes (Optional)
                                            </label>
                                            <textarea
                                                id="notes"
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                value={evalNotes}
                                                onChange={(e) => setEvalNotes(e.target.value)}
                                                placeholder="Add a note about your decision..."
                                                rows="3"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-4 sm:px-6 flex flex-row-reverse gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateStatus('approved')}
                                        disabled={!!processingId}
                                        className="w-full md:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm disabled:opacity-50"
                                    >
                                        {processingId === selectedRequest.id ? 'Processing...' : 'Approve'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateStatus('rejected')}
                                        disabled={!!processingId}
                                        className="w-full md:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:opacity-50"
                                    >
                                        {processingId === selectedRequest.id ? 'Processing...' : 'Reject'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCloseEvaluate}
                                        disabled={!!processingId}
                                        className="mt-3 w-full md:w-auto inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
