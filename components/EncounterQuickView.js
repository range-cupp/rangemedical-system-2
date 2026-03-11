// components/EncounterQuickView.js
// Past Encounters Quick View — split-panel modal showing encounter history + note synopsis

import { useState, useMemo } from 'react';

export default function EncounterQuickView({ appointments, notes, onClose, onOpenEncounter }) {
  const [selectedAptId, setSelectedAptId] = useState(null);

  // Filter to past appointments that have encounter notes, sorted most recent first
  const pastEncounters = useMemo(() => {
    const now = new Date();
    return (appointments || [])
      .filter(apt => {
        const aptDate = new Date(apt.start_time);
        return aptDate < now && (apt.encounter_note_count || 0) > 0;
      })
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  }, [appointments]);

  // Group notes by appointment_id
  const notesByApt = useMemo(() => {
    const map = {};
    (notes || []).forEach(note => {
      if (note.appointment_id) {
        if (!map[note.appointment_id]) map[note.appointment_id] = [];
        map[note.appointment_id].push(note);
      }
    });
    // Sort each group: main notes first, then addendums, by date
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => {
        if (a.source === 'addendum' && b.source !== 'addendum') return 1;
        if (a.source !== 'addendum' && b.source === 'addendum') return -1;
        return new Date(a.created_at) - new Date(b.created_at);
      });
    });
    return map;
  }, [notes]);

  // Auto-select first encounter
  const activeAptId = selectedAptId || (pastEncounters.length > 0 ? pastEncounters[0].id : null);
  const activeApt = pastEncounters.find(a => a.id === activeAptId);
  const activeNotes = activeAptId ? (notesByApt[activeAptId] || []) : [];

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
  };

  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
  };

  const formatFullDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
  };

  if (pastEncounters.length === 0) return null;

  return (
    <>
      <style jsx>{`
        .eqv-overlay {
          position: fixed; inset: 0; z-index: 999;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          animation: eqvFadeIn 0.2s ease-out;
        }
        @keyframes eqvFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes eqvSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .eqv-modal {
          background: #fff; border-radius: 16px; width: 95vw; max-width: 960px;
          height: 80vh; max-height: 700px; display: flex; flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          animation: eqvSlideUp 0.25s ease-out;
          overflow: hidden;
        }
        .eqv-header {
          padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #f0f0f0;
        }
        .eqv-title { font-size: 17px; font-weight: 700; color: #111; margin: 0; letter-spacing: -0.2px; }
        .eqv-subtitle { font-size: 12px; color: #9ca3af; margin-top: 1px; }
        .eqv-close {
          width: 32px; height: 32px; border-radius: 8px; border: none; background: #f3f4f6;
          font-size: 18px; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .eqv-close:hover { background: #e5e7eb; color: #111; }

        .eqv-body { display: flex; flex: 1; overflow: hidden; }

        /* Left panel — encounter list */
        .eqv-list {
          width: 280px; min-width: 280px; border-right: 1px solid #f0f0f0;
          overflow-y: auto; background: #fafbfc;
        }
        .eqv-list-item {
          padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f5f5f5;
          transition: background 0.1s;
        }
        .eqv-list-item:hover { background: #f0f1f3; }
        .eqv-list-item.active { background: #111; }
        .eqv-list-item.active .eqv-item-date,
        .eqv-list-item.active .eqv-item-service,
        .eqv-list-item.active .eqv-item-meta { color: #fff; }
        .eqv-list-item.active .eqv-item-badge { background: rgba(255,255,255,0.2); color: #fff; }
        .eqv-item-date { font-size: 12px; font-weight: 600; color: #6b7280; }
        .eqv-item-service { font-size: 14px; font-weight: 600; color: #111; margin-top: 2px; line-height: 1.3; }
        .eqv-item-meta { font-size: 11px; color: #9ca3af; margin-top: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .eqv-item-badge {
          padding: 1px 7px; border-radius: 10px; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.03em;
        }
        .eqv-badge-signed { background: #ecfdf5; color: #059669; }
        .eqv-badge-draft { background: #f3f4f6; color: #6b7280; }
        .eqv-badge-notes { background: #ede9fe; color: #6d28d9; }

        /* Right panel — encounter detail */
        .eqv-detail { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .eqv-detail-header {
          padding: 16px 20px; border-bottom: 1px solid #f0f0f0; background: #fafbfc;
        }
        .eqv-detail-title { font-size: 16px; font-weight: 700; color: #111; }
        .eqv-detail-subtitle { font-size: 13px; color: #6b7280; margin-top: 2px; }
        .eqv-detail-meta {
          display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; font-size: 12px; color: #6b7280;
        }
        .eqv-detail-meta-item { display: flex; align-items: center; gap: 4px; }
        .eqv-detail-meta-label { font-weight: 600; color: #374151; }

        .eqv-detail-content { flex: 1; padding: 20px; overflow-y: auto; }

        .eqv-note-card {
          margin-bottom: 14px; padding: 14px 16px; border: 1px solid #eee; border-radius: 10px;
          background: #fff;
        }
        .eqv-note-card.addendum { background: #fffef5; border-color: #fde68a; }
        .eqv-note-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
        }
        .eqv-note-meta { font-size: 12px; color: #9ca3af; display: flex; align-items: center; gap: 8px; }
        .eqv-note-status {
          padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;
        }
        .eqv-note-body {
          white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #1f2937;
        }
        .eqv-addendum-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          color: #b45309; margin-bottom: 6px;
        }

        .eqv-detail-footer {
          padding: 12px 20px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end;
        }
        .eqv-btn {
          padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: 8px;
          border: none; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px;
        }
        .eqv-btn-primary { background: #111; color: #fff; }
        .eqv-btn-primary:hover { background: #333; }
        .eqv-btn-secondary { background: #fff; color: #374151; border: 1px solid #d1d5db; }
        .eqv-btn-secondary:hover { background: #f9fafb; }

        .eqv-empty-detail {
          flex: 1; display: flex; align-items: center; justify-content: center;
          color: #9ca3af; font-size: 14px;
        }
      `}</style>

      <div className="eqv-overlay" onClick={onClose}>
        <div className="eqv-modal" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="eqv-header">
            <div>
              <h3 className="eqv-title">Past Encounters</h3>
              <div className="eqv-subtitle">{pastEncounters.length} encounter{pastEncounters.length !== 1 ? 's' : ''} with notes</div>
            </div>
            <button onClick={onClose} className="eqv-close">×</button>
          </div>

          <div className="eqv-body">
            {/* Left — encounter list */}
            <div className="eqv-list">
              {pastEncounters.map(apt => {
                const aptNotes = notesByApt[apt.id] || [];
                const mainNote = aptNotes.find(n => n.source !== 'addendum');
                const hasSigned = aptNotes.some(n => n.status === 'signed');
                const isActive = apt.id === activeAptId;

                return (
                  <div
                    key={apt.id}
                    className={`eqv-list-item${isActive ? ' active' : ''}`}
                    onClick={() => setSelectedAptId(apt.id)}
                  >
                    <div className="eqv-item-date">{formatDate(apt.start_time)}</div>
                    <div className="eqv-item-service">
                      {apt.calendar_name || apt.appointment_title || 'Appointment'}
                    </div>
                    <div className="eqv-item-meta">
                      {apt.provider && <span>{apt.provider}</span>}
                      {!apt.provider && mainNote?.created_by && <span>{mainNote.created_by}</span>}
                      <span className={`eqv-item-badge ${hasSigned ? 'eqv-badge-signed' : 'eqv-badge-draft'}`}>
                        {hasSigned ? '✓ Signed' : 'Draft'}
                      </span>
                      {aptNotes.length > 1 && (
                        <span className="eqv-item-badge eqv-badge-notes">{aptNotes.length} notes</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right — encounter detail */}
            {activeApt ? (
              <div className="eqv-detail">
                <div className="eqv-detail-header">
                  <div className="eqv-detail-title">
                    {activeApt.calendar_name || activeApt.appointment_title || 'Appointment'}
                  </div>
                  <div className="eqv-detail-subtitle">
                    {formatFullDate(activeApt.start_time)} at {formatTime(activeApt.start_time)}
                  </div>
                  <div className="eqv-detail-meta">
                    {activeApt.provider && (
                      <div className="eqv-detail-meta-item">
                        <span className="eqv-detail-meta-label">Provider</span>
                        <span>{activeApt.provider}</span>
                      </div>
                    )}
                    <div className="eqv-detail-meta-item">
                      <span className="eqv-detail-meta-label">Status</span>
                      <span style={{ textTransform: 'capitalize' }}>{(activeApt.status || 'completed').replace('_', ' ')}</span>
                    </div>
                    {activeApt.appointment_title && activeApt.appointment_title !== activeApt.calendar_name && (
                      <div className="eqv-detail-meta-item">
                        <span className="eqv-detail-meta-label">Service</span>
                        <span>{activeApt.appointment_title}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="eqv-detail-content">
                  {activeNotes.length === 0 ? (
                    <div className="eqv-empty-detail">No notes found for this encounter</div>
                  ) : (
                    activeNotes.map(note => (
                      <div key={note.id} className={`eqv-note-card${note.source === 'addendum' ? ' addendum' : ''}`}>
                        {note.source === 'addendum' && (
                          <div className="eqv-addendum-label">Addendum</div>
                        )}
                        <div className="eqv-note-header">
                          <div className="eqv-note-meta">
                            <span>{formatDate(note.note_date || note.created_at)}</span>
                            {note.created_by && <span>by {note.created_by}</span>}
                          </div>
                          <span className="eqv-note-status" style={{
                            background: note.status === 'signed' ? '#ecfdf5' : '#f3f4f6',
                            color: note.status === 'signed' ? '#059669' : '#6b7280',
                          }}>
                            {note.status === 'signed'
                              ? `✓ Signed${note.signed_by ? ` by ${note.signed_by}` : ''}`
                              : 'Draft'}
                          </span>
                        </div>
                        <div className="eqv-note-body">{note.body}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="eqv-detail-footer">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenEncounter) onOpenEncounter(activeApt);
                    }}
                    className="eqv-btn eqv-btn-primary"
                  >
                    Open Full Encounter →
                  </button>
                </div>
              </div>
            ) : (
              <div className="eqv-detail">
                <div className="eqv-empty-detail">Select an encounter to view</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
