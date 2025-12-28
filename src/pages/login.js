/**
 * Login Page (Next.js)
 * User authentication form
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Smart Campus Platform</title>
      </Head>

      <div className="auth-container">
        <div className="auth-card" style={{ position: 'relative' }}>
          <Link href="/" style={{
            position: 'absolute',
            top: '15px',
            left: '15px',
            fontSize: '1.5rem',
            color: '#667eea',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'transform 0.2s ease'
          }}>
            ← <span style={{ fontSize: '0.9rem' }}>Back</span>
          </Link>
          <div className="auth-header" style={{ marginTop: '20px' }}>
            <h1>🎓 Smart Campus</h1>
            <h2>Welcome Back</h2>
            <p>Sign in to continue to your account</p>
          </div>

          {error && (
            <div className="error-message">
              <span>❌</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@smartcampus.edu"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="form-group">
              <Link href="/forgot-password" style={{
                fontSize: '0.9rem',
                color: '#3498db',
                textDecoration: 'none',
                display: 'block',
                marginTop: '5px',
                textAlign: 'right'
              }}>
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don&apos;t have an account? <Link href="/register">Register here</Link>
            </p>
          </div>

          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials:</p>
            <p>👑 Admin: admin@smartcampus.edu / admin123</p>
            <p>👨‍🏫 Faculty: john.doe@smartcampus.edu / faculty123</p>
            <p>👨‍🏫 Faculty: jane.smith@smartcampus.edu / faculty123</p>
            <p>👨‍🎓 Student: student1@smartcampus.edu / student123</p>
            <p>👨‍🎓 Student: student2@smartcampus.edu / student123</p>
            <p>👨‍🎓 Student: student3@smartcampus.edu / student123</p>
          </div>
        </div>
      </div>
    </>
  );
}
