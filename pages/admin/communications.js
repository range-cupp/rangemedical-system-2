// /pages/admin/communications.js
// Communications hub - SMS conversations, call history, and activity log
// Range Medical System V2

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '../../components/AdminLayout';

const ConversationView = dynamic(() => import('../../components/ConversationView'), { ssr: false });

export default function CommunicationsPage() {
  const [tab, setTab] = useState('conversations');
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recentComms, setRecentComms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commsLoading, setCommsLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedComm, setSelectedComm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PATIENTS_PER_PAGE = 20;
  const searchTimeout = useRef(null);

  // Call history state
  const [calls, setCalls] = useState([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [callsPage, setCallsPage] = useState(0);
  const [callsLoaded, setCallsLoaded] = useState(false);

  useEffect(() => {
    // Sync recent inbound messages from GHL first, then load patient list
    syncRecentGHL().then(() => {
      fetchRecentPatients();
    });
    fetchComms();
  }, []);

  // Fetch calls when Calls tab is first selected
  useEffect(() => {
    if (tab === 'calls' && !callsLoaded) {
      fetchCalls(0);
    }
  }, [tab]);

  // Sync recent inbound messages from GHL to catch anything the webhook missed
  const syncRecentGHL = async () => {
    try {
      await fetch('/api/ghl/sync-recent-inbound', { method: 'POST' });
    } catch (err) {
      console.error('GHL sync error:', err);
    }
  };

  // Fetch patients who have recent SMS activity
  const fetchRecentPatients = async () => {
    try {
      const res = await fetch('/api/admin/comms-log?channel=sms&limit=200');
      const data = await res.json();
      const logs = data.logs || data.comms || [];

      // Group by patient, get most recent message per patient
      // Also track unread count per patient (inbound + read_at IS NULL)
      const patientMap = {};
      const unreadCounts = {};
      for (const log of logs) {
        const key = log.patient_id || (log.ghl_contact_id ? `ghl_${log.ghl_contact_id}` : null);
        if (!key) continue;

        // Count unread inbound messages per patient
        if (log.direction === 'inbound' && !log.read_at) {
          unreadCounts[key] = (unreadCounts[key] || 0) + 1;
        }

        if (!patientMap[key] || new Date(log.created_at) > new Date(patientMap[key].lastMessage)) {
          patientMap[key] = {
            id: log.patient_id || null,
            ghl_contact_id: log.ghl_contact_id || null,
            name: log.patient_name || log.recipient || 'Unknown',
            lastMessage: log.created_at,
            lastPreview: (log.message || '').substring(0, 80),
            direction: log.direction || (log.message_type === 'inbound_sms' ? 'inbound' : 'outbound'),
            recipient: log.recipient || null,
          };
        }
      }

      // Add unread counts to patient objects
      for (const key of Object.keys(patientMap)) {
        patientMap[key].unreadCount = unreadCounts[key] || 0;
      }

      // Sort: patients with unread messages first, then by most recent
      const sorted = Object.values(patientMap).sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        return new Date(b.lastMessage) - new Date(a.lastMessage);
      });

      setPatients(sorted);
    } catch (err) {
      console.error('Error fetching recent patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all recent comms for activity log
  const fetchComms = async () => {
    try {
      const res = await fetch('/api/admin/comms-log?limit=100');
      const data = await res.json();
      setRecentComms(data.logs || data.comms || []);
    } catch (err) {
      console.error('Error fetching comms:', err);
    } finally {
      setCommsLoading(false);
    }
  };

  // Fetch call history from Twilio
  const fetchCalls = async (page) => {
    setCallsLoading(true);
    try {
      const res = await fetch(`/api/twilio/calls?page=${page}&limit=20`);
      const data = await res.json();
      setCalls(data.calls || []);
      setCallsPage(page);
      setCallsLoaded(true);
    } catch (err) {
      console.error('Error fetching calls:', err);
    } finally {
      setCallsLoading(false);
    }
  };

  // Search patients for new conversation
  const searchPatients = async (q) => {
    if (!q || q.length < 2) return;
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const results = data.patients || data || [];

      const existingIds = new Set(patients.map(p => p.id));
      const newPatients = results
        .filter(p => !existingIds.has(p.id))
        .map(p => ({
          id: p.id,
          name: p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name,
          phone: p.phone,
          lastMessage: null,
          lastPreview: 'No messages yet',
          isSearchResult: true,
        }));

      if (newPatients.length > 0) {
        setPatients(prev => [...newPatients, ...prev]);
      }
    } catch (err) {
      console.error('Patient search error:', err);
    }
  };

  const handleSearchChange = (val) => {
    setPatientSearch(val);
    setCurrentPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchPatients(val), 400);
  };

  const selectPatient = async (p) => {
    const savedScrollY = window.scrollY;
    const restoreScroll = () => {
      if (window.scrollY !== savedScrollY) window.scrollTo(0, savedScrollY);
    };

    // Mark this patient's messages as read
    if (p.id && p.unreadCount > 0) {
      fetch('/api/admin/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: p.id }),
      }).catch(() => {}); // non-blocking

      // Update local state to clear unread indicator
      setPatients(prev => prev.map(pt =>
        pt.id === p.id ? { ...pt, unreadCount: 0 } : pt
      ));
    }

    if (p.id) {
      try {
        const res = await fetch(`/api/patients/${p.id}`);
        const data = await res.json();
        const patient = data.patient || data;
        setSelectedPatient({
          ...p,
          phone: patient.phone || p.phone,
          ghl_contact_id: patient.ghl_contact_id || p.ghl_contact_id,
          name: patient.first_name && patient.last_name
            ? `${patient.first_name} ${patient.last_name}`
            : patient.name || p.name,
        });
        requestAnimationFrame(restoreScroll);
      } catch (err) {
        setSelectedPatient(p);
        requestAnimationFrame(restoreScroll);
      }
    } else {
      setSelectedPatient(p);
      requestAnimationFrame(restoreScroll);
    }
  };

  const handleBack = () => {
    setSelectedPatient(null);
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHrs < 24) return `${diffHrs}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const getCallStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return { background: '#dcfce7', color: '#166534' };
      case 'no-answer':
        return { background: '#fef9c3', color: '#854d0e' };
      case 'busy':
        return { background: '#ffedd5', color: '#9a3412' };
      case 'failed':
      case 'canceled':
        return { background: '#fee2e2', color: '#dc2626' };
      default:
        return { background: '#f0f0f0', color: '#666' };
    }
  };

  // Filter patients by search
  const allFilteredPatients = patientSearch
    ? patients.filter(p => (p.name || '').toLowerCase().includes(patientSearch.toLowerCase()))
    : patients;

  // Paginate
  const totalPages = Math.ceil(allFilteredPatients.length / PATIENTS_PER_PAGE);
  const paginatedPatients = allFilteredPatients.slice(
    (currentPage - 1) * PATIENTS_PER_PAGE,
    currentPage * PATIENTS_PER_PAGE
  );

  // Filter comms by channel
  const filteredComms = channelFilter === 'all'
    ? recentComms
    : recentComms.filter(c => c.channel === channelFilter);

  return (
    <AdminLayout title="Communications">
      {/* Tab bar */}
      <div style={styles.tabBar}>
        {[
          { key: 'conversations', label: 'Conversations' },
          { key: 'calls', label: 'Calls' },
          { key: 'activity', label: 'Activity Log' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); if (t.key !== 'conversations') setSelectedPatient(null); }}
            style={{
              ...styles.tab,
              ...(tab === t.key ? styles.tabActive : {}),
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* === CONVERSATIONS TAB === */}
      {tab === 'conversations' && !selectedPatient && (
        <div style={styles.fullContainer}>
          {/* Search bar + Mark All Read */}
          <div style={styles.searchBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="text"
                value={patientSearch}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search patients..."
                style={styles.searchInput}
              />
              {patients.some(p => p.unreadCount > 0) && (
                <button
                  onClick={async () => {
                    await fetch('/api/admin/mark-read', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ all: true }),
                    });
                    setPatients(prev => prev.map(p => ({ ...p, unreadCount: 0 })));
                  }}
                  style={styles.markAllReadBtn}
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {/* Patient list — full width */}
          <div style={styles.patientListScroll}>
            {loading ? (
              <div style={styles.loadingArea}>Loading conversations...</div>
            ) : allFilteredPatients.length === 0 ? (
              <div style={styles.emptyArea}>No conversations yet. Search for a patient to start.</div>
            ) : (
              <>
                {paginatedPatients.map(p => {
                  const key = p.id || (p.ghl_contact_id ? `ghl_${p.ghl_contact_id}` : p.name);
                  const hasUnread = p.unreadCount > 0;
                  return (
                    <div
                      key={key}
                      onClick={() => selectPatient(p)}
                      style={{
                        ...styles.patientCard,
                        ...(hasUnread ? styles.patientCardUnread : {}),
                      }}
                    >
                      <div style={styles.patientCardTop}>
                        <div style={styles.patientCardLeft}>
                          {hasUnread && <span style={styles.unreadDot} />}
                          <span style={{
                            ...styles.patientName,
                            fontWeight: hasUnread ? '700' : '500',
                          }}>{p.name}</span>
                          {p.recipient && (
                            <span style={styles.patientPhone}>{p.recipient}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {hasUnread && (
                            <span style={styles.unreadCountBadge}>{p.unreadCount}</span>
                          )}
                          <span style={styles.patientTime}>{formatRelativeTime(p.lastMessage)}</span>
                        </div>
                      </div>
                      <div style={{
                        ...styles.patientPreview,
                        color: hasUnread ? '#111' : '#999',
                        fontWeight: hasUnread ? '500' : '400',
                      }}>
                        {p.direction === 'inbound' && <span style={styles.inboundDot}>● </span>}
                        {p.lastPreview || 'No messages'}
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={styles.paginationBar}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          ...styles.pageBtn,
                          ...(currentPage === page ? styles.pageBtnActive : {}),
                        }}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Conversation view — full width when patient selected */}
      {tab === 'conversations' && selectedPatient && (
        <div style={styles.conversationContainer}>
          <ConversationView
            patientId={selectedPatient?.id}
            patientName={selectedPatient?.name}
            patientPhone={selectedPatient?.phone}
            ghlContactId={selectedPatient?.ghl_contact_id}
            onBack={handleBack}
          />
        </div>
      )}

      {/* === CALLS TAB === */}
      {tab === 'calls' && (
        <div style={styles.card}>
          {callsLoading ? (
            <div style={styles.loadingArea}>Loading call history...</div>
          ) : calls.length === 0 ? (
            <div style={styles.emptyArea}>No calls found</div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date / Time</th>
                    <th style={styles.th}>Direction</th>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>From</th>
                    <th style={styles.th}>To</th>
                    <th style={styles.th}>Duration</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map(call => (
                    <tr key={call.sid} style={styles.tr}>
                      <td style={styles.td}>{formatDate(call.startTime)}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.directionBadge,
                          ...(call.direction === 'inbound'
                            ? { background: '#dbeafe', color: '#1e40af' }
                            : { background: '#e0e7ff', color: '#4338ca' }),
                        }}>
                          {call.direction === 'inbound' ? '↙ In' : '↗ Out'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontWeight: '500' }}>
                          {call.patientName || '-'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.phoneText}>{call.from}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.phoneText}>{call.to}</span>
                      </td>
                      <td style={styles.td}>{formatDuration(call.duration)}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          ...getCallStatusStyle(call.status),
                        }}>
                          {(call.status || 'unknown').replace('-', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Call pagination */}
              <div style={styles.callPagination}>
                <button
                  onClick={() => { if (callsPage > 0) fetchCalls(callsPage - 1); }}
                  disabled={callsPage === 0}
                  style={{
                    ...styles.paginationBtn,
                    opacity: callsPage === 0 ? 0.4 : 1,
                  }}
                >
                  ← Previous
                </button>
                <span style={styles.pageInfo}>Page {callsPage + 1}</span>
                <button
                  onClick={() => { if (calls.length >= 20) fetchCalls(callsPage + 1); }}
                  disabled={calls.length < 20}
                  style={{
                    ...styles.paginationBtn,
                    opacity: calls.length < 20 ? 0.4 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* === ACTIVITY LOG TAB === */}
      {tab === 'activity' && (
        <>
          <div style={styles.filterRow}>
            {['all', 'sms', 'email'].map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                style={{
                  ...styles.filterPill,
                  ...(channelFilter === ch ? styles.filterPillActive : {}),
                }}
              >
                {ch === 'all' ? 'All' : ch.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={styles.card}>
            {commsLoading ? (
              <div style={styles.loadingArea}>Loading communications...</div>
            ) : filteredComms.length === 0 ? (
              <div style={styles.emptyArea}>No communications logged</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Channel</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Message</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComms.map(comm => (
                    <tr
                      key={comm.id}
                      style={styles.trClickable}
                      onClick={() => setSelectedComm(comm)}
                    >
                      <td style={styles.td}>{formatDate(comm.created_at)}</td>
                      <td style={styles.td}>
                        <span style={{ fontWeight: '500' }}>{comm.patient_name || '-'}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: comm.channel === 'sms' ? '#dbeafe' : '#e0e7ff',
                          color: comm.channel === 'sms' ? '#1e40af' : '#4338ca'
                        }}>
                          {comm.channel || 'sms'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: '13px', color: '#666' }}>
                          {(comm.message_type || '-').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: '13px', color: '#666' }}>
                          {(comm.message || '').replace(/<[^>]*>/g, '').substring(0, 80)}{(comm.message || '').length > 80 ? '...' : ''}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: comm.status === 'sent' || comm.status === 'received' ? '#dcfce7' : comm.status === 'error' ? '#fee2e2' : '#f0f0f0',
                          color: comm.status === 'sent' || comm.status === 'received' ? '#166534' : comm.status === 'error' ? '#dc2626' : '#666'
                        }}>
                          {comm.status || 'sent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Message detail modal */}
          {selectedComm && (
            <div style={styles.modalOverlay} onClick={() => setSelectedComm(null)}>
              <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <div style={styles.modalHeaderLeft}>
                    <span style={{ fontSize: '16px' }}>
                      {selectedComm.channel === 'email' ? '📧' : '💬'}
                    </span>
                    <span style={styles.modalTitle}>
                      {selectedComm.channel === 'email'
                        ? (selectedComm.subject || 'Email')
                        : 'SMS Message'}
                    </span>
                  </div>
                  <button onClick={() => setSelectedComm(null)} style={styles.modalCloseBtn}>✕</button>
                </div>
                <div style={styles.modalMeta}>
                  <div style={styles.modalMetaRow}>
                    <span style={styles.modalMetaLabel}>Patient:</span>
                    <span style={{ fontWeight: '500' }}>{selectedComm.patient_name || '—'}</span>
                  </div>
                  <div style={styles.modalMetaRow}>
                    <span style={styles.modalMetaLabel}>
                      {selectedComm.direction === 'inbound' ? 'From:' : 'To:'}
                    </span>
                    <span>{selectedComm.recipient || '—'}</span>
                  </div>
                  <div style={styles.modalMetaRow}>
                    <span style={styles.modalMetaLabel}>Date:</span>
                    <span>
                      {selectedComm.created_at
                        ? new Date(selectedComm.created_at).toLocaleString('en-US', {
                            timeZone: 'America/Los_Angeles',
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </span>
                  </div>
                  <div style={styles.modalMetaRow}>
                    <span style={styles.modalMetaLabel}>Type:</span>
                    <span>{(selectedComm.message_type || '—').replace(/_/g, ' ')}</span>
                  </div>
                  <div style={styles.modalMetaRow}>
                    <span style={styles.modalMetaLabel}>Status:</span>
                    <span style={{
                      color: selectedComm.status === 'sent' || selectedComm.status === 'received'
                        ? '#166534'
                        : selectedComm.status === 'error' ? '#dc2626' : '#666'
                    }}>
                      {selectedComm.status === 'sent' ? '✓ Sent'
                        : selectedComm.status === 'received' ? '✓ Received'
                        : selectedComm.status === 'error' ? '✕ Error'
                        : selectedComm.status || '—'}
                    </span>
                  </div>
                  {selectedComm.source && (
                    <div style={styles.modalMetaRow}>
                      <span style={styles.modalMetaLabel}>Source:</span>
                      <span style={{ color: '#9ca3af' }}>{selectedComm.source}</span>
                    </div>
                  )}
                </div>
                <div style={styles.modalBody}>
                  {selectedComm.channel === 'email' ? (
                    <div
                      style={styles.modalEmailContent}
                      dangerouslySetInnerHTML={{ __html: selectedComm.message || '' }}
                    />
                  ) : (
                    <div style={styles.modalSmsContent}>
                      {selectedComm.message || ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}

const styles = {
  tabBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  tab: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '400',
    color: '#666',
    fontFamily: 'inherit',
  },
  tabActive: {
    background: '#000',
    color: '#fff',
    border: '1px solid #000',
    fontWeight: '500',
  },
  // Full-width container for patient list
  fullContainer: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    overflow: 'hidden',
  },
  searchBar: {
    padding: '16px',
    borderBottom: '1px solid #e5e5e5',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    maxWidth: '400px',
  },
  patientListScroll: {
    maxHeight: 'calc(100vh - 240px)',
    overflowY: 'auto',
  },
  patientCard: {
    padding: '14px 20px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  patientCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  patientCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  patientName: {
    fontWeight: '500',
    fontSize: '15px',
    color: '#111',
  },
  patientPhone: {
    fontSize: '13px',
    color: '#999',
  },
  patientTime: {
    fontSize: '12px',
    color: '#999',
    flexShrink: 0,
  },
  patientPreview: {
    fontSize: '13px',
    color: '#999',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '600px',
  },
  patientCardUnread: {
    background: '#f0f7ff',
    borderLeft: '3px solid #3b82f6',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#3b82f6',
    flexShrink: 0,
  },
  unreadCountBadge: {
    background: '#3b82f6',
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
  },
  markAllReadBtn: {
    padding: '8px 14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  inboundDot: {
    color: '#3b82f6',
    fontSize: '8px',
  },
  paginationBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '4px',
    padding: '12px',
    borderTop: '1px solid #e5e5e5',
    background: '#fafafa',
  },
  pageBtn: {
    width: '28px',
    height: '28px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000',
    fontWeight: '600',
  },
  // Conversation container — full width
  conversationContainer: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    overflow: 'hidden',
    height: 'calc(100vh - 160px)',
    minHeight: '500px',
    maxHeight: '900px',
  },
  // Activity log
  filterRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '16px',
  },
  filterPill: {
    padding: '6px 14px',
    border: '1px solid #e5e5e5',
    borderRadius: '16px',
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666',
    fontWeight: '400',
    fontFamily: 'inherit',
  },
  filterPillActive: {
    background: '#111',
    color: '#fff',
    border: '1px solid #111',
    fontWeight: '500',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e5e5',
  },
  loadingArea: {
    textAlign: 'center',
    padding: '60px',
    color: '#666',
  },
  emptyArea: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
  },
  trClickable: {
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    display: 'inline-block',
  },
  directionBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'inline-block',
  },
  phoneText: {
    fontSize: '13px',
    color: '#666',
    fontFamily: 'monospace',
  },
  callPagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    padding: '14px',
    borderTop: '1px solid #e5e5e5',
    background: '#fafafa',
  },
  paginationBtn: {
    padding: '6px 14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#333',
    fontFamily: 'inherit',
  },
  pageInfo: {
    fontSize: '13px',
    color: '#666',
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
    maxWidth: '640px',
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
  modalCloseBtn: {
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
    padding: '14px 20px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
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
    minWidth: '60px',
    flexShrink: 0,
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
