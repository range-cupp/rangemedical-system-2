// /pages/chat/index.js
// Range Chat — standalone mobile-first PWA shell for staff team messaging.
// Reuses the existing useStaffMessaging hook + the staff-messaging API.
// Adds: dedicated manifest/service worker, Web Push subscription, install hints.

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthProvider';
import useStaffMessaging from '../../hooks/useStaffMessaging';
import usePatientMessaging from '../../hooks/usePatientMessaging';
import useVoiceCall, { CALL_STATE } from '../../hooks/useVoiceCall';
import AppCallBar from '../../components/AppCallBar';
import CallKeypad from '../../components/CallKeypad';
import { supabase } from '../../lib/supabase';

// ── Icons ─────────────────────────────────────────────────────────────────────

function UsersIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function ArrowLeft({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function SendIcon({ color = '#fff' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PaperclipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49" />
    </svg>
  );
}
function XIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function PlusIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function BellIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function ShareIosIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" /><polyline points="7 8 12 3 17 8" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function isImageType(t) { return t && t.startsWith('image/'); }
function getChannelDisplayName(channel, currentEmployeeId) {
  if (channel.name) return channel.name;
  if (channel.type === 'dm') {
    const other = channel.members?.find((m) => m.id !== currentEmployeeId);
    return other?.name || 'Direct Message';
  }
  return channel.members?.map((m) => m.name?.split(' ')[0]).join(', ') || 'Group Chat';
}

const AVATAR_COLORS = ['#0f172a', '#1e293b', '#334155', '#1f2937', '#111827'];
function Avatar({ name, size = 40 }) {
  const initials = getInitials(name);
  const idx = (name || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[idx],
      color: '#fff', fontSize: size * 0.38, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{initials}</div>
  );
}

// ── Push subscription helper (client-side) ────────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

async function ensurePushSubscription(accessToken) {
  if (typeof window === 'undefined') return { ok: false, reason: 'ssr' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return { ok: false, reason: 'no-vapid' };

  // Make sure SW is registered first.
  let reg;
  try {
    reg = await navigator.serviceWorker.register('/chat-sw.js', { scope: '/chat' });
    await navigator.serviceWorker.ready;
  } catch (e) {
    console.error('SW registration failed', e);
    return { ok: false, reason: 'sw-failed' };
  }

  // Ask permission if needed.
  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') return { ok: false, reason: 'permission-denied' };
  } else if (Notification.permission === 'denied') {
    return { ok: false, reason: 'permission-denied' };
  }

  // Subscribe (or reuse existing).
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    } catch (e) {
      console.error('Push subscribe failed', e);
      return { ok: false, reason: 'subscribe-failed' };
    }
  }

  // POST to backend.
  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
  } catch (e) {
    console.error('Subscribe POST failed', e);
  }
  return { ok: true };
}

// ── Login form (used when not authenticated) ──────────────────────────────────

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setErr('Invalid email or password'); setBusy(false); return; }
    // AuthProvider will pick up the session — no router push needed.
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: '#fff', color: '#0f172a',
    }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: '#0f172a',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 14,
          }}>
            <UsersIcon size={26} color="#fff" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Range Chat</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Sign in to continue</div>
        </div>

        {err && (
          <div style={{
            padding: '10px 12px', background: '#fef2f2', color: '#991b1b',
            border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, marginBottom: 12,
          }}>{err}</div>
        )}

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Email</label>
        <input
          type="email" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 16,
            border: '1.5px solid #e2e8f0', borderRadius: 8, marginBottom: 14, outline: 'none',
          }}
        />

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Password</label>
        <input
          type="password" autoComplete="current-password" required value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 16,
            border: '1.5px solid #e2e8f0', borderRadius: 8, marginBottom: 18, outline: 'none',
          }}
        />

        <button
          type="submit" disabled={busy}
          style={{
            width: '100%', padding: '13px 0', background: '#0f172a', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
            cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
          }}
        >{busy ? 'Signing in…' : 'Sign In'}</button>
      </form>
    </div>
  );
}

// ── Install hint banner (iOS Safari, not yet installed) ───────────────────────

function InstallHint({ onDismiss }) {
  return (
    <div style={{
      margin: '8px 12px', padding: '12px 14px', borderRadius: 12,
      background: '#0f172a', color: '#fff', fontSize: 13, lineHeight: 1.5,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>Install Range Chat</div>
        <div style={{ color: '#cbd5e1' }}>
          Tap <span style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 2px' }}><ShareIosIcon /></span>
          {' '}then <b>Add to Home Screen</b> to get push notifications.
        </div>
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" style={{
        background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer',
        padding: 4, display: 'flex',
      }}><XIcon size={14} /></button>
    </div>
  );
}

// ── Notification permission banner (after install/on Android) ─────────────────

function NotifPrompt({ onEnable, onDismiss, busy }) {
  return (
    <div style={{
      margin: '8px 12px', padding: '12px 14px', borderRadius: 12,
      background: '#eff6ff', border: '1px solid #bfdbfe', color: '#0f172a',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: '#3b82f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
      }}><BellIcon size={18} /></div>
      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
        <div style={{ fontWeight: 600 }}>Get notified about new messages</div>
        <div style={{ color: '#475569', fontSize: 12 }}>So you don't miss anything when the app is closed.</div>
      </div>
      <button
        onClick={onEnable} disabled={busy}
        style={{
          background: '#0f172a', color: '#fff', border: 'none', padding: '8px 12px',
          borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          opacity: busy ? 0.6 : 1, flexShrink: 0,
        }}
      >{busy ? '…' : 'Enable'}</button>
      <button onClick={onDismiss} aria-label="Dismiss" style={{
        background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer',
        padding: 4, display: 'flex', flexShrink: 0,
      }}><XIcon size={14} /></button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChatApp() {
  const router = useRouter();
  const { employee, session, loading: authLoading, signOut } = useAuth();

  const {
    channels, activeChannelId, messages,
    loadingChannels, loadingMessages, hasMore, totalUnread,
    fetchChannels, openChannel, closeChannel, loadMore,
    sendMessage, uploadFile, createChannel, openDm, setMessages,
  } = useStaffMessaging(employee, session);

  const {
    conversations: patientConvos,
    activePatient,
    messages: patientMessages,
    loadingConversations: loadingPatients,
    loadingMessages: loadingPatientMessages,
    totalUnread: patientUnread,
    totalNeedsResponse: patientNeedsResponse,
    fetchConversations: fetchPatientConvos,
    openPatient,
    closePatient,
    sendMessage: sendPatientSms,
  } = usePatientMessaging(employee);

  // 'channels' | 'chat' | 'new' | 'patients' | 'patient-chat' | 'calls'
  const [view, setView] = useState('channels');
  const [tab, setTab] = useState('team'); // 'team' | 'patients' | 'calls'
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [empSearch, setEmpSearch] = useState('');

  // Patient SMS compose
  const [patientInput, setPatientInput] = useState('');
  const [patientSending, setPatientSending] = useState(false);

  // New patient conversation search
  const [patientSearchQ, setPatientSearchQ] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const patientSearchTimeout = useRef(null);

  const [showInstallHint, setShowInstallHint] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [enablingNotif, setEnablingNotif] = useState(false);
  const [showDialer, setShowDialer] = useState(false);

  // Calls tab state
  const [dialInput, setDialInput] = useState('');
  const [callHistory, setCallHistory] = useState([]);
  const [loadingCallHistory, setLoadingCallHistory] = useState(false);
  const [callsSubView, setCallsSubView] = useState('keypad'); // 'keypad' | 'recents'
  const [callPatientSearch, setCallPatientSearch] = useState('');
  const [callPatientResults, setCallPatientResults] = useState([]);
  const [searchingCallPatients, setSearchingCallPatients] = useState(false);
  const callSearchTimeout = useRef(null);

  const voice = useVoiceCall({ employeeId: employee?.id });

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const initialDeepLinkRef = useRef(false);
  const patientInputRef = useRef(null);
  const patientBottomRef = useRef(null);

  // ── PWA install / notification UX detection ───────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const dismissedInstall = localStorage.getItem('chat-install-hint-dismissed') === '1';
    const dismissedNotif = localStorage.getItem('chat-notif-prompt-dismissed') === '1';

    // iOS Safari, not installed, not dismissed → show install hint.
    if (isIOS && !isStandalone && !dismissedInstall) {
      setShowInstallHint(true);
    }

    // Notification prompt: only after auth, when supported, and not yet granted/dismissed.
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    // On iOS, push only works in standalone mode, so don't prompt until installed.
    if (isIOS && !isStandalone) return;
    if (Notification.permission === 'default' && !dismissedNotif) {
      setShowNotifPrompt(true);
    } else if (Notification.permission === 'granted') {
      // Ensure subscription is up to date silently.
      if (session?.access_token) ensurePushSubscription(session.access_token);
    }
  }, [session?.access_token]);

  // ── Service worker: register + listen for notification-click messages ──────
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/chat-sw.js', { scope: '/chat' }).catch(() => {});

    const onMsg = (e) => {
      if (e.data?.type === 'open-channel' && e.data.channel_id) {
        const chId = e.data.channel_id;
        setTab('team');
        setView('chat');
        openChannel(chId);
      } else if (e.data?.type === 'open-patient-sms') {
        const target = e.data.patient_id
          ? patientConvos.find((c) => c.patient_id === e.data.patient_id)
          : patientConvos.find((c) => c.recipient === e.data.recipient);
        const patient = target || { patient_id: e.data.patient_id || null, recipient: e.data.recipient || null };
        setTab('patients');
        setView('patient-chat');
        openPatient(patient);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    return () => navigator.serviceWorker.removeEventListener('message', onMsg);
  }, [openChannel, openPatient, patientConvos]);

  // ── Deep-link from URL: /chat?c=<channelId> ───────────────────────────────
  useEffect(() => {
    if (initialDeepLinkRef.current) return;
    if (!router.isReady || !employee || channels.length === 0) return;
    const c = router.query.c;
    if (typeof c === 'string' && channels.some((ch) => ch.id === c)) {
      initialDeepLinkRef.current = true;
      setView('chat');
      openChannel(c);
    }
  }, [router.isReady, router.query.c, employee, channels, openChannel]);

  // ── Deep-link from URL: /chat?p=<patientId> (from a patient SMS push) ─────
  // Fires once on cold start when the PWA opens from a tapped notification.
  // Tries to use the loaded conversation list for nicer header info, but
  // falls back to a stub so the thread opens immediately.
  const initialPatientLinkRef = useRef(false);
  useEffect(() => {
    if (initialPatientLinkRef.current) return;
    if (!router.isReady || !employee) return;
    const p = router.query.p;
    if (typeof p !== 'string' || !p) return;
    initialPatientLinkRef.current = true;
    const target = patientConvos.find((c) => c.patient_id === p);
    const patient = target || { patient_id: p, recipient: null, patient_name: null };
    setTab('patients');
    setView('patient-chat');
    openPatient(patient);
    // Strip the query param so a refresh doesn't keep reopening this thread
    router.replace('/chat', undefined, { shallow: true });
  }, [router.isReady, router.query.p, employee, patientConvos, openPatient, router]);

  // Auto-scroll to bottom on new messages in chat view
  useEffect(() => {
    if (view === 'chat' && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  useEffect(() => {
    if (view === 'chat') setTimeout(() => inputRef.current?.focus(), 150);
  }, [view]);

  const fetchEmployees = useCallback(async () => {
    if (employees.length > 0) return;
    const { data } = await supabase
      .from('employees').select('id, name, title')
      .eq('is_active', true).order('name');
    setEmployees((data || []).filter((e) => e.id !== employee?.id));
  }, [employee?.id, employees.length]);

  const handleEnableNotifications = async () => {
    if (!session?.access_token) return;
    setEnablingNotif(true);
    const r = await ensurePushSubscription(session.access_token);
    setEnablingNotif(false);
    if (r.ok) {
      setShowNotifPrompt(false);
    } else if (r.reason === 'permission-denied') {
      alert('Notifications were blocked. To enable them, open Settings for this app and allow notifications.');
      setShowNotifPrompt(false);
    } else {
      alert("Couldn't enable notifications. Make sure you've added this app to your home screen first.");
    }
  };

  const dismissInstallHint = () => {
    setShowInstallHint(false);
    try { localStorage.setItem('chat-install-hint-dismissed', '1'); } catch {}
  };
  const dismissNotifPrompt = () => {
    setShowNotifPrompt(false);
    try { localStorage.setItem('chat-notif-prompt-dismissed', '1'); } catch {}
  };

  const handleOpenChannel = useCallback(async (channelId) => {
    setView('chat');
    await openChannel(channelId);
  }, [openChannel]);

  const handleOpenPatient = useCallback(async (patient) => {
    setView('patient-chat');
    await openPatient(patient);
    setTimeout(() => patientInputRef.current?.focus(), 150);
  }, [openPatient]);

  const handleSwitchTab = useCallback((next) => {
    setTab(next);
    setSearch('');
    if (next === 'calls') {
      setView('calls');
    } else if (next === 'patients') {
      setView('patients');
      fetchPatientConvos();
    } else {
      setView('channels');
      fetchChannels();
    }
  }, [fetchChannels, fetchPatientConvos]);

  // ── Calls tab helpers ──────────────────────────────────────────────────────
  const fetchCallHistory = useCallback(async () => {
    setLoadingCallHistory(true);
    try {
      const res = await fetch('/api/twilio/sync-calls?limit=30');
      if (res.ok) {
        const data = await res.json();
        setCallHistory(data.calls || []);
      }
    } catch {} finally { setLoadingCallHistory(false); }
  }, []);

  useEffect(() => {
    if (view === 'calls' && callsSubView === 'recents' && callHistory.length === 0) {
      fetchCallHistory();
    }
  }, [view, callsSubView, callHistory.length, fetchCallHistory]);

  const handleCallPatientSearch = useCallback((q) => {
    setCallPatientSearch(q);
    if (callSearchTimeout.current) clearTimeout(callSearchTimeout.current);
    if (!q.trim() || q.trim().length < 2) { setCallPatientResults([]); return; }
    callSearchTimeout.current = setTimeout(async () => {
      setSearchingCallPatients(true);
      try {
        const res = await fetch(`/api/app/patients-search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const mapped = (data.patients || []).map(p => ({
            ...p,
            name: p.name || [p.first_name, p.last_name].filter(Boolean).join(' ').trim(),
          }));
          setCallPatientResults(mapped);
        }
      } catch (err) { console.error('Call patient search error:', err); }
      finally { setSearchingCallPatients(false); }
    }, 300);
  }, []);

  const handleDialCall = useCallback((number, name) => {
    if (!number || voice.isActive) return;
    let n = number.replace(/\D/g, '');
    if (n.length === 10) n = '+1' + n;
    else if (n.length === 11 && n.startsWith('1')) n = '+' + n;
    else if (!n.startsWith('+')) n = '+' + n;
    voice.call({ to: n, name: name || n });
  }, [voice]);

  const handleKeyPress = useCallback((digit) => {
    setDialInput(prev => prev + digit);
    if (voice.callState === CALL_STATE.IN_CALL) voice.sendDigits(digit);
  }, [voice]);

  const formatCallTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
    if (isToday) return timeStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' }) + ' ' + timeStr;
  };

  const formatCallDuration = (secs) => {
    if (!secs) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  // Auto-scroll patient thread on new messages
  useEffect(() => {
    if (view === 'patient-chat' && patientBottomRef.current) {
      patientBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [patientMessages, view]);

  const handleSendPatientSms = useCallback(async () => {
    const text = patientInput.trim();
    if (!text || patientSending || !activePatient) return;
    setPatientSending(true);
    setPatientInput('');
    const result = await sendPatientSms(activePatient, text);
    setPatientSending(false);
    if (!result?.success) {
      setPatientInput(text);
      alert('Failed to send: ' + (result?.error || 'unknown error'));
    }
    setTimeout(() => patientInputRef.current?.focus(), 80);
  }, [patientInput, patientSending, activePatient, sendPatientSms]);

  const handlePatientKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendPatientSms(); }
  };

  // Debounced patient name search for the "new patient SMS" view
  const handlePatientSearchInput = useCallback((q) => {
    setPatientSearchQ(q);
    if (patientSearchTimeout.current) clearTimeout(patientSearchTimeout.current);
    if (!q || q.trim().length < 2) {
      setPatientSearchResults([]);
      setSearchingPatients(false);
      return;
    }
    setSearchingPatients(true);
    patientSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setPatientSearchResults(data.patients || []);
      } catch (err) {
        console.error('Patient search error:', err);
        setPatientSearchResults([]);
      } finally {
        setSearchingPatients(false);
      }
    }, 350);
  }, []);

  // Open a fresh thread with a patient picked from search results
  const handleStartPatientConversation = useCallback(async (p) => {
    if (!p?.phone) {
      alert('This patient has no phone number on file.');
      return;
    }
    // Match the conversation shape the rest of the panel expects
    const fullName = p.name || [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || 'Patient';
    const conversation = {
      patient_id: p.id,
      ghl_contact_id: p.ghl_contact_id || null,
      patient_name: fullName,
      recipient: p.phone,
      last_message: null,
      last_message_at: null,
      last_direction: null,
      unread_count: 0,
      needs_response_count: 0,
    };
    setPatientSearchQ('');
    setPatientSearchResults([]);
    await handleOpenPatient(conversation);
  }, [handleOpenPatient]);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !pendingFile) || sending || !activeChannelId) return;
    setSending(true);
    let attachment = null;
    if (pendingFile) {
      setUploading(true);
      attachment = await uploadFile(pendingFile);
      setUploading(false);
      if (!attachment) { setSending(false); return; }
      setPendingFile(null);
    }
    const content = input.trim();
    setInput('');
    const optimistic = {
      id: 'temp-' + Date.now(),
      channel_id: activeChannelId, sender_id: employee.id, content,
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.filename || null,
      attachment_type: attachment?.type || null,
      created_at: new Date().toISOString(),
      sender: { id: employee.id, name: employee.name, title: employee.title },
    };
    setMessages((prev) => [...prev, optimistic]);
    const result = await sendMessage(activeChannelId, content, attachment);
    if (result) {
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? result : m));
    }
    setSending(false);
    fetchChannels();
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [input, pendingFile, sending, activeChannelId, employee, sendMessage, uploadFile, fetchChannels, setMessages]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10MB'); return; }
    setPendingFile(file);
    e.target.value = '';
  }, []);

  const handleCreateConversation = useCallback(async () => {
    if (selectedMembers.length === 0) return;
    let channelId;
    if (selectedMembers.length === 1 && !groupName.trim()) {
      channelId = await openDm(selectedMembers[0].id);
    } else {
      channelId = await createChannel(selectedMembers.map((m) => m.id), groupName.trim() || undefined);
    }
    if (channelId) {
      setSelectedMembers([]); setGroupName(''); setEmpSearch('');
      setView('chat');
      await openChannel(channelId);
    }
  }, [selectedMembers, groupName, openDm, createChannel, openChannel]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Auth gates ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <>
        <Head><ChatHead /></Head>
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          Loading…
        </div>
      </>
    );
  }
  if (!employee) {
    return (
      <>
        <Head><ChatHead /></Head>
        <LoginForm />
      </>
    );
  }

  // ── Authed UI ──────────────────────────────────────────────────────────────
  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const channelName = activeChannel ? getChannelDisplayName(activeChannel, employee.id) : '';

  const filteredChannels = channels.filter((c) => {
    if (!search.trim()) return true;
    return getChannelDisplayName(c, employee.id).toLowerCase().includes(search.toLowerCase());
  });
  const filteredEmployees = employees.filter((e) => {
    if (selectedMembers.some((m) => m.id === e.id)) return false;
    if (!empSearch.trim()) return true;
    return e.name.toLowerCase().includes(empSearch.toLowerCase());
  });
  const filteredPatientConvos = patientConvos.filter((c) => {
    if (!search.trim()) return true;
    const name = (c.patient_name || c.recipient || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const activePatientName = activePatient?.patient_name || activePatient?.recipient || 'Patient';
  const activePatientPhone = activePatient?.recipient || '';

  return (
    <>
      <Head><ChatHead /></Head>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column',
        background: '#fff', color: '#0f172a',
        WebkitTextSizeAdjust: '100%',
      }}>

        {/* ─── LIST VIEW (Team channels, Patient conversations, or Calls) ── */}
        {(view === 'channels' || view === 'patients' || view === 'calls') && (
          <>
            <div style={{
              padding: '12px 16px 8px',
              paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
              borderBottom: '1px solid #e2e8f0', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>Chat</div>
                <button
                  onClick={signOut}
                  style={{
                    background: 'transparent', color: '#64748b', border: 'none',
                    fontSize: 13, cursor: 'pointer', padding: 6,
                  }}
                >Sign out</button>
              </div>

              {/* Tab switcher: Team / Patients / Calls */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <button
                  onClick={() => handleSwitchTab('team')}
                  style={{
                    flex: 1, padding: '9px 12px',
                    background: tab === 'team' ? '#0f172a' : '#f1f5f9',
                    color: tab === 'team' ? '#fff' : '#475569',
                    border: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontFamily: 'inherit',
                  }}
                >
                  Team
                  {totalUnread > 0 && (
                    <span style={{
                      background: tab === 'team' ? '#fff' : '#ef4444',
                      color: tab === 'team' ? '#0f172a' : '#fff',
                      borderRadius: 10, padding: '0 6px',
                      fontSize: 11, fontWeight: 700, minWidth: 18, height: 16,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>{totalUnread > 99 ? '99+' : totalUnread}</span>
                  )}
                </button>
                <button
                  onClick={() => handleSwitchTab('patients')}
                  style={{
                    flex: 1, padding: '9px 12px',
                    background: tab === 'patients' ? '#0f172a' : '#f1f5f9',
                    color: tab === 'patients' ? '#fff' : '#475569',
                    border: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontFamily: 'inherit',
                  }}
                >
                  Patients
                  {(patientUnread > 0 || patientNeedsResponse > 0) && (
                    <span style={{
                      background: tab === 'patients'
                        ? '#fff'
                        : (patientNeedsResponse > 0 ? '#ea580c' : '#ef4444'),
                      color: tab === 'patients' ? '#0f172a' : '#fff',
                      borderRadius: 10, padding: '0 6px',
                      fontSize: 11, fontWeight: 700, minWidth: 18, height: 16,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>{(patientUnread || patientNeedsResponse) > 99 ? '99+' : (patientUnread || patientNeedsResponse)}</span>
                  )}
                </button>
                <button
                  onClick={() => handleSwitchTab('calls')}
                  style={{
                    flex: 1, padding: '9px 12px',
                    background: tab === 'calls' ? '#0f172a' : '#f1f5f9',
                    color: tab === 'calls' ? '#fff' : '#475569',
                    border: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontFamily: 'inherit',
                  }}
                >
                  Calls
                </button>
              </div>

              {tab !== 'calls' && (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <SearchIcon />
                  </div>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={tab === 'patients' ? 'Search patients' : 'Search conversations'}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      border: '1.5px solid #e2e8f0', borderRadius: 10,
                      padding: '10px 12px 10px 36px', fontSize: 15,
                      background: '#f8fafc', outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>

            {showInstallHint && <InstallHint onDismiss={dismissInstallHint} />}
            {showNotifPrompt && (
              <NotifPrompt
                onEnable={handleEnableNotifications}
                onDismiss={dismissNotifPrompt}
                busy={enablingNotif}
              />
            )}

            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {tab === 'calls' ? (
                <CallsTabContent
                  subView={callsSubView}
                  setSubView={setCallsSubView}
                  dialInput={dialInput}
                  setDialInput={setDialInput}
                  onKeyPress={handleKeyPress}
                  onDial={handleDialCall}
                  voice={voice}
                  patientSearch={callPatientSearch}
                  onPatientSearch={handleCallPatientSearch}
                  patientResults={callPatientResults}
                  searchingPatients={searchingCallPatients}
                  callHistory={callHistory}
                  loadingCallHistory={loadingCallHistory}
                  fetchCallHistory={fetchCallHistory}
                  formatCallTime={formatCallTime}
                  formatCallDuration={formatCallDuration}
                />
              ) : tab === 'patients' ? (
                <>
                  {loadingPatients && patientConvos.length === 0 && (
                    <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
                  )}
                  {!loadingPatients && filteredPatientConvos.length === 0 && (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                      {search ? 'No matches' : 'No patient conversations yet.'}
                    </div>
                  )}
                  {filteredPatientConvos.map((c) => {
                    const key = c.patient_id || (c.ghl_contact_id ? `ghl_${c.ghl_contact_id}` : c.recipient || c.patient_name);
                    const hasUnread = (c.unread_count || 0) > 0;
                    const needsResponse = (c.needs_response_count || 0) > 0;
                    return (
                      <button
                        key={key}
                        onClick={() => handleOpenPatient(c)}
                        style={{
                          width: '100%', padding: '12px 16px',
                          display: 'flex', alignItems: 'center', gap: 12,
                          border: 'none', borderBottom: '1px solid #f1f5f9',
                          borderLeft: needsResponse ? '4px solid #ea580c' : (hasUnread ? '4px solid #3b82f6' : '4px solid transparent'),
                          background: needsResponse ? '#fff7ed' : (hasUnread ? '#f8fafc' : '#fff'),
                          cursor: 'pointer', textAlign: 'left',
                          fontFamily: 'inherit',
                        }}
                      >
                        <Avatar name={c.patient_name || c.recipient || '?'} size={44} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              fontSize: 15,
                              fontWeight: hasUnread || needsResponse ? 700 : 500,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              color: '#0f172a',
                            }}>
                              {c.patient_name || c.recipient || 'Unknown'}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>
                              {formatTime(c.last_message_at)}
                            </div>
                          </div>
                          {c.last_message && (
                            <div style={{
                              fontSize: 13,
                              color: hasUnread || needsResponse ? '#0f172a' : '#94a3b8',
                              fontWeight: hasUnread || needsResponse ? 600 : 400,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              marginTop: 2,
                            }}>
                              {c.last_direction === 'inbound' && (
                                <span style={{ color: needsResponse ? '#ea580c' : '#3b82f6', fontSize: 9 }}>● </span>
                              )}
                              {(c.last_message || '').slice(0, 80)}
                            </div>
                          )}
                        </div>
                        {needsResponse ? (
                          <span style={{
                            background: '#ea580c', color: '#fff',
                            borderRadius: 8, padding: '3px 8px',
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.3px',
                            textTransform: 'uppercase', flexShrink: 0,
                          }}>Reply</span>
                        ) : hasUnread ? (
                          <div style={{
                            background: '#3b82f6', color: '#fff', borderRadius: 10,
                            minWidth: 20, height: 20, fontSize: 11, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '0 6px', flexShrink: 0,
                          }}>{c.unread_count > 99 ? '99+' : c.unread_count}</div>
                        ) : null}
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
              {loadingChannels && channels.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
              )}
              {!loadingChannels && filteredChannels.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                  {search ? 'No matches' : 'No conversations yet. Tap + to start one.'}
                </div>
              )}
              {filteredChannels.map((ch) => {
                const displayName = getChannelDisplayName(ch, employee.id);
                const hasUnread = ch.unread_count > 0;
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleOpenChannel(ch.id)}
                    style={{
                      width: '100%', padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      border: 'none', borderBottom: '1px solid #f1f5f9',
                      background: hasUnread ? '#f8fafc' : '#fff',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {ch.type === 'dm' ? (
                      <Avatar name={displayName} size={44} />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', background: '#e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        color: '#64748b',
                      }}><UsersIcon size={20} /></div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          fontSize: 15, fontWeight: hasUnread ? 700 : 500,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{displayName}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>
                          {formatTime(ch.last_message?.created_at)}
                        </div>
                      </div>
                      {ch.last_message && (
                        <div style={{
                          fontSize: 13, color: hasUnread ? '#0f172a' : '#94a3b8',
                          fontWeight: hasUnread ? 600 : 400,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          marginTop: 2,
                        }}>
                          {ch.last_message.sender_name?.split(' ')[0]}: {ch.last_message.content}
                        </div>
                      )}
                    </div>
                    {hasUnread && (
                      <div style={{
                        background: '#ef4444', color: '#fff', borderRadius: 10,
                        minWidth: 20, height: 20, fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 6px', flexShrink: 0,
                      }}>{ch.unread_count > 99 ? '99+' : ch.unread_count}</div>
                    )}
                  </button>
                );
              })}
                </>
              )}
            </div>

            {/* FAB to start a new conversation — Team or Patient depending on tab */}
            {tab !== 'calls' && <button
              onClick={() => {
                if (tab === 'team') { setView('new'); fetchEmployees(); }
                else { setView('patient-new'); setPatientSearchQ(''); setPatientSearchResults([]); }
              }}
              aria-label={tab === 'team' ? 'New conversation' : 'Text a patient'}
              style={{
                position: 'fixed',
                right: 20, bottom: 'calc(env(safe-area-inset-bottom) + 20px)',
                width: 56, height: 56, borderRadius: '50%',
                background: '#0f172a', color: '#fff', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(0,0,0,0.18)', cursor: 'pointer',
              }}
            ><PlusIcon size={26} /></button>}
          </>
        )}

        {/* ─── NEW PATIENT SMS VIEW ─────────────────────────────────────── */}
        {view === 'patient-new' && (
          <>
            <div style={{
              padding: '10px 12px',
              paddingTop: 'calc(env(safe-area-inset-top) + 10px)',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            }}>
              <button
                onClick={() => { setView('patients'); setPatientSearchQ(''); setPatientSearchResults([]); }}
                aria-label="Back"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#0f172a', display: 'flex' }}
              ><ArrowLeft /></button>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Text a patient</div>
            </div>

            <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <SearchIcon />
                </div>
                <input
                  value={patientSearchQ}
                  onChange={(e) => handlePatientSearchInput(e.target.value)}
                  placeholder="Search patient name…"
                  autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1.5px solid #e2e8f0', borderRadius: 10,
                    padding: '10px 12px 10px 36px', fontSize: 15,
                    background: '#f8fafc', outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {patientSearchQ.trim().length < 2 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                  Type at least 2 characters to search.
                </div>
              )}
              {patientSearchQ.trim().length >= 2 && searchingPatients && (
                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Searching…</div>
              )}
              {patientSearchQ.trim().length >= 2 && !searchingPatients && patientSearchResults.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No matches</div>
              )}
              {patientSearchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleStartPatientConversation(p)}
                  disabled={!p.phone}
                  style={{
                    width: '100%', padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: 'none', borderBottom: '1px solid #f1f5f9',
                    background: '#fff',
                    cursor: p.phone ? 'pointer' : 'default',
                    textAlign: 'left',
                    opacity: p.phone ? 1 : 0.5,
                    fontFamily: 'inherit',
                  }}
                >
                  <Avatar name={p.name || 'Patient'} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                      {p.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                      {p.phone || 'No phone on file'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── PATIENT SMS CHAT VIEW ─────────────────────────────────────── */}
        {view === 'patient-chat' && activePatient && (
          <>
            <div style={{
              padding: '10px 12px',
              paddingTop: 'calc(env(safe-area-inset-top) + 10px)',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            }}>
              <button
                onClick={() => { closePatient(); setView('patients'); fetchPatientConvos(); }}
                aria-label="Back"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#0f172a', display: 'flex' }}
              ><ArrowLeft /></button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activePatientName}
                </div>
                {activePatientPhone && (
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{activePatientPhone}</div>
                )}
              </div>
              {activePatientPhone && (
                <button
                  onClick={() => {
                    if (!voice.isActive) voice.call({ to: activePatientPhone, name: activePatientName });
                  }}
                  disabled={voice.isActive}
                  style={{
                    background: voice.isActive ? '#e2e8f0' : '#22c55e',
                    border: 'none',
                    borderRadius: '50%',
                    width: 34,
                    height: 34,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: voice.isActive ? 'default' : 'pointer',
                    flexShrink: 0,
                  }}
                  title="Call from (949) 997-3988"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </button>
              )}
              <button
                onClick={() => setShowDialer(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  flexShrink: 0,
                }}
                title="Keypad dialer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="4" height="4" rx="1" /><rect x="10" y="2" width="4" height="4" rx="1" /><rect x="16" y="2" width="4" height="4" rx="1" />
                  <rect x="4" y="8" width="4" height="4" rx="1" /><rect x="10" y="8" width="4" height="4" rx="1" /><rect x="16" y="8" width="4" height="4" rx="1" />
                  <rect x="4" y="14" width="4" height="4" rx="1" /><rect x="10" y="14" width="4" height="4" rx="1" /><rect x="16" y="14" width="4" height="4" rx="1" />
                  <rect x="10" y="20" width="4" height="4" rx="1" />
                </svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', WebkitOverflowScrolling: 'touch' }}>
              {loadingPatientMessages && patientMessages.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
              )}
              {!loadingPatientMessages && patientMessages.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No messages yet. Send the first one below.
                </div>
              )}
              {patientMessages.map((m, idx) => {
                const isOutbound = m.direction === 'outbound';
                const isError = m.status === 'error';
                const isSending = m.status === 'sending';
                const showTime = idx === patientMessages.length - 1 ||
                  patientMessages[idx + 1]?.direction !== m.direction;
                return (
                  <div key={m.id} style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: isOutbound ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '78%',
                        background: isError ? '#fee2e2' : (isOutbound ? '#0f172a' : '#f1f5f9'),
                        color: isError ? '#991b1b' : (isOutbound ? '#fff' : '#0f172a'),
                        padding: '8px 13px',
                        fontSize: 15, lineHeight: 1.45,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        borderRadius: 18,
                        opacity: isSending ? 0.6 : 1,
                      }}>
                        {m.message}
                      </div>
                    </div>
                    {showTime && (
                      <div style={{
                        textAlign: isOutbound ? 'right' : 'left',
                        fontSize: 10, color: isError ? '#dc2626' : '#94a3b8',
                        marginTop: 2,
                      }}>
                        {isError ? `Failed${m.error_message ? ': ' + m.error_message : ''}` : (isSending ? 'Sending…' : formatMessageTime(m.created_at))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={patientBottomRef} />
            </div>

            <div style={{
              borderTop: '1px solid #e2e8f0',
              padding: '10px 12px',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)',
              display: 'flex', gap: 8, alignItems: 'flex-end',
              flexShrink: 0,
            }}>
              <textarea
                ref={patientInputRef}
                value={patientInput}
                onChange={(e) => setPatientInput(e.target.value)}
                onKeyDown={handlePatientKey}
                placeholder={activePatientPhone ? `Text ${activePatientName.split(' ')[0]}…` : 'No phone on file'}
                rows={1}
                disabled={!activePatientPhone}
                style={{
                  flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 18,
                  padding: '10px 14px', fontSize: 15, lineHeight: 1.4,
                  background: '#f8fafc', color: '#0f172a', resize: 'none',
                  fontFamily: 'inherit', maxHeight: 120, overflowY: 'auto',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={handleSendPatientSms}
                disabled={!patientInput.trim() || patientSending || !activePatientPhone}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: patientInput.trim() && !patientSending && activePatientPhone ? '#0f172a' : '#e2e8f0',
                  border: 'none',
                  cursor: patientInput.trim() && !patientSending && activePatientPhone ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SendIcon color={patientInput.trim() && !patientSending && activePatientPhone ? '#fff' : '#94a3b8'} />
              </button>
            </div>

            {/* Floating call bar */}
            <AppCallBar
              callState={voice.callState}
              callInfo={voice.callInfo}
              muted={voice.muted}
              onHangUp={voice.hangUp}
              onToggleMute={voice.toggleMute}
              formatDuration={voice.formatDuration}
              incomingCall={voice.incomingCall}
              onAnswer={voice.answer}
              onReject={voice.reject}
              onSendDigits={voice.sendDigits}
            />

            {/* Standalone keypad dialer */}
            {showDialer && (
              <CallKeypad
                dialMode
                onDigit={voice.isActive ? voice.sendDigits : undefined}
                onCall={(number) => {
                  voice.call({ to: number, name: number });
                  setShowDialer(false);
                }}
                onClose={() => setShowDialer(false)}
              />
            )}
          </>
        )}

        {/* ─── CHAT VIEW ────────────────────────────────────────────────── */}
        {view === 'chat' && (
          <>
            <div style={{
              padding: '10px 12px',
              paddingTop: 'calc(env(safe-area-inset-top) + 10px)',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            }}>
              <button
                onClick={() => { closeChannel(); setView('channels'); fetchChannels(); }}
                aria-label="Back"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#0f172a', display: 'flex' }}
              ><ArrowLeft /></button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {channelName}
                </div>
                {activeChannel?.type === 'group' && (
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {activeChannel.members?.length} members
                  </div>
                )}
              </div>
            </div>

            <div
              ref={messagesContainerRef}
              style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', WebkitOverflowScrolling: 'touch' }}
              onScroll={(e) => {
                if (e.target.scrollTop === 0 && hasMore && !loadingMessages) loadMore();
              }}
            >
              {loadingMessages && messages.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
              )}
              {hasMore && (
                <button
                  onClick={loadMore} disabled={loadingMessages}
                  style={{
                    display: 'block', margin: '0 auto 8px', padding: '6px 14px',
                    background: '#f1f5f9', border: 'none', borderRadius: 999,
                    fontSize: 12, color: '#64748b', cursor: 'pointer',
                  }}
                >{loadingMessages ? 'Loading…' : 'Load older messages'}</button>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === employee.id;
                const senderName = msg.sender?.name || 'Unknown';
                const showSender = !isMe && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id);
                return (
                  <div key={msg.id} style={{ marginBottom: 4 }}>
                    {showSender && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, marginTop: idx === 0 ? 0 : 8 }}>
                        <Avatar name={senderName} size={22} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{senderName.split(' ')[0]}</span>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{formatMessageTime(msg.created_at)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '78%',
                        background: isMe ? '#0f172a' : '#f1f5f9',
                        color: isMe ? '#fff' : '#0f172a',
                        padding: msg.attachment_url ? 4 : '8px 13px',
                        fontSize: 15, lineHeight: 1.45,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        borderRadius: 18,
                      }}>
                        {msg.attachment_url && isImageType(msg.attachment_type) && (
                          <img
                            src={msg.attachment_url} alt={msg.attachment_name || 'Image'}
                            style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 14, display: 'block' }}
                          />
                        )}
                        {msg.attachment_url && !isImageType(msg.attachment_type) && (
                          <a
                            href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '8px 12px', color: isMe ? '#bfdbfe' : '#3b82f6',
                              textDecoration: 'none', fontSize: 13,
                            }}
                          ><FileIcon /> {msg.attachment_name || 'Download file'}</a>
                        )}
                        {msg.content && (
                          <div style={msg.attachment_url ? { padding: '6px 10px 4px' } : undefined}>{msg.content}</div>
                        )}
                      </div>
                    </div>
                    {isMe && (idx === messages.length - 1 || messages[idx + 1]?.sender_id !== msg.sender_id) && (
                      <div style={{ textAlign: 'right', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                        {formatMessageTime(msg.created_at)}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {pendingFile && (
              <div style={{
                padding: '8px 14px', borderTop: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', flexShrink: 0,
              }}>
                <FileIcon />
                <span style={{ fontSize: 13, color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pendingFile.name}
                </span>
                <button onClick={() => setPendingFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                  <XIcon size={14} />
                </button>
              </div>
            )}

            <div style={{
              borderTop: '1px solid #e2e8f0',
              padding: '10px 12px',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)',
              display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
              background: '#fff',
            }}>
              <input
                ref={fileInputRef} type="file" style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#64748b', display: 'flex', flexShrink: 0 }}
                aria-label="Attach file"
              ><PaperclipIcon /></button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Message"
                rows={1}
                style={{
                  flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 18,
                  padding: '10px 14px', fontSize: 16, lineHeight: 1.4,
                  background: '#f8fafc', resize: 'none',
                  fontFamily: 'inherit', maxHeight: 120, overflowY: 'auto',
                  outline: 'none',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !pendingFile) || sending}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: (input.trim() || pendingFile) && !sending ? '#0f172a' : '#e2e8f0',
                  border: 'none',
                  cursor: (input.trim() || pendingFile) && !sending ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-label="Send"
              >
                {uploading ? (
                  <div style={{ width: 16, height: 16, border: '2px solid #94a3b8', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <SendIcon color={(input.trim() || pendingFile) && !sending ? '#fff' : '#94a3b8'} />
                )}
              </button>
            </div>
          </>
        )}

        {/* ─── NEW MESSAGE VIEW ─────────────────────────────────────────── */}
        {view === 'new' && (
          <>
            <div style={{
              padding: '10px 12px',
              paddingTop: 'calc(env(safe-area-inset-top) + 10px)',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            }}>
              <button
                onClick={() => { setView('channels'); setSelectedMembers([]); setGroupName(''); setEmpSearch(''); }}
                aria-label="Back"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#0f172a', display: 'flex' }}
              ><ArrowLeft /></button>
              <div style={{ fontSize: 17, fontWeight: 700 }}>New Message</div>
            </div>

            {selectedMembers.length > 0 && (
              <div style={{
                padding: '10px 14px', borderBottom: '1px solid #f1f5f9',
                display: 'flex', flexWrap: 'wrap', gap: 6, flexShrink: 0,
              }}>
                {selectedMembers.map((m) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: '#f1f5f9', padding: '4px 10px 4px 6px',
                    borderRadius: 999, fontSize: 13, color: '#0f172a',
                  }}>
                    <Avatar name={m.name} size={20} />
                    {m.name.split(' ')[0]}
                    <button
                      onClick={() => setSelectedMembers((prev) => prev.filter((p) => p.id !== m.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', display: 'flex', marginLeft: 4 }}
                    ><XIcon size={12} /></button>
                  </div>
                ))}
              </div>
            )}

            {selectedMembers.length >= 2 && (
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name (optional)"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1.5px solid #e2e8f0', borderRadius: 8,
                    padding: '10px 12px', fontSize: 15, background: '#f8fafc', outline: 'none',
                  }}
                />
              </div>
            )}

            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <SearchIcon />
                </div>
                <input
                  value={empSearch} onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Search team members" autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1.5px solid #e2e8f0', borderRadius: 10,
                    padding: '10px 12px 10px 36px', fontSize: 15,
                    background: '#f8fafc', outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedMembers((prev) => [...prev, emp])}
                  style={{
                    width: '100%', padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: 'none', borderBottom: '1px solid #f1f5f9',
                    background: '#fff', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Avatar name={emp.name} size={36} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{emp.name}</div>
                    {emp.title && <div style={{ fontSize: 12, color: '#94a3b8' }}>{emp.title}</div>}
                  </div>
                </button>
              ))}
              {filteredEmployees.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  {empSearch ? 'No matches' : 'No team members available'}
                </div>
              )}
            </div>

            {selectedMembers.length > 0 && (
              <div style={{
                padding: '12px 14px',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
                borderTop: '1px solid #e2e8f0', flexShrink: 0,
              }}>
                <button
                  onClick={handleCreateConversation}
                  style={{
                    width: '100%', padding: '13px 0',
                    background: '#0f172a', color: '#fff', border: 'none',
                    borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {selectedMembers.length === 1
                    ? `Message ${selectedMembers[0].name.split(' ')[0]}`
                    : `Create Group (${selectedMembers.length + 1} people)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        html, body, #__next {
          background: #fff;
          height: 100%;
          margin: 0;
          overflow: hidden;
          position: fixed;
          width: 100%;
          overscroll-behavior: none;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
    </>
  );
}

// ── <Head> contents (manifest, meta, theme color) ────────────────────────────

function ChatHead() {
  return (
    <>
      <title>Range Chat</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      <meta name="theme-color" content="#0f172a" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Range Chat" />
      <meta name="mobile-web-app-capable" content="yes" />
      <link rel="manifest" href="/chat-manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="robots" content="noindex, nofollow" />
    </>
  );
}

// ── Calls tab content ────────────────────────────────────────────────────────

const DIAL_KEYS = [
  { digit: '1', sub: '' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '' },
  { digit: '0', sub: '+' },
  { digit: '#', sub: '' },
];

function CallsTabContent({
  subView, setSubView, dialInput, setDialInput, onKeyPress, onDial, voice,
  patientSearch, onPatientSearch, patientResults, searchingPatients,
  callHistory, loadingCallHistory, fetchCallHistory, formatCallTime, formatCallDuration,
}) {
  return (
    <div style={{ padding: '0 12px 12px' }}>
      {/* Keypad / Recents toggle */}
      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, marginBottom: 12 }}>
        <button
          onClick={() => setSubView('keypad')}
          style={{
            flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: subView === 'keypad' ? '#fff' : 'transparent',
            color: subView === 'keypad' ? '#0f172a' : '#64748b',
            borderRadius: 6,
            boxShadow: subView === 'keypad' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >Keypad</button>
        <button
          onClick={() => { setSubView('recents'); fetchCallHistory(); }}
          style={{
            flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: subView === 'recents' ? '#fff' : 'transparent',
            color: subView === 'recents' ? '#0f172a' : '#64748b',
            borderRadius: 6,
            boxShadow: subView === 'recents' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >Recents</button>
      </div>

      {subView === 'keypad' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Patient search */}
          <div style={{ width: '100%', marginBottom: 14 }}>
            <input
              value={patientSearch}
              onChange={e => onPatientSearch(e.target.value)}
              placeholder="Search patients to call..."
              type="search"
              style={{
                width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
                padding: '10px 14px', fontSize: 15, outline: 'none', background: '#fff',
                boxSizing: 'border-box',
              }}
            />
            {patientResults.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 4, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                {patientResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (p.phone) {
                        onDial(p.phone, p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim());
                        onPatientSearch('');
                      }
                    }}
                    disabled={!p.phone}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                      padding: '11px 14px', border: 'none', borderBottom: '1px solid #f1f5f9',
                      background: 'none', cursor: p.phone ? 'pointer' : 'default', textAlign: 'left',
                      opacity: p.phone ? 1 : 0.5,
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#475569', flexShrink: 0 }}>
                      {(p.name || '').split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.phone || 'No phone'}</div>
                    </div>
                    {p.phone && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            {searchingPatients && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>Searching...</div>}
          </div>

          {/* Dial display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 260, marginBottom: 10, minHeight: 36 }}>
            <input
              type="tel"
              value={dialInput}
              onChange={e => setDialInput(e.target.value.replace(/[^0-9+*#]/g, ''))}
              placeholder="Enter number"
              style={{ flex: 1, fontSize: 22, fontWeight: 700, color: '#0f172a', textAlign: 'center', border: 'none', outline: 'none', background: 'transparent' }}
            />
            {dialInput && (
              <button onClick={() => setDialInput(prev => prev.slice(0, -1))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            )}
          </div>

          {/* Keypad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%', maxWidth: 260 }}>
            {DIAL_KEYS.map(({ digit, sub }) => (
              <button
                key={digit}
                onClick={() => onKeyPress(digit)}
                style={{
                  width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', border: 'none',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>{digit}</span>
                {sub && <span style={{ fontSize: 8, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.12em', marginTop: 1 }}>{sub}</span>}
              </button>
            ))}
          </div>

          {/* Call button */}
          <button
            onClick={() => onDial(dialInput)}
            disabled={!dialInput.trim() || voice.isActive}
            style={{
              marginTop: 14, width: 56, height: 56, borderRadius: '50%',
              background: (!dialInput.trim() || voice.isActive) ? '#e2e8f0' : '#22c55e',
              border: 'none', cursor: (!dialInput.trim() || voice.isActive) ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </button>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Calls from (949) 997-3988</div>
        </div>
      )}

      {subView === 'recents' && (
        <>
          {loadingCallHistory ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading...</div>
          ) : callHistory.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No call history yet</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {callHistory.map((c, i) => {
                const number = c.direction === 'inbound' ? c.from_number || c.from : c.to_number || c.to;
                const name = c.patient_name || c.contact_name || null;
                const isMissed = c.status === 'no-answer' || c.status === 'busy' || c.status === 'failed';
                const color = isMissed ? '#ef4444' : (c.direction === 'inbound' ? '#22c55e' : '#6366f1');
                return (
                  <button
                    key={c.id || c.sid || i}
                    onClick={() => { if (number && !voice.isActive) onDial(number, name); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', width: '100%',
                      borderBottom: i < callHistory.length - 1 ? '1px solid #f1f5f9' : 'none',
                      cursor: 'pointer', background: 'none', border: 'none', borderBottom: i < callHistory.length - 1 ? '1px solid #f1f5f9' : 'none',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                      {isMissed ? '↗️' : (c.direction === 'inbound' ? '↙️' : '↗️')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: isMissed ? '#ef4444' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {name || number || 'Unknown'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                        {name && number && <span>{number} · </span>}
                        {formatCallTime(c.start_time || c.created_at)}
                        {c.status === 'completed' && c.duration ? ` · ${formatCallDuration(c.duration)}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
