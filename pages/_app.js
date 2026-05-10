import '../styles/globals.css';
import { AuthProvider } from '../components/AuthProvider';
import AdminVoiceManager from '../components/AdminVoiceManager';
import { AdminNotificationsProvider } from '../components/AdminNotificationsProvider';
import { Analytics } from '@vercel/analytics/react';
import { Inter, Fraunces } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
});

function MyApp({ Component, pageProps }) {
  return (
    <div className={`${inter.variable} ${fraunces.variable}`}>
      <AuthProvider>
        <AdminNotificationsProvider>
          <AdminVoiceManager>
            <Component {...pageProps} />
          </AdminVoiceManager>
        </AdminNotificationsProvider>
        <Analytics />
      </AuthProvider>
    </div>
  );
}

export default MyApp;
