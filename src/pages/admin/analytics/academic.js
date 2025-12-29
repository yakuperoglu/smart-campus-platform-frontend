import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { BookOpen, Trophy, AlertTriangle, TrendingUp } from 'lucide-react';
import analyticsService from '../../../services/analyticsService';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';

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

    if (authLoading || !user || user.role !== 'admin') return null;

    if (loading || !data) {
        return (
            <DashboardLayout user={user}>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading academic data...</p>
                </div>
            </DashboardLayout>
        );
    }

    // Transform gpaByDept for chart
    const chartData = data.gpaByDept?.map(item => ({
        name: item.departmentName,
        gpa: parseFloat(item.avgGpa).toFixed(2)
    })) || [];

    return (
        <DashboardLayout user={user}>
            <Head>
                <title>Academic Analytics | Admin | Smart Campus</title>
            </Head>

            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-indigo-600" />
                            Academic Analytics
                        </h1>
                        <p className="mt-1 text-gray-500">Overview of student performance and departmental stats</p>
                    </div>
                </div>

                {/* Main Stats Graph */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-gray-500" />
                        GPA by Department
                    </h2>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 4]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="gpa"
                                    fill="#6366f1"
                                    name="Average GPA"
                                    radius={[4, 4, 0, 0]}
                                    barSize={50}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Performers */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Top Performers
                            </h3>
                        </div>
                        <ul className="divide-y divide-gray-100">
                            {data.topStudents?.length > 0 ? (
                                data.topStudents.map(s => (
                                    <li key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-xs">
                                                {s.User?.first_name?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{(s.User?.first_name || 'Student') + ' ' + (s.User?.last_name || '')}</div>
                                                <div className="text-xs text-gray-500">{s.student_number}</div>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            GPA: {s.gpa}
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <li className="p-8 text-center text-gray-500">No data available</li>
                            )}
                        </ul>
                    </div>

                    {/* At Risk Students */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-red-50">
                            <h3 className="font-bold text-red-900 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                At Risk Students (GPA &lt; 2.0)
                            </h3>
                        </div>
                        <ul className="divide-y divide-gray-100">
                            {data.atRiskStudents?.length > 0 ? (
                                data.atRiskStudents.map(s => (
                                    <li key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs">
                                                {s.User?.first_name?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{(s.User?.first_name || 'Student') + ' ' + (s.User?.last_name || '')}</div>
                                                <div className="text-xs text-gray-500">{s.student_number}</div>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            GPA: {s.gpa}
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <li className="p-8 text-center text-gray-500">No students at risk! 🎉</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
