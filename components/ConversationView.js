// components/ConversationView.js
// Chat-style SMS conversation UI for patient communications
// Range Medical System V2

import { useState, useEffect, useRef } from 'react';
import TemplateMessages from './TemplateMessages';

export default function ConversationView({ patientId, patientName, patientPhone }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (patientId) fetchMessages();
  }, [patientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/admin/comms-log?patient_id=${patientId}&channel=sms&limit=100`);
      const data = await res.json();
      const logs = data.logs || data.comms || [];
      // Sort oldest first for conversation view
      setMessages(logs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
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
        message: newMessage.trim(),
        direction: 'outbound',
        status: 'sent',
        created_at: new Date().toISOString(),
        source: 'twilio/send-sms',
      }]);

      setNewMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (templateText) => {
    // Replace {{name}} placeholder with patient first name
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Los_Angeles',
    });
  };

  // Group messages by date
  const groupedMessages = [];
  let lastDate = '';
  for (const msg of messages) {
    const msgDate = formatDate(msg.created_at);
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: 'date', date: msgDate });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: 'message', ...msg });
  }

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
        <div>
          <div style={styles.headerName}>{patientName || 'Unknown'}</div>
          <div style={styles.headerPhone}>{patientPhone || 'No phone'}</div>
        </div>
        <button
          onClick={fetchMessages}
          style={styles.refreshBtn}
          title="Refresh messages"
        >
          ↻
        </button>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {loading ? (
          <div style={styles.loadingMsg}>Loading conversation...</div>
        ) : groupedMessages.length === 0 ? (
          <div style={styles.noMessages}>No messages yet</div>
        ) : (
          groupedMessages.map((item, idx) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${idx}`} style={styles.dateDivider}>
                  <span style={styles.dateLabel}>{item.date}</span>
                </div>
              );
            }

            const isOutbound = item.direction !== 'inbound' && item.message_type !== 'inbound_sms';
            return (
              <div key={item.id || idx} style={{
                ...styles.messageBubbleRow,
                justifyContent: isOutbound ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  ...styles.bubble,
                  ...(isOutbound ? styles.outboundBubble : styles.inboundBubble),
                }}>
                  <div style={styles.bubbleText}>{item.message}</div>
                  <div style={{
                    ...styles.bubbleMeta,
                    textAlign: isOutbound ? 'right' : 'left',
                  }}>
                    {formatTime(item.created_at)}
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
        <div style={styles.error}>{error}</div>
      )}

      {/* Input */}
      <div style={styles.inputArea}>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          style={styles.templateBtn}
          title="Message templates"
        >
          ⚡
        </button>
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={patientPhone ? 'Type a message...' : 'No phone number on file'}
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
    minHeight: '500px',
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
  },
  headerName: {
    fontSize: '15px',
    fontWeight: '600',
  },
  headerPhone: {
    fontSize: '12px',
    color: '#999',
  },
  refreshBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#666',
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
    padding: '40px',
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
  bubbleText: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  bubbleMeta: {
    fontSize: '10px',
    marginTop: '4px',
    opacity: 0.7,
  },
  statusDot: {
    fontSize: '10px',
  },
  error: {
    padding: '8px 16px',
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: '13px',
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
