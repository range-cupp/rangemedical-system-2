// /admin/pipelines — index of all pipeline boards with live counts.
// Editorial V2 tile grid.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import { PIPELINES, PIPELINE_ORDER } from '../../../lib/pipelines-config';

export default function PipelinesIndex() {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pipelines/summary')
      .then(r => r.ok ? r.json() : {})
      .then(s => { setSummary(s || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Pipelines">
      <div style={styles.wrapper}>
        <header style={styles.header}>
          <div style={styles.kicker}>Range Medical</div>
          <h1 style={styles.h1}>Pipelines</h1>
          <p style={styles.sub}>
            Every patient journey, one view. Click a board to open it.
          </p>
        </header>

        <div style={styles.grid}>
          {PIPELINE_ORDER.map(key => {
            const p = PIPELINES[key];
            const s = summary[key] || { total: 0, by_stage: {} };
            return (
              <Link key={key} href={`/admin/pipelines/${key}`} style={styles.tileLink}>
                <div style={styles.tile}>
                  <div style={styles.tileTop}>
                    <div style={styles.tileKicker}>{key.replace(/_/g, ' ')}</div>
                    <div style={styles.tileCount}>{loading ? '—' : s.total}</div>
                  </div>
                  <div style={styles.tileTitle}>{p.label}</div>
                  <div style={styles.tileDesc}>{p.description}</div>

                  <div style={styles.tileStages}>
                    {p.stages.map(st => (
                      <div key={st.key} style={styles.tileStageRow}>
                        <span style={styles.tileStageLabel}>{st.label}</span>
                        <span style={styles.tileStageCount}>
                          {loading ? '' : (s.by_stage[st.key] || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  wrapper: {
    fontFamily: 'Inter, -apple-system, sans-serif',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px 32px 80px',
  },
  header: {
    marginBottom: '40px',
    borderBottom: '1px solid #1a1a1a',
    paddingBottom: '24px',
  },
  kicker: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#737373',
    marginBottom: '8px',
  },
  h1: {
    fontSize: '48px',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    textTransform: 'uppercase',
    color: '#1a1a1a',
    margin: 0,
    lineHeight: 0.95,
  },
  sub: {
    fontSize: '15px',
    color: '#737373',
    marginTop: '10px',
    marginBottom: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '0',
    border: '1px solid #e0e0e0',
    borderRight: 'none',
    borderBottom: 'none',
  },
  tileLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  tile: {
    padding: '24px',
    borderRight: '1px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0',
    background: '#ffffff',
    transition: 'background 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    cursor: 'pointer',
    minHeight: '260px',
  },
  tileTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  tileKicker: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#a0a0a0',
  },
  tileCount: {
    fontSize: '32px',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: '#1a1a1a',
    lineHeight: 1,
  },
  tileTitle: {
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    textTransform: 'uppercase',
    color: '#1a1a1a',
    lineHeight: 1.05,
  },
  tileDesc: {
    fontSize: '13px',
    color: '#737373',
    lineHeight: 1.55,
    marginBottom: '4px',
  },
  tileStages: {
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  tileStageRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: 600,
  },
  tileStageLabel: {
    color: '#404040',
  },
  tileStageCount: {
    color: '#737373',
    fontVariantNumeric: 'tabular-nums',
  },
};
