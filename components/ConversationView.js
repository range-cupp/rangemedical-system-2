// components/ConversationView.js
// Chat-style SMS/Email conversation UI for patient communications
// Fetches from local comms_log + GHL conversation history
// Range Medical System V2

import { useState, useEffect, useRef, useCallback } from 'react';
import TemplateMessages from './TemplateMessages';

export default function ConversationView({ patientId, patientName, patientPhone, ghlContactId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'sms' | 'email'
  const [ghlLoading, setGhlLoading] = useState(false);
  const [ghlLoaded, setGhlLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (patientId) fetchMessages();
  }, [patientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, filter]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);

      // Fetch local comms_log
      const res = await fetch(`/api/patients/${patientId}/comms?limit=200`);
      const data = await res.json();
      const localLogs = data.comms || [];

      // Sort oldest first for conversation view
      const sorted = localLogs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(sorted);

      // Also fetch GHL history if contact ID available
      if (ghlContactId && !ghlLoaded) {
        fetchGHLMessages(sorted);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGHLMessages = async (localMessages) => {
    if (!ghlContactId) return;
    setGhlLoading(true);

    try {
      const res = await fetch(`/api/ghl/conversations?contact_id=${ghlContactId}`);
      const data = await res.json();
      const ghlMessages = data.messages || [];

      if (ghlMessages.length === 0) {
        setGhlLoaded(true);
        setGhlLoading(false);
        return;
      }

      // Merge: dedupe by checking for messages within 60 seconds with similar content
      const existingTimes = new Set(
        localMessages.map(m => {
          const t = new Date(m.created_at).getTime();
          return `${Math.floor(t / 60000)}_${(m.message || '').substring(0, 30).toLowerCase()}`;
        })
      );

      const newMessages = ghlMessages.filter(gm => {
        const t = new Date(gm.created_at).getTime();
        const key = `${Math.floor(t / 60000)}_${(gm.message || '').substring(0, 30).toLowerCase()}`;
        return !existingTimes.has(key);
      });

      if (newMessages.length > 0) {
        setMessages(prev => {
          const merged = [...prev, ...newMessages];
          merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          return merged;
        });
      }

      setGhlLoaded(true);
    } catch (err) {
      console.error('Error fetching GHL messages:', err);
    } finally {
      setGhlLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !patientPhone) return;
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
          message: newMessage.trim(),
          message_type: 'direct_sms',
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send');

      // Add optimistic message to UI
      setMessages(prev => [...prev, {
        id: Date.now(),
        channel: 'sms',
        message_type: 'direct_sms',
        message: newMessage.trim(),
        direction: 'outbound',
        status: 'sent',
        source: 'twilio/send-sms',
        created_at: new Date().toISOString(),
      }]);

      setNewMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (templateText) => {
    const firstName = (patientName || '').split(' ')[0] || 'there';
    const populated = templateText.replace(/\{\{name\}\}/g, firstName);
    setNewMessage(populated);
    setShowTemplates(false);
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

  if (!patientId) {
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
          <div style={styles.headerName}>{patientName || 'Unknown'}</div>
          <div style={styles.headerPhone}>{patientPhone || 'No phone on file'}</div>
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
          </div>
          <button
            onClick={() => { fetchMessages(); }}
            style={styles.refreshBtn}
            title="Refresh messages"
          >
            ↻
          </button>
        </div>
      </div>

      {/* GHL sync indicator */}
      {ghlLoading && (
        <div style={styles.syncBanner}>
          Syncing messages from Go High Level...
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
          groupedMessages.map((item, idx) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${item.dateKey}-${idx}`} style={styles.dateDivider}>
                  <span style={styles.dateLabel}>{item.date}</span>
                </div>
              );
            }

            const isOutbound = item.direction !== 'inbound' && item.message_type !== 'inbound_sms';
            const isEmail = item.channel === 'email';
            const msgLabel = getMessageLabel(item);
            const isGHL = item.source === 'ghl';

            // Email messages get a special card style
            if (isEmail) {
              return (
                <div key={item.id || idx} style={styles.emailCard}>
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
                <div style={{
                  ...styles.bubble,
                  ...(isOutbound ? styles.outboundBubble : styles.inboundBubble),
                }}>
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
                      <span style={styles.statusDot}>
                        {item.status === 'sent' ? ' ✓' : item.status === 'error' ? ' ✕' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

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
    height: '600px',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
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
  syncBanner: {
    padding: '6px 16px',
    background: '#fffbeb',
    borderBottom: '1px solid #fde68a',
    fontSize: '12px',
    color: '#92400e',
    textAlign: 'center',
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
  // Email card style
  emailCard: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '8px',
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
};
