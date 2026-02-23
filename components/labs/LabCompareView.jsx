// components/labs/LabCompareView.jsx
import { useMemo } from 'react';
import { colors } from './labStyles';
import { categoryOrder, biomarkerMap } from '../../lib/biomarker-config';

export default function LabCompareView({ allLabResults, biomarkerLibrary }) {
  // allLabResults: array of { id, test_date, biomarkers: [{ biomarker_key, value, ... }] }
  // Most recent first (already sorted by API)
  const labs = allLabResults || [];

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const formatValue = (v) => {
    if (v === null || v === undefined) return '-';
    return typeof v === 'number' ? (Number.isInteger(v) ? v.toString() : v.toFixed(2)) : v;
  };

  // Collect all biomarker keys that appear in any lab
  const { grouped, sortedCategories } = useMemo(() => {
    const allKeys = new Set();
    labs.forEach(lab => {
      (lab.biomarkers || []).forEach(b => allKeys.add(b.biomarker_key));
    });

    // Group by category
    const groups = {};
    allKeys.forEach(key => {
      const meta = biomarkerMap[key];
      const cat = meta?.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(key);
    });

    const sorted = categoryOrder.filter(c => groups[c]);
    return { grouped: groups, sortedCategories: sorted };
  }, [labs]);

  // Build quick lookup: labIndex → biomarker_key → value
  const valueLookup = useMemo(() => {
    return labs.map(lab => {
      const map = {};
      (lab.biomarkers || []).forEach(b => { map[b.biomarker_key] = b.value; });
      return map;
    });
  }, [labs]);

  if (labs.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: colors.textSecondary }}>
        Need at least 2 labs to compare.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: '0.8125rem', border: `1px solid ${colors.border}`
      }}>
        <thead>
          <tr style={{ background: '#F3F4F6' }}>
            <th style={{
              padding: '10px 12px', textAlign: 'left', fontWeight: 700,
              fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em',
              borderBottom: `2px solid ${colors.border}`, position: 'sticky', left: 0,
              background: '#F3F4F6', zIndex: 1, minWidth: '160px'
            }}>
              Biomarker
            </th>
            {labs.map((lab, i) => (
              <th key={lab.id} style={{
                padding: '10px 12px', textAlign: 'center', fontWeight: 700,
                fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                borderBottom: `2px solid ${colors.border}`,
                borderLeft: `1px solid ${colors.border}`,
                color: i === 0 ? colors.black : colors.textSecondary,
                minWidth: '100px'
              }}>
                {formatDate(lab.test_date)}
                {i === 0 && <div style={{ fontSize: '0.5625rem', fontWeight: 400, color: colors.textSecondary }}>Latest</div>}
              </th>
            ))}
            <th style={{
              padding: '10px 12px', textAlign: 'center', fontWeight: 700,
              fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em',
              borderBottom: `2px solid ${colors.border}`,
              borderLeft: `1px solid ${colors.border}`, minWidth: '80px'
            }}>
              Delta
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCategories.map(category => (
            <>
              {/* Category header row */}
              <tr key={`cat-${category}`}>
                <td colSpan={labs.length + 2} style={{
                  padding: '10px 12px', fontWeight: 700, fontSize: '0.6875rem',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  background: '#E5E7EB', color: colors.text,
                  borderBottom: `1px solid ${colors.border}`
                }}>
                  {category}
                </td>
              </tr>
              {/* Biomarker rows */}
              {grouped[category].map(key => {
                const meta = biomarkerMap[key];
                const latestVal = valueLookup[0]?.[key] ?? null;
                const prevVal = valueLookup[1]?.[key] ?? null;

                let deltaText = '-';
                let deltaColor = colors.textSecondary;
                if (latestVal !== null && prevVal !== null && prevVal !== 0) {
                  const pctChange = ((latestVal - prevVal) / Math.abs(prevVal)) * 100;
                  deltaText = `${pctChange > 0 ? '↑' : pctChange < 0 ? '↓' : '='} ${Math.abs(pctChange).toFixed(1)}%`;
                  deltaColor = pctChange > 0 ? '#16a34a' : pctChange < 0 ? '#ef4444' : colors.textSecondary;
                }

                return (
                  <tr key={key} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{
                      padding: '8px 12px', fontWeight: 500,
                      position: 'sticky', left: 0, background: colors.white, zIndex: 1
                    }}>
                      {meta?.label || key}
                      {meta?.unit && (
                        <span style={{ marginLeft: '4px', fontSize: '0.6875rem', color: colors.textSecondary }}>
                          ({meta.unit})
                        </span>
                      )}
                    </td>
                    {labs.map((lab, i) => {
                      const val = valueLookup[i]?.[key] ?? null;
                      return (
                        <td key={lab.id} style={{
                          padding: '8px 12px', textAlign: 'center',
                          borderLeft: `1px solid ${colors.border}`,
                          fontFamily: "'SF Mono', 'Fira Code', monospace",
                          fontWeight: i === 0 ? 700 : 400,
                          color: val !== null ? colors.text : '#D1D5DB'
                        }}>
                          {formatValue(val)}
                        </td>
                      );
                    })}
                    <td style={{
                      padding: '8px 12px', textAlign: 'center',
                      borderLeft: `1px solid ${colors.border}`,
                      fontWeight: 700, color: deltaColor
                    }}>
                      {deltaText}
                    </td>
                  </tr>
                );
              })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
