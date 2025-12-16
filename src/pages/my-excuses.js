/**
 * My Excuses Page
 * Students can view their excuse request history
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../config/api';

export default function MyExcuses() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
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

    const getStatusBadge = (status) => {
        const colors = {
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    if (authLoading || loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <>
            <Head>
                <title>My Excuses - Smart Campus</title>
            </Head>

            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">My Excuse Requests</h1>
                    <button
                        onClick={() => router.push('/excuse-request')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        + New Request
                    </button>
                </div>

                {requests.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">You haven't submitted any excuse requests yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map((req) => (
                            <div key={req.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-800">
                                            {req.session?.section?.course?.name || 'Course'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Session Date: {req.session?.start_time ? new Date(req.session.start_time).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    {getStatusBadge(req.status)}
                                </div>

                                <div className="mt-4">
                                    <p className="text-gray-700"><strong>Reason:</strong> {req.reason}</p>
                                    {req.notes && (
                                        <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            <strong>Instructor Note:</strong> {req.notes}
                                        </p>
                                    )}
                                </div>

                                {req.document_url && (
                                    <div className="mt-4">
                                        <a
                                            href={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000'}${req.document_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                        >
                                            📎 View Document
                                        </a>
                                    </div>
                                )}

                                <div className="mt-2 text-xs text-gray-400 text-right">
                                    Submitted: {new Date(req.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Basic Tailwind-like styles via styled-jsx (since Tailwind might not be fully configured in non-CRA) */}
            <style jsx>{`
        .bg-green-100 { background-color: #def7ec; }
        .text-green-800 { color: #03543f; }
        .bg-red-100 { background-color: #fde8e8; }
        .text-red-800 { color: #9b1c1c; }
        .bg-yellow-100 { background-color: #fdf6b2; }
        .text-yellow-800 { color: #723b13; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .text-gray-800 { color: #1f2937; }
        
        .container { margin-left: auto; margin-right: auto; }
        .max-w-4xl { max-width: 56rem; }
        .bg-white { background-color: white; }
        .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
        .rounded-lg { border-radius: 0.5rem; }
        .p-6 { padding: 1.5rem; }
        .p-8 { padding: 2rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mt-4 { margin-top: 1rem; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .font-bold { font-weight: 700; }
        .text-2xl { font-size: 1.5rem; }
        .text-gray-800 { color: #1f2937; }
        .bg-blue-600 { background-color: #2563eb; }
        .text-white { color: white; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .hover\:bg-blue-700:hover { background-color: #1d4ed8; }
        .transition { transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform; transition-duration: 150ms; }
        .grid { display: grid; }
        .gap-4 { gap: 1rem; }
        .border-l-4 { border-left-width: 4px; }
        .border-blue-500 { border-color: #3b82f6; }
        .text-sm { font-size: 0.875rem; }
        .text-xs { font-size: 0.75rem; }
        .text-gray-500 { color: #6b7280; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-400 { color: #9ca3af; }
        .bg-gray-50 { background-color: #f9fafb; }
      `}</style>
        </>
    );
}
