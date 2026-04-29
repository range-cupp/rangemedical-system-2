// /components/AdminLayout.js
// Shared sidebar layout for all admin pages
// Range Medical System V2

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from './AuthProvider';
import StaffChatPanel from './StaffChatPanel';
import StaffMessagingPanel from './StaffMessagingPanel';
import AdminCallBar from './AdminCallBar';
import useVoiceCall from '../hooks/useVoiceCall';
import { VoiceProvider } from './VoiceContext';

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

// Hook for unread SMS polling + notifications + in-app toast
function useUnreadNotifications(router) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  const prevCountRef = useRef(0);
  const hasInteractedRef = useRef(false);
  const notifPermissionRef = useRef('default');
  const toastTimeoutRef = useRef(null);

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

  const showToast = useCallback((data) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({
      patientName: data.patientName || 'Unknown',
      message: data.message || '',
      patientId: data.patientId || null,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' , timeZone: 'America/Los_Angeles' }),
    });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 15000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
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

        // Badge shows conversations needing response (matches what the page displays)
        setUnreadCount(data.needsResponseCount || 0);

        // New message arrived — play sound + show notifications
        if (newCount > prevCount && prevCount >= 0 && hasInteractedRef.current) {
          playNotificationSound();

          // In-app toast notification
          if (data.latest) {
            showToast({
              patientName: data.latest.patientName,
              message: data.latest.message,
              patientId: data.latest.patientId || null,
            });
          }

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
      interval = setInterval(checkUnread, 15000); // Poll every 15 seconds
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
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [router, showToast]);

  return { unreadCount, toast, dismissToast };
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
      interval = setInterval(checkNewPatients, 180000); // Poll every 3 minutes (less urgent)
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

// Purchase notification sound — descending two-tone "ka-ching" (distinct from SMS and patient)
function playPurchaseSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Two quick descending tones: E6 → C6 (cash register feel)
    [0, 0.12].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = i === 0 ? 1319 : 1047; // E6, C6
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.25);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch (e) {
    // Audio not available — silent fail
  }
}

// Hook for new purchase notifications (badge + toast)
function useNewPurchaseNotifications(router) {
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [purchaseToast, setPurchaseToast] = useState(null);
  const latestTimestampRef = useRef(null);
  const hasInteractedRef = useRef(false);
  const initializedRef = useRef(false);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    const handleInteraction = () => { hasInteractedRef.current = true; };
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const dismissPurchaseToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setPurchaseToast(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    let interval = null;

    const checkPurchases = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const since = latestTimestampRef.current;
        const url = since
          ? `/api/admin/new-purchases-check?since=${encodeURIComponent(since)}`
          : '/api/admin/new-purchases-check';
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        if (data.latestTimestamp) {
          latestTimestampRef.current = data.latestTimestamp;
        }

        setPurchaseCount(data.todayCount || 0);

        if (!initializedRef.current) {
          initializedRef.current = true;
          return;
        }

        // New purchase arrived — play sound + show toast + browser notification
        if (data.newPurchases?.length > 0 && hasInteractedRef.current) {
          const purchase = data.newPurchases[0];
          playPurchaseSound();

          // In-app toast
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          setPurchaseToast({
            name: purchase.patient_name || 'Unknown',
            item: purchase.item_name || 'Purchase',
            amount: `$${(purchase.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' , timeZone: 'America/Los_Angeles' }),
          });
          toastTimeoutRef.current = setTimeout(() => {
            if (mounted) setPurchaseToast(null);
          }, 15000);

          // Browser notification
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notif = new Notification('New Purchase — Range Medical', {
              body: `${purchase.patient_name}: ${purchase.item_name} — $${(purchase.amount || 0).toFixed(2)}`,
              icon: '/favicon.ico',
              tag: 'range-purchase',
            });
            notif.onclick = () => {
              window.focus();
              router.push('/admin/payments');
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
      checkPurchases();
      interval = setInterval(checkPurchases, 30000); // Poll every 30 seconds
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
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [router]);

  return { purchaseCount, purchaseToast, dismissPurchaseToast };
}

// Task notification sound — single low "thunk" tone (distinct from SMS ding and patient chime)
function playTaskSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Two-tone descending: D5 → A4 (task/assignment feel)
    [0, 0.14].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = i === 0 ? 587 : 440; // D5, A4
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch (e) {
    // Audio not available — silent fail
  }
}

// Hook for task notifications — badge count, overdue count, sound, toast, browser notification
function useUnreadTasks(employeeId, router) {
  const [taskCount, setTaskCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [taskToast, setTaskToast] = useState(null);
  const latestTimestampRef = useRef(null);
  const hasInteractedRef = useRef(false);
  const initializedRef = useRef(false);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    const handleInteraction = () => { hasInteractedRef.current = true; };
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const dismissTaskToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setTaskToast(null);
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    let interval = null;

    const checkTasks = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const since = latestTimestampRef.current;
        const url = since
          ? `/api/admin/unread-tasks?employee_id=${employeeId}&since=${encodeURIComponent(since)}`
          : `/api/admin/unread-tasks?employee_id=${employeeId}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        setTaskCount(data.count || 0);
        setOverdueCount(data.overdueCount || 0);

        if (data.latestTimestamp) {
          latestTimestampRef.current = data.latestTimestamp;
        }

        // Skip notifications on first load (just initialize)
        if (!initializedRef.current) {
          initializedRef.current = true;
          return;
        }

        // New tasks arrived — play sound + show toast + browser notification
        if (data.newTasks?.length > 0 && hasInteractedRef.current) {
          const task = data.newTasks[0]; // Most recent new task
          playTaskSound();

          // In-app toast
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          setTaskToast({
            title: task.title?.length > 80 ? task.title.slice(0, 80) + '...' : task.title,
            from: task.assigned_by_name || 'Unknown',
            priority: task.priority,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' , timeZone: 'America/Los_Angeles' }),
          });
          toastTimeoutRef.current = setTimeout(() => {
            if (mounted) setTaskToast(null);
          }, 15000);

          // Browser notification
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const priorityLabel = task.priority === 'urgent' ? '🔴 URGENT — ' : task.priority === 'high' ? '🟠 ' : '';
            const notif = new Notification(`${priorityLabel}New Task — Range Medical`, {
              body: `From ${task.assigned_by_name}: ${task.title}`,
              icon: '/favicon.ico',
              tag: 'range-task',
            });
            notif.onclick = () => {
              window.focus();
              router.push('/admin/tasks');
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
      checkTasks();
      interval = setInterval(checkTasks, 30000); // Poll every 30 seconds
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
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [employeeId, router]);

  return { taskCount, overdueCount, taskToast, dismissTaskToast };
}

// group: 'medical' = clinical sidebar, 'business' = operations sidebar, undefined = show in both
const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'grid' },
  { href: '/admin/follow-ups', label: 'Follow-Ups', icon: 'bell' },
  { href: '/admin/pipelines', label: 'Pipelines', icon: 'trending-down', group: 'business' },
  { href: '/admin/referrals', label: 'Referrals', icon: 'user-plus', group: 'business' },
  { href: '/admin/patients', label: 'Patients', icon: 'users' },
  { href: '/admin/schedule', label: 'Schedule', icon: 'calendar', group: 'medical' },
  { href: '/admin/recovery', label: 'Recovery', icon: 'activity', group: 'business' },
  { href: '/admin/checkout', label: 'Checkout', icon: 'shopping-bag', group: 'business' },
  { href: '/admin/quotes', label: 'Quotes', icon: 'file-text', group: 'business' },
  { href: '/admin/payments', label: 'Payments', icon: 'credit-card', group: 'business' },
  { href: '/admin/clinic-sources', label: 'Clinic Sources', icon: 'pie-chart', adminOnly: true, group: 'business' },
  { href: '/admin/communications', label: 'Communications', icon: 'message' },
  { href: '/admin/email-campaigns', label: 'Email Campaigns', icon: 'mail', adminOnly: true, group: 'business' },
  { href: '/admin/google-reviews', label: 'Google Reviews', icon: 'star', adminOnly: true, group: 'business' },
  { href: '/admin/tasks', label: 'Tasks', icon: 'check-square', group: 'business' },
  { href: '/staff-chat', label: 'Assistant', icon: 'message', group: 'business' },
  { href: '/admin/send-forms', label: 'Send Forms', icon: 'file-text', group: 'medical' },
  { href: '/admin/peptide-guide', label: 'Peptide Guide', icon: 'flask', group: 'business' },
  { href: '/admin/shop-access', label: 'Shop Access', icon: 'shopping-bag', group: 'business' },
  { href: '/admin/snippets', label: 'Snippets', icon: 'file-text', group: 'business' },
  { href: '/admin/provider-schedule', label: 'Staff Hours', icon: 'clock', group: 'business' },
  { href: '/admin/employees', label: 'Employees', icon: 'user-check', permission: 'can_manage_employees', group: 'business' },
  { href: '/admin/employee-activity', label: 'Employee Activity', icon: 'activity', permission: 'can_manage_employees', group: 'business' },
  { href: '/admin/data-health', label: 'Data Health', icon: 'activity', adminOnly: true, group: 'business' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' }
];

// Simple SVG icons to avoid external dependency
const icons = {
  star: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  monitor: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
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
  'user-plus': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
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
  ),
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22 7 12 13 2 7" />
    </svg>
  ),
  zap: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  'alert-circle': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  'pie-chart': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
};

// Primary mobile tabs — the 5 most-used screens
const MOBILE_TABS = [
  { href: '/admin', label: 'Home', icon: 'grid' },
  { href: '/admin/schedule', label: 'Schedule', icon: 'calendar' },
  { href: '/admin/communications', label: 'Messages', icon: 'message', badgeKey: 'unread' },
  { href: '/admin/tasks', label: 'Tasks', icon: 'check-square', badgeKey: 'tasks' },
  { href: '#more', label: 'More', icon: 'menu' },
];

export default function AdminLayout({ children, title = 'Admin', actions, hideHeader = false, viewMode = null }) {
  const router = useRouter();
  const currentPath = router.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [editNav, setEditNav] = useState(false);
  const [hiddenNav, setHiddenNav] = useState([]);
  const [globalViewMode, setGlobalViewMode] = useState('both'); // 'medical' | 'business' | 'both'
  const { unreadCount, toast, dismissToast } = useUnreadNotifications(router);
  useNewPatientNotifications(router);
  const { purchaseCount, purchaseToast, dismissPurchaseToast } = useNewPurchaseNotifications(router);
  const { employee, loading: authLoading, signOut, hasPermission, isAuthenticated } = useAuth();
  const { taskCount, overdueCount, taskToast, dismissTaskToast } = useUnreadTasks(employee?.id, router);
  // Browser softphone — only registers if this employee has voice_browser_enabled = true
  const voice = useVoiceCall({ employeeId: employee?.id });

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Per-user hidden nav items (localStorage) — must run on every render to keep hook order stable
  const hiddenStorageKey = employee?.id ? `sidebar_hidden_${employee.id}` : null;
  useEffect(() => {
    if (!hiddenStorageKey) return;
    try {
      const raw = localStorage.getItem(hiddenStorageKey);
      if (raw) setHiddenNav(JSON.parse(raw));
    } catch {}
  }, [hiddenStorageKey]);

  // Global view mode — persisted per user in localStorage
  const viewModeStorageKey = employee?.id ? `sidebar_viewmode_${employee.id}` : null;
  useEffect(() => {
    if (!viewModeStorageKey) return;
    try {
      const saved = localStorage.getItem(viewModeStorageKey);
      if (saved && ['medical', 'business', 'both'].includes(saved)) setGlobalViewMode(saved);
    } catch {}
  }, [viewModeStorageKey]);

  const setAndPersistViewMode = (mode) => {
    setGlobalViewMode(mode);
    if (viewModeStorageKey) {
      try { localStorage.setItem(viewModeStorageKey, mode); } catch {}
    }
  };

  // Show nothing while checking auth
  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#666' }}>
        Loading...
      </div>
    );
  }

  // Filter nav items based on permissions
  const permittedNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && !employee?.is_admin) return false;
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  // Filter by viewMode: page-level viewMode (patient profile) takes priority, else use global
  const effectiveViewMode = viewMode || (globalViewMode !== 'both' ? globalViewMode : null);
  const contextFilteredItems = effectiveViewMode
    ? permittedNavItems.filter(item => !item.group || item.group === effectiveViewMode)
    : permittedNavItems;

  const persistHidden = (next) => {
    setHiddenNav(next);
    if (hiddenStorageKey) {
      try { localStorage.setItem(hiddenStorageKey, JSON.stringify(next)); } catch {}
    }
  };
  const hideItem = (href) => persistHidden(Array.from(new Set([...hiddenNav, href])));
  const unhideItem = (href) => persistHidden(hiddenNav.filter(h => h !== href));

  const visibleNavItems = editNav
    ? contextFilteredItems
    : contextFilteredItems.filter(item => !hiddenNav.includes(item.href));
  const hiddenNavList = permittedNavItems.filter(item => hiddenNav.includes(item.href));

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
              <img
                src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png"
                alt="Range Medical"
                style={{ height: '32px', display: 'block', filter: 'brightness(0) invert(1)' }}
              />
            </Link>
          </div>

          <nav style={styles.nav}>
            {visibleNavItems.map(item => {
              const isHidden = hiddenNav.includes(item.href);
              const isActive = currentPath === item.href ||
                (item.href !== '/admin' && currentPath.startsWith(item.href)) ||
                (item.href === '/admin/patients' && currentPath.startsWith('/patients'));
              const showBadge = (item.href === '/admin/communications' && unreadCount > 0)
                || (item.href === '/admin/tasks' && taskCount > 0)
                || (item.href === '/admin/payments' && purchaseCount > 0);
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
                  <span style={{ flex: 1, opacity: editNav && isHidden ? 0.45 : 1 }}>{item.label}</span>
                  {editNav && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        isHidden ? unhideItem(item.href) : hideItem(item.href);
                      }}
                      title={isHidden ? 'Show in sidebar' : 'Hide from sidebar'}
                      style={{
                        background: 'rgba(255,255,255,0.12)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        padding: '2px 8px',
                        marginRight: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {isHidden ? 'Show' : 'Hide'}
                    </button>
                  )}
                  {showBadge && item.href === '/admin/tasks' ? (
                    <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {overdueCount > 0 && (
                        <span style={{
                          ...styles.unreadBadge,
                          background: '#dc2626',
                          position: 'relative',
                        }}>
                          {overdueCount > 99 ? '99+' : overdueCount}
                        </span>
                      )}
                      <span style={{
                        ...styles.unreadBadge,
                        position: 'relative',
                        ...(overdueCount > 0 ? { background: '#3b82f6' } : {}),
                      }}>
                        {taskCount > 99 ? '99+' : taskCount}
                      </span>
                    </span>
                  ) : showBadge && (
                    <span style={{
                      ...styles.unreadBadge,
                      ...(item.href === '/admin/payments' ? { background: '#16a34a' } : {}),
                    }}>
                      {item.href === '/admin/payments'
                        ? (purchaseCount > 99 ? '99+' : purchaseCount)
                        : (unreadCount > 99 ? '99+' : unreadCount)}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div style={styles.sidebarFooter}>
            {/* Global View Mode Toggle */}
            <div style={{
              display: 'flex',
              gap: 0,
              marginBottom: '8px',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              {[
                { key: 'medical', label: '🏥', title: 'Medical' },
                { key: 'both', label: 'All', title: 'All' },
                { key: 'business', label: '💼', title: 'Business' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setAndPersistViewMode(opt.key)}
                  title={opt.title}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: globalViewMode === opt.key ? 'rgba(255,255,255,0.25)' : 'transparent',
                    color: globalViewMode === opt.key ? '#fff' : 'rgba(255,255,255,0.5)',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setEditNav(v => !v)}
              style={{
                background: editNav ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                marginBottom: '8px',
                width: '100%',
              }}
              title="Show or hide items in your sidebar"
            >
              {editNav ? 'Done editing sidebar' : 'Edit sidebar'}
            </button>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button
                    onClick={() => router.back()}
                    style={styles.navArrowBtn}
                    title="Go back"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => window.history.forward()}
                    style={styles.navArrowBtn}
                    title="Go forward"
                  >
                    →
                  </button>
                </div>
                <h1 style={styles.pageTitle}>{title}</h1>
              </div>
              {actions && <div style={styles.pageActions}>{actions}</div>}
            </div>
          )}

          {/* Page content */}
          <main style={styles.main}>
            <VoiceProvider value={voice}>
              {children}
            </VoiceProvider>
          </main>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav data-mobile-tab-bar style={mobileTabStyles.bar}>
        {MOBILE_TABS.map(tab => {
          const isMore = tab.href === '#more';
          const isActive = isMore
            ? moreMenuOpen
            : (currentPath === tab.href || (tab.href !== '/admin' && currentPath.startsWith(tab.href)));
          const badge = tab.badgeKey === 'unread' ? unreadCount
            : tab.badgeKey === 'tasks' ? (taskCount + overdueCount)
            : 0;

          return (
            <button
              key={tab.href}
              style={{
                ...mobileTabStyles.tab,
                color: isActive ? '#000' : '#999',
              }}
              onClick={() => {
                if (isMore) {
                  setMoreMenuOpen(!moreMenuOpen);
                } else {
                  setMoreMenuOpen(false);
                  router.push(tab.href);
                }
              }}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                {icons[tab.icon]}
                {badge > 0 && (
                  <span style={mobileTabStyles.badge}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>
              <span style={mobileTabStyles.tabLabel}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile "More" slide-up menu */}
      {moreMenuOpen && (
        <>
          <div
            data-more-overlay
            style={mobileTabStyles.moreOverlay}
            onClick={() => setMoreMenuOpen(false)}
          />
          <div data-more-menu style={mobileTabStyles.moreMenu}>
            <div style={mobileTabStyles.moreHandle} />
            <div style={mobileTabStyles.moreGrid}>
              {visibleNavItems
                .filter(item => !MOBILE_TABS.some(t => t.href === item.href))
                .map(item => {
                  const isActive = currentPath === item.href ||
                    (item.href !== '/admin' && currentPath.startsWith(item.href));
                  const badge = item.href === '/admin/payments' && purchaseCount > 0 ? purchaseCount : 0;
                  return (
                    <button
                      key={item.href}
                      style={{
                        ...mobileTabStyles.moreItem,
                        background: isActive ? '#f0f0f0' : '#fff',
                      }}
                      onClick={() => {
                        setMoreMenuOpen(false);
                        router.push(item.href);
                      }}
                    >
                      <span style={{ position: 'relative', display: 'inline-flex', color: isActive ? '#000' : '#666' }}>
                        {icons[item.icon]}
                        {badge > 0 && (
                          <span style={mobileTabStyles.badge}>{badge > 99 ? '99+' : badge}</span>
                        )}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? '#000' : '#333',
                      }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
            </div>
            {employee && (
              <div style={mobileTabStyles.moreFooter}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{employee.name}</div>
                <div style={{ fontSize: '11px', color: '#999' }}>{employee.title}</div>
                <button
                  onClick={() => { setMoreMenuOpen(false); signOut(); }}
                  style={mobileTabStyles.signOutLink}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Floating staff-to-staff messaging — available on every admin page */}
      <StaffMessagingPanel />

      {/* Floating AI assistant chat — available on every admin page */}
      <StaffChatPanel />

      {/* In-app SMS toast notification */}
      {toast && (
        <div
          style={toastStyles.container}
          onClick={() => {
            dismissToast();
            // Deep-link to the specific patient's conversation when we have
            // their id; falling back to the generic inbox otherwise. Without
            // the patientId query, clicking the toast while already on the
            // comms page is a no-op (same URL) — which is how it used to be.
            const target = toast.patientId
              ? `/admin/communications?patient=${toast.patientId}`
              : '/admin/communications';
            router.push(target);
          }}
        >
          <div style={toastStyles.iconCol}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div style={toastStyles.body}>
            <div style={toastStyles.header}>
              <span style={toastStyles.label}>NEW TEXT</span>
              <span style={toastStyles.time}>{toast.time}</span>
            </div>
            <div style={toastStyles.name}>{toast.patientName}</div>
            <div style={toastStyles.message}>
              {toast.message.length > 120 ? toast.message.substring(0, 120) + '...' : toast.message}
            </div>
            <div style={toastStyles.hint}>Click to view conversation</div>
          </div>
          <button
            style={toastStyles.dismiss}
            onClick={(e) => { e.stopPropagation(); dismissToast(); }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* In-app purchase toast notification */}
      {purchaseToast && (
        <div
          style={{ ...toastStyles.container, top: toast ? '100px' : '16px' }}
          onClick={() => {
            dismissPurchaseToast();
            router.push('/admin/payments');
          }}
        >
          <div style={{ ...toastStyles.iconCol, background: '#16a34a' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <div style={toastStyles.body}>
            <div style={toastStyles.header}>
              <span style={{ ...toastStyles.label, color: '#16a34a' }}>NEW PURCHASE</span>
              <span style={toastStyles.time}>{purchaseToast.time}</span>
            </div>
            <div style={toastStyles.name}>{purchaseToast.name}</div>
            <div style={toastStyles.message}>{purchaseToast.item}</div>
            <div style={{ ...toastStyles.name, color: '#22c55e', fontSize: '16px', marginTop: '4px' }}>{purchaseToast.amount}</div>
            <div style={toastStyles.hint}>Click to view in Payments</div>
          </div>
          <button
            style={toastStyles.dismiss}
            onClick={(e) => { e.stopPropagation(); dismissPurchaseToast(); }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* In-app task toast notification */}
      {taskToast && (
        <div
          style={{
            ...toastStyles.container,
            top: toast ? (purchaseToast ? '184px' : '100px') : (purchaseToast ? '100px' : '16px'),
          }}
          onClick={() => {
            dismissTaskToast();
            router.push('/admin/tasks');
          }}
        >
          <div style={{ ...toastStyles.iconCol, background: taskToast.priority === 'urgent' ? '#dc2626' : '#3b82f6' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div style={toastStyles.body}>
            <div style={toastStyles.header}>
              <span style={{ ...toastStyles.label, color: taskToast.priority === 'urgent' ? '#dc2626' : '#3b82f6' }}>
                {taskToast.priority === 'urgent' ? '🔴 URGENT TASK' : 'NEW TASK'}
              </span>
              <span style={toastStyles.time}>{taskToast.time}</span>
            </div>
            <div style={toastStyles.name}>From {taskToast.from}</div>
            <div style={toastStyles.message}>{taskToast.title}</div>
            <div style={toastStyles.hint}>Click to view in Tasks</div>
          </div>
          <button
            style={toastStyles.dismiss}
            onClick={(e) => { e.stopPropagation(); dismissTaskToast(); }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating browser softphone — only renders when a call is active/ringing */}
      <AdminCallBar
        callState={voice.callState}
        callInfo={voice.callInfo}
        muted={voice.muted}
        onHangUp={voice.hangUp}
        onToggleMute={voice.toggleMute}
        formatDuration={voice.formatDuration}
        onAnswer={voice.answer}
        onReject={voice.reject}
      />
    </>
  );
}

// Helper: returns onMouseDown + onClick props for modal overlays.
// Only closes when BOTH mousedown and mouseup occur on the overlay itself,
// preventing accidental closes from scrolling/dragging inside the modal.
// Also: if focus is in any text field (input/textarea/contenteditable) at
// mousedown time, suppress the close — the user is mid-edit and an accidental
// overlay click should never wipe in-flight typing. Works for both
// overlay-wraps-modal and backdrop+modal-sibling layouts.
const NON_TEXT_INPUT_TYPES = new Set(['button','submit','reset','checkbox','radio','file','hidden','image','color','range']);
function isFocusInTextField() {
  const ae = typeof document !== 'undefined' ? document.activeElement : null;
  if (!ae) return false;
  if (ae.tagName === 'TEXTAREA') return true;
  if (ae.tagName === 'INPUT' && !NON_TEXT_INPUT_TYPES.has((ae.type || '').toLowerCase())) return true;
  if (ae.isContentEditable) return true;
  return false;
}
export function overlayClickProps(closeFn) {
  return {
    onMouseDown: (e) => {
      if (e.target !== e.currentTarget) return;
      e.currentTarget._overlayMouseDown = true;
      e.currentTarget._overlayWasTyping = isFocusInTextField();
    },
    onClick: (e) => {
      const wasMouseDown = e.currentTarget._overlayMouseDown;
      const wasTyping = e.currentTarget._overlayWasTyping;
      e.currentTarget._overlayMouseDown = false;
      e.currentTarget._overlayWasTyping = false;
      if (e.target === e.currentTarget && wasMouseDown && !wasTyping) closeFn();
    },
  };
}

// Toast notification styles
const toastStyles = {
  container: {
    position: 'fixed',
    top: '16px',
    right: '16px',
    width: '380px',
    maxWidth: 'calc(100vw - 32px)',
    background: '#111',
    color: '#fff',
    display: 'flex',
    gap: '12px',
    padding: '14px 16px',
    cursor: 'pointer',
    zIndex: 9999,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    animation: 'slideInToast 0.3s ease-out',
  },
  iconCol: {
    width: '36px',
    height: '36px',
    background: '#ea580c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  label: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: '#ea580c',
  },
  time: {
    fontSize: '11px',
    color: '#999',
  },
  name: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  message: {
    fontSize: '13px',
    color: '#ccc',
    lineHeight: '1.4',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  hint: {
    fontSize: '11px',
    color: '#666',
    marginTop: '6px',
  },
  dismiss: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '0 4px',
    alignSelf: 'flex-start',
    lineHeight: 1,
  },
};

// Mobile bottom tab bar styles
const mobileTabStyles = {
  bar: {
    display: 'none', // shown via media query
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#fff',
    borderTop: '1px solid #e5e5e5',
    zIndex: 300,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    padding: '8px 0 6px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    fontFamily: 'inherit',
  },
  tabLabel: {
    fontSize: '10px',
    fontWeight: '500',
    letterSpacing: '0.2px',
  },
  badge: {
    position: 'absolute',
    top: '-6px',
    right: '-10px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '9px',
    fontWeight: '700',
    minWidth: '16px',
    height: '16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    lineHeight: 1,
  },
  moreOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 299,
    animation: 'fadeInOverlay 0.2s ease-out',
  },
  moreMenu: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#fff',
    zIndex: 301,
    paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
    maxHeight: '70vh',
    overflowY: 'auto',
    animation: 'slideUpMore 0.25s ease-out',
  },
  moreHandle: {
    width: '36px',
    height: '4px',
    background: '#ddd',
    borderRadius: '2px',
    margin: '10px auto 6px',
  },
  moreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '2px',
    padding: '8px 12px 12px',
  },
  moreItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '14px 4px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    WebkitTapHighlightColor: 'transparent',
  },
  moreFooter: {
    padding: '12px 20px 16px',
    borderTop: '1px solid #e5e5e5',
    textAlign: 'center',
  },
  signOutLink: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '8px',
    padding: '4px 0',
    fontFamily: 'inherit',
  },
};

// Shared styles that can be imported by pages
export const sharedStyles = {
  // Page layout
  pageHeader: {
    marginBottom: '28px'
  },
  pageTitle: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
    color: '#000',
    letterSpacing: '-0.01em'
  },
  pageSubtitle: {
    margin: '6px 0 0',
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.5'
  },

  // Cards
  card: {
    background: '#fff',
    borderRadius: '0',
    border: '1px solid #e5e5e5',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    margin: 0,
    fontSize: '19px',
    fontWeight: '600'
  },
  cardBody: {
    padding: '24px'
  },

  // Tables
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '14px 18px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa'
  },
  td: {
    padding: '14px 18px',
    fontSize: '16px',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle',
    lineHeight: '1.5'
  },
  trHover: {
    cursor: 'pointer',
    transition: 'background 0.15s'
  },

  // Buttons
  btnPrimary: {
    padding: '12px 24px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '0',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  btnSecondary: {
    padding: '12px 24px',
    background: '#fff',
    color: '#000',
    border: '1px solid #ddd',
    borderRadius: '0',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  btnSmall: {
    padding: '8px 14px',
    fontSize: '14px',
    borderRadius: '0'
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
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '0',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    lineHeight: '1.5'
  },
  select: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '0',
    fontSize: '16px',
    background: '#fff',
    cursor: 'pointer'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    marginBottom: '6px'
  },
  fieldGroup: {
    marginBottom: '18px'
  },

  // Badges
  badge: {
    padding: '5px 12px',
    borderRadius: '0',
    fontSize: '13px',
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
    padding: '24px',
    background: '#fff',
    borderRadius: '0',
    border: '1px solid #e5e5e5'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    lineHeight: 1
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginTop: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  // Search/Filter bar
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  searchInput: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '0',
    fontSize: '16px',
    width: '320px'
  },

  // Empty states
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#666'
  },
  emptyIcon: {
    fontSize: '52px',
    marginBottom: '16px'
  },
  emptyText: {
    fontSize: '18px',
    marginBottom: '8px'
  },

  // Loading
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
    color: '#666',
    fontSize: '16px'
  },

  // Day tracking display
  dayDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px'
  },
  dayNumber: {
    fontSize: '28px',
    fontWeight: '700'
  },
  dayTotal: {
    fontSize: '18px',
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
    borderRadius: '0',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    padding: '22px 24px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '21px',
    fontWeight: '600'
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
    fontSize: '16px',
    lineHeight: '1.5'
  },
  modalFooter: {
    padding: '18px 24px',
    borderTop: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '26px',
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
    fontSize: '14px',
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
    padding: '11px 14px',
    borderRadius: '0',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'background 0.15s, color 0.15s'
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    width: '20px',
    flexShrink: 0
  },
  unreadBadge: {
    marginLeft: 'auto',
    background: '#ef4444',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '700',
    minWidth: '22px',
    height: '22px',
    borderRadius: '0',
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
    borderRadius: '0',
    transition: 'color 0.15s'
  },
  employeeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    marginTop: '8px',
    borderRadius: '0',
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
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  employeeTitle: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  signOutBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '0',
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
  navArrowBtn: {
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#374151',
    fontFamily: 'inherit',
    padding: 0,
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
      @keyframes slideInToast {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeInOverlay {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUpMore {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      @media (max-width: 768px) {
        /* Hide sidebar completely on mobile — bottom tabs replace it */
        [data-admin-sidebar] {
          display: none !important;
        }
        [data-admin-main] {
          margin-left: 0 !important;
        }
        /* Compact mobile header — page title only, no hamburger */
        [data-admin-mobile-header] {
          display: flex !important;
        }
        [data-admin-mobile-header] button {
          display: none !important;
        }
        /* Bottom padding so content isn't hidden behind tab bar */
        [data-admin-main] > main {
          padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)) !important;
        }
        /* Show bottom tab bar */
        [data-mobile-tab-bar] {
          display: flex !important;
        }
        /* Tighter padding on mobile */
        [data-admin-main] > main {
          padding-left: 12px !important;
          padding-right: 12px !important;
          padding-top: 12px !important;
        }
        /* Page header tighter on mobile */
        [data-admin-main] > div:first-of-type {
          padding-left: 12px !important;
          padding-right: 12px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
