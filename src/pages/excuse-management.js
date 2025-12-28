/**
 * Excuse Management Page
 * Faculty/Admin can view and manage excuse requests
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../config/api';

export default function ExcuseManagement() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
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
            <div className="admin-page-container">
                <Navbar />
                <div className="loading-state" style={{ minHeight: '60vh' }}>
                    <div className="spinner"></div>
                    <p>Loading excuse requests...</p>
                </div>
            </div>
        );
    }

    if (!user || (user.role !== 'faculty' && user.role !== 'admin')) return null;

    return (
        <div className="admin-page-container">
            <Head>
                <title>Excuse Management | Smart Campus</title>
            </Head>
            <Navbar userData={user} />

            <div className="admin-content">
                <div className="admin-header">
                    <div className="admin-header-left">
                        <h1>📝 Excuse Management</h1>
                        <p>Review and approve student excuse requests</p>
                    </div>
                </div>

                {feedback.message && (
                    <div style={{
                        padding: '14px 20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: feedback.type === 'success' ? '#d1fae5' : '#fee2e2',
                        color: feedback.type === 'success' ? '#065f46' : '#991b1b'
                    }}>
                        {feedback.message}
                        <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setFeedback({ type: '', message: '' })}>×</button>
                    </div>
                )}

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card-modern">
                        <div className="stat-icon orange">⏳</div>
                        <div className="stat-info">
                            <h3>{pendingRequests.length}</h3>
                            <p>Pending Requests</p>
                        </div>
                    </div>
                    <div className="stat-card-modern">
                        <div className="stat-icon green">✅</div>
                        <div className="stat-info">
                            <h3>{pastRequests.filter(r => r.status === 'approved').length}</h3>
                            <p>Approved</p>
                        </div>
                    </div>
                    <div className="stat-card-modern">
                        <div className="stat-icon purple">❌</div>
                        <div className="stat-info">
                            <h3>{pastRequests.filter(r => r.status === 'rejected').length}</h3>
                            <p>Rejected</p>
                        </div>
                    </div>
                </div>

                {/* Pending Requests */}
                <div className="table-container" style={{ marginBottom: '30px' }}>
                    <div className="table-header">
                        <h2>⏳ Pending Requests ({pendingRequests.length})</h2>
                    </div>

                    {pendingRequests.length === 0 ? (
                        <div className="empty-state" style={{ borderRadius: 0 }}>
                            <div className="empty-state-icon">✨</div>
                            <h3>No pending requests</h3>
                            <p>All caught up! There are no excuse requests waiting for review.</p>
                        </div>
                    ) : (
                        <div style={{ padding: '20px' }}>
                            <div className="cards-grid">
                                {pendingRequests.map(req => (
                                    <div key={req.id} className="card-modern" style={{
                                        borderTop: '4px solid #f59e0b',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <div style={{ padding: '20px', flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <span style={{ fontWeight: '600', color: '#1a202c' }}>
                                                    {req.student?.user?.first_name} {req.student?.user?.last_name || req.student?.user?.email}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    color: '#64748b',
                                                    background: '#f1f5f9',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px'
                                                }}>
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '12px' }}>
                                                <p style={{ margin: '6px 0' }}>
                                                    <strong>Course:</strong> {req.session?.section?.course?.name} ({req.session?.section?.course?.code})
                                                </p>
                                                <p style={{ margin: '6px 0' }}>
                                                    <strong>Session:</strong> {new Date(req.session?.start_time).toLocaleString()}
                                                </p>
                                            </div>
                                            <div style={{
                                                background: '#f8fafc',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem'
                                            }}>
                                                <strong>Reason:</strong>
                                                <p style={{ margin: '6px 0 0', color: '#334155' }}>{req.reason}</p>
                                            </div>
                                            {req.document_url && (
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000'}${req.document_url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        marginTop: '12px',
                                                        color: '#3b82f6',
                                                        fontSize: '0.9rem',
                                                        textDecoration: 'none'
                                                    }}
                                                >
                                                    📄 View Document
                                                </a>
                                            )}
                                        </div>
                                        <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
                                            <button
                                                onClick={() => handleOpenEvaluate(req)}
                                                className="btn-primary-gradient"
                                                style={{ width: '100%' }}
                                            >
                                                Review & Decide
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* History Table */}
                <div className="table-container">
                    <div className="table-header">
                        <h2>📋 Processed History</h2>
                    </div>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Course</th>
                                <th>Session Date</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Reviewer Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pastRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                                        No processed requests found.
                                    </td>
                                </tr>
                            ) : (
                                pastRequests.map(req => (
                                    <tr key={req.id}>
                                        <td>{req.student?.user?.email}</td>
                                        <td>{req.session?.section?.course?.code}</td>
                                        <td>{new Date(req.session?.start_time).toLocaleDateString()}</td>
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>
                                            {req.reason}
                                        </td>
                                        <td>
                                            <span className={`badge ${req.status === 'approved' ? 'badge-approved' : 'badge-rejected'}`}>
                                                {req.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>{req.notes || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Evaluation Modal */}
            {selectedRequest && (
                <div className="modal-overlay">
                    <div className="modal-modern">
                        <div className="modal-header">
                            <h2>Review Request</h2>
                            <button className="modal-close" onClick={handleCloseEvaluate}>×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{
                                background: '#f8fafc',
                                padding: '16px',
                                borderRadius: '10px',
                                marginBottom: '20px'
                            }}>
                                <p style={{ margin: '6px 0' }}>
                                    <strong>Student:</strong> {selectedRequest.student?.user?.email}
                                </p>
                                <p style={{ margin: '6px 0' }}>
                                    <strong>Reason:</strong> {selectedRequest.reason}
                                </p>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Instructor Notes (Optional)</label>
                                <textarea
                                    className="form-textarea"
                                    value={evalNotes}
                                    onChange={(e) => setEvalNotes(e.target.value)}
                                    placeholder="Add a note about your decision..."
                                    rows="3"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-secondary"
                                onClick={handleCloseEvaluate}
                                disabled={!!processingId}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-danger"
                                onClick={() => handleUpdateStatus('rejected')}
                                disabled={!!processingId}
                            >
                                {processingId === selectedRequest.id ? 'Processing...' : 'Reject'}
                            </button>
                            <button
                                className="btn-success"
                                onClick={() => handleUpdateStatus('approved')}
                                disabled={!!processingId}
                            >
                                {processingId === selectedRequest.id ? 'Processing...' : 'Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
