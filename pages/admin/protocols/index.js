// /pages/admin/protocols/index.js
// Protocols List - Clean UI
// Range Medical

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles as s } from '../../../components/AdminLayout';

export default function ProtocolsList() {
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    fetchProtocols();
  }, [statusFilter]);

  const fetchProtocols = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const res = await fetch(`/api/admin/protocols?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProtocols(data.protocols || data || []);
      }
    } catch (err) {
      console.error('Error fetching protocols:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDay = (startDate, totalDays) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  const filteredProtocols = protocols.filter(p => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      p.patient_name?.toLowerCase().includes(searchLower) ||
      p.program_name?.toLowerCase().includes(searchLower) ||
      p.primary_peptide?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return { ...s.badge, ...s.badgeActive };
      case 'completed':
        return { ...s.badge, ...s.badgeCompleted };
      case 'paused':
        return { ...s.badge, ...s.badgePending };
      default:
        return s.badge;
    }
  };

  return (
    <AdminLayout title="Protocols">
      {/* Header */}
      <div style={{ ...s.pageHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={s.pageTitle}>Protocols</h1>
          <p style={s.pageSubtitle}>{filteredProtocols.length} protocols</p>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filterBar}>
        <input
          type="text"
          placeholder="Search by patient or program..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={s.searchInput}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={s.select}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Protocols Table */}
      <div style={s.card}>
        {loading ? (
          <div style={s.loading}>Loading...</div>
        ) : filteredProtocols.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>💉</div>
            <div style={s.emptyText}>No protocols found</div>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Patient</th>
                <th style={s.th}>Protocol</th>
                <th style={s.th}>Progress</th>
                <th style={s.th}>Started</th>
                <th style={s.th}>Status</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {filteredProtocols.map(protocol => {
                const totalDays = protocol.total_sessions || protocol.duration_days || 10;
                const currentDay = calculateDay(protocol.start_date, totalDays);
                const isComplete = currentDay > totalDays;

                return (
                  <tr 
                    key={protocol.id} 
                    style={s.trHover}
                    onClick={() => window.location.href = `/admin/protocols/${protocol.id}`}
                  >
                    <td style={s.td}>
                      <div style={{ fontWeight: '500' }}>{protocol.patient_name}</div>
                      {protocol.patient_phone && (
                        <div style={{ fontSize: '12px', color: '#666' }}>{protocol.patient_phone}</div>
                      )}
                    </td>
                    <td style={s.td}>
                      <div>{protocol.program_name || protocol.program_type}</div>
                      {protocol.primary_peptide && (
                        <div style={{ fontSize: '12px', color: '#666' }}>{protocol.primary_peptide}</div>
                      )}
                    </td>
                    <td style={s.td}>
                      {isComplete ? (
                        <span style={{ color: '#22c55e', fontWeight: '600' }}>✓ Complete</span>
                      ) : currentDay < 1 ? (
                        <span style={{ color: '#666' }}>Not started</span>
                      ) : (
                        <div style={s.dayDisplay}>
                          <span style={s.dayNumber}>{currentDay}</span>
                          <span style={s.dayTotal}>/ {totalDays}</span>
                        </div>
                      )}
                    </td>
                    <td style={s.td}>
                      {protocol.start_date ? new Date(protocol.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }) : '—'}
                    </td>
                    <td style={s.td}>
                      <span style={getStatusBadge(protocol.status)}>
                        {protocol.status}
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <Link 
                        href={`/admin/protocols/${protocol.id}`} 
                        style={{ ...s.btnSecondary, ...s.btnSmall }}
                        onClick={e => e.stopPropagation()}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
