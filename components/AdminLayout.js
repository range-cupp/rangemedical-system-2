// /components/AdminLayout.js
// Shared layout for all admin pages
// Range Medical

import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/protocols', label: 'Protocols', icon: '💉' },
  { href: '/admin/purchases', label: 'Purchases', icon: '💳' },
  { href: '/admin/patients', label: 'Patients', icon: '👥' }
];

export default function AdminLayout({ children, title = 'Admin' }) {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <>
      <Head>
        <title>{title} | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <Link href="/admin" style={styles.logo}>
              RANGE MEDICAL
            </Link>
          </div>
          <nav style={styles.nav}>
            {NAV_ITEMS.map(item => {
              const isActive = currentPath === item.href || 
                (item.href !== '/admin' && currentPath.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...styles.navLink,
                    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                    fontWeight: isActive ? '600' : '400'
                  }}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Main Content */}
        <main style={styles.main}>
          {children}
        </main>
      </div>
    </>
  );
}

// Shared styles that can be imported by pages
export const sharedStyles = {
  // Page layout
  pageHeader: {
    marginBottom: '24px'
  },
  pageTitle: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#000'
  },
  pageSubtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: '#666'
  },

  // Cards
  card: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600'
  },
  cardBody: {
    padding: '20px'
  },

  // Tables
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa'
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle'
  },
  trHover: {
    cursor: 'pointer',
    transition: 'background 0.15s'
  },

  // Buttons
  btnPrimary: {
    padding: '10px 20px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  btnSecondary: {
    padding: '10px 20px',
    background: '#fff',
    color: '#000',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  btnSmall: {
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '6px'
  },
  btnSuccess: {
    background: '#22c55e',
    color: '#fff',
    border: 'none'
  },
  btnDanger: {
    background: '#ef4444',
    color: '#fff',
    border: 'none'
  },

  // Forms
  input: {
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box'
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
    cursor: 'pointer'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
    marginBottom: '6px'
  },
  fieldGroup: {
    marginBottom: '16px'
  },

  // Badges
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  badgeActive: {
    background: '#dcfce7',
    color: '#166534'
  },
  badgeCompleted: {
    background: '#e5e5e5',
    color: '#666'
  },
  badgePending: {
    background: '#fef3c7',
    color: '#92400e'
  },

  // Stats
  statCard: {
    padding: '20px',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e5e5'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: 1
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  // Search/Filter bar
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  searchInput: {
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    width: '280px'
  },

  // Empty states
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#666'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  emptyText: {
    fontSize: '16px',
    marginBottom: '8px'
  },

  // Loading
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
    color: '#666'
  },

  // Day tracking display
  dayDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px'
  },
  dayNumber: {
    fontSize: '24px',
    fontWeight: '700'
  },
  dayTotal: {
    fontSize: '16px',
    color: '#999'
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600'
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
  },
  modalFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
    padding: '0',
    lineHeight: 1
  }
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    background: '#000',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  logo: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    textDecoration: 'none'
  },
  nav: {
    display: 'flex',
    gap: '4px'
  },
  navLink: {
    color: '#fff',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background 0.15s'
  },
  navIcon: {
    fontSize: '16px'
  },
  main: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  }
};
