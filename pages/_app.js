import '../styles/globals.css';
import { AuthProvider } from '../components/AuthProvider';
import AdminVoiceManager from '../components/AdminVoiceManager';
import { AdminNotificationsProvider } from '../components/AdminNotificationsProvider';
import { Analytics } from '@vercel/analytics/react';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AdminNotificationsProvider>
        <AdminVoiceManager>
          <Component {...pageProps} />
        </AdminVoiceManager>
      </AdminNotificationsProvider>
      <Analytics />
    </AuthProvider>
  );
}

export default MyApp;
