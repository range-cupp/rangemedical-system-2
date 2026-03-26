// /pages/admin/communications.js
// Communications hub - SMS conversations, call history, and activity log
// Range Medical System V2

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout, { overlayClickProps } from '../../components/AdminLayout';

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
  const [responseFilter, setResponseFilter] = useState('needs_response'); // 'all' | 'needs_response'
  const PATIENTS_PER_PAGE = 20;

  // Activity log pagination
  const [commsPage, setCommsPage] = useState(1);
  const [commsTotal, setCommsTotal] = useState(0);
  const COMMS_PER_PAGE = 50;
  const searchTimeout = useRef(null);

  // Call history state
  const [calls, setCalls] = useState([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [callsPage, setCallsPage] = useState(0);
  const [callsLoaded, setCallsLoaded] = useState(false);

  useEffect(() => {
    fetchRecentPatients();
    fetchComms();
  }, []);

  // Fetch calls when Calls tab is first selected
  useEffect(() => {
    if (tab === 'calls' && !callsLoaded) {
      fetchCalls(0);
    }
  }, [tab]);

  // Fetch patients who have recent SMS activity
  const fetchRecentPatients = async () => {
    try {
      // Use dedicated conversations endpoint — fetches 500 rows server-side so
      // no messages are missed due to client-side pagination limits
      const res = await fetch('/api/admin/conversations?days=60&limit=150');
      const data = await res.json();
      const convos = data.conversations || [];

      // Normalize field names to match what the UI expects
      const sorted = convos.map(c => ({
        id: c.patient_id || null,
        ghl_contact_id: c.ghl_contact_id || null,
        name: c.patient_name || c.recipient || 'Unknown',
        lastMessage: c.last_message_at,
        lastPreview: (c.last_message || '').substring(0, 80),
        direction: c.last_direction,
        recipient: c.recipient || null,
        unreadCount: c.unread_count || 0,
        needsResponseCount: c.needs_response_count || 0,
      }));

      setPatients(sorted);
    } catch (err) {
      console.error('Error fetching recent patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent comms for activity log (paginated)
  const fetchComms = async (page = 1) => {
    try {
      setCommsLoading(true);
      const channelParam = channelFilter !== 'all' ? `&channel=${channelFilter}` : '';
      const res = await fetch(`/api/admin/comms-log?limit=${COMMS_PER_PAGE}&page=${page}${channelParam}`);
      const data = await res.json();
      setRecentComms(data.logs || data.comms || []);
      setCommsTotal(data.total || 0);
      setCommsPage(page);
    } catch (err) {
      console.error('Error fetching comms:', err);
    } finally {
      setCommsLoading(false);
    }
  };

  // Fetch call history from comms_log (syncs from Twilio first)
  const fetchCalls = async (page) => {
    setCallsLoading(true);
    try {
      // Sync calls from Twilio into comms_log before fetching
      await fetch('/api/twilio/sync-all-calls', { method: 'POST' }).catch(() => {});

      const res = await fetch(`/api/admin/comms-log?channel=call&limit=50&page=${page + 1}`);
      const data = await res.json();
      const callComms = (data.logs || []).map(c => ({
        sid: c.id,
        from: c.direction === 'inbound' ? c.recipient : '+19499973988',
        to: c.direction === 'inbound' ? '+19499973988' : c.recipient,
        direction: c.direction || 'inbound',
        duration: 0,
        status: c.status || 'completed',
        startTime: c.created_at,
        patientId: c.patient_id || null,
        patientName: c.patient_name || null,
        message: c.message,
      }));
      setCalls(callComms);
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

  // Navigate to next/previous patient in the filtered list
  const navigatePatient = (direction) => {
    if (!selectedPatient) return;
    const currentIdx = allFilteredPatients.findIndex(p =>
      (p.id && p.id === selectedPatient.id) ||
      (!p.id && p.name === selectedPatient.name)
    );
    if (currentIdx === -1) return;
    const nextIdx = currentIdx + direction;
    if (nextIdx < 0 || nextIdx >= allFilteredPatients.length) return;
    selectPatient(allFilteredPatients[nextIdx]);
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

  // Status helpers for Activity Log
  const getCommStatusStyle = (status) => {
    switch (status) {
      case 'delivered':
      case 'completed':
      case 'sent':
      case 'received':
        return { background: '#dcfce7', color: '#166534' };
      case 'undelivered':
        return { background: '#fef9c3', color: '#854d0e' };
      case 'queued':
      case 'sending':
        return { background: '#e0e7ff', color: '#4338ca' };
      case 'error':
      case 'failed':
      case 'missed':
        return { background: '#fee2e2', color: '#dc2626' };
      default:
        return { background: '#f0f0f0', color: '#666' };
    }
  };

  const getCommStatusLabel = (status) => {
    switch (status) {
      case 'delivered': return '✓✓ Delivered';
      case 'sent': return '✓ Sent';
      case 'received': return '✓ Received';
      case 'completed': return '✓ Completed';
      case 'queued': return '○ Queued';
      case 'sending': return '○ Sending';
      case 'undelivered': return '⚠ Not Delivered';
      case 'error': return '✕ Error';
      case 'failed': return '✕ Failed';
      case 'missed': return '✕ Missed';
      default: return status || 'sent';
    }
  };

  // Quick dismiss needs_response from list view without opening the conversation
  const dismissNeedsResponse = async (e, p) => {
    e.stopPropagation(); // don't open the conversation
    try {
      const resp = await fetch('/api/admin/clear-needs-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: p.id || null,
          phone: p.recipient || p.phone || null,
        }),
      });
      if (resp.ok) {
        setPatients(prev => prev.map(pt => {
          if ((p.id && pt.id === p.id) || (!p.id && (pt.phone || pt.recipient) === (p.phone || p.recipient))) {
            return { ...pt, needsResponseCount: 0 };
          }
          return pt;
        }));
      }
    } catch (_) { /* silent */ }
  };

  // Count patients needing response for the badge
  const needsResponseTotal = patients.filter(p => p.needsResponseCount > 0).length;

  // Filter patients by search and response filter
  let allFilteredPatients = patientSearch
    ? patients.filter(p => (p.name || '').toLowerCase().includes(patientSearch.toLowerCase()))
    : patients;

  if (responseFilter === 'needs_response') {
    allFilteredPatients = allFilteredPatients.filter(p => p.needsResponseCount > 0 ||
      (selectedPatient && ((p.id && p.id === selectedPatient.id) || (!p.id && (p.phone || p.recipient) === (selectedPatient.phone || selectedPatient.recipient))))
    );
  }

  // Paginate
  const totalPages = Math.ceil(allFilteredPatients.length / PATIENTS_PER_PAGE);
  const paginatedPatients = allFilteredPatients.slice(
    (currentPage - 1) * PATIENTS_PER_PAGE,
    currentPage * PATIENTS_PER_PAGE
  );

  // Refetch comms when channel filter changes
  useEffect(() => {
    fetchComms(1);
  }, [channelFilter]);

  const commsTotalPages = Math.ceil(commsTotal / COMMS_PER_PAGE);

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
          {/* Response filter pills + Search bar */}
          <div style={styles.searchBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={() => { setResponseFilter('needs_response'); setCurrentPage(1); }}
                style={{
                  ...styles.responseFilterBtn,
                  ...(responseFilter === 'needs_response' ? styles.responseFilterBtnActive : {}),
                }}
              >
                Needs Response
                {needsResponseTotal > 0 && (
                  <span style={styles.needsResponseBadgeInline}>{needsResponseTotal}</span>
                )}
              </button>
              <button
                onClick={() => { setResponseFilter('all'); setCurrentPage(1); }}
                style={{
                  ...styles.responseFilterBtn,
                  ...(responseFilter === 'all' ? styles.responseFilterBtnAllActive : {}),
                }}
              >
                All Conversations
              </button>
            </div>
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
                  const needsResponse = p.needsResponseCount > 0;
                  return (
                    <div
                      key={key}
                      onClick={() => selectPatient(p)}
                      style={{
                        ...styles.patientCard,
                        ...(needsResponse ? styles.patientCardNeedsResponse : hasUnread ? styles.patientCardUnread : {}),
                      }}
                    >
                      <div style={styles.patientCardTop}>
                        <div style={styles.patientCardLeft}>
                          {needsResponse ? (
                            <span style={styles.needsResponseDot} />
                          ) : hasUnread ? (
                            <span style={styles.unreadDot} />
                          ) : null}
                          <span style={{
                            ...styles.patientName,
                            fontWeight: needsResponse || hasUnread ? '700' : '500',
                          }}>{p.name}</span>
                          {p.recipient && (
                            <span style={styles.patientPhone}>{p.recipient}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {needsResponse && (
                            <>
                              <span style={styles.needsResponseBadge}>Action Needed</span>
                              <button
                                onClick={(e) => dismissNeedsResponse(e, p)}
                                style={styles.dismissBtn}
                                title="Dismiss — no response needed"
                              >✕</button>
                            </>
                          )}
                          {hasUnread && !needsResponse && (
                            <span style={styles.unreadCountBadge}>{p.unreadCount}</span>
                          )}
                          <span style={styles.patientTime}>{formatRelativeTime(p.lastMessage)}</span>
                        </div>
                      </div>
                      <div style={{
                        ...styles.patientPreview,
                        color: needsResponse ? '#111' : hasUnread ? '#111' : '#999',
                        fontWeight: needsResponse || hasUnread ? '500' : '400',
                      }}>
                        {p.direction === 'inbound' && <span style={{
                          ...styles.inboundDot,
                          color: needsResponse ? '#ea580c' : '#3b82f6',
                        }}>● </span>}
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
            patientPhone={selectedPatient?.phone || selectedPatient?.recipient}
            ghlContactId={selectedPatient?.ghl_contact_id}
            onBack={handleBack}
            onPrev={() => navigatePatient(-1)}
            onNext={() => navigatePatient(1)}
            hasPrev={allFilteredPatients.findIndex(p => (p.id && p.id === selectedPatient?.id) || (!p.id && p.name === selectedPatient?.name)) > 0}
            hasNext={allFilteredPatients.findIndex(p => (p.id && p.id === selectedPatient?.id) || (!p.id && p.name === selectedPatient?.name)) < allFilteredPatients.length - 1}
            onNeedsResponseCleared={(clearedId, clearedPhone) => {
              setPatients(prev => prev.map(p => {
                if ((clearedId && p.id === clearedId) || (clearedPhone && !p.id && (p.phone === clearedPhone || p.recipient === clearedPhone))) {
                  return { ...p, needsResponseCount: 0 };
                }
                return p;
              }));
            }}
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
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Details</th>
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
                        {call.patientId ? (
                          <a
                            href={`/patients/${call.patientId}`}
                            style={{ fontWeight: '500', color: '#2563eb', textDecoration: 'none' }}
                            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.target.style.textDecoration = 'none'}
                          >
                            {call.patientName || '-'}
                          </a>
                        ) : (
                          <span style={{ fontWeight: '500' }}>
                            {call.patientName || '-'}
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.phoneText}>
                          {call.direction === 'inbound' ? call.from : call.to}
                        </span>
                      </td>
                      <td style={styles.td}>{call.message || '-'}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          ...getCallStatusStyle(call.status),
                        }}>
                          {(call.status || 'unknown').replace('-', ' ').replace('_', ' ')}
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
                  onClick={() => { if (calls.length >= 50) fetchCalls(callsPage + 1); }}
                  disabled={calls.length < 50}
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
            {['all', 'sms', 'email', 'call'].map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                style={{
                  ...styles.filterPill,
                  ...(channelFilter === ch ? styles.filterPillActive : {}),
                }}
              >
                {ch === 'all' ? 'All' : ch === 'call' ? 'Calls' : ch.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={styles.card}>
            {commsLoading ? (
              <div style={styles.loadingArea}>Loading communications...</div>
            ) : recentComms.length === 0 ? (
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
                  {recentComms.map(comm => (
                    <tr
                      key={comm.id}
                      style={styles.trClickable}
                      onClick={() => setSelectedComm(comm)}
                    >
                      <td style={styles.td}>{formatDate(comm.created_at)}</td>
                      <td style={styles.td}>
                        {comm.patient_id ? (
                          <a
                            href={`/patients/${comm.patient_id}`}
                            onClick={e => e.stopPropagation()}
                            style={{ fontWeight: '500', color: '#2563eb', textDecoration: 'none' }}
                            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.target.style.textDecoration = 'none'}
                          >
                            {comm.patient_name || '-'}
                          </a>
                        ) : (
                          <span style={{ fontWeight: '500' }}>{comm.patient_name || '-'}</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: comm.channel === 'sms' ? '#dbeafe' : comm.channel === 'call' ? '#fef3c7' : '#e0e7ff',
                          color: comm.channel === 'sms' ? '#1e40af' : comm.channel === 'call' ? '#92400e' : '#4338ca'
                        }}>
                          {comm.channel === 'call' ? '📞 Call' : (comm.channel || 'sms').toUpperCase()}
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
                          ...getCommStatusStyle(comm.status),
                        }}>
                          {getCommStatusLabel(comm.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Activity Log Pagination */}
            {commsTotalPages > 1 && (
              <div style={styles.callPagination}>
                <button
                  onClick={() => { if (commsPage > 1) fetchComms(commsPage - 1); }}
                  disabled={commsPage <= 1}
                  style={{
                    ...styles.paginationBtn,
                    opacity: commsPage <= 1 ? 0.4 : 1,
                  }}
                >
                  ← Previous
                </button>
                <span style={styles.pageInfo}>
                  Page {commsPage} of {commsTotalPages} ({commsTotal} total)
                </span>
                <button
                  onClick={() => { if (commsPage < commsTotalPages) fetchComms(commsPage + 1); }}
                  disabled={commsPage >= commsTotalPages}
                  style={{
                    ...styles.paginationBtn,
                    opacity: commsPage >= commsTotalPages ? 0.4 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Message detail modal */}
          {selectedComm && (
            <div style={styles.modalOverlay} {...overlayClickProps(() => setSelectedComm(null))}>
              <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <div style={styles.modalHeaderLeft}>
                    <span style={{ fontSize: '16px' }}>
                      {selectedComm.channel === 'email' ? '📧' : selectedComm.channel === 'call' ? '📞' : '💬'}
                    </span>
                    <span style={styles.modalTitle}>
                      {selectedComm.channel === 'email'
                        ? (selectedComm.subject || 'Email')
                        : selectedComm.channel === 'call'
                          ? 'Phone Call'
                          : 'SMS Message'}
                    </span>
                  </div>
                  <button onClick={() => setSelectedComm(null)} style={styles.modalCloseBtn}>✕</button>
                </div>
                <div style={styles.modalMeta}>
                  <div style={styles.modalMetaRow}>
                    <span style={styles.modalMetaLabel}>Patient:</span>
                    {selectedComm.patient_id ? (
                      <a
                        href={`/patients/${selectedComm.patient_id}`}
                        style={{ fontWeight: '500', color: '#2563eb', textDecoration: 'none' }}
                        onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.target.style.textDecoration = 'none'}
                      >
                        {selectedComm.patient_name || '—'}
                      </a>
                    ) : (
                      <span style={{ fontWeight: '500' }}>{selectedComm.patient_name || '—'}</span>
                    )}
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
                      ...getCommStatusStyle(selectedComm.status),
                      background: 'none',
                      padding: 0,
                    }}>
                      {getCommStatusLabel(selectedComm.status)}
                    </span>
                  </div>
                  {selectedComm.error_message && (
                    <div style={styles.modalMetaRow}>
                      <span style={styles.modalMetaLabel}>Error:</span>
                      <span style={{ color: '#dc2626' }}>{selectedComm.error_message}</span>
                    </div>
                  )}
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
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
  patientCardNeedsResponse: {
    background: '#fff7ed',
    borderLeft: '3px solid #ea580c',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#3b82f6',
    flexShrink: 0,
  },
  needsResponseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#ea580c',
    flexShrink: 0,
  },
  unreadCountBadge: {
    background: '#3b82f6',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    minWidth: '20px',
    height: '20px',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px',
    lineHeight: 1,
  },
  needsResponseBadge: {
    background: '#ea580c',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    borderRadius: 0,
    padding: '3px 8px',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },
  dismissBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: 0,
    color: '#999',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '2px 6px',
    lineHeight: 1,
    flexShrink: 0,
  },
  responseFilterBtn: {
    padding: '6px 14px',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
    background: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#666',
    fontWeight: '400',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  responseFilterBtnActive: {
    background: '#ea580c',
    color: '#fff',
    border: '1px solid #ea580c',
    fontWeight: '600',
  },
  responseFilterBtnAllActive: {
    background: '#111',
    color: '#fff',
    border: '1px solid #111',
    fontWeight: '500',
  },
  needsResponseBadgeInline: {
    background: 'rgba(255,255,255,0.3)',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    minWidth: '18px',
    height: '18px',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 5px',
    lineHeight: 1,
  },
  markAllReadBtn: {
    padding: '8px 14px',
    border: '1px solid #ddd',
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    display: 'inline-block',
  },
  directionBadge: {
    padding: '4px 10px',
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
