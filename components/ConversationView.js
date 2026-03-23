// components/ConversationView.js
// Chat-style SMS/Email conversation UI for patient communications
// Fetches from local comms_log
// Range Medical System V2

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import TemplateMessages from './TemplateMessages';
import { useAuth } from './AuthProvider';
import { overlayClickProps } from './AdminLayout';

const CalendarView = dynamic(() => import('./CalendarView'), { ssr: false });

const FORM_OPTIONS = [
  { id: 'intake', name: 'Medical Intake' },
  { id: 'hipaa', name: 'HIPAA Privacy Notice' },
  { id: 'blood-draw', name: 'Blood Draw Consent' },
  { id: 'hrt', name: 'HRT Consent' },
  { id: 'peptide', name: 'Peptide Consent' },
  { id: 'iv', name: 'IV/Injection Consent' },
  { id: 'hbot', name: 'HBOT Consent' },
  { id: 'weight-loss', name: 'Weight Loss Consent' },
  { id: 'red-light', name: 'Red Light Therapy Consent' },
  { id: 'prp', name: 'PRP Consent' },
  { id: 'exosome-iv', name: 'Exosome IV Consent' },
  { id: 'questionnaire', name: 'Baseline Questionnaire' },
];

export default function ConversationView({ patientId, patientName, patientPhone, ghlContactId, onBack, onPatientLinked, onPrev, onNext, hasPrev, hasNext, onNeedsResponseCleared }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'sms' | 'email'
  const [callsSynced, setCallsSynced] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [smsProvider, setSmsProvider] = useState('blooio');
  const [formatting, setFormatting] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [selectedForms, setSelectedForms] = useState([]);
  const [sendingForms, setSendingForms] = useState(false);
  const [formsResult, setFormsResult] = useState(null);
  const { session } = useAuth();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
  const [taskEmployees, setTaskEmployees] = useState([]);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskResult, setTaskResult] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [linkedPatientId, setLinkedPatientId] = useState(patientId);
  const [displayName, setDisplayName] = useState(patientName);
  const [clearingAction, setClearingAction] = useState(false);
  const [showClearNote, setShowClearNote] = useState(false);
  const [clearNote, setClearNote] = useState('');
  const [botPaused, setBotPaused] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);
  const nameInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldScrollRef = useRef(false);

  // Sync internal state when props change (e.g. navigating between patients)
  useEffect(() => {
    setLinkedPatientId(patientId);
    setDisplayName(patientName);
    setEditingName(false);
    setShowClearNote(false);
    setClearNote('');
    setBotPaused(false);
    // Fetch bot_paused status for this patient
    if (patientId) {
      fetch(`/api/admin/patient-bot-status?patientId=${patientId}`)
        .then(r => r.json())
        .then(d => { if (d.bot_paused !== undefined) setBotPaused(d.bot_paused); })
        .catch(() => {});
    }
  }, [patientId, patientName]);

  useEffect(() => {
    if (patientId || patientPhone) {
      shouldScrollRef.current = true;
      fetchMessages();

      // Mark this patient's messages as read (by ID and/or phone so orphaned rows are cleared too)
      if (patientId || patientPhone) {
        fetch('/api/admin/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: patientId || null, patientPhone: patientPhone || null }),
        }).catch(() => {}); // non-blocking, best-effort
      }

      // Poll for new messages every 5 seconds
      const pollInterval = setInterval(() => {
        fetchMessages(true); // silent = true (no loading spinner)
      }, 5000);
      return () => clearInterval(pollInterval);
    }
  }, [patientId, patientPhone]);

  // Scroll to bottom after messages have rendered in the DOM
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages, loading, filter]);

  const openTaskModal = async () => {
    setShowTaskModal(true);
    setTaskResult(null);
    setTaskForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
    if (taskEmployees.length === 0) {
      try {
        const res = await fetch('/api/admin/employees?basic=true', {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setTaskEmployees(Array.isArray(data.employees) ? data.employees : Array.isArray(data) ? data : []);
        }
      } catch (e) { /* silent */ }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.assigned_to) return;
    setCreatingTask(true);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          title: taskForm.title.trim(),
          description: taskForm.description?.trim() || null,
          assigned_to: taskForm.assigned_to,
          patient_id: linkedPatientId || null,
          patient_name: displayName || patientName || null,
          priority: taskForm.priority,
          due_date: taskForm.due_date || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTaskResult({ success: true, message: 'Task created successfully' });
        setTimeout(() => setShowTaskModal(false), 1200);
      } else {
        setTaskResult({ success: false, message: data.error || 'Failed to create task' });
      }
    } catch (err) {
      setTaskResult({ success: false, message: 'Failed to create task' });
    } finally {
      setCreatingTask(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const savedScrollY = window.scrollY;
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      // Prevent the page itself from scrolling when we scroll the messages container
      if (window.scrollY !== savedScrollY) {
        window.scrollTo(0, savedScrollY);
      }
    }
  };

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // Fetch local comms_log (by patient ID + phone to catch orphaned pre-link messages)
      const phoneParam = patientPhone ? `&phone=${encodeURIComponent(patientPhone)}` : '';
      const commsUrl = patientId
        ? `/api/patients/${patientId}/comms?limit=200${phoneParam}`
        : `/api/patients/_/comms?limit=200&phone=${encodeURIComponent(patientPhone)}`;
      const res = await fetch(commsUrl);
      const data = await res.json();
      const localLogs = data.comms || [];

      // Sort oldest first for conversation view
      const sorted = localLogs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      // On poll: only update + scroll if there are new messages
      if (silent) {
        setMessages(prev => {
          if (sorted.length !== prev.length || (sorted.length > 0 && prev.length > 0 && sorted[sorted.length - 1].id !== prev[prev.length - 1].id)) {
            shouldScrollRef.current = true;
            return sorted;
          }
          return prev;
        });
      } else {
        setMessages(sorted);
      }
      setHasMore(data.hasMore || false);
      setTotalMessages(data.total || localLogs.length);
      if (!silent) setLoading(false);

      // Sync Twilio call history in background (non-blocking) — requires patientId
      if (patientPhone && patientId && !callsSynced) {
        syncTwilioCalls();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (!silent) setLoading(false);
    }
  };

  const loadEarlierMessages = async () => {
    try {
      setLoadingMore(true);
      const currentCount = messages.length;
      const phoneParam = patientPhone ? `&phone=${encodeURIComponent(patientPhone)}` : '';
      const commsUrl = patientId
        ? `/api/patients/${patientId}/comms?limit=200&offset=${currentCount}${phoneParam}`
        : `/api/patients/_/comms?limit=200&offset=${currentCount}&phone=${encodeURIComponent(patientPhone)}`;
      const res = await fetch(commsUrl);
      const data = await res.json();
      const olderLogs = data.comms || [];

      if (olderLogs.length > 0) {
        // Save scroll position before prepending
        const container = messagesContainerRef.current;
        const prevScrollHeight = container?.scrollHeight || 0;

        // Sort older messages oldest first, then prepend
        const sortedOlder = olderLogs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setMessages(prev => [...sortedOlder, ...prev]);
        setHasMore(data.hasMore || false);
        setTotalMessages(data.total || 0);

        // Restore scroll position after DOM update so user doesn't jump
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight;
          }
        });
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading earlier messages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const syncTwilioCalls = async () => {
    if (!patientPhone) return;
    try {
      const syncRes = await fetch('/api/twilio/sync-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          patient_phone: patientPhone,
        }),
      });

      // Guard against non-JSON responses (e.g. HTML error pages)
      const contentType = syncRes.headers.get('content-type') || '';
      if (!syncRes.ok || !contentType.includes('application/json')) {
        console.warn('Twilio sync-calls returned non-JSON response');
        setCallsSynced(true);
        return;
      }

      const syncData = await syncRes.json();

      if (syncData.synced > 0) {
        const refreshRes = await fetch(`/api/patients/${patientId}/comms?limit=200`);
        const refreshData = await refreshRes.json();
        const refreshedLogs = refreshData.comms || [];
        const sorted = refreshedLogs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setMessages(sorted);
        setHasMore(refreshData.hasMore || false);
        setTotalMessages(refreshData.total || refreshedLogs.length);
      }

      setCallsSynced(true);
    } catch (err) {
      console.error('Error syncing Twilio calls:', err);
      setCallsSynced(true);
    }
  };

  const toggleBot = async () => {
    const pid = linkedPatientId || patientId;
    if (!pid) return;
    setTogglingBot(true);
    try {
      const res = await fetch('/api/admin/toggle-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: pid, paused: !botPaused }),
      });
      const data = await res.json();
      if (data.success) setBotPaused(data.bot_paused);
    } catch (err) {
      console.error('Toggle bot error:', err);
    } finally {
      setTogglingBot(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !patientPhone) return;
    const msgText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;

    // Immediately show message in UI before API call
    setMessages(prev => [...prev, {
      id: tempId,
      channel: 'sms',
      message_type: 'direct_sms',
      message: msgText,
      direction: 'outbound',
      status: 'sending',
      source: `send-sms(${smsProvider})`,
      created_at: new Date().toISOString(),
    }]);
    setNewMessage('');
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: linkedPatientId || patientId,
          patient_name: displayName || patientName,
          to: patientPhone,
          message: msgText,
          message_type: 'direct_sms',
          provider: smsProvider,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Mark the optimistic message as failed
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        const details = data.details ? ` (${data.details})` : '';
        throw new Error((data.error || 'Failed to send') + details);
      }

      // Update optimistic message status to sent
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (templateText) => {
    const fullName = displayName || patientName || '';
    const firstName = fullName.split(' ')[0] || 'there';
    const lastName = fullName.split(' ').slice(1).join(' ') || '';
    const populated = templateText
      .replace(/\{\{name\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{last_name\}\}/g, lastName);
    setNewMessage(populated);
    setShowTemplates(false);
  };

  const handleFormatSMS = async () => {
    if (!newMessage.trim()) return;
    setFormatting(true);
    try {
      const res = await fetch('/api/sms/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: newMessage,
          recipientName: (displayName || patientName || '').split(' ')[0] || null,
        }),
      });
      const data = await res.json();
      if (data.formatted) {
        setNewMessage(data.formatted);
      }
    } catch (err) {
      console.error('SMS format error:', err);
    } finally {
      setFormatting(false);
    }
  };

  // ---- Send Forms ----
  const toggleForm = (formId) => {
    setSelectedForms(prev =>
      prev.includes(formId) ? prev.filter(f => f !== formId) : [...prev, formId]
    );
  };

  const handleSendForms = async () => {
    if (!selectedForms.length || !patientPhone) return;
    setSendingForms(true);
    setFormsResult(null);
    try {
      const res = await fetch('/api/send-forms-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: patientPhone,
          firstName: (displayName || patientName || '').split(' ')[0] || null,
          formIds: selectedForms,
          patientId: linkedPatientId || patientId || null,
          patientName: displayName || patientName || null,
          ghlContactId: ghlContactId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send forms');
      setFormsResult({ success: true, message: data.twoStep
        ? `Opt-in sent — forms deliver when patient replies YES`
        : `${data.formsSent} form(s) sent via SMS` });
      // Refresh messages to show the outbound SMS
      setTimeout(() => fetchMessages(), 1500);
    } catch (err) {
      setFormsResult({ success: false, message: err.message });
    } finally {
      setSendingForms(false);
    }
  };

  // ---- Log Visit ----


  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      timeZone: 'America/Los_Angeles',
    });
  };

  const formatDateKey = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Los_Angeles',
    });
  };

  // Filter messages by channel
  const filteredMessages = filter === 'all'
    ? messages
    : messages.filter(m => m.channel === filter);

  // Count by channel
  const smsCount = messages.filter(m => m.channel === 'sms').length;
  const emailCount = messages.filter(m => m.channel === 'email').length;
  const callCount = messages.filter(m => m.channel === 'call').length;

  // Group messages by date
  const groupedMessages = [];
  let lastDate = '';
  for (const msg of filteredMessages) {
    const msgDate = formatDateKey(msg.created_at);
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: 'date', date: formatDateLabel(msg.created_at), dateKey: msgDate });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: 'message', ...msg });
  }

  // Get a friendly label for message types
  const getMessageLabel = (msg) => {
    if (msg.channel === 'email') {
      return msg.subject || (msg.message_type || 'email').replace(/_/g, ' ');
    }
    const t = msg.message_type || '';
    if (t === 'direct_sms') return null;
    if (t === 'inbound_sms') return null;
    if (t === 'ghl_sms') return null;
    if (t === 'internal_note') return null; // handled by its own card style
    // Show automated message type labels
    const label = t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (label && label !== 'Message' && label !== 'Sms') return label;
    return null;
  };

  const isPhoneOnly = !linkedPatientId && patientPhone;
  const hasNeedsResponse = messages.some(m => m.needs_response);

  const clearNeedsResponse = async (note) => {
    const pid = linkedPatientId || patientId;
    if (!pid && !patientPhone) return;
    setClearingAction(true);
    try {
      const resp = await fetch('/api/admin/clear-needs-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: pid || null, phone: patientPhone || null, note: note || '' }),
      });
      const contentType = resp.headers.get('content-type') || '';
      if (!resp.ok || !contentType.includes('application/json')) {
        console.error('Clear needs_response failed:', resp.status);
        return;
      }
      const result = await resp.json();
      if (result.success) {
        // Update local message state to remove needs_response flags
        setMessages(prev => {
          const updated = prev.map(m => ({ ...m, needs_response: false }));
          // Add the internal note as a visible entry if one was provided
          if (note && result.noteId) {
            updated.push({
              id: result.noteId,
              channel: 'sms',
              message_type: 'internal_note',
              message: note,
              direction: 'outbound',
              source: 'internal_note',
              status: 'sent',
              created_at: new Date().toISOString(),
              needs_response: false,
            });
          }
          return updated;
        });
        setShowClearNote(false);
        setClearNote('');
        // Notify parent so conversation list updates without refresh
        if (onNeedsResponseCleared) onNeedsResponseCleared(linkedPatientId || patientId, patientPhone);
      }
    } catch (err) {
      console.error('Error clearing needs_response:', err);
    } finally {
      setClearingAction(false);
    }
  };

  const handleSaveName = async () => {
    const parts = editName.trim().split(/\s+/);
    if (parts.length < 2) return; // need first + last name
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    setSavingName(true);
    try {
      const res = await fetch('/api/admin/link-phone-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: patientPhone, firstName, lastName }),
      });
      const data = await res.json();
      if (data.success && data.patient) {
        setLinkedPatientId(data.patient.id);
        setDisplayName(data.patient.name);
        setEditingName(false);
        if (onPatientLinked) {
          onPatientLinked({
            id: data.patient.id,
            name: data.patient.name,
            phone: data.patient.phone || patientPhone,
          });
        }
      }
    } catch (err) {
      console.error('Error linking patient:', err);
    } finally {
      setSavingName(false);
    }
  };

  if (!patientId && !patientPhone) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>💬</div>
        <div style={styles.emptyText}>Select a patient to view conversation</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {onBack && (
            <button onClick={onBack} style={styles.backBtn} title="Back to list">
              ←
            </button>
          )}
          {onPrev && (
            <button onClick={onPrev} disabled={!hasPrev} style={{ ...styles.navBtn, opacity: hasPrev ? 1 : 0.3 }} title="Previous conversation">
              ‹
            </button>
          )}
          {onNext && (
            <button onClick={onNext} disabled={!hasNext} style={{ ...styles.navBtn, opacity: hasNext ? 1 : 0.3 }} title="Next conversation">
              ›
            </button>
          )}
          <div>
            {editingName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  ref={nameInputRef}
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  placeholder="First Last"
                  style={{ fontSize: 14, fontWeight: 600, border: '1px solid #d0d5dd', borderRadius: 6, padding: '4px 8px', width: 180, outline: 'none' }}
                  disabled={savingName}
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName || editName.trim().split(/\s+/).length < 2}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: editName.trim().split(/\s+/).length >= 2 ? '#059669' : '#e0e0e0', color: '#fff', cursor: editName.trim().split(/\s+/).length >= 2 ? 'pointer' : 'default', fontWeight: 600 }}
                >
                  {savingName ? '…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', color: '#666', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            ) : onBack && linkedPatientId ? (
              <a
                href={`/patients/${linkedPatientId}`}
                style={{ ...styles.headerName, color: '#2563eb', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                onMouseLeave={e => e.target.style.textDecoration = 'none'}
              >
                {displayName || 'Unknown'}
              </a>
            ) : isPhoneOnly ? (
              <div
                onClick={() => { setEditName(''); setEditingName(true); }}
                style={{ ...styles.headerName, cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center', gap: 6 }}
                title="Click to assign a patient name"
              >
                {displayName || patientPhone}
                <span style={{ fontSize: 10, color: '#999', fontWeight: 400 }}>✎ add name</span>
              </div>
            ) : (
              <div style={styles.headerName}>{displayName || 'Unknown'}</div>
            )}
            <div style={styles.headerPhone}>{patientPhone || 'No phone on file'}</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          {/* Channel filter pills */}
          <div style={styles.filterPills}>
            <button
              onClick={() => setFilter('all')}
              style={{
                ...styles.pill,
                ...(filter === 'all' ? styles.pillActive : {}),
              }}
            >
              All ({messages.length})
            </button>
            <button
              onClick={() => setFilter('sms')}
              style={{
                ...styles.pill,
                ...(filter === 'sms' ? styles.pillActive : {}),
              }}
            >
              💬 SMS ({smsCount})
            </button>
            {emailCount > 0 && (
              <button
                onClick={() => setFilter('email')}
                style={{
                  ...styles.pill,
                  ...(filter === 'email' ? styles.pillActive : {}),
                }}
              >
                📧 Email ({emailCount})
              </button>
            )}
            {callCount > 0 && (
              <button
                onClick={() => setFilter('call')}
                style={{
                  ...styles.pill,
                  ...(filter === 'call' ? styles.pillActive : {}),
                }}
              >
                📞 Calls ({callCount})
              </button>
            )}
          </div>
          {hasNeedsResponse && !showClearNote && (
            <button
              onClick={() => setShowClearNote(true)}
              style={styles.clearActionBtn}
              title="Mark as handled — no response needed"
            >
              ✓ Clear Action
            </button>
          )}
          {(linkedPatientId || patientId) && (
            <button
              onClick={toggleBot}
              disabled={togglingBot}
              style={{
                ...styles.actionBtn,
                background: botPaused ? '#fee2e2' : '#ecfdf5',
                color: botPaused ? '#dc2626' : '#059669',
                border: `1px solid ${botPaused ? '#fca5a5' : '#6ee7b7'}`,
              }}
              title={botPaused ? 'Bot is paused — click to resume auto-replies' : 'Bot is active — click to pause auto-replies'}
            >
              {botPaused ? '⏸ Bot Off' : '⚡ Bot On'}
            </button>
          )}
          <button
            onClick={() => { setShowForms(true); setFormsResult(null); setSelectedForms([]); }}
            style={styles.actionBtn}
            title="Send forms to this patient"
          >
            📋 Forms
          </button>
          <button
            onClick={() => setShowBooking(true)}
            style={styles.bookBtn}
            title="Book appointment for this patient"
          >
            📅 Book
          </button>
          <button
            onClick={openTaskModal}
            style={styles.actionBtn}
            title="Create a task for this patient"
          >
            ✅ Task
          </button>
          <button
            onClick={() => { fetchMessages(); }}
            style={styles.refreshBtn}
            title="Refresh messages"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Clear Action Note Bar */}
      {showClearNote && (
        <div style={styles.clearNoteBar}>
          <div style={styles.clearNoteLabel}>Why is no response needed?</div>
          <div style={styles.clearNoteQuickBtns}>
            {['Called in', 'Handled in person', 'Answered via email', 'No action needed'].map(q => (
              <button
                key={q}
                onClick={() => clearNeedsResponse(q)}
                disabled={clearingAction}
                style={styles.clearNoteQuickBtn}
              >
                {q}
              </button>
            ))}
          </div>
          <div style={styles.clearNoteInputRow}>
            <input
              value={clearNote}
              onChange={e => setClearNote(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && clearNote.trim()) clearNeedsResponse(clearNote.trim()); }}
              placeholder="Or type a custom reason and press Enter..."
              style={styles.clearNoteInput}
              autoFocus
            />
            <button
              onClick={() => clearNeedsResponse(clearNote.trim())}
              disabled={clearingAction || !clearNote.trim()}
              style={{
                ...styles.clearNoteSubmitBtn,
                opacity: clearNote.trim() ? 1 : 0.4,
              }}
            >
              {clearingAction ? '...' : 'Submit'}
            </button>
            <button
              onClick={() => { setShowClearNote(false); setClearNote(''); }}
              style={styles.clearNoteCancelBtn}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Inline Booking Modal */}
      {showBooking && (
        <div style={styles.bookingOverlay} {...overlayClickProps(() => setShowBooking(false))}>
          <div style={styles.bookingModal} onClick={e => e.stopPropagation()}>
            <div style={styles.bookingHeader}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Book Appointment — {displayName || patientName}</h3>
              <button onClick={() => setShowBooking(false)} style={styles.bookingClose}>×</button>
            </div>
            <div style={styles.bookingBody}>
              <CalendarView
                wizardOnly
                preselectedPatient={{
                  id: linkedPatientId || patientId,
                  name: displayName || patientName,
                  email: null,
                  phone: patientPhone,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Send Forms Modal */}
      {showForms && (
        <div style={styles.bookingOverlay} {...overlayClickProps(() => setShowForms(false))}>
          <div style={{ ...styles.bookingModal, maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.bookingHeader}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Send Forms — {(displayName || patientName || '').split(' ')[0]}</h3>
              <button onClick={() => setShowForms(false)} style={styles.bookingClose}>×</button>
            </div>
            <div style={{ padding: '16px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
              {FORM_OPTIONS.map(form => (
                <label key={form.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                  background: selectedForms.includes(form.id) ? '#f0f9ff' : '#fff',
                  border: selectedForms.includes(form.id) ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                  marginBottom: '6px', transition: 'all 0.15s',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedForms.includes(form.id)}
                    onChange={() => toggleForm(form.id)}
                    style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#111' }}>{form.name}</span>
                </label>
              ))}
              {formsResult && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', marginTop: '10px', fontSize: '13px',
                  background: formsResult.success ? '#f0fdf4' : '#fef2f2',
                  color: formsResult.success ? '#16a34a' : '#dc2626',
                  border: formsResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                }}>
                  {formsResult.message}
                </div>
              )}
              <button
                onClick={handleSendForms}
                disabled={!selectedForms.length || sendingForms}
                style={{
                  width: '100%', padding: '12px', marginTop: '12px',
                  background: selectedForms.length ? '#000' : '#e5e7eb',
                  color: selectedForms.length ? '#fff' : '#9ca3af',
                  border: 'none', borderRadius: '10px', fontSize: '14px',
                  fontWeight: 600, cursor: selectedForms.length ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                }}
              >
                {sendingForms ? 'Sending...' : `Send ${selectedForms.length || ''} Form${selectedForms.length !== 1 ? 's' : ''} via SMS`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div style={styles.bookingOverlay} {...overlayClickProps(() => setShowTaskModal(false))}>
          <div style={{ ...styles.bookingModal, maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.bookingHeader}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Create Task — {(displayName || patientName || '').split(' ')[0]}</h3>
              <button onClick={() => setShowTaskModal(false)} style={styles.bookingClose}>×</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '8px 12px', background: '#f0f9ff', borderRadius: '8px', fontSize: '13px', color: '#2563eb' }}>
                  Linked to: <strong>{displayName || patientName || 'Unknown'}</strong>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Task</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What needs to be done?"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Details (optional)</label>
                  <textarea
                    value={taskForm.description}
                    onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional context..."
                    rows={2}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Assign to</label>
                  <select
                    value={taskForm.assigned_to}
                    onChange={e => setTaskForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    required
                  >
                    <option value="">Select team member...</option>
                    {taskEmployees.filter(e => e.is_active !== false).map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={e => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Due Date</label>
                    <input
                      type="date"
                      value={taskForm.due_date}
                      onChange={e => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                {taskResult && (
                  <div style={{
                    padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
                    background: taskResult.success ? '#f0fdf4' : '#fef2f2',
                    color: taskResult.success ? '#16a34a' : '#dc2626',
                    border: taskResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  }}>
                    {taskResult.message}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!taskForm.title.trim() || !taskForm.assigned_to || creatingTask}
                  style={{
                    width: '100%', padding: '12px',
                    background: (taskForm.title.trim() && taskForm.assigned_to) ? '#000' : '#e5e7eb',
                    color: (taskForm.title.trim() && taskForm.assigned_to) ? '#fff' : '#9ca3af',
                    border: 'none', borderRadius: '10px', fontSize: '14px',
                    fontWeight: 600, cursor: (taskForm.title.trim() && taskForm.assigned_to) ? 'pointer' : 'default',
                    fontFamily: 'inherit',
                  }}
                >
                  {creatingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={styles.messagesContainer} ref={messagesContainerRef}>
        {loading ? (
          <div style={styles.loadingMsg}>Loading conversation...</div>
        ) : groupedMessages.length === 0 ? (
          <div style={styles.noMessages}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            <div>No messages yet</div>
            {filter !== 'all' && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#aaa' }}>
                Try switching to &quot;All&quot; to see all communications
              </div>
            )}
          </div>
        ) : (
          <>
          {/* Load Earlier Messages */}
          {hasMore && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <button
                onClick={loadEarlierMessages}
                disabled={loadingMore}
                style={{
                  background: 'none', border: '1px solid #e5e7eb', borderRadius: '20px',
                  padding: '6px 18px', fontSize: '13px', color: '#2563eb', cursor: 'pointer',
                  fontWeight: 500, opacity: loadingMore ? 0.6 : 1,
                }}
              >
                {loadingMore ? 'Loading...' : `Load Earlier Messages (showing ${messages.length} of ${totalMessages})`}
              </button>
            </div>
          )}
          {groupedMessages.map((item, idx) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${item.dateKey}-${idx}`} style={styles.dateDivider}>
                  <span style={styles.dateLabel}>{item.date}</span>
                </div>
              );
            }

            const isOutbound = item.direction !== 'inbound' && item.message_type !== 'inbound_sms';
            const isEmail = item.channel === 'email';
            const isCall = item.channel === 'call';
            const msgLabel = getMessageLabel(item);
            const isGHL = item.source === 'ghl'; // legacy GHL messages still show badge
            // Automated outbound = cron jobs, webhook auto-replies, etc. (not staff-sent)
            const isAutomated = isOutbound && item.source && !item.source.startsWith('send-sms') && item.source !== 'staff_app' && item.source !== 'internal_note';
            const isInboundNeedsResponse = !isOutbound && item.needs_response;
            const isInternalNote = item.message_type === 'internal_note' || item.source === 'internal_note';

            // Internal notes — centered card with distinct style
            if (isInternalNote) {
              return (
                <div key={item.id || idx} style={styles.internalNoteCard}>
                  <span style={styles.internalNoteIcon}>📝</span>
                  <span style={styles.internalNoteText}>{item.message}</span>
                  <span style={styles.internalNoteTime}>{formatTime(item.created_at)}</span>
                </div>
              );
            }

            // Call events — centered timeline card
            if (isCall) {
              const isMissed = item.status === 'missed' || item.status === 'no-answer';
              return (
                <div key={item.id || idx} style={styles.callEvent} onClick={() => setSelectedMessage(item)}>
                  <span style={{ ...styles.callIcon, color: isMissed ? '#ef4444' : '#6b7280' }}>
                    {isMissed ? '📵' : '📞'}
                  </span>
                  <span style={{ ...styles.callText, color: isMissed ? '#ef4444' : '#6b7280' }}>
                    {item.message || 'Call'}
                  </span>
                  <span style={styles.callTime}>{formatTime(item.created_at)}</span>
                </div>
              );
            }

            // Email messages get a special card style
            if (isEmail) {
              return (
                <div key={item.id || idx} style={styles.emailCard} onClick={() => setSelectedMessage(item)}>
                  <div style={styles.emailHeader}>
                    <span style={styles.emailIcon}>📧</span>
                    <span style={styles.emailSubject}>{item.subject || 'Email'}</span>
                    <span style={styles.emailTime}>{formatTime(item.created_at)}</span>
                  </div>
                  {msgLabel && <div style={styles.emailType}>{msgLabel}</div>}
                  <div style={styles.emailBody}>
                    {(item.message || '').replace(/<[^>]*>/g, '').substring(0, 300)}
                    {(item.message || '').length > 300 ? '...' : ''}
                  </div>
                  <div style={styles.emailMeta}>
                    {isOutbound ? 'Sent' : 'Received'}
                    {item.recipient && ` to ${item.recipient}`}
                    {item.status && item.status !== 'sent' && ` · ${item.status}`}
                  </div>
                </div>
              );
            }

            // SMS bubble style
            return (
              <div key={item.id || idx} style={{
                ...styles.messageBubbleRow,
                justifyContent: isOutbound ? 'flex-end' : 'flex-start',
              }}>
                <div
                  onClick={() => setSelectedMessage(item)}
                  style={{
                    ...styles.bubble,
                    ...(isOutbound
                      ? (isAutomated ? styles.automatedBubble : styles.outboundBubble)
                      : (isInboundNeedsResponse ? styles.inboundNeedsResponseBubble : styles.inboundBubble)),
                    cursor: 'pointer',
                  }}
                >
                  {/* Automated badge or needs-response indicator */}
                  {isAutomated && (
                    <div style={styles.automatedLabel}>Auto</div>
                  )}
                  {isInboundNeedsResponse && (
                    <div style={styles.needsResponseLabel}>Needs Response</div>
                  )}
                  {msgLabel && (
                    <div style={{
                      ...styles.bubbleLabel,
                      color: isAutomated ? 'rgba(100,116,139,0.7)' : isOutbound ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)',
                    }}>
                      {msgLabel}
                    </div>
                  )}
                  <div style={{
                    ...styles.bubbleText,
                    color: isAutomated ? '#64748b' : undefined,
                  }}>{item.message || ''}</div>
                  <div style={{
                    ...styles.bubbleMeta,
                    textAlign: isOutbound ? 'right' : 'left',
                  }}>
                    {formatTime(item.created_at)}
                    {isGHL && <span style={styles.ghlBadge}>GHL</span>}
                    {isOutbound && item.status && (
                      <span style={{
                        ...styles.statusDot,
                        ...(item.status === 'undelivered' ? { color: '#fbbf24', opacity: 1 } : {}),
                        ...(item.status === 'error' ? { color: '#f87171', opacity: 1 } : {}),
                        ...(item.status === 'delivered' ? { opacity: 1 } : {}),
                      }}>
                        {item.status === 'delivered' ? ' ✓✓' :
                         item.status === 'sent' ? ' ✓' :
                         item.status === 'queued' || item.status === 'sending' ? ' ○' :
                         item.status === 'undelivered' ? ' ⚠' :
                         item.status === 'error' ? ' ✕' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </>
        )}
      </div>

      {/* Message detail modal */}
      {selectedMessage && (
        <div style={styles.modalOverlay} {...overlayClickProps(() => setSelectedMessage(null))}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <span style={{ fontSize: '16px' }}>
                  {selectedMessage.channel === 'email' ? '📧' : selectedMessage.channel === 'call' ? '📞' : '💬'}
                </span>
                <span style={styles.modalTitle}>
                  {selectedMessage.channel === 'email'
                    ? (selectedMessage.subject || 'Email')
                    : selectedMessage.channel === 'call'
                      ? 'Phone Call'
                      : 'SMS Message'}
                </span>
              </div>
              <button onClick={() => setSelectedMessage(null)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalMeta}>
              <div style={styles.modalMetaRow}>
                <span style={styles.modalMetaLabel}>
                  {selectedMessage.direction === 'inbound' || selectedMessage.message_type === 'inbound_sms' ? 'From' : 'To'}:
                </span>
                <span>{selectedMessage.recipient || patientPhone || '—'}</span>
              </div>
              <div style={styles.modalMetaRow}>
                <span style={styles.modalMetaLabel}>Date:</span>
                <span>
                  {selectedMessage.created_at
                    ? new Date(selectedMessage.created_at).toLocaleString('en-US', {
                        timeZone: 'America/Los_Angeles',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—'}
                </span>
              </div>
              <div style={styles.modalMetaRow}>
                <span style={styles.modalMetaLabel}>Status:</span>
                <span style={{
                  ...(selectedMessage.status === 'delivered' || selectedMessage.status === 'completed' ? { color: '#16a34a' } : {}),
                  ...(selectedMessage.status === 'undelivered' ? { color: '#d97706' } : {}),
                  ...(selectedMessage.status === 'error' ? { color: '#dc2626' } : {}),
                  ...(selectedMessage.status === 'missed' ? { color: '#dc2626' } : {}),
                }}>
                  {selectedMessage.status === 'delivered' ? '✓✓ Delivered' :
                   selectedMessage.status === 'sent' ? '✓ Sent' :
                   selectedMessage.status === 'queued' ? '○ Queued' :
                   selectedMessage.status === 'sending' ? '○ Sending' :
                   selectedMessage.status === 'undelivered' ? '⚠ Not Delivered' :
                   selectedMessage.status === 'error' ? '✕ Error' :
                   selectedMessage.status === 'received' ? '✓ Received' :
                   selectedMessage.status === 'completed' ? '✓ Completed' :
                   selectedMessage.status === 'missed' ? '✕ Missed' :
                   selectedMessage.status || '—'}
                </span>
              </div>
              {selectedMessage.error_message && (
                <div style={styles.modalMetaRow}>
                  <span style={styles.modalMetaLabel}>Error:</span>
                  <span style={{ color: '#dc2626' }}>{selectedMessage.error_message}</span>
                </div>
              )}
              {selectedMessage.source && (
                <div style={styles.modalMetaRow}>
                  <span style={styles.modalMetaLabel}>Source:</span>
                  <span style={{ color: '#9ca3af' }}>{selectedMessage.source}</span>
                </div>
              )}
            </div>
            <div style={styles.modalBody}>
              {selectedMessage.channel === 'email' ? (
                <div
                  style={styles.modalEmailContent}
                  dangerouslySetInnerHTML={{ __html: selectedMessage.message || '' }}
                />
              ) : (
                <div style={styles.modalSmsContent}>
                  {selectedMessage.message || ''}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates panel */}
      {showTemplates && (
        <TemplateMessages
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Error */}
      {error && (
        <div style={styles.error}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={styles.errorDismiss}>✕</button>
        </div>
      )}

      {/* Provider toggle */}
      <div style={styles.providerToggle}>
        <span style={styles.providerLabel}>Send via:</span>
        <button
          onClick={() => setSmsProvider('blooio')}
          style={{
            ...styles.providerBtn,
            ...(smsProvider === 'blooio' ? styles.providerBtnActive : {}),
          }}
        >
          Blooio
        </button>
        <button
          onClick={() => setSmsProvider('twilio')}
          style={{
            ...styles.providerBtn,
            ...(smsProvider === 'twilio' ? styles.providerBtnActive : {}),
          }}
        >
          949 Number
        </button>
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          style={{
            ...styles.templateBtn,
            background: showTemplates ? '#f3f4f6' : 'transparent',
          }}
          title="Message templates"
        >
          ⚡
        </button>
        <button
          onClick={handleFormatSMS}
          disabled={!newMessage.trim() || formatting}
          style={{
            ...styles.templateBtn,
            color: formatting ? '#9ca3af' : '#7c3aed',
            opacity: !newMessage.trim() || formatting ? 0.4 : 1,
          }}
          title="AI Format"
        >
          {formatting ? '...' : '✨'}
        </button>
        <textarea
          ref={el => {
            if (el) {
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 200) + 'px';
            }
          }}
          value={newMessage}
          onChange={e => {
            setNewMessage(e.target.value);
            const el = e.target;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 200) + 'px';
          }}
          onKeyDown={handleKeyDown}
          placeholder={patientPhone ? 'Type a message... (Enter to send)' : 'No phone number on file'}
          style={styles.input}
          rows={1}
          disabled={!patientPhone}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending || !patientPhone}
          style={{
            ...styles.sendBtn,
            opacity: !newMessage.trim() || sending || !patientPhone ? 0.4 : 1,
          }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#fff',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa',
    gap: '12px',
    flexWrap: 'wrap',
  },
  headerLeft: {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#333',
    flexShrink: 0,
    lineHeight: 1,
  },
  navBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '6px 8px',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#333',
    flexShrink: 0,
    lineHeight: 1,
    fontWeight: '600',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerName: {
    fontSize: '15px',
    fontWeight: '600',
  },
  headerPhone: {
    fontSize: '12px',
    color: '#999',
  },
  filterPills: {
    display: 'flex',
    gap: '4px',
  },
  pill: {
    padding: '4px 10px',
    border: '1px solid #e5e5e5',
    borderRadius: '14px',
    background: '#fff',
    fontSize: '11px',
    color: '#666',
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  },
  pillActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000',
  },
  clearActionBtn: {
    background: '#fff7ed',
    color: '#ea580c',
    border: '1px solid #fb923c',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
    fontFamily: 'inherit',
  },
  actionBtn: {
    background: '#f0f9ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
    fontFamily: 'inherit',
  },
  bookBtn: {
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
    fontFamily: 'inherit',
  },
  bookingOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingModal: {
    background: '#fff',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '560px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  bookingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  bookingClose: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#666',
    padding: '0 4px',
  },
  bookingBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
  },
  refreshBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#666',
    flexShrink: 0,
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    background: '#f9fafb',
  },
  loadingMsg: {
    textAlign: 'center',
    color: '#999',
    padding: '40px',
  },
  noMessages: {
    textAlign: 'center',
    color: '#999',
    padding: '60px 20px',
    fontSize: '14px',
  },
  dateDivider: {
    textAlign: 'center',
    margin: '16px 0 8px',
  },
  dateLabel: {
    padding: '4px 12px',
    background: '#e5e7eb',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '500',
  },
  messageBubbleRow: {
    display: 'flex',
    marginBottom: '8px',
  },
  bubble: {
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: '16px',
    fontSize: '14px',
    lineHeight: '1.4',
  },
  outboundBubble: {
    background: '#000',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  automatedBubble: {
    background: '#f1f5f9',
    color: '#64748b',
    borderBottomRightRadius: '4px',
    border: '1px dashed #cbd5e1',
  },
  inboundBubble: {
    background: '#e5e7eb',
    color: '#111',
    borderBottomLeftRadius: '4px',
  },
  inboundNeedsResponseBubble: {
    background: '#fff7ed',
    color: '#111',
    borderBottomLeftRadius: '4px',
    border: '1px solid #fb923c',
  },
  automatedLabel: {
    fontSize: '9px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#94a3b8',
    marginBottom: '3px',
  },
  needsResponseLabel: {
    fontSize: '9px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#ea580c',
    marginBottom: '3px',
  },
  bubbleLabel: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    marginBottom: '4px',
  },
  bubbleText: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  bubbleMeta: {
    fontSize: '10px',
    marginTop: '4px',
    opacity: 0.7,
  },
  ghlBadge: {
    marginLeft: '4px',
    padding: '1px 4px',
    borderRadius: '3px',
    fontSize: '8px',
    fontWeight: '600',
    background: 'rgba(255,255,255,0.2)',
    letterSpacing: '0.5px',
  },
  statusDot: {
    fontSize: '10px',
  },
  // Internal note style (centered card)
  internalNoteCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 16px',
    marginBottom: '8px',
    background: '#fffbeb',
    border: '1px dashed #f59e0b',
    borderRadius: '8px',
    marginLeft: '40px',
    marginRight: '40px',
  },
  internalNoteIcon: {
    fontSize: '14px',
  },
  internalNoteText: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#92400e',
    fontStyle: 'italic',
  },
  internalNoteTime: {
    fontSize: '11px',
    color: '#b45309',
    flexShrink: 0,
  },
  // Clear note bar
  clearNoteBar: {
    padding: '12px 16px',
    background: '#fff7ed',
    borderBottom: '1px solid #fb923c',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  clearNoteLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#9a3412',
  },
  clearNoteQuickBtns: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  clearNoteQuickBtn: {
    padding: '4px 10px',
    border: '1px solid #fed7aa',
    borderRadius: '14px',
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#9a3412',
    fontFamily: 'inherit',
  },
  clearNoteInputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  clearNoteInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #fed7aa',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    background: '#fff',
  },
  clearNoteSubmitBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: '#ea580c',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  clearNoteCancelBtn: {
    padding: '8px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    background: '#fff',
    color: '#666',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  // Call event style (centered timeline event)
  callEvent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 16px',
    marginBottom: '8px',
    cursor: 'pointer',
  },
  callIcon: {
    fontSize: '14px',
  },
  callText: {
    fontSize: '13px',
    fontWeight: '500',
  },
  callTime: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  // Email card style
  emailCard: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  emailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  emailIcon: {
    fontSize: '14px',
  },
  emailSubject: {
    flex: 1,
    fontWeight: '500',
    fontSize: '13px',
    color: '#111',
  },
  emailTime: {
    fontSize: '11px',
    color: '#9ca3af',
    flexShrink: 0,
  },
  emailType: {
    fontSize: '10px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    marginBottom: '6px',
  },
  emailBody: {
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '1.4',
    maxHeight: '60px',
    overflow: 'hidden',
  },
  emailMeta: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '6px',
  },
  error: {
    padding: '8px 16px',
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: '13px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorDismiss: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px 6px',
  },
  providerToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 16px',
    borderTop: '1px solid #f0f0f0',
    background: '#fafafa',
  },
  providerLabel: {
    fontSize: '12px',
    color: '#999',
    marginRight: '4px',
  },
  providerBtn: {
    padding: '3px 10px',
    fontSize: '12px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    background: '#fff',
    color: '#666',
    cursor: 'pointer',
    fontWeight: '500',
  },
  providerBtnActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000',
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid #e5e5e5',
    background: '#fff',
    alignItems: 'flex-end',
  },
  templateBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#666',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '20px',
    maxHeight: '200px',
    overflow: 'auto',
  },
  sendBtn: {
    padding: '10px 18px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    flexShrink: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '400px',
    color: '#999',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '15px',
  },
  // Message detail modal
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
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '14px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#111',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#999',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    flexShrink: 0,
  },
  modalMeta: {
    padding: '12px 20px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  modalMetaRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    color: '#374151',
  },
  modalMetaLabel: {
    color: '#9ca3af',
    fontWeight: '500',
    minWidth: '50px',
  },
  modalBody: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  },
  modalEmailContent: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#111827',
    wordBreak: 'break-word',
  },
  modalSmsContent: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#111827',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};
