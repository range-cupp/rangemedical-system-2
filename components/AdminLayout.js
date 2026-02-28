// /components/AdminLayout.js
// Shared sidebar layout for all admin pages
// Range Medical System V2

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'grid' },
  { href: '/admin/patients', label: 'Patients', icon: 'users' },
  { href: '/admin/protocols', label: 'Protocols', icon: 'activity' },
  { href: '/admin/journeys', label: 'Journeys', icon: 'map' },
  { href: '/admin/schedule', label: 'Schedule', icon: 'calendar' },
  { href: '/admin/labs', label: 'Labs', icon: 'flask' },
  { href: '/admin/service-log', label: 'Service Log', icon: 'clipboard' },
  { href: '/admin/payments', label: 'Payments', icon: 'credit-card' },
  { href: '/admin/communications', label: 'Communications', icon: 'message' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' }
];

// Simple SVG icons to avoid external dependency
const icons = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  activity: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  flask: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6v7l5 8H4l5-8V3z" /><line x1="8" y1="3" x2="16" y2="3" />
    </svg>
  ),
  clipboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  'credit-card': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  map: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  message: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  x: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
};

export default function AdminLayout({ children, title = 'Admin', actions }) {
  const router = useRouter();
  const currentPath = router.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Head>
        <title>{title} | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            style={styles.overlay}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside style={{
          ...styles.sidebar,
          ...(sidebarOpen ? styles.sidebarOpen : {})
        }}>
          <div style={styles.logoArea}>
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
                    background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                    fontWeight: isActive ? '600' : '400'
                  }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span style={styles.navIcon}>{icons[item.icon]}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={styles.sidebarFooter}>
            <Link href="/admin/command-center" style={styles.commandCenterLink}>
              Command Center
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div style={styles.mainWrapper}>
          {/* Mobile header */}
          <header style={styles.mobileHeader}>
            <button
              style={styles.menuBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? icons.x : icons.menu}
            </button>
            <span style={styles.mobileTitle}>{title}</span>
          </header>

          {/* Page header */}
          {(title !== 'Admin') && (
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>{title}</h1>
              {actions && <div style={styles.pageActions}>{actions}</div>}
            </div>
          )}

          {/* Page content */}
          <main style={styles.main}>
            {children}
          </main>
        </div>
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
    display: 'flex',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 199
  },
  sidebar: {
    width: '240px',
    minWidth: '240px',
    background: '#000',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 200,
    transition: 'transform 0.2s ease'
  },
  sidebarOpen: {},
  logoArea: {
    padding: '20px 20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  logo: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '2px',
    textDecoration: 'none'
  },
  nav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflowY: 'auto'
  },
  navLink: {
    textDecoration: 'none',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'background 0.15s, color 0.15s'
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    width: '18px',
    flexShrink: 0
  },
  sidebarFooter: {
    padding: '12px 8px 16px',
    borderTop: '1px solid rgba(255,255,255,0.1)'
  },
  commandCenterLink: {
    display: 'block',
    textDecoration: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'color 0.15s'
  },
  mainWrapper: {
    flex: 1,
    marginLeft: '240px',
    background: '#f5f5f5',
    minHeight: '100vh',
    minWidth: 0,
    overflow: 'hidden'
  },
  mobileHeader: {
    display: 'none',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: '#000',
    color: '#fff'
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center'
  },
  mobileTitle: {
    fontSize: '16px',
    fontWeight: '600'
  },
  pageHeader: {
    padding: '24px 24px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#000'
  },
  pageActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  main: {
    padding: '24px',
    overflowX: 'auto'
  }
};

// Add responsive CSS via style tag (injected once)
if (typeof document !== 'undefined') {
  const styleId = 'admin-layout-responsive';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @media (max-width: 768px) {
        [data-admin-sidebar] {
          transform: translateX(-100%);
        }
        [data-admin-sidebar].open {
          transform: translateX(0);
        }
        [data-admin-main] {
          margin-left: 0 !important;
        }
        [data-admin-mobile-header] {
          display: flex !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
