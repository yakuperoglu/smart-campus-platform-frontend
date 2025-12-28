/**
 * Register Page (Next.js)
 * New user registration form
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

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
  const [departments, setDepartments] = useState([]);
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        console.log('Fetching departments...');
        const response = await api.get('/departments');
        console.log('Departments response:', response.data);
        if (response.data && response.data.data) {
          setDepartments(response.data.data || []);
          console.log('Departments loaded:', response.data.data.length);
        } else if (response.data && Array.isArray(response.data)) {
          // Alternatif format desteği
          setDepartments(response.data);
          console.log('Departments loaded (alt format):', response.data.length);
        }
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        console.error('Error details:', err.response?.data || err.message);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    setSuccess('');

    // Real-time password validation
    if (name === 'password') {
      setPasswordErrors({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[@$!%*?&#]/.test(value)
      });
    }
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

    // Detailed password validation
    const passwordIssues = [];
    if (formData.password.length < 8) passwordIssues.push('at least 8 characters');
    if (!/[A-Z]/.test(formData.password)) passwordIssues.push('at least 1 uppercase letter');
    if (!/[a-z]/.test(formData.password)) passwordIssues.push('at least 1 lowercase letter');
    if (!/\d/.test(formData.password)) passwordIssues.push('at least 1 number');
    if (!/[@$!%*?&#]/.test(formData.password)) passwordIssues.push('at least 1 special character (@$!%*?&#)');

    if (passwordIssues.length > 0) {
      setError(`Password requirements: ${passwordIssues.join(', ')}`);
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

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
        <div className="max-w-xl w-full animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors mb-2">
              ← Back to Home
            </Link>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">🎓 Smart Campus</h1>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">Create Account</h2>
              <p className="mt-1 text-sm text-gray-500">Join the Smart Campus community</p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md animate-in slide-in-from-top-2 duration-300">
                <div className="flex">
                  <div className="flex-shrink-0">❌</div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-md animate-in slide-in-from-top-2 duration-300">
                <div className="flex">
                  <div className="flex-shrink-0">✅</div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@smartcampus.edu"
                    required
                    autoFocus
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  />
                </div>
                {formData.password && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <small className={`flex items-center text-xs ${passwordErrors.length ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {passwordErrors.length ? '✓' : '•'} 8+ chars
                    </small>
                    <small className={`flex items-center text-xs ${passwordErrors.uppercase ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {passwordErrors.uppercase ? '✓' : '•'} Uppercase
                    </small>
                    <small className={`flex items-center text-xs ${passwordErrors.lowercase ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {passwordErrors.lowercase ? '✓' : '•'} Lowercase
                    </small>
                    <small className={`flex items-center text-xs ${passwordErrors.number ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {passwordErrors.number ? '✓' : '•'} Number
                    </small>
                    <small className={`flex items-center text-xs ${passwordErrors.special ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {passwordErrors.special ? '✓' : '•'} Special char
                    </small>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                <div className="mt-1">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors bg-white"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty Member</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>

              {formData.role === 'student' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label htmlFor="student_number" className="block text-sm font-medium text-gray-700">Student Number</label>
                    <input
                      type="text"
                      id="student_number"
                      name="student_number"
                      value={formData.student_number}
                      onChange={handleChange}
                      placeholder="e.g. 20240001"
                      required
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">Department (Optional)</label>
                    <select
                      id="department_id"
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleChange}
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors bg-white"
                    >
                      <option value="">Select department (optional)</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {formData.role === 'faculty' && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label htmlFor="employee_number" className="block text-sm font-medium text-gray-700">Employee Number</label>
                    <input
                      type="text"
                      id="employee_number"
                      name="employee_number"
                      value={formData.employee_number}
                      onChange={handleChange}
                      placeholder="e.g. FAC001"
                      required
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title (Optional)</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Prof. Dr., Assoc. Prof."
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">Department (Optional)</label>
                    <select
                      id="department_id"
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleChange}
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors bg-white"
                    >
                      <option value="">Select department (optional)</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Creating Account...
                    </span>
                  ) : 'Register'}
                </button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
