// PipelineCard — single kanban card on a pipeline board.
// Editorial v2 aesthetic: flat, 1px border, no rounded corners, Inter, uppercase labels.
// Range Medical System V2

import { getStaff, initials } from '../../lib/staff';

const FIELD_LABELS = {
  program:             'Protocol',
  medication:          'Med',
  dose:                'Dose',
  administration_mode: 'Delivery',
  sessions_used:       'Sessions',
  total_sessions:      'Total',
  injection_type:      'Type',
  target:              'Target',
  lab_type:            'Lab',
  labs_drawn_at:       'Drawn',
  source:              'Source',
  path:                'Path',
  urgency:             'Urgency',
  progress:            'Progress',
  reason:              'Reason',
  supply:              'Supply',
  frequency:           'Freq',
  last_dispensed:      'Last',
  next_due:            'Next',
  last_payment:        'Paid',
  next_payment:        'Bills',
  payment:             'Billing',
};

const PAYMENT_STATUS_LABELS = {
  paid:       'Paid',
  active:     'Active',
  past_due:   'PAST DUE',
  unpaid:     'UNPAID',
  trialing:   'Trial',
  canceled:   'Canceled',
  succeeded:  'Paid',
  failed:     'Failed',
};

const ADMIN_MODE_LABELS = { take_home: 'Take Home', in_clinic: 'In Clinic' };

const SUPPLY_TYPE_LABELS = {
  prefilled_4week: 'Prefilled · 4wk',
  prefilled_2week: 'Prefilled · 2wk',
  prefilled:       'Prefilled',
  vial_5ml:        'Vial · 5ml',
  vial_10ml:       'Vial · 10ml',
  vial:            'Vial',
};

function formatShortDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(+d)) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function daysUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(+d)) return null;
  const now = new Date();
  now.setHours(0,0,0,0);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((target - now) / 86400000);
}

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
  const proto = card.protocol || {};
  if (key === 'program') {
    if (meta.duration_days) return `${meta.duration_days}-day`;
    if (meta.program_name)  return meta.program_name;
    return null;
  }
  if (key === 'medication')          return meta.medication || proto.medication || null;
  if (key === 'dose')                return meta.dose || proto.selected_dose || null;
  if (key === 'administration_mode') return ADMIN_MODE_LABELS[meta.administration_mode] || null;
  if (key === 'supply') {
    const s = proto.supply_type;
    if (!s) return null;
    return SUPPLY_TYPE_LABELS[s] || s.replace(/_/g, ' ');
  }
  if (key === 'frequency') {
    if (proto.frequency) return proto.frequency;
    const ipw = proto.injections_per_week || proto.injection_frequency;
    if (ipw === 2) return '2x / wk';
    if (ipw === 7) return 'Daily';
    if (ipw) return `${ipw}x / wk`;
    return null;
  }
  if (key === 'last_dispensed') return formatShortDate(proto.last_refill_date);
  if (key === 'next_due') {
    const d = formatShortDate(proto.next_expected_date);
    if (!d) return null;
    const days = daysUntil(proto.next_expected_date);
    if (days == null) return d;
    if (days < 0)  return `${d} · ${Math.abs(days)}d OVERDUE`;
    if (days === 0) return `${d} · TODAY`;
    if (days <= 3) return `${d} · in ${days}d`;
    return d;
  }
  if (key === 'last_payment') {
    const d = formatShortDate(card.last_payment_date);
    if (!d) return null;
    if (card.last_payment_cents != null && card.last_payment_cents > 0) {
      return `$${(card.last_payment_cents / 100).toFixed(0)} · ${d}`;
    }
    return d;
  }
  if (key === 'next_payment') {
    const d = formatShortDate(card.next_payment_date);
    if (!d) return null;
    const days = daysUntil(card.next_payment_date);
    if (days == null) return d;
    if (days < 0)  return `${d} · ${Math.abs(days)}d OVERDUE`;
    if (days <= 3 && days >= 0) return `${d} · in ${days}d`;
    return d;
  }
  if (key === 'payment') {
    const s = card.payment_status;
    if (!s) return null;
    return PAYMENT_STATUS_LABELS[s] || s.replace(/_/g, ' ').toUpperCase();
  }
  if (key === 'sessions_used') {
    const u = meta.sessions_used, t = meta.total_sessions;
    if (u == null) return null;
    return t != null ? `${u} / ${t}` : String(u);
  }
  if (key === 'total_sessions')    return null; // rendered via sessions_used
  if (key === 'injection_type') {
    const t = meta.injection_type;
    if (!t) return null;
    const labels = { prp: 'PRP', exosomes: 'Exosomes', nad: 'NAD+', range: 'Range', specialty: 'Specialty' };
    return labels[t] || t.toUpperCase();
  }
  if (key === 'target')            return meta.target || null;
  if (key === 'lab_type')          return meta.lab_type || null;
  if (key === 'labs_drawn_at') {
    const d = formatShortDate(card.labs_drawn_at);
    if (!d) return null;
    const days = daysSince(card.labs_drawn_at);
    return days === 0 ? `${d} · today` : `${d} · ${days}d ago`;
  }
  if (key === 'source')            return card.source || null;
  if (key === 'path')              return card.path || null;
  if (key === 'urgency')           return card.urgency != null ? `${card.urgency}/10` : null;
  if (key === 'progress') {
    if (meta.percent_complete != null) return `${Math.round(meta.percent_complete)}%`;
    return null;
  }
  if (key === 'reason')            return meta.reason || null;
  return null;
}

function isUrgentField(key, card) {
  const proto = card.protocol || {};
  if (key === 'next_due') {
    const days = daysUntil(proto.next_expected_date);
    return days != null && days < 0;
  }
  if (key === 'next_payment') {
    const days = daysUntil(card.next_payment_date);
    return days != null && days < 0;
  }
  if (key === 'payment') {
    return ['past_due', 'unpaid', 'failed'].includes(card.payment_status);
  }
  return false;
}

export default function PipelineCard({ card, pipeline, onClick }) {
  const days = daysSince(card.entered_stage_at);
  const fields = (pipeline?.cardFields || [])
    .map(k => ({
      key: k,
      label: FIELD_LABELS[k] || k,
      value: formatFieldValue(k, card),
      urgent: isUrgentField(k, card),
    }))
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
              <span style={f.urgent ? styles.fieldValueUrgent : styles.fieldValue}>{f.value}</span>
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
  fieldValueUrgent: {
    color: '#c0332e',
    fontWeight: 700,
    fontSize: '12px',
    letterSpacing: '0.02em',
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
