import '../styles/globals.css';
import { AuthProvider } from '../components/AuthProvider';
import { Analytics } from '@vercel/analytics/react';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Analytics />
    </AuthProvider>
  );
}

export default MyApp;
