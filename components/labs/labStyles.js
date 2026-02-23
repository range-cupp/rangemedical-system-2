// components/labs/labStyles.js
// Shared design tokens for the lab results dashboard

export const colors = {
  cardBg: '#F8F8F8',
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
  black: '#000000'
};

export const flagColors = {
  high: colors.flagged,
  low: colors.flagged,
  borderline_high: colors.borderline,
  borderline_low: colors.borderline,
  optimal: colors.optimal,
  normal: colors.normal
};

export const flagBgColors = {
  high: colors.flaggedBg,
  low: colors.flaggedBg,
  borderline_high: colors.borderlineBg,
  borderline_low: colors.borderlineBg,
  optimal: colors.optimalBg,
  normal: colors.normalBg
};

export const flagLabels = {
  high: 'HIGH',
  low: 'LOW',
  borderline_high: 'BORDERLINE HIGH',
  borderline_low: 'BORDERLINE LOW',
  optimal: 'OPTIMAL',
  normal: 'NORMAL'
};

export const styles = {
  categoryHeader: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: colors.textSecondary,
    padding: '12px 0 8px',
    borderBottom: `1px solid ${colors.border}`,
    marginTop: '24px',
    marginBottom: '12px'
  },
  filterPill: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: `1px solid ${colors.border}`,
    background: colors.white,
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: colors.textSecondary,
    transition: 'all 0.15s ease'
  },
  filterPillActive: {
    background: colors.black,
    color: colors.white,
    borderColor: colors.black
  },
  statBox: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600
  },
  labTab: {
    padding: '8px 16px',
    border: `1px solid ${colors.border}`,
    borderBottom: 'none',
    background: colors.white,
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    borderRadius: '6px 6px 0 0',
    color: colors.textSecondary
  },
  labTabActive: {
    background: colors.black,
    color: colors.white,
    borderColor: colors.black
  },
  viewToggle: {
    display: 'inline-flex',
    borderRadius: '6px',
    overflow: 'hidden',
    border: `1px solid ${colors.border}`
  },
  viewToggleBtn: {
    padding: '6px 14px',
    border: 'none',
    background: colors.white,
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: colors.textSecondary
  },
  viewToggleBtnActive: {
    background: colors.black,
    color: colors.white
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: colors.textSecondary,
    fontSize: '0.9375rem'
  }
};
