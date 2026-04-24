// PatientPipelineSummary — block on the patient profile showing every active
// pipeline card for the patient. One row per pipeline.
// Click a row → opens that pipeline's board.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getPipeline } from '../lib/pipelines-config';
import { getStaff, initials } from '../lib/staff';
import AddToPipelineModal from './pipelines/AddToPipelineModal';

function daysSince(iso) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

export default function PatientPipelineSummary({ patientId, patientName }) {
  const [cards, setCards]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function reload() {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pipelines/summary?patient_id=${patientId}`);
      if (res.ok) setCards(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [patientId]);

  const addButton = (
    <button onClick={() => setAdding(true)} style={styles.addBtn} title="Add to a pipeline">
      <Plus size={12} /> Add
    </button>
  );

  if (loading) return null;
  if (!cards.length) {
    return (
      <section style={styles.wrapper}>
        <div style={styles.header}>
          <div style={styles.kicker}>Pipelines</div>
          <div style={styles.headerRight}>
            <h3 style={styles.title}>No Active Pipelines</h3>
            {addButton}
          </div>
        </div>
        <div style={styles.empty}>
          This patient isn't on any active pipeline boards.
        </div>
        {adding && (
          <AddToPipelineModal
            patientId={patientId}
            patientName={patientName}
            onClose={() => setAdding(false)}
            onCreated={reload}
          />
        )}
      </section>
    );
  }

  return (
    <section style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.kicker}>Pipelines</div>
        <div style={styles.headerRight}>
          <h3 style={styles.title}>{cards.length} Active</h3>
          {addButton}
        </div>
      </div>

      <div style={styles.rows}>
        {cards.map(card => {
          const pipeline = getPipeline(card.pipeline);
          if (!pipeline) return null;
          const stage = pipeline.stages.find(s => s.key === card.stage);
          return (
            <Link
              key={card.id}
              href={`/admin/pipelines/${card.pipeline}`}
              style={styles.rowLink}
            >
              <div style={styles.row}>
                <div style={styles.rowLeft}>
                  <div style={styles.pipelineLabel}>{pipeline.label}</div>
                  <div style={styles.stageLabel}>{stage?.label || card.stage}</div>
                </div>

                <div style={styles.rowRight}>
                  <div style={styles.daysBadge}>
                    {daysSince(card.entered_stage_at)}d in stage
                  </div>
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
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {adding && (
        <AddToPipelineModal
          patientId={patientId}
          patientName={patientName}
          onClose={() => setAdding(false)}
          onCreated={reload}
        />
      )}
    </section>
  );
}

const styles = {
  wrapper: {
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    marginBottom: '16px',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #e0e0e0',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    background: '#1a1a1a',
    border: '1px solid #1a1a1a',
    color: '#fff',
    cursor: 'pointer',
    borderRadius: 0,
    fontFamily: 'Inter, sans-serif',
  },
  kicker: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#737373',
  },
  title: {
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: '#1a1a1a',
    margin: 0,
    textTransform: 'uppercase',
  },
  empty: {
    padding: '16px 18px',
    fontSize: '12px',
    color: '#a0a0a0',
    fontStyle: 'italic',
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
  },
  rowLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 18px',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background 0.15s',
    cursor: 'pointer',
  },
  rowLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  pipelineLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#737373',
  },
  stageLabel: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1a1a1a',
    letterSpacing: '-0.01em',
  },
  rowRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  daysBadge: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#737373',
  },
  avatars: {
    display: 'flex',
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
