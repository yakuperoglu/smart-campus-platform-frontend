
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import api from '../../config/api';

export default function ResetPassword() {
    const router = useRouter();
    const { token } = router.query;

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        if (formData.password !== formData.confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setStatus('error');
            setMessage('Password must be at least 8 characters long');
            return;
        }

        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword: formData.password
            });
            setStatus('success');
            setMessage('Your password has been successfully reset.');
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Failed to reset password. Link may be expired.');
        }
    };

    if (!router.isReady) return null;

    return (
        <>
            <Head>
                <title>Reset Password - Smart Campus</title>
            </Head>

            <div className="auth-container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f5f7fa',
                padding: '20px'
            }}>
                <div className="auth-card" style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    maxWidth: '450px',
                    width: '100%'
                }}>
                    <div className="brand" style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h1 style={{ color: '#2c3e50', margin: 0 }}>🎓 Smart Campus</h1>
                    </div>

                    <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#34495e' }}>Set New Password</h2>

                    {status === 'success' ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
                            <p style={{ color: '#27ae60', marginBottom: '20px', lineHeight: '1.5' }}>{message}</p>
                            <Link href="/login" style={{
                                display: 'inline-block',
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#3498db',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                fontWeight: '600'
                            }}>
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {!token && (
                                <div style={{
                                    backgroundColor: '#fee2e2',
                                    color: '#c0392b',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    marginBottom: '20px',
                                    textAlign: 'center'
                                }}>
                                    Invalid or missing reset token.
                                </div>
                            )}

                            {status === 'error' && (
                                <div style={{
                                    backgroundColor: '#fee2e2',
                                    color: '#c0392b',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    marginBottom: '20px',
                                    fontSize: '0.9rem',
                                    textAlign: 'center'
                                }}>
                                    {message}
                                </div>
                            )}

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', color: '#34495e', fontWeight: '500' }}>New Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Min 8 chars"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        border: '1px solid #bdc3c7',
                                        fontSize: '1rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '8px', color: '#34495e', fontWeight: '500' }}>Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Re-type password"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        border: '1px solid #bdc3c7',
                                        fontSize: '1rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading' || !token}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    backgroundColor: (status === 'loading' || !token) ? '#95a5a6' : '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: (status === 'loading' || !token) ? 'not-allowed' : 'pointer',
                                    marginBottom: '20px',
                                    transition: 'background 0.3s'
                                }}
                            >
                                {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
