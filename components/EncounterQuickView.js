// components/EncounterQuickView.js
// Quick View — tabbed split-panel modal showing encounters + protocols
// Tabs: Encounters | Protocols

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getCategoryStyle } from '../lib/protocol-config';

export default function EncounterQuickView({ appointments, notes, protocols, onClose, onOpenEncounter }) {
  const [activeTab, setActiveTab] = useState('encounters');
  const [selectedAptId, setSelectedAptId] = useState(null);
  const [selectedProtocolId, setSelectedProtocolId] = useState(null);

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

  // Sort protocols: active first, then completed, newest start_date first
  const sortedProtocols = useMemo(() => {
    return [...(protocols || [])].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return new Date(b.start_date || 0) - new Date(a.start_date || 0);
    });
  }, [protocols]);

  // Encounters state
  const activeAptId = selectedAptId || (pastEncounters.length > 0 ? pastEncounters[0].id : null);
  const activeApt = pastEncounters.find(a => a.id === activeAptId);
  const activeNotes = activeAptId ? (notesByApt[activeAptId] || []) : [];

  // Protocols state
  const activeProtocolId = selectedProtocolId || (sortedProtocols.length > 0 ? sortedProtocols[0].id : null);
  const activeProtocol = sortedProtocols.find(p => p.id === activeProtocolId);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
  };

  const formatShortDate = (d) => {
    if (!d) return '';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
  };

  const formatFullDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
  };

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

        /* Tab bar */
        .eqv-tabs {
          display: flex; gap: 4px; padding: 8px 20px; border-bottom: 1px solid #f0f0f0;
          background: #fafbfc;
        }
        .eqv-tab {
          padding: 7px 16px; font-size: 13px; font-weight: 600; border-radius: 8px;
          border: none; cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; gap: 6px;
          background: transparent; color: #6b7280;
        }
        .eqv-tab:hover { background: #f0f1f3; color: #374151; }
        .eqv-tab.active { background: #111; color: #fff; }
        .eqv-tab-count {
          font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 10px;
        }
        .eqv-tab.active .eqv-tab-count { background: rgba(255,255,255,0.2); color: #fff; }
        .eqv-tab:not(.active) .eqv-tab-count { background: #e5e7eb; color: #6b7280; }

        .eqv-body { display: flex; flex: 1; overflow: hidden; }

        /* Left panel — list */
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
        .eqv-badge-active { background: #dcfce7; color: #166534; }
        .eqv-badge-completed { background: #f3f4f6; color: #6b7280; }

        /* Right panel — detail */
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
          text-decoration: none;
        }
        .eqv-btn-primary { background: #111; color: #fff; }
        .eqv-btn-primary:hover { background: #333; }
        .eqv-btn-secondary { background: #fff; color: #374151; border: 1px solid #d1d5db; }
        .eqv-btn-secondary:hover { background: #f9fafb; }

        .eqv-empty-detail {
          flex: 1; display: flex; align-items: center; justify-content: center;
          color: #9ca3af; font-size: 14px;
        }

        /* Protocol detail stats */
        .eqv-proto-stats {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;
          margin-bottom: 16px;
        }
        .eqv-proto-stat {
          padding: 10px 14px; background: #f9fafb; border-radius: 8px; border: 1px solid #f0f0f0;
        }
        .eqv-proto-stat-label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; }
        .eqv-proto-stat-value { font-size: 14px; font-weight: 600; color: #111; margin-top: 2px; }
        .eqv-proto-progress {
          margin-bottom: 16px; padding: 14px 16px; background: #f0f9ff; border-radius: 10px; border: 1px solid #bae6fd;
        }
        .eqv-proto-progress-bar {
          height: 8px; background: #e0e7ff; border-radius: 4px; overflow: hidden; margin-top: 8px;
        }
        .eqv-proto-progress-fill {
          height: 100%; background: #2563eb; border-radius: 4px; transition: width 0.3s;
        }
        .eqv-proto-notes {
          padding: 14px 16px; background: #fffbeb; border-radius: 10px; border: 1px solid #fde68a;
          font-size: 13px; line-height: 1.6; color: #92400e; white-space: pre-wrap;
        }
        .eqv-proto-notes-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
          color: #b45309; margin-bottom: 6px;
        }
        .eqv-cat-badge {
          display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
        }
      `}</style>

      <div className="eqv-overlay" onClick={onClose}>
        <div className="eqv-modal" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="eqv-header">
            <div>
              <h3 className="eqv-title">Quick View</h3>
              <div className="eqv-subtitle">
                {activeTab === 'encounters'
                  ? `${pastEncounters.length} encounter${pastEncounters.length !== 1 ? 's' : ''} with notes`
                  : `${sortedProtocols.length} protocol${sortedProtocols.length !== 1 ? 's' : ''}`
                }
              </div>
            </div>
            <button onClick={onClose} className="eqv-close">×</button>
          </div>

          {/* Tab bar */}
          <div className="eqv-tabs">
            <button
              className={`eqv-tab${activeTab === 'encounters' ? ' active' : ''}`}
              onClick={() => setActiveTab('encounters')}
            >
              Encounters
              <span className="eqv-tab-count">{pastEncounters.length}</span>
            </button>
            <button
              className={`eqv-tab${activeTab === 'protocols' ? ' active' : ''}`}
              onClick={() => setActiveTab('protocols')}
            >
              Protocols
              <span className="eqv-tab-count">{sortedProtocols.length}</span>
            </button>
          </div>

          {/* Body */}
          <div className="eqv-body">
            {/* =================== ENCOUNTERS TAB =================== */}
            {activeTab === 'encounters' && (
              <>
                {/* Left — encounter list */}
                <div className="eqv-list">
                  {pastEncounters.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                      No encounters with notes
                    </div>
                  ) : pastEncounters.map(apt => {
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
              </>
            )}

            {/* =================== PROTOCOLS TAB =================== */}
            {activeTab === 'protocols' && (
              <>
                {/* Left — protocol list */}
                <div className="eqv-list">
                  {sortedProtocols.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                      No protocols found
                    </div>
                  ) : sortedProtocols.map(proto => {
                    const cat = getCategoryStyle(proto.category);
                    const isActive = proto.id === activeProtocolId;
                    const isOngoing = proto.category === 'hrt';

                    return (
                      <div
                        key={proto.id}
                        className={`eqv-list-item${isActive ? ' active' : ''}`}
                        onClick={() => setSelectedProtocolId(proto.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span
                            className="eqv-cat-badge"
                            style={{
                              background: isActive ? 'rgba(255,255,255,0.2)' : cat.bg,
                              color: isActive ? '#fff' : cat.text
                            }}
                          >
                            {cat.label}
                          </span>
                          <span className={`eqv-item-badge ${proto.status === 'active' ? 'eqv-badge-active' : 'eqv-badge-completed'}`}
                            style={isActive ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : {}}
                          >
                            {proto.status === 'active' ? 'Active' : 'Completed'}
                          </span>
                        </div>
                        <div className="eqv-item-service">
                          {proto.program_name || proto.medication || 'Protocol'}
                        </div>
                        <div className="eqv-item-meta">
                          {proto.medication && proto.program_name && proto.medication !== proto.program_name && (
                            <span>{proto.medication}</span>
                          )}
                          {proto.start_date && (
                            <span>
                              {formatShortDate(proto.start_date)}
                              {isOngoing ? ' → Ongoing' : proto.end_date ? ` → ${formatShortDate(proto.end_date)}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right — protocol detail */}
                {activeProtocol ? (
                  <div className="eqv-detail">
                    <div className="eqv-detail-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {(() => {
                          const cat = getCategoryStyle(activeProtocol.category);
                          return (
                            <span className="eqv-cat-badge" style={{ background: cat.bg, color: cat.text }}>
                              {cat.label}
                            </span>
                          );
                        })()}
                        <span className={`eqv-item-badge ${activeProtocol.status === 'active' ? 'eqv-badge-active' : 'eqv-badge-completed'}`}>
                          {activeProtocol.status === 'active' ? 'Active' : 'Completed'}
                        </span>
                      </div>
                      <div className="eqv-detail-title">
                        {activeProtocol.program_name || activeProtocol.medication || 'Protocol'}
                      </div>
                      {activeProtocol.medication && activeProtocol.program_name && activeProtocol.medication !== activeProtocol.program_name && (
                        <div className="eqv-detail-subtitle">{activeProtocol.medication}</div>
                      )}
                    </div>

                    <div className="eqv-detail-content">
                      {/* Stats grid */}
                      <div className="eqv-proto-stats">
                        {activeProtocol.selected_dose && (
                          <div className="eqv-proto-stat">
                            <div className="eqv-proto-stat-label">Dosage</div>
                            <div className="eqv-proto-stat-value">{activeProtocol.selected_dose}</div>
                          </div>
                        )}
                        {activeProtocol.frequency && (
                          <div className="eqv-proto-stat">
                            <div className="eqv-proto-stat-label">Frequency</div>
                            <div className="eqv-proto-stat-value" style={{ textTransform: 'capitalize' }}>
                              {activeProtocol.frequency.replace(/_/g, ' ')}
                            </div>
                          </div>
                        )}
                        {activeProtocol.delivery_method && (
                          <div className="eqv-proto-stat">
                            <div className="eqv-proto-stat-label">Delivery</div>
                            <div className="eqv-proto-stat-value" style={{ textTransform: 'capitalize' }}>
                              {activeProtocol.delivery_method.replace(/_/g, ' ')}
                            </div>
                          </div>
                        )}
                        {activeProtocol.start_date && (
                          <div className="eqv-proto-stat">
                            <div className="eqv-proto-stat-label">Start Date</div>
                            <div className="eqv-proto-stat-value">{formatShortDate(activeProtocol.start_date)}</div>
                          </div>
                        )}
                        {activeProtocol.end_date && (
                          <div className="eqv-proto-stat">
                            <div className="eqv-proto-stat-label">End Date</div>
                            <div className="eqv-proto-stat-value">{formatShortDate(activeProtocol.end_date)}</div>
                          </div>
                        )}
                        {activeProtocol.num_vials > 0 && (
                          <div className="eqv-proto-stat">
                            <div className="eqv-proto-stat-label">Vials</div>
                            <div className="eqv-proto-stat-value">{activeProtocol.num_vials}</div>
                          </div>
                        )}
                        {activeProtocol.doses_per_vial > 0 && (
                          <div className="eqv-proto-stat">
                            <div className="eqv-proto-stat-label">Doses / Vial</div>
                            <div className="eqv-proto-stat-value">{activeProtocol.doses_per_vial}</div>
                          </div>
                        )}
                      </div>

                      {/* Progress bar (session-based protocols) */}
                      {activeProtocol.total_sessions > 0 && (
                        <div className="eqv-proto-progress">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0369a1' }}>
                              {activeProtocol.sessions_used || 0} / {activeProtocol.total_sessions}
                              {activeProtocol.doses_per_vial ? ' doses' : ' sessions'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                              {Math.round(((activeProtocol.sessions_used || 0) / activeProtocol.total_sessions) * 100)}%
                            </div>
                          </div>
                          <div className="eqv-proto-progress-bar">
                            <div
                              className="eqv-proto-progress-fill"
                              style={{ width: `${Math.min(100, ((activeProtocol.sessions_used || 0) / activeProtocol.total_sessions) * 100)}%` }}
                            />
                          </div>
                          {/* Vial-level progress */}
                          {activeProtocol.doses_per_vial > 0 && activeProtocol.num_vials > 0 && (() => {
                            const used = activeProtocol.sessions_used || 0;
                            const dpv = activeProtocol.doses_per_vial;
                            const numV = activeProtocol.num_vials;
                            const currentVial = Math.min(Math.floor(used / dpv) + 1, numV);
                            const dosesInVial = used - ((currentVial - 1) * dpv);
                            return (
                              <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                                Vial {currentVial} of {numV} — {dosesInVial}/{dpv} doses used
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Notes */}
                      {activeProtocol.notes && (
                        <div className="eqv-proto-notes">
                          <div className="eqv-proto-notes-label">Notes</div>
                          {activeProtocol.notes}
                        </div>
                      )}
                    </div>

                    <div className="eqv-detail-footer">
                      <Link
                        href={`/admin/protocols/${activeProtocol.id}`}
                        className="eqv-btn eqv-btn-primary"
                        onClick={onClose}
                      >
                        Open Protocol →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="eqv-detail">
                    <div className="eqv-empty-detail">Select a protocol to view</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
