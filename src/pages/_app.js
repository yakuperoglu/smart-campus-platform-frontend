/**
 * Next.js App Component
 * Wraps all pages with AuthProvider
 */

import Head from 'next/head';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';
import './Auth.css';
import './Dashboard.css';
import './Landing.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🎓</text></svg>" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}
