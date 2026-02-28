// /pages/admin/labs.js
// Labs page - pipeline and results views
// Range Medical System V2

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

const PIPELINE_STAGES = [
  { key: 'draw_complete', label: 'Blood Draw Complete', color: '#dbeafe' },
  { key: 'results_received', label: 'Results Received', color: '#fef3c7' },
  { key: 'provider_reviewed', label: 'Provider Reviewed', color: '#dcfce7' },
  { key: 'consult_scheduled', label: 'Consult Scheduled', color: '#e0e7ff' },
  { key: 'consult_complete', label: 'Consult Complete', color: '#d1fae5' }
];

export default function LabsPage() {
  const [tab, setTab] = useState('pipeline');
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabData();
  }, []);

  const fetchLabData = async () => {
    try {
      const res = await fetch('/api/pipelines/hrt');
      const data = await res.json();
      setJourneys(data.journeys || data || []);
    } catch (err) {
      console.error('Error fetching lab data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPatientsByStage = (stageKey) => {
    return journeys.filter(j => j.stage === stageKey);
  };

  return (
    <AdminLayout title="Labs">
      {/* Tab bar */}
      <div style={styles.tabBar}>
        {['pipeline', 'results'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...styles.tab,
              ...(tab === t ? styles.tabActive : {})
            }}
          >
            {t === 'pipeline' ? 'Pipeline' : 'Results'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loading}>Loading lab data...</div>
      ) : tab === 'pipeline' ? (
        <div style={styles.pipelineGrid}>
          {PIPELINE_STAGES.map(stage => {
            const patients = getPatientsByStage(stage.key);
            return (
              <div key={stage.key} style={styles.pipelineColumn}>
                <div style={{ ...styles.columnHeader, background: stage.color }}>
                  <span style={styles.columnTitle}>{stage.label}</span>
                  <span style={styles.columnCount}>{patients.length}</span>
                </div>
                <div style={styles.columnBody}>
                  {patients.length === 0 ? (
                    <div style={styles.emptyColumn}>No patients</div>
                  ) : (
                    patients.map(p => (
                      <div key={p.id} style={styles.pipelineCard}>
                        <div style={styles.cardName}>{p.patient_name || 'Unknown'}</div>
                        <div style={styles.cardMeta}>{p.journey_type || ''}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.card}>
          <div style={styles.empty}>
            Lab results view — search and view patient lab results from the patient profile.
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const styles = {
  tabBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px'
  },
  tab: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '400',
    color: '#666'
  },
  tabActive: {
    background: '#000',
    color: '#fff',
    border: '1px solid #000',
    fontWeight: '500'
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#666'
  },
  pipelineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
    overflowX: 'auto'
  },
  pipelineColumn: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    overflow: 'hidden',
    minWidth: '200px'
  },
  columnHeader: {
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  columnTitle: {
    fontSize: '12px',
    fontWeight: '600'
  },
  columnCount: {
    fontSize: '12px',
    fontWeight: '700',
    background: 'rgba(0,0,0,0.1)',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  columnBody: {
    padding: '8px',
    minHeight: '100px'
  },
  emptyColumn: {
    padding: '20px',
    textAlign: 'center',
    color: '#999',
    fontSize: '12px'
  },
  pipelineCard: {
    padding: '10px 12px',
    background: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '6px',
    cursor: 'pointer'
  },
  cardName: {
    fontSize: '13px',
    fontWeight: '500'
  },
  cardMeta: {
    fontSize: '11px',
    color: '#666',
    marginTop: '2px'
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e5e5'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  }
};
