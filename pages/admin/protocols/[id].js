// /pages/admin/protocols/[id].js
// Protocol Detail View
// Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ProtocolDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [protocol, setProtocol] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) fetchProtocol();
  }, [id]);

  const fetchProtocol = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/protocols/${id}`);
      if (!res.ok) throw new Error('Protocol not found');
      const data = await res.json();
      setProtocol(data.protocol);
      setSessions(data.sessions || []);
      setCheckins(data.checkins || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markSession = async (sessionId, status) => {
    await fetch(`/api/admin/protocols/${id}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, status })
    });
    fetchProtocol();
  };

  const sendPortalLink = async () => {
    setSending(true);
    const token = protocol.access_token;
    const phone = protocol.patient_phone;
    const name = protocol.patient_name?.split(' ')[0] || 'there';
    
    if (!phone) {
      alert('No phone number on file');
      setSending(false);
      return;
    }

    const message = `Hi ${name}! Here's your Range Medical portal to track your progress: https://app.range-medical.com/portal/${token}`;
    
    // Try GHL API or fallback to SMS link
    try {
      const res = await fetch('/api/admin/send-patient-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          message,
          contact_id: protocol.ghl_contact_id
        })
      });
      
      if (res.ok) {
        alert('Portal link sent!');
      } else {
        // Fallback to SMS link
        window.open(`sms:${phone}?body=${encodeURIComponent(message)}`);
      }
    } catch {
      window.open(`sms:${phone}?body=${encodeURIComponent(message)}`);
    }
    setSending(false);
  };

  const extendProtocol = async () => {
    const days = prompt('How many days to extend?', '10');
    if (!days) return;
    
    await fetch(`/api/admin/protocols/${id}/extend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: parseInt(days) })
    });
    fetchProtocol();
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>{error} <Link href="/admin/protocols">← Back</Link></div>;
  if (!protocol) return <div style={styles.error}>Protocol not found</div>;

  const today = new Date().toISOString().split('T')[0];
  const completedCount = sessions.filter(s => s.status === 'completed').length;

  return (
    <>
      <Head><title>{protocol.patient_name} - Protocol | Range Medical</title></Head>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <Link href="/admin/protocols" style={styles.backLink}>← Protocols</Link>
            <h1 style={styles.title}>{protocol.patient_name}</h1>
          </div>
          <div style={styles.headerActions}>
            <button onClick={sendPortalLink} disabled={sending} style={styles.sendBtn}>
              {sending ? 'Sending...' : '📱 Send Portal Link'}
            </button>
            <a 
              href={`/portal/${protocol.access_token}`} 
              target="_blank" 
              rel="noopener"
              style={styles.viewBtn}
            >
              👁 View Portal
            </a>
          </div>
        </header>

        <main style={styles.main}>
          {/* Protocol Info */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Protocol Details</h2>
              <span style={{
                ...styles.statusBadge,
                background: protocol.status === 'active' ? '#dcfce7' : '#fef3c7',
                color: protocol.status === 'active' ? '#166534' : '#92400e'
              }}>
                {protocol.status}
              </span>
            </div>
            
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Protocol</span>
                <span style={styles.infoValue}>{protocol.protocol_name}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Medication</span>
                <span style={styles.infoValue}>{protocol.medication || '-'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Dosage</span>
                <span style={styles.infoValue}>{protocol.dosage || '-'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Frequency</span>
                <span style={styles.infoValue}>{formatFrequency(protocol.frequency)}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Delivery</span>
                <span style={styles.infoValue}>{protocol.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Start Date</span>
                <span style={styles.infoValue}>{formatDate(protocol.start_date)}</span>
              </div>
              {protocol.end_date && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>End Date</span>
                  <span style={styles.infoValue}>{formatDate(protocol.end_date)}</span>
                </div>
              )}
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Progress</span>
                <span style={styles.infoValue}>
                  {completedCount} / {protocol.total_sessions || sessions.length || '∞'} completed
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div style={styles.contactRow}>
              {protocol.patient_phone && (
                <>
                  <a href={`tel:${protocol.patient_phone}`} style={styles.contactLink}>📞 {protocol.patient_phone}</a>
                  <a href={`sms:${protocol.patient_phone}`} style={styles.contactLink}>💬 Text</a>
                </>
              )}
              {protocol.patient_email && (
                <a href={`mailto:${protocol.patient_email}`} style={styles.contactLink}>✉️ {protocol.patient_email}</a>
              )}
            </div>
          </section>

          {/* Supply Tracking (HRT) */}
          {protocol.supply_type && (
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Supply Status</h2>
              <div style={styles.supplyInfo}>
                <div style={styles.supplyMain}>
                  <span style={styles.supplyValue}>{protocol.supply_remaining || 0}</span>
                  <span style={styles.supplyLabel}>
                    {protocol.supply_type === 'vial' ? 'ml remaining' : 'injections remaining'}
                  </span>
                </div>
                {protocol.supply_dispensed_date && (
                  <div style={styles.supplyMeta}>
                    Dispensed: {formatDate(protocol.supply_dispensed_date)}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Dose Tracking (Weight Loss) */}
          {protocol.current_dose && (
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Titration Tracking</h2>
              <div style={styles.doseInfo}>
                <div>
                  <span style={styles.doseValue}>{protocol.current_dose}</span>
                  <span style={styles.doseLabel}>Current Dose</span>
                </div>
                <div>
                  <span style={styles.doseValue}>{protocol.injections_at_current_dose || 0}</span>
                  <span style={styles.doseLabel}>Injections at this dose</span>
                </div>
              </div>
              {protocol.injections_at_current_dose >= 4 && (
                <div style={styles.titrationAlert}>
                  ⚠️ Consider titration - 4+ injections at current dose
                </div>
              )}
            </section>
          )}

          {/* Lab Status */}
          {(protocol.baseline_labs_due || protocol.followup_labs_due) && (
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Lab Work</h2>
              <div style={styles.labList}>
                <div style={styles.labItem}>
                  <span style={protocol.baseline_labs_completed ? styles.labDone : styles.labPending}>
                    {protocol.baseline_labs_completed ? '✓' : '○'}
                  </span>
                  <span>Baseline Labs</span>
                  {protocol.baseline_labs_date && (
                    <span style={styles.labDate}>{formatDate(protocol.baseline_labs_date)}</span>
                  )}
                  {!protocol.baseline_labs_completed && (
                    <button 
                      onClick={() => markLabComplete('baseline')}
                      style={styles.markLabBtn}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
                <div style={styles.labItem}>
                  <span style={protocol.followup_labs_completed ? styles.labDone : styles.labPending}>
                    {protocol.followup_labs_completed ? '✓' : '○'}
                  </span>
                  <span>Follow-up Labs</span>
                  {protocol.followup_labs_due && !protocol.followup_labs_completed && (
                    <span style={styles.labDate}>Due: {formatDate(protocol.followup_labs_due)}</span>
                  )}
                  {!protocol.followup_labs_completed && (
                    <button 
                      onClick={() => markLabComplete('followup')}
                      style={styles.markLabBtn}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Sessions / Injections */}
          {sessions.length > 0 && (
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>
                  {protocol.protocol_name?.includes('Recovery') ? 'Injections' : 'Sessions'}
                </h2>
                {protocol.end_date && (
                  <button onClick={extendProtocol} style={styles.extendBtn}>+ Extend</button>
                )}
              </div>
              <div style={styles.sessionGrid}>
                {sessions.map((s, i) => {
                  const isPast = s.scheduled_date < today;
                  const isToday = s.scheduled_date === today;
                  const done = s.status === 'completed';
                  
                  return (
                    <button
                      key={s.id || i}
                      onClick={() => markSession(s.id, done ? 'scheduled' : 'completed')}
                      style={{
                        ...styles.sessionCard,
                        background: done ? '#000' : '#fff',
                        color: done ? '#fff' : '#000',
                        borderColor: isToday ? '#000' : '#e5e5e5',
                        borderWidth: isToday ? '2px' : '1px'
                      }}
                    >
                      <div style={styles.sessionNum}>Day {s.session_number}</div>
                      <div style={styles.sessionDate}>{formatDateShort(s.scheduled_date)}</div>
                      {done && <div style={styles.sessionCheck}>✓</div>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Symptom Check-ins */}
          {checkins.length > 0 && (
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Symptom History</h2>
              <div style={styles.checkinList}>
                {checkins.map((c, i) => (
                  <div key={c.id || i} style={styles.checkinItem}>
                    <div style={styles.checkinDate}>{formatDate(c.checkin_date)}</div>
                    <div style={styles.checkinScores}>
                      {c.pain_score != null && <span>Pain: {c.pain_score}</span>}
                      {c.mobility_score != null && <span>Mobility: {c.mobility_score}</span>}
                      {c.energy_score != null && <span>Energy: {c.energy_score}</span>}
                      {c.sleep_score != null && <span>Sleep: {c.sleep_score}</span>}
                      {c.weight != null && <span>Weight: {c.weight} lbs</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {protocol.notes && (
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Notes</h2>
              <p style={styles.notes}>{protocol.notes}</p>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFrequency(f) {
  const map = {
    daily: 'Daily',
    '2x_daily': 'Twice daily',
    '2x_weekly': '2x per week',
    weekly: 'Weekly',
    per_session: 'Per session'
  };
  return map[f] || f || '-';
}

const styles = {
  container: { minHeight: '100vh', background: '#f5f5f5', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
  loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  error: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' },

  header: { background: '#000', color: '#fff', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backLink: { color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' },
  title: { fontSize: '20px', fontWeight: '600', margin: '4px 0 0' },
  headerActions: { display: 'flex', gap: '12px' },
  sendBtn: { padding: '8px 16px', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  viewBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', textDecoration: 'none' },

  main: { maxWidth: '900px', margin: '0 auto', padding: '24px' },

  card: { background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardTitle: { fontSize: '16px', fontWeight: '600', margin: 0 },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' },

  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  infoItem: { display: 'flex', flexDirection: 'column' },
  infoLabel: { fontSize: '12px', color: '#666', marginBottom: '4px' },
  infoValue: { fontSize: '15px', fontWeight: '500' },

  contactRow: { display: 'flex', gap: '24px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' },
  contactLink: { color: '#000', textDecoration: 'none', fontSize: '14px' },

  supplyInfo: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  supplyMain: { display: 'flex', alignItems: 'baseline', gap: '8px' },
  supplyValue: { fontSize: '36px', fontWeight: '700' },
  supplyLabel: { fontSize: '14px', color: '#666' },
  supplyMeta: { fontSize: '13px', color: '#666' },

  doseInfo: { display: 'flex', gap: '48px' },
  doseValue: { display: 'block', fontSize: '28px', fontWeight: '700' },
  doseLabel: { display: 'block', fontSize: '13px', color: '#666' },
  titrationAlert: { marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '8px', fontSize: '14px', color: '#92400e' },

  labList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  labItem: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' },
  labDone: { color: '#16a34a', fontSize: '18px' },
  labPending: { color: '#999', fontSize: '18px' },
  labDate: { color: '#666', marginLeft: 'auto' },
  markLabBtn: { padding: '4px 12px', background: '#f5f5f5', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' },

  extendBtn: { padding: '6px 12px', background: '#f5f5f5', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  sessionGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' },
  sessionCard: { padding: '12px', border: '1px solid', borderRadius: '8px', cursor: 'pointer', textAlign: 'center' },
  sessionNum: { fontSize: '13px', fontWeight: '600' },
  sessionDate: { fontSize: '11px', opacity: 0.7, marginTop: '2px' },
  sessionCheck: { marginTop: '4px' },

  checkinList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  checkinItem: { padding: '12px', background: '#fafafa', borderRadius: '8px' },
  checkinDate: { fontSize: '13px', fontWeight: '600', marginBottom: '8px' },
  checkinScores: { display: 'flex', gap: '16px', fontSize: '13px', color: '#666', flexWrap: 'wrap' },

  notes: { fontSize: '14px', color: '#666', margin: 0, lineHeight: 1.6 }
};
