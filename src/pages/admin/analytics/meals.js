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
import { Utensils, DollarSign, TrendingUp } from 'lucide-react';
import analyticsService from '../../../services/analyticsService';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';

export default function MealAnalytics() {
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
            const result = await analyticsService.getMealUsage();
            setData(result.data);
        } catch (error) {
            console.error('Failed to fetch meal data', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user || user.role !== 'admin') return null;

    if (loading || !data) {
        return (
            <DashboardLayout user={user}>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-2 border-gray-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading cafeteria analytics...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout user={user}>
            <Head>
                <title>Cafeteria Analytics | Admin</title>
            </Head>

            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Utensils className="h-6 w-6 text-orange-600" />
                            Cafeteria Analytics
                        </h1>
                        <p className="mt-1 text-gray-500">Revenue and reservation tracking</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-6">
                        <div className="p-4 bg-green-100 rounded-full text-green-600">
                            <DollarSign className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
                            <h3 className="text-4xl font-extrabold text-green-600 mt-1">{data.revenue} ₺</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-6">
                        <div className="p-4 bg-orange-100 rounded-full text-orange-600">
                            <TrendingUp className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Weekly Reservations</p>
                            <h3 className="text-4xl font-extrabold text-gray-900 mt-1">
                                {data.dailyUsage?.reduce((acc, curr) => acc + curr.count, 0) || 0}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
                        Daily Reservations (Last 7 Days)
                    </h2>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.dailyUsage} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ fill: '#fff7ed' }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="count"
                                    fill="#f97316"
                                    name="Reservations"
                                    radius={[4, 4, 0, 0]}
                                    barSize={60}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
