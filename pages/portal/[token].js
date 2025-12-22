// /pages/portal/[token].js
// Patient Portal - All Protocols View
// Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function PatientPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [showCheckin, setShowCheckin] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = window.location.pathname.split('/').pop();
    setToken(t);
    if (t) fetchData(t);
  }, []);

  const fetchData = async (t) => {
    try {
      const res = await fetch(`/api/patient-portal/${t}`);
      if (!res.ok) throw new Error('Unable to load your information');
      const json = await res.json();
      setData(json);
      if (json.protocols?.length && !selectedProtocol) {
        setSelectedProtocol(json.protocols[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markSession = async (protocolId, sessionNumber) => {
    try {
      await fetch(`/api/patient-portal/${token}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocol_id: protocolId, session_number: sessionNumber })
      });
      fetchData(token);
    } catch (err) {
      console.error(err);
    }
  };

  const submitCheckin = async (protocolId, type, scores) => {
    try {
      await fetch(`/api/patient-portal/${token}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocol_id: protocolId, checkin_type: type, ...scores })
      });
      setShowCheckin(null);
      fetchData(token);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={styles.loading}><div style={styles.spinner} /></div>;
  }

  if (error) {
    return (
      <div style={styles.errorPage}>
        <h1>Something went wrong</h1>
        <p>{error}</p>
        <p>Please contact Range Medical at (949) 997-3988</p>
      </div>
    );
  }

  const firstName = data?.patient?.first_name || 'there';
  const protocols = data?.protocols || [];

  return (
    <>
      <Head>
        <title>My Health Portal | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#000" />
        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
          input[type="range"] { -webkit-appearance: none; width: 100%; height: 8px; border-radius: 4px; background: #e5e5e5; }
          input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #000; cursor: pointer; }
        `}</style>
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo}>RANGE</div>
          <div style={styles.greeting}>Hi, {firstName}</div>
        </header>

        {protocols.length > 1 && (
          <div style={styles.protocolTabs}>
            {protocols.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProtocol(p)}
                style={selectedProtocol?.id === p.id ? styles.tabActive : styles.tab}
              >
                <span style={styles.tabName}>{p.protocol_name}</span>
                <span style={styles.tabStatus}>{p.total_sessions ? `${p.sessions_completed}/${p.total_sessions}` : 'Active'}</span>
              </button>
            ))}
          </div>
        )}

        {selectedProtocol && (
          <main style={styles.main}>
            <ProtocolView 
              protocol={selectedProtocol}
              onMarkSession={markSession}
              onCheckin={() => setShowCheckin(selectedProtocol)}
            />
          </main>
        )}

        <footer style={styles.footer}>
          <a href="sms:9499973988" style={styles.footerLink}>💬 Message</a>
          <span style={styles.footerDot}>•</span>
          <a href="tel:9499973988" style={styles.footerLink}>📞 Call</a>
        </footer>

        {showCheckin && (
          <CheckinModal 
            protocol={showCheckin}
            onSubmit={(scores) => submitCheckin(showCheckin.id, showCheckin.checkin_type, scores)}
            onClose={() => setShowCheckin(null)}
          />
        )}
      </div>
    </>
  );
}

function ProtocolView({ protocol, onMarkSession, onCheckin }) {
  const sessions = protocol.sessions || [];
  const today = new Date().toISOString().split('T')[0];
  const isPeptide = protocol.category === 'peptide';
  const isHRT = protocol.category === 'hrt';
  const isWeightLoss = protocol.category === 'weight_loss';
  const isTherapy = protocol.category === 'therapy';

  const checkinDue = protocol.checkin_due;

  return (
    <>
      <section style={styles.card}>
        <div style={styles.protocolHeader}>
          <div>
            <h2 style={styles.protocolTitle}>{protocol.protocol_name}</h2>
            <p style={styles.protocolMed}>{protocol.medication}</p>
            <p style={styles.protocolDose}>{protocol.dosage} • {formatFreq(protocol.frequency)}</p>
          </div>
          {protocol.total_sessions && (
            <div style={styles.progressCircle}>
              <span style={styles.progressNum}>{protocol.sessions_completed}</span>
              <span style={styles.progressDenom}>/{protocol.total_sessions}</span>
            </div>
          )}
        </div>
        <div style={styles.dateRow}>
          <div><span style={styles.dateLabel}>Started</span><span style={styles.dateValue}>{formatDate(protocol.start_date)}</span></div>
          {protocol.end_date && <div><span style={styles.dateLabel}>Ends</span><span style={styles.dateValue}>{formatDate(protocol.end_date)}</span></div>}
          <div><span style={styles.dateLabel}>{protocol.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home'}</span></div>
        </div>
      </section>

      {checkinDue && (
        <button style={styles.checkinPrompt} onClick={onCheckin}>
          <span>📋</span>
          <div><div style={styles.checkinTitle}>Symptom Check-in Due</div><div style={styles.checkinSub}>Tap to log how you're feeling</div></div>
          <span>→</span>
        </button>
      )}

      {(isPeptide || isTherapy) && sessions.length > 0 && (
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>{isTherapy ? 'Your Sessions' : 'Your Injections'}</h3>
          <div style={styles.calendar}>
            {sessions.map((s, i) => {
              const isFuture = s.scheduled_date > today;
              const isToday = s.scheduled_date === today;
              const done = s.status === 'completed';
              return (
                <button
                  key={i}
                  onClick={() => !isFuture && onMarkSession(protocol.id, s.session_number)}
                  disabled={isFuture}
                  style={{
                    ...styles.calDay,
                    background: done ? '#000' : isFuture ? '#fafafa' : '#fff',
                    color: done ? '#fff' : isFuture ? '#ccc' : '#000',
                    borderColor: isToday ? '#000' : '#e5e5e5',
                    borderWidth: isToday ? '2px' : '1px',
                    cursor: isFuture ? 'default' : 'pointer'
                  }}
                >
                  <span style={styles.calNum}>{isPeptide ? `Day ${s.session_number}` : `#${s.session_number}`}</span>
                  {done && <span>✓</span>}
                </button>
              );
            })}
          </div>
          <p style={styles.calHint}>Tap to mark complete</p>
        </section>
      )}

      {isHRT && (
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Supply</h3>
          <div style={styles.supplyRow}>
            <div><span style={styles.supplyVal}>{protocol.supply_remaining || '?'}</span><span style={styles.supplyLabel}>{protocol.supply_type === 'vial' ? 'ml left' : 'injections left'}</span></div>
          </div>
          <button style={styles.logBtn} onClick={() => onMarkSession(protocol.id, null)}>Log Injection</button>
        </section>
      )}

      {isWeightLoss && (
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Current Dose</h3>
          <div><span style={styles.doseVal}>{protocol.current_dose}</span><span style={styles.doseLabel}>Injection {protocol.injections_at_current_dose || 0} of 4</span></div>
          <button style={styles.logBtn} onClick={() => onMarkSession(protocol.id, null)}>Log Injection</button>
        </section>
      )}

      {(isHRT || isWeightLoss) && (
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Lab Work</h3>
          <div style={styles.labRow}>
            <span>{protocol.baseline_labs_completed ? '✓' : '○'} Baseline</span>
            <span>{protocol.followup_labs_completed ? '✓' : '○'} Follow-up {protocol.followup_labs_due && !protocol.followup_labs_completed && `(Due ${formatDate(protocol.followup_labs_due)})`}</span>
          </div>
        </section>
      )}
    </>
  );
}

function CheckinModal({ protocol, onSubmit, onClose }) {
  const type = protocol.checkin_type || 'recovery';
  const fields = FIELDS[type] || FIELDS.recovery;
  const [scores, setScores] = useState(fields.reduce((a, f) => ({ ...a, [f.key]: 5 }), {}));
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    await onSubmit({ ...scores, weight: weight ? parseFloat(weight) : null });
    setSaving(false);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>How are you feeling?</h2>
          <p style={styles.modalSub}>{protocol.protocol_name}</p>
        </div>
        <div style={styles.modalBody}>
          {fields.map(f => (
            <div key={f.key} style={styles.sliderGroup}>
              <div style={styles.sliderHead}><span>{f.label}</span><span style={{fontWeight:700}}>{scores[f.key]}/10</span></div>
              <input type="range" min="0" max="10" value={scores[f.key]} onChange={e => setScores({...scores, [f.key]: parseInt(e.target.value)})} />
              <div style={styles.sliderLabels}><span>{f.low}</span><span>{f.high}</span></div>
            </div>
          ))}
          {type === 'weight_loss' && (
            <div><label style={{fontSize:'15px',display:'block',marginBottom:'8px'}}>Weight (lbs)</label><input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="185" style={styles.weightInput}/></div>
          )}
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

const FIELDS = {
  recovery: [
    { key: 'pain_score', label: 'Pain', low: 'Severe', high: 'None' },
    { key: 'mobility_score', label: 'Mobility', low: 'Limited', high: 'Full' },
    { key: 'swelling_score', label: 'Swelling', low: 'Severe', high: 'None' },
    { key: 'sleep_score', label: 'Sleep', low: 'Poor', high: 'Great' }
  ],
  hrt: [
    { key: 'energy_score', label: 'Energy', low: 'Low', high: 'High' },
    { key: 'mood_score', label: 'Mood', low: 'Low', high: 'Great' },
    { key: 'libido_score', label: 'Libido', low: 'Low', high: 'High' },
    { key: 'sleep_score', label: 'Sleep', low: 'Poor', high: 'Great' }
  ],
  weight_loss: [
    { key: 'appetite_score', label: 'Appetite', low: 'Hungry', high: 'Satisfied' },
    { key: 'nausea_score', label: 'Nausea', low: 'Severe', high: 'None' },
    { key: 'energy_score', label: 'Energy', low: 'Low', high: 'High' },
    { key: 'cravings_score', label: 'Cravings', low: 'Intense', high: 'None' }
  ]
};

function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''; }
function formatFreq(f) { return { daily: 'Daily', '2x_daily': '2x Daily', '2x_weekly': '2x/week', weekly: 'Weekly', per_session: 'Per session' }[f] || f; }

const styles = {
  container: { minHeight: '100vh', paddingBottom: '80px' },
  loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '24px', height: '24px', border: '3px solid #eee', borderTopColor: '#000', borderRadius: '50%' },
  errorPage: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' },

  header: { background: '#000', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: '18px', fontWeight: '700', letterSpacing: '2px' },
  greeting: { fontSize: '15px', opacity: 0.9 },

  protocolTabs: { display: 'flex', overflowX: 'auto', gap: '8px', padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e5e5e5' },
  tab: { flexShrink: 0, padding: '10px 16px', background: '#f5f5f5', border: 'none', borderRadius: '8px', textAlign: 'left', cursor: 'pointer' },
  tabActive: { flexShrink: 0, padding: '10px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', textAlign: 'left', cursor: 'pointer' },
  tabName: { display: 'block', fontSize: '13px', fontWeight: '600' },
  tabStatus: { display: 'block', fontSize: '11px', opacity: 0.7, marginTop: '2px' },

  main: { padding: '16px', maxWidth: '600px', margin: '0 auto' },

  card: { background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardTitle: { fontSize: '12px', fontWeight: '600', margin: '0 0 16px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },

  protocolHeader: { display: 'flex', justifyContent: 'space-between' },
  protocolTitle: { fontSize: '20px', fontWeight: '700', margin: '0 0 4px' },
  protocolMed: { fontSize: '15px', color: '#333', margin: '0 0 2px' },
  protocolDose: { fontSize: '13px', color: '#666', margin: 0 },
  progressCircle: { background: '#f5f5f5', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  progressNum: { fontSize: '18px', fontWeight: '700' },
  progressDenom: { fontSize: '11px', color: '#666' },

  dateRow: { display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' },
  dateLabel: { display: 'block', fontSize: '11px', color: '#999', marginBottom: '2px' },
  dateValue: { fontSize: '14px', fontWeight: '500' },

  checkinPrompt: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '16px 20px', background: '#fef3c7', border: 'none', borderRadius: '12px', marginBottom: '16px', cursor: 'pointer', textAlign: 'left' },
  checkinTitle: { fontSize: '15px', fontWeight: '600', color: '#92400e' },
  checkinSub: { fontSize: '13px', color: '#a16207' },

  calendar: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' },
  calDay: { aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid', fontSize: '11px', fontWeight: '600' },
  calNum: { fontSize: '10px' },
  calHint: { fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '12px' },

  supplyRow: { marginBottom: '16px' },
  supplyVal: { display: 'block', fontSize: '32px', fontWeight: '700' },
  supplyLabel: { fontSize: '13px', color: '#666' },

  doseVal: { display: 'block', fontSize: '32px', fontWeight: '700' },
  doseLabel: { display: 'block', fontSize: '13px', color: '#666', marginBottom: '16px' },

  logBtn: { width: '100%', padding: '14px', background: '#000', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },

  labRow: { display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' },

  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px', textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0' },
  footerLink: { color: '#666', textDecoration: 'none', fontSize: '14px' },
  footerDot: { margin: '0 12px', color: '#ddd' },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { padding: '24px 24px 16px', borderBottom: '1px solid #f0f0f0' },
  modalTitle: { fontSize: '20px', fontWeight: '700', margin: 0 },
  modalSub: { fontSize: '14px', color: '#666', margin: '4px 0 0' },
  modalBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  sliderGroup: {},
  sliderHead: { display: 'flex', justifyContent: 'space-between', fontSize: '15px', marginBottom: '8px' },
  sliderLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#999', marginTop: '4px' },
  weightInput: { width: '100%', padding: '12px', fontSize: '18px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' },
  modalFooter: { padding: '16px 24px 32px', display: 'flex', gap: '12px' },
  cancelBtn: { flex: 1, padding: '14px', background: '#f5f5f5', border: 'none', borderRadius: '10px', fontSize: '15px', cursor: 'pointer' },
  saveBtn: { flex: 2, padding: '14px', background: '#000', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }
};
