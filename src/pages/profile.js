/**
 * Profile Page
 * User profile management with editable fields and profile picture upload
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';
import { User, Mail, Phone, MapPin, Shield, Camera, Trash2, Key, Info, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Profile() {
  const router = useRouter();
  const { user, logout, getCurrentUser, loading: authLoading } = useAuth();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationCooldown, setVerificationCooldown] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    let timer;
    if (verificationCooldown > 0) {
      timer = setTimeout(() => {
        setVerificationCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [verificationCooldown]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !hasFetched && !authLoading) {
        setLoading(true);
        const result = await getCurrentUser();
        if (result.success) {
          setUserData(result.user);
          setFormData({
            first_name: result.user.first_name || '',
            last_name: result.user.last_name || '',
            phone: result.user.phone || '',
            address: result.user.address || '',
          });
        }
        setHasFetched(true);
        setLoading(false);
      } else if (!user && !authLoading) {
        setLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, hasFetched]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await api.put('/users/me', formData);

      if (response.data.success) {
        setFeedback({ type: 'success', message: 'Profile updated successfully!' });
        const result = await getCurrentUser();
        if (result.success) setUserData(result.user);
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.error?.message || 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'File size must be less than 5MB' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please upload an image file' });
      return;
    }

    setUploading(true);
    setFeedback({ type: '', message: '' });

    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const response = await api.post('/users/me/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setFeedback({ type: 'success', message: 'Profile picture updated successfully!' });
        const result = await getCurrentUser();
        if (result.success) setUserData(result.user);
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.error?.message || 'Failed to upload profile picture'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) return;

    setUploading(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await api.delete('/users/me/profile-picture');
      if (response.data.success) {
        setFeedback({ type: 'success', message: 'Profile picture deleted successfully!' });
        const result = await getCurrentUser();
        if (result.success) setUserData(result.user);
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.error?.message || 'Failed to delete profile picture'
      });
    } finally {
      setUploading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
    const rootUrl = apiBase.replace(/\/api\/v1\/?$/, '');
    return `${rootUrl}${url}`;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match' });
      setSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'Password must be at least 8 characters long' });
      setSaving(false);
      return;
    }

    try {
      const response = await api.post('/users/me/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      if (response.data.success) {
        setFeedback({ type: 'success', message: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.error?.message || error.response?.data?.message || 'Failed to change password'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleResendVerification = async () => {
    if (verificationCooldown > 0) return;

    setSendingVerification(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await api.post('/auth/resend-verification');
      if (response.data.success) {
        setFeedback({ type: 'success', message: 'Verification email sent! Please check your inbox.' });
        setVerificationCooldown(30);
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.error?.message || 'Failed to send verification email'
      });
    } finally {
      setSendingVerification(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !userData) return null;

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <Head>
        <title>Profile - Smart Campus</title>
      </Head>

      <FeedbackMessage
        type={feedback.type}
        message={feedback.message}
        onClose={() => setFeedback({ type: '', message: '' })}
      />

      <div className="mb-8 animate-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Your Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and security settings</p>
      </div>

      {/* Email Verification Section */}
      {userData && !userData.is_verified && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-in fade-in duration-500">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Email Not Verified</h4>
              <p className="text-sm text-amber-700 mt-0.5">Please verify your email address to access all features.</p>
            </div>
          </div>
          <button
            onClick={handleResendVerification}
            className={`px-4 py-2 bg-white border border-amber-200 text-amber-900 text-sm font-semibold rounded-lg shadow-sm hover:bg-amber-100 transition-colors ${(sendingVerification || verificationCooldown > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={sendingVerification || verificationCooldown > 0}
          >
            {sendingVerification
              ? 'Sending...'
              : verificationCooldown > 0
                ? `Resend in ${verificationCooldown}s`
                : 'Send Verification Link'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4 flex items-center justify-center border-4 border-white shadow-lg">
                {userData.profile_picture_url ? (
                  <img src={getImageUrl(userData.profile_picture_url)} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-gray-300">{userData.email?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <label className="absolute bottom-4 right-0 bg-slate-900 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-md">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            <h2 className="text-xl font-bold text-gray-900">{userData.first_name} {userData.last_name}</h2>
            <p className="text-gray-500 text-sm mb-4">{userData.email}</p>

            <div className="flex gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase rounded-full tracking-wider border border-blue-100">
                {userData.role}
              </span>
              {userData.is_verified && (
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase rounded-full tracking-wider border border-green-100 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Verified
                </span>
              )}
            </div>

            {userData.profile_picture_url && (
              <button
                onClick={handleDeleteProfilePicture}
                className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                disabled={uploading}
              >
                <Trash2 className="h-3 w-3" /> Remove Picture
              </button>
            )}
          </div>

          {[ // Role Specific Info
            userData.role === 'student' && userData.profile && (
              <div key="student-info" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="h-4 w-4 text-gray-400" /> Academic Info
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-sm text-gray-500">Student No</span>
                    <span className="text-sm font-mono font-medium">{userData.profile.student_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-sm text-gray-500">Department</span>
                    <span className="text-sm font-medium text-right max-w-[60%]">{userData.profile.department?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-sm text-gray-500">CGPA</span>
                    <span className="text-sm font-bold text-blue-600">{(Number(userData.profile.cgpa) || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ),
            userData.role === 'faculty' && userData.profile && (
              <div key="faculty-info" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Faculty Info</h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-sm text-gray-500">ID</span>
                    <span className="text-sm font-mono font-medium">{userData.profile.employee_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-sm text-gray-500">Title</span>
                    <span className="text-sm font-medium">{userData.profile.title || '-'}</span>
                  </div>
                </div>
              </div>
            )
          ]}
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Details Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" /> Personal Details
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read-only)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      value={userData.email}
                      disabled
                      className="block w-full pl-10 bg-gray-50 rounded-lg border-gray-200 text-gray-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="relative">
                    <span className="absolute top-3 left-3 flex items-center text-gray-400">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Security Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" /> Security
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Key className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
