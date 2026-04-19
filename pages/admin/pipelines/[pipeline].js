// /admin/pipelines/[pipeline] — kanban board for one pipeline.
// Editorial V2 aesthetic. Click a card → slide-in right detail panel.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import AdminLayout from '../../../components/AdminLayout';
import PipelineBoard from '../../../components/pipelines/PipelineBoard';
import PipelineFilterChips from '../../../components/pipelines/PipelineFilterChips';
import PipelineDetailPanel from '../../../components/pipelines/PipelineDetailPanel';
import { getPipeline, PIPELINE_ORDER, PIPELINES } from '../../../lib/pipelines-config';

export default function PipelineBoardPage() {
  const router = useRouter();
  const { pipeline: pipelineKey } = router.query;
  const pipeline = useMemo(
    () => (pipelineKey ? getPipeline(pipelineKey) : null),
    [pipelineKey]
  );

  const [cards, setCards]   = useState([]);
  const [filters, setFilters] = useState({});
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!pipelineKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pipelines/${pipelineKey}`);
      if (res.ok) setCards(await res.json());
    } finally { setLoading(false); }
  }, [pipelineKey]);

  useEffect(() => { load(); }, [load]);

  const filteredCards = useMemo(() => {
    return cards.filter(c => {
      for (const [k, v] of Object.entries(filters)) {
        if (v == null) continue;
        // supply_type filters match the normalized supply_category on the card
        if (k === 'supply_type') {
          if (c.supply_category !== v) return false;
          continue;
        }
        if ((c.meta || {})[k] !== v) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const hay = [
          c.patient_name, c.first_name, c.last_name, c.email, c.phone, c.notes,
          (c.meta || {}).medication, (c.meta || {}).target,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cards, filters, search]);

  if (!pipeline && pipelineKey) {
    return (
      <AdminLayout title="Pipeline Not Found">
        <div style={{ padding: '48px', color: '#737373' }}>
          Unknown pipeline: <code>{pipelineKey}</code>
        </div>
      </AdminLayout>
    );
  }
  if (!pipeline) {
    return <AdminLayout title="Pipeline"><div style={{ padding: 48 }}>Loading…</div></AdminLayout>;
  }

  const currentIndex = PIPELINE_ORDER.indexOf(pipelineKey);

  return (
    <AdminLayout title={pipeline.label}>
      <div style={styles.wrapper}>
        <Link href="/admin/pipelines" style={styles.back}>
          <ChevronLeft size={14} /> All Pipelines
        </Link>

        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.kicker}>Pipeline</div>
            <h1 style={styles.h1}>{pipeline.label}</h1>
            <p style={styles.sub}>{pipeline.description}</p>
          </div>
          <div style={styles.headerRight}>
            <input
              placeholder="Search name, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.search}
            />
            <div style={styles.totalCount}>
              <span style={styles.totalNum}>{filteredCards.length}</span>
              <span style={styles.totalLabel}>
                {filteredCards.length === cards.length ? 'Cards' : `of ${cards.length}`}
              </span>
            </div>
          </div>
        </header>

        <PipelineFilterChips
          filters={pipeline.filters}
          values={filters}
          onChange={setFilters}
        />

        <nav style={styles.pipelineNav}>
          {PIPELINE_ORDER.map((k, i) => (
            <Link
              key={k}
              href={`/admin/pipelines/${k}`}
              style={{
                ...styles.navLink,
                ...(i === currentIndex ? styles.navLinkActive : null),
              }}
            >
              {PIPELINES[k].label}
            </Link>
          ))}
        </nav>

        {loading ? (
          <div style={styles.loading}>Loading board…</div>
        ) : (
          <PipelineBoard
            pipeline={pipeline}
            cards={filteredCards}
            onCardClick={setSelected}
          />
        )}
      </div>

      {selected && (
        <PipelineDetailPanel
          card={selected}
          pipeline={pipeline}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setCards(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
            setSelected(prev => prev ? { ...prev, ...updated } : null);
          }}
          onDeleted={(deleted) => {
            setCards(prev => prev.filter(c => c.id !== deleted.id));
            setSelected(null);
          }}
        />
      )}
    </AdminLayout>
  );
}

const styles = {
  wrapper: {
    fontFamily: 'Inter, -apple-system, sans-serif',
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '20px 32px 80px',
  },
  back: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#737373',
    textDecoration: 'none',
    marginBottom: '12px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid #1a1a1a',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  headerLeft: {
    flex: 1,
    minWidth: '300px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  kicker: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#737373',
    marginBottom: '6px',
  },
  h1: {
    fontSize: '40px',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    textTransform: 'uppercase',
    color: '#1a1a1a',
    margin: 0,
    lineHeight: 0.95,
  },
  sub: {
    fontSize: '14px',
    color: '#737373',
    marginTop: '8px',
    marginBottom: 0,
  },
  search: {
    padding: '10px 14px',
    border: '1px solid #e0e0e0',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    width: '240px',
    borderRadius: 0,
  },
  totalCount: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  totalNum: {
    fontSize: '28px',
    fontWeight: 900,
    lineHeight: 1,
    color: '#1a1a1a',
  },
  totalLabel: {
    fontSize: '10px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#737373',
    fontWeight: 700,
    marginTop: '2px',
  },
  pipelineNav: {
    display: 'flex',
    gap: '0',
    marginBottom: '24px',
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: '0',
    overflowX: 'auto',
  },
  navLink: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#737373',
    textDecoration: 'none',
    padding: '10px 14px',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
    whiteSpace: 'nowrap',
  },
  navLinkActive: {
    color: '#1a1a1a',
    borderBottom: '2px solid #1a1a1a',
  },
  loading: {
    padding: '60px',
    textAlign: 'center',
    color: '#a0a0a0',
    fontSize: '13px',
    letterSpacing: '0.05em',
  },
};
