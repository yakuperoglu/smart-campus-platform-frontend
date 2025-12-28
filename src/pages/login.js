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

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors mb-2">
              ← Back to Home
            </Link>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">🎓 Smart Campus</h1>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">Welcome Back</h2>
              <p className="mt-1 text-sm text-gray-500">Sign in to continue to your account</p>
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@smartcampus.edu"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Signing in...
                    </span>
                  ) : 'Sign In'}
                </button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Don&apos;t have an account?
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register for an account
              </Link>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 space-y-1 border border-gray-100">
              <p className="font-semibold text-gray-700 mb-2">Demo Credentials:</p>
              <div className="grid grid-cols-1 gap-1">
                <p><span className="font-medium">Admin:</span> admin@smartcampus.edu / admin123</p>
                <p><span className="font-medium">Faculty:</span> john.doe@smartcampus.edu / faculty123</p>
                <p><span className="font-medium">Student:</span> student1@smartcampus.edu / student123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
