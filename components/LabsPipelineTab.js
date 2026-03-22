// /components/LabsPipelineTab.js
// Labs Pipeline Tab - 5-stage Kanban with Due for Labs to-do section
// Range Medical
// CREATED: 2026-01-26
// UPDATED: 2026-03-21 - Restructured: removed draw_scheduled, added treatment_started, added Due for Labs section

import { useState, useEffect } from 'react';
import Link from 'next/link';

const LAB_STAGES = [
  { id: 'blood_draw_complete', label: 'Blood Draw', color: '#f59e0b', icon: '🩸' },
  { id: 'results_received', label: 'Results In', color: '#8b5cf6', icon: '📋' },
  { id: 'provider_reviewed', label: 'Reviewed', color: '#10b981', icon: '👨‍⚕️' },
  { id: 'consult_scheduled', label: 'Consult', color: '#6366f1', icon: '🗓️' },
  { id: 'treatment_started', label: 'Treatment Started', color: '#3b82f6', icon: '✅' }
];

export default function LabsPipelineTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchTimer, setSearchTimer] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/labs-pipeline');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching labs pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Move protocol to a new stage
  const handleMoveStage = async (protocolId, newStage) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/labs-pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: protocolId, newStage })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error moving stage:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Delete (cancel) a lab protocol
  const handleDelete = async (id) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/labs-pipeline', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchData();
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Error deleting:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Search patients for add modal
  const handlePatientSearch = (query) => {
    setPatientSearch(query);
    if (searchTimer) clearTimeout(searchTimer);
    if (query.length < 2) {
      setPatientResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { data: patients } = await supabase
          .from('patients')
          .select('id, name, email, phone')
          .ilike('name', `%${query}%`)
          .limit(8);
        setPatientResults(patients || []);
      } catch (err) {
        console.error('Patient search error:', err);
      }
    }, 300);
    setSearchTimer(timer);
  };

  if (loading) {
    return <div style={styles.loading}>Loading labs pipeline...</div>;
  }

  if (!data) {
    return <div style={styles.error}>Error loading labs pipeline</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header Bar */}
      <div style={styles.headerRow}>
        <div style={styles.headerLeft}>
          <span style={styles.totalBadge}>{data.total} active</span>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.secondaryBtn} onClick={fetchData} disabled={loading}>
            ↻ Refresh
          </button>
          <button style={styles.primaryBtn} onClick={() => setShowAddModal(true)}>
            + Add Lab
          </button>
        </div>
      </div>

      {/* Due for Labs — To-Do Section */}
      {data.dueForLabs && data.dueForLabs.length > 0 && (
        <div style={styles.dueSection}>
          <div style={styles.dueSectionHeader}>
            <span style={styles.dueSectionTitle}>Due for Labs</span>
            <span style={styles.dueSectionCount}>{data.dueForLabs.length}</span>
          </div>
          <div style={styles.dueCards}>
            {data.dueForLabs.map((item, i) => (
              <div key={i} style={styles.dueCard}>
                <div style={styles.dueCardLeft}>
                  <Link href={`/admin/patient/${item.patientId}`} style={styles.dueCardName}>
                    {item.patientName}
                  </Link>
                  <span style={styles.dueCardLabel}>{item.drawLabel}</span>
                </div>
                <div style={styles.dueCardRight}>
                  <span style={{
                    ...styles.dueCardDate,
                    color: item.daysUntilDue < 0 ? '#ef4444' : item.daysUntilDue <= 7 ? '#f59e0b' : '#6b7280'
                  }}>
                    {item.daysUntilDue < 0
                      ? `${Math.abs(item.daysUntilDue)}d overdue`
                      : item.daysUntilDue === 0
                        ? 'Today'
                        : `in ${item.daysUntilDue}d`
                    }
                  </span>
                  {item.phone && (
                    <a href={`tel:${item.phone}`} style={styles.dueCardPhone} title="Call to schedule">
                      📞
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-Column Kanban */}
      <div style={styles.stagesGrid}>
        {LAB_STAGES.map(stage => {
          const items = data.stages[stage.id] || [];
          return (
            <div key={stage.id} style={styles.stageColumn}>
              {/* Stage Header */}
              <div style={styles.stageHeader}>
                <div style={styles.stageHeaderLeft}>
                  <span style={{
                    ...styles.stageDot,
                    background: stage.color,
                    boxShadow: `0 0 0 3px ${stage.color}20`
                  }} />
                  <span style={styles.stageLabel}>{stage.label}</span>
                </div>
                <span style={styles.stageCount}>{items.length}</span>
              </div>

              {/* Cards */}
              <div style={styles.stageBody}>
                {items.map(protocol => (
                  <LabCard
                    key={protocol.id}
                    protocol={protocol}
                    currentStage={stage.id}
                    stageColor={stage.color}
                    onMoveStage={(newStage) => handleMoveStage(protocol.id, newStage)}
                    onDelete={() => setShowDeleteConfirm({ id: protocol.id, name: protocol.patients?.name || 'Unknown' })}
                    formatDate={formatDate}
                  />
                ))}
                {items.length === 0 && (
                  <div style={styles.emptyStage}>No patients</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Manual Lab Modal */}
      {showAddModal && (
        <AddLabModal
          patientSearch={patientSearch}
          onPatientSearch={handlePatientSearch}
          patientResults={patientResults}
          onAdd={async (formData) => {
            try {
              const res = await fetch('/api/admin/labs-pipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
              });
              if (res.ok) {
                await fetchData();
                setShowAddModal(false);
                setPatientSearch('');
                setPatientResults([]);
              }
            } catch (err) {
              console.error('Error adding lab:', err);
            }
          }}
          onClose={() => {
            setShowAddModal(false);
            setPatientSearch('');
            setPatientResults([]);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          name={showDeleteConfirm.name}
          onConfirm={() => handleDelete(showDeleteConfirm.id)}
          onCancel={() => setShowDeleteConfirm(null)}
          updating={updating}
        />
      )}
    </div>
  );
}

// Lab Card Component
function LabCard({ protocol, currentStage, stageColor, onMoveStage, onDelete, formatDate }) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const patient = protocol.patients;
  const patientName = patient?.name || (patient?.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : 'Unknown');
  const panelType = protocol.medication || 'Essential';
  const labType = protocol.delivery_method === 'follow_up' ? 'Follow-up' : 'New Patient';
  const isElite = panelType === 'Elite';

  const fetchSummary = async () => {
    if (!patient?.id) return;
    setSummaryLoading(true);
    try {
      const res = await fetch(`/api/admin/labs-pipeline?action=summary&patientId=${patient.id}`);
      const json = await res.json();
      if (json.success) {
        setSummaryData(json.noIntake ? { noIntake: true } : json.summary);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handlePrep = () => {
    if (showSummary) {
      setShowSummary(false);
      return;
    }
    if (!summaryData) {
      fetchSummary();
    }
    setShowSummary(true);
  };

  const formatDOB = (dob) => {
    if (!dob) return '-';
    const [y, m, d] = dob.split('-');
    return `${m}/${d}/${y}`;
  };

  const formatVisitDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const buildCopyText = (s) => {
    let text = 'PRE-CONSULT SUMMARY\n';
    text += `Name: ${s.name}\n`;
    text += `DOB: ${formatDOB(s.dob)}\n`;
    if (s.lastVisitDate) text += `Last Visit: ${formatVisitDate(s.lastVisitDate)}\n`;
    if (s.reasonForVisit) text += `Reason: ${s.reasonForVisit}\n`;
    text += '\n';
    text += `Diagnoses: ${s.diagnoses.length > 0 ? s.diagnoses.join(', ') : 'None reported'}\n`;
    text += `Medications: ${s.medications || 'None reported'}\n`;
    text += `Allergies: ${s.allergies || 'None reported'}\n`;
    if (s.onHRT && s.hrtDetails) text += `HRT: ${s.hrtDetails}\n`;
    else if (s.onHRT) text += `HRT: Yes\n`;
    text += '\n*Reminder: Use Insight Health to scribe the conversation';
    return text;
  };

  const handleCopy = async () => {
    if (!summaryData || summaryData.noIntake) return;
    try {
      await navigator.clipboard.writeText(buildCopyText(summaryData));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div style={styles.card}>
      {/* Patient Name Row */}
      <div style={styles.cardTop}>
        {patient?.id ? (
          <Link href={`/admin/patient/${patient.id}`} style={styles.cardName}>
            {patientName}
          </Link>
        ) : (
          <span style={styles.cardName}>{patientName}</span>
        )}
        {patient?.phone && (
          <a href={`tel:${patient.phone}`} style={styles.cardPhone} title="Call">
            📞
          </a>
        )}
      </div>

      {/* Badges */}
      <div style={styles.badgeRow}>
        <span style={{
          ...styles.panelBadge,
          background: isElite ? '#fdf2f8' : '#f0f9ff',
          color: isElite ? '#9d174d' : '#0369a1',
          borderColor: isElite ? '#fce7f3' : '#e0f2fe'
        }}>
          {panelType}
        </span>
        <span style={styles.typeBadge}>{labType}</span>
      </div>

      {/* Prep Button */}
      {patient?.id && (
        <button
          style={{
            ...styles.prepBtn,
            ...(showSummary ? { background: '#000', color: '#fff', borderColor: '#000' } : {})
          }}
          onClick={handlePrep}
          disabled={summaryLoading}
        >
          {summaryLoading ? '...' : showSummary ? '▾ Prep' : '▸ Prep'}
        </button>
      )}

      {/* Expandable Summary */}
      {showSummary && summaryData && (
        <div style={styles.summaryBlock}>
          {summaryData.noIntake ? (
            <div style={styles.summaryEmpty}>No intake form found</div>
          ) : (
            <>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>DOB</span>
                <span>{formatDOB(summaryData.dob)}</span>
              </div>
              {summaryData.lastVisitDate && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Last Visit</span>
                  <span>{formatVisitDate(summaryData.lastVisitDate)}</span>
                </div>
              )}
              {summaryData.reasonForVisit && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Reason</span>
                  <span>{summaryData.reasonForVisit}</span>
                </div>
              )}
              <div style={styles.summarySection}>
                <span style={styles.summaryLabel}>Diagnoses</span>
                {summaryData.diagnoses.length > 0 ? (
                  <ul style={styles.summaryList}>
                    {summaryData.diagnoses.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                ) : (
                  <span style={styles.summaryNone}>None reported</span>
                )}
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Meds</span>
                <span>{summaryData.medications || <span style={styles.summaryNone}>None reported</span>}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Allergies</span>
                <span>{summaryData.allergies || <span style={styles.summaryNone}>None reported</span>}</span>
              </div>
              {summaryData.onHRT && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>HRT</span>
                  <span>{summaryData.hrtDetails || 'Yes'}</span>
                </div>
              )}
              <div style={styles.summaryReminder}>
                *Use Insight Health to scribe the conversation
              </div>
              <div style={styles.summaryActions}>
                <button style={styles.summaryBtnPrimary} onClick={handleCopy}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
                <button style={styles.summaryBtnSecondary} onClick={() => setShowSummary(false)}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Date & Notes */}
      <div style={styles.cardMeta}>
        <span style={styles.cardDate}>Draw: {formatDate(protocol.start_date)}</span>
        {protocol.notes && (
          <div style={styles.cardNotes}>{protocol.notes}</div>
        )}
      </div>

      {/* Actions */}
      <div style={styles.cardActions}>
        {currentStage !== 'treatment_started' && (
          <button
            style={{
              ...styles.advanceBtn,
              background: stageColor,
              boxShadow: `0 1px 3px ${stageColor}40`
            }}
            onClick={() => {
              const stageIds = LAB_STAGES.map(s => s.id);
              const currentIndex = stageIds.indexOf(currentStage);
              if (currentIndex < stageIds.length - 1) {
                onMoveStage(stageIds[currentIndex + 1]);
              }
            }}
          >
            → {LAB_STAGES[LAB_STAGES.findIndex(s => s.id === currentStage) + 1]?.label || 'Next'}
          </button>
        )}
        <div style={styles.cardControls}>
          <div style={styles.moveWrapper}>
            <button
              style={styles.moveBtn}
              onClick={() => setShowMoveMenu(!showMoveMenu)}
            >
              Move ▾
            </button>
            {showMoveMenu && (
              <div style={styles.moveMenu}>
                {LAB_STAGES.filter(s => s.id !== currentStage).map(s => (
                  <button
                    key={s.id}
                    style={styles.moveOption}
                    onClick={() => {
                      onMoveStage(s.id);
                      setShowMoveMenu(false);
                    }}
                  >
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: s.color, display: 'inline-block', flexShrink: 0
                    }} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button style={styles.deleteBtn} onClick={onDelete} title="Remove">×</button>
        </div>
      </div>
    </div>
  );
}

// Add Lab Modal
function AddLabModal({ patientSearch, onPatientSearch, patientResults, onAdd, onClose }) {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [manualName, setManualName] = useState('');
  const [panelType, setPanelType] = useState('essential');
  const [labType, setLabType] = useState('new_patient');
  const [bloodDrawDate, setBloodDrawDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const patientId = selectedPatient?.id || null;
    const patientName = selectedPatient?.name || manualName;
    if (!patientName) {
      alert('Please select or enter a patient name');
      return;
    }
    onAdd({ patientId, patientName, panelType, labType, bloodDrawDate, notes: notes || null });
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Add Lab</h3>
          <button style={styles.modalClose} onClick={onClose}>×</button>
        </div>

        {/* Patient Search */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Patient</label>
          {selectedPatient ? (
            <div style={styles.selectedPatient}>
              <span style={{ fontWeight: 500 }}>{selectedPatient.name}</span>
              <button
                style={styles.clearBtn}
                onClick={() => { setSelectedPatient(null); onPatientSearch(''); }}
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                style={styles.input}
                value={patientSearch}
                onChange={(e) => onPatientSearch(e.target.value)}
                placeholder="Search patient name..."
              />
              {patientResults.length > 0 && (
                <div style={styles.searchDropdown}>
                  {patientResults.map(p => (
                    <button
                      key={p.id}
                      style={styles.searchItem}
                      onClick={() => {
                        setSelectedPatient(p);
                        onPatientSearch('');
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      {p.email && <span style={{ fontSize: '12px', color: '#9ca3af' }}>{p.email}</span>}
                    </button>
                  ))}
                </div>
              )}
              {patientSearch.length >= 2 && patientResults.length === 0 && (
                <input
                  type="text"
                  style={{ ...styles.input, marginTop: '8px' }}
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Or enter name manually..."
                />
              )}
            </>
          )}
        </div>

        {/* Panel Type */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Panel Type</label>
          <div style={styles.segmentedControl}>
            {[{ v: 'essential', l: 'Essential' }, { v: 'elite', l: 'Elite' }].map(o => (
              <button
                key={o.v}
                style={{
                  ...styles.segmentBtn,
                  ...(panelType === o.v ? styles.segmentBtnActive : {})
                }}
                onClick={() => setPanelType(o.v)}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {/* Lab Type */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Lab Type</label>
          <div style={styles.segmentedControl}>
            {[{ v: 'new_patient', l: 'New Patient' }, { v: 'follow_up', l: 'Follow-up' }].map(o => (
              <button
                key={o.v}
                style={{
                  ...styles.segmentBtn,
                  ...(labType === o.v ? styles.segmentBtnActive : {})
                }}
                onClick={() => setLabType(o.v)}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {/* Blood Draw Date */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Blood Draw Date</label>
          <input
            type="date"
            style={styles.input}
            value={bloodDrawDate}
            onChange={(e) => setBloodDrawDate(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Notes</label>
          <textarea
            style={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
          />
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.cancelBtn2} onClick={onClose}>Cancel</button>
          <button
            style={styles.submitBtn}
            onClick={handleSubmit}
            disabled={!selectedPatient && !manualName}
          >
            Add to Pipeline
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ name, onConfirm, onCancel, updating }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modal, maxWidth: '400px' }}>
        <h3 style={styles.modalTitle}>Remove from Pipeline?</h3>
        <p style={{ margin: '8px 0 0', color: '#374151', fontSize: '14px', lineHeight: 1.5 }}>
          Remove <strong>{name}</strong> from the labs pipeline? This cancels the lab protocol.
        </p>
        <div style={{ ...styles.modalFooter, marginTop: '20px' }}>
          <button style={styles.cancelBtn2} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...styles.submitBtn, background: '#dc2626' }}
            onClick={onConfirm}
            disabled={updating}
          >
            {updating ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = {
  container: {
    padding: 0
  },
  loading: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px'
  },
  error: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#ef4444',
    fontSize: '14px'
  },

  // ─── Header ─────────────────────────────────────────────────
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  totalBadge: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500'
  },
  headerActions: {
    display: 'flex',
    gap: '8px'
  },
  primaryBtn: {
    padding: '8px 16px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  secondaryBtn: {
    padding: '8px 16px',
    background: '#fff',
    color: '#374151',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },

  // ─── Due for Labs ─────────────────────────────────────────
  dueSection: {
    marginBottom: '20px',
    background: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: '12px',
    padding: '16px'
  },
  dueSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  dueSectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#92400e',
    letterSpacing: '0.2px'
  },
  dueSectionCount: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#92400e',
    background: '#fef3c7',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  dueCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  dueCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#fff',
    border: '1px solid #fef3c7',
    borderRadius: '8px',
    padding: '10px 14px'
  },
  dueCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  dueCardName: {
    fontWeight: '600',
    fontSize: '13px',
    color: '#000',
    textDecoration: 'none'
  },
  dueCardLabel: {
    fontSize: '11px',
    color: '#92400e',
    fontWeight: '500'
  },
  dueCardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  dueCardDate: {
    fontSize: '12px',
    fontWeight: '600'
  },
  dueCardPhone: {
    fontSize: '13px',
    textDecoration: 'none',
    opacity: 0.6,
    flexShrink: 0
  },

  // ─── Kanban Grid ────────────────────────────────────────────
  stagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
    minHeight: '500px'
  },
  stageColumn: {
    background: '#fafafa',
    borderRadius: '12px',
    border: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  stageHeader: {
    padding: '14px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #f0f0f0',
    background: '#fff'
  },
  stageHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  stageDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0
  },
  stageLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111'
  },
  stageCount: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#9ca3af',
    background: '#f5f5f5',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  stageBody: {
    padding: '8px',
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  emptyStage: {
    textAlign: 'center',
    color: '#d1d5db',
    padding: '32px 12px',
    fontSize: '13px'
  },

  // ─── Card ───────────────────────────────────────────────────
  card: {
    background: '#fff',
    borderRadius: '10px',
    padding: '14px',
    border: '1px solid #e5e5e5',
    transition: 'box-shadow 0.15s ease'
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '8px'
  },
  cardName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#000',
    textDecoration: 'none',
    lineHeight: 1.3
  },
  cardPhone: {
    fontSize: '13px',
    textDecoration: 'none',
    opacity: 0.6,
    flexShrink: 0
  },

  // Badges
  badgeRow: {
    display: 'flex',
    gap: '5px',
    marginBottom: '10px',
    flexWrap: 'wrap'
  },
  panelBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid transparent',
    letterSpacing: '0.2px'
  },
  typeBadge: {
    fontSize: '11px',
    fontWeight: '500',
    padding: '2px 8px',
    borderRadius: '6px',
    background: '#f5f5f5',
    color: '#666',
    border: '1px solid #ebebeb'
  },

  // Prep
  prepBtn: {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    background: '#fafafa',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '12px',
    marginBottom: '10px',
    textAlign: 'left',
    transition: 'all 0.12s ease'
  },

  // Summary (Prep expanded)
  summaryBlock: {
    background: '#fafafa',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '10px',
    fontSize: '12px',
    lineHeight: 1.6
  },
  summaryEmpty: {
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '8px 0'
  },
  summaryRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '2px'
  },
  summarySection: {
    marginBottom: '4px'
  },
  summaryLabel: {
    fontWeight: '600',
    color: '#6b7280',
    minWidth: '60px',
    flexShrink: 0
  },
  summaryList: {
    margin: '2px 0 2px 16px',
    padding: 0,
    listStyle: 'disc'
  },
  summaryNone: {
    color: '#d1d5db',
    fontStyle: 'italic'
  },
  summaryReminder: {
    marginTop: '8px',
    padding: '6px 8px',
    background: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#92400e',
    fontStyle: 'italic'
  },
  summaryActions: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px'
  },
  summaryBtnPrimary: {
    flex: 1,
    padding: '6px',
    border: 'none',
    borderRadius: '6px',
    background: '#000',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '11px'
  },
  summaryBtnSecondary: {
    flex: 1,
    padding: '6px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    background: '#fff',
    color: '#666',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '11px'
  },

  // Meta (date, notes)
  cardMeta: {
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '10px'
  },
  cardDate: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  cardNotes: {
    marginTop: '4px',
    padding: '5px 8px',
    background: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#92400e',
    fontStyle: 'italic',
    lineHeight: 1.4
  },

  // Actions
  cardActions: {
    paddingTop: '10px',
    borderTop: '1px solid #f5f5f5'
  },
  advanceBtn: {
    width: '100%',
    padding: '7px 10px',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px',
    marginBottom: '8px',
    letterSpacing: '0.2px'
  },
  cardControls: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  },
  moveWrapper: {
    position: 'relative',
    flex: 1
  },
  moveBtn: {
    width: '100%',
    padding: '5px 10px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '500',
    color: '#9ca3af'
  },
  moveMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 100,
    marginTop: '4px',
    overflow: 'hidden',
    padding: '4px'
  },
  moveOption: {
    width: '100%',
    padding: '8px 10px',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    textAlign: 'left',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    color: '#374151'
  },
  deleteBtn: {
    padding: '5px 10px',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#ef4444',
    fontWeight: '600',
    lineHeight: 1
  },

  // ─── Modal ──────────────────────────────────────────────────
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    padding: '28px',
    width: '90%',
    maxWidth: '440px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 24px 48px rgba(0,0,0,0.16)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#000'
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1
  },
  modalFooter: {
    display: 'flex',
    gap: '10px',
    marginTop: '24px'
  },

  // ─── Form Elements ──────────────────────────────────────────
  formGroup: {
    marginBottom: '18px'
  },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s ease'
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    minHeight: '60px',
    resize: 'vertical',
    fontFamily: 'inherit',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
  },

  // Segmented control (replaces toggle buttons)
  segmentedControl: {
    display: 'flex',
    background: '#f5f5f5',
    borderRadius: '8px',
    padding: '3px',
    gap: '3px'
  },
  segmentBtn: {
    flex: 1,
    padding: '8px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.12s ease'
  },
  segmentBtnActive: {
    background: '#000',
    color: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },

  // Selected patient
  selectedPatient: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px'
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#9ca3af',
    padding: '0 4px',
    lineHeight: 1
  },

  // Search dropdown
  searchDropdown: {
    marginTop: '4px',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  },
  searchItem: {
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    borderBottom: '1px solid #f5f5f5',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '14px'
  },

  // Modal buttons
  cancelBtn2: {
    flex: 1,
    padding: '10px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    color: '#374151'
  },
  submitBtn: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    background: '#000',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  }
};
