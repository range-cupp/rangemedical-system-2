// /components/LabsPipelineTab.js
// Labs Pipeline Tab - Protocol-based lab tracking with 5 stages
// Range Medical
// CREATED: 2026-01-26
// UPDATED: 2026-02-17 - Added pre-consult summary (Prep button)

import { useState, useEffect } from 'react';
import Link from 'next/link';

const LAB_STAGES = [
  { id: 'blood_draw_complete', label: 'Blood Draw Complete', color: '#f59e0b', icon: '🩸' },
  { id: 'results_received', label: 'Results Received', color: '#8b5cf6', icon: '📋' },
  { id: 'provider_reviewed', label: 'Provider Reviewed', color: '#10b981', icon: '👨‍⚕️' },
  { id: 'consult_scheduled', label: 'Consult Scheduled', color: '#6366f1', icon: '🗓️' },
  { id: 'consult_complete', label: 'Consult Complete', color: '#3b82f6', icon: '✅' }
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
      {/* Header */}
      <div style={styles.headerRow}>
        <div style={styles.headerInfo}>
          <span style={styles.totalBadge}>{data.total} active</span>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.refreshButton} onClick={fetchData} disabled={loading}>
            ↻ Refresh
          </button>
          <button style={styles.addButton} onClick={() => setShowAddModal(true)}>
            + Add Lab Manually
          </button>
        </div>
      </div>

      {/* 5-Column Stage View */}
      <div style={styles.stagesContainer}>
        {LAB_STAGES.map(stage => {
          const items = data.stages[stage.id] || [];
          return (
            <div key={stage.id} style={styles.stageColumn}>
              <div style={styles.stageHeader(stage.color)}>
                <span>{stage.icon}</span>
                <span>{stage.label}</span>
                <span style={styles.stageCount}>{items.length}</span>
              </div>
              <div style={styles.stageContent}>
                {items.map(protocol => (
                  <LabCard
                    key={protocol.id}
                    protocol={protocol}
                    currentStage={stage.id}
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
function LabCard({ protocol, currentStage, onMoveStage, onDelete, formatDate }) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const patient = protocol.patients;
  const patientName = patient?.name || (patient?.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : 'Unknown');
  const panelType = protocol.medication || 'Essential';
  const labType = protocol.delivery_method === 'follow_up' ? 'Follow-up' : 'New Patient';
  const panelColor = panelType === 'Elite' ? { bg: '#fdf2f8', text: '#9d174d' } : { bg: '#f0f9ff', text: '#0369a1' };

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
      <div style={styles.cardHeader}>
        {patient?.id ? (
          <Link href={`/admin/patient/${patient.id}`} style={styles.patientName}>
            {patientName}
          </Link>
        ) : (
          <span style={styles.patientName}>{patientName}</span>
        )}
        {patient?.phone && (
          <a href={`tel:${patient.phone}`} style={styles.phone}>
            📞
          </a>
        )}
      </div>

      <div style={styles.cardBadges}>
        <span style={{ ...styles.panelBadge, backgroundColor: panelColor.bg, color: panelColor.text }}>
          {panelType}
        </span>
        <span style={styles.labTypeBadge}>
          {labType}
        </span>
      </div>

      {/* Prep Button */}
      {patient?.id && (
        <button
          style={{
            ...styles.prepButton,
            ...(showSummary ? styles.prepButtonActive : {})
          }}
          onClick={handlePrep}
          disabled={summaryLoading}
        >
          {summaryLoading ? 'Loading...' : showSummary ? '▾ Prep' : '▸ Prep'}
        </button>
      )}

      {/* Expandable Summary */}
      {showSummary && summaryData && (
        <div style={styles.summaryBlock}>
          {summaryData.noIntake ? (
            <div style={styles.summaryNoIntake}>No intake form found</div>
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
                *Reminder: Use Insight Health to scribe the conversation
              </div>
              <div style={styles.summaryActions}>
                <button style={styles.copyButton} onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button style={styles.closeButton} onClick={() => setShowSummary(false)}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div style={styles.cardDetails}>
        <div>Draw: {formatDate(protocol.start_date)}</div>
        {protocol.notes && (
          <div style={styles.notesText}>{protocol.notes}</div>
        )}
      </div>

      <div style={styles.cardActions}>
        {/* Quick advance button */}
        {currentStage !== 'consult_complete' && (
          <button
            style={styles.advanceButton}
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
          <div style={styles.moveStageWrapper}>
            <button
              style={styles.moveStageButton}
              onClick={() => setShowMoveMenu(!showMoveMenu)}
            >
              Move ▾
            </button>
            {showMoveMenu && (
              <div style={styles.moveStageMenu}>
                {LAB_STAGES.filter(s => s.id !== currentStage).map(s => (
                  <button
                    key={s.id}
                    style={styles.moveStageOption}
                    onClick={() => {
                      onMoveStage(s.id);
                      setShowMoveMenu(false);
                    }}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button style={styles.deleteButton} onClick={onDelete} title="Remove from pipeline">
            🗑️
          </button>
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
        <h3 style={styles.modalTitle}>Add Lab Manually</h3>

        {/* Patient Search */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Patient *</label>
          {selectedPatient ? (
            <div style={styles.selectedPatient}>
              <span>{selectedPatient.name}</span>
              <button
                style={styles.clearPatientBtn}
                onClick={() => { setSelectedPatient(null); onPatientSearch(''); }}
              >
                ✕
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
                <div style={styles.searchResults}>
                  {patientResults.map(p => (
                    <button
                      key={p.id}
                      style={styles.searchResultItem}
                      onClick={() => {
                        setSelectedPatient(p);
                        onPatientSearch('');
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>{p.name}</span>
                      {p.email && <span style={{ fontSize: '11px', color: '#6b7280' }}>{p.email}</span>}
                    </button>
                  ))}
                </div>
              )}
              {patientSearch.length >= 2 && patientResults.length === 0 && (
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    style={styles.input}
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Or enter name manually..."
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Panel Type */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Panel Type</label>
          <div style={styles.toggleGroup}>
            <button
              style={{ ...styles.toggleBtn, ...(panelType === 'essential' ? styles.toggleBtnActive : {}) }}
              onClick={() => setPanelType('essential')}
            >
              Essential
            </button>
            <button
              style={{ ...styles.toggleBtn, ...(panelType === 'elite' ? styles.toggleBtnActive : {}) }}
              onClick={() => setPanelType('elite')}
            >
              Elite
            </button>
          </div>
        </div>

        {/* Lab Type */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Lab Type</label>
          <div style={styles.toggleGroup}>
            <button
              style={{ ...styles.toggleBtn, ...(labType === 'new_patient' ? styles.toggleBtnActive : {}) }}
              onClick={() => setLabType('new_patient')}
            >
              New Patient
            </button>
            <button
              style={{ ...styles.toggleBtn, ...(labType === 'follow_up' ? styles.toggleBtnActive : {}) }}
              onClick={() => setLabType('follow_up')}
            >
              Follow-up
            </button>
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
          <label style={styles.formLabel}>Notes (optional)</label>
          <textarea
            style={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this lab..."
          />
        </div>

        <div style={styles.modalActions}>
          <button style={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button
            style={styles.submitButton}
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
      <div style={styles.modal}>
        <h3 style={styles.modalTitle}>Remove from Pipeline?</h3>
        <p style={styles.modalSubtitle}>
          Are you sure you want to remove <strong>{name}</strong> from the labs pipeline?
        </p>
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '8px' }}>
          This will cancel the lab protocol. Patient records will not be affected.
        </p>

        <div style={styles.modalActions}>
          <button style={styles.cancelButton} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...styles.submitButton, backgroundColor: '#dc2626' }}
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

// Styles
const styles = {
  container: {
    padding: '0'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280'
  },
  error: {
    padding: '40px',
    textAlign: 'center',
    color: '#ef4444'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  headerInfo: {
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
    gap: '8px',
    alignItems: 'center'
  },
  refreshButton: {
    padding: '10px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '500'
  },
  addButton: {
    padding: '10px 16px',
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: '#6b7280',
    cursor: 'pointer',
    fontWeight: '500'
  },
  stagesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
    minHeight: '500px'
  },
  stageColumn: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  stageHeader: (color) => ({
    backgroundColor: color,
    color: 'white',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    fontSize: '13px'
  }),
  stageCount: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px'
  },
  stageContent: {
    padding: '8px',
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  emptyStage: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '20px',
    fontSize: '14px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
    gap: '8px'
  },
  patientName: {
    fontWeight: '600',
    color: '#111827',
    textDecoration: 'none',
    fontSize: '14px'
  },
  phone: {
    fontSize: '14px',
    textDecoration: 'none'
  },
  cardBadges: {
    display: 'flex',
    gap: '4px',
    marginBottom: '8px',
    flexWrap: 'wrap'
  },
  panelBadge: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600'
  },
  labTypeBadge: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    fontWeight: '500'
  },
  cardDetails: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.5'
  },
  notesText: {
    marginTop: '4px',
    padding: '4px 6px',
    backgroundColor: '#fef3c7',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#92400e',
    fontStyle: 'italic'
  },
  cardActions: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #f3f4f6'
  },
  advanceButton: {
    width: '100%',
    padding: '8px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '12px',
    marginBottom: '8px'
  },
  cardControls: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  moveStageWrapper: {
    position: 'relative',
    flex: 1
  },
  moveStageButton: {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '11px',
    color: '#6b7280'
  },
  moveStageMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 100,
    marginTop: '4px',
    overflow: 'hidden'
  },
  moveStageOption: {
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    textAlign: 'left',
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  },
  deleteButton: {
    padding: '6px 10px',
    border: '1px solid #fecaca',
    borderRadius: '4px',
    backgroundColor: '#fef2f2',
    cursor: 'pointer',
    fontSize: '12px'
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '440px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  },
  modalTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '600'
  },
  modalSubtitle: {
    margin: '0 0 8px 0',
    color: '#374151',
    fontSize: '14px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    minHeight: '60px',
    resize: 'vertical',
    fontFamily: 'inherit',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  toggleGroup: {
    display: 'flex',
    gap: '8px'
  },
  toggleBtn: {
    flex: 1,
    padding: '10px',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  toggleBtnActive: {
    background: '#111',
    color: '#fff',
    borderColor: '#111'
  },
  selectedPatient: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    fontWeight: '500'
  },
  clearPatientBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#6b7280',
    padding: '0 4px'
  },
  searchResults: {
    marginTop: '4px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  searchResultItem: {
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    borderBottom: '1px solid #f3f4f6',
    backgroundColor: 'white',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px'
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontWeight: '500'
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '500'
  },
  // Prep / Summary styles
  prepButton: {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #e0e7ff',
    borderRadius: '6px',
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px',
    marginBottom: '8px',
    textAlign: 'left'
  },
  prepButtonActive: {
    backgroundColor: '#4338ca',
    color: 'white',
    borderColor: '#4338ca'
  },
  summaryBlock: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '8px',
    fontSize: '12px',
    lineHeight: '1.6'
  },
  summaryNoIntake: {
    color: '#94a3b8',
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
    color: '#475569',
    minWidth: '60px',
    flexShrink: 0
  },
  summaryList: {
    margin: '2px 0 2px 16px',
    padding: 0,
    listStyle: 'disc'
  },
  summaryNone: {
    color: '#94a3b8',
    fontStyle: 'italic'
  },
  summaryReminder: {
    marginTop: '8px',
    padding: '6px 8px',
    backgroundColor: '#fefce8',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#854d0e',
    fontStyle: 'italic'
  },
  summaryActions: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px'
  },
  copyButton: {
    flex: 1,
    padding: '6px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '11px'
  },
  closeButton: {
    flex: 1,
    padding: '6px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#6b7280',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '11px'
  }
};
