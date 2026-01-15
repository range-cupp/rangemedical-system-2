// /pages/dashboard/hrt.js
// HRT & Ongoing Programs Dashboard

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function HRTDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hrtPatients, setHrtPatients] = useState([]);
  const [weightLossPatients, setWeightLossPatients] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all'); // all, refill_due, active

  useEffect(() => {
    fetchHRTData();
  }, []);

  async function fetchHRTData() {
    try {
      const res = await fetch('/api/dashboard/hrt');
      const data = await res.json();
      
      if (res.ok) {
        setHrtPatients(data.hrt || []);
        setWeightLossPatients(data.weightLoss || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  function getDaysUntil(dateString) {
    if (!dateString) return null;
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  }

  function getRefillStatus(daysUntil) {
    if (daysUntil === null) return { color: '#666', label: 'Not set' };
    if (daysUntil <= 0) return { color: '#dc2626', label: 'Overdue' };
    if (daysUntil <= 7) return { color: '#f59e0b', label: `${daysUntil}d` };
    return { color: '#22c55e', label: `${daysUntil}d` };
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>HRT & Ongoing | Range Medical</title>
      </Head>
      
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>HRT & Ongoing Programs</h1>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalHRT || 0}</div>
            <div style={styles.statLabel}>HRT Patients</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#ef4444'}}>{stats.refillsDue || 0}</div>
            <div style={styles.statLabel}>Refills Due (7 days)</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalWeightLoss || 0}</div>
            <div style={styles.statLabel}>Weight Loss</div>
          </div>
        </div>

        {/* HRT Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>🟣 HRT Members</h2>
          </div>
          
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <div style={styles.colPatient}>Patient</div>
              <div style={styles.colSupply}>Supply Type</div>
              <div style={styles.colDose}>Dose</div>
              <div style={styles.colRefill}>Refill Due</div>
              <div style={styles.colLabs}>Last Labs</div>
            </div>
            
            {hrtPatients.length === 0 ? (
              <div style={styles.emptyRow}>No HRT patients yet</div>
            ) : (
              hrtPatients.map(patient => {
                const daysUntil = getDaysUntil(patient.refill_due);
                const status = getRefillStatus(daysUntil);
                return (
                  <Link 
                    href={`/patients/${patient.patient_id}`}
                    key={patient.id}
                    style={styles.tableRow}
                  >
                    <div style={styles.colPatient}>
                      <span style={styles.patientName}>{patient.patient_name}</span>
                    </div>
                    <div style={styles.colSupply}>
                      <span style={{
                        ...styles.supplyBadge,
                        background: patient.supply_type === 'vial' ? '#dbeafe' : '#f3e8ff'
                      }}>
                        {patient.supply_type || 'Not set'}
                      </span>
                    </div>
                    <div style={styles.colDose}>
                      {patient.dose || '—'} {patient.frequency || ''}
                    </div>
                    <div style={styles.colRefill}>
                      {patient.refill_due ? (
                        <span style={{
                          ...styles.refillBadge,
                          background: daysUntil <= 0 ? '#fee2e2' : daysUntil <= 7 ? '#fef3c7' : '#f3f4f6',
                          color: status.color
                        }}>
                          {formatDate(patient.refill_due)} ({status.label})
                        </span>
                      ) : (
                        <span style={styles.notSet}>Not set</span>
                      )}
                    </div>
                    <div style={styles.colLabs}>
                      {patient.last_labs ? formatDate(patient.last_labs) : '—'}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Weight Loss Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>🔵 Weight Loss (Ongoing)</h2>
          </div>
          
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <div style={styles.colPatient}>Patient</div>
              <div style={styles.colMed}>Medication</div>
              <div style={styles.colDose}>Current Dose</div>
              <div style={styles.colNext}>Next Visit</div>
              <div style={styles.colWeek}>Week</div>
            </div>
            
            {weightLossPatients.length === 0 ? (
              <div style={styles.emptyRow}>No weight loss patients yet</div>
            ) : (
              weightLossPatients.map(patient => {
                const daysUntil = getDaysUntil(patient.next_visit);
                const status = getRefillStatus(daysUntil);
                return (
                  <Link 
                    href={`/patients/${patient.patient_id}`}
                    key={patient.id}
                    style={styles.tableRow}
                  >
                    <div style={styles.colPatient}>
                      <span style={styles.patientName}>{patient.patient_name}</span>
                    </div>
                    <div style={styles.colMed}>
                      {patient.medication || '—'}
                    </div>
                    <div style={styles.colDose}>
                      {patient.dose || '—'}
                    </div>
                    <div style={styles.colNext}>
                      {patient.next_visit ? (
                        <span style={{
                          ...styles.refillBadge,
                          background: daysUntil <= 0 ? '#fee2e2' : daysUntil <= 3 ? '#fef3c7' : '#f3f4f6',
                          color: status.color
                        }}>
                          {formatDate(patient.next_visit)}
                        </span>
                      ) : (
                        <span style={styles.notSet}>Not scheduled</span>
                      )}
                    </div>
                    <div style={styles.colWeek}>
                      {patient.week_number ? `Week ${patient.week_number}` : '—'}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f9fafb',
    minHeight: '100vh'
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#666'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: 0
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: '#fff',
    padding: '16px 24px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666'
  },
  section: {
    marginBottom: '32px'
  },
  sectionHeader: {
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  },
  table: {
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  tableHeader: {
    display: 'flex',
    padding: '12px 16px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase'
  },
  tableRow: {
    display: 'flex',
    padding: '14px 16px',
    borderBottom: '1px solid #f3f4f6',
    textDecoration: 'none',
    color: 'inherit',
    alignItems: 'center',
    transition: 'background 0.15s'
  },
  emptyRow: {
    padding: '32px',
    textAlign: 'center',
    color: '#666'
  },
  colPatient: {
    flex: 2
  },
  colSupply: {
    flex: 1
  },
  colMed: {
    flex: 1.5
  },
  colDose: {
    flex: 1.5
  },
  colRefill: {
    flex: 1.5
  },
  colNext: {
    flex: 1.5
  },
  colLabs: {
    flex: 1
  },
  colWeek: {
    flex: 0.8
  },
  patientName: {
    fontWeight: '500'
  },
  supplyBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    textTransform: 'capitalize'
  },
  refillBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  notSet: {
    color: '#999',
    fontSize: '13px'
  }
};
