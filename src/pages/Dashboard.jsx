/**
 * Dashboard Page
 * Main dashboard for authenticated users
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getCurrentUser } = useAuth();
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch fresh user data on mount
    const fetchUserData = async () => {
      setLoading(true);
      const result = await getCurrentUser();
      if (result.success) {
        setUserData(result.user);
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: '#e74c3c',
      faculty: '#3498db',
      student: '#27ae60',
      staff: '#f39c12'
    };
    return colors[role] || '#95a5a6';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h1>🎓 Smart Campus</h1>
        </div>
        <div className="nav-actions">
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome to Smart Campus Dashboard</h2>
          <p className="subtitle">Your personalized campus management portal</p>
        </div>

        <div className="user-card">
          <div className="user-avatar">
            {userData?.profile_picture_url ? (
              <img src={userData.profile_picture_url} alt="Profile" />
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

        {/* Role-specific profile information */}
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
                    <span className="value">{userData.profile.gpa?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="profile-item">
                    <span className="label">CGPA:</span>
                    <span className="value">{userData.profile.cgpa?.toFixed(2) || 'N/A'}</span>
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

        {/* Wallet information */}
        {userData?.wallet && (
          <div className="wallet-section">
            <h3>💳 Digital Wallet</h3>
            <div className="wallet-card">
              <div className="wallet-balance">
                <span className="currency">{userData.wallet.currency}</span>
                <span className="amount">{parseFloat(userData.wallet.balance).toFixed(2)}</span>
              </div>
              <p className="wallet-status">
                Status: {userData.wallet.is_active ? '✅ Active' : '⛔ Inactive'}
              </p>
            </div>
          </div>
        )}

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h4>Courses</h4>
            <p>View and manage your courses</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h4>Attendance</h4>
            <p>GPS-based attendance system</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🍽️</div>
            <h4>Meals</h4>
            <p>Reserve your meals</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎫</div>
            <h4>Events</h4>
            <p>Campus events and activities</p>
            <span className="coming-soon">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
