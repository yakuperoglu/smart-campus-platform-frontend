/**
 * Dashboard Page (Next.js)
 * Main dashboard for authenticated users
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import { Wallet, GraduationCap, TrendingUp, Users } from 'lucide-react';

// Layout
import DashboardLayout from '../components/layout/DashboardLayout';

// Widgets
import StatCard from '../components/dashboard/StatCard';
import AttendanceCard from '../components/dashboard/AttendanceCard';
import CalendarWidget from '../components/dashboard/CalendarWidget';
import ActivityFeed from '../components/dashboard/ActivityFeed';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, getCurrentUser, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Fetch full user profile ONLY ONCE when user is available
  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !hasFetched && !authLoading) {
        setLoading(true);
        const result = await getCurrentUser();
        if (result.success) {
          setUserData(result.user);
        } else {
          setUserData(user);
        }
        setHasFetched(true);
        setLoading(false);
      } else if (!user && !authLoading) {
        setLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Loading State
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium tracking-tight">Loading Smart Campus...</p>
        </div>
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  // Calculate generic stats for demo purposes
  // In a real app, these would come from the API
  const stats = [
    {
      title: 'GAP / GPA',
      value: userData.profile?.gpa ? Number(userData.profile.gpa).toFixed(2) : '3.42',
      icon: GraduationCap,
      color: 'blue',
      trend: 'up',
      trendValue: '0.12'
    },
    {
      title: 'Wallet Balance',
      value: userData.wallet ? `${userData.wallet.balance} ₺` : '0.00 ₺',
      icon: Wallet,
      color: 'green',
      trend: 'up',
      trendValue: '5%'
    },
    {
      title: 'Attendance Rate',
      value: '88%',
      icon: Users,
      color: 'purple',
      trend: 'down',
      trendValue: '2%'
    },
  ];

  return (
    <DashboardLayout user={userData} onLogout={logout}>
      <Head>
        <title>Dashboard - Smart Campus Platform</title>
      </Head>

      {/* Page Header */}
      <div className="mb-8 animate-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Welcome back, {userData.first_name || 'Student'}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here is what’s happening with your campus life today.</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-100">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6 animate-in slide-in-from-bottom-5 duration-500 delay-200">

          {/* Attendance Intelligence */}
          <div className="h-64">
            <AttendanceCard role={userData.role} />
          </div>

          {/* Weekly Schedule */}
          <div className="min-h-[300px]">
            <CalendarWidget />
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500 delay-300">
          {/* Activity Feed */}
          <div className="h-full min-h-[400px]">
            <ActivityFeed />
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}

