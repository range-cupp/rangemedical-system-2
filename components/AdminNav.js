// /components/AdminNav.js
// Unified navigation for admin pages
// Range Medical

import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AdminNav({ title, subtitle }) {
  const router = useRouter();
  const path = router.pathname;

  const tabs = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/protocols', label: 'Protocols' },
    { href: '/admin/purchases', label: 'Purchases' },
    { href: '/admin/patients', label: 'Patients' }
  ];

  const isActive = (href) => {
    if (href === '/admin') return path === '/admin';
    return path.startsWith(href);
  };

  return (
    <header style={styles.header}>
      <div style={styles.headerContent}>
        <div>
          <h1 style={styles.title}>{title}</h1>
          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        </div>
        <nav style={styles.nav}>
          {tabs.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                ...styles.navLink,
                color: isActive(tab.href) ? '#fff' : 'rgba(255,255,255,0.6)'
              }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

const styles = {
  header: {
    background: '#000',
    color: '#fff',
    padding: '0'
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600'
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '13px',
    opacity: 0.7
  },
  nav: {
    display: 'flex',
    gap: '24px'
  },
  navLink: {
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'color 0.2s'
  }
};
