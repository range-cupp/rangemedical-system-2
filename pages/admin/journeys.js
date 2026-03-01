// /pages/admin/journeys.js
// Journey Board - Kanban + List views of patient protocol journeys
// Range Medical System V2

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import JourneyBoard from '../../components/JourneyBoard';
import JourneyListView from '../../components/JourneyListView';
import ProtocolSlidePanel from '../../components/ProtocolSlidePanel';

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
  const [viewMode, setViewMode] = useState('list');
  const [columns, setColumns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [hasTemplates, setHasTemplates] = useState(true);
  const [selectedProtocol, setSelectedProtocol] = useState(null);

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

  // Extract stages array from the template for list view
  const stages = template?.stages || [];

  return (
    <AdminLayout title="Journey Board">
      {/* Protocol Type Selector + View Toggle */}
      <div style={styles.topBar}>
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

        <div style={styles.viewToggle}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              ...styles.viewBtn,
              ...(viewMode === 'list' ? styles.viewBtnActive : {})
            }}
            title="List view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            List
          </button>
          <button
            onClick={() => setViewMode('board')}
            style={{
              ...styles.viewBtn,
              ...(viewMode === 'board' ? styles.viewBtnActive : {})
            }}
            title="Board view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            Board
          </button>
        </div>
      </div>

      {/* Template Info Bar */}
      {template && (
        <div style={styles.templateBar}>
          <span style={styles.templateName}>{template.name}</span>
          <span style={styles.templateStages}>
            {stages.length} stages
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

      {/* Journey Views */}
      {(hasTemplates || loading) && viewMode === 'board' && (
        <JourneyBoard
          columns={columns}
          summary={summary}
          onAdvance={handleAdvance}
          onProtocolClick={setSelectedProtocol}
          loading={loading}
        />
      )}

      {(hasTemplates || loading) && viewMode === 'list' && (
        <JourneyListView
          columns={columns}
          summary={summary}
          stages={stages}
          onAdvance={handleAdvance}
          onProtocolClick={setSelectedProtocol}
          loading={loading}
        />
      )}
      <ProtocolSlidePanel
        isOpen={!!selectedProtocol}
        onClose={() => setSelectedProtocol(null)}
        protocolId={selectedProtocol?.protocolId}
        cardData={selectedProtocol}
      />
    </AdminLayout>
  );
}

const styles = {
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  typeSelector: {
    display: 'flex',
    gap: '6px',
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
  viewToggle: {
    display: 'flex',
    gap: '2px',
    background: '#f3f4f6',
    borderRadius: '8px',
    padding: '3px',
    flexShrink: 0
  },
  viewBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    background: 'transparent',
    color: '#6b7280',
    transition: 'all 0.15s'
  },
  viewBtnActive: {
    background: '#fff',
    color: '#111',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
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
