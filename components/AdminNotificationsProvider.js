// /components/AdminNotificationsProvider.js
// Single source of truth for admin polling (SMS, new patients, purchases, tasks).
// Mounted once per session in _app.js so polling intervals survive page navigation
// and don't restart on every AdminLayout remount.
//
// Cross-tab dedup: uses Web Locks API to elect one leader tab that does the actual
// polling; follower tabs receive state via BroadcastChannel. Falls back to per-tab
// polling on browsers without Web Locks support.

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './AuthProvider';

const Ctx = createContext({
  unreadCount: 0,
  taskCount: 0,
  overdueCount: 0,
  purchaseCount: 0,
  toast: null,
  purchaseToast: null,
  taskToast: null,
  dismissToast: () => {},
  dismissPurchaseToast: () => {},
  dismissTaskToast: () => {},
});

export function useAdminNotifications() {
  return useContext(Ctx);
}

const CHANNEL_NAME = 'range-admin-notifications-v1';
const LOCK_NAME = 'range-admin-poll-leader-v1';
const STATE_STORAGE_KEY = 'range-admin-notif-counts-v1';

const SMS_INTERVAL_MS = 15000;
const PURCHASE_INTERVAL_MS = 30000;
const TASK_INTERVAL_MS = 30000;
const PATIENT_INTERVAL_MS = 180000;
const TOAST_DURATION_MS = 15000;

// ─── Sound effects ──────────────────────────────────────────────────────────

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = delay === 0 ? 880 : 1100;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {}
}

function playNewPatientSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.18, 0.36].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = [1047, 1319, 1568][i];
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.35);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {}
}

function playPurchaseSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.12].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = i === 0 ? 1319 : 1047;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.25);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {}
}

function playTaskSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.14].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = i === 0 ? 587 : 440;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {}
}

const SOUND_FOR_KEY = {
  toast: playNotificationSound,
  purchaseToast: playPurchaseSound,
  taskToast: playTaskSound,
};

function nowTimeLabel() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
}

function loadStoredCounts() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredCounts(counts) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(counts)); } catch {}
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function AdminNotificationsProvider({ children }) {
  const router = useRouter();
  const { isAuthenticated, employee } = useAuth();
  const employeeId = employee?.id || null;

  // Refs for values that polling needs but shouldn't trigger restarts
  const routerRef = useRef(router);
  routerRef.current = router;
  const employeeIdRef = useRef(employeeId);
  employeeIdRef.current = employeeId;

  const initialStored = typeof window !== 'undefined' ? loadStoredCounts() : null;
  const [state, setState] = useState({
    unreadCount: initialStored?.unreadCount || 0,
    taskCount: initialStored?.taskCount || 0,
    overdueCount: initialStored?.overdueCount || 0,
    purchaseCount: initialStored?.purchaseCount || 0,
    toast: null,
    purchaseToast: null,
    taskToast: null,
  });

  // Toast auto-dismiss timers
  const toastTimersRef = useRef({ toast: null, purchaseToast: null, taskToast: null });

  const setToastLocal = useCallback((key, payload) => {
    setState(s => ({ ...s, [key]: payload }));
    if (toastTimersRef.current[key]) clearTimeout(toastTimersRef.current[key]);
    if (payload) {
      toastTimersRef.current[key] = setTimeout(() => {
        setState(s => ({ ...s, [key]: null }));
        toastTimersRef.current[key] = null;
      }, TOAST_DURATION_MS);
    }
  }, []);

  const dismissToast = useCallback(() => setToastLocal('toast', null), [setToastLocal]);
  const dismissPurchaseToast = useCallback(() => setToastLocal('purchaseToast', null), [setToastLocal]);
  const dismissTaskToast = useCallback(() => setToastLocal('taskToast', null), [setToastLocal]);

  // Track first user interaction (audio autoplay + notification permission)
  const hasInteractedRef = useRef(false);
  useEffect(() => {
    const onInteract = () => {
      hasInteractedRef.current = true;
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    };
    window.addEventListener('click', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });
    return () => {
      window.removeEventListener('click', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  }, []);

  // Show a browser notification + register click handler
  const showBrowserNotif = useCallback((kind, notif) => {
    if (!notif) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(notif.title, { body: notif.body, icon: '/favicon.ico', tag: notif.tag });
      n.onclick = () => {
        window.focus();
        if (notif.href) routerRef.current.push(notif.href);
        n.close();
      };
      setTimeout(() => n.close(), 8000);
    } catch {}
  }, []);

  // Receive a toast event (either fired locally as leader, or broadcast from another tab)
  const receiveToast = useCallback((key, payload, notif) => {
    if (hasInteractedRef.current) {
      const sound = SOUND_FOR_KEY[key];
      if (sound) sound();
      showBrowserNotif(key, notif);
    }
    setToastLocal(key, payload);
  }, [setToastLocal, showBrowserNotif]);

  // Polling + leader election
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    let releaseLock = null;
    let intervals = [];
    const ac = new AbortController();
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

    // All tabs (leader + followers) listen for broadcasts
    const onChannelMessage = (e) => {
      if (cancelled) return;
      const msg = e.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'counts') {
        setState(s => ({ ...s, ...msg.counts }));
      } else if (msg.type === 'toast') {
        receiveToast(msg.key, msg.payload, msg.notif);
      }
    };
    if (channel) channel.addEventListener('message', onChannelMessage);

    const broadcast = (msg) => {
      if (channel) { try { channel.postMessage(msg); } catch {} }
    };

    // ── Leader-only state (per leadership session) ──
    const trackers = {
      smsLastCount: -1,           // -1 sentinel so first poll initializes without firing
      patientsInitialized: false,
      patientsLatest: null,
      purchasesInitialized: false,
      purchasesLatest: null,
      tasksInitialized: false,
      tasksLatest: null,
    };

    const updateAndBroadcastCounts = (partial) => {
      setState(s => ({ ...s, ...partial }));
      broadcast({ type: 'counts', counts: partial });
      // Persist current snapshot for new tabs
      const stored = loadStoredCounts() || {};
      saveStoredCounts({ ...stored, ...partial });
    };

    const fireToast = (key, payload, notif) => {
      receiveToast(key, payload, notif);
      broadcast({ type: 'toast', key, payload, notif });
    };

    async function pollSms() {
      if (cancelled) return;
      try {
        const res = await fetch('/api/admin/unread-sms');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const newCount = data.count || 0;
        const prev = trackers.smsLastCount;
        updateAndBroadcastCounts({ unreadCount: data.needsResponseCount || 0 });

        if (prev >= 0 && newCount > prev && data.latest) {
          // OS-level browser notification is handled by Web Push from the
          // Twilio/Blooio webhook (see lib/web-push.js + chat-sw.js). Pass
          // notif=null here so polling only fires the in-app toast + sound,
          // not a duplicate browser notification.
          fireToast('toast', {
            patientName: data.latest.patientName || 'Unknown',
            message: data.latest.message || '',
            patientId: data.latest.patientId || null,
            time: nowTimeLabel(),
          }, null);
        }
        trackers.smsLastCount = newCount;
      } catch {}
    }

    async function pollPatients() {
      if (cancelled) return;
      try {
        const since = trackers.patientsLatest;
        const url = since
          ? `/api/admin/new-patients-check?since=${encodeURIComponent(since)}`
          : '/api/admin/new-patients-check';
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        if (data.latestTimestamp) trackers.patientsLatest = data.latestTimestamp;

        if (!trackers.patientsInitialized) {
          trackers.patientsInitialized = true;
          return;
        }
        if (data.newPatients?.length > 0) {
          const patient = data.newPatients[0];
          // No in-app toast for new patients (matches old behavior); sound + browser notif only.
          if (hasInteractedRef.current) {
            playNewPatientSound();
            showBrowserNotif('patient', {
              title: 'New Patient — Range Medical',
              body: `${patient.name} just entered the system`,
              tag: 'range-new-patient',
              href: `/patients/${patient.id}`,
            });
            broadcast({ type: 'patient-sound', patient });
          }
        }
      } catch {}
    }

    async function pollPurchases() {
      if (cancelled) return;
      try {
        const since = trackers.purchasesLatest;
        const url = since
          ? `/api/admin/new-purchases-check?since=${encodeURIComponent(since)}`
          : '/api/admin/new-purchases-check';
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        if (data.latestTimestamp) trackers.purchasesLatest = data.latestTimestamp;
        updateAndBroadcastCounts({ purchaseCount: data.todayCount || 0 });

        if (!trackers.purchasesInitialized) {
          trackers.purchasesInitialized = true;
          return;
        }
        if (data.newPurchases?.length > 0) {
          const purchase = data.newPurchases[0];
          fireToast('purchaseToast', {
            name: purchase.patient_name || 'Unknown',
            item: purchase.item_name || 'Purchase',
            amount: `$${(purchase.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            time: nowTimeLabel(),
          }, {
            title: 'New Purchase — Range Medical',
            body: `${purchase.patient_name}: ${purchase.item_name} — $${(purchase.amount || 0).toFixed(2)}`,
            tag: 'range-purchase',
            href: '/admin/payments',
          });
        }
      } catch {}
    }

    async function pollTasks() {
      const empId = employeeIdRef.current;
      if (cancelled || !empId) return;
      try {
        const since = trackers.tasksLatest;
        const url = since
          ? `/api/admin/unread-tasks?employee_id=${empId}&since=${encodeURIComponent(since)}`
          : `/api/admin/unread-tasks?employee_id=${empId}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        updateAndBroadcastCounts({
          taskCount: data.count || 0,
          overdueCount: data.overdueCount || 0,
        });
        if (data.latestTimestamp) trackers.tasksLatest = data.latestTimestamp;

        if (!trackers.tasksInitialized) {
          trackers.tasksInitialized = true;
          return;
        }
        if (data.newTasks?.length > 0) {
          const task = data.newTasks[0];
          fireToast('taskToast', {
            title: task.title?.length > 80 ? task.title.slice(0, 80) + '...' : task.title,
            from: task.assigned_by_name || 'Unknown',
            priority: task.priority,
            time: nowTimeLabel(),
          }, {
            title: `${task.priority === 'urgent' ? '🔴 URGENT — ' : task.priority === 'high' ? '🟠 ' : ''}New Task — Range Medical`,
            body: `From ${task.assigned_by_name}: ${task.title}`,
            tag: 'range-task',
            href: '/admin/tasks',
          });
        }
      } catch {}
    }

    const becomeLeader = async () => {
      if (cancelled) return;

      // Initial fire of all checks
      pollSms();
      pollPurchases();
      pollTasks();
      pollPatients();

      intervals.push(
        setInterval(pollSms, SMS_INTERVAL_MS),
        setInterval(pollPurchases, PURCHASE_INTERVAL_MS),
        setInterval(pollTasks, TASK_INTERVAL_MS),
        setInterval(pollPatients, PATIENT_INTERVAL_MS),
      );

      // Hold the lock until cleanup
      await new Promise(resolve => { releaseLock = resolve; });

      intervals.forEach(clearInterval);
      intervals = [];
    };

    const supportsLocks =
      typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function';

    if (supportsLocks) {
      navigator.locks
        .request(LOCK_NAME, { mode: 'exclusive', signal: ac.signal }, becomeLeader)
        .catch((err) => {
          if (err && err.name === 'AbortError') return;
          // eslint-disable-next-line no-console
          console.warn('AdminNotifications lock error:', err);
        });
    } else {
      // No Web Locks support — every tab polls (matches legacy behavior)
      becomeLeader();
    }

    return () => {
      cancelled = true;
      ac.abort();
      if (releaseLock) releaseLock();
      intervals.forEach(clearInterval);
      if (channel) {
        channel.removeEventListener('message', onChannelMessage);
        channel.close();
      }
      Object.values(toastTimersRef.current).forEach(t => t && clearTimeout(t));
    };
  }, [isAuthenticated, employeeId, receiveToast]);

  return (
    <Ctx.Provider
      value={{
        unreadCount: state.unreadCount,
        taskCount: state.taskCount,
        overdueCount: state.overdueCount,
        purchaseCount: state.purchaseCount,
        toast: state.toast,
        purchaseToast: state.purchaseToast,
        taskToast: state.taskToast,
        dismissToast,
        dismissPurchaseToast,
        dismissTaskToast,
      }}
    >
      {children}
      {isAuthenticated && (
        <ToastStack
          toast={state.toast}
          purchaseToast={state.purchaseToast}
          taskToast={state.taskToast}
          dismissToast={dismissToast}
          dismissPurchaseToast={dismissPurchaseToast}
          dismissTaskToast={dismissTaskToast}
        />
      )}
    </Ctx.Provider>
  );
}

// ─── Toast UI ───────────────────────────────────────────────────────────────

function ToastStack({ toast, purchaseToast, taskToast, dismissToast, dismissPurchaseToast, dismissTaskToast }) {
  const router = useRouter();
  return (
    <>
      {toast && (
        <div
          style={toastStyles.container}
          onClick={() => {
            dismissToast();
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
          <button style={toastStyles.dismiss} onClick={(e) => { e.stopPropagation(); dismissToast(); }} title="Dismiss">✕</button>
        </div>
      )}

      {purchaseToast && (
        <div
          style={{ ...toastStyles.container, top: toast ? '100px' : '16px' }}
          onClick={() => { dismissPurchaseToast(); router.push('/admin/payments'); }}
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
          <button style={toastStyles.dismiss} onClick={(e) => { e.stopPropagation(); dismissPurchaseToast(); }} title="Dismiss">✕</button>
        </div>
      )}

      {taskToast && (
        <div
          style={{
            ...toastStyles.container,
            top: toast ? (purchaseToast ? '184px' : '100px') : (purchaseToast ? '100px' : '16px'),
          }}
          onClick={() => { dismissTaskToast(); router.push('/admin/tasks'); }}
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
          <button style={toastStyles.dismiss} onClick={(e) => { e.stopPropagation(); dismissTaskToast(); }} title="Dismiss">✕</button>
        </div>
      )}
    </>
  );
}

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
  body: { flex: 1, minWidth: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  label: { fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: '#ea580c' },
  time: { fontSize: '11px', color: '#999' },
  name: { fontSize: '14px', fontWeight: '700', marginBottom: '2px' },
  message: { fontSize: '13px', color: '#ccc', lineHeight: '1.4' },
  hint: { fontSize: '10px', color: '#666', marginTop: '6px', letterSpacing: '0.5px' },
  dismiss: {
    background: 'transparent',
    border: 'none',
    color: '#999',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '0 4px',
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
};
