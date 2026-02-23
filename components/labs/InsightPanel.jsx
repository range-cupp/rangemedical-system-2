// components/labs/InsightPanel.jsx
import { colors, flagColors } from './labStyles';

export default function InsightPanel({ biomarkerData, flag }) {
  if (!biomarkerData) return null;

  const isFlagged = flag === 'high' || flag === 'low';

  return (
    <div style={{
      padding: '16px', background: colors.cardBg,
      borderTop: `1px solid ${colors.border}`, fontSize: '0.8125rem',
      lineHeight: '1.6', color: colors.text
    }}>
      {biomarkerData.what_it_measures && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase',
            letterSpacing: '0.08em', color: colors.textSecondary, marginBottom: '4px'
          }}>
            What It Measures
          </div>
          <div>{biomarkerData.what_it_measures}</div>
        </div>
      )}

      {biomarkerData.why_it_matters && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase',
            letterSpacing: '0.08em', color: colors.textSecondary, marginBottom: '4px'
          }}>
            Why It Matters
          </div>
          <div>{biomarkerData.why_it_matters}</div>
        </div>
      )}

      {biomarkerData.influencing_factors && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase',
            letterSpacing: '0.08em', color: colors.textSecondary, marginBottom: '4px'
          }}>
            Influencing Factors
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {biomarkerData.influencing_factors.split(',').map((f, i) => (
              <span key={i} style={{
                padding: '2px 8px', borderRadius: '12px',
                background: colors.white, border: `1px solid ${colors.border}`,
                fontSize: '0.75rem', color: colors.textSecondary
              }}>
                {f.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {biomarkerData.optimal_range_display && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase',
            letterSpacing: '0.08em', color: colors.textSecondary, marginBottom: '4px'
          }}>
            Optimal Range
          </div>
          <div>{biomarkerData.optimal_range_display}</div>
        </div>
      )}

      {biomarkerData.special_notes && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase',
            letterSpacing: '0.08em', color: colors.textSecondary, marginBottom: '4px'
          }}>
            Note
          </div>
          <div style={{ fontStyle: 'italic', color: colors.textSecondary }}>
            {biomarkerData.special_notes}
          </div>
        </div>
      )}

      {isFlagged && (
        <div style={{
          marginTop: '12px', padding: '12px', borderRadius: '6px',
          background: '#FFF5F5', border: `1px solid ${colors.flagged}`,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ fontSize: '1rem' }}>📞</span>
          <div>
            <div style={{ fontWeight: 600, color: colors.flagged, marginBottom: '2px' }}>
              Discuss with your provider
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
              Call Range Medical at (949) 997-3988
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
