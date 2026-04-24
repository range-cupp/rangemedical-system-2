// AddPatientCardModal — opens from a pipeline board. Search for a patient,
// optionally pick a stage, create the card on this pipeline.
// Range Medical

import { useEffect, useRef, useState } from 'react';

export default function AddPatientCardModal({ pipeline, onClose, onCreated }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [stageKey, setStageKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const body = await res.json();
          setResults(Array.isArray(body) ? body : (body.patients || []));
        }
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [query]);

  async function handleCreate() {
    if (!selected || !pipeline?.key) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/pipelines/${pipeline.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selected.id,
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
            <div style={styles.kicker}>Add Card</div>
            <div style={styles.title}>{pipeline?.label}</div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.body}>
          {!selected ? (
            <>
              <label style={styles.label}>Find Patient</label>
              <input
                ref={inputRef}
                placeholder="Search name, phone, or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={styles.input}
              />
              <div style={styles.results}>
                {searching && <div style={styles.hint}>Searching…</div>}
                {!searching && query.length >= 2 && results.length === 0 && (
                  <div style={styles.hint}>No patients found.</div>
                )}
                {results.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={styles.resultRow}
                  >
                    <div style={styles.resultName}>{p.name}</div>
                    <div style={styles.resultMeta}>{[p.phone, p.email].filter(Boolean).join(' · ')}</div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={styles.selectedCard}>
                <div>
                  <div style={styles.resultName}>{selected.name}</div>
                  <div style={styles.resultMeta}>{[selected.phone, selected.email].filter(Boolean).join(' · ')}</div>
                </div>
                <button onClick={() => setSelected(null)} style={styles.changeBtn}>Change</button>
              </div>

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
            </>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btnSecondary} disabled={submitting}>
            Cancel
          </button>
          {selected && (
            <button onClick={handleCreate} style={styles.btnPrimary} disabled={submitting}>
              {submitting ? 'Creating…' : 'Add Card'}
            </button>
          )}
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
    background: '#ffffff', width: '100%', maxWidth: '480px',
    border: '1px solid #1a1a1a', maxHeight: '80vh', display: 'flex',
    flexDirection: 'column',
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
  body: { padding: '20px', overflowY: 'auto', flex: 1 },
  label: {
    display: 'block', fontSize: '10px', fontWeight: 700,
    letterSpacing: '0.14em', textTransform: 'uppercase', color: '#737373',
    marginBottom: '6px', marginTop: '4px',
  },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0',
    fontSize: '13px', fontFamily: 'Inter, sans-serif', borderRadius: 0,
  },
  select: {
    width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0',
    fontSize: '13px', fontFamily: 'Inter, sans-serif', borderRadius: 0,
    background: '#fff', marginTop: '4px',
  },
  results: {
    marginTop: '10px', maxHeight: '320px', overflowY: 'auto',
    border: '1px solid #f0f0f0',
  },
  hint: {
    padding: '14px', fontSize: '12px', color: '#a0a0a0',
    fontStyle: 'italic', textAlign: 'center',
  },
  resultRow: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    width: '100%', padding: '10px 14px', background: '#fff',
    border: 'none', borderBottom: '1px solid #f0f0f0', textAlign: 'left',
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  resultName: {
    fontSize: '13px', fontWeight: 700, color: '#1a1a1a',
  },
  resultMeta: {
    fontSize: '11px', color: '#737373', marginTop: '2px',
  },
  selectedCard: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 14px', background: '#fafafa', border: '1px solid #e0e0e0',
    marginBottom: '10px',
  },
  changeBtn: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: '#737373', background: 'none',
    border: 'none', cursor: 'pointer', padding: 0,
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
