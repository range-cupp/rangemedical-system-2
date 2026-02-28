// /pages/admin/communications.js
// Communications hub - SMS conversations and activity log
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
  const searchTimeout = useRef(null);

  useEffect(() => {
    fetchRecentPatients();
    fetchComms();
  }, []);

  // Fetch patients who have recent SMS activity
  const fetchRecentPatients = async () => {
    try {
      const res = await fetch('/api/admin/comms-log?channel=sms&limit=200');
      const data = await res.json();
      const logs = data.logs || data.comms || [];

      // Group by patient, get most recent message per patient
      const patientMap = {};
      for (const log of logs) {
        if (!log.patient_id) continue;
        if (!patientMap[log.patient_id] || new Date(log.created_at) > new Date(patientMap[log.patient_id].lastMessage)) {
          patientMap[log.patient_id] = {
            id: log.patient_id,
            name: log.patient_name || 'Unknown',
            lastMessage: log.created_at,
            lastPreview: (log.message || '').substring(0, 60),
            direction: log.direction || (log.message_type === 'inbound_sms' ? 'inbound' : 'outbound'),
            unread: log.direction === 'inbound' || log.message_type === 'inbound_sms',
          };
        }
      }

      const sorted = Object.values(patientMap).sort((a, b) =>
        new Date(b.lastMessage) - new Date(a.lastMessage)
      );

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

  // Search patients for new conversation
  const searchPatients = async (q) => {
    if (!q || q.length < 2) return;
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const results = data.patients || data || [];

      // Merge with existing patient list, add any new ones at the top
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
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchPatients(val), 400);
  };

  const selectPatient = async (p) => {
    // If we don't have phone yet, fetch patient details
    if (!p.phone) {
      try {
        const res = await fetch(`/api/patients/${p.id}`);
        const data = await res.json();
        const patient = data.patient || data;
        setSelectedPatient({
          ...p,
          phone: patient.phone,
          name: patient.first_name && patient.last_name
            ? `${patient.first_name} ${patient.last_name}`
            : patient.name || p.name,
        });
      } catch (err) {
        setSelectedPatient(p);
      }
    } else {
      setSelectedPatient(p);
    }
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

  // Filter patients by search
  const filteredPatients = patientSearch
    ? patients.filter(p => (p.name || '').toLowerCase().includes(patientSearch.toLowerCase()))
    : patients;

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
          { key: 'activity', label: 'Activity Log' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              ...styles.tab,
              ...(tab === t.key ? styles.tabActive : {}),
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'conversations' ? (
        <div style={styles.splitView}>
          {/* Patient list */}
          <div style={styles.patientList}>
            <div style={styles.searchWrap}>
              <input
                type="text"
                value={patientSearch}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search patients..."
                style={styles.searchInput}
              />
            </div>
            <div style={styles.patientScroll}>
              {loading ? (
                <div style={styles.loadingSmall}>Loading...</div>
              ) : filteredPatients.length === 0 ? (
                <div style={styles.loadingSmall}>No conversations yet. Search for a patient to start.</div>
              ) : (
                filteredPatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    style={{
                      ...styles.patientItem,
                      background: selectedPatient?.id === p.id ? '#f3f4f6' : 'transparent',
                    }}
                  >
                    <div style={styles.patientRow}>
                      <span style={styles.patientItemName}>{p.name}</span>
                      <span style={styles.patientTime}>{formatRelativeTime(p.lastMessage)}</span>
                    </div>
                    <div style={styles.patientPreview}>
                      {p.direction === 'inbound' && <span style={styles.inboundDot}>● </span>}
                      {p.lastPreview || 'No messages'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conversation view */}
          <div style={styles.conversationPanel}>
            <ConversationView
              patientId={selectedPatient?.id}
              patientName={selectedPatient?.name}
              patientPhone={selectedPatient?.phone}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Activity log filters */}
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
                    <tr key={comm.id} style={styles.tr}>
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
                          {(comm.message || '').substring(0, 60)}{(comm.message || '').length > 60 ? '...' : ''}
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
  },
  tabActive: {
    background: '#000',
    color: '#fff',
    border: '1px solid #000',
    fontWeight: '500',
  },
  // Split view
  splitView: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '0',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#fff',
    minHeight: '600px',
  },
  patientList: {
    borderRight: '1px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'column',
  },
  searchWrap: {
    padding: '12px',
    borderBottom: '1px solid #e5e5e5',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  patientScroll: {
    flex: 1,
    overflowY: 'auto',
  },
  loadingSmall: {
    padding: '20px',
    textAlign: 'center',
    color: '#999',
    fontSize: '13px',
  },
  patientItem: {
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
  },
  patientRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
  patientItemName: {
    fontWeight: '500',
    fontSize: '14px',
  },
  patientTime: {
    fontSize: '11px',
    color: '#999',
  },
  patientPreview: {
    fontSize: '12px',
    color: '#999',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  inboundDot: {
    color: '#3b82f6',
    fontSize: '8px',
  },
  conversationPanel: {
    display: 'flex',
    flexDirection: 'column',
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
  },
};
