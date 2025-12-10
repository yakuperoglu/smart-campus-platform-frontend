
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import api from '../../config/api';

export default function VerifyEmail() {
    const router = useRouter();
    const { token } = router.query;

    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email address...');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (!router.isReady || !token) return;

        const verifyEmail = async () => {
            try {
                await api.post('/auth/verify-email', { token });
                setStatus('success');
                setMessage('Your email has been successfully verified! You will be redirected to the login page.');

                // Start countdown to redirect
                const timer = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            router.push('/login');
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage(error.response?.data?.message || 'Invalid or expired verification token. Please request a new one.');
            }
        };

        verifyEmail();
    }, [router.isReady, token, router]);

    return (
        <>
            <Head>
                <title>Verify Email - Smart Campus</title>
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
                    width: '100%',
                    textAlign: 'center'
                }}>
                    <div className="brand" style={{ marginBottom: '30px' }}>
                        <h1 style={{ color: '#2c3e50', margin: 0 }}>🎓 Smart Campus</h1>
                    </div>

                    <div className="status-icon" style={{ fontSize: '48px', marginBottom: '20px' }}>
                        {status === 'verifying' && '⏳'}
                        {status === 'success' && '✅'}
                        {status === 'error' && '❌'}
                    </div>

                    <h2 style={{ marginBottom: '15px', color: '#34495e' }}>
                        {status === 'verifying' && 'Verifying Email...'}
                        {status === 'success' && 'Email Verified!'}
                        {status === 'error' && 'Verification Failed'}
                    </h2>

                    <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '30px' }}>
                        {message}
                    </p>

                    {status === 'success' && (
                        <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#95a5a6' }}>
                            Redirecting in {countdown} seconds...
                        </div>
                    )}

                    {status === 'error' && (
                        <Link href="/login" style={{
                            display: 'inline-block',
                            padding: '12px 24px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            transition: 'background 0.3s'
                        }}>
                            Go to Login
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}
