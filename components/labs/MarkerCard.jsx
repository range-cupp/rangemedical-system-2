// components/labs/MarkerCard.jsx
import { useState } from 'react';
import { colors, flagColors, flagBgColors, flagLabels } from './labStyles';
import RangeBar from './RangeBar';
import InsightPanel from './InsightPanel';

export default function MarkerCard({ biomarker, value, unit, refLow, refHigh, flag, previousValue, biomarkerData }) {
  const [expanded, setExpanded] = useState(false);

  const borderColor = flagColors[flag] || colors.normal;
  const bgColor = flagBgColors[flag] || colors.normalBg;
  const flagLabel = flagLabels[flag] || '';

  // Delta from previous lab
  let delta = null;
  let deltaColor = colors.textSecondary;
  if (previousValue !== null && previousValue !== undefined && value !== null) {
    delta = value - previousValue;
    if (delta > 0) deltaColor = '#16a34a';
    if (delta < 0) deltaColor = '#ef4444';
  }

  const formatValue = (v) => {
    if (v === null || v === undefined) return '-';
    return typeof v === 'number' ? (Number.isInteger(v) ? v.toString() : v.toFixed(2)) : v;
  };

  return (
    <div style={{
      background: colors.white, borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      borderLeft: `4px solid ${borderColor}`,
      marginBottom: '8px', overflow: 'hidden',
      transition: 'box-shadow 0.15s ease',
      cursor: biomarkerData ? 'pointer' : 'default'
    }}
    onClick={() => biomarkerData && setExpanded(!expanded)}
    >
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: colors.text }}>
                {biomarker}
              </span>
              {flagLabel && (flag === 'high' || flag === 'low' || flag === 'borderline_high' || flag === 'borderline_low') && (
                <span style={{
                  padding: '1px 6px', borderRadius: '4px',
                  fontSize: '0.625rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: bgColor, color: borderColor
                }}>
                  {flagLabel}
                </span>
              )}
            </div>
            <RangeBar value={value} refLow={refLow} refHigh={refHigh} flag={flag} />
          </div>

          <div style={{ textAlign: 'right', marginLeft: '16px', minWidth: '80px' }}>
            <div style={{
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: '1rem', fontWeight: 700, color: borderColor
            }}>
              {formatValue(value)}
            </div>
            <div style={{ fontSize: '0.6875rem', color: colors.textSecondary }}>
              {unit}
            </div>
            {delta !== null && (
              <div style={{ fontSize: '0.6875rem', color: deltaColor, fontWeight: 600 }}>
                {delta > 0 ? '↑' : delta < 0 ? '↓' : '='} {Math.abs(delta).toFixed(1)}
              </div>
            )}
          </div>

          {biomarkerData && (
            <div style={{
              marginLeft: '8px', color: colors.textSecondary,
              fontSize: '0.75rem', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease'
            }}>
              ▼
            </div>
          )}
        </div>
      </div>

      {expanded && <InsightPanel biomarkerData={biomarkerData} flag={flag} />}
    </div>
  );
}
