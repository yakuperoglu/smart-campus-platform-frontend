/**
 * Meals Index Page
 * 
 * Redirects to menu page or shows overview.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Utensils, Ticket } from 'lucide-react';

export default function MealsIndexPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    // Auto-redirect to menu
    useEffect(() => {
        router.replace('/meals/menu');
    }, []);

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>Meals - Smart Campus</title>
            </Head>

            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">🍽️ Cafeteria</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Link href="/meals/menu" className="group block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all">
                        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Utensils className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Browse Menu</h3>
                        <p className="text-gray-500 text-sm">See today's meals and reserve</p>
                    </Link>

                    <Link href="/meals/reservations" className="group block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all">
                        <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Ticket className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">My Reservations</h3>
                        <p className="text-gray-500 text-sm">View your QR codes</p>
                    </Link>
                </div>

                <p className="text-gray-400 text-sm animate-pulse">Redirecting to menu...</p>
            </div>
        </DashboardLayout>
    );
}
