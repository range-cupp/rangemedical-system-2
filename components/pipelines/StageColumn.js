// StageColumn — one kanban column containing cards at a stage.
// V2 editorial: tight uppercase header, thin rule below, vertical card stack.

import PipelineCard from './PipelineCard';

export default function StageColumn({ stage, cards, pipeline, onCardClick }) {
  return (
    <div style={styles.column}>
      <div style={styles.header}>
        <div style={styles.label}>{stage.label}</div>
        <div style={styles.count}>{cards.length}</div>
      </div>
      <div style={styles.rule} />

      <div style={styles.body}>
        {cards.length === 0 ? (
          <div style={styles.empty}>No cards</div>
        ) : (
          cards.map(card => (
            <PipelineCard
              key={card.id}
              card={card}
              pipeline={pipeline}
              onClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  column: {
    minWidth: '280px',
    maxWidth: '280px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '0 4px 8px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#1a1a1a',
  },
  count: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#a0a0a0',
    letterSpacing: '0.1em',
  },
  rule: {
    height: '1px',
    background: '#1a1a1a',
    marginBottom: '12px',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingBottom: '40px',
  },
  empty: {
    fontSize: '11px',
    color: '#a0a0a0',
    textAlign: 'center',
    padding: '24px 0',
    fontStyle: 'italic',
    letterSpacing: '0.05em',
  },
};
