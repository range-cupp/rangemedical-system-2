// components/JourneyCard.js
// Patient card for the Journey Board Kanban columns
// Range Medical System V2

import Link from 'next/link';

const cardStyles = {
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px',
    cursor: 'grab',
    transition: 'box-shadow 0.15s, border-color 0.15s',
    fontSize: '13px'
  },
  cardDragging: {
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    borderColor: '#000',
    opacity: 0.9
  },
  nameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
    gap: '8px'
  },
  name: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#111',
    textDecoration: 'none',
    lineHeight: '1.3'
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },
  protocol: {
    color: '#6b7280',
    fontSize: '12px',
    marginBottom: '4px'
  },
  detail: {
    color: '#9ca3af',
    fontSize: '11px'
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #f3f4f6'
  },
  sessions: {
    fontSize: '11px',
    color: '#6b7280'
  },
  date: {
    fontSize: '11px',
    color: '#9ca3af'
  }
};

const statusColors = {
  active: { background: '#dcfce7', color: '#166534' },
  paused: { background: '#fef3c7', color: '#92400e' },
  completed: { background: '#dbeafe', color: '#1e40af' },
  cancelled: { background: '#f3f4f6', color: '#6b7280' }
};

export default function JourneyCard({ card, onDragStart, onDragEnd, isDragging }) {
  const statusStyle = statusColors[card.status] || statusColors.active;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const daysSinceStart = () => {
    if (!card.startDate) return null;
    const start = new Date(card.startDate);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  };

  const days = daysSinceStart();

  return (
    <div
      style={{
        ...cardStyles.card,
        ...(isDragging ? cardStyles.cardDragging : {})
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
          protocolId: card.protocolId,
          currentStage: card.currentStage
        }));
        onDragStart && onDragStart(card);
      }}
      onDragEnd={() => onDragEnd && onDragEnd()}
    >
      <div style={cardStyles.nameRow}>
        <Link href={`/patients/${card.patientId}`} style={cardStyles.name}>
          {card.patientName}
        </Link>
        <span style={{ ...cardStyles.statusBadge, ...statusStyle }}>
          {card.status}
        </span>
      </div>

      <div style={cardStyles.protocol}>
        {card.programName || card.medication || 'Protocol'}
      </div>

      {(card.dose || card.frequency) && (
        <div style={cardStyles.detail}>
          {[card.dose, card.frequency].filter(Boolean).join(' • ')}
        </div>
      )}

      <div style={cardStyles.meta}>
        {card.totalSessions ? (
          <span style={cardStyles.sessions}>
            {card.sessionsUsed || 0}/{card.totalSessions} sessions
          </span>
        ) : days !== null ? (
          <span style={cardStyles.sessions}>Day {days}</span>
        ) : (
          <span style={cardStyles.sessions}></span>
        )}
        <span style={cardStyles.date}>
          {card.startDate ? `Started ${formatDate(card.startDate)}` : ''}
        </span>
      </div>
    </div>
  );
}
