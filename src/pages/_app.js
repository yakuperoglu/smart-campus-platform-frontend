/**
 * Next.js App Component
 * Wraps all pages with AuthProvider
 */

import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';
import './Auth.css';
import './Dashboard.css';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
