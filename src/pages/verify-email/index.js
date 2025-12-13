/**
 * Email Verification Page (Query String Version)
 * Handles /verify-email?token=xxx format
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import api from '../../config/api';

export default function VerifyEmailQuery() {
    const router = useRouter();
    const { token } = router.query;

    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('E-posta adresiniz doğrulanıyor...');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (!router.isReady) return;
        
        // Token yoksa hata göster
        if (!token) {
            setStatus('error');
            setMessage('Geçersiz doğrulama linki. Token bulunamadı.');
            return;
        }

        const verifyEmail = async () => {
            try {
                await api.post('/auth/verify-email', { token });
                setStatus('success');
                setMessage('E-posta adresiniz başarıyla doğrulandı! Giriş sayfasına yönlendiriliyorsunuz.');

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

                return () => clearInterval(timer);

            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
                const errorMessage = error.response?.data?.error?.message || 
                                    error.response?.data?.message || 
                                    'Geçersiz veya süresi dolmuş doğrulama token\'ı. Lütfen yeni bir doğrulama e-postası isteyin.';
                setMessage(errorMessage);
            }
        };

        verifyEmail();
    }, [router.isReady, token, router]);

    return (
        <>
            <Head>
                <title>E-posta Doğrulama - Smart Campus</title>
            </Head>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    maxWidth: '450px',
                    width: '100%',
                    textAlign: 'center'
                }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h1 style={{ color: '#667eea', margin: 0, fontSize: '2rem' }}>🎓 Smart Campus</h1>
                    </div>

                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                        {status === 'verifying' && '⏳'}
                        {status === 'success' && '✅'}
                        {status === 'error' && '❌'}
                    </div>

                    <h2 style={{ 
                        marginBottom: '15px', 
                        color: status === 'success' ? '#27ae60' : status === 'error' ? '#e74c3c' : '#2d3748',
                        fontSize: '1.5rem'
                    }}>
                        {status === 'verifying' && 'E-posta Doğrulanıyor...'}
                        {status === 'success' && 'E-posta Doğrulandı!'}
                        {status === 'error' && 'Doğrulama Başarısız'}
                    </h2>

                    <p style={{ 
                        color: '#718096', 
                        lineHeight: '1.6', 
                        marginBottom: '30px',
                        fontSize: '1rem'
                    }}>
                        {message}
                    </p>

                    {status === 'verifying' && (
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '4px solid #e2e8f0',
                            borderTop: '4px solid #667eea',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto'
                        }} />
                    )}

                    {status === 'success' && (
                        <div style={{ 
                            marginTop: '20px', 
                            padding: '12px 20px',
                            backgroundColor: '#d4edda',
                            borderRadius: '8px',
                            color: '#155724'
                        }}>
                            {countdown} saniye içinde yönlendiriliyorsunuz...
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Link href="/login" style={{
                                display: 'inline-block',
                                padding: '14px 28px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease'
                            }}>
                                Giriş Sayfasına Git
                            </Link>
                            <Link href="/profile" style={{
                                display: 'inline-block',
                                padding: '12px 24px',
                                backgroundColor: 'transparent',
                                color: '#667eea',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontWeight: '500',
                                border: '2px solid #667eea'
                            }}>
                                Yeni Doğrulama E-postası İste
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}

