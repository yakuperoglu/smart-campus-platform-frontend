
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import api from '../config/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            await api.post('/auth/forgot-password', { email });
            setStatus('success');
            setMessage('Password reset link has been sent to your email address.');
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Failed to send reset link. Please try again.');
        }
    };

    return (
        <>
            <Head>
                <title>Forgot Password - Smart Campus</title>
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

                    <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#34495e' }}>Forgot Password</h2>

                    {status === 'success' ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📧</div>
                            <p style={{ color: '#27ae60', marginBottom: '20px', lineHeight: '1.5' }}>{message}</p>
                            <Link href="/login" style={{
                                color: '#3498db',
                                textDecoration: 'none',
                                fontWeight: '600'
                            }}>
                                ← Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <p style={{ color: '#7f8c8d', marginBottom: '20px', textAlign: 'center', fontSize: '0.95rem' }}>
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

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
                                <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', color: '#34495e', fontWeight: '500' }}>Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="name@example.com"
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
                                disabled={status === 'loading'}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    backgroundColor: status === 'loading' ? '#95a5a6' : '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                                    marginBottom: '20px',
                                    transition: 'background 0.3s'
                                }}
                            >
                                {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                            </button>

                            <div style={{ textAlign: 'center' }}>
                                <Link href="/login" style={{
                                    color: '#7f8c8d',
                                    textDecoration: 'none',
                                    fontSize: '0.9rem'
                                }}>
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
