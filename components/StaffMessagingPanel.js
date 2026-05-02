// /components/StaffMessagingPanel.js
// Floating staff-to-staff messaging widget — Slack-like internal chat
// Available on every admin page via AdminLayout
// Range Medical

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import useStaffMessaging from '../hooks/useStaffMessaging';
import usePatientMessaging from '../hooks/usePatientMessaging';
import { supabase } from '../lib/supabase';

// ── Push subscription helper ─────────────────────────────────────────────────
// Mirrors the flow used by /pages/chat/index.js so staff who open the panel
// (without ever visiting /chat) can still receive patient SMS push notifications.

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

async function ensurePushSubscriptionFromPanel(accessToken) {
  if (typeof window === 'undefined') return { ok: false, reason: 'ssr' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return { ok: false, reason: 'no-vapid' };

  let reg;
  try {
    reg = await navigator.serviceWorker.register('/chat-sw.js', { scope: '/chat' });
    await navigator.serviceWorker.ready;
  } catch (e) {
    return { ok: false, reason: 'sw-failed' };
  }

  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') return { ok: false, reason: 'permission-denied' };
  } else if (Notification.permission === 'denied') {
    return { ok: false, reason: 'permission-denied' };
  }

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    } catch (e) {
      return { ok: false, reason: 'subscribe-failed' };
    }
  }

  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
  } catch (_) {}
  return { ok: true };
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function UsersIcon({ size = 22, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function SendIcon({ color = '#fff' }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

// ── Helper ─────────────────────────────────────────────────────────────────────

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
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function isImageType(type) {
  return type && type.startsWith('image/');
}

function getChannelDisplayName(channel, currentEmployeeId) {
  if (channel.name) return channel.name;
  if (channel.type === 'dm') {
    const other = channel.members?.find((m) => m.id !== currentEmployeeId);
    return other?.name || 'Direct Message';
  }
  return channel.members?.map((m) => m.name?.split(' ')[0]).join(', ') || 'Group Chat';
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#1a1a1a', '#374151', '#4b5563', '#1f2937', '#111827'];

function Avatar({ name, size = 32 }) {
  const initials = getInitials(name);
  const colorIdx = (name || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: AVATAR_COLORS[colorIdx],
      color: '#fff', fontSize: size * 0.38, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Toast notification ─────────────────────────────────────────────────────────

function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 10000,
      background: '#111', color: '#fff', borderRadius: 8,
      padding: '12px 16px', maxWidth: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      animation: 'rmchat-slidein 0.3s ease-out', display: 'flex', alignItems: 'center', gap: 10,
      cursor: 'pointer',
    }} onClick={onDismiss}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <UsersIcon size={16} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Team Message</div>
        <div style={{ fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{message}</div>
      </div>
    </div>
  );
}

// ── Image Lightbox ─────────────────────────────────────────────────────────────

function Lightbox({ src, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 10001,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'zoom-out',
    }}>
      <img src={src} alt="Attachment" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 4 }} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function StaffMessagingPanel() {
  const { employee, session } = useAuth();
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
    dismissNeedsResponse,
  } = usePatientMessaging(employee);

  const [open, setOpen] = useState(false);
  // 'channels' | 'chat' | 'new' | 'patients' | 'patient-chat'
  const [view, setView] = useState('channels');
  // 'team' | 'patients' — controls which list shows in the list view
  const [tab, setTab] = useState('team');
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Patient SMS compose
  const [patientInput, setPatientInput] = useState('');
  const [patientSending, setPatientSending] = useState(false);

  // New patient conversation search
  const [patientSearchQ, setPatientSearchQ] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const patientSearchTimeoutRef = useRef(null);

  // New message state
  const [employees, setEmployees] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [empSearch, setEmpSearch] = useState('');

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const patientInputRef = useRef(null);
  const patientBottomRef = useRef(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (view === 'chat' && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  // Focus input when chat opens
  useEffect(() => {
    if (view === 'chat' && open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [view, open]);

  // Fetch employees for new message view
  const fetchEmployees = useCallback(async () => {
    if (employees.length > 0) return;
    try {
      const { data } = await supabase
        .from('employees')
        .select('id, name, title')
        .eq('is_active', true)
        .order('name');
      setEmployees((data || []).filter((e) => e.id !== employee?.id));
    } catch (e) {
      console.error('Fetch employees error:', e);
    }
  }, [employee?.id, employees.length]);

  // Handle open panel
  const handleOpen = useCallback(() => {
    setOpen(true);
    setView(tab === 'patients' ? 'patients' : 'channels');
    if (tab === 'patients') fetchPatientConvos(); else fetchChannels();
  }, [fetchChannels, fetchPatientConvos, tab]);

  // Handle open channel
  const handleOpenChannel = useCallback(async (channelId) => {
    setView('chat');
    await openChannel(channelId);
  }, [openChannel]);

  // Open a patient SMS thread
  const handleOpenPatient = useCallback(async (patient) => {
    setView('patient-chat');
    await openPatient(patient);
    setTimeout(() => patientInputRef.current?.focus(), 150);
  }, [openPatient]);

  // Tab switch (Team / Patients) within the list view
  const handleSwitchTab = useCallback((next) => {
    setTab(next);
    setSearch('');
    if (next === 'patients') {
      setView('patients');
      fetchPatientConvos();
    } else {
      setView('channels');
      fetchChannels();
    }
  }, [fetchChannels, fetchPatientConvos]);

  // Auto-scroll patient thread on new messages
  useEffect(() => {
    if (view === 'patient-chat' && patientBottomRef.current) {
      patientBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [patientMessages, view]);

  // Try to ensure push subscription whenever the panel opens. Silent on
  // unsupported / denied / unauthenticated — only prompts if browser permission
  // is still 'default'. This way staff who use the panel without ever visiting
  // /chat still get patient SMS pushes.
  const pushTriedRef = useRef(false);
  useEffect(() => {
    if (!open) return;
    if (pushTriedRef.current) return;
    if (!session?.access_token) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    // Only try silently if already granted; let /chat handle the explicit prompt
    // for staff who haven't decided yet.
    if (Notification.permission !== 'granted') return;
    pushTriedRef.current = true;
    ensurePushSubscriptionFromPanel(session.access_token).catch(() => {});
  }, [open, session?.access_token]);

  // Listen for service-worker click messages — tapping a patient SMS push
  // should jump straight to that conversation.
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const onMsg = (e) => {
      if (e.data?.type === 'open-patient-sms') {
        const target = e.data.patient_id
          ? patientConvos.find(c => c.patient_id === e.data.patient_id)
          : patientConvos.find(c => c.recipient === e.data.recipient);
        if (target) {
          setOpen(true);
          setTab('patients');
          handleOpenPatient(target);
        } else if (e.data.patient_id) {
          // Conversation not yet in cache — open a minimal stub
          setOpen(true);
          setTab('patients');
          handleOpenPatient({ patient_id: e.data.patient_id, recipient: e.data.recipient || null });
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    return () => navigator.serviceWorker.removeEventListener('message', onMsg);
  }, [patientConvos, handleOpenPatient]);

  // Send patient SMS from the panel
  const handleSendPatientSms = useCallback(async () => {
    const text = patientInput.trim();
    if (!text || patientSending || !activePatient) return;
    setPatientSending(true);
    setPatientInput('');
    const result = await sendPatientSms(activePatient, text);
    setPatientSending(false);
    if (!result?.success) {
      // Restore the text so the user can retry
      setPatientInput(text);
      setToast(result?.error || 'Failed to send');
    }
    setTimeout(() => patientInputRef.current?.focus(), 80);
  }, [patientInput, patientSending, activePatient, sendPatientSms]);

  const handlePatientKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendPatientSms(); }
  };

  const handlePatientSearchInput = useCallback((q) => {
    setPatientSearchQ(q);
    if (patientSearchTimeoutRef.current) clearTimeout(patientSearchTimeoutRef.current);
    if (!q || q.trim().length < 2) {
      setPatientSearchResults([]);
      setSearchingPatients(false);
      return;
    }
    setSearchingPatients(true);
    patientSearchTimeoutRef.current = setTimeout(async () => {
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

  const handleStartPatientConversation = useCallback(async (p) => {
    if (!p?.phone) {
      setToast('This patient has no phone number on file.');
      return;
    }
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

  // Handle send message
  const handleSend = useCallback(async () => {
    if ((!input.trim() && !pendingFile) || sending || !activeChannelId) return;

    setSending(true);
    let attachment = null;

    if (pendingFile) {
      setUploading(true);
      attachment = await uploadFile(pendingFile);
      setUploading(false);
      if (!attachment) {
        setSending(false);
        return;
      }
      setPendingFile(null);
    }

    const content = input.trim();
    setInput('');

    // Optimistic add
    const optimistic = {
      id: 'temp-' + Date.now(),
      channel_id: activeChannelId,
      sender_id: employee.id,
      content,
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.filename || null,
      attachment_type: attachment?.type || null,
      created_at: new Date().toISOString(),
      sender: { id: employee.id, name: employee.name, title: employee.title },
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await sendMessage(activeChannelId, content, attachment);

    // Replace optimistic with real message
    if (result) {
      setMessages((prev) =>
        prev.map((m) => m.id === optimistic.id ? result : m)
      );
    }

    setSending(false);
    fetchChannels(); // Update channel list order
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [input, pendingFile, sending, activeChannelId, employee, sendMessage, uploadFile, fetchChannels, setMessages]);

  // Handle file select
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be under 10MB');
      return;
    }
    setPendingFile(file);
    e.target.value = '';
  }, []);

  // Handle new message creation
  const handleCreateConversation = useCallback(async () => {
    if (selectedMembers.length === 0) return;

    let channelId;
    if (selectedMembers.length === 1 && !groupName.trim()) {
      channelId = await openDm(selectedMembers[0].id);
    } else {
      const memberIds = selectedMembers.map((m) => m.id);
      channelId = await createChannel(memberIds, groupName.trim() || undefined);
    }

    if (channelId) {
      setSelectedMembers([]);
      setGroupName('');
      setEmpSearch('');
      setView('chat');
      await openChannel(channelId);
    }
  }, [selectedMembers, groupName, openDm, createChannel, openChannel]);

  // Handle key press
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!employee) return null;

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const channelName = activeChannel ? getChannelDisplayName(activeChannel, employee.id) : '';

  // Filter channels by search
  const filteredChannels = channels.filter((c) => {
    if (!search.trim()) return true;
    const name = getChannelDisplayName(c, employee.id).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // Filter employees for new message
  const filteredEmployees = employees.filter((e) => {
    if (selectedMembers.some((m) => m.id === e.id)) return false;
    if (!empSearch.trim()) return true;
    return e.name.toLowerCase().includes(empSearch.toLowerCase());
  });

  // Filter patient conversations by search
  const filteredPatientConvos = patientConvos.filter((c) => {
    if (!search.trim()) return true;
    const name = (c.patient_name || c.recipient || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // Combined unread badge (team + patient inbound)
  const combinedUnread = (totalUnread || 0) + (patientUnread || 0);

  // Active patient display
  const activePatientName = activePatient?.patient_name || activePatient?.recipient || 'Patient';
  const activePatientPhone = activePatient?.recipient || '';

  // ── Panel styles ───────────────────────────────────────────────────────────

  const panelStyle = isMobile && open ? {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100vw',
    height: '100dvh',
    background: '#fff',
    zIndex: 9995,
    display: 'flex',
    flexDirection: 'column',
    animation: 'rmchat-slidein 0.2s ease-out',
  } : {
    position: 'fixed',
    bottom: 88,
    right: 88,
    width: 380,
    maxWidth: 'calc(100vw - 32px)',
    height: 560,
    maxHeight: 'calc(100vh - 120px)',
    background: '#fff',
    borderRadius: 0,
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9995,
    animation: 'rmchat-slidein 0.2s ease-out',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  };

  return (
    <div data-staff-messaging-panel>
      <style>{`
        @keyframes rmchat-slidein {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {/* Lightbox */}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {/* Floating button */}
      <button
        onClick={() => open ? setOpen(false) : handleOpen()}
        title="Team Chat"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 88,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#1a1a1a',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          zIndex: 9996,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {open ? <XIcon size={20} /> : <UsersIcon size={22} color="#fff" />}

        {/* Unread badge — combines team chat unread + patient SMS unread */}
        {combinedUnread > 0 && !open && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            background: '#ef4444', color: '#fff',
            borderRadius: 10, minWidth: 18, height: 18,
            fontSize: 11, fontWeight: 700, padding: '0 5px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            {combinedUnread > 99 ? '99+' : combinedUnread}
          </div>
        )}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        onChange={handleFileSelect}
      />

      {/* Panel */}
      {open && (
        <div style={panelStyle}>

          {/* ── LIST VIEW (Team channels or Patient conversations) ──────── */}
          {(view === 'channels' || view === 'patients') && (
            <>
              {/* Header */}
              <div style={{
                padding: '14px 16px 10px',
                borderBottom: '1px solid #e5e7eb',
                flexShrink: 0,
              }}>
                {/* Tab switcher: Team | Patients */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                  <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                    <button
                      onClick={() => handleSwitchTab('team')}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        background: tab === 'team' ? '#000' : '#fff',
                        color: tab === 'team' ? '#fff' : '#374151',
                        border: '1px solid ' + (tab === 'team' ? '#000' : '#e5e7eb'),
                        borderRadius: 0,
                        fontSize: 12, fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      Team
                      {totalUnread > 0 && (
                        <span style={{
                          background: tab === 'team' ? '#fff' : '#ef4444',
                          color: tab === 'team' ? '#000' : '#fff',
                          borderRadius: 8, padding: '0 5px',
                          fontSize: 10, fontWeight: 700, minWidth: 16, height: 14,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>{totalUnread > 99 ? '99+' : totalUnread}</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleSwitchTab('patients')}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        background: tab === 'patients' ? '#000' : '#fff',
                        color: tab === 'patients' ? '#fff' : '#374151',
                        border: '1px solid ' + (tab === 'patients' ? '#000' : '#e5e7eb'),
                        borderRadius: 0,
                        fontSize: 12, fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      Patients
                      {(patientUnread > 0 || patientNeedsResponse > 0) && (
                        <span style={{
                          background: tab === 'patients' ? '#fff' : (patientNeedsResponse > 0 ? '#ea580c' : '#ef4444'),
                          color: tab === 'patients' ? '#000' : '#fff',
                          borderRadius: 8, padding: '0 5px',
                          fontSize: 10, fontWeight: 700, minWidth: 16, height: 14,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>{(patientUnread || patientNeedsResponse) > 99 ? '99+' : (patientUnread || patientNeedsResponse)}</span>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (tab === 'team') { setView('new'); fetchEmployees(); }
                      else { setView('patient-new'); setPatientSearchQ(''); setPatientSearchResults([]); }
                    }}
                    style={{
                      background: '#000', color: '#fff', border: 'none',
                      borderRadius: 0, padding: '7px 10px',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <PlusIcon /> New
                  </button>
                </div>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                    <SearchIcon />
                  </div>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={tab === 'patients' ? 'Search patients...' : 'Search conversations...'}
                    style={{
                      width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 0,
                      padding: '7px 10px 7px 30px', fontSize: 13,
                      background: '#f9fafb', color: '#111', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* List body — channels OR patient conversations depending on tab */}
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {tab === 'patients' ? (
                  <>
                    {loadingPatients && patientConvos.length === 0 && (
                      <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading...</div>
                    )}
                    {!loadingPatients && filteredPatientConvos.length === 0 && (
                      <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
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
                            display: 'flex', alignItems: 'center', gap: 10,
                            border: 'none', borderBottom: '1px solid #f3f4f6',
                            borderLeft: needsResponse ? '3px solid #ea580c' : (hasUnread ? '3px solid #3b82f6' : 'none'),
                            background: needsResponse ? '#fff7ed' : (hasUnread ? '#f0f7ff' : '#fff'),
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <Avatar name={c.patient_name || c.recipient || '?'} size={36} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{
                                fontSize: 14, fontWeight: hasUnread || needsResponse ? 700 : 500,
                                color: '#111', whiteSpace: 'nowrap', overflow: 'hidden',
                                textOverflow: 'ellipsis', maxWidth: 180,
                              }}>
                                {c.patient_name || c.recipient || 'Unknown'}
                              </div>
                              <div style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 8 }}>
                                {formatTime(c.last_message_at)}
                              </div>
                            </div>
                            {c.last_message && (
                              <div style={{
                                fontSize: 12,
                                color: needsResponse || hasUnread ? '#111' : '#9ca3af',
                                fontWeight: needsResponse || hasUnread ? 600 : 400,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                marginTop: 2,
                              }}>
                                {c.last_direction === 'inbound' && (
                                  <span style={{ color: needsResponse ? '#ea580c' : '#3b82f6', fontSize: 8 }}>● </span>
                                )}
                                {(c.last_message || '').slice(0, 80)}
                              </div>
                            )}
                          </div>
                          {needsResponse ? (
                            <span style={{
                              background: '#ea580c', color: '#fff',
                              borderRadius: 0, padding: '3px 7px',
                              fontSize: 9, fontWeight: 700, letterSpacing: '0.3px',
                              textTransform: 'uppercase', flexShrink: 0,
                            }}>
                              Reply
                            </span>
                          ) : hasUnread ? (
                            <div style={{
                              background: '#3b82f6', color: '#fff', borderRadius: 10,
                              minWidth: 18, height: 18, fontSize: 11, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: '0 5px', flexShrink: 0,
                            }}>
                              {c.unread_count > 99 ? '99+' : c.unread_count}
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <>
                {loadingChannels && channels.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading...</div>
                )}
                {!loadingChannels && filteredChannels.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    {search ? 'No matches' : 'No conversations yet. Start one!'}
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
                        display: 'flex', alignItems: 'center', gap: 10,
                        border: 'none', borderBottom: '1px solid #f3f4f6',
                        background: hasUnread ? '#f8f9ff' : '#fff',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {ch.type === 'dm' ? (
                        <Avatar name={displayName} size={36} />
                      ) : (
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: '#e5e7eb', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <UsersIcon size={18} color="#6b7280" />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{
                            fontSize: 14, fontWeight: hasUnread ? 700 : 500,
                            color: '#111', whiteSpace: 'nowrap', overflow: 'hidden',
                            textOverflow: 'ellipsis', maxWidth: 180,
                          }}>
                            {displayName}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 8 }}>
                            {formatTime(ch.last_message?.created_at)}
                          </div>
                        </div>
                        {ch.last_message && (
                          <div style={{
                            fontSize: 12, color: hasUnread ? '#111' : '#9ca3af',
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
                          minWidth: 18, height: 18, fontSize: 11, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 5px', flexShrink: 0,
                        }}>
                          {ch.unread_count > 99 ? '99+' : ch.unread_count}
                        </div>
                      )}
                    </button>
                  );
                })}
                  </>
                )}
              </div>
            </>
          )}

          {/* ── PATIENT SMS CHAT VIEW ─────────────────────────────────── */}
          {view === 'patient-chat' && activePatient && (
            <>
              {/* Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', gap: 10,
                flexShrink: 0,
              }}>
                <button
                  onClick={() => { closePatient(); setView('patients'); fetchPatientConvos(); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#374151', display: 'flex' }}
                >
                  <ArrowLeftIcon />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activePatientName}
                  </div>
                  {activePatientPhone && (
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{activePatientPhone}</div>
                  )}
                </div>
                {activePatient.patient_id && (
                  <a
                    href={`/admin/communications?patient=${activePatient.patient_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 11, color: '#6b7280', textDecoration: 'none',
                      border: '1px solid #e5e7eb', padding: '4px 8px',
                      borderRadius: 0, background: '#fff',
                      flexShrink: 0,
                    }}
                    title="Open in full Communications view"
                  >
                    Open ↗
                  </a>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', WebkitOverflowScrolling: 'touch' }}>
                {loadingPatientMessages && patientMessages.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading...</div>
                )}
                {!loadingPatientMessages && patientMessages.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
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
                          maxWidth: '80%',
                          background: isError ? '#fee2e2' : (isOutbound ? '#000' : '#f3f4f6'),
                          color: isError ? '#991b1b' : (isOutbound ? '#fff' : '#111'),
                          padding: '7px 12px',
                          fontSize: 14, lineHeight: 1.45,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          borderRadius: 0,
                          opacity: isSending ? 0.6 : 1,
                        }}>
                          {m.message}
                        </div>
                      </div>
                      {showTime && (
                        <div style={{
                          textAlign: isOutbound ? 'right' : 'left',
                          fontSize: 10, color: isError ? '#dc2626' : '#9ca3af',
                          marginTop: 2,
                        }}>
                          {isError ? `Failed${m.error_message ? ': ' + m.error_message : ''}` : (isSending ? 'Sending...' : formatMessageTime(m.created_at))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={patientBottomRef} />
              </div>

              {/* Compose */}
              <div style={{
                borderTop: '1px solid #e5e7eb',
                padding: '10px 12px',
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
                    flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 0,
                    padding: '8px 13px', fontSize: 14, lineHeight: 1.4,
                    background: '#f9fafb', color: '#111', resize: 'none',
                    fontFamily: 'inherit', maxHeight: 96, overflowY: 'auto',
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                  }}
                />
                <button
                  onClick={handleSendPatientSms}
                  disabled={!patientInput.trim() || patientSending || !activePatientPhone}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: patientInput.trim() && !patientSending && activePatientPhone ? '#000' : '#e5e7eb',
                    border: 'none',
                    cursor: patientInput.trim() && !patientSending && activePatientPhone ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background 0.15s',
                  }}
                >
                  <SendIcon color={patientInput.trim() && !patientSending && activePatientPhone ? '#fff' : '#9ca3af'} />
                </button>
              </div>
            </>
          )}

          {/* ── NEW PATIENT SMS VIEW ─────────────────────────────────── */}
          {view === 'patient-new' && (
            <>
              {/* Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', gap: 10,
                flexShrink: 0,
              }}>
                <button
                  onClick={() => { setView('patients'); setPatientSearchQ(''); setPatientSearchResults([]); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#374151', display: 'flex' }}
                >
                  <ArrowLeftIcon />
                </button>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Text a patient</div>
              </div>

              {/* Search */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                    <SearchIcon />
                  </div>
                  <input
                    value={patientSearchQ}
                    onChange={(e) => handlePatientSearchInput(e.target.value)}
                    placeholder="Search patient name…"
                    autoFocus
                    style={{
                      width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 0,
                      padding: '7px 10px 7px 30px', fontSize: 13, background: '#f9fafb',
                      color: '#111', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Results */}
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {patientSearchQ.trim().length < 2 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    Type at least 2 characters to search.
                  </div>
                )}
                {patientSearchQ.trim().length >= 2 && searchingPatients && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Searching…</div>
                )}
                {patientSearchQ.trim().length >= 2 && !searchingPatients && patientSearchResults.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No matches</div>
                )}
                {patientSearchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleStartPatientConversation(p)}
                    disabled={!p.phone}
                    style={{
                      width: '100%', padding: '10px 16px',
                      display: 'flex', alignItems: 'center', gap: 10,
                      border: 'none', borderBottom: '1px solid #f3f4f6',
                      background: '#fff',
                      cursor: p.phone ? 'pointer' : 'default',
                      textAlign: 'left',
                      opacity: p.phone ? 1 : 0.5,
                    }}
                  >
                    <Avatar name={p.name || 'Patient'} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{p.name || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
                        {p.phone || 'No phone on file'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── CHAT VIEW ─────────────────────────────────────────────── */}
          {view === 'chat' && (
            <>
              {/* Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', gap: 10,
                flexShrink: 0,
              }}>
                <button
                  onClick={() => { closeChannel(); setView('channels'); fetchChannels(); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#374151', display: 'flex' }}
                >
                  <ArrowLeftIcon />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {channelName}
                  </div>
                  {activeChannel?.type === 'group' && (
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {activeChannel.members?.length} members
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', WebkitOverflowScrolling: 'touch' }}
                onScroll={(e) => {
                  if (e.target.scrollTop === 0 && hasMore && !loadingMessages) {
                    loadMore();
                  }
                }}
              >
                {loadingMessages && messages.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading...</div>
                )}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMessages}
                    style={{
                      display: 'block', margin: '0 auto 8px', padding: '4px 12px',
                      background: '#f3f4f6', border: 'none', borderRadius: 0,
                      fontSize: 12, color: '#6b7280', cursor: 'pointer',
                    }}
                  >
                    {loadingMessages ? 'Loading...' : 'Load older messages'}
                  </button>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === employee.id;
                  const senderName = msg.sender?.name || 'Unknown';
                  const showSender = !isMe && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id);

                  return (
                    <div key={msg.id} style={{ marginBottom: 4 }}>
                      {showSender && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, marginTop: idx === 0 ? 0 : 8 }}>
                          <Avatar name={senderName} size={20} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{senderName.split(' ')[0]}</span>
                          <span style={{ fontSize: 10, color: '#9ca3af' }}>{formatMessageTime(msg.created_at)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '80%',
                          background: isMe ? '#000' : '#f3f4f6',
                          color: isMe ? '#fff' : '#111',
                          padding: msg.attachment_url ? '4px' : '7px 12px',
                          fontSize: 14, lineHeight: 1.45,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          borderRadius: 0,
                        }}>
                          {/* Attachment */}
                          {msg.attachment_url && isImageType(msg.attachment_type) && (
                            <img
                              src={msg.attachment_url}
                              alt={msg.attachment_name || 'Image'}
                              style={{
                                maxWidth: '100%', maxHeight: 200, borderRadius: 0,
                                cursor: 'pointer', display: 'block',
                              }}
                              onClick={() => setLightboxSrc(msg.attachment_url)}
                            />
                          )}
                          {msg.attachment_url && !isImageType(msg.attachment_type) && (
                            <a
                              href={msg.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 10px', color: isMe ? '#93c5fd' : '#3b82f6',
                                textDecoration: 'none', fontSize: 13,
                              }}
                            >
                              <FileIcon />
                              {msg.attachment_name || 'Download file'}
                            </a>
                          )}
                          {/* Text content */}
                          {msg.content && (
                            <div style={msg.attachment_url ? { padding: '6px 8px 4px' } : undefined}>
                              {msg.content}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Timestamp for own messages */}
                      {isMe && (idx === messages.length - 1 || messages[idx + 1]?.sender_id !== msg.sender_id) && (
                        <div style={{ textAlign: 'right', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                          {formatMessageTime(msg.created_at)}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Pending file preview */}
              {pendingFile && (
                <div style={{
                  padding: '6px 12px', borderTop: '1px solid #f3f4f6',
                  display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                  background: '#f9fafb',
                }}>
                  {pendingFile.type?.startsWith('image/') ? <ImageIcon /> : <FileIcon />}
                  <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pendingFile.name}
                  </span>
                  <button onClick={() => setPendingFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                    <XIcon size={14} />
                  </button>
                </div>
              )}

              {/* Compose */}
              <div style={{
                borderTop: '1px solid #e5e7eb',
                padding: '10px 12px',
                display: 'flex', gap: 8, alignItems: 'flex-end',
                flexShrink: 0,
              }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 4, color: '#6b7280', display: 'flex',
                    flexShrink: 0,
                  }}
                  title="Attach file"
                >
                  <PaperclipIcon />
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type a message..."
                  rows={1}
                  style={{
                    flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 0,
                    padding: '8px 13px', fontSize: 14, lineHeight: 1.4,
                    background: '#f9fafb', color: '#111', resize: 'none',
                    fontFamily: 'inherit', maxHeight: 96, overflowY: 'auto',
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !pendingFile) || sending}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: (input.trim() || pendingFile) && !sending ? '#000' : '#e5e7eb',
                    border: 'none',
                    cursor: (input.trim() || pendingFile) && !sending ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background 0.15s',
                  }}
                >
                  {uploading ? (
                    <div style={{ width: 14, height: 14, border: '2px solid #9ca3af', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <SendIcon color={(input.trim() || pendingFile) && !sending ? '#fff' : '#9ca3af'} />
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── NEW MESSAGE VIEW ───────────────────────────────────────── */}
          {view === 'new' && (
            <>
              {/* Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', gap: 10,
                flexShrink: 0,
              }}>
                <button
                  onClick={() => { setView('channels'); setSelectedMembers([]); setGroupName(''); setEmpSearch(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#374151', display: 'flex' }}
                >
                  <ArrowLeftIcon />
                </button>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>New Message</div>
              </div>

              {/* Selected members */}
              {selectedMembers.length > 0 && (
                <div style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex', flexWrap: 'wrap', gap: 6,
                  flexShrink: 0,
                }}>
                  {selectedMembers.map((m) => (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: '#f3f4f6', padding: '3px 8px 3px 6px',
                      borderRadius: 0, fontSize: 12, color: '#374151',
                    }}>
                      <Avatar name={m.name} size={18} />
                      {m.name.split(' ')[0]}
                      <button
                        onClick={() => setSelectedMembers((prev) => prev.filter((p) => p.id !== m.id))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', display: 'flex', marginLeft: 2 }}
                      >
                        <XIcon size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Group name (if 2+ selected) */}
              {selectedMembers.length >= 2 && (
                <div style={{ padding: '8px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group name (optional)"
                    style={{
                      width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 0,
                      padding: '7px 10px', fontSize: 13, background: '#f9fafb',
                      color: '#111', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Employee search */}
              <div style={{ padding: '8px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                    <SearchIcon />
                  </div>
                  <input
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    placeholder="Search team members..."
                    autoFocus
                    style={{
                      width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 0,
                      padding: '7px 10px 7px 30px', fontSize: 13, background: '#f9fafb',
                      color: '#111', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Employee list */}
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedMembers((prev) => [...prev, emp])}
                    style={{
                      width: '100%', padding: '10px 16px',
                      display: 'flex', alignItems: 'center', gap: 10,
                      border: 'none', borderBottom: '1px solid #f3f4f6',
                      background: '#fff', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <Avatar name={emp.name} size={32} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{emp.name}</div>
                      {emp.title && <div style={{ fontSize: 12, color: '#9ca3af' }}>{emp.title}</div>}
                    </div>
                  </button>
                ))}
                {filteredEmployees.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    {empSearch ? 'No matches' : 'No team members available'}
                  </div>
                )}
              </div>

              {/* Create button */}
              {selectedMembers.length > 0 && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
                  <button
                    onClick={handleCreateConversation}
                    style={{
                      width: '100%', padding: '10px 0',
                      background: '#000', color: '#fff', border: 'none',
                      borderRadius: 0, fontSize: 14, fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {selectedMembers.length === 1
                      ? `Message ${selectedMembers[0].name.split(' ')[0]}`
                      : `Create Group (${selectedMembers.length + 1} people)`
                    }
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
