// /pages/admin/journeys.js
// Journey Board - Kanban view of patient protocol journeys
// Range Medical System V2

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import JourneyBoard from '../../components/JourneyBoard';

const PROTOCOL_TYPES = [
  { key: 'hrt', label: 'HRT' },
  { key: 'weight_loss', label: 'Weight Loss' },
  { key: 'peptide', label: 'Peptide' },
  { key: 'iv', label: 'IV Therapy' },
  { key: 'hbot', label: 'HBOT' },
  { key: 'rlt', label: 'Red Light' },
  { key: 'injection', label: 'Injection' },
  { key: 'combo_membership', label: 'Combo Membership' }
];

export default function JourneysPage() {
  const [selectedType, setSelectedType] = useState('hrt');
  const [columns, setColumns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [hasTemplates, setHasTemplates] = useState(true);

  const fetchBoard = useCallback(async (type) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/journeys/board?protocol_type=${type}`);
      const data = await res.json();

      if (res.status === 404) {
        setHasTemplates(false);
        setColumns([]);
        setSummary(null);
        setTemplate(null);
      } else if (data.columns) {
        setHasTemplates(true);
        setColumns(data.columns);
        setSummary(data.summary);
        setTemplate(data.template);
      }
    } catch (error) {
      console.error('Error fetching board:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard(selectedType);
  }, [selectedType, fetchBoard]);

  const handleAdvance = async (protocolId, newStage, previousStage) => {
    try {
      const res = await fetch('/api/admin/journeys/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol_id: protocolId,
          new_stage: newStage,
          triggered_by: 'staff',
          trigger_type: 'manual'
        })
      });

      if (res.ok) {
        // Optimistic update: move the card locally
        setColumns(prev => {
          const updated = prev.map(col => ({
            ...col,
            patients: col.patients.filter(p => p.protocolId !== protocolId)
          }));

          // Find the card in the previous stage
          const oldCol = prev.find(c => c.patients.some(p => p.protocolId === protocolId));
          const card = oldCol?.patients.find(p => p.protocolId === protocolId);

          if (card) {
            const newCol = updated.find(c => c.key === newStage);
            if (newCol) {
              newCol.patients.push({ ...card, currentStage: newStage });
            }
          }

          return updated;
        });
      } else {
        // Refresh on error
        fetchBoard(selectedType);
      }
    } catch (error) {
      console.error('Error advancing stage:', error);
      fetchBoard(selectedType);
    }
  };

  const handleSeedTemplates = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/journeys/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchBoard(selectedType);
      }
    } catch (error) {
      console.error('Error seeding templates:', error);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AdminLayout title="Journey Board">
      {/* Protocol Type Selector */}
      <div style={styles.typeSelector}>
        {PROTOCOL_TYPES.map(type => (
          <button
            key={type.key}
            onClick={() => setSelectedType(type.key)}
            style={{
              ...styles.typeBtn,
              ...(selectedType === type.key ? styles.typeBtnActive : {})
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Template Info Bar */}
      {template && (
        <div style={styles.templateBar}>
          <span style={styles.templateName}>{template.name}</span>
          <span style={styles.templateStages}>
            {(template.stages || []).length} stages
          </span>
        </div>
      )}

      {/* No Template State */}
      {!loading && !hasTemplates && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🗺️</div>
          <h3 style={styles.emptyTitle}>No Journey Template</h3>
          <p style={styles.emptyText}>
            No journey template has been set up for {PROTOCOL_TYPES.find(t => t.key === selectedType)?.label || selectedType} protocols yet.
          </p>
          <button
            onClick={handleSeedTemplates}
            disabled={seeding}
            style={styles.seedBtn}
          >
            {seeding ? 'Setting up...' : 'Set Up Default Templates'}
          </button>
          <p style={styles.seedHint}>
            This will create default journey stages for all protocol types.
          </p>
        </div>
      )}

      {/* Journey Board */}
      {(hasTemplates || loading) && (
        <JourneyBoard
          columns={columns}
          summary={summary}
          onAdvance={handleAdvance}
          loading={loading}
        />
      )}
    </AdminLayout>
  );
}

const styles = {
  typeSelector: {
    display: 'flex',
    gap: '6px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  typeBtn: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    background: '#fff',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.15s'
  },
  typeBtnActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000'
  },
  templateBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    padding: '10px 16px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  templateName: {
    fontWeight: '600',
    fontSize: '15px'
  },
  templateStages: {
    fontSize: '13px',
    color: '#6b7280'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 8px'
  },
  emptyText: {
    color: '#6b7280',
    fontSize: '14px',
    margin: '0 0 24px'
  },
  seedBtn: {
    padding: '12px 28px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  seedHint: {
    color: '#9ca3af',
    fontSize: '12px',
    marginTop: '12px'
  }
};
