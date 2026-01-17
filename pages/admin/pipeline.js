// /pages/admin/pipeline.js
// Unified Protocol Pipeline - Table Layout
// Range Medical - Updated 2026-01-16

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function UnifiedPipeline() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('active'); // active, completed, all
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // all, in_clinic, take_home
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, peptide, weight_loss, hrt, iv, etc.
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/pipeline');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered protocols
  const getFilteredProtocols = () => {
    if (!data) return [];
    
    let protocols = [];
    
    // Combine based on status filter
    if (statusFilter === 'active' || statusFilter === 'all') {
      protocols = [
        ...data.protocols.ending_soon,
        ...data.protocols.active,
        ...data.protocols.just_started
      ];
    }
    if (statusFilter === 'completed' || statusFilter === 'all') {
      protocols = [...protocols, ...data.protocols.completed];
    }
    
    // Apply delivery filter
    if (deliveryFilter !== 'all') {
      protocols = protocols.filter(p => p.delivery === deliveryFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      protocols = protocols.filter(p => p.category === categoryFilter);
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      protocols = protocols.filter(p => 
        (p.patient_name || '').toLowerCase().includes(term) ||
        (p.medication || '').toLowerCase().includes(term) ||
        (p.program_name || '').toLowerCase().includes(term)
      );
    }
    
    return protocols;
  };

  // Group by urgency for display
  const groupByUrgency = (protocols) => {
    const groups = {
      ending_soon: [],
      active: [],
      just_started: [],
      completed: []
    };
    
    protocols.forEach(p => {
      if (p.status === 'completed' || p.urgency === 'completed') {
        groups.completed.push(p);
      } else if (p.urgency === 'ending_soon' || p.urgency === 'overdue') {
        groups.ending_soon.push(p);
      } else if (p.urgency === 'just_started') {
        groups.just_started.push(p);
      } else {
        groups.active.push(p);
      }
    });
    
    return groups;
  };

  const filteredProtocols = getFilteredProtocols();
  const grouped = groupByUrgency(filteredProtocols);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // Get protocol duration label
  const getDuration = (protocol) => {
    const name = protocol.program_name || '';
    const match = name.match(/(\d+)\s*day/i);
    if (match) return `${match[1]} days`;
    if (protocol.total_days) return `${protocol.total_days} days`;
    if (protocol.total_sessions) return `${protocol.total_sessions} sessions`;
    return '-';
  };

  // Get category badge
  const getCategoryBadge = (category) => {
    const badges = {
      peptide: { emoji: '🧬', label: 'Peptide', color: '#8b5cf6' },
      weight_loss: { emoji: '💉', label: 'WL', color: '#f59e0b' },
      hrt: { emoji: '💊', label: 'HRT', color: '#3b82f6' },
      iv: { emoji: '💧', label: 'IV', color: '#06b6d4' },
      hbot: { emoji: '🫁', label: 'HBOT', color: '#10b981' },
      rlt: { emoji: '🔴', label: 'RLT', color: '#ef4444' },
      injection: { emoji: '💉', label: 'Inj', color: '#6b7280' },
      other: { emoji: '📋', label: 'Other', color: '#6b7280' }
    };
    return badges[category] || badges.other;
  };

  // Open GHL contact
  const openGHL = (ghlId) => {
    if (ghlId) {
      window.open(`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${ghlId}`, '_blank');
    }
  };

  // Send SMS
  const sendSMS = (phone, name) => {
    // TODO: Implement SMS modal
    alert(`SMS to ${name}: ${phone}`);
  };

  // Renew protocol
  const renewProtocol = async (protocol) => {
    // TODO: Implement renew modal
    alert(`Renew protocol for ${protocol.patient_name}`);
  };

  // Edit protocol
  const editProtocol = (protocol) => {
    // TODO: Implement edit modal
    alert(`Edit protocol ${protocol.id}`);
  };

  // Render protocol row
  const renderRow = (protocol, index) => {
    const badge = getCategoryBadge(protocol.category);
    const isOverdue = protocol.days_remaining !== undefined && protocol.days_remaining <= 0;
    const isEndingSoon = protocol.urgency === 'ending_soon';
    
    return (
      <tr key={protocol.id} style={styles.row}>
        <td style={styles.cell}>
          <a 
            href={`/admin/patient/${protocol.patient_id}`}
            style={styles.patientLink}
          >
            {protocol.patient_name || 'Unknown'}
          </a>
        </td>
        <td style={styles.cell}>
          <span style={{ ...styles.categoryBadge, background: badge.color }}>
            {badge.emoji}
          </span>
          {protocol.medication || protocol.program_name || '-'}
        </td>
        <td style={styles.cell}>{protocol.dose || '-'}</td>
        <td style={styles.cell}>{getDuration(protocol)}</td>
        <td style={styles.cell}>{formatDate(protocol.start_date)}</td>
        <td style={styles.cell}>
          <span style={{
            ...styles.daysLeft,
            color: isOverdue ? '#dc2626' : isEndingSoon ? '#f59e0b' : '#059669',
            background: isOverdue ? '#fef2f2' : isEndingSoon ? '#fffbeb' : '#f0fdf4'
          }}>
            {protocol.status_text}
          </span>
        </td>
        <td style={styles.cell}>
          <span style={{
            ...styles.deliveryBadge,
            background: protocol.delivery === 'take_home' ? '#dbeafe' : '#f3f4f6',
            color: protocol.delivery === 'take_home' ? '#1d4ed8' : '#374151'
          }}>
            {protocol.delivery === 'take_home' ? 'TAKE HOME' : 'IN CLINIC'}
          </span>
        </td>
        <td style={styles.cellActions}>
          <button 
            style={styles.actionBtn}
            onClick={() => sendSMS(protocol.patient_phone, protocol.patient_name)}
            title="Send SMS"
          >
            📱 SMS
          </button>
          <button 
            style={styles.actionBtn}
            onClick={() => editProtocol(protocol)}
            title="Edit"
          >
            ✏️ Edit
          </button>
          {protocol.ghl_contact_id && (
            <button 
              style={styles.actionBtn}
              onClick={() => openGHL(protocol.ghl_contact_id)}
              title="Open in GHL"
            >
              ↗ GHL
            </button>
          )}
          {(isEndingSoon || isOverdue || protocol.status === 'completed') && (
            <button 
              style={{ ...styles.actionBtn, ...styles.renewBtn }}
              onClick={() => renewProtocol(protocol)}
              title="Renew"
            >
              🔄 Renew
            </button>
          )}
        </td>
      </tr>
    );
  };

  // Render section
  const renderSection = (title, protocols, color, emoji) => {
    if (protocols.length === 0) return null;
    
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={{ ...styles.sectionDot, background: color }}></span>
          <span style={styles.sectionTitle}>{emoji} {title}</span>
          <span style={styles.sectionCount}>{protocols.length}</span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>PATIENT</th>
              <th style={styles.th}>MEDICATION</th>
              <th style={styles.th}>DOSE</th>
              <th style={styles.th}>PROTOCOL</th>
              <th style={styles.th}>STARTED</th>
              <th style={styles.th}>STATUS</th>
              <th style={styles.th}>DELIVERY</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {protocols.map((p, i) => renderRow(p, i))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading protocols...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Protocol Pipeline | Range Medical</title>
      </Head>
      
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>💊 Protocol Pipeline</h1>
          
          <div style={styles.headerActions}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search all protocols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            
            {/* Status Tabs */}
            <div style={styles.tabs}>
              {['active', 'completed', 'all'].map(status => (
                <button
                  key={status}
                  style={{
                    ...styles.tab,
                    ...(statusFilter === status ? styles.tabActive : {})
                  }}
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Delivery Filter */}
            <div style={styles.tabs}>
              {[
                { value: 'all', label: 'All' },
                { value: 'in_clinic', label: 'In Clinic' },
                { value: 'take_home', label: 'Take Home' }
              ].map(opt => (
                <button
                  key={opt.value}
                  style={{
                    ...styles.tab,
                    ...(deliveryFilter === opt.value ? styles.tabActive : {})
                  }}
                  onClick={() => setDeliveryFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Refresh */}
            <button style={styles.refreshBtn} onClick={fetchData}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {data && (
          <div style={styles.statsBar}>
            <div style={{ ...styles.statCard, borderLeftColor: '#dc2626' }}>
              <div style={styles.statLabel}>ENDING SOON (≤3 DAYS)</div>
              <div style={styles.statValue}>{data.counts.ending_soon}</div>
            </div>
            <div style={{ ...styles.statCard, borderLeftColor: '#f59e0b' }}>
              <div style={styles.statLabel}>ACTIVE (4-14 DAYS)</div>
              <div style={styles.statValue}>{data.counts.active}</div>
            </div>
            <div style={{ ...styles.statCard, borderLeftColor: '#10b981' }}>
              <div style={styles.statLabel}>JUST STARTED (15+ DAYS)</div>
              <div style={styles.statValue}>{data.counts.just_started}</div>
            </div>
            <div style={{ ...styles.statCard, borderLeftColor: '#8b5cf6' }}>
              <div style={styles.statLabel}>NEEDS FOLLOW-UP</div>
              <div style={styles.statValue}>{data.counts.needs_follow_up}</div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div style={styles.categoryFilters}>
          {[
            { value: 'all', label: 'All Types' },
            { value: 'peptide', label: '🧬 Peptide' },
            { value: 'weight_loss', label: '💉 Weight Loss' },
            { value: 'hrt', label: '💊 HRT' },
            { value: 'iv', label: '💧 IV' },
            { value: 'hbot', label: '🫁 HBOT' },
            { value: 'rlt', label: '🔴 RLT' }
          ].map(cat => (
            <button
              key={cat.value}
              style={{
                ...styles.categoryBtn,
                ...(categoryFilter === cat.value ? styles.categoryBtnActive : {})
              }}
              onClick={() => setCategoryFilter(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Protocol Sections */}
        {statusFilter !== 'completed' && (
          <>
            {renderSection('Ending Soon (≤3 days)', grouped.ending_soon, '#dc2626', '🔴')}
            {renderSection('Active (4-14 days)', grouped.active, '#f59e0b', '🟡')}
            {renderSection('Just Started (15+ days)', grouped.just_started, '#10b981', '🟢')}
          </>
        )}
        
        {(statusFilter === 'completed' || statusFilter === 'all') && (
          renderSection('Completed', grouped.completed, '#6b7280', '⚪')
        )}

        {/* Empty State */}
        {filteredProtocols.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💊</div>
            <p>No protocols match your filters</p>
            <button style={styles.clearBtn} onClick={() => {
              setSearchTerm('');
              setDeliveryFilter('all');
              setCategoryFilter('all');
              setStatusFilter('active');
            }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: '#f8f9fa',
    minHeight: '100vh',
    padding: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#6b7280'
  },
  error: {
    textAlign: 'center',
    padding: '60px',
    color: '#dc2626'
  },
  header: {
    maxWidth: '1400px',
    margin: '0 auto 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  searchInput: {
    padding: '8px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    width: '220px',
    outline: 'none',
    transition: 'border-color 0.15s'
  },
  tabs: {
    display: 'flex',
    gap: '4px'
  },
  tab: {
    padding: '8px 16px',
    border: '2px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.15s'
  },
  tabActive: {
    background: '#111',
    color: 'white',
    borderColor: '#111'
  },
  refreshBtn: {
    padding: '8px 16px',
    border: '2px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  statsBar: {
    maxWidth: '1400px',
    margin: '0 auto 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  statCard: {
    background: 'white',
    borderRadius: '8px',
    padding: '16px 20px',
    borderLeft: '4px solid #ccc',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: '0.5px',
    marginBottom: '4px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111'
  },
  categoryFilters: {
    maxWidth: '1400px',
    margin: '0 auto 20px',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  categoryBtn: {
    padding: '6px 12px',
    border: '1px solid #e5e7eb',
    background: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.15s'
  },
  categoryBtnActive: {
    background: '#111',
    color: 'white',
    borderColor: '#111'
  },
  section: {
    maxWidth: '1400px',
    margin: '0 auto 24px',
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fafafa'
  },
  sectionDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  sectionCount: {
    fontSize: '13px',
    color: '#6b7280',
    marginLeft: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  headerRow: {
    borderBottom: '2px solid #e5e7eb'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: '0.5px',
    background: '#fafafa'
  },
  row: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background 0.1s'
  },
  cell: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151',
    verticalAlign: 'middle'
  },
  cellActions: {
    padding: '10px 16px',
    textAlign: 'right',
    whiteSpace: 'nowrap'
  },
  patientLink: {
    color: '#111',
    textDecoration: 'none',
    fontWeight: '600',
    borderBottom: '1px solid #d1d5db'
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    marginRight: '8px',
    color: 'white'
  },
  daysLeft: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500'
  },
  deliveryBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.3px'
  },
  actionBtn: {
    padding: '6px 10px',
    border: '1px solid #e5e7eb',
    background: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    marginLeft: '6px',
    transition: 'all 0.15s'
  },
  renewBtn: {
    background: '#10b981',
    color: 'white',
    borderColor: '#10b981'
  },
  emptyState: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '60px 20px',
    textAlign: 'center',
    background: 'white',
    borderRadius: '12px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  clearBtn: {
    marginTop: '16px',
    padding: '10px 20px',
    border: 'none',
    background: '#111',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};
