import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [apiStatus, setApiStatus] = useState('Checking...');

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/health`);
        const data = await response.json();
        setApiStatus(data.status === 'ok' ? 'Connected ✅' : 'Error ❌');
      } catch (error) {
        setApiStatus('Disconnected ❌');
      }
    };

    checkApi();
  }, []);

  return (
    <>
      <Head>
        <title>Smart Campus Platform</title>
        <meta name="description" content="Akıllı Kampüs Platformu" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Smart Campus Platform
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#666' }}>
          Akıllı Kampüs Platformu
        </p>
        <div style={{ 
          padding: '1rem 2rem', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '8px',
          fontSize: '1rem'
        }}>
          <strong>Backend API Status:</strong> {apiStatus}
        </div>
      </main>
    </>
  );
}

