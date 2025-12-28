import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import analyticsService from '../../services/analyticsService';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
    const [dashboardStats, setDashboardStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await analyticsService.getDashboardStats();
            setDashboardStats(data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner">Loading analytics...</div>;
    if (!dashboardStats) return <div className="error">Failed to load dashboard data</div>;

    const { totalUsers, activeUsersToday, totalCourses, totalEnrollments, attendanceRate, upcomingEvents } = dashboardStats;

    // Mock data for charts if API returns simplified stats.
    // Ideally, backend would provide time-series or categorized data for charts.
    // For MVP, we'll visualize the single data points or mock distributions.

    const userActivityData = [
        { name: 'Total Users', value: totalUsers },
        { name: 'Active Today', value: activeUsersToday }
    ];

    const academicData = [
        { name: 'Courses', value: totalCourses },
        { name: 'Enrollments', value: totalEnrollments }
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="admin-dashboard">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{totalUsers}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{activeUsersToday}</div>
                    <div className="stat-label">Active Users (Today)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{attendanceRate}%</div>
                    <div className="stat-label">Avg Attendance</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{upcomingEvents}</div>
                    <div className="stat-label">Upcoming Events</div>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-card">
                    <h3>User Engagement</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={userActivityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Academic Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={academicData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {academicData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="quick-actions" style={{ marginBottom: '2rem' }}>
                <h3>Quick Management</h3>
                <div className="action-buttons">
                    <button onClick={() => router.push('/admin/users')} className="action-btn">
                        👥 Users
                    </button>
                    <button onClick={() => router.push('/admin/courses')} className="action-btn">
                        📚 Courses
                    </button>
                    <button onClick={() => router.push('/admin/clubs')} className="action-btn">
                        🏢 Clubs
                    </button>
                </div>
            </div>

            <div className="quick-actions">
                <h3>Analytics Reports</h3>
                <div className="action-buttons">
                    <button onClick={() => router.push('/admin/analytics/academic')} className="action-btn">
                        📊 Academic Performance
                    </button>
                    <button onClick={() => router.push('/admin/analytics/attendance')} className="action-btn">
                        ✅ Attendance Reports
                    </button>
                    <button onClick={() => router.push('/admin/analytics/meals')} className="action-btn">
                        🍽️ Meal Analytics
                    </button>
                </div>
            </div>

            <style jsx>{`
        .admin-dashboard {
            margin-top: 2rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            text-align: center;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #2c3e50;
        }
        .stat-label {
            color: #7f8c8d;
            margin-top: 0.5rem;
        }
        .charts-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }
        .chart-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        h3 {
            margin-bottom: 1rem;
            color: #2c3e50;
        }
        .action-buttons {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }
        .action-btn {
            padding: 0.8rem 1.5rem;
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        }
        .action-btn:hover {
            background: #f0f2f5;
            transform: translateY(-2px);
        }
      `}</style>
        </div>
    );
}
