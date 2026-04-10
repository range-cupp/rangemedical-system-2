// components/CycleProgressCard.js
// 90-Day Cycle Progress Card for peptide protocols
// Shared between patient profile and protocol detail page

import { useState, useEffect } from 'react';
import { isRecoveryPeptide, isGHPeptide, RECOVERY_CYCLE_MAX_DAYS, RECOVERY_CYCLE_OFF_DAYS, GH_CYCLE_MAX_DAYS, GH_CYCLE_OFF_DAYS } from '../lib/protocol-config';

function formatCycleDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' });
}

export default function CycleProgressCard({ protocol }) {
  const [cycleData, setCycleData] = useState(null);
  const [loading, setLoading] = useState(true);

  const medication = protocol?.medication || '';
  const cycleType = isRecoveryPeptide(medication) ? 'recovery' : isGHPeptide(medication) ? 'gh' : null;
  const maxDays = cycleType === 'gh' ? GH_CYCLE_MAX_DAYS : RECOVERY_CYCLE_MAX_DAYS;
  const offLabel = cycleType === 'gh' ? '4-week' : '2-week';
  const cycleLabel = cycleType === 'gh' ? 'Growth Hormone Peptide Cycle' : 'Recovery Peptide Cycle';

  useEffect(() => {
    if (!protocol?.patient_id || !cycleType) { setLoading(false); return; }
    fetch(`/api/protocols/cycle-info?patientId=${protocol.patient_id}&cycleType=${cycleType}`)
      .then(r => r.json())
      .then(data => { if (data.success) setCycleData(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [protocol?.patient_id, cycleType]);

  if (!cycleType || loading || !cycleData?.hasCycle) return null;

  const { cycleDaysUsed, daysRemaining, cycleExhausted, offPeriodEnds, subProtocols, cycleStartDate } = cycleData;
  const pct = Math.min(100, Math.round((cycleDaysUsed / maxDays) * 100));
  const barColor = pct < 60 ? '#22c55e' : pct < 85 ? '#f59e0b' : '#ef4444';

  const cycleEnd = new Date(cycleStartDate + 'T12:00:00');
  cycleEnd.setDate(cycleEnd.getDate() + maxDays);
  const cycleEndStr = cycleEnd.toISOString().split('T')[0];

  return (
    <div style={cycleStyles.card}>
      <h4 style={cycleStyles.title}>🔄 {cycleLabel}</h4>

      <div style={{ textAlign: 'center', margin: '16px 0 8px' }}>
        <span style={{ fontSize: '40px', fontWeight: '700', color: barColor, lineHeight: 1 }}>{cycleDaysUsed}</span>
        <span style={{ fontSize: '16px', fontWeight: '500', color: '#9ca3af', marginLeft: '4px' }}>/ {maxDays}</span>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>days used in cycle</div>
      </div>

      <div style={cycleStyles.barBg}>
        <div style={{ ...cycleStyles.barFill, width: `${pct}%`, background: barColor }} />
      </div>

      <div style={cycleStyles.dateRow}>
        <span>Started {formatCycleDate(cycleStartDate)}</span>
        <span>Ends {formatCycleDate(cycleEndStr)}</span>
      </div>

      <div style={{ fontSize: '13px', color: '#374151', marginTop: '10px', textAlign: 'center' }}>
        {cycleExhausted ? (
          <span style={{ color: '#ef4444', fontWeight: '600' }}>Cycle complete — {offLabel} off period recommended</span>
        ) : (
          <span><strong>{daysRemaining}</strong> days remaining</span>
        )}
      </div>

      {cycleExhausted && offPeriodEnds && (
        <div style={cycleStyles.offWarning}>
          Off period ends <strong>{formatCycleDate(offPeriodEnds)}</strong>
        </div>
      )}

      {subProtocols && subProtocols.length > 1 && (
        <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '12px', paddingTop: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>
            Protocols in this cycle
          </div>
          {subProtocols.map(sp => (
            <div key={sp.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0', color: '#374151' }}>
              <span>{sp.medication}</span>
              <span style={{ color: '#6b7280' }}>{sp.days}d · {formatCycleDate(sp.startDate)} — {formatCycleDate(sp.endDate)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const cycleStyles = {
  card: {
    background: '#f9fafb', borderRadius: '0', padding: '16px',
    marginTop: '12px', border: '1px solid #e5e7eb'
  },
  title: {
    fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: '0'
  },
  barBg: {
    height: '10px', background: '#e5e7eb', borderRadius: '0',
    overflow: 'hidden', margin: '10px 0'
  },
  barFill: {
    height: '100%', borderRadius: '0', transition: 'width 0.3s ease'
  },
  dateRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '11px', color: '#6b7280'
  },
  offWarning: {
    marginTop: '8px', padding: '8px 12px', background: '#fef3c7',
    borderRadius: '0', fontSize: '12px', color: '#92400e', textAlign: 'center'
  }
};
