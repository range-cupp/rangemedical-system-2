// /pages/app/more.js
// More menu — quick links + logout — Range Medical Employee App

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../../components/AppLayout';

const LINKS = [
  { icon: '📞', label: 'Calls',              href: '/app/calls',           external: false },
  { icon: '📊', label: 'Full Admin Dashboard', href: '/admin',               external: true },
  { icon: '🧪', label: 'Labs',               href: '/admin/labs',           external: true },
  { icon: '⚖️', label: 'Weight Loss',         href: '/admin/weight-loss',    external: true },
  { icon: '💳', label: 'Payments',            href: '/admin/payments',       external: true },
  { icon: '📋', label: 'Full Service Log',    href: '/admin/service-log',    external: true },
  { icon: '📝', label: 'Tasks',               href: '/admin/tasks',          external: true },
  { icon: '📤', label: 'Send Forms',          href: '/admin/send-forms',     external: true },
];

export default function AppMore() {
  const router = useRouter();
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('staff_session');
    if (session) try { setStaff(JSON.parse(session)); } catch {}
  }, []);

  const handleLogout = () => {
    if (!confirm('Log out of the staff app?')) return;
    localStorage.removeItem('staff_session');
    router.replace('/app/login');
  };

  return (
    <>
      <Head>
        <title>More — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <AppLayout title="More">
        {/* Staff profile card */}
        {staff && (
          <div style={{ margin: '16px 12px 10px', background: '#0f172a', borderRadius: 14, padding: '20px 18px', color: '#fff' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
              {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{staff.name}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{staff.title}</div>
            {staff.email && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{staff.email}</div>}
          </div>
        )}

        {/* Quick links */}
        <div style={{ margin: '0 12px 10px', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {LINKS.map((link, i) => (
            <div
              key={link.href}
              onClick={() => link.external ? window.open(link.href, '_blank') : router.push(link.href)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderBottom: i < LINKS.length - 1 ? '1px solid #f1f5f9' : 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{link.icon}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{link.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round">
                {link.external
                  ? <><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>
                  : <path d="M9 18l6-6-6-6"/>
                }
              </svg>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div style={{ margin: '0 12px 24px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: '1.5px solid #fecaca',
              background: '#fff5f5',
              color: '#dc2626',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Log Out
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '0 0 32px', fontSize: 11, color: '#cbd5e1' }}>
          Range Medical Staff App · v1.0
        </div>
      </AppLayout>
    </>
  );
}
