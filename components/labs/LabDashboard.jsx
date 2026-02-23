// components/labs/LabDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { colors, styles } from './labStyles';
import LabSingleView from './LabSingleView';
import LabCompareView from './LabCompareView';

export default function LabDashboard({ patientId, patientGender, embedded }) {
  const [labOrders, setLabOrders] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState(null);
  const [results, setResults] = useState(null);
  const [allLabResults, setAllLabResults] = useState(null);
  const [biomarkerLibrary, setBiomarkerLibrary] = useState(null);
  const [view, setView] = useState('single');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load orders + biomarker library on mount
  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/labs/orders?patient_id=${patientId}`).then(r => r.json()),
      fetch('/api/labs/biomarkers').then(r => r.json())
    ])
      .then(([ordersData, bioData]) => {
        const orders = ordersData.orders || [];
        setLabOrders(orders);
        setBiomarkerLibrary(bioData.library || {});

        if (orders.length > 0) {
          setSelectedLabId(orders[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('LabDashboard init error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [patientId]);

  // Load results when selected lab changes
  useEffect(() => {
    if (!selectedLabId || !patientGender) return;

    fetch(`/api/labs/results?lab_id=${selectedLabId}&gender=${encodeURIComponent(patientGender)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setResults(data.results);
        }
      })
      .catch(err => console.error('Results fetch error:', err));
  }, [selectedLabId, patientGender]);

  // Load all lab results for compare view (lazy, on first toggle to compare)
  const loadHistory = useCallback(() => {
    if (allLabResults || !patientId) return;

    fetch(`/api/labs/patient-history?patient_id=${patientId}&gender=${encodeURIComponent(patientGender || '')}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAllLabResults(data.labs || []);
        }
      })
      .catch(err => console.error('History fetch error:', err));
  }, [allLabResults, patientId, patientGender]);

  const handleViewChange = (v) => {
    setView(v);
    if (v === 'compare') loadHistory();
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Find previous lab's results for delta display
  const previousResults = (() => {
    if (!allLabResults || !selectedLabId) return null;
    const idx = allLabResults.findIndex(l => l.id === selectedLabId);
    if (idx >= 0 && idx < allLabResults.length - 1) {
      return allLabResults[idx + 1]?.biomarkers || null;
    }
    return null;
  })();

  // Loading state
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: embedded ? '24px' : '48px', color: colors.textSecondary }}>
        Loading lab results...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: colors.flagged }}>
        Error loading labs: {error}
      </div>
    );
  }

  // Empty state
  if (labOrders.length === 0) {
    return (
      <section className={embedded ? 'card' : ''}>
        {embedded && (
          <div className="card-header">
            <h3>Lab Results Dashboard</h3>
          </div>
        )}
        <div style={styles.emptyState}>
          <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.4 }}>🔬</div>
          <div>No lab results available yet.</div>
          <div style={{ fontSize: '0.8125rem', marginTop: '4px', color: colors.textSecondary }}>
            Lab data will appear here once results are imported.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={embedded ? 'card' : ''} style={embedded ? {} : { maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
        padding: embedded ? '0' : '0 0 16px 0',
        marginBottom: '16px'
      }}>
        {embedded ? (
          <div className="card-header" style={{ flex: 1, margin: 0, padding: 0 }}>
            <h3 style={{ margin: 0 }}>Lab Results Dashboard</h3>
          </div>
        ) : (
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Lab Results</h2>
        )}

        {/* View toggle (only if 2+ labs) */}
        {labOrders.length >= 2 && (
          <div style={styles.viewToggle}>
            <button
              onClick={() => handleViewChange('single')}
              style={{ ...styles.viewToggleBtn, ...(view === 'single' ? styles.viewToggleBtnActive : {}) }}
            >
              Single
            </button>
            <button
              onClick={() => handleViewChange('compare')}
              style={{ ...styles.viewToggleBtn, ...(view === 'compare' ? styles.viewToggleBtnActive : {}) }}
            >
              Compare
            </button>
          </div>
        )}
      </div>

      {/* Lab selector tabs */}
      {view === 'single' && labOrders.length > 1 && (
        <div style={{
          display: 'flex', gap: '4px', overflowX: 'auto',
          paddingBottom: '12px', marginBottom: '16px',
          borderBottom: `1px solid ${colors.border}`
        }}>
          {labOrders.map(order => (
            <button
              key={order.id}
              onClick={() => setSelectedLabId(order.id)}
              style={{
                ...styles.labTab,
                ...(selectedLabId === order.id ? styles.labTabActive : {})
              }}
            >
              {formatDate(order.test_date)}
              {order.panel_type && (
                <span style={{
                  display: 'block', fontSize: '0.6875rem',
                  fontWeight: 400, opacity: 0.8
                }}>
                  {order.panel_type}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {view === 'single' && results && (
        <LabSingleView
          results={results}
          biomarkerLibrary={biomarkerLibrary}
          previousResults={previousResults}
        />
      )}

      {view === 'compare' && allLabResults && (
        <LabCompareView
          allLabResults={allLabResults}
          biomarkerLibrary={biomarkerLibrary}
        />
      )}

      {/* Loading indicator for results */}
      {view === 'single' && !results && selectedLabId && (
        <div style={{ textAlign: 'center', padding: '24px', color: colors.textSecondary }}>
          Loading results...
        </div>
      )}
      {view === 'compare' && !allLabResults && (
        <div style={{ textAlign: 'center', padding: '24px', color: colors.textSecondary }}>
          Loading comparison data...
        </div>
      )}
    </section>
  );
}
