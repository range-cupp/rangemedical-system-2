// components/JourneyBoard.js
// Kanban board for visualizing patient journey stages
// Range Medical System V2
// Supports drag-and-drop stage advancement

import { useState, useCallback } from 'react';
import JourneyCard from './JourneyCard';

const boardStyles = {
  container: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '16px',
    minHeight: '400px'
  },
  column: {
    minWidth: '260px',
    maxWidth: '300px',
    flex: '1 0 260px',
    background: '#f5f5f5',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 280px)'
  },
  columnDragOver: {
    background: '#e8e8e8',
    outline: '2px dashed #000',
    outlineOffset: '-2px'
  },
  columnHeader: {
    padding: '12px 14px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  },
  columnTitle: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#111'
  },
  columnCount: {
    background: '#e5e7eb',
    color: '#374151',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '500'
  },
  columnBody: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
    flex: 1
  },
  emptyColumn: {
    padding: '24px 12px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
    fontStyle: 'italic'
  },
  summary: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#6b7280'
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  summaryNumber: {
    fontWeight: '600',
    color: '#111',
    fontSize: '18px'
  },
  dropHint: {
    padding: '12px',
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '12px',
    margin: '4px 0'
  }
};

export default function JourneyBoard({ columns, summary, onAdvance, loading }) {
  const [dragItem, setDragItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = useCallback((card) => {
    setDragItem(card);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragItem(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e, columnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e, columnKey) => {
    e.preventDefault();
    setDragOverColumn(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.protocolId && data.currentStage !== columnKey) {
        onAdvance && onAdvance(data.protocolId, columnKey, data.currentStage);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  }, [onAdvance]);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
        Loading journey board...
      </div>
    );
  }

  if (!columns || columns.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
        No journey template found. Select a protocol type to view the board.
      </div>
    );
  }

  return (
    <>
      {summary && (
        <div style={boardStyles.summary}>
          <div style={boardStyles.summaryItem}>
            <span style={boardStyles.summaryNumber}>{summary.totalPatients}</span>
            <span>total patients</span>
          </div>
          <div style={boardStyles.summaryItem}>
            <span style={boardStyles.summaryNumber}>{summary.assignedPatients}</span>
            <span>on board</span>
          </div>
          {summary.unassigned > 0 && (
            <div style={boardStyles.summaryItem}>
              <span style={{ ...boardStyles.summaryNumber, color: '#f59e0b' }}>{summary.unassigned}</span>
              <span>unassigned</span>
            </div>
          )}
        </div>
      )}

      <div style={boardStyles.container}>
        {columns.map(column => {
          const isDragOver = dragOverColumn === column.key;
          const isValidDrop = dragItem && dragItem.currentStage !== column.key;

          return (
            <div
              key={column.key}
              style={{
                ...boardStyles.column,
                ...(isDragOver && isValidDrop ? boardStyles.columnDragOver : {})
              }}
              onDragOver={(e) => handleDragOver(e, column.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.key)}
            >
              <div style={boardStyles.columnHeader}>
                <span style={boardStyles.columnTitle}>{column.label}</span>
                <span style={boardStyles.columnCount}>{column.patients.length}</span>
              </div>

              <div style={boardStyles.columnBody}>
                {column.patients.length === 0 ? (
                  dragItem ? (
                    <div style={boardStyles.dropHint}>Drop here</div>
                  ) : (
                    <div style={boardStyles.emptyColumn}>No patients</div>
                  )
                ) : (
                  column.patients.map(card => (
                    <JourneyCard
                      key={card.protocolId}
                      card={card}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={dragItem?.protocolId === card.protocolId}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
