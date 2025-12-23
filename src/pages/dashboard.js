/**
 * Dashboard Page (Next.js)
 * Main dashboard for authenticated users
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

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
          // Fallback to basic user if fetch fails
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
  }, [user, authLoading]); // Only when user or authLoading changes, but hasFetched prevents re-runs

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: '#e74c3c',
      faculty: '#3498db',
      student: '#27ae60',
      staff: '#f39c12'
    };
    return colors[role] || '#95a5a6';
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
    const rootUrl = apiBase.replace(/\/api\/v1\/?$/, '');

    return `${rootUrl}${url}`;
  };

  if (authLoading || loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Dashboard - Smart Campus Platform</title>
      </Head>

      <div className="dashboard-container">
        <Navbar userData={userData} />

        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>Welcome to Smart Campus Dashboard</h2>
            <p className="subtitle">Your personalized campus management portal</p>
          </div>

          <div className="user-card">
            <div className="user-avatar">
              {userData?.profile_picture_url ? (
                <img src={getImageUrl(userData.profile_picture_url)} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {userData?.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="user-info">
              <h3>{userData?.email}</h3>
              <span
                className="role-badge"
                style={{ backgroundColor: getRoleBadgeColor(userData?.role) }}
              >
                {userData?.role?.toUpperCase()}
              </span>
              <p className="verification-status">
                {userData?.is_verified ? '✅ Verified' : '⚠️ Not Verified'}
              </p>
            </div>
          </div>

          {userData?.profile && (
            <div className="profile-section">
              <h3>Profile Information</h3>
              <div className="profile-grid">
                {userData.role === 'student' && (
                  <>
                    <div className="profile-item">
                      <span className="label">Student Number:</span>
                      <span className="value">{userData.profile.student_number}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">GPA:</span>
                      <span className="value">{userData.profile.gpa != null ? (Number(userData.profile.gpa) || 0).toFixed(2) : 'N/A'}</span>
                    </div>
                    <div className="profile-item">
                      <span className="label">CGPA:</span>
                      <span className="value">{userData.profile.cgpa != null ? (Number(userData.profile.cgpa) || 0).toFixed(2) : 'N/A'}</span>
                    </div>
                    {userData.profile.department && (
                      <div className="profile-item">
                        <span className="label">Department:</span>
                        <span className="value">{userData.profile.department.name}</span>
                      </div>
                    )}
                  </>
                )}

                {userData.role === 'faculty' && (
                  <>
                    <div className="profile-item">
                      <span className="label">Employee Number:</span>
                      <span className="value">{userData.profile.employee_number}</span>
                    </div>
                    {userData.profile.title && (
                      <div className="profile-item">
                        <span className="label">Title:</span>
                        <span className="value">{userData.profile.title}</span>
                      </div>
                    )}
                    {userData.profile.department && (
                      <div className="profile-item">
                        <span className="label">Department:</span>
                        <span className="value">{userData.profile.department.name}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {userData?.wallet && (
            <div className="wallet-section">
              <h3>💳 Digital Wallet</h3>
              <div className="wallet-card">
                <div className="wallet-balance">
                  <span className="currency">{userData.wallet.currency}</span>
                  <span className="amount">{(parseFloat(userData.wallet.balance) || 0).toFixed(2)}</span>
                </div>
                <p className="wallet-status">
                  Status: {userData.wallet.is_active ? '✅ Active' : '⛔ Inactive'}
                </p>
              </div>
            </div>
          )}

          <div className="features-grid">
            <Link href="/courses" style={{ textDecoration: 'none' }} prefetch={false}>
              <div className="feature-card" style={{ cursor: 'pointer' }}>
                <div className="feature-icon">📚</div>
                <h4>Courses</h4>
                <p>View and manage your courses</p>
              </div>
            </Link>

            {userData?.role === 'student' ? (
              <Link href="/attendance" style={{ textDecoration: 'none' }} prefetch={false}>
                <div className="feature-card" style={{ cursor: 'pointer' }}>
                  <div className="feature-icon">📍</div>
                  <h4>Check In</h4>
                  <p>GPS-based attendance check-in</p>
                </div>
              </Link>
            ) : userData?.role === 'faculty' ? (
              <Link href="/attendance-open" style={{ textDecoration: 'none' }} prefetch={false}>
                <div className="feature-card" style={{ cursor: 'pointer' }}>
                  <div className="feature-icon">📋</div>
                  <h4>Open Attendance</h4>
                  <p>GPS-based attendance session</p>
                </div>
              </Link>
            ) : (
              <div className="feature-card">
                <div className="feature-icon">✅</div>
                <h4>Attendance</h4>
                <p>GPS-based attendance system</p>
                <span className="coming-soon">Coming Soon</span>
              </div>
            )}

            <Link href="/meals" style={{ textDecoration: 'none' }} prefetch={false}>
              <div className="feature-card" style={{ cursor: 'pointer' }}>
                <div className="feature-icon">🍽️</div>
                <h4>Meals</h4>
                <p>Reserve your meals</p>
              </div>
            </Link>

            <Link href="/events" style={{ textDecoration: 'none' }} prefetch={false}>
              <div className="feature-card" style={{ cursor: 'pointer' }}>
                <div className="feature-icon">🎫</div>
                <h4>Events</h4>
                <p>Campus events and activities</p>
              </div>
            </Link>

            {/* Admin-specific cards */}
            {userData?.role === 'admin' && (
              <>
                <Link href="/admin/courses" style={{ textDecoration: 'none' }} prefetch={false}>
                  <div className="feature-card admin-card" style={{ cursor: 'pointer', borderLeft: '4px solid #e74c3c' }}>
                    <div className="feature-icon">📚</div>
                    <h4>Course Management</h4>
                    <p>Create and manage courses & sections</p>
                  </div>
                </Link>
                <div className="feature-card admin-card" style={{ borderLeft: '4px solid #e74c3c' }}>
                  <div className="feature-icon">👥</div>
                  <h4>User Management</h4>
                  <p>Manage users and roles</p>
                  <span className="coming-soon">Coming Soon</span>
                </div>
                <div className="feature-card admin-card" style={{ borderLeft: '4px solid #e74c3c' }}>
                  <div className="feature-icon">📊</div>
                  <h4>Reports</h4>
                  <p>View system reports and analytics</p>
                  <span className="coming-soon">Coming Soon</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
