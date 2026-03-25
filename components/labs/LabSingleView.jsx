// components/labs/LabSingleView.jsx
import { useState, useMemo } from 'react';
import { colors, styles, flagColors } from './labStyles';
import { categoryOrder } from '../../lib/biomarker-config';
import MarkerCard from './MarkerCard';

export default function LabSingleView({ results, biomarkerLibrary, previousResults, synopsis, synopsisLoading, onRegenerateSynopsis }) {
  const [filter, setFilter] = useState('all');
  const [synopsisExpanded, setSynopsisExpanded] = useState(true);

  // Build previous values lookup
  const previousMap = useMemo(() => {
    const map = {};
    if (previousResults) {
      previousResults.forEach(r => { map[r.biomarker_key] = r.value; });
    }
    return map;
  }, [previousResults]);

  // Compute stats
  const stats = useMemo(() => {
    const total = results.length;
    const flagged = results.filter(r => r.flag === 'high' || r.flag === 'low').length;
    const borderline = results.filter(r => r.flag === 'borderline_high' || r.flag === 'borderline_low').length;
    const inRange = total - flagged - borderline;
    return { total, flagged, borderline, inRange };
  }, [results]);

  // Filter results
  const filteredResults = useMemo(() => {
    if (filter === 'flagged') return results.filter(r => r.flag === 'high' || r.flag === 'low' || r.flag === 'borderline_high' || r.flag === 'borderline_low');
    if (filter === 'in_range') return results.filter(r => r.flag === 'normal' || r.flag === 'optimal');
    return results;
  }, [results, filter]);

  // Group by category
  const grouped = useMemo(() => {
    const groups = {};
    filteredResults.forEach(r => {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    });
    return groups;
  }, [filteredResults]);

  const sortedCategories = categoryOrder.filter(c => grouped[c]);

  return (
    <div>
      {/* Summary + filters inline */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px', marginBottom: '20px'
      }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ ...styles.statBox, background: '#F3F4F6', color: colors.text }}>
            <strong>{stats.total}</strong> Total
          </div>
          <div style={{ ...styles.statBox, background: '#F0FFF4', color: colors.optimal }}>
            <strong>{stats.inRange}</strong> In Range
          </div>
          {stats.flagged > 0 && (
            <div style={{ ...styles.statBox, background: '#FFF5F5', color: colors.flagged }}>
              <strong>{stats.flagged}</strong> Flagged
            </div>
          )}
          {stats.borderline > 0 && (
            <div style={{ ...styles.statBox, background: '#FFFBF0', color: colors.borderline }}>
              <strong>{stats.borderline}</strong> Borderline
            </div>
          )}
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'flagged', label: 'Flagged' },
            { id: 'in_range', label: 'In Range' }
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              ...styles.filterPill,
              ...(filter === f.id ? styles.filterPillActive : {})
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Clinical Synopsis */}
      {(synopsis || onRegenerateSynopsis) && (
        <div style={{
          marginBottom: '24px',
          border: `1px solid ${synopsis ? '#C7D2FE' : colors.border}`,
          borderRadius: '0',
          background: synopsis ? '#F5F3FF' : colors.white,
          overflow: 'hidden'
        }}>
          <div
            onClick={() => synopsis && setSynopsisExpanded(!synopsisExpanded)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              cursor: synopsis ? 'pointer' : 'default',
              borderBottom: synopsisExpanded && synopsis ? '1px solid #C7D2FE' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>🧠</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4338CA' }}>
                AI Clinical Synopsis
              </span>
              {synopsis && (
                <span style={{ fontSize: '0.6875rem', color: '#6366F1', fontWeight: 400 }}>
                  {synopsisExpanded ? '(click to collapse)' : '(click to expand)'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onRegenerateSynopsis && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRegenerateSynopsis(); }}
                  disabled={synopsisLoading}
                  style={{
                    padding: '4px 10px', borderRadius: '0', border: '1px solid #C7D2FE',
                    background: colors.white, cursor: synopsisLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem', fontWeight: 500, color: '#4338CA',
                    opacity: synopsisLoading ? 0.6 : 1
                  }}
                >
                  {synopsisLoading ? 'Generating...' : synopsis ? 'Regenerate' : 'Generate Synopsis'}
                </button>
              )}
            </div>
          </div>
          {synopsisExpanded && synopsis && (
            <div style={{
              padding: '16px',
              fontSize: '0.8125rem',
              lineHeight: '1.6',
              color: '#1F2937',
              whiteSpace: 'pre-wrap',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              {synopsis}
            </div>
          )}
        </div>
      )}

      {/* Category sections */}
      {sortedCategories.length === 0 ? (
        <div style={styles.emptyState}>
          {filter === 'flagged' ? 'No flagged biomarkers — looking good!' : 'No biomarkers match the selected filter.'}
        </div>
      ) : (
        sortedCategories.map(category => (
          <div key={category}>
            <div style={styles.categoryHeader}>{category}</div>
            {grouped[category].map(r => (
              <MarkerCard
                key={r.biomarker_key}
                biomarker={r.display_name}
                value={r.value}
                unit={r.unit}
                refLow={r.ref_low}
                refHigh={r.ref_high}
                flag={r.flag}
                previousValue={previousMap[r.biomarker_key] ?? null}
                biomarkerData={biomarkerLibrary?.[r.biomarker_key] || null}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
