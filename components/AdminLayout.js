// /components/AdminLayout.js
// Shared sidebar layout for all admin pages
// Range Medical System V2

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from './AuthProvider';
import StaffChatPanel from './StaffChatPanel';

// SMS notification sound — two-tone "ding-ding" (880Hz + 1100Hz)
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = delay === 0 ? 880 : 1100; // A5 then C#6
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch (e) {
    // Audio not available — silent fail
  }
}

// New patient notification sound — three-tone ascending chime (distinct from SMS)
function playNewPatientSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Three ascending tones: C6 → E6 → G6 (major triad, welcoming feel)
    [0, 0.18, 0.36].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = [1047, 1319, 1568][i]; // C6, E6, G6
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.35);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch (e) {
    // Audio not available — silent fail
  }
}

// Hook for unread SMS polling + notifications
function useUnreadNotifications(router) {
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);
  const hasInteractedRef = useRef(false);
  const notifPermissionRef = useRef('default');

  // Track user interaction (needed for autoplay policy)
  useEffect(() => {
    const handleInteraction = () => {
      hasInteractedRef.current = true;
      // Request notification permission on first interaction
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().then(p => {
          notifPermissionRef.current = p;
        });
      }
    };
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });

    // Check current notification permission
    if (typeof Notification !== 'undefined') {
      notifPermissionRef.current = Notification.permission;
    }

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Poll for unread messages — only when tab is visible
  useEffect(() => {
    let mounted = true;
    let interval = null;

    const checkUnread = async () => {
      // Skip if tab is hidden (prevents background tabs from flooding connections)
      if (document.visibilityState === 'hidden') return;
      try {
        const res = await fetch('/api/admin/unread-sms');
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        const newCount = data.count || 0;
        const prevCount = prevCountRef.current;

        setUnreadCount(newCount);

        // New message arrived — play sound + show notification
        if (newCount > prevCount && prevCount >= 0 && hasInteractedRef.current) {
          playNotificationSound();

          // Browser notification
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && data.latest) {
            const notif = new Notification('New SMS — Range Medical', {
              body: `${data.latest.patientName}: ${data.latest.message}`,
              icon: '/favicon.ico',
              tag: 'range-sms',
            });
            notif.onclick = () => {
              window.focus();
              router.push('/admin/communications');
              notif.close();
            };
            setTimeout(() => notif.close(), 8000);
          }
        }

        prevCountRef.current = newCount;
      } catch (e) {
        // Silent fail — don't disrupt the UI
      }
    };

    const startPolling = () => {
      if (interval) clearInterval(interval);
      checkUnread();
      interval = setInterval(checkUnread, 120000); // Poll every 2 minutes
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible — check immediately and resume polling
        startPolling();
      } else {
        // Tab hidden — stop polling to free connections
        if (interval) { clearInterval(interval); interval = null; }
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [router]);

  return unreadCount;
}

// Hook for new external patient notifications
function useNewPatientNotifications(router) {
  const latestTimestampRef = useRef(null);
  const hasInteractedRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    const handleInteraction = () => { hasInteractedRef.current = true; };
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let interval = null;

    const checkNewPatients = async () => {
      // Skip if tab is hidden
      if (document.visibilityState === 'hidden') return;
      try {
        const since = latestTimestampRef.current;
        const url = since
          ? `/api/admin/new-patients-check?since=${encodeURIComponent(since)}`
          : '/api/admin/new-patients-check';
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        if (data.latestTimestamp) {
          latestTimestampRef.current = data.latestTimestamp;
        }

        if (!initializedRef.current) {
          initializedRef.current = true;
          return;
        }

        if (data.newPatients && data.newPatients.length > 0 && hasInteractedRef.current) {
          const patient = data.newPatients[0];
          playNewPatientSound();

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notif = new Notification('New Patient — Range Medical', {
              body: `${patient.name} just entered the system`,
              icon: '/favicon.ico',
              tag: 'range-new-patient',
            });
            notif.onclick = () => {
              window.focus();
              router.push(`/patients/${patient.id}`);
              notif.close();
            };
            setTimeout(() => notif.close(), 8000);
          }
        }
      } catch (e) {
        // Silent fail
      }
    };

    const startPolling = () => {
      if (interval) clearInterval(interval);
      checkNewPatients();
      interval = setInterval(checkNewPatients, 120000); // Poll every 2 minutes
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        if (interval) { clearInterval(interval); interval = null; }
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [router]);
}

// Hook for unread task count badge
function useUnreadTasks(employeeId) {
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    let interval = null;

    const checkTasks = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const res = await fetch(`/api/admin/unread-tasks?employee_id=${employeeId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setTaskCount(data.count || 0);
      } catch (e) {
        // Silent fail
      }
    };

    const startPolling = () => {
      if (interval) clearInterval(interval);
      checkTasks();
      interval = setInterval(checkTasks, 120000); // Poll every 2 minutes
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        if (interval) { clearInterval(interval); interval = null; }
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [employeeId]);

  return taskCount;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'grid' },
  { href: '/admin/patients', label: 'Patients', icon: 'users' },
  { href: '/admin/protocols', label: 'Protocols', icon: 'activity' },
  { href: '/admin/schedule', label: 'Schedule', icon: 'calendar' },
  { href: '/admin/labs', label: 'Labs', icon: 'flask' },
  { href: '/admin/weight-loss', label: 'Weight Loss', icon: 'trending-down' },
  { href: '/admin/service-log', label: 'Service Log', icon: 'clipboard' },
  { href: '/admin/medications', label: 'Medications', icon: 'pill' },
  { href: '/admin/payments', label: 'Payments', icon: 'credit-card' },
  { href: '/admin/communications', label: 'Communications', icon: 'message' },
  { href: '/admin/tasks', label: 'Tasks', icon: 'check-square' },
  { href: '/staff-chat', label: 'Assistant', icon: 'message' },
  { href: '/admin/send-forms', label: 'Send Forms', icon: 'file-text' },
  { href: '/admin/knowledge', label: 'Knowledge Base', icon: 'book-open' },
  { href: '/admin/documents', label: 'Documents', icon: 'printer' },
  { href: '/admin/snippets', label: 'Snippets', icon: 'file-text' },
  { href: '/admin/provider-schedule', label: 'Staff Hours', icon: 'clock' },
  { href: '/admin/employees', label: 'Employees', icon: 'user-check', permission: 'can_manage_employees' },
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
  'trending-down': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  clipboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  pill: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="8" rx="4" ry="4" transform="rotate(-45 12 12)" /><line x1="12" y1="2" x2="12" y2="22" transform="rotate(-45 12 12)" />
    </svg>
  ),
  'credit-card': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  'shopping-bag': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
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
  'file-text': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  printer: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  'book-open': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  'user-check': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
    </svg>
  ),
  'check-square': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  'log-out': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
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

export default function AdminLayout({ children, title = 'Admin', actions, hideHeader = false }) {
  const router = useRouter();
  const currentPath = router.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const unreadCount = useUnreadNotifications(router);
  useNewPatientNotifications(router);
  const { employee, loading: authLoading, signOut, hasPermission, isAuthenticated } = useAuth();
  const taskCount = useUnreadTasks(employee?.id);

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show nothing while checking auth
  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#666' }}>
        Loading...
      </div>
    );
  }

  // Filter nav items based on permissions
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <>
      <Head>
        <title>{unreadCount > 0 ? `(${unreadCount}) ` : ''}{title} | Range Medical</title>
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
        <aside data-admin-sidebar className={sidebarOpen ? 'open' : ''} style={{
          ...styles.sidebar,
          ...(sidebarOpen ? styles.sidebarOpen : {})
        }}>
          <div style={styles.logoArea}>
            <Link href="/admin" style={styles.logo}>
              RANGE MEDICAL
            </Link>
          </div>

          <nav style={styles.nav}>
            {visibleNavItems.map(item => {
              const isActive = currentPath === item.href ||
                (item.href !== '/admin' && currentPath.startsWith(item.href)) ||
                (item.href === '/admin/patients' && currentPath.startsWith('/patients'));
              const showBadge = (item.href === '/admin/communications' && unreadCount > 0)
                || (item.href === '/admin/tasks' && taskCount > 0);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...styles.navLink,
                    background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                    fontWeight: isActive ? '600' : '400',
                    position: 'relative',
                  }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span style={styles.navIcon}>{icons[item.icon]}</span>
                  {item.label}
                  {showBadge && (
                    <span style={styles.unreadBadge}>
                      {item.href === '/admin/tasks'
                        ? (taskCount > 99 ? '99+' : taskCount)
                        : (unreadCount > 99 ? '99+' : unreadCount)}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div style={styles.sidebarFooter}>
            <Link href="/admin/command-center" style={styles.commandCenterLink}>
              Command Center
            </Link>
            {employee && (
              <div style={styles.employeeInfo}>
                <div style={styles.employeeAvatar}>
                  {(employee.name || '?')[0].toUpperCase()}
                </div>
                <div style={styles.employeeDetails}>
                  <div style={styles.employeeName}>{employee.name}</div>
                  <div style={styles.employeeTitle}>{employee.title}{employee.is_admin ? ' · Admin' : ''}</div>
                </div>
                <button
                  onClick={signOut}
                  style={styles.signOutBtn}
                  title="Sign out"
                >
                  {icons['log-out']}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div data-admin-main style={styles.mainWrapper}>
          {/* Mobile header */}
          <header data-admin-mobile-header style={styles.mobileHeader}>
            <button
              style={styles.menuBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? icons.x : icons.menu}
            </button>
            <span style={styles.mobileTitle}>{title}</span>
          </header>

          {/* Page header */}
          {(title !== 'Admin' && !hideHeader) && (
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

      {/* Floating staff chat — available on every admin page */}
      <StaffChatPanel />
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
  unreadBadge: {
    marginLeft: 'auto',
    background: '#ef4444',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    minWidth: '20px',
    height: '20px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px',
    lineHeight: 1,
    animation: 'pulse-badge 2s ease-in-out infinite',
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
  employeeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    marginTop: '8px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)',
  },
  employeeAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    flexShrink: 0,
  },
  employeeDetails: {
    flex: 1,
    minWidth: 0,
  },
  employeeName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  employeeTitle: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
  },
  signOutBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.15s',
    flexShrink: 0,
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
      @keyframes pulse-badge {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.1); }
      }
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
