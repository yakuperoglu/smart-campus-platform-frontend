import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
    BookOpen,
    Users,
    Calendar,
    PartyPopper,
    Utensils,
    Building2,
    ShieldCheck,
    TrendingUp,
    CreditCard
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function AdminPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    if (loading || !user || user.role !== 'admin') return null;

    const adminModules = [
        {
            title: "Course Management",
            description: "Add, edit, delete courses and sections",
            href: "/admin/courses",
            icon: <BookOpen className="h-8 w-8 text-white" />,
            color: "from-blue-500 to-indigo-600",
            shadow: "shadow-blue-200"
        },
        {
            title: "User Management",
            description: "Manage students, faculty and admins",
            href: "/admin/users",
            icon: <Users className="h-8 w-8 text-white" />,
            color: "from-emerald-400 to-teal-600",
            shadow: "shadow-emerald-200"
        },
        {
            title: "Schedule Management",
            description: "Generate and manage class schedules",
            href: "/admin/scheduling",
            icon: <Calendar className="h-8 w-8 text-white" />,
            color: "from-rose-400 to-red-600",
            shadow: "shadow-rose-200"
        },
        {
            title: "Event Management",
            description: "Create and manage campus events",
            href: "/admin/events",
            icon: <PartyPopper className="h-8 w-8 text-white" />,
            color: "from-violet-400 to-purple-600",
            shadow: "shadow-violet-200"
        },
        {
            title: "Menu Management",
            description: "Manage cafeteria menus",
            href: "/admin/menus",
            icon: <Utensils className="h-8 w-8 text-white" />,
            color: "from-orange-400 to-amber-600",
            shadow: "shadow-orange-200"
        },
        {
            title: "Department Management",
            description: "Add and manage departments",
            href: "/admin/departments",
            icon: <Building2 className="h-8 w-8 text-white" />,
            color: "from-pink-400 to-rose-600",
            shadow: "shadow-pink-200"
        },
        {
            title: "Analytics Hub",
            description: "View campus insights",
            href: "/admin/analytics",
            icon: <TrendingUp className="h-8 w-8 text-white" />,
            color: "from-cyan-400 to-blue-600",
            shadow: "shadow-cyan-200"
        },
    ];

    return (
        <DashboardLayout user={user} onLogout={() => router.push('/login')}>
            <Head>
                <title>Admin Console | Smart Campus</title>
            </Head>

            <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <ShieldCheck className="h-8 w-8 text-indigo-600" />
                            Admin Console
                        </h1>
                        <p className="mt-1 text-gray-500">Manage your campus platform and settings</p>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {adminModules.map((module, index) => (
                        <Link
                            key={index}
                            href={module.href}
                            className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
                        >
                            <div className={`h-2 bg-gradient-to-r ${module.color}`} />
                            <div className="p-6">
                                <div className={`inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-br ${module.color} ${module.shadow} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    {module.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {module.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

            </div>
        </DashboardLayout>
    );
}
