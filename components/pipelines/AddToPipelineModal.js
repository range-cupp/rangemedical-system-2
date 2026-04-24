// AddToPipelineModal — opens from a patient profile. Pick a pipeline,
// optionally a starting stage, and create the card.
// Range Medical

import { useState } from 'react';
import { PIPELINES, PIPELINE_ORDER } from '../../lib/pipelines-config';

export default function AddToPipelineModal({ patientId, patientName, onClose, onCreated }) {
  const [pipelineKey, setPipelineKey] = useState('energy_workup');
  const [stageKey, setStageKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const pipeline = PIPELINES[pipelineKey];

  async function handleCreate() {
    if (!patientId || !pipelineKey) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/pipelines/${pipelineKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          stage: stageKey || undefined,
          triggered_by: 'manual',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const card = await res.json();
      onCreated?.(card);
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>Add to Pipeline</div>
            <div style={styles.title}>{patientName || 'Patient'}</div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.body}>
          <label style={styles.label}>Pipeline</label>
          <select
            value={pipelineKey}
            onChange={(e) => { setPipelineKey(e.target.value); setStageKey(''); }}
            style={styles.select}
          >
            {PIPELINE_ORDER.map(k => (
              <option key={k} value={k}>{PIPELINES[k].label}</option>
            ))}
          </select>

          <label style={styles.label}>Starting Stage</label>
          <select
            value={stageKey}
            onChange={(e) => setStageKey(e.target.value)}
            style={styles.select}
          >
            <option value="">{pipeline?.stages?.[0]?.label ? `${pipeline.stages[0].label} (default)` : 'Default'}</option>
            {(pipeline?.stages || []).map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          {error && <div style={styles.error}>{error}</div>}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btnSecondary} disabled={submitting}>
            Cancel
          </button>
          <button onClick={handleCreate} style={styles.btnPrimary} disabled={submitting}>
            {submitting ? 'Creating…' : 'Add Card'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, fontFamily: 'Inter, -apple-system, sans-serif',
  },
  modal: {
    background: '#ffffff', width: '100%', maxWidth: '440px',
    border: '1px solid #1a1a1a',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '18px 20px', borderBottom: '1px solid #e0e0e0',
  },
  kicker: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: '#737373', marginBottom: '4px',
  },
  title: {
    fontSize: '18px', fontWeight: 800, color: '#1a1a1a',
    letterSpacing: '-0.01em',
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
    color: '#737373', lineHeight: 1, padding: 0,
  },
  body: { padding: '20px' },
  label: {
    display: 'block', fontSize: '10px', fontWeight: 700,
    letterSpacing: '0.14em', textTransform: 'uppercase', color: '#737373',
    marginBottom: '6px', marginTop: '12px',
  },
  select: {
    width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0',
    fontSize: '13px', fontFamily: 'Inter, sans-serif', borderRadius: 0,
    background: '#fff',
  },
  error: {
    marginTop: '12px', padding: '10px 12px', border: '1px solid #c0332e',
    background: '#fff5f5', color: '#c0332e', fontSize: '12px',
  },
  footer: {
    display: 'flex', gap: '8px', justifyContent: 'flex-end',
    padding: '14px 20px', borderTop: '1px solid #e0e0e0',
  },
  btnSecondary: {
    padding: '10px 16px', fontSize: '12px', fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    background: '#fff', border: '1px solid #e0e0e0',
    color: '#404040', cursor: 'pointer', borderRadius: 0,
  },
  btnPrimary: {
    padding: '10px 16px', fontSize: '12px', fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    background: '#1a1a1a', border: '1px solid #1a1a1a',
    color: '#fff', cursor: 'pointer', borderRadius: 0,
  },
};
