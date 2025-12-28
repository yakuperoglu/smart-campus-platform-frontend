import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Head from 'next/head';
import analyticsService from '../../../services/analyticsService';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

    if (loading || !data) {
        return <div className="p-loading">Loading...</div>;
    }

    return (
        <>
            <Head>
                <title>Meal Analytics - Smart Campus</title>
            </Head>
            <div className="page-container">
                <Navbar userData={user} />
                <div className="content">
                    <h1>🍽️ Cafeteria Analytics</h1>

                    <div className="analytics-grid">
                        <div className="card highlight-card">
                            <h3>Total Revenue</h3>
                            <div className="big-value">{data.revenue} ₺</div>
                        </div>
                    </div>

                    <div className="analytics-section">
                        <h2>Daily Reservations (Last 7 Days)</h2>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={data.dailyUsage}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#e67e22" name="Reservations" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <style jsx>{`
            .page-container { min-height: 100vh; background: #f3f4f6; }
            .content { padding: 2rem; max-width: 1200px; margin: 0 auto; }
            .analytics-section { background: white; padding: 2rem; border-radius: 12px; margin-top: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
            .card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .big-value { font-size: 3rem; font-weight: 800; color: #27ae60; margin-top: 0.5rem; }
        `}</style>
            </div>
        </>
    );
}
