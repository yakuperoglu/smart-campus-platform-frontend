/**
 * Excuse Management Page
 * Faculty can view and manage excuse requests
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';

export default function ExcuseManagement() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Evaluation modal state
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [evalNotes, setEvalNotes] = useState('');

    // Redirect if not authenticated or not faculty
    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'faculty')) {
            router.push('/dashboard');
        }
    }, [authLoading, user, router]);

    const fetchRequests = async () => {
        if (!user || user.role !== 'faculty') return;

        try {
            setLoading(true);
            const response = await api.get('/excuses/faculty');
            if (response.data.success) {
                setRequests(response.data.data.requests || []);
            }
        } catch (err) {
            console.error('Error fetching requests:', err);
            setMessage({ type: 'error', text: 'Failed to load excuse requests.' });
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
        setMessage({ type: '', text: '' });

        try {
            const response = await api.put(`/excuses/${selectedRequest.id}/status`, {
                status,
                notes: evalNotes
            });

            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: `Request ${status} successfully.`
                });

                // Refresh list
                fetchRequests();
                handleCloseEvaluate();
            }
        } catch (err) {
            console.error('Update error:', err);
            setMessage({
                type: 'error',
                text: err.response?.data?.error?.message || 'Failed to update request.'
            });
        } finally {
            setProcessingId(null);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const pastRequests = requests.filter(r => r.status !== 'pending');

    if (authLoading || loading) {
        return (
            <div className="container">
                <Navbar />
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading excuse requests...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'faculty') return null;

    return (
        <>
            <Head>
                <title>Excuse Management - Smart Campus</title>
            </Head>

            <Navbar />

            <div className="page-container">
                <div className="content-wrapper">
                    <div className="header-section">
                        <h1>Excuse Management</h1>
                        <p className="subtitle">Review and manage student excuse requests</p>
                    </div>

                    {message.text && (
                        <FeedbackMessage
                            type={message.type}
                            message={message.text}
                            onClose={() => setMessage({ type: '', text: '' })}
                        />
                    )}

                    {/* Pending Requests Section */}
                    <div className="section-title">
                        <h2>Pending Requests ({pendingRequests.length})</h2>
                    </div>

                    {pendingRequests.length === 0 ? (
                        <div className="empty-box">
                            <p>No pending excuse requests.</p>
                        </div>
                    ) : (
                        <div className="requests-grid">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="request-card pending">
                                    <div className="card-header">
                                        <span className="student-name">
                                            {req.student?.user?.email || 'Student'}
                                        </span>
                                        <span className="date-badge">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="card-body">
                                        <div className="info-row">
                                            <strong>Course:</strong> {req.session?.section?.course?.name} ({req.session?.section?.course?.code})
                                        </div>
                                        <div className="info-row">
                                            <strong>Session:</strong> {new Date(req.session?.start_time).toLocaleString()}
                                        </div>

                                        <div className="reason-box">
                                            <strong>Reason:</strong>
                                            <p>{req.reason}</p>
                                        </div>

                                        {req.document_url && (
                                            <div className="doc-link">
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000'}${req.document_url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    📄 View Document
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-actions">
                                        <button
                                            className="btn-evaluate"
                                            onClick={() => handleOpenEvaluate(req)}
                                        >
                                            Review & Decide
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Past Requests Section */}
                    <div className="section-title mt-10">
                        <h2>Processed History</h2>
                    </div>

                    <div className="table-wrapper">
                        <table className="history-table">
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
                                {pastRequests.map(req => (
                                    <tr key={req.id}>
                                        <td>{req.student?.user?.email}</td>
                                        <td>{req.session?.section?.course?.code}</td>
                                        <td>{new Date(req.session?.start_time).toLocaleDateString()}</td>
                                        <td className="truncate-cell" title={req.reason}>{req.reason}</td>
                                        <td>
                                            <span className={`status-badge ${req.status}`}>
                                                {req.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>{req.notes || '-'}</td>
                                    </tr>
                                ))}
                                {pastRequests.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center">No processed requests found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Evaluation Modal */}
            {selectedRequest && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Review Request</h3>
                        <p className="modal-subtitle">
                            Student: <strong>{selectedRequest.student?.user?.email}</strong><br />
                            Reason: {selectedRequest.reason}
                        </p>

                        <div className="modal-form">
                            <label>Instructor Notes (Optional):</label>
                            <textarea
                                value={evalNotes}
                                onChange={(e) => setEvalNotes(e.target.value)}
                                placeholder="Add a note about your decision..."
                                rows="3"
                                className="form-control"
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={handleCloseEvaluate}
                                disabled={!!processingId}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-reject"
                                onClick={() => handleUpdateStatus('rejected')}
                                disabled={!!processingId}
                            >
                                {processingId === selectedRequest.id ? 'Processing...' : 'Reject'}
                            </button>
                            <button
                                className="btn-approve"
                                onClick={() => handleUpdateStatus('approved')}
                                disabled={!!processingId}
                            >
                                {processingId === selectedRequest.id ? 'Processing...' : 'Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .page-container {
          min-height: 100vh;
          background-color: #f5f7fa;
          padding-bottom: 50px;
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 30px 20px;
        }

        .header-section { margin-bottom: 30px; }
        .header-section h1 { color: #2d3748; margin-bottom: 5px; }
        .subtitle { color: #718096; }
        .section-title h2 { color: #4a5568; font-size: 1.5rem; margin-bottom: 15px; border-left: 4px solid #667eea; padding-left: 10px; }
        .mt-10 { margin-top: 40px; }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .empty-box { background: white; padding: 20px; border-radius: 8px; text-align: center; color: #a0aec0; }

        .requests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .request-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          overflow: hidden;
          border-top: 4px solid #ecc94b; /* Yellow for pending */
        }

        .card-header {
          padding: 15px;
          border-bottom: 1px solid #edf2f7;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .student-name { font-weight: 600; color: #2d3748; }
        .date-badge { font-size: 0.8rem; color: #718096; background: #edf2f7; padding: 2px 8px; border-radius: 4px; }

        .card-body { padding: 15px; }
        .info-row { margin-bottom: 8px; font-size: 0.95rem; color: #4a5568; }
        .reason-box { background: #f7fafc; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 0.9rem; }
        .reason-box p { margin: 5px 0 0; color: #2d3748; }
        .doc-link { margin-top: 10px; }
        .doc-link a { color: #3182ce; text-decoration: none; font-weight: 500; font-size: 0.9rem; }
        .doc-link a:hover { text-decoration: underline; }

        .card-actions { padding: 15px; background: #fcfcfc; border-top: 1px solid #edf2f7; text-align: right; }
        .btn-evaluate { background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .btn-evaluate:hover { background: #5a67d8; }

        .table-wrapper { background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }
        .history-table { width: 100%; border-collapse: collapse; }
        .history-table th { background: #f7fafc; padding: 12px 15px; text-align: left; font-size: 0.9rem; color: #4a5568; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
        .history-table td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; color: #2d3748; }
        .truncate-cell { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .text-center { text-align: center; }

        .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }
        .status-badge.approved { background: #c6f6d5; color: #22543d; }
        .status-badge.rejected { background: #fed7d7; color: #822727; }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }

        .modal-content h3 { margin-top: 0; color: #2d3748; }
        .modal-subtitle { color: #4a5568; margin-bottom: 20px; background: #f7fafc; padding: 10px; border-radius: 6px; }
        
        .modal-form { margin-bottom: 20px; }
        .modal-form label { display: block; margin-bottom: 8px; font-weight: 500; color: #4a5568; }
        .form-control { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; resize: vertical; }
        
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
        .btn-cancel { background: #edf2f7; color: #4a5568; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .btn-reject { background: #fc8181; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .btn-approve { background: #48bb78; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        
        .btn-reject:hover { background: #e53e3e; }
        .btn-approve:hover { background: #38a169; }
        
        button:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>
        </>
    );
}
