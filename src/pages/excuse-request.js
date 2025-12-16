/**
 * Excuse Request Page
 * Students can submit excuse requests for attendance
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';

export default function ExcuseRequest() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
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
                // Fetch last 30 days history? default history endpoint returns all or paginated.
                const response = await api.get('/attendance/history');

                if (response.data.success) {
                    // Flatten history to get sessions
                    // Assuming structure: { data: { history: [...] } }
                    // history items: { session: {...}, status: ... }
                    // We want sessions where status is 'absent' or 'late' ideally, but maybe even 'present' if checking out early?
                    // Let's list all recent sessions.
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

            // Need to set content-type for axios or let it auto-detect?
            // Axios auto-detects multipart if data is FormData
            const response = await api.post('/excuses', data);

            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: 'Excuse request submitted successfully!'
                });
                // Reset form
                setFormData({ session_id: '', reason: '' });
                setFile(null);
                // Clear file input manually if ref used, or just let React re-render
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

    if (authLoading) return <div>Loading...</div>;
    if (!user || user.role !== 'student') return null;

    return (
        <>
            <Head>
                <title>Submit Excuse - Smart Campus</title>
            </Head>

            <Navbar />

            <div className="page-container">
                <div className="form-card">
                    <h1>Submit Excuse Request</h1>
                    <p className="subtitle">If you missed a class, you can submit an excuse request here.</p>

                    {message.text && (
                        <FeedbackMessage
                            type={message.type}
                            message={message.text}
                            onClose={() => setMessage({ type: '', text: '' })}
                        />
                    )}

                    <form onSubmit={handleSubmit} className="excuse-form">
                        <div className="form-group">
                            <label htmlFor="session">Select Session *</label>
                            {loadingSessions ? (
                                <p className="loading-text">Loading sessions...</p>
                            ) : (
                                <select
                                    id="session"
                                    value={formData.session_id}
                                    onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                                    className="form-control"
                                    required
                                >
                                    <option value="">-- Select a Session --</option>
                                    {sessions.map((item) => {
                                        const session = item.session;
                                        const date = new Date(session.start_time).toLocaleDateString();
                                        const courseName = session.section?.course?.name || 'Unknown Course';
                                        return (
                                            <option key={session.id} value={session.id}>
                                                {date} - {courseName} ({item.status})
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="reason">Reason *</label>
                            <textarea
                                id="reason"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                className="form-control"
                                rows="4"
                                placeholder="Explain why you missed the class..."
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="document">Supporting Document (PDF, Image)</label>
                            <input
                                type="file"
                                id="document"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="form-control-file"
                            />
                            <small className="form-text">Optional. Max 10MB.</small>
                        </div>

                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>

                    <div className="history-link">
                        <a href="/my-excuses">View My Requests History</a>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .page-container {
          min-height: 100vh;
          background-color: #f5f7fa;
          padding: 40px 20px;
          display: flex;
          justify-content: center;
        }

        .form-card {
          background: white;
          width: 100%;
          max-width: 600px;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          height: fit-content;
        }

        h1 {
          font-size: 1.8rem;
          color: #2d3748;
          margin-bottom: 10px;
        }

        .subtitle {
          color: #718096;
          margin-bottom: 30px;
          font-size: 0.95rem;
        }

        .form-group {
          margin-bottom: 25px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #4a5568;
        }

        .form-control {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-control-file {
          padding: 10px 0;
        }

        .form-text {
          display: block;
          color: #a0aec0;
          font-size: 0.85rem;
          margin-top: 5px;
        }

        .btn-submit {
          width: 100%;
          background: #667eea;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-submit:hover:not(:disabled) {
          background: #5a67d8;
        }

        .btn-submit:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }
        
        .history-link {
          margin-top: 20px;
          text-align: center;
        }
        
        .history-link a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }
        
        .history-link a:hover {
          text-decoration: underline;
        }
      `}</style>
        </>
    );
}
