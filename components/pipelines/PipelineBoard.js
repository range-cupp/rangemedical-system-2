// PipelineBoard — renders the full kanban for one pipeline.
// Horizontal scroll; stages read from pipelines-config.

import StageColumn from './StageColumn';

export default function PipelineBoard({ pipeline, cards, onCardClick }) {
  if (!pipeline) return null;

  const byStage = Object.fromEntries(pipeline.stages.map(s => [s.key, []]));
  for (const c of cards) {
    if (byStage[c.stage]) byStage[c.stage].push(c);
  }

  return (
    <div style={styles.scroller}>
      <div style={styles.board}>
        {pipeline.stages.map(stage => (
          <StageColumn
            key={stage.key}
            stage={stage}
            cards={byStage[stage.key] || []}
            pipeline={pipeline}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  scroller: {
    overflowX: 'auto',
    marginLeft: '-2rem',
    marginRight: '-2rem',
    padding: '0 2rem 12px',
  },
  board: {
    display: 'flex',
    gap: '20px',
    minWidth: 'fit-content',
    alignItems: 'flex-start',
  },
};
