// /pages/admin/command-center.js
// Range Medical Command Center - Unified Admin Dashboard
// Single page with 4 tabs: Overview, Leads, Protocols, Patients

import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';

// ============================================
// CONSTANTS
// ============================================

const CATEGORY_COLORS = {
  weight_loss: '#FF8C00',
  hrt: '#4488FF',
  peptide: '#00CC66',
  iv: '#9966FF',
  hbot: '#FFCC00',
  rlt: '#FF6666',
  injection: '#A0A0A0',
  labs: '#66CCCC',
  other: '#888888',
};

const CATEGORY_LABELS = {
  weight_loss: 'Weight Loss',
  hrt: 'HRT',
  peptide: 'Peptide',
  iv: 'IV Therapy',
  hbot: 'HBOT',
  rlt: 'Red Light',
  injection: 'Injection',
  labs: 'Labs',
};

const URGENCY_COLORS = {
  expired: '#FF4444',
  critical: '#FF4444',
  warning: '#FF8C00',
  active: '#00CC66',
  fresh: '#4488FF',
};

const LEAD_STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  'appointment-booked': 'Appt Booked',
  converted: 'Converted',
  'no-response': 'No Response',
};

const GHL_LOCATION_ID = 'WICdvbXmTjQORW6GiHWW';

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles'
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles'
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function getPatientName(protocol) {
  if (protocol.patients?.name) return protocol.patients.name;
  if (protocol.patients?.first_name) {
    return `${protocol.patients.first_name} ${protocol.patients.last_name || ''}`.trim();
  }
  return protocol.patient_name || 'Unknown';
}

function getProtocolStatus(protocol) {
  const { program_type, delivery_method, end_date, total_sessions, sessions_used, start_date } = protocol;

  // Session-based
  if (delivery_method === 'in_clinic' && total_sessions > 0) {
    const used = sessions_used || 0;
    const remaining = total_sessions - used;
    return `${used}/${total_sessions} sessions`;
  }

  // Date-based
  let endDateObj = null;
  if (end_date) {
    endDateObj = new Date(end_date);
  } else if (program_type === 'weight_loss' && start_date && total_sessions) {
    endDateObj = new Date(start_date);
    endDateObj.setDate(endDateObj.getDate() + (total_sessions * 7));
  }

  if (endDateObj) {
    const now = new Date();
    const daysLeft = Math.floor((endDateObj - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`;
    return `${daysLeft} days left`;
  }

  return 'Active';
}

function openGHL(contactId) {
  if (!contactId) return;
  window.open(`https://app.gohighlevel.com/v2/location/${GHL_LOCATION_ID}/contacts/detail/${contactId}`, '_blank');
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [protocolFilter, setProtocolFilter] = useState({ status: 'active', category: 'all', delivery: 'all', search: '' });
  const [leadFilter, setLeadFilter] = useState({ status: 'all', search: '' });
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/command-center');
      const result = await res.json();
      if (result.success) {
        setData(result);
        setError(null);
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Filtered protocols
  const filteredProtocols = useMemo(() => {
    if (!data?.protocols) return [];
    let list = protocolFilter.status === 'completed' ? (data.completedProtocols || []) : data.protocols;

    if (protocolFilter.category !== 'all') {
      list = list.filter(p => p.program_type === protocolFilter.category);
    }
    if (protocolFilter.delivery !== 'all') {
      list = list.filter(p => p.delivery_method === protocolFilter.delivery);
    }
    if (protocolFilter.search) {
      const s = protocolFilter.search.toLowerCase();
      list = list.filter(p =>
        getPatientName(p).toLowerCase().includes(s) ||
        (p.medication || '').toLowerCase().includes(s) ||
        (p.program_name || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [data, protocolFilter]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    let list = data.leads;

    if (leadFilter.status !== 'all') {
      list = list.filter(l => l.status === leadFilter.status);
    }
    if (leadFilter.search) {
      const s = leadFilter.search.toLowerCase();
      list = list.filter(l =>
        (l.name || '').toLowerCase().includes(s) ||
        (l.phone || '').includes(s) ||
        (l.email || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [data, leadFilter]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    if (!data?.patients) return [];
    if (!patientSearch) return data.patients.slice(0, 50);
    const s = patientSearch.toLowerCase();
    return data.patients.filter(p =>
      (p.name || '').toLowerCase().includes(s) ||
      (p.first_name || '').toLowerCase().includes(s) ||
      (p.last_name || '').toLowerCase().includes(s) ||
      (p.phone || '').includes(s) ||
      (p.email || '').toLowerCase().includes(s)
    ).slice(0, 50);
  }, [data, patientSearch]);

  // Patient details
  const patientDetails = useMemo(() => {
    if (!selectedPatient || !data) return null;
    const protocols = (data.protocols || []).filter(p => p.patient_id === selectedPatient.id);
    const completedProtocols = (data.completedProtocols || []).filter(p => p.patient_id === selectedPatient.id);
    const injectionLogs = (data.injectionLogs || []).filter(l => l.patient_id === selectedPatient.id).slice(0, 10);
    const purchases = (data.purchases || []).filter(p => p.patient_id === selectedPatient.id);
    return { protocols, completedProtocols, injectionLogs, purchases };
  }, [selectedPatient, data]);

  if (loading) {
    return (
      <div style={styles.container}>
        <Head><title>Command Center | Range Medical</title></Head>
        <div style={styles.loading}>Loading Command Center...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Head><title>Command Center | Range Medical</title></Head>
        <div style={styles.error}>Error: {error}</div>
        <button onClick={fetchData} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Command Center | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '4295373617400545');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=4295373617400545&ev=PageView&noscript=1" />
        </noscript>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>Command Center</h1>
            <span style={styles.subtitle}>Range Medical</span>
          </div>
          <button onClick={fetchData} style={styles.refreshBtn}>Refresh</button>
        </header>

        {/* Tabs */}
        <nav style={styles.tabs}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'leads', label: 'Leads', icon: '🎯', badge: data?.stats?.needsProtocol },
            { id: 'protocols', label: 'Protocols', icon: '💊', badge: data?.stats?.endingSoon },
            { id: 'patients', label: 'Patients', icon: '👥' },
          ].map(tab => (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              <span style={styles.tabLabel}>{tab.label}</span>
              {tab.badge > 0 && <span style={styles.tabBadge}>{tab.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main style={styles.main}>
          {activeTab === 'overview' && (
            <OverviewTab data={data} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'leads' && (
            <LeadsTab
              data={data}
              leads={filteredLeads}
              filter={leadFilter}
              setFilter={setLeadFilter}
            />
          )}
          {activeTab === 'protocols' && (
            <ProtocolsTab
              data={data}
              protocols={filteredProtocols}
              filter={protocolFilter}
              setFilter={setProtocolFilter}
            />
          )}
          {activeTab === 'patients' && (
            <PatientsTab
              patients={filteredPatients}
              search={patientSearch}
              setSearch={setPatientSearch}
              selected={selectedPatient}
              setSelected={setSelectedPatient}
              details={patientDetails}
              data={data}
            />
          )}
        </main>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #0A0A0A;
          color: #F5F5F5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #1A1A1A; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
    </>
  );
}

// ============================================
// TAB COMPONENTS
// ============================================

function OverviewTab({ data, setActiveTab }) {
  const stats = data?.stats || {};
  const recentPurchases = (data?.purchases || []).slice(0, 10);
  const endingSoon = (data?.protocols || []).filter(p =>
    p.urgency === 'critical' || p.urgency === 'warning'
  ).slice(0, 10);

  return (
    <div style={styles.overviewGrid}>
      {/* Stats Row */}
      <div style={styles.statsRow}>
        <StatCard label="New Leads" value={stats.newLeads || 0} color="#4488FF" onClick={() => setActiveTab('leads')} />
        <StatCard label="Active Protocols" value={stats.activeProtocols || 0} color="#00CC66" onClick={() => setActiveTab('protocols')} />
        <StatCard label="Ending Soon" value={stats.endingSoon || 0} color="#FF8C00" onClick={() => setActiveTab('protocols')} />
        <StatCard label="Needs Protocol" value={stats.needsProtocol || 0} color="#FF4444" onClick={() => setActiveTab('leads')} />
        <StatCard label="No Response" value={stats.noResponse || 0} color="#666666" />
        <StatCard label="Total Patients" value={stats.totalPatients || 0} color="#9966FF" onClick={() => setActiveTab('patients')} />
      </div>

      {/* Two Column Layout */}
      <div style={styles.overviewColumns}>
        {/* Left Column */}
        <div style={styles.overviewColumn}>
          {/* Protocols by Category */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Active Protocols by Category</h3>
            <div style={styles.categoryBars}>
              {Object.entries(data?.protocolsByCategory || {}).map(([cat, count]) => (
                <div key={cat} style={styles.categoryBar}>
                  <div style={styles.categoryLabel}>
                    <span style={{ ...styles.categoryDot, background: CATEGORY_COLORS[cat] || '#888' }} />
                    {CATEGORY_LABELS[cat] || cat}
                  </div>
                  <div style={styles.categoryBarOuter}>
                    <div style={{
                      ...styles.categoryBarInner,
                      width: `${Math.min(100, (count / (stats.activeProtocols || 1)) * 100)}%`,
                      background: CATEGORY_COLORS[cat] || '#888',
                    }} />
                  </div>
                  <span style={styles.categoryCount}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Recent Purchases</h3>
            <div style={styles.activityList}>
              {recentPurchases.map((p, i) => (
                <div key={p.id || i} style={styles.activityItem}>
                  <div style={styles.activityMain}>
                    <span style={styles.activityName}>{p.patient_name || 'Unknown'}</span>
                    <span style={styles.activityDesc}>{p.item_name}</span>
                  </div>
                  <div style={styles.activityMeta}>
                    <span style={styles.activityAmount}>${p.display_amount || p.amount}</span>
                    <span style={styles.activityTime}>{timeAgo(p.purchase_date)}</span>
                  </div>
                </div>
              ))}
              {recentPurchases.length === 0 && (
                <div style={styles.emptyState}>No recent purchases</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.overviewColumn}>
          {/* Needs Protocol Alert */}
          {(data?.purchasesNeedingProtocol || []).length > 0 && (
            <div style={{ ...styles.card, background: '#331800', borderColor: '#FF8C00' }}>
              <h3 style={{ ...styles.cardTitle, color: '#FF8C00' }}>
                Needs Protocol ({data.purchasesNeedingProtocol.length})
              </h3>
              <div style={styles.activityList}>
                {data.purchasesNeedingProtocol.slice(0, 5).map((p, i) => (
                  <div key={p.id || i} style={styles.activityItem}>
                    <div style={styles.activityMain}>
                      <span style={styles.activityName}>{p.patient_name || 'Unknown'}</span>
                      <span style={styles.activityDesc}>{p.item_name}</span>
                    </div>
                    <div style={styles.activityMeta}>
                      <span style={styles.activityAmount}>${p.display_amount || p.amount}</span>
                      <span style={styles.activityTime}>{timeAgo(p.purchase_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ending Soon */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Ending Soon</h3>
            <div style={styles.protocolList}>
              {endingSoon.map((p, i) => (
                <div key={p.id || i} style={styles.protocolRow}>
                  <span style={{ ...styles.urgencyDot, background: URGENCY_COLORS[p.urgency] }} />
                  <span style={styles.protocolName}>{getPatientName(p)}</span>
                  <span style={{ ...styles.categoryBadge, background: CATEGORY_COLORS[p.program_type] }}>
                    {CATEGORY_LABELS[p.program_type] || p.program_type}
                  </span>
                  <span style={styles.protocolStatus}>{getProtocolStatus(p)}</span>
                </div>
              ))}
              {endingSoon.length === 0 && (
                <div style={styles.emptyState}>No protocols ending soon</div>
              )}
            </div>
          </div>

          {/* In-Clinic Overdue */}
          {(data?.inClinicData?.overdue || []).length > 0 && (
            <div style={{ ...styles.card, background: '#330000', borderColor: '#FF4444' }}>
              <h3 style={{ ...styles.cardTitle, color: '#FF4444' }}>
                Overdue Visits ({data.inClinicData.overdue.length})
              </h3>
              <div style={styles.protocolList}>
                {data.inClinicData.overdue.slice(0, 5).map((p, i) => (
                  <div key={p.id || i} style={styles.protocolRow}>
                    <span style={styles.protocolName}>{getPatientName(p)}</span>
                    <span style={{ ...styles.categoryBadge, background: CATEGORY_COLORS[p.program_type] }}>
                      {CATEGORY_LABELS[p.program_type] || p.program_type}
                    </span>
                    <span style={{ ...styles.protocolStatus, color: '#FF4444' }}>
                      {p.days_overdue} days overdue
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadsTab({ data, leads, filter, setFilter }) {
  const [expandedLead, setExpandedLead] = useState(null);

  return (
    <div style={styles.tabContent}>
      {/* Needs Protocol Banner */}
      {(data?.purchasesNeedingProtocol || []).length > 0 && (
        <div style={styles.alertBanner}>
          <div style={styles.alertIcon}>⚠️</div>
          <div style={styles.alertContent}>
            <strong>{data.purchasesNeedingProtocol.length} purchase(s) need protocol assignment</strong>
            <div style={styles.alertItems}>
              {data.purchasesNeedingProtocol.slice(0, 3).map((p, i) => (
                <span key={i} style={styles.alertItem}>
                  {p.patient_name}: {p.item_name} (${p.display_amount || p.amount})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search leads..."
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
          style={styles.searchInput}
        />
        <div style={styles.filterPills}>
          {['all', 'new', 'contacted', 'no-response'].map(status => (
            <button
              key={status}
              style={{
                ...styles.filterPill,
                ...(filter.status === status ? styles.filterPillActive : {}),
              }}
              onClick={() => setFilter({ ...filter, status })}
            >
              {status === 'all' ? 'All' : LEAD_STATUS_LABELS[status] || status}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div style={styles.leadsList}>
        {leads.map(lead => (
          <div key={lead.id} style={styles.leadCard}>
            <div
              style={styles.leadHeader}
              onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
            >
              <div style={styles.leadInfo}>
                <span style={styles.leadName}>{lead.name || 'Unknown'}</span>
                <span style={styles.leadContact}>
                  {lead.phone && <span>{lead.phone}</span>}
                  {lead.email && <span style={{ marginLeft: '12px' }}>{lead.email}</span>}
                </span>
              </div>
              <div style={styles.leadMeta}>
                <span style={{
                  ...styles.leadStatus,
                  background: lead.status === 'new' ? '#4488FF' :
                             lead.status === 'contacted' ? '#00CC66' :
                             lead.status === 'no-response' ? '#FF4444' :
                             lead.status === 'appointment-booked' ? '#9966FF' : '#666',
                }}>
                  {LEAD_STATUS_LABELS[lead.status] || lead.status}
                </span>
                <span style={styles.leadTime}>{timeAgo(lead.created_at)}</span>
              </div>
            </div>

            {expandedLead === lead.id && (
              <div style={styles.leadExpanded}>
                <div style={styles.leadTags}>
                  {(lead.tags || []).slice(0, 5).map((tag, i) => (
                    <span key={i} style={styles.leadTag}>{tag}</span>
                  ))}
                  <span style={styles.leadSource}>{lead.source}</span>
                </div>
                <div style={styles.leadActions}>
                  {lead.phone && (
                    <>
                      <a href={`sms:${lead.phone}`} style={styles.actionBtn}>📱 Text</a>
                      <a href={`tel:${lead.phone}`} style={styles.actionBtn}>📞 Call</a>
                    </>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} style={styles.actionBtn}>📧 Email</a>
                  )}
                  <button
                    style={styles.actionBtn}
                    onClick={() => openGHL(lead.ghl_contact_id)}
                  >
                    🔗 Open GHL
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {leads.length === 0 && (
          <div style={styles.emptyState}>No leads found</div>
        )}
      </div>
    </div>
  );
}

function ProtocolsTab({ data, protocols, filter, setFilter }) {
  return (
    <div style={styles.tabContent}>
      {/* Filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search protocols..."
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
          style={styles.searchInput}
        />
        <div style={styles.filterGroup}>
          <div style={styles.filterPills}>
            {['active', 'completed'].map(status => (
              <button
                key={status}
                style={{
                  ...styles.filterPill,
                  ...(filter.status === status ? styles.filterPillActive : {}),
                }}
                onClick={() => setFilter({ ...filter, status })}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div style={styles.filterPills}>
            {['all', 'in_clinic', 'take_home'].map(delivery => (
              <button
                key={delivery}
                style={{
                  ...styles.filterPill,
                  ...(filter.delivery === delivery ? styles.filterPillActive : {}),
                }}
                onClick={() => setFilter({ ...filter, delivery })}
              >
                {delivery === 'all' ? 'All' : delivery === 'in_clinic' ? 'In Clinic' : 'Take Home'}
              </button>
            ))}
          </div>
          <div style={styles.filterPills}>
            <button
              style={{
                ...styles.filterPill,
                ...(filter.category === 'all' ? styles.filterPillActive : {}),
              }}
              onClick={() => setFilter({ ...filter, category: 'all' })}
            >
              All
            </button>
            {Object.keys(CATEGORY_LABELS).map(cat => (
              <button
                key={cat}
                style={{
                  ...styles.filterPill,
                  ...(filter.category === cat ? { ...styles.filterPillActive, background: CATEGORY_COLORS[cat] } : {}),
                }}
                onClick={() => setFilter({ ...filter, category: cat })}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Protocols Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Patient</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Delivery</th>
              <th style={styles.th}>Program</th>
              <th style={styles.th}>Progress</th>
              <th style={styles.th}>Started</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {protocols.map(protocol => (
              <tr key={protocol.id} style={styles.tr}>
                <td style={styles.td}>
                  <span style={{ ...styles.urgencyDot, background: URGENCY_COLORS[protocol.urgency] || '#666' }} />
                </td>
                <td style={styles.td}>
                  <span style={styles.patientLink}>{getPatientName(protocol)}</span>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.categoryBadge, background: CATEGORY_COLORS[protocol.program_type] }}>
                    {CATEGORY_LABELS[protocol.program_type] || protocol.program_type}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.deliveryBadge}>
                    {protocol.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home'}
                  </span>
                </td>
                <td style={styles.td}>{protocol.program_name || protocol.medication || '-'}</td>
                <td style={{ ...styles.td, color: URGENCY_COLORS[protocol.urgency] }}>
                  {getProtocolStatus(protocol)}
                </td>
                <td style={styles.td}>{formatDate(protocol.start_date)}</td>
                <td style={styles.td}>
                  <button
                    style={styles.smallBtn}
                    onClick={() => openGHL(protocol.patients?.ghl_contact_id)}
                  >
                    GHL
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {protocols.length === 0 && (
          <div style={styles.emptyState}>No protocols found</div>
        )}
      </div>
    </div>
  );
}

function PatientsTab({ patients, search, setSearch, selected, setSelected, details, data }) {
  return (
    <div style={styles.patientsLayout}>
      {/* Patient List */}
      <div style={styles.patientList}>
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.patientListItems}>
          {patients.map(patient => (
            <div
              key={patient.id}
              style={{
                ...styles.patientItem,
                ...(selected?.id === patient.id ? styles.patientItemSelected : {}),
              }}
              onClick={() => setSelected(patient)}
            >
              <div style={styles.patientItemName}>
                {patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown'}
              </div>
              <div style={styles.patientItemMeta}>
                {patient.phone && <span>{patient.phone}</span>}
              </div>
            </div>
          ))}
          {patients.length === 0 && (
            <div style={styles.emptyState}>No patients found</div>
          )}
        </div>
      </div>

      {/* Patient Detail */}
      <div style={styles.patientDetail}>
        {selected ? (
          <>
            <div style={styles.patientHeader}>
              <h2 style={styles.patientName}>
                {selected.name || `${selected.first_name || ''} ${selected.last_name || ''}`.trim()}
              </h2>
              <div style={styles.patientContact}>
                {selected.phone && <span>{selected.phone}</span>}
                {selected.email && <span>{selected.email}</span>}
              </div>
              <div style={styles.patientSince}>
                Patient since {formatDate(selected.created_at)}
              </div>
            </div>

            <div style={styles.patientActions}>
              {selected.phone && (
                <>
                  <a href={`sms:${selected.phone}`} style={styles.actionBtn}>📱 Text</a>
                  <a href={`tel:${selected.phone}`} style={styles.actionBtn}>📞 Call</a>
                </>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`} style={styles.actionBtn}>📧 Email</a>
              )}
              <button
                style={styles.actionBtn}
                onClick={() => openGHL(selected.ghl_contact_id)}
              >
                🔗 Open GHL
              </button>
            </div>

            {/* Active Protocols */}
            <div style={styles.detailSection}>
              <h3 style={styles.detailTitle}>Active Protocols ({details?.protocols?.length || 0})</h3>
              {(details?.protocols || []).map(p => (
                <div key={p.id} style={styles.detailItem}>
                  <span style={{ ...styles.categoryBadge, background: CATEGORY_COLORS[p.program_type] }}>
                    {CATEGORY_LABELS[p.program_type] || p.program_type}
                  </span>
                  <span style={styles.detailItemName}>{p.program_name || p.medication}</span>
                  <span style={{ color: URGENCY_COLORS[p.urgency] }}>{getProtocolStatus(p)}</span>
                </div>
              ))}
              {(details?.protocols || []).length === 0 && (
                <div style={styles.emptyState}>No active protocols</div>
              )}
            </div>

            {/* Recent Injection Logs */}
            <div style={styles.detailSection}>
              <h3 style={styles.detailTitle}>Recent Injection Logs</h3>
              {(details?.injectionLogs || []).map(log => (
                <div key={log.id} style={styles.detailItem}>
                  <span style={styles.detailItemType}>{log.log_type}</span>
                  <span style={styles.detailItemName}>{log.medication || log.category}</span>
                  <span style={styles.detailItemDate}>{formatDateTime(log.logged_at)}</span>
                </div>
              ))}
              {(details?.injectionLogs || []).length === 0 && (
                <div style={styles.emptyState}>No injection logs</div>
              )}
            </div>

            {/* Purchase History */}
            <div style={styles.detailSection}>
              <h3 style={styles.detailTitle}>Purchase History</h3>
              {(details?.purchases || []).map(p => (
                <div key={p.id} style={styles.detailItem}>
                  <span style={styles.detailItemName}>{p.item_name}</span>
                  <span style={styles.detailItemAmount}>${p.display_amount || p.amount}</span>
                  <span style={styles.detailItemDate}>{formatDate(p.purchase_date)}</span>
                </div>
              ))}
              {(details?.purchases || []).length === 0 && (
                <div style={styles.emptyState}>No purchases</div>
              )}
            </div>
          </>
        ) : (
          <div style={styles.patientDetailEmpty}>
            Select a patient to view details
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, onClick }) {
  return (
    <div
      style={{ ...styles.statCard, borderColor: color, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0A0A0A',
    color: '#F5F5F5',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#666',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    fontSize: '16px',
    color: '#FF4444',
  },
  retryBtn: {
    position: 'absolute',
    top: '55%',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    background: '#222',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #222',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
  },
  refreshBtn: {
    padding: '8px 16px',
    background: '#1A1A1A',
    color: '#F5F5F5',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.15s ease',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    padding: '0 24px',
    borderBottom: '1px solid #222',
    overflowX: 'auto',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 20px',
    background: 'transparent',
    color: '#888',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: '#F5F5F5',
    borderBottomColor: '#F5F5F5',
  },
  tabIcon: {
    fontSize: '16px',
  },
  tabLabel: {},
  tabBadge: {
    padding: '2px 8px',
    background: '#FF4444',
    color: '#fff',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
  },
  main: {
    padding: '24px',
    minHeight: 'calc(100vh - 140px)',
  },
  tabContent: {
    maxWidth: '1400px',
    margin: '0 auto',
  },

  // Overview
  overviewGrid: {},
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#111',
    border: '1px solid #222',
    borderLeft: '3px solid',
    borderRadius: '8px',
    padding: '16px 20px',
    transition: 'all 0.15s ease',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
    marginTop: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  overviewColumns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  overviewColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '20px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#F5F5F5',
  },
  categoryBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  categoryBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  categoryLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '120px',
    fontSize: '13px',
    color: '#A0A0A0',
  },
  categoryDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  categoryBarOuter: {
    flex: 1,
    height: '8px',
    background: '#222',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  categoryBarInner: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  categoryCount: {
    width: '30px',
    textAlign: 'right',
    fontSize: '13px',
    fontWeight: '600',
    color: '#F5F5F5',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #222',
  },
  activityMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  activityName: {
    fontSize: '14px',
    fontWeight: '500',
  },
  activityDesc: {
    fontSize: '12px',
    color: '#888',
  },
  activityMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  activityAmount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#00CC66',
  },
  activityTime: {
    fontSize: '11px',
    color: '#666',
  },
  protocolList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  protocolRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #222',
  },
  urgencyDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  protocolName: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '500',
  },
  categoryBadge: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  protocolStatus: {
    fontSize: '12px',
    color: '#A0A0A0',
    minWidth: '100px',
    textAlign: 'right',
  },
  emptyState: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
  },

  // Leads
  alertBanner: {
    display: 'flex',
    gap: '16px',
    padding: '16px 20px',
    background: '#331800',
    border: '1px solid #FF8C00',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  alertIcon: {
    fontSize: '24px',
  },
  alertContent: {
    flex: 1,
  },
  alertItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  alertItem: {
    fontSize: '12px',
    color: '#A0A0A0',
  },
  filters: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  filterGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  searchInput: {
    padding: '10px 16px',
    background: '#1A1A1A',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#F5F5F5',
    fontSize: '14px',
    width: '100%',
    maxWidth: '300px',
  },
  filterPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  filterPill: {
    padding: '6px 14px',
    background: '#1A1A1A',
    border: '1px solid #333',
    borderRadius: '20px',
    color: '#A0A0A0',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterPillActive: {
    background: '#F5F5F5',
    color: '#0A0A0A',
    borderColor: '#F5F5F5',
  },
  leadsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  leadCard: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  leadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  leadInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  leadName: {
    fontSize: '15px',
    fontWeight: '600',
  },
  leadContact: {
    fontSize: '13px',
    color: '#888',
  },
  leadMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  leadStatus: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
  },
  leadTime: {
    fontSize: '12px',
    color: '#666',
  },
  leadExpanded: {
    padding: '16px 20px',
    background: '#0D0D0D',
    borderTop: '1px solid #222',
  },
  leadTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '12px',
  },
  leadTag: {
    padding: '3px 8px',
    background: '#222',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#A0A0A0',
  },
  leadSource: {
    padding: '3px 8px',
    background: '#1A3A1A',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#00CC66',
  },
  leadActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  actionBtn: {
    padding: '8px 14px',
    background: '#1A1A1A',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#F5F5F5',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },

  // Protocols Table
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    borderBottom: '1px solid #333',
    color: '#888',
    fontWeight: '600',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #1A1A1A',
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
  },
  patientLink: {
    fontWeight: '500',
    color: '#F5F5F5',
  },
  deliveryBadge: {
    padding: '3px 8px',
    background: '#222',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#A0A0A0',
  },
  smallBtn: {
    padding: '4px 10px',
    background: '#222',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#A0A0A0',
    fontSize: '11px',
    cursor: 'pointer',
  },

  // Patients
  patientsLayout: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 200px)',
  },
  patientList: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: 'calc(100vh - 200px)',
    overflow: 'hidden',
  },
  patientListItems: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  patientItem: {
    padding: '12px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    border: '1px solid transparent',
  },
  patientItemSelected: {
    background: '#1A1A1A',
    borderColor: '#333',
  },
  patientItemName: {
    fontSize: '14px',
    fontWeight: '500',
  },
  patientItemMeta: {
    fontSize: '12px',
    color: '#888',
    marginTop: '2px',
  },
  patientDetail: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '24px',
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
  },
  patientDetailEmpty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
  },
  patientHeader: {
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #222',
  },
  patientName: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
  },
  patientContact: {
    display: 'flex',
    gap: '20px',
    marginTop: '8px',
    fontSize: '14px',
    color: '#A0A0A0',
  },
  patientSince: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#666',
  },
  patientActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '24px',
  },
  detailSection: {
    marginBottom: '24px',
  },
  detailTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#F5F5F5',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #1A1A1A',
    fontSize: '13px',
  },
  detailItemName: {
    flex: 1,
  },
  detailItemType: {
    padding: '2px 8px',
    background: '#222',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#888',
  },
  detailItemAmount: {
    fontWeight: '600',
    color: '#00CC66',
  },
  detailItemDate: {
    color: '#666',
    fontSize: '12px',
  },
};

// Media query styles would be handled in the global CSS or with a useMediaQuery hook
