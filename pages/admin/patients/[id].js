// /pages/admin/patients/[id].js
// Patient Detail - Clean UI
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout, { sharedStyles as s } from '../../../components/AdminLayout';

function calculateDay(startDate, totalDays) {
  if (!startDate) return null;
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  return diff;
}

export default function PatientDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [patient, setPatient] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('protocols');

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch patient info
      const patientRes = await fetch(`/api/admin/patients/${id}`);
      if (patientRes.ok) {
        const data = await patientRes.json();
        setPatient(data.patient || data);
        setProtocols(data.protocols || []);
        setPurchases(data.purchases || []);
      }
    } catch (err) {
      console.error('Error fetching patient:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Patient">
        <div style={s.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  if (!patient) {
    return (
      <AdminLayout title="Patient">
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>❌</div>
          <div style={s.emptyText}>Patient not found</div>
          <Link href="/admin/patients" style={{ ...s.btnPrimary, marginTop: '16px' }}>
            ← Back to Patients
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown';
  const activeProtocols = protocols.filter(p => p.status === 'active');
  const completedProtocols = protocols.filter(p => p.status === 'completed');

  return (
    <AdminLayout title={fullName}>
      {/* Back Link */}
      <Link href="/admin/patients" style={styles.backLink}>
        ← Back to Patients
      </Link>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={s.pageTitle}>{fullName}</h1>
          <p style={s.pageSubtitle}>
            {patient.email || patient.phone || 'No contact info'}
          </p>
        </div>
        <div style={styles.headerActions}>
          {patient.phone && (
            <>
              <a href={`tel:${patient.phone}`} style={s.btnSecondary}>📞 Call</a>
              <a href={`sms:${patient.phone}`} style={s.btnSecondary}>💬 Text</a>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statValue}>{activeProtocols.length}</div>
          <div style={s.statLabel}>Active Protocols</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statValue}>{completedProtocols.length}</div>
          <div style={s.statLabel}>Completed</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statValue}>{purchases.length}</div>
          <div style={s.statLabel}>Purchases</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'protocols' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('protocols')}
        >
          Protocols ({protocols.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'purchases' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('purchases')}
        >
          Purchases ({purchases.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'info' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('info')}
        >
          Info
        </button>
      </div>

      {/* Tab Content */}
      <div style={s.card}>
        {/* Protocols Tab */}
        {activeTab === 'protocols' && (
          <div>
            {protocols.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>💉</div>
                <div style={s.emptyText}>No protocols yet</div>
              </div>
            ) : (
              <div style={styles.protocolsGrid}>
                {protocols.map(protocol => {
                  const totalDays = protocol.total_sessions || protocol.duration_days || 10;
                  const currentDay = calculateDay(protocol.start_date, totalDays);
                  const isComplete = currentDay > totalDays || protocol.status === 'completed';
                  const isActive = protocol.status === 'active';

                  return (
                    <div key={protocol.id} style={{
                      ...styles.protocolCard,
                      borderColor: isActive ? '#000' : '#e5e5e5'
                    }}>
                      <div style={styles.protocolHeader}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{protocol.program_name || protocol.program_type}</div>
                          {protocol.primary_peptide && (
                            <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                              {protocol.primary_peptide}
                            </div>
                          )}
                        </div>
                        <span style={{
                          ...s.badge,
                          ...(isActive ? s.badgeActive : s.badgeCompleted)
                        }}>
                          {protocol.status}
                        </span>
                      </div>

                      {/* Day Display */}
                      <div style={styles.protocolDay}>
                        {isComplete ? (
                          <span style={{ color: '#22c55e', fontWeight: '600' }}>✓ Complete</span>
                        ) : currentDay < 1 ? (
                          <span style={{ color: '#666' }}>Starts {new Date(protocol.start_date).toLocaleDateString()}</span>
                        ) : (
                          <div style={s.dayDisplay}>
                            <span style={{ ...s.dayNumber, fontSize: '28px' }}>{currentDay}</span>
                            <span style={s.dayTotal}>/ {totalDays}</span>
                          </div>
                        )}
                      </div>

                      <div style={styles.protocolDates}>
                        {protocol.start_date && `Started ${new Date(protocol.start_date).toLocaleDateString()}`}
                        {protocol.end_date && ` • Ends ${new Date(protocol.end_date).toLocaleDateString()}`}
                      </div>

                      <Link href={`/admin/protocols/${protocol.id}`} style={{ ...s.btnSecondary, ...s.btnSmall, marginTop: '12px', display: 'block', textAlign: 'center' }}>
                        View Details →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div>
            {purchases.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>💳</div>
                <div style={s.emptyText}>No purchases yet</div>
              </div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Date</th>
                    <th style={s.th}>Item</th>
                    <th style={s.th}>Amount</th>
                    <th style={s.th}>Protocol</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(purchase => (
                    <tr key={purchase.id}>
                      <td style={s.td}>
                        {purchase.payment_date ? new Date(purchase.payment_date).toLocaleDateString() : '—'}
                      </td>
                      <td style={s.td}>{purchase.item_name}</td>
                      <td style={s.td}>${purchase.amount}</td>
                      <td style={s.td}>
                        {purchase.protocol_id ? (
                          <Link href={`/admin/protocols/${purchase.protocol_id}`} style={{ color: '#000' }}>
                            View →
                          </Link>
                        ) : (
                          <span style={{ color: '#999' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div style={{ padding: '20px' }}>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Full Name</div>
                <div style={styles.infoValue}>{fullName}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Email</div>
                <div style={styles.infoValue}>{patient.email || '—'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Phone</div>
                <div style={styles.infoValue}>{patient.phone || '—'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>GHL Contact ID</div>
                <div style={styles.infoValue}>{patient.ghl_contact_id || id}</div>
              </div>
              {patient.date_of_birth && (
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Date of Birth</div>
                  <div style={styles.infoValue}>{new Date(patient.date_of_birth).toLocaleDateString()}</div>
                </div>
              )}
              {patient.created_at && (
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Patient Since</div>
                  <div style={styles.infoValue}>{new Date(patient.created_at).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const styles = {
  backLink: {
    display: 'inline-block',
    marginBottom: '16px',
    color: '#666',
    textDecoration: 'none',
    fontSize: '14px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px'
  },
  headerActions: {
    display: 'flex',
    gap: '8px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '16px'
  },
  tab: {
    padding: '10px 20px',
    background: '#f5f5f5',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#666'
  },
  tabActive: {
    background: '#fff',
    color: '#000',
    borderBottom: '2px solid #000'
  },
  protocolsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
    padding: '20px'
  },
  protocolCard: {
    padding: '16px',
    border: '2px solid',
    borderRadius: '12px',
    background: '#fff'
  },
  protocolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  protocolDay: {
    padding: '16px',
    background: '#f9f9f9',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '12px'
  },
  protocolDates: {
    fontSize: '12px',
    color: '#666'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  infoItem: {},
  infoLabel: {
    fontSize: '11px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px'
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '500'
  }
};
