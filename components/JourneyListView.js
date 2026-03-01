// components/JourneyListView.js
// List/table view for patient journeys with progress bars
// Range Medical System V2

import { useState, useCallback } from 'react';
import Link from 'next/link';

const statusColors = {
  active: { background: '#dcfce7', color: '#166534' },
  paused: { background: '#fef3c7', color: '#92400e' },
  completed: { background: '#dbeafe', color: '#1e40af' },
  cancelled: { background: '#f3f4f6', color: '#6b7280' }
};

function ProgressBar({ currentStageIndex, totalStages, stages, isUnassigned }) {
  return (
    <div style={listStyles.progressWrapper}>
      <div style={listStyles.progressTrack}>
        {stages.map((stage, i) => {
          const isCompleted = !isUnassigned && i < currentStageIndex;
          const isCurrent = !isUnassigned && i === currentStageIndex;
          const segmentWidth = `${100 / stages.length}%`;

          return (
            <div
              key={stage.key}
              title={stage.label}
              style={{
                width: segmentWidth,
                height: '100%',
                background: isCompleted ? '#000' : isCurrent ? '#555' : '#e5e7eb',
                borderRadius: i === 0 ? '4px 0 0 4px' : i === stages.length - 1 ? '0 4px 4px 0' : '0',
                borderRight: i < stages.length - 1 ? '1px solid #fff' : 'none',
                transition: 'background 0.3s'
              }}
            />
          );
        })}
      </div>
      <span style={listStyles.progressLabel}>
        {isUnassigned ? 0 : currentStageIndex + 1} of {totalStages}
      </span>
    </div>
  );
}

export default function JourneyListView({ columns, summary, stages, onAdvance, onProtocolClick, loading }) {
  const [hoveredRow, setHoveredRow] = useState(null);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
        Loading journey data...
      </div>
    );
  }

  // Flatten all patients from columns, with their stage info
  const allPatients = [];
  const stageList = stages || [];
  const stageIndexMap = {};
  stageList.forEach((s, i) => { stageIndexMap[s.key] = i; });

  if (columns) {
    for (const col of columns) {
      for (const patient of col.patients) {
        allPatients.push({
          ...patient,
          stageLabel: col.label,
          stageIndex: stageIndexMap[col.key] !== undefined ? stageIndexMap[col.key] : -1,
          stageKey: col.key
        });
      }
    }
  }

  // Sort: by stage progress (furthest along first), then by name
  allPatients.sort((a, b) => {
    if (a.stageIndex !== b.stageIndex) return a.stageIndex - b.stageIndex;
    return (a.patientName || '').localeCompare(b.patientName || '');
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysSince = (dateStr) => {
    if (!dateStr) return null;
    const start = new Date(dateStr + 'T12:00:00');
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  };

  if (allPatients.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
        No patients on this journey board yet.
      </div>
    );
  }

  return (
    <>
      {summary && (
        <div style={listStyles.summary}>
          <div style={listStyles.summaryItem}>
            <span style={listStyles.summaryNumber}>{summary.totalPatients}</span>
            <span>total patients</span>
          </div>
          <div style={listStyles.summaryItem}>
            <span style={listStyles.summaryNumber}>{summary.assignedPatients}</span>
            <span>on board</span>
          </div>
          {summary.unassigned > 0 && (
            <div style={listStyles.summaryItem}>
              <span style={{ ...listStyles.summaryNumber, color: '#f59e0b' }}>{summary.unassigned}</span>
              <span>unassigned</span>
            </div>
          )}
        </div>
      )}

      <div style={listStyles.tableCard}>
        <table style={listStyles.table}>
          <thead>
            <tr>
              <th style={listStyles.th}>Patient</th>
              <th style={listStyles.th}>Current Stage</th>
              <th style={{ ...listStyles.th, minWidth: '180px' }}>Progress</th>
              <th style={listStyles.th}>Protocol</th>
              <th style={listStyles.th}>Days</th>
              <th style={listStyles.th}>Status</th>
              <th style={{ ...listStyles.th, textAlign: 'right' }}>Assign Stage</th>
            </tr>
          </thead>
          <tbody>
            {allPatients.map(patient => {
              const days = daysSince(patient.startDate);
              const statusStyle = statusColors[patient.status] || statusColors.active;
              const isUnassigned = patient.stageKey === '_unassigned';

              return (
                <tr
                  key={patient.protocolId}
                  style={{
                    ...listStyles.tr,
                    ...(hoveredRow === patient.protocolId ? { background: '#f9fafb' } : {})
                  }}
                  onClick={() => onProtocolClick && onProtocolClick(patient)}
                  onMouseEnter={() => setHoveredRow(patient.protocolId)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={listStyles.td}>
                    <Link href={`/patients/${patient.patientId}`} style={listStyles.patientLink} onClick={(e) => e.stopPropagation()}>
                      {patient.patientName}
                    </Link>
                  </td>
                  <td style={listStyles.td}>
                    <span style={{
                      ...listStyles.stageBadge,
                      ...(isUnassigned ? { background: '#fef3c7', color: '#92400e' } : {})
                    }}>
                      {patient.stageLabel}
                    </span>
                  </td>
                  <td style={listStyles.td}>
                    <ProgressBar
                      currentStageIndex={patient.stageIndex >= 0 ? patient.stageIndex : 0}
                      totalStages={stageList.length}
                      stages={stageList}
                      isUnassigned={isUnassigned}
                    />
                  </td>
                  <td style={listStyles.td}>
                    <div style={listStyles.protocolInfo}>
                      {patient.programName || patient.medication || '—'}
                      {(patient.dose || patient.frequency) && (
                        <span style={listStyles.protocolDetail}>
                          {[patient.dose, patient.frequency].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={listStyles.td}>
                    {days !== null ? (
                      <span style={listStyles.dayCount}>
                        {days}
                        <span style={listStyles.dayLabel}>d</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td style={listStyles.td}>
                    <span style={{ ...listStyles.statusBadge, ...statusStyle }}>
                      {patient.status}
                    </span>
                  </td>
                  <td style={{ ...listStyles.td, textAlign: 'right' }}>
                    <select
                      value={isUnassigned ? '' : patient.stageKey}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const newStage = e.target.value;
                        if (newStage && newStage !== patient.stageKey && onAdvance) {
                          onAdvance(patient.protocolId, newStage, patient.stageKey || '_unassigned');
                        }
                      }}
                      style={{
                        ...listStyles.stageSelect,
                        ...(isUnassigned ? listStyles.stageSelectUnassigned : {})
                      }}
                    >
                      {isUnassigned && (
                        <option value="">— Select Stage —</option>
                      )}
                      {stageList.map((stage, i) => (
                        <option key={stage.key} value={stage.key}>
                          {i + 1}. {stage.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

const listStyles = {
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
  tableCard: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa',
    whiteSpace: 'nowrap'
  },
  tr: {
    transition: 'background 0.1s',
    cursor: 'pointer'
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle'
  },
  patientLink: {
    fontWeight: '600',
    color: '#111',
    textDecoration: 'none',
    fontSize: '14px'
  },
  stageBadge: {
    padding: '4px 10px',
    background: '#f3f4f6',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#374151',
    whiteSpace: 'nowrap'
  },
  progressWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  progressTrack: {
    flex: 1,
    height: '8px',
    borderRadius: '4px',
    display: 'flex',
    overflow: 'hidden',
    background: '#e5e7eb'
  },
  progressLabel: {
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  protocolInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  protocolDetail: {
    fontSize: '11px',
    color: '#9ca3af'
  },
  dayCount: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#111'
  },
  dayLabel: {
    fontWeight: '400',
    color: '#9ca3af',
    fontSize: '12px',
    marginLeft: '1px'
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  stageSelect: {
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#374151',
    background: '#fff',
    minWidth: '160px',
    appearance: 'auto'
  },
  stageSelectUnassigned: {
    border: '1px solid #000',
    fontWeight: '600',
    color: '#000'
  }
};
