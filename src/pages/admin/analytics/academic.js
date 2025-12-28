import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Head from 'next/head';
import analyticsService from '../../../services/analyticsService';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AcademicAnalytics() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
        } else if (user) {
            fetchData();
        }
    }, [user, authLoading, router]);

    const fetchData = async () => {
        try {
            const result = await analyticsService.getAcademicPerformance();
            setData(result.data);
        } catch (error) {
            console.error('Failed to fetch academic data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return <div className="p-loading">Loading...</div>;
    }

    // Transform gpaByDept for chart
    const chartData = data.gpaByDept?.map(item => ({
        name: item.departmentName,
        gpa: parseFloat(item.avgGpa).toFixed(2)
    })) || [];

    return (
        <>
            <Head>
                <title>Academic Analytics - Smart Campus</title>
            </Head>
            <div className="page-container">
                <Navbar userData={user} />
                <div className="content">
                    <h1>📊 Academic Performance Analytics</h1>

                    <div className="analytics-section">
                        <h2>GPA by Department</h2>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 4]} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="gpa" fill="#3498db" name="Average GPA" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="analytics-grid">
                        <div className="card">
                            <h3>🏆 Top Performers</h3>
                            <ul className="student-list">
                                {data.topStudents?.map(s => (
                                    <li key={s.id}>
                                        <span>{(s.User?.first_name || 'Student') + ' ' + (s.User?.last_name || '')}</span>
                                        <span className="badge-good">{s.gpa}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="card">
                            <h3>⚠️ At Risk Students (GPA &lt; 2.0)</h3>
                            <ul className="student-list">
                                {data.atRiskStudents?.map(s => (
                                    <li key={s.id}>
                                        <span>{(s.User?.first_name || 'Student') + ' ' + (s.User?.last_name || '')}</span>
                                        <span className="badge-danger">{s.gpa}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <style jsx>{`
            .page-container { min-height: 100vh; background: #f3f4f6; }
            .content { padding: 2rem; max-width: 1200px; margin: 0 auto; }
            h1 { color: #1f2937; margin-bottom: 2rem; }
            .analytics-section { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
            .card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .student-list { list-style: none; padding: 0; margin-top: 1rem; }
            .student-list li { display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #eee; }
            .badge-good { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 999px; font-weight: bold; }
            .badge-danger { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 999px; font-weight: bold; }
        `}</style>
            </div>
        </>
    );
}
