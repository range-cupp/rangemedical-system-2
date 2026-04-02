// /components/WeightLossPipelineTab.js
// Weight Loss Sales Pipeline — Kanban view by patient lifecycle stage
// Range Medical
// CREATED: 2026-04-01

import { useState, useEffect } from 'react';
import Link from 'next/link';

const WL_STAGES = [
  { id: 'new_start', label: 'New Start', color: '#8b5cf6', description: 'First 14 days' },
  { id: 'active', label: 'Active', color: '#10b981', description: 'On track' },
  { id: 'needs_refill', label: 'Needs Refill', color: '#f59e0b', description: 'Supply low or out' },
  { id: 'lapsed', label: 'Lapsed', color: '#ef4444', description: '10+ days no activity' },
  { id: 'renewal_due', label: 'Renewal Due', color: '#3b82f6', description: 'Protocol ending soon' },
  { id: 'completed', label: 'Completed', color: '#6b7280', description: 'Finished or paused' },
];

function categorizeProtocol(p) {
  if (p.status === 'completed' || p.status === 'paused') return 'completed';

  const daysSinceStart = p.days_since_start || 0;
  const remaining = p.injections_remaining ?? (p.total_injections - p.injections_used);
  const daysSinceLastActivity = Math.min(
    p.days_since_last_injection ?? 999,
    p.days_since_last_checkin ?? 999
  );

  // Lapsed: no activity in 10+ days
  if (daysSinceLastActivity >= 10 && daysSinceStart > 14) return 'lapsed';

  // Needs refill: 1 or fewer injections remaining
  if (remaining <= 1 && remaining >= 0) return 'needs_refill';

  // Renewal due: protocol ending within 14 days (based on end_date) or low supply
  if (p.end_date) {
    const daysUntilEnd = Math.floor((new Date(p.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilEnd <= 14 && daysUntilEnd > 0) return 'renewal_due';
    if (daysUntilEnd <= 0) return 'needs_refill';
  }

  // New start: within first 14 days
  if (daysSinceStart <= 14) return 'new_start';

  return 'active';
}

function getMonthNumber(daysSinceStart) {
  if (!daysSinceStart || daysSinceStart < 0) return 1;
  return Math.floor(daysSinceStart / 30) + 1;
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function WeightLossPipelineTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [smsState, setSmsState] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pipelines/weight-loss');
      const json = await res.json();
      if (json.success) setData(json);
    } catch (err) {
      console.error('Error fetching WL pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = async (patientId, patientName, phone, message) => {
    setSmsState(prev => ({ ...prev, [patientId]: { ...prev[patientId], sending: true, error: null } }));
    try {
      const res = await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, patient_name: patientName, to: phone, message, message_type: 'weight_loss_follow_up' })
      });
      const result = await res.json();
      if (result.success || result.messageSid) {
        setSmsState(prev => ({ ...prev, [patientId]: { sending: false, sent: true, open: false } }));
        setTimeout(() => setSmsState(prev => ({ ...prev, [patientId]: { ...prev[patientId], sent: false } })), 3000);
      } else {
        setSmsState(prev => ({ ...prev, [patientId]: { ...prev[patientId], sending: false, error: result.error || 'Failed' } }));
      }
    } catch (err) {
      setSmsState(prev => ({ ...prev, [patientId]: { ...prev[patientId], sending: false, error: err.message } }));
    }
  };

  if (loading) return <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading weight loss pipeline...</div>;
  if (!data) return <div style={{ padding: '60px 20px', textAlign: 'center', color: '#ef4444', fontSize: '14px' }}>Error loading weight loss pipeline</div>;

  // Categorize protocols into stages
  const stages = {};
  WL_STAGES.forEach(s => { stages[s.id] = []; });

  (data.protocols || []).forEach(p => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const name = (p.patient_name || '').toLowerCase();
      const med = (p.medication || '').toLowerCase();
      if (!name.includes(term) && !med.includes(term)) return;
    }
    const stage = categorizeProtocol(p);
    if (stages[stage]) stages[stage].push(p);
  });

  const activeCount = data.protocols.filter(p => p.status !== 'completed' && p.status !== 'paused').length;
  const needsAttention = stages.needs_refill.length + stages.lapsed.length + stages.renewal_due.length;

  // Medication color mapping
  const medColor = (med) => {
    const m = (med || '').toLowerCase();
    if (m.includes('semaglutide')) return { bg: '#dbeafe', text: '#1e40af' };
    if (m.includes('tirzepatide')) return { bg: '#fce7f3', text: '#9d174d' };
    if (m.includes('retatrutide')) return { bg: '#e0e7ff', text: '#4338ca' };
    return { bg: '#f3f4f6', text: '#374151' };
  };

  return (
    <div>
      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#3b82f6' }}>{data.total}</div>
          <div style={styles.statLabel}>Total</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#10b981' }}>{activeCount}</div>
          <div style={styles.statLabel}>Active</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: needsAttention > 0 ? '#f59e0b' : '#22c55e' }}>{needsAttention}</div>
          <div style={styles.statLabel}>Needs Attention</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#6b7280' }}>{data.completed}</div>
          <div style={styles.statLabel}>Completed</div>
        </div>
      </div>

      {/* Search + Refresh */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by name or medication..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <button style={styles.refreshBtn} onClick={fetchData} disabled={loading}>\u21BB Refresh</button>
      </div>

      {/* Kanban Pipeline */}
      <div style={styles.pipelineGrid}>
        {WL_STAGES.map(stage => {
          const items = stages[stage.id] || [];
          return (
            <div key={stage.id} style={styles.pipelineColumn}>
              {/* Column Header */}
              <div style={{ ...styles.columnHeader, borderTop: `3px solid ${stage.color}` }}>
                <div style={styles.columnHeaderLeft}>
                  <span style={styles.columnLabel}>{stage.label}</span>
                </div>
                <span style={styles.columnCount}>{items.length}</span>
              </div>

              {/* Cards */}
              <div style={styles.columnBody}>
                {items.map(protocol => {
                  const mc = medColor(protocol.medication);
                  const month = getMonthNumber(protocol.days_since_start);
                  const weightLost = protocol.starting_weight && protocol.current_weight
                    ? (protocol.starting_weight - protocol.current_weight).toFixed(1)
                    : null;
                  const firstName = (protocol.patient_name || '').split(' ')[0];
                  const sms = smsState[protocol.patient_id] || {};

                  return (
                    <div key={protocol.id} style={styles.pipelineCard}>
                      {/* Name + Phone */}
                      <div style={styles.cardTop}>
                        <Link href={`/admin/patient/${protocol.patient_id}`} style={styles.cardName}>
                          {protocol.patient_name}
                        </Link>
                        {protocol.phone && (
                          <a href={`tel:${protocol.phone}`} style={{ fontSize: '13px', textDecoration: 'none', opacity: 0.6 }}>\ud83d\udcde</a>
                        )}
                      </div>

                      {/* Medication + Month badge */}
                      <div style={styles.cardBadges}>
                        <span style={{ ...styles.medBadge, background: mc.bg, color: mc.text }}>
                          {protocol.medication || 'GLP-1'}
                        </span>
                        <span style={styles.monthBadge}>Month {month}</span>
                      </div>

                      {/* Dose */}
                      <div style={styles.cardDetail}>
                        <span style={styles.detailLabel}>Dose</span>
                        <span style={styles.detailValue}>{protocol.current_dose || '\u2014'}</span>
                      </div>

                      {/* Injections */}
                      <div style={styles.cardDetail}>
                        <span style={styles.detailLabel}>Injections</span>
                        <span style={styles.detailValue}>{protocol.injections_used}/{protocol.total_injections}</span>
                      </div>

                      {/* Weight Progress */}
                      {(protocol.starting_weight || protocol.current_weight) && (
                        <div style={styles.cardDetail}>
                          <span style={styles.detailLabel}>Weight</span>
                          <span style={styles.detailValue}>
                            {protocol.starting_weight ? `${protocol.starting_weight}` : '?'}
                            {' \u2192 '}
                            {protocol.current_weight ? `${protocol.current_weight}` : '?'}
                            {weightLost && Number(weightLost) > 0 && (
                              <span style={{ color: '#16a34a', fontWeight: 600, marginLeft: '4px' }}>\u2193{weightLost}</span>
                            )}
                            {weightLost && Number(weightLost) < 0 && (
                              <span style={{ color: '#dc2626', fontWeight: 600, marginLeft: '4px' }}>\u2191{Math.abs(Number(weightLost))}</span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Last Activity */}
                      <div style={styles.cardDetail}>
                        <span style={styles.detailLabel}>Last Activity</span>
                        <span style={{
                          ...styles.detailValue,
                          color: (protocol.days_since_last_injection ?? 999) > 10 ? '#ef4444' : '#374151'
                        }}>
                          {protocol.last_activity ? formatDate(protocol.last_activity) : 'No activity'}
                          {protocol.days_since_last_injection != null && (
                            <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '4px' }}>
                              ({protocol.days_since_last_injection}d ago)
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Delivery method */}
                      <div style={{ marginTop: '6px', marginBottom: '4px' }}>
                        <span style={{
                          ...styles.deliveryBadge,
                          background: protocol.delivery_method === 'in_clinic' ? '#f0fdf4' : '#faf5ff',
                          color: protocol.delivery_method === 'in_clinic' ? '#166534' : '#7c3aed',
                          borderColor: protocol.delivery_method === 'in_clinic' ? '#bbf7d0' : '#ddd6fe',
                        }}>
                          {protocol.delivery_method === 'in_clinic' ? 'In-Clinic' : 'Take Home'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={styles.cardActions}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <Link href={`/admin/patient/${protocol.patient_id}`} style={styles.viewBtn}>View</Link>
                          {protocol.phone && (
                            sms.sent ? (
                              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, padding: '5px 8px' }}>Sent \u2713</span>
                            ) : (
                              <button
                                style={styles.textBtn}
                                onClick={() => {
                                  const msg = stage.id === 'needs_refill'
                                    ? `Hi ${firstName}! This is Range Medical. You're running low on your ${protocol.medication || 'weight loss'} supply. Would you like to schedule your next refill? Text or call us at (949) 997-3988!`
                                    : stage.id === 'lapsed'
                                    ? `Hi ${firstName}! This is Range Medical. We noticed it's been a bit since your last check-in. How are you feeling on your ${protocol.medication || 'weight loss'} program? We're here if you need anything \u2014 text or call us at (949) 997-3988!`
                                    : stage.id === 'renewal_due'
                                    ? `Hi ${firstName}! This is Range Medical. Your current ${protocol.medication || 'weight loss'} protocol is wrapping up soon. Would you like to continue? Let us know and we'll get your renewal set up!`
                                    : `Hi ${firstName}! This is Range Medical. Just checking in on your ${protocol.medication || 'weight loss'} program. How's everything going? Let us know if you have any questions!`;
                                  setSmsState(prev => ({
                                    ...prev,
                                    [protocol.patient_id]: { open: !prev[protocol.patient_id]?.open, message: prev[protocol.patient_id]?.message || msg }
                                  }));
                                }}
                              >
                                Text
                              </button>
                            )
                          )}
                        </div>

                        {/* Inline SMS Composer */}
                        {sms.open && (
                          <div style={styles.smsComposer}>
                            <textarea
                              style={styles.smsTextarea}
                              value={sms.message || ''}
                              onChange={(e) => setSmsState(prev => ({ ...prev, [protocol.patient_id]: { ...prev[protocol.patient_id], message: e.target.value } }))}
                              placeholder={`Message to ${firstName}...`}
                            />
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                style={styles.smsCancel}
                                onClick={() => setSmsState(prev => ({ ...prev, [protocol.patient_id]: { ...prev[protocol.patient_id], open: false } }))}
                              >
                                Cancel
                              </button>
                              <button
                                style={{ ...styles.smsSendBtn, opacity: sms.message?.trim() ? 1 : 0.5 }}
                                disabled={!sms.message?.trim() || sms.sending}
                                onClick={() => handleSendSMS(protocol.patient_id, protocol.patient_name, protocol.phone, sms.message)}
                              >
                                {sms.sending ? 'Sending...' : 'Send'}
                              </button>
                            </div>
                            {sms.error && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{sms.error}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div style={styles.emptyColumn}>No patients</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = {
  summaryGrid: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 24px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    minWidth: '110px',
    flex: '1 0 110px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    marginTop: '6px',
  },
  searchInput: {
    padding: '8px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    width: '260px',
    outline: 'none',
  },
  refreshBtn: {
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  pipelineGrid: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '16px',
    minHeight: '400px',
  },
  pipelineColumn: {
    minWidth: '240px',
    flex: '1 0 240px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    maxHeight: 'calc(100vh - 300px)',
  },
  columnHeader: {
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e5e7eb',
    background: '#fff',
    borderRadius: '8px 8px 0 0',
  },
  columnHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  columnLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111',
  },
  columnCount: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    background: '#e5e7eb',
    padding: '2px 8px',
    borderRadius: '10px',
    minWidth: '24px',
    textAlign: 'center',
  },
  columnBody: {
    padding: '8px',
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  emptyColumn: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '32px 12px',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  pipelineCard: {
    background: '#fff',
    borderRadius: '6px',
    padding: '12px',
    border: '1px solid #e5e7eb',
    transition: 'box-shadow 0.15s',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '6px',
  },
  cardName: {
    fontWeight: '600',
    fontSize: '13px',
    color: '#111',
    textDecoration: 'none',
    lineHeight: 1.3,
  },
  cardBadges: {
    display: 'flex',
    gap: '4px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  medBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '3px',
    letterSpacing: '0.2px',
  },
  monthBadge: {
    fontSize: '11px',
    fontWeight: '500',
    padding: '2px 8px',
    borderRadius: '3px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
  },
  cardDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '3px 0',
  },
  detailLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  detailValue: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#374151',
  },
  deliveryBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '3px',
    border: '1px solid transparent',
    letterSpacing: '0.2px',
    textTransform: 'uppercase',
  },
  cardActions: {
    paddingTop: '8px',
    borderTop: '1px solid #f3f4f6',
    marginTop: '6px',
  },
  viewBtn: {
    padding: '5px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '500',
    color: '#374151',
    textDecoration: 'none',
    display: 'inline-block',
  },
  textBtn: {
    padding: '5px 10px',
    border: '1px solid #dbeafe',
    borderRadius: '4px',
    background: '#eff6ff',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '500',
    color: '#1e40af',
  },
  smsComposer: {
    marginTop: '8px',
    padding: '8px',
    background: '#f9fafb',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
  },
  smsTextarea: {
    width: '100%',
    padding: '8px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    fontSize: '12px',
    minHeight: '60px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    marginBottom: '6px',
  },
  smsCancel: {
    padding: '4px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '11px',
    color: '#6b7280',
  },
  smsSendBtn: {
    padding: '4px 12px',
    border: 'none',
    borderRadius: '4px',
    background: '#1e40af',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
  },
};
