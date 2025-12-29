import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Shield,
    Download,
    AlertTriangle,
    Flag,
    FileText,
    Activity,
    Check,
    X,
    Eye
} from 'lucide-react';
import analyticsService from '../../../services/analyticsService';
import excuseService from '../../../services/excuseService';
import socketService from '../../../services/socketService';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';

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

    if (authLoading || !user || user.role !== 'admin') return null;

    if (loading) {
        return (
            <DashboardLayout user={user}>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading Attendance Intelligence Center...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout user={user}>
            <Head>
                <title>Attendance Intelligence | Admin | Smart Campus</title>
            </Head>

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right duration-300 ${toast.type === 'critical' ? 'bg-red-50 text-red-900 border-l-4 border-red-500' :
                        toast.type === 'success' ? 'bg-green-50 text-green-900 border-l-4 border-green-500' :
                            'bg-blue-50 text-blue-900 border-l-4 border-blue-500'
                    }`}>
                    <span>{toast.message}</span>
                    <button onClick={() => setToast(null)} className="hover:opacity-70">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Shield className="h-6 w-6 text-indigo-600" />
                            Attendance Intelligence
                        </h1>
                        <p className="mt-1 text-gray-500">Monitor attendance, flag anomalies, and manage excuses</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={analyticsService.exportCSV}
                            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors"
                        >
                            <Download className="h-4 w-4" /> Export CSV
                        </button>
                        <button
                            onClick={analyticsService.exportPDF}
                            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors"
                        >
                            <Download className="h-4 w-4" /> Export PDF
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-1">
                    {[
                        { id: 'overview', label: 'Overview', icon: Activity },
                        { id: 'at-risk', label: 'At-Risk Students', icon: AlertTriangle },
                        { id: 'flagged', label: 'Spoofing Logs', icon: Flag },
                        { id: 'excuses', label: 'Excuse Management', icon: FileText }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-t-lg font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Records</h3>
                                <p className="text-3xl font-bold text-gray-900">{trends.reduce((acc, curr) => acc + parseInt(curr.count), 0)}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-amber-500">
                                <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Flagged Incidents</h3>
                                <p className="text-3xl font-bold text-amber-600">{flagged.length}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-red-500">
                                <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">At-Risk Students</h3>
                                <p className="text-3xl font-bold text-red-600">{atRisk.length}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pending Excuses</h3>
                                <p className="text-3xl font-bold text-indigo-600">{excuses.filter(e => e.status === 'pending').length}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Attendance Volume (7 Days)</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trends}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            cursor={{ stroke: '#4f46e5', strokeWidth: 2 }}
                                        />
                                        <Area type="monotone" dataKey="count" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'at-risk' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                        <div className="p-6 border-b border-gray-100 bg-red-50/50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                Students with High Absence Rate (&gt;20%)
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Department</th>
                                        <th className="px-6 py-4 text-center">Sessions</th>
                                        <th className="px-6 py-4 text-center">Absent</th>
                                        <th className="px-6 py-4 text-center">Rate</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {atRisk.length > 0 ? atRisk.map(student => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                        {student.name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{student.name}</div>
                                                        <div className="text-xs text-gray-500">{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{student.department}</td>
                                            <td className="px-6 py-4 text-sm text-center text-gray-900">{student.total_sessions}</td>
                                            <td className="px-6 py-4 text-sm text-center text-red-600 font-medium">{student.absent_sessions}</td>
                                            <td className="px-6 py-4 text-sm text-center font-bold text-red-600">{student.absence_rate}%</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.risk_level === 'Critical'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {student.risk_level}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No at-risk students found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'flagged' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                        <div className="p-6 border-b border-gray-100 bg-amber-50/50">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Flag className="h-5 w-5 text-amber-600" />
                                    Potential Spoofing & Fraud Attempts
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Records flagged via GPS spoofing, Haversine distance failure, or IP mismatch.</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Course</th>
                                        <th className="px-6 py-4">Violation Type</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {flagged.length > 0 ? flagged.map(record => (
                                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(record.session.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {record.student.user.first_name} {record.student.user.last_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {record.session.section.course.code}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    GPS Distance Fail
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Review</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No flagged records found. System secure.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'excuses' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                        <div className="p-6 border-b border-gray-100 bg-indigo-50/50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-600" />
                                Medical & Emergency Excuses
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Session/Course</th>
                                        <th className="px-6 py-4">Reason</th>
                                        <th className="px-6 py-4">Document</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {excuses.length > 0 ? excuses.map(ex => (
                                        <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(ex.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="font-medium text-gray-900">{ex.student?.user?.first_name} {ex.student?.user?.last_name}</div>
                                                <div className="text-xs text-gray-500">{ex.student?.user?.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="font-medium">{ex.session?.section?.course?.code}</div>
                                                <div className="text-xs">{new Date(ex.session?.start_time).toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs" title={ex.reason}>
                                                {ex.reason}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {ex.document_url ? (
                                                    <a href={`${process.env.NEXT_PUBLIC_API_URL}${ex.document_url}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 font-medium flex items-center gap-1">
                                                        <Eye className="h-3 w-3" /> View
                                                    </a>
                                                ) : <span className="text-gray-400">None</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ex.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        ex.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {ex.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {ex.status === 'pending' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleExcuseAction(ex.id, 'approved')}
                                                            className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                                            title="Approve"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleExcuseAction(ex.id, 'rejected')}
                                                            className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No excuse requests found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
