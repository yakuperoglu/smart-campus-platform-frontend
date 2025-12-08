import { useEffect } from 'react';

export default function App({ children }) {
  useEffect(() => {
    // Global initialization logic can go here
    console.log('App initialized');
  }, []);

  return <>{children}</>;
}

