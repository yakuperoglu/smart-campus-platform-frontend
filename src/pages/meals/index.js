/**
 * Meals Index Page
 * 
 * Redirects to menu page or shows overview.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

export default function MealsIndexPage() {
    const router = useRouter();

    // Auto-redirect to menu
    useEffect(() => {
        router.replace('/meals/menu');
    }, []);

    return (
        <>
            <Head>
                <title>Meals - Smart Campus</title>
            </Head>
            <Navbar />

            <div style={styles.container}>
                <h1 style={styles.title}>🍽️ Cafeteria</h1>
                <div style={styles.cardGrid}>
                    <Link href="/meals/menu" style={styles.card}>
                        <span style={styles.cardIcon}>📋</span>
                        <span style={styles.cardTitle}>Browse Menu</span>
                        <span style={styles.cardDesc}>See today's meals and reserve</span>
                    </Link>
                    <Link href="/meals/reservations" style={styles.card}>
                        <span style={styles.cardIcon}>🎫</span>
                        <span style={styles.cardTitle}>My Reservations</span>
                        <span style={styles.cardDesc}>View your QR codes</span>
                    </Link>
                </div>
                <p style={styles.redirect}>Redirecting to menu...</p>
            </div>
        </>
    );
}

const styles = {
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px 24px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        marginBottom: '32px'
    },
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '16px',
        textDecoration: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    },
    cardIcon: {
        fontSize: '40px',
        marginBottom: '12px'
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '4px'
    },
    cardDesc: {
        fontSize: '14px',
        color: '#6B7280'
    },
    redirect: {
        color: '#9CA3AF',
        fontSize: '14px'
    }
};

// Force SSR to prevent static generation errors
export async function getServerSideProps() {
    return { props: {} };
}
