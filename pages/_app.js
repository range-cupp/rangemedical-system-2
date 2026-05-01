import '../styles/globals.css';
import { AuthProvider } from '../components/AuthProvider';
import AdminVoiceManager from '../components/AdminVoiceManager';
import { Analytics } from '@vercel/analytics/react';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AdminVoiceManager>
        <Component {...pageProps} />
      </AdminVoiceManager>
      <Analytics />
    </AuthProvider>
  );
}

export default MyApp;
