// pages/patient/labs.js
// Patient-facing lab results page
// Access via: /patient/labs?id={lab_uuid}
// No login required — UUID is the access token
// Range Medical

import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// ─── Design tokens (inline — no shared import needed for standalone page) ───
const colors = {
  flagged: '#DC3545',
  flaggedBg: '#FFF5F5',
  borderline: '#E8A94A',
  borderlineBg: '#FFFBF0',
  optimal: '#28A745',
  optimalBg: '#F0FFF4',
  normal: '#6B7280',
  normalBg: '#F9FAFB',
  track: '#E5E7EB',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
  cardBg: '#F8F8F8',
  brand: '#0F172A',
};

const flagColors = {
  high: colors.flagged,
  low: colors.flagged,
  borderline_high: colors.borderline,
  borderline_low: colors.borderline,
  optimal: colors.optimal,
  normal: colors.normal,
};

const flagBgColors = {
  high: colors.flaggedBg,
  low: colors.flaggedBg,
  borderline_high: colors.borderlineBg,
  borderline_low: colors.borderlineBg,
  optimal: colors.optimalBg,
  normal: colors.normalBg,
};

const flagLabels = {
  high: 'HIGH',
  low: 'LOW',
  borderline_high: 'BORDERLINE HIGH',
  borderline_low: 'BORDERLINE LOW',
  optimal: 'OPTIMAL',
  normal: 'NORMAL',
};

// ─── Category display order ───────────────────────────────────────────────────
const categoryOrder = [
  'Complete Blood Count',
  'Metabolic Panel',
  'Lipid Panel',
  'Hormones',
  'Thyroid',
  'Inflammation',
  'Nutrients & Vitamins',
  'Other',
];

// ─── RangeBar ────────────────────────────────────────────────────────────────
function RangeBar({ value, refLow, refHigh, flag }) {
  if (refLow === null || refHigh === null || value === null) return null;

  const range = refHigh - refLow;
  const padding = range * 0.3;
  const min = refLow - padding;
  const max = refHigh + padding;
  const total = max - min;

  const pct = Math.min(Math.max(((value - min) / total) * 100, 2), 98);
  const barColor = flagColors[flag] || colors.normal;

  return (
    <div style={{ marginTop: '6px', position: 'relative', height: '6px', borderRadius: '3px', background: colors.track }}>
      <div style={{
        position: 'absolute', left: `${((refLow - min) / total) * 100}%`,
        width: `${((refHigh - refLow) / total) * 100}%`,
        height: '100%', background: '#D1FAE5', borderRadius: '3px'
      }} />
      <div style={{
        position: 'absolute', left: `${pct}%`, top: '-3px',
        width: '12px', height: '12px', borderRadius: '50%',
        background: barColor, border: '2px solid white',
        transform: 'translateX(-50%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }} />
    </div>
  );
}

// ─── InsightPanel ─────────────────────────────────────────────────────────────
function InsightPanel({ biomarkerData, flag }) {
  if (!biomarkerData) return null;
  const isFlagged = flag === 'high' || flag === 'low';

  return (
    <div style={{
      padding: '16px', background: colors.cardBg,
      borderTop: `1px solid ${colors.border}`, fontSize: '0.875rem',
      lineHeight: '1.65', color: colors.text
    }}>
      {biomarkerData.what_it_measures && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.textSecondary, marginBottom: '4px' }}>
            What It Measures
          </div>
          <div>{biomarkerData.what_it_measures}</div>
        </div>
      )}
      {biomarkerData.why_it_matters && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.textSecondary, marginBottom: '4px' }}>
            Why It Matters
          </div>
          <div>{biomarkerData.why_it_matters}</div>
        </div>
      )}
      {biomarkerData.influencing_factors && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.textSecondary, marginBottom: '4px' }}>
            Influencing Factors
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {biomarkerData.influencing_factors.split(',').map((f, i) => (
              <span key={i} style={{
                padding: '2px 10px', borderRadius: '12px',
                background: colors.white, border: `1px solid ${colors.border}`,
                fontSize: '0.8125rem', color: colors.textSecondary
              }}>
                {f.trim()}
              </span>
            ))}
          </div>
        </div>
      )}
      {biomarkerData.optimal_range_display && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.textSecondary, marginBottom: '4px' }}>
            Optimal Range
          </div>
          <div>{biomarkerData.optimal_range_display}</div>
        </div>
      )}
      {biomarkerData.special_notes && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.textSecondary, marginBottom: '4px' }}>
            Note
          </div>
          <div style={{ fontStyle: 'italic', color: colors.textSecondary }}>{biomarkerData.special_notes}</div>
        </div>
      )}
      {isFlagged && (
        <div style={{
          marginTop: '12px', padding: '12px', borderRadius: '8px',
          background: '#FFF5F5', border: `1px solid ${colors.flagged}`,
          display: 'flex', alignItems: 'flex-start', gap: '10px'
        }}>
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>📞</span>
          <div>
            <div style={{ fontWeight: 600, color: colors.flagged, marginBottom: '2px' }}>
              Discuss with your provider
            </div>
            <div style={{ fontSize: '0.8125rem', color: colors.textSecondary }}>
              Call Range Medical: <a href="tel:+19499973988" style={{ color: colors.flagged, textDecoration: 'none', fontWeight: 600 }}>(949) 997-3988</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MarkerCard ───────────────────────────────────────────────────────────────
function MarkerCard({ result, biomarkerData }) {
  const [expanded, setExpanded] = useState(false);
  const { display_name, value, unit, ref_low, ref_high, flag } = result;
  const borderColor = flagColors[flag] || colors.normal;
  const bgColor = flagBgColors[flag] || colors.normalBg;
  const flagLabel = flagLabels[flag] || '';
  const hasMeta = !!biomarkerData;

  const formatValue = (v) => {
    if (v === null || v === undefined) return '-';
    return typeof v === 'number' ? (Number.isInteger(v) ? v.toString() : v.toFixed(2)) : v;
  };

  return (
    <div
      onClick={() => hasMeta && setExpanded(!expanded)}
      style={{
        background: colors.white, borderRadius: '10px',
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${borderColor}`,
        marginBottom: '8px', overflow: 'hidden',
        cursor: hasMeta ? 'pointer' : 'default',
        boxShadow: expanded ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: colors.text }}>{display_name}</span>
              {flagLabel && (flag === 'high' || flag === 'low' || flag === 'borderline_high' || flag === 'borderline_low') && (
                <span style={{
                  padding: '2px 7px', borderRadius: '4px',
                  fontSize: '0.625rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: bgColor, color: borderColor, whiteSpace: 'nowrap'
                }}>
                  {flagLabel}
                </span>
              )}
            </div>
            <RangeBar value={value} refLow={ref_low} refHigh={ref_high} flag={flag} />
            {ref_low !== null && ref_high !== null && (
              <div style={{ fontSize: '0.6875rem', color: colors.textSecondary, marginTop: '5px' }}>
                Reference range: {ref_low} – {ref_high} {unit}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontSize: '1.0625rem', fontWeight: 700, color: borderColor
              }}>
                {formatValue(value)}
              </div>
              <div style={{ fontSize: '0.6875rem', color: colors.textSecondary }}>{unit}</div>
            </div>
            {hasMeta && (
              <div style={{
                color: colors.textSecondary, fontSize: '0.75rem',
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease', width: '16px', textAlign: 'center'
              }}>
                ▼
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && <InsightPanel biomarkerData={biomarkerData} flag={flag} />}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PatientLabsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!id) return;

    fetch(`/api/patient/labs?id=${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setData(json);
        } else {
          setError(json.error || 'Results not found');
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // Stats
  const stats = useMemo(() => {
    if (!data?.results) return null;
    const results = data.results;
    const total = results.length;
    const flagged = results.filter(r => r.flag === 'high' || r.flag === 'low').length;
    const borderline = results.filter(r => r.flag === 'borderline_high' || r.flag === 'borderline_low').length;
    const inRange = total - flagged - borderline;
    return { total, flagged, borderline, inRange };
  }, [data]);

  // Filtered + grouped results
  const grouped = useMemo(() => {
    if (!data?.results) return {};
    let results = data.results;
    if (filter === 'flagged') results = results.filter(r => r.flag === 'high' || r.flag === 'low' || r.flag === 'borderline_high' || r.flag === 'borderline_low');
    if (filter === 'in_range') results = results.filter(r => r.flag === 'normal' || r.flag === 'optimal');

    const groups = {};
    results.forEach(r => {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    });
    return groups;
  }, [data, filter]);

  const sortedCategories = categoryOrder.filter(c => grouped[c]).concat(
    Object.keys(grouped).filter(c => !categoryOrder.includes(c))
  );

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Your Lab Results — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#F5F5F7', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        {/* Header */}
        <div style={{
          background: colors.brand, color: colors.white,
          padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.0625rem', letterSpacing: '-0.01em' }}>
                Range Medical
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '1px' }}>Lab Results</div>
            </div>
            <a
              href="tel:+19499973988"
              style={{
                color: colors.white, textDecoration: 'none', fontSize: '0.8125rem',
                background: 'rgba(255,255,255,0.12)', padding: '6px 12px',
                borderRadius: '20px', fontWeight: 500
              }}
            >
              📞 (949) 997-3988
            </a>
          </div>
        </div>

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 48px' }}>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: colors.textSecondary }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔬</div>
              <div style={{ fontSize: '1rem' }}>Loading your results...</div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{
              background: colors.white, borderRadius: '12px', padding: '40px 24px',
              textAlign: 'center', marginTop: '24px',
              border: `1px solid ${colors.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔗</div>
              <div style={{ fontWeight: 600, fontSize: '1.0625rem', color: colors.text, marginBottom: '8px' }}>
                Results not found
              </div>
              <div style={{ color: colors.textSecondary, fontSize: '0.9375rem', marginBottom: '24px' }}>
                This link may have expired or is invalid. Please contact us if you believe this is an error.
              </div>
              <a href="tel:+19499973988" style={{
                display: 'inline-block', background: colors.brand, color: colors.white,
                padding: '12px 24px', borderRadius: '8px', textDecoration: 'none',
                fontWeight: 600, fontSize: '0.9375rem'
              }}>
                Call Range Medical
              </a>
            </div>
          )}

          {/* Results */}
          {!loading && data && (
            <>
              {/* Patient greeting + lab info */}
              <div style={{
                background: colors.white, borderRadius: '12px', padding: '20px',
                marginBottom: '16px', border: `1px solid ${colors.border}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}>
                {data.patient?.firstName && (
                  <div style={{ fontSize: '0.9375rem', color: colors.textSecondary, marginBottom: '6px' }}>
                    Hi {data.patient.firstName},
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: '1.125rem', color: colors.text, marginBottom: '4px' }}>
                  Your Lab Results
                </div>
                <div style={{ fontSize: '0.875rem', color: colors.textSecondary }}>
                  {data.lab.test_date && (
                    <span>Drawn {formatDate(data.lab.test_date)}</span>
                  )}
                  {data.lab.panel_type && (
                    <span> · {data.lab.panel_type}</span>
                  )}
                  {data.lab.lab_type && (
                    <span> · {data.lab.lab_type}</span>
                  )}
                </div>
                <div style={{ marginTop: '12px', padding: '10px', background: '#F0F7FF', borderRadius: '8px', fontSize: '0.8125rem', color: '#1E40AF', lineHeight: '1.5' }}>
                  💡 Tap any result to learn what it measures, why it matters, and what affects it.
                </div>
              </div>

              {/* Stats summary */}
              {stats && (
                <div style={{
                  display: 'flex', gap: '10px', flexWrap: 'wrap',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    flex: 1, minWidth: '80px', background: colors.white, borderRadius: '10px',
                    padding: '12px', textAlign: 'center', border: `1px solid ${colors.border}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: '1.5rem', color: colors.text }}>{stats.total}</div>
                    <div style={{ fontSize: '0.6875rem', color: colors.textSecondary, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                  </div>
                  <div style={{
                    flex: 1, minWidth: '80px', background: '#F0FFF4', borderRadius: '10px',
                    padding: '12px', textAlign: 'center', border: `1px solid #BBF7D0`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: '1.5rem', color: colors.optimal }}>{stats.inRange}</div>
                    <div style={{ fontSize: '0.6875rem', color: colors.optimal, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Range</div>
                  </div>
                  {stats.flagged > 0 && (
                    <div style={{
                      flex: 1, minWidth: '80px', background: colors.flaggedBg, borderRadius: '10px',
                      padding: '12px', textAlign: 'center', border: `1px solid #FECACA`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ fontWeight: 800, fontSize: '1.5rem', color: colors.flagged }}>{stats.flagged}</div>
                      <div style={{ fontSize: '0.6875rem', color: colors.flagged, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Flagged</div>
                    </div>
                  )}
                  {stats.borderline > 0 && (
                    <div style={{
                      flex: 1, minWidth: '80px', background: colors.borderlineBg, borderRadius: '10px',
                      padding: '12px', textAlign: 'center', border: `1px solid #FDE68A`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ fontWeight: 800, fontSize: '1.5rem', color: colors.borderline }}>{stats.borderline}</div>
                      <div style={{ fontSize: '0.6875rem', color: colors.borderline, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Borderline</div>
                    </div>
                  )}
                </div>
              )}

              {/* Filter pills */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Results' },
                  { id: 'flagged', label: '⚠️ Needs Attention' },
                  { id: 'in_range', label: '✓ In Range' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    style={{
                      padding: '8px 16px', borderRadius: '20px',
                      border: filter === f.id ? 'none' : `1px solid ${colors.border}`,
                      background: filter === f.id ? colors.brand : colors.white,
                      color: filter === f.id ? colors.white : colors.textSecondary,
                      cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                      boxShadow: filter === f.id ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Biomarker cards grouped by category */}
              {sortedCategories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.textSecondary }}>
                  {filter === 'flagged' ? '✓ No flagged biomarkers — looking good!' : 'No results match this filter.'}
                </div>
              ) : (
                sortedCategories.map(category => (
                  <div key={category} style={{ marginBottom: '8px' }}>
                    <div style={{
                      fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.1em', color: colors.textSecondary,
                      padding: '16px 0 8px', borderBottom: `1px solid ${colors.border}`,
                      marginBottom: '10px'
                    }}>
                      {category}
                    </div>
                    {grouped[category].map(result => (
                      <MarkerCard
                        key={result.biomarker_key}
                        result={result}
                        biomarkerData={data.biomarkerLibrary?.[result.biomarker_key] || null}
                      />
                    ))}
                  </div>
                ))
              )}

              {/* Footer */}
              <div style={{
                marginTop: '40px', padding: '20px', background: colors.white,
                borderRadius: '12px', border: `1px solid ${colors.border}`,
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: colors.text, marginBottom: '6px' }}>
                  Questions about your results?
                </div>
                <div style={{ color: colors.textSecondary, fontSize: '0.875rem', marginBottom: '16px' }}>
                  Our team is here to help you understand and optimize your health.
                </div>
                <a
                  href="tel:+19499973988"
                  style={{
                    display: 'inline-block', background: colors.brand, color: colors.white,
                    padding: '12px 28px', borderRadius: '8px', textDecoration: 'none',
                    fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.01em'
                  }}
                >
                  📞 Call (949) 997-3988
                </a>
                <div style={{ marginTop: '16px', fontSize: '0.75rem', color: colors.textSecondary }}>
                  Range Medical · Newport Beach, CA
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
