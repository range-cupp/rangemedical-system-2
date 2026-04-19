// PipelineCard — single kanban card on a pipeline board.
// Editorial v2 aesthetic: flat, 1px border, no rounded corners, Inter, uppercase labels.
// Range Medical System V2

import { getStaff, initials } from '../../lib/staff';

const FIELD_LABELS = {
  medication:          'Med',
  dose:                'Dose',
  administration_mode: 'Delivery',
  sessions_used:       'Sessions',
  total_sessions:      'Total',
  injection_type:      'Type',
  target:              'Target',
  lab_type:            'Lab',
  source:              'Source',
  path:                'Path',
  urgency:             'Urgency',
  reason:              'Reason',
};

const ADMIN_MODE_LABELS = { take_home: 'Take Home', in_clinic: 'In Clinic' };

function daysSince(iso) {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function fullName(card) {
  if (card.patient_name) return card.patient_name;
  const fn = (card.first_name || '').trim();
  const ln = (card.last_name  || '').trim();
  const full = `${fn} ${ln}`.trim();
  return full || '(Unnamed)';
}

function formatFieldValue(key, card) {
  const meta = card.meta || {};
  if (key === 'medication')          return meta.medication || null;
  if (key === 'dose')                return meta.dose || null;
  if (key === 'administration_mode') return ADMIN_MODE_LABELS[meta.administration_mode] || null;
  if (key === 'sessions_used') {
    const u = meta.sessions_used, t = meta.total_sessions;
    if (u == null) return null;
    return t != null ? `${u} / ${t}` : String(u);
  }
  if (key === 'total_sessions')    return null; // rendered via sessions_used
  if (key === 'injection_type')    return meta.injection_type ? meta.injection_type.toUpperCase() : null;
  if (key === 'target')            return meta.target || null;
  if (key === 'lab_type')          return meta.lab_type || null;
  if (key === 'source')            return card.source || null;
  if (key === 'path')              return card.path || null;
  if (key === 'urgency')           return card.urgency != null ? `${card.urgency}/10` : null;
  if (key === 'reason')            return meta.reason || null;
  return null;
}

export default function PipelineCard({ card, pipeline, onClick }) {
  const days = daysSince(card.entered_stage_at);
  const fields = (pipeline?.cardFields || [])
    .map(k => ({ key: k, label: FIELD_LABELS[k] || k, value: formatFieldValue(k, card) }))
    .filter(f => f.value);

  return (
    <div
      onClick={() => onClick?.(card)}
      style={styles.card}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
    >
      <div style={styles.name}>{fullName(card)}</div>

      {fields.length > 0 && (
        <div style={styles.fields}>
          {fields.map(f => (
            <div key={f.key} style={styles.field}>
              <span style={styles.fieldLabel}>{f.label}</span>
              <span style={styles.fieldValue}>{f.value}</span>
            </div>
          ))}
        </div>
      )}

      <div style={styles.footer}>
        <div style={styles.days}>{days === 0 ? 'Today' : `${days}d in stage`}</div>
        <div style={styles.avatars}>
          {(card.assigned_to || []).slice(0, 3).map((id) => {
            const s = getStaff(id);
            return (
              <div
                key={id}
                style={{ ...styles.avatar, background: s.color }}
                title={`${s.name} · ${s.role}`}
              >
                {initials(s.name)}
              </div>
            );
          })}
          {(card.assigned_to?.length || 0) > 3 && (
            <div style={{ ...styles.avatar, background: '#737373' }}>
              +{card.assigned_to.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: 0,
    padding: '14px 14px 12px',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  name: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1a1a1a',
    letterSpacing: '-0.01em',
    lineHeight: 1.25,
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  field: {
    display: 'flex',
    gap: '8px',
    fontSize: '11px',
    alignItems: 'baseline',
  },
  fieldLabel: {
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#a0a0a0',
    fontSize: '10px',
    minWidth: '56px',
    flexShrink: 0,
  },
  fieldValue: {
    color: '#404040',
    fontWeight: 600,
    fontSize: '12px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid #f0f0f0',
    marginTop: '2px',
  },
  days: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#737373',
  },
  avatars: {
    display: 'flex',
    gap: '-4px',
  },
  avatar: {
    width: '22px',
    height: '22px',
    borderRadius: 0,
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '-2px',
    border: '1px solid #ffffff',
  },
};
