import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Head from 'next/head';
import analyticsService from '../../../services/analyticsService';
import excuseService from '../../../services/excuseService';
import socketService from '../../../services/socketService';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AttendanceAnalytics() {
    const { user, loading: authLoading, token } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview'); // overview, at-risk, flagged, excuses

    // Data States
    const [trends, setTrends] = useState([]);
    const [atRisk, setAtRisk] = useState([]);
    const [flagged, setFlagged] = useState([]);
    const [excuses, setExcuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null); // { message, type }

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
        } else if (user && token) {
            fetchAllData();

            // Connect Socket
            const socket = socketService.connect(token);

            // Listeners
            socket.on('admin:flagged_record', (data) => {
                showToast(`⚠️ Flagged Attendance: ${data.studentName}: ${data.reason}`, 'critical');
                // Refresh Flagged Data
                analyticsService.getFlaggedRecords().then(res => setFlagged(res.data.records)).catch(console.error);
            });

            socket.on('admin:new_excuse', (data) => {
                showToast(`📝 New Excuse Request Received`, 'info');
                // Refresh Excuses
                excuseService.getAllRequests().then(res => setExcuses(res.data.requests)).catch(console.error);
            });

            return () => {
                socketService.off('admin:flagged_record');
                socketService.off('admin:new_excuse');
            };
        }
    }, [user, authLoading, router, token]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Parallel fetch
            const [trendRes, riskRes, flaggedRes, excuseRes] = await Promise.all([
                analyticsService.getAttendanceAnalytics(),
                analyticsService.getAtRiskAttendance(20), // 20% threshold
                analyticsService.getFlaggedRecords(),
                excuseService.getAllRequests()
            ]);

            setTrends(trendRes.data.attendanceTrends);
            setAtRisk(riskRes.data);
            setFlagged(flaggedRes.data.records);
            setExcuses(excuseRes.data.requests);

        } catch (error) {
            console.error('Failed to fetch analytics', error);
            showToast('Failed to load dashboard data', 'critical');
        } finally {
            setLoading(false);
        }
    };

    const handleExcuseAction = async (id, status) => {
        if (!confirm(`Are you sure you want to ${status} this request?`)) return;
        try {
            await excuseService.updateStatus(id, status, "Admin Action");
            // Refresh data
            const res = await excuseService.getAllRequests();
            setExcuses(res.data.requests);
            showToast(`Request ${status} successfully`, 'success');
        } catch (error) {
            console.error('Action failed', error);
            showToast('Failed to update request', 'critical');
        }
    };

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    if (loading) return <div className="p-loading">Loading Dashboard...</div>;

    return (
        <div className="page-container">
            <Head>
                <title>Attendance Intelligence - Admin</title>
            </Head>
            <Navbar userData={user} />

            <div className="content">
                <div className="dashboard-header">
                    <h1>🛡️ Attendance Intelligence Center</h1>
                    <div className="export-actions">
                        <button className="btn-export" onClick={analyticsService.exportCSV}>📄 Export CSV</button>
                        <button className="btn-export" onClick={analyticsService.exportPDF}>📊 Export PDF</button>
                    </div>
                </div>

                {/* Toast Notification */}
                {toast && (
                    <div className={`toast ${toast.type}`}>
                        {toast.message}
                        <button onClick={() => setToast(null)}>×</button>
                    </div>
                )}

                <div className="tabs">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button className={activeTab === 'at-risk' ? 'active' : ''} onClick={() => setActiveTab('at-risk')}>⚠️ At-Risk Students</button>
                    <button className={activeTab === 'flagged' ? 'active' : ''} onClick={() => setActiveTab('flagged')}>🚩 Spoofing Logs</button>
                    <button className={activeTab === 'excuses' ? 'active' : ''} onClick={() => setActiveTab('excuses')}>📝 Excuse Management</button>
                </div>

                {activeTab === 'overview' && (
                    <div className="tab-content">
                        <div className="stats-grid">
                            <div className="card">
                                <h3>Total Attendance Records</h3>
                                <p className="stat-value">{trends.reduce((acc, curr) => acc + parseInt(curr.count), 0)}</p>
                            </div>
                            <div className="card">
                                <h3>Flagged Incidents</h3>
                                <p className="stat-value warning">{flagged.length}</p>
                            </div>
                            <div className="card">
                                <h3>At-Risk Students</h3>
                                <p className="stat-value critical">{atRisk.length}</p>
                            </div>
                            <div className="card">
                                <h3>Pending Excuses</h3>
                                <p className="stat-value">{excuses.filter(e => e.status === 'pending').length}</p>
                            </div>
                        </div>

                        <div className="chart-section">
                            <h3>Attendance Volume (7 Days)</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={trends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="count" stroke="#4f46e5" fill="#c7d2fe" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'at-risk' && (
                    <div className="tab-content">
                        <h3>Students with High Absence Rate (&gt;20%)</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Department</th>
                                    <th>Total Sessions</th>
                                    <th>Absent</th>
                                    <th>Rate</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {atRisk.map(student => (
                                    <tr key={student.id}>
                                        <td className="user-cell">
                                            <div className="avatar-placeholder">{student.name[0]}</div>
                                            <div>
                                                <div className="font-bold">{student.name}</div>
                                                <div className="text-small">{student.email}</div>
                                            </div>
                                        </td>
                                        <td>{student.department}</td>
                                        <td>{student.total_sessions}</td>
                                        <td>{student.absent_sessions}</td>
                                        <td>{student.absence_rate}%</td>
                                        <td>
                                            <span className={`badge ${student.risk_level === 'Critical' ? 'critical' : 'warning'}`}>
                                                {student.risk_level}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {atRisk.length === 0 && <tr><td colSpan="6" className="text-center">No at-risk students found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'flagged' && (
                    <div className="tab-content">
                        <h3>🚩 Potential Spoofing & Fraud Attempts</h3>
                        <p className="subtitle">Records flagged via GPS spoofing, Haversine distance failure, or IP mismatch.</p>

                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Student</th>
                                    <th>Course</th>
                                    <th>Violation Type</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flagged.map(record => (
                                    <tr key={record.id}>
                                        <td>{new Date(record.session.created_at).toLocaleString()}</td>
                                        <td>{record.student.user.first_name} {record.student.user.last_name}</td>
                                        <td>{record.session.section.course.code}</td>
                                        <td>
                                            <span className="badge critical">GPS Distance Fail</span>
                                        </td>
                                        <td>
                                            <button className="btn-small">Review</button>
                                        </td>
                                    </tr>
                                ))}
                                {flagged.length === 0 && <tr><td colSpan="5" className="text-center">No flagged records found. System secure.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'excuses' && (
                    <div className="tab-content">
                        <h3>Medical & Emergency Excuses</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Student</th>
                                    <th>Session/Course</th>
                                    <th>Reason</th>
                                    <th>Document</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {excuses.map(ex => (
                                    <tr key={ex.id}>
                                        <td>{new Date(ex.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="font-bold">{ex.student?.user?.first_name} {ex.student?.user?.last_name}</div>
                                            <div className="text-small">{ex.student?.user?.email}</div>
                                        </td>
                                        <td>
                                            <div>{ex.session?.section?.course?.code}</div>
                                            <div className="text-small">{new Date(ex.session?.start_time).toLocaleString()}</div>
                                        </td>
                                        <td>{ex.reason}</td>
                                        <td>
                                            {ex.document_url ? (
                                                <a href={`${process.env.NEXT_PUBLIC_API_URL}${ex.document_url}`} target="_blank" rel="noopener noreferrer" className="btn-link">View Doc</a>
                                            ) : 'None'}
                                        </td>
                                        <td>
                                            <span className={`badge ${ex.status === 'approved' ? 'success' : ex.status === 'rejected' ? 'critical' : 'warning'}`}>
                                                {ex.status}
                                            </span>
                                        </td>
                                        <td>
                                            {ex.status === 'pending' && (
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button className="btn-small success" onClick={() => handleExcuseAction(ex.id, 'approved')}>✓</button>
                                                    <button className="btn-small critical" onClick={() => handleExcuseAction(ex.id, 'rejected')}>✗</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {excuses.length === 0 && <tr><td colSpan="7" className="text-center">No excuse requests found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style jsx>{`
                .page-container { min-height: 100vh; background: #f3f4f6; padding-bottom: 2rem; }
                .content { max-width: 1200px; margin: 0 auto; padding: 2rem; }
                
                .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .dashboard-header h1 { font-size: 1.8rem; color: #111827; }
                
                .btn-export { background: white; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; margin-left: 10px; cursor: pointer; transition: 0.2s; }
                .btn-export:hover { background: #f9fafb; border-color: #9ca3af; }

                .tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                .tabs button { 
                    padding: 8px 16px; 
                    background: none; 
                    border: none; 
                    font-weight: 500; 
                    color: #6b7280; 
                    cursor: pointer; 
                    border-radius: 6px;
                }
                .tabs button.active { background: #e0e7ff; color: #4338ca; }
                .tabs button:hover:not(.active) { background: #f3f4f6; }

                .tab-content { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); animation: fadeIn 0.3s ease; }

                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .card { background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
                .card h3 { margin: 0 0 10px 0; font-size: 0.9rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
                .stat-value { font-size: 2rem; font-weight: 700; margin: 0; color: #111827; }
                .stat-value.warning { color: #d97706; }
                .stat-value.critical { color: #dc2626; }

                .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                .data-table th { text-align: left; padding: 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; color: #6b7280; }
                .data-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
                
                .user-cell { display: flex; align-items: center; gap: 10px; }
                .avatar-placeholder { width: 32px; height: 32px; border-radius: 50%; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
                .font-bold { font-weight: 600; }
                .text-small { font-size: 0.8rem; color: #6b7280; }

                .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
                .badge.warning { background: #fef3c7; color: #92400e; }
                .badge.critical { background: #fee2e2; color: #991b1b; }
                .badge.success { background: #d1fae5; color: #065f46; }
                
                .btn-small { padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer; color: white; transition: 0.2s; }
                .btn-small.success { background: #10b981; }
                .btn-small.success:hover { background: #059669; }
                .btn-small.critical { background: #ef4444; }
                .btn-small.critical:hover { background: #dc2626; }
                .btn-link { color: #4f46e5; text-decoration: underline; font-size: 0.9rem; }
                
                .text-center { text-align: center; color: #6b7280; padding: 20px; }
                .subtitle { color: #6b7280; margin-bottom: 20px; }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                    border-left: 4px solid #3b82f6;
                }
                .toast.critical { border-left-color: #ef4444; }
                .toast.success { border-left-color: #10b981; }
                .toast button { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #9ca3af; }
                .toast button:hover { color: #111827; }
            `}</style>
        </div>
    );
}
