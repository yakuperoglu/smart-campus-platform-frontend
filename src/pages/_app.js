/**
 * Next.js App Component
 * Wraps all pages with AuthProvider
 */

import Head from 'next/head';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';
// Component styles will be moved to Tailwind classes
// import '../styles/Auth.css';
// import '../styles/Dashboard.css';
// import '../styles/Landing.css';
// import '../styles/Courses.css';


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
