/**
 * Register Page (Next.js)
 * New user registration form
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    student_number: '',
    employee_number: '',
    title: '',
    department_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    const registrationData = {
      email: formData.email,
      password: formData.password,
      role: formData.role
    };

    if (formData.role === 'student') {
      if (!formData.student_number) {
        setError('Student number is required');
        setLoading(false);
        return;
      }
      registrationData.student_number = formData.student_number;
      if (formData.department_id) {
        registrationData.department_id = formData.department_id;
      }
    } else if (formData.role === 'faculty') {
      if (!formData.employee_number) {
        setError('Employee number is required');
        setLoading(false);
        return;
      }
      registrationData.employee_number = formData.employee_number;
      if (formData.title) registrationData.title = formData.title;
      if (formData.department_id) {
        registrationData.department_id = formData.department_id;
      }
    }

    const result = await register(registrationData);
    setLoading(false);

    if (result.success) {
      setSuccess('Registration successful! Please check your email to verify your account.');
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        student_number: '',
        employee_number: '',
        title: '',
        department_id: ''
      });
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <Head>
        <title>Register - Smart Campus Platform</title>
      </Head>

      <div className="auth-container">
        <div className="auth-card register-card">
          <div className="auth-header">
            <h1>🎓 Smart Campus</h1>
            <h2>Create Account</h2>
            <p>Join the Smart Campus community</p>
          </div>

          {error && (
            <div className="error-message">
              <span>❌</span> {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <span>✅</span> {success}
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
                placeholder="your.email@smartcampus.edu"
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
                placeholder="Min 8 characters, include uppercase, number, special char"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <div className="form-group">
                <label htmlFor="student_number">Student Number</label>
                <input
                  type="text"
                  id="student_number"
                  name="student_number"
                  value={formData.student_number}
                  onChange={handleChange}
                  placeholder="e.g., 20240001"
                  required
                />
              </div>
            )}

            {formData.role === 'faculty' && (
              <>
                <div className="form-group">
                  <label htmlFor="employee_number">Employee Number</label>
                  <input
                    type="text"
                    id="employee_number"
                    name="employee_number"
                    value={formData.employee_number}
                    onChange={handleChange}
                    placeholder="e.g., FAC001"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="title">Title (Optional)</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Prof. Dr., Assoc. Prof."
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account? <Link href="/login">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
