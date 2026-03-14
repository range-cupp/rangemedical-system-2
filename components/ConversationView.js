// components/ConversationView.js
// Chat-style SMS/Email conversation UI for patient communications
// Fetches from local comms_log
// Range Medical System V2

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import TemplateMessages from './TemplateMessages';

const CalendarView = dynamic(() => import('./CalendarView'), { ssr: false });

export default function ConversationView({ patientId, patientName, patientPhone, ghlContactId, onBack }) {
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
  const messagesContainerRef = useRef(null);
  const shouldScrollRef = useRef(false);

  useEffect(() => {
    if (patientId || patientPhone) {
      shouldScrollRef.current = true;
      fetchMessages();

      // Mark this patient's messages as read
      if (patientId) {
        fetch('/api/admin/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId }),
        }).catch(() => {}); // non-blocking, best-effort
      }
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

  const fetchMessages = async () => {
    try {
      setLoading(true);

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
      setMessages(sorted);
      setHasMore(data.hasMore || false);
      setTotalMessages(data.total || localLogs.length);
      setLoading(false);

      // Sync Twilio call history in background (non-blocking)
      if (patientPhone && !callsSynced) {
        syncTwilioCalls();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setLoading(false);
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
          patient_id: patientId,
          patient_name: patientName,
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
        throw new Error(data.error || 'Failed to send');
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
    const fullName = patientName || '';
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
          recipientName: (patientName || '').split(' ')[0] || null,
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
    // Show automated message type labels
    const label = t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (label && label !== 'Message' && label !== 'Sms') return label;
    return null;
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
          <div>
            {onBack && patientId ? (
              <a
                href={`/patients/${patientId}`}
                style={{ ...styles.headerName, color: '#2563eb', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                onMouseLeave={e => e.target.style.textDecoration = 'none'}
              >
                {patientName || 'Unknown'}
              </a>
            ) : (
              <div style={styles.headerName}>{patientName || 'Unknown'}</div>
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
          <button
            onClick={() => setShowBooking(true)}
            style={styles.bookBtn}
            title="Book appointment for this patient"
          >
            📅 Book
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

      {/* Inline Booking Modal */}
      {showBooking && (
        <div style={styles.bookingOverlay} onClick={() => setShowBooking(false)}>
          <div style={styles.bookingModal} onClick={e => e.stopPropagation()}>
            <div style={styles.bookingHeader}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Book Appointment — {patientName}</h3>
              <button onClick={() => setShowBooking(false)} style={styles.bookingClose}>×</button>
            </div>
            <div style={styles.bookingBody}>
              <CalendarView
                wizardOnly
                preselectedPatient={{
                  id: patientId,
                  name: patientName,
                  email: null,
                  phone: patientPhone,
                }}
              />
            </div>
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
                    ...(isOutbound ? styles.outboundBubble : styles.inboundBubble),
                    cursor: 'pointer',
                  }}
                >
                  {msgLabel && (
                    <div style={{
                      ...styles.bubbleLabel,
                      color: isOutbound ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)',
                    }}>
                      {msgLabel}
                    </div>
                  )}
                  <div style={styles.bubbleText}>{item.message || ''}</div>
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
        <div style={styles.modalOverlay} onClick={() => setSelectedMessage(null)}>
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
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
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
    maxWidth: '600px',
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
  inboundBubble: {
    background: '#e5e7eb',
    color: '#111',
    borderBottomLeftRadius: '4px',
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
    resize: 'none',
    minHeight: '20px',
    maxHeight: '80px',
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
