/**
 * Profile Page
 * User profile management with editable fields and profile picture upload
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

export default function Profile() {
  const router = useRouter();
  const { user, getCurrentUser, loading: authLoading } = useAuth();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !authLoading) {
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
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, getCurrentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/users/me', formData);

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Refresh user data
        const result = await getCurrentUser();
        if (result.success) {
          setUserData(result.user);
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error?.message || 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await api.post('/users/me/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        // Refresh user data
        const result = await getCurrentUser();
        if (result.success) {
          setUserData(result.user);
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error?.message || 'Failed to upload profile picture'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.delete('/users/me/profile-picture');

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile picture deleted successfully!' });
        // Refresh user data
        const result = await getCurrentUser();
        if (result.success) {
          setUserData(result.user);
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error?.message || 'Failed to delete profile picture'
      });
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="profile-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
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
        <title>Profile - Smart Campus Platform</title>
      </Head>

      <div className="profile-container">
        <nav className="profile-nav">
          <div className="nav-brand">
            <h1>🎓 Smart Campus</h1>
          </div>
          <div className="nav-actions">
            <button onClick={() => router.push('/dashboard')} className="btn-back">
              ← Back to Dashboard
            </button>
          </div>
        </nav>

        <div className="profile-content">
          <div className="profile-header">
            <h2>My Profile</h2>
            <p className="subtitle">Manage your account information</p>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <h3>Profile Picture</h3>
            <div className="picture-upload-container">
              <div className="current-picture">
                {userData.profile_picture_url ? (
                  <img src={userData.profile_picture_url} alt="Profile" />
                ) : (
                  <div className="avatar-placeholder-large">
                    {userData.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="picture-actions">
                <label className="btn-upload" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload New Picture'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>

                {userData.profile_picture_url && (
                  <button
                    onClick={handleDeleteProfilePicture}
                    className="btn-delete"
                    disabled={uploading}
                  >
                    Delete Picture
                  </button>
                )}

                <p className="upload-hint">Max size: 5MB. Formats: JPG, PNG, GIF</p>
              </div>
            </div>
          </div>

          {/* Profile Information Form */}
          <div className="profile-form-section">
            <h3>Personal Information</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={userData.email}
                    disabled
                    className="input-disabled"
                  />
                  <small>Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <input
                    type="text"
                    id="role"
                    value={userData.role?.toUpperCase()}
                    disabled
                    className="input-disabled"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => router.push('/dashboard')}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Role-Specific Information */}
          {userData.profile && (
            <div className="role-info-section">
              <h3>
                {userData.role === 'student' ? 'Student Information' : 'Faculty Information'}
              </h3>
              <div className="info-grid">
                {userData.role === 'student' && (
                  <>
                    <div className="info-item">
                      <span className="label">Student Number:</span>
                      <span className="value">{userData.profile.student_number}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">GPA:</span>
                      <span className="value">{userData.profile.gpa ? Number(userData.profile.gpa).toFixed(2) : 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">CGPA:</span>
                      <span className="value">{userData.profile.cgpa ? Number(userData.profile.cgpa).toFixed(2) : 'N/A'}</span>
                    </div>
                    {userData.profile.department && (
                      <div className="info-item">
                        <span className="label">Department:</span>
                        <span className="value">{userData.profile.department.name}</span>
                      </div>
                    )}
                  </>
                )}

                {userData.role === 'faculty' && (
                  <>
                    <div className="info-item">
                      <span className="label">Employee Number:</span>
                      <span className="value">{userData.profile.employee_number}</span>
                    </div>
                    {userData.profile.title && (
                      <div className="info-item">
                        <span className="label">Title:</span>
                        <span className="value">{userData.profile.title}</span>
                      </div>
                    )}
                    {userData.profile.department && (
                      <div className="info-item">
                        <span className="label">Department:</span>
                        <span className="value">{userData.profile.department.name}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <small className="info-note">
                These fields cannot be modified. Contact administration for changes.
              </small>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .profile-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .profile-nav {
          background: rgba(255, 255, 255, 0.95);
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .nav-brand h1 {
          margin: 0;
          font-size: 1.5rem;
          color: #667eea;
        }

        .btn-back {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .btn-back:hover {
          background: #5568d3;
          transform: translateY(-2px);
        }

        .profile-content {
          max-width: 900px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .profile-header {
          text-align: center;
          color: white;
          margin-bottom: 2rem;
        }

        .profile-header h2 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .message {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .profile-picture-section,
        .profile-form-section,
        .role-info-section {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .profile-picture-section h3,
        .profile-form-section h3,
        .role-info-section h3 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #333;
          font-size: 1.3rem;
        }

        .picture-upload-container {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .current-picture {
          flex-shrink: 0;
        }

        .current-picture img {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #667eea;
        }

        .avatar-placeholder-large {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          color: white;
          font-weight: bold;
        }

        .picture-actions {
          flex: 1;
        }

        .btn-upload,
        .btn-delete {
          padding: 0.7rem 1.5rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s ease;
          margin-right: 1rem;
          margin-bottom: 0.5rem;
        }

        .btn-upload {
          background: #667eea;
          color: white;
          display: inline-block;
        }

        .btn-upload:hover:not([disabled]) {
          background: #5568d3;
          transform: translateY(-2px);
        }

        .btn-delete {
          background: #dc3545;
          color: white;
        }

        .btn-delete:hover:not([disabled]) {
          background: #c82333;
          transform: translateY(-2px);
        }

        .btn-upload[disabled],
        .btn-delete[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .upload-hint {
          color: #666;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          color: #333;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .input-disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .form-group small {
          margin-top: 0.3rem;
          color: #666;
          font-size: 0.85rem;
        }

        .form-actions {
          margin-top: 2rem;
          display: flex;
          gap: 1rem;
        }

        .btn-save,
        .btn-cancel {
          padding: 0.8rem 2rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-save {
          background: #28a745;
          color: white;
        }

        .btn-save:hover:not([disabled]) {
          background: #218838;
          transform: translateY(-2px);
        }

        .btn-cancel {
          background: #6c757d;
          color: white;
        }

        .btn-cancel:hover:not([disabled]) {
          background: #5a6268;
          transform: translateY(-2px);
        }

        .btn-save[disabled],
        .btn-cancel[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .info-item {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .info-item .label {
          display: block;
          color: #666;
          font-size: 0.85rem;
          margin-bottom: 0.3rem;
        }

        .info-item .value {
          display: block;
          color: #333;
          font-size: 1.1rem;
          font-weight: 500;
        }

        .info-note {
          display: block;
          margin-top: 1rem;
          color: #666;
          font-style: italic;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          color: white;
        }

        .spinner {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .form-grid,
          .info-grid {
            grid-template-columns: 1fr;
          }

          .picture-upload-container {
            flex-direction: column;
            text-align: center;
          }

          .profile-nav {
            padding: 1rem;
          }

          .nav-brand h1 {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </>
  );
}
