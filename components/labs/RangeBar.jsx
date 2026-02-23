// components/labs/RangeBar.jsx
import { colors, flagColors } from './labStyles';

export default function RangeBar({ value, refLow, refHigh, flag }) {
  if (value === null || value === undefined) return null;
  if (refLow === null && refHigh === null) return null;

  const low = refLow ?? 0;
  const high = refHigh ?? low * 2;
  const range = high - low;
  if (range <= 0) return null;

  // Extend visual range 20% beyond ref boundaries
  const visualMin = low - range * 0.2;
  const visualMax = high + range * 0.2;
  const visualRange = visualMax - visualMin;

  // Position of ref zone within visual range
  const refLeftPct = ((low - visualMin) / visualRange) * 100;
  const refWidthPct = ((high - low) / visualRange) * 100;

  // Position of value dot
  const clampedValue = Math.max(visualMin, Math.min(visualMax, value));
  const dotPct = ((clampedValue - visualMin) / visualRange) * 100;

  const dotColor = flagColors[flag] || colors.normal;

  return (
    <div style={{ position: 'relative', height: '8px', marginTop: '6px' }}>
      {/* Track */}
      <div style={{
        position: 'absolute', top: '2px', left: 0, right: 0, height: '4px',
        background: colors.track, borderRadius: '2px'
      }} />
      {/* Optimal/ref zone */}
      <div style={{
        position: 'absolute', top: '0px', height: '8px',
        left: `${refLeftPct}%`, width: `${refWidthPct}%`,
        background: 'rgba(40, 167, 69, 0.15)', borderRadius: '4px',
        border: '1px solid rgba(40, 167, 69, 0.3)'
      }} />
      {/* Value dot */}
      <div style={{
        position: 'absolute', top: '0px',
        left: `${dotPct}%`, transform: 'translateX(-50%)',
        width: '8px', height: '8px', borderRadius: '50%',
        background: dotColor, border: `2px solid ${colors.white}`,
        boxShadow: `0 0 0 1px ${dotColor}`
      }} />
    </div>
  );
}
