/**
 * Analytics Hub Page
 * Landing page for all analytics dashboards
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
    GraduationCap,
    Clock,
    Utensils,
    TrendingUp,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';

export default function AnalyticsHub() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    if (loading || !user || user.role !== 'admin') return null;

    const analyticsModules = [
        {
            title: "Academic Analytics",
            description: "Student performance, GPA trends, and course success rates",
            href: "/admin/analytics/academic",
            icon: <GraduationCap className="h-8 w-8 text-white" />,
            color: "from-blue-500 to-indigo-600",
            shadow: "shadow-blue-200",
            stat: "Performance"
        },
        {
            title: "Attendance Insights",
            description: "Daily attendance rates, absenteeism trends, and patterns",
            href: "/admin/analytics/attendance",
            icon: <Clock className="h-8 w-8 text-white" />,
            color: "from-emerald-400 to-teal-600",
            shadow: "shadow-emerald-200",
            stat: "Participation"
        },
        {
            title: "Meal Consumption",
            description: "Cafeteria usage, popular meals, and waste tracking",
            href: "/admin/analytics/meals",
            icon: <Utensils className="h-8 w-8 text-white" />,
            color: "from-orange-400 to-amber-600",
            shadow: "shadow-orange-200",
            stat: "Utilization"
        }
    ];

    return (
        <DashboardLayout user={user} onLogout={() => router.push('/login')}>
            <Head>
                <title>Analytics Hub | Smart Campus</title>
            </Head>

            <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <TrendingUp className="h-8 w-8 text-purple-600" />
                            Analytics Hub
                        </h1>
                        <p className="mt-1 text-gray-500">Deep insights into campus operations and student success</p>
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {analyticsModules.map((module, index) => (
                        <Link
                            key={index}
                            href={module.href}
                            className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block h-full flex flex-col"
                        >
                            <div className={`h-2 bg-gradient-to-r ${module.color}`} />
                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-br ${module.color} ${module.shadow} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        {module.icon}
                                    </div>
                                    <div className="bg-gray-100 rounded-full p-2 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-gray-500 leading-relaxed mb-6 flex-1">
                                    {module.description}
                                </p>

                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <BarChart3 className="h-4 w-4" />
                                    View {module.stat} Reports
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
