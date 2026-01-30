// /components/LabsPipelineTab.js
// Labs Pipeline Tab - New Patient Journeys & Follow-up Labs
// Range Medical
// CREATED: 2026-01-26
// UPDATED: 2026-01-27 - Added protocol linkage, move stage, delete functionality

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Stage configurations
const NEW_PATIENT_STAGES = [
  { id: 'scheduled', label: 'Blood Draw Scheduled', color: '#6366f1', icon: '📅' },
  { id: 'outreach_due', label: 'Outreach Due', color: '#f59e0b', icon: '📞' },
  { id: 'outreach_complete', label: 'Outreach Complete', color: '#10b981', icon: '✓' },
  { id: 'review_scheduled', label: 'Lab Review Scheduled', color: '#8b5cf6', icon: '🗓️' },
  { id: 'review_complete', label: 'Needs Outcome', color: '#ef4444', icon: '📋' }
];

const FOLLOW_UP_STAGES = [
  { id: 'due', label: 'Follow-up Due', color: '#f59e0b', icon: '⏰' },
  { id: 'scheduled', label: 'Scheduled', color: '#6366f1', icon: '📅' },
  { id: 'results_pending', label: 'Results Pending', color: '#8b5cf6', icon: '🔬' }
];

const OUTCOMES = [
  { value: 'hrt', label: 'HRT', color: '#3b82f6' },
  { value: 'weight_loss', label: 'Weight Loss', color: '#10b981' },
  { value: 'peptide', label: 'Peptides', color: '#8b5cf6' },
  { value: 'thinking', label: 'Thinking About It', color: '#f59e0b' },
  { value: 'declined', label: 'Declined', color: '#6b7280' }
];

// Protocol type colors
const PROTOCOL_COLORS = {
  hrt: { bg: '#dbeafe', text: '#1e40af' },
  weight_loss: { bg: '#dcfce7', text: '#166534' },
  peptide: { bg: '#f3e8ff', text: '#7c3aed' },
  iv: { bg: '#fef3c7', text: '#92400e' },
  hbot: { bg: '#e0e7ff', text: '#3730a3' },
  rlt: { bg: '#ffe4e6', text: '#be123c' },
  default: { bg: '#f3f4f6', text: '#374151' }
};

export default function LabsPipelineTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('new_patient'); // 'new_patient' or 'follow_up'
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [addForm, setAddForm] = useState({ patientName: '', bloodDrawDate: '' });
  const [updating, setUpdating] = useState(false);

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

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  // Format datetime for display
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    });
  };

  // Check if date is overdue
  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr <= today;
  };

  // Update journey stage
  const updateJourney = async (id, updates, type = 'journey') => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/labs-pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, updates })
      });
      if (res.ok) {
        await fetchData();
        setSelectedJourney(null);
        setShowOutcomeModal(false);
        setShowOutreachModal(false);
      }
    } catch (err) {
      console.error('Error updating:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Delete journey
  const handleDelete = async (id, type = 'journey') => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/labs-pipeline', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type })
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

  // Move to different stage
  const handleMoveStage = async (journey, newStage) => {
    const updates = { stage: newStage };
    
    // Set appropriate dates based on new stage
    const now = new Date().toISOString().split('T')[0];
    if (newStage === 'outreach_due') {
      updates.blood_draw_completed_date = now;
      updates.outreach_due_date = addBusinessDaysStr(now, 2);
    } else if (newStage === 'outreach_complete') {
      updates.outreach_completed_date = now;
    } else if (newStage === 'review_scheduled') {
      // Keep existing review date or set to null
    } else if (newStage === 'review_complete') {
      updates.lab_review_completed_date = now;
    }
    
    await updateJourney(journey.id, updates);
  };

  // Mark outreach complete
  const handleOutreachComplete = async (method, notes) => {
    if (!selectedJourney) return;
    await updateJourney(selectedJourney.id, {
      stage: 'outreach_complete',
      outreach_completed_date: new Date().toISOString().split('T')[0],
      outreach_method: method,
      outreach_notes: notes
    });
  };

  // Record outcome
  const handleRecordOutcome = async (outcome, notes) => {
    if (!selectedJourney) return;
    await updateJourney(selectedJourney.id, {
      outcome,
      outcome_notes: notes
    });
  };

  // Add manual journey
  const handleAddJourney = async () => {
    if (!addForm.patientName) return;
    try {
      const res = await fetch('/api/admin/labs-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: addForm.patientName,
          bloodDrawDate: addForm.bloodDrawDate || null
        })
      });
      if (res.ok) {
        await fetchData();
        setShowAddModal(false);
        setAddForm({ patientName: '', bloodDrawDate: '' });
      }
    } catch (err) {
      console.error('Error adding journey:', err);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading labs pipeline...</div>;
  }

  if (!data) {
    return <div style={styles.error}>Error loading labs pipeline</div>;
  }

  const totalNewPatient = Object.values(data.newPatient.counts).reduce((a, b) => a + b, 0);
  const totalFollowUp = Object.values(data.followUp.counts).reduce((a, b) => a + b, 0);

  return (
    <div style={styles.container}>
      {/* Sub-tabs */}
      <div style={styles.subTabs}>
        <button
          style={styles.subTab(subTab === 'new_patient')}
          onClick={() => setSubTab('new_patient')}
        >
          New Patient Journey
          <span style={styles.badge(data.alerts.overdueOutreach > 0)}>
            {totalNewPatient}
          </span>
          {data.alerts.overdueOutreach > 0 && (
            <span style={styles.alertBadge}>{data.alerts.overdueOutreach} overdue</span>
          )}
        </button>
        <button
          style={styles.subTab(subTab === 'follow_up')}
          onClick={() => setSubTab('follow_up')}
        >
          Protocol Follow-ups
          <span style={styles.badge(data.alerts.overdueFollowUps > 0)}>
            {totalFollowUp}
          </span>
          {data.alerts.overdueFollowUps > 0 && (
            <span style={styles.alertBadge}>{data.alerts.overdueFollowUps} overdue</span>
          )}
        </button>
        <div style={styles.headerActions}>
          <button
            style={styles.refreshButton}
            onClick={fetchData}
            disabled={loading}
          >
            ↻ Refresh
          </button>
          <button
            style={styles.addButton}
            onClick={() => setShowAddModal(true)}
          >
            + Add Manually
          </button>
        </div>
      </div>

      {/* New Patient Journey View */}
      {subTab === 'new_patient' && (
        <div style={styles.stagesContainer}>
          {NEW_PATIENT_STAGES.map(stage => {
            const items = getNewPatientItems(data.newPatient, stage.id);
            return (
              <div key={stage.id} style={styles.stageColumn}>
                <div style={styles.stageHeader(stage.color)}>
                  <span>{stage.icon}</span>
                  <span>{stage.label}</span>
                  <span style={styles.stageCount}>{items.length}</span>
                </div>
                <div style={styles.stageContent}>
                  {items.map(item => (
                    <JourneyCard
                      key={item.id}
                      journey={item}
                      stage={stage.id}
                      allStages={NEW_PATIENT_STAGES}
                      onAction={(action) => {
                        setSelectedJourney(item);
                        if (action === 'outreach') setShowOutreachModal(true);
                        if (action === 'outcome') setShowOutcomeModal(true);
                      }}
                      onMoveStage={(newStage) => handleMoveStage(item, newStage)}
                      onDelete={() => setShowDeleteConfirm({ id: item.id, name: item.patient_name, type: 'journey' })}
                      isOverdue={stage.id === 'outreach_due' && isOverdue(item.outreach_due_date)}
                      formatDate={formatDate}
                      formatDateTime={formatDateTime}
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
      )}

      {/* Follow-up Labs View */}
      {subTab === 'follow_up' && (
        <div style={styles.stagesContainer}>
          {FOLLOW_UP_STAGES.map(stage => {
            const items = getFollowUpItems(data.followUp, stage.id);
            return (
              <div key={stage.id} style={styles.stageColumn}>
                <div style={styles.stageHeader(stage.color)}>
                  <span>{stage.icon}</span>
                  <span>{stage.label}</span>
                  <span style={styles.stageCount}>{items.length}</span>
                </div>
                <div style={styles.stageContent}>
                  {items.map(item => (
                    <FollowUpCard
                      key={item.id}
                      followUp={item}
                      stage={stage.id}
                      isOverdue={stage.id === 'due' && isOverdue(item.due_date)}
                      formatDate={formatDate}
                      onMarkReviewed={() => updateJourney(item.id, { status: 'reviewed' }, 'follow_up')}
                      onDelete={() => setShowDeleteConfirm({ id: item.id, name: item.patient_name, type: 'follow_up' })}
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
      )}

      {/* Outreach Modal */}
      {showOutreachModal && selectedJourney && (
        <OutreachModal
          journey={selectedJourney}
          onComplete={handleOutreachComplete}
          onClose={() => { setShowOutreachModal(false); setSelectedJourney(null); }}
          updating={updating}
        />
      )}

      {/* Outcome Modal */}
      {showOutcomeModal && selectedJourney && (
        <OutcomeModal
          journey={selectedJourney}
          onRecord={handleRecordOutcome}
          onClose={() => { setShowOutcomeModal(false); setSelectedJourney(null); }}
          updating={updating}
        />
      )}

      {/* Add Manual Journey Modal */}
      {showAddModal && (
        <AddJourneyModal
          form={addForm}
          setForm={setAddForm}
          onAdd={handleAddJourney}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          name={showDeleteConfirm.name}
          onConfirm={() => handleDelete(showDeleteConfirm.id, showDeleteConfirm.type)}
          onCancel={() => setShowDeleteConfirm(null)}
          updating={updating}
        />
      )}
    </div>
  );
}

// Helper: Add business days to date string
function addBusinessDaysStr(dateStr, days) {
  let result = new Date(dateStr);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result.toISOString().split('T')[0];
}

// Helper: Get items for new patient stage
function getNewPatientItems(data, stageId) {
  switch (stageId) {
    case 'scheduled': return data.scheduled || [];
    case 'outreach_due': return data.outreachDue || [];
    case 'outreach_complete': return data.outreachComplete || [];
    case 'review_scheduled': return data.reviewScheduled || [];
    case 'review_complete': return data.reviewComplete || [];
    default: return [];
  }
}

// Helper: Get items for follow-up stage
function getFollowUpItems(data, stageId) {
  switch (stageId) {
    case 'due': return data.due || [];
    case 'scheduled': return data.scheduled || [];
    case 'results_pending': return data.resultsPending || [];
    default: return [];
  }
}

// Helper: Get protocol type display
function getProtocolTypeDisplay(type) {
  if (!type) return 'Protocol';
  const typeMap = {
    hrt: 'HRT',
    weight_loss: 'Weight Loss',
    peptide: 'Peptides',
    iv: 'IV Therapy',
    hbot: 'HBOT',
    rlt: 'Red Light'
  };
  return typeMap[type.toLowerCase()] || type;
}

// Journey Card Component - Enhanced with protocol link, move stage, delete
function JourneyCard({ journey, stage, allStages, onAction, onMoveStage, onDelete, isOverdue, formatDate, formatDateTime }) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const linkedProtocol = journey.linked_protocol;
  const hasProtocol = !!linkedProtocol;
  const protocolColors = PROTOCOL_COLORS[linkedProtocol?.program_type?.toLowerCase()] || PROTOCOL_COLORS.default;
  
  return (
    <div style={styles.card(isOverdue)}>
      <div style={styles.cardHeader}>
        <Link href={`/patients/${journey.patient_id}`} style={styles.patientName}>
          {journey.patient_name || 'Unknown'}
        </Link>
        {journey.patient_phone && (
          <a href={`tel:${journey.patient_phone}`} style={styles.phone}>
            📞 {journey.patient_phone}
          </a>
        )}
      </div>
      
      <div style={styles.cardDetails}>
        {stage === 'scheduled' && (
          <div>Blood Draw: {formatDateTime(journey.blood_draw_scheduled_date)}</div>
        )}
        {stage === 'outreach_due' && (
          <>
            <div>Drawn: {formatDate(journey.blood_draw_completed_date)}</div>
            <div style={isOverdue ? styles.overdue : {}}>
              Outreach Due: {formatDate(journey.outreach_due_date)}
            </div>
          </>
        )}
        {stage === 'outreach_complete' && (
          <>
            <div>Contacted: {formatDate(journey.outreach_completed_date)}</div>
            <div>Method: {journey.outreach_method || '-'}</div>
          </>
        )}
        {stage === 'review_scheduled' && (
          <div>Review: {formatDateTime(journey.lab_review_scheduled_date)}</div>
        )}
        {stage === 'review_complete' && (
          <>
            <div>Completed: {formatDate(journey.lab_review_completed_date)}</div>
            
            {/* Show linked protocol if exists */}
            {hasProtocol && (
              <div style={styles.protocolLink}>
                <div style={styles.protocolLinkHeader}>
                  <span style={{
                    ...styles.protocolTypeBadge,
                    backgroundColor: protocolColors.bg,
                    color: protocolColors.text
                  }}>
                    ✓ {getProtocolTypeDisplay(linkedProtocol.program_type)}
                  </span>
                  <span style={styles.protocolStatus(linkedProtocol.status)}>
                    {linkedProtocol.status || 'Active'}
                  </span>
                </div>
                <div style={styles.protocolMeta}>
                  Started: {formatDate(linkedProtocol.start_date)}
                  {linkedProtocol.medication && ` • ${linkedProtocol.medication}`}
                </div>
                <Link href={`/patients/${journey.patient_id}`} style={styles.viewProtocolLink}>
                  View Protocol →
                </Link>
              </div>
            )}
            
            {/* Show outcome if recorded but no protocol */}
            {!hasProtocol && journey.outcome && (
              <div style={styles.outcomeRecorded}>
                <span style={styles.outcomeBadge(journey.outcome)}>
                  {OUTCOMES.find(o => o.value === journey.outcome)?.label || journey.outcome}
                </span>
                {journey.outcome_notes && (
                  <div style={styles.outcomeNotes}>{journey.outcome_notes}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div style={styles.cardActions}>
        {stage === 'outreach_due' && (
          <button style={styles.actionButton} onClick={() => onAction('outreach')}>
            ✓ Mark Contacted
          </button>
        )}
        {stage === 'review_complete' && !hasProtocol && !journey.outcome && (
          <button style={styles.actionButton} onClick={() => onAction('outcome')}>
            📋 Record Outcome
          </button>
        )}
        
        {/* Move Stage & Delete Controls */}
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
                {allStages.filter(s => s.id !== stage).map(s => (
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
          <button style={styles.deleteButton} onClick={onDelete} title="Delete from pipeline">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// Follow-up Card Component - Enhanced with delete
function FollowUpCard({ followUp, stage, isOverdue, formatDate, onMarkReviewed, onDelete }) {
  const protocolType = followUp.protocols?.program_type || followUp.protocol_type || 'Protocol';
  const protocolColors = PROTOCOL_COLORS[protocolType?.toLowerCase()] || PROTOCOL_COLORS.default;
  
  return (
    <div style={styles.card(isOverdue)}>
      <div style={styles.cardHeader}>
        <Link href={`/patients/${followUp.patient_id}`} style={styles.patientName}>
          {followUp.patient_name || 'Unknown'}
        </Link>
        <span style={{
          ...styles.protocolBadge,
          backgroundColor: protocolColors.bg,
          color: protocolColors.text
        }}>
          {getProtocolTypeDisplay(protocolType)}
        </span>
      </div>
      
      <div style={styles.cardDetails}>
        <div>{followUp.follow_up_type === 'first' ? '8-Week Follow-up' : `Quarterly #${followUp.follow_up_number || ''}`}</div>
        {stage === 'due' && (
          <div style={isOverdue ? styles.overdue : {}}>
            Due: {formatDate(followUp.due_date)}
          </div>
        )}
        {stage === 'scheduled' && (
          <div>Scheduled: {formatDate(followUp.scheduled_date)}</div>
        )}
        {stage === 'results_pending' && (
          <div>Drawn: {formatDate(followUp.drawn_date)}</div>
        )}
      </div>

      <div style={styles.cardActions}>
        {stage === 'results_pending' && (
          <button style={styles.actionButton} onClick={onMarkReviewed}>
            ✓ Results Reviewed
          </button>
        )}
        <div style={styles.cardControls}>
          <button style={styles.deleteButton} onClick={onDelete} title="Delete from pipeline">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// Outreach Modal
function OutreachModal({ journey, onComplete, onClose, updating }) {
  const [method, setMethod] = useState('call');
  const [notes, setNotes] = useState('');

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3 style={styles.modalTitle}>Mark Outreach Complete</h3>
        <p style={styles.modalSubtitle}>{journey.patient_name}</p>
        
        <div style={styles.formGroup}>
          <label>Contact Method</label>
          <div style={styles.methodButtons}>
            {['call', 'text', 'email'].map(m => (
              <button
                key={m}
                style={styles.methodButton(method === m)}
                onClick={() => setMethod(m)}
              >
                {m === 'call' ? '📞' : m === 'text' ? '💬' : '📧'} {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label>Notes (optional)</label>
          <textarea
            style={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Labs back? Scheduled review? Any concerns?"
          />
        </div>

        <div style={styles.modalActions}>
          <button style={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button 
            style={styles.submitButton} 
            onClick={() => onComplete(method, notes)}
            disabled={updating}
          >
            {updating ? 'Saving...' : 'Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Outcome Modal
function OutcomeModal({ journey, onRecord, onClose, updating }) {
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3 style={styles.modalTitle}>Record Outcome</h3>
        <p style={styles.modalSubtitle}>{journey.patient_name}</p>
        
        <div style={styles.formGroup}>
          <label>Patient Decision</label>
          <div style={styles.outcomeButtons}>
            {OUTCOMES.map(o => (
              <button
                key={o.value}
                style={styles.outcomeButton(outcome === o.value, o.color)}
                onClick={() => setOutcome(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label>Notes (optional)</label>
          <textarea
            style={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about the decision..."
          />
        </div>

        <div style={styles.modalActions}>
          <button style={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button 
            style={styles.submitButton} 
            onClick={() => onRecord(outcome, notes)}
            disabled={!outcome || updating}
          >
            {updating ? 'Saving...' : 'Save Outcome'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Journey Modal
function AddJourneyModal({ form, setForm, onAdd, onClose }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3 style={styles.modalTitle}>Add Lab Journey Manually</h3>
        
        <div style={styles.formGroup}>
          <label>Patient Name *</label>
          <input
            type="text"
            style={styles.input}
            value={form.patientName}
            onChange={(e) => setForm({ ...form, patientName: e.target.value })}
            placeholder="Enter patient name"
          />
        </div>

        <div style={styles.formGroup}>
          <label>Blood Draw Date (leave blank if not yet drawn)</label>
          <input
            type="date"
            style={styles.input}
            value={form.bloodDrawDate}
            onChange={(e) => setForm({ ...form, bloodDrawDate: e.target.value })}
          />
        </div>

        <div style={styles.modalActions}>
          <button style={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button 
            style={styles.submitButton} 
            onClick={onAdd}
            disabled={!form.patientName}
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
        <h3 style={styles.modalTitle}>Delete from Pipeline?</h3>
        <p style={styles.modalSubtitle}>
          Are you sure you want to remove <strong>{name}</strong> from the labs pipeline?
        </p>
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '8px' }}>
          This will not delete the patient or any protocols, only remove them from this tracking view.
        </p>
        
        <div style={styles.modalActions}>
          <button style={styles.cancelButton} onClick={onCancel}>Cancel</button>
          <button 
            style={{ ...styles.submitButton, backgroundColor: '#dc2626' }}
            onClick={onConfirm}
            disabled={updating}
          >
            {updating ? 'Deleting...' : 'Delete'}
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
  subTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  subTab: (active) => ({
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: active ? '#2563eb' : '#f3f4f6',
    color: active ? 'white' : '#374151',
    transition: 'all 0.2s'
  }),
  badge: (hasAlert) => ({
    backgroundColor: hasAlert ? '#fef3c7' : 'rgba(255,255,255,0.2)',
    color: hasAlert ? '#92400e' : 'inherit',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  }),
  alertBadge: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600'
  },
  headerActions: {
    marginLeft: 'auto',
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
  card: (isOverdue) => ({
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: isOverdue ? '2px solid #fbbf24' : '1px solid #e5e7eb'
  }),
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
    gap: '8px',
    flexWrap: 'wrap'
  },
  patientName: {
    fontWeight: '600',
    color: '#111827',
    textDecoration: 'none',
    fontSize: '14px'
  },
  phone: {
    fontSize: '12px',
    color: '#6b7280',
    textDecoration: 'none'
  },
  protocolBadge: {
    fontSize: '11px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '500'
  },
  cardDetails: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.5'
  },
  overdue: {
    color: '#dc2626',
    fontWeight: '600'
  },
  cardActions: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #f3f4f6'
  },
  actionButton: {
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
  // Protocol link styles for Needs Outcome column
  protocolLink: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#f0fdf4',
    borderRadius: '6px',
    border: '1px solid #bbf7d0'
  },
  protocolLinkHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  protocolTypeBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '600'
  },
  protocolStatus: (status) => ({
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: status === 'active' ? '#dcfce7' : '#f3f4f6',
    color: status === 'active' ? '#166534' : '#6b7280',
    fontWeight: '500',
    textTransform: 'capitalize'
  }),
  protocolMeta: {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '4px'
  },
  viewProtocolLink: {
    fontSize: '11px',
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '500'
  },
  outcomeRecorded: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px'
  },
  outcomeBadge: (outcome) => {
    const colors = {
      hrt: { bg: '#dbeafe', text: '#1e40af' },
      weight_loss: { bg: '#dcfce7', text: '#166534' },
      peptide: { bg: '#f3e8ff', text: '#7c3aed' },
      thinking: { bg: '#fef3c7', text: '#92400e' },
      declined: { bg: '#f3f4f6', text: '#6b7280' }
    };
    const c = colors[outcome] || colors.declined;
    return {
      fontSize: '11px',
      padding: '2px 8px',
      borderRadius: '4px',
      backgroundColor: c.bg,
      color: c.text,
      fontWeight: '600'
    };
  },
  outcomeNotes: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px',
    fontStyle: 'italic'
  },
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
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  },
  modalTitle: {
    margin: '0 0 4px 0',
    fontSize: '18px',
    fontWeight: '600'
  },
  modalSubtitle: {
    margin: '0 0 20px 0',
    color: '#6b7280',
    fontSize: '14px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  methodButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px'
  },
  methodButton: (active) => ({
    flex: 1,
    padding: '10px',
    border: active ? '2px solid #2563eb' : '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: active ? '#eff6ff' : 'white',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '13px'
  }),
  outcomeButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '8px'
  },
  outcomeButton: (active, color) => ({
    padding: '12px',
    border: active ? `2px solid ${color}` : '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: active ? `${color}15` : 'white',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '13px'
  }),
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit',
    marginTop: '8px',
    boxSizing: 'border-box'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontFamily: 'inherit',
    marginTop: '8px',
    boxSizing: 'border-box'
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
  }
};
