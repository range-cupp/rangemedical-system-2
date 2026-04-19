// PipelineFilterChips — horizontal chip filters above a board.
// Used for HRT/WL delivery mode, injection type, etc.

export default function PipelineFilterChips({ filters, values, onChange }) {
  if (!filters) return null;
  const entries = Object.entries(filters);
  if (entries.length === 0) return null;

  return (
    <div style={styles.bar}>
      {entries.map(([key, def]) => (
        <div key={key} style={styles.group}>
          <div style={styles.label}>{def.label}</div>
          <div style={styles.chips}>
            <Chip
              active={!values?.[key]}
              onClick={() => onChange({ ...values, [key]: null })}
              label="All"
            />
            {def.values.map(v => (
              <Chip
                key={v.value}
                active={values?.[key] === v.value}
                onClick={() => onChange({ ...values, [key]: v.value })}
                label={v.label}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Chip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.chip,
        ...(active ? styles.chipActive : null),
      }}
    >
      {label}
    </button>
  );
}

const styles = {
  bar: {
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap',
    padding: '0 0 20px',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '24px',
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  label: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#737373',
  },
  chips: {
    display: 'flex',
    gap: '0',
  },
  chip: {
    fontFamily: 'Inter, -apple-system, sans-serif',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '8px 16px',
    background: '#ffffff',
    color: '#737373',
    border: '1px solid #e0e0e0',
    borderRadius: 0,
    cursor: 'pointer',
    marginLeft: '-1px',
    transition: 'all 0.15s',
  },
  chipActive: {
    background: '#1a1a1a',
    color: '#ffffff',
    borderColor: '#1a1a1a',
    zIndex: 1,
    position: 'relative',
  },
};
