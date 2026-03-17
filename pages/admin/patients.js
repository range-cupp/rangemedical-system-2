// /pages/admin/patients.js
// Patients List with Merge feature - Range Medical
// Clean aesthetic matching Pipeline

import { useState, useEffect } from 'react';
import { formatPhone } from '../../lib/format-utils';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

export default function PatientsList() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredPatients, setFilteredPatients] = useState([]);

  // Add Patient modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  // Merge modal state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeStep, setMergeStep] = useState(1); // 1: select primary, 2: select duplicate, 3: preview/confirm
  const [primaryPatient, setPrimaryPatient] = useState(null);
  const [duplicatePatient, setDuplicatePatient] = useState(null);
  const [mergeSearch, setMergeSearch] = useState('');
  const [mergePreview, setMergePreview] = useState(null);
  const [merging, setMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    let result = patients;

    // Tag/program/condition filter
    if (activeFilter !== 'all') {
      result = result.filter(p => {
        if (activeFilter === 'online') {
          return getSourceTag(p) === 'Online Assessment';
        }
        if (activeFilter === 'walk-in') {
          return getSourceTag(p) === 'Walk-in';
        }
        // Condition filter
        if (activeFilter.startsWith('condition:')) {
          return (p.tags || []).includes(activeFilter);
        }
        // Program filter
        return (p.activePrograms || []).includes(activeFilter);
      });
    }

    // Search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        (p.first_name?.toLowerCase() || '').includes(term) ||
        (p.last_name?.toLowerCase() || '').includes(term) ||
        (p.name?.toLowerCase() || '').includes(term) ||
        (p.email?.toLowerCase() || '').includes(term) ||
        (p.phone || '').includes(term)
      );
    }

    setFilteredPatients(result);
  }, [searchTerm, activeFilter, patients]);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/admin/patients');
      if (res.ok) {
        const data = await res.json();
        const patientList = Array.isArray(data) ? data : (data.patients || []);
        setPatients(patientList);
        setFilteredPatients(patientList);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (patient) => {
    if (patient.first_name && patient.last_name) {
      return `${patient.first_name} ${patient.last_name}`;
    }
    return patient.name || patient.email || 'Unknown';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Tag helpers
  const PROGRAM_COLORS = {
    hrt: { bg: '#f3e8ff', text: '#7c3aed', label: 'HRT' },
    weight_loss: { bg: '#dbeafe', text: '#1e40af', label: 'Weight Loss' },
    peptide: { bg: '#dcfce7', text: '#166534', label: 'Peptide' },
    iv: { bg: '#ffedd5', text: '#c2410c', label: 'IV' },
    hbot: { bg: '#e0e7ff', text: '#3730a3', label: 'HBOT' },
    rlt: { bg: '#fee2e2', text: '#dc2626', label: 'RLT' },
    injection: { bg: '#fef3c7', text: '#92400e', label: 'Injection' },
  };

  const CONDITION_LABELS = {
    hypertension: 'High Blood Pressure',
    highCholesterol: 'High Cholesterol',
    heartDisease: 'Heart Disease',
    diabetes: 'Diabetes',
    thyroid: 'Thyroid Disorder',
    depression: 'Depression/Anxiety',
    eatingDisorder: 'Eating Disorder',
    kidney: 'Kidney Disease',
    liver: 'Liver Disease',
    autoimmune: 'Autoimmune',
    cancer: 'Cancer',
  };

  const CONDITION_STYLE = { bg: '#fef2f2', text: '#991b1b' };

  const getConditionTags = (patient) => {
    const tags = patient.tags || [];
    return tags
      .filter(t => t && t.startsWith('condition:'))
      .map(t => t.replace('condition:', ''));
  };

  const SOURCE_COLORS = {
    'Online Assessment': { bg: '#dbeafe', text: '#1e40af' },
    'Research': { bg: '#f3e8ff', text: '#7c3aed' },
    'CRM Import': { bg: '#f3f4f6', text: '#6b7280' },
    'Walk-in': { bg: '#f3f4f6', text: '#6b7280' },
  };

  const getSourceTag = (patient) => {
    const tags = patient.tags || [];
    if (tags.some(t => t && (t.includes('assessment') || t.includes('research-lead')))) {
      if (tags.some(t => t && t.includes('research-lead') && !t.includes('assessment'))) return 'Research';
      return 'Online Assessment';
    }
    if (patient.ghl_contact_id) return 'CRM Import';
    return 'Walk-in';
  };

  const FILTER_OPTIONS = [
    { key: 'all', label: 'All' },
    { key: 'hrt', label: 'HRT' },
    { key: 'weight_loss', label: 'Weight Loss' },
    { key: 'peptide', label: 'Peptide' },
    { key: 'iv', label: 'IV' },
    { key: 'hbot', label: 'HBOT' },
    { key: 'rlt', label: 'RLT' },
    { key: 'online', label: 'Online' },
    { key: 'walk-in', label: 'Walk-in' },
  ];

  // Build dynamic condition filters from actual patient data
  const conditionFilters = (() => {
    const condSet = new Set();
    patients.forEach(p => {
      getConditionTags(p).forEach(c => condSet.add(c));
    });
    return [...condSet].sort().map(c => ({
      key: `condition:${c}`,
      label: CONDITION_LABELS[c] || c,
    }));
  })();

  // Merge functions
  const openMergeModal = () => {
    setShowMergeModal(true);
    setMergeStep(1);
    setPrimaryPatient(null);
    setDuplicatePatient(null);
    setMergeSearch('');
    setMergePreview(null);
    setMergeResult(null);
  };

  const closeMergeModal = () => {
    setShowMergeModal(false);
    setMergeStep(1);
    setPrimaryPatient(null);
    setDuplicatePatient(null);
    setMergeSearch('');
    setMergePreview(null);
    setMergeResult(null);
  };

  const getMergeFilteredPatients = () => {
    if (!mergeSearch.trim()) return [];
    const term = mergeSearch.toLowerCase();
    return patients
      .filter(p => {
        // Exclude already selected patient
        if (mergeStep === 2 && primaryPatient && p.id === primaryPatient.id) return false;
        return (
          (p.first_name?.toLowerCase() || '').includes(term) ||
          (p.last_name?.toLowerCase() || '').includes(term) ||
          (p.name?.toLowerCase() || '').includes(term) ||
          (p.email?.toLowerCase() || '').includes(term) ||
          (p.phone || '').includes(term)
        );
      })
      .slice(0, 10);
  };

  const selectPrimary = (patient) => {
    setPrimaryPatient(patient);
    setMergeSearch('');
    setMergeStep(2);
  };

  const selectDuplicate = async (patient) => {
    setDuplicatePatient(patient);
    setMergeSearch('');
    setMergeStep(3);

    // Fetch preview
    try {
      const res = await fetch('/api/admin/merge-patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryId: primaryPatient.id,
          duplicateId: patient.id,
          preview: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setMergePreview(data);
      }
    } catch (err) {
      console.error('Error fetching merge preview:', err);
    }
  };

  const executeMerge = async () => {
    if (!primaryPatient || !duplicatePatient) return;

    setMerging(true);
    try {
      const res = await fetch('/api/admin/merge-patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryId: primaryPatient.id,
          duplicateId: duplicatePatient.id,
          preview: false
        })
      });
      const data = await res.json();
      setMergeResult(data);

      if (data.success) {
        // Refresh patient list
        await fetchPatients();
      }
    } catch (err) {
      setMergeResult({ success: false, error: err.message });
    } finally {
      setMerging(false);
    }
  };

  const handleAddPatient = async () => {
    setAddSaving(true);
    setAddError('');
    try {
      const res = await fetch('/api/admin/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: addForm.firstName,
          last_name: addForm.lastName,
          email: addForm.email || null,
          phone: addForm.phone || null,
          date_of_birth: addForm.dateOfBirth || null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Failed to create patient');
        return;
      }
      // Success — close modal and navigate to new patient
      setShowAddModal(false);
      setAddForm({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '' });
      window.location.href = `/patients/${data.id}`;
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddSaving(false);
    }
  };

  if (loading) {
    return <AdminLayout title="Patients"><div style={styles.loading}>Loading patients...</div></AdminLayout>;
  }

  return (
    <AdminLayout
      title={`Patients (${filteredPatients.length})`}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setShowAddModal(true); setAddError(''); }} style={styles.addBtn}>
            + Add Patient
          </button>
          <button onClick={openMergeModal} style={styles.mergeBtn}>
            Merge Patients
          </button>
        </div>
      }
    >

        {/* Search + Filters */}
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <div style={styles.filterBar}>
            {FILTER_OPTIONS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  ...styles.filterBtn,
                  ...(activeFilter === f.key ? styles.filterBtnActive : {}),
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          {conditionFilters.length > 0 && (
            <div style={{ ...styles.filterBar, marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500', padding: '5px 4px' }}>Conditions:</span>
              {conditionFilters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(activeFilter === f.key ? 'all' : f.key)}
                  style={{
                    ...styles.filterBtn,
                    ...(activeFilter === f.key ? { background: '#991b1b', color: '#fff', borderColor: '#991b1b' } : { borderColor: '#fecaca', color: '#991b1b' }),
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Patient List */}
        {filteredPatients.length === 0 ? (
          <div style={styles.emptyState}>
            {searchTerm || activeFilter !== 'all' ? 'No patients match your filters' : 'No patients found'}
          </div>
        ) : (
          <div style={styles.list}>
            {filteredPatients.map(patient => {
              const source = getSourceTag(patient);
              const sourceColor = SOURCE_COLORS[source] || SOURCE_COLORS['Walk-in'];
              const programs = patient.activePrograms || [];

              const conditions = getConditionTags(patient);

              return (
                <Link
                  key={patient.id}
                  href={`/patients/${patient.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={styles.card}>
                    <div style={styles.cardMain}>
                      <div style={styles.patientName}>{getDisplayName(patient)}</div>
                      <div style={styles.patientMeta}>
                        {patient.email && <span>{patient.email}</span>}
                        {patient.phone && <span> • {formatPhone(patient.phone)}</span>}
                      </div>
                      <div style={styles.tagRow}>
                        <span style={{ ...styles.tag, background: sourceColor.bg, color: sourceColor.text }}>
                          {source}
                        </span>
                        {programs.map(prog => {
                          const c = PROGRAM_COLORS[prog];
                          return c ? (
                            <span key={prog} style={{ ...styles.tag, background: c.bg, color: c.text }}>
                              {c.label}
                            </span>
                          ) : null;
                        })}
                        {conditions.map(cond => (
                          <span
                            key={cond}
                            style={{ ...styles.tag, background: CONDITION_STYLE.bg, color: CONDITION_STYLE.text }}
                            onClick={(e) => { e.preventDefault(); setActiveFilter(`condition:${cond}`); }}
                          >
                            {CONDITION_LABELS[cond] || cond}
                          </span>
                        ))}
                      </div>
                      {patient.created_at && (
                        <div style={styles.patientDate}>
                          Added {formatDate(patient.created_at)}
                        </div>
                      )}
                    </div>
                    <div style={styles.cardArrow}>→</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, width: '460px' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add Patient</h2>
              <button style={styles.closeBtn} onClick={() => { setShowAddModal(false); setAddError(''); }}>×</button>
            </div>
            <div style={styles.modalBody}>
              {addError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
                  {addError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={styles.addLabel}>First Name *</label>
                  <input
                    type="text"
                    value={addForm.firstName}
                    onChange={e => setAddForm({ ...addForm, firstName: e.target.value })}
                    style={styles.addInput}
                    placeholder="First name"
                    autoFocus
                  />
                </div>
                <div>
                  <label style={styles.addLabel}>Last Name *</label>
                  <input
                    type="text"
                    value={addForm.lastName}
                    onChange={e => setAddForm({ ...addForm, lastName: e.target.value })}
                    style={styles.addInput}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={styles.addLabel}>Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                  style={styles.addInput}
                  placeholder="patient@email.com"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={styles.addLabel}>Phone</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                  style={styles.addInput}
                  placeholder="(555) 555-5555"
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={styles.addLabel}>Date of Birth</label>
                <input
                  type="date"
                  value={addForm.dateOfBirth}
                  onChange={e => setAddForm({ ...addForm, dateOfBirth: e.target.value })}
                  style={styles.addInput}
                />
              </div>
              <button
                onClick={handleAddPatient}
                disabled={addSaving || !addForm.firstName.trim() || !addForm.lastName.trim()}
                style={{
                  ...styles.addBtn,
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  opacity: (addSaving || !addForm.firstName.trim() || !addForm.lastName.trim()) ? 0.5 : 1
                }}
              >
                {addSaving ? 'Creating...' : 'Create Patient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {mergeStep === 1 && 'Select Patient to Keep'}
                {mergeStep === 2 && 'Select Duplicate to Merge'}
                {mergeStep === 3 && 'Confirm Merge'}
              </h2>
              <button style={styles.closeBtn} onClick={closeMergeModal}>×</button>
            </div>

            <div style={styles.modalBody}>
              {/* Step 1: Select Primary */}
              {mergeStep === 1 && (
                <>
                  <p style={styles.stepDesc}>
                    Search for the patient record you want to <strong>keep</strong>.
                    All data from the duplicate will be moved to this patient.
                  </p>
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={mergeSearch}
                    onChange={(e) => setMergeSearch(e.target.value)}
                    style={styles.modalInput}
                    autoFocus
                  />
                  {mergeSearch && (
                    <div style={styles.searchResults}>
                      {getMergeFilteredPatients().map(p => (
                        <div
                          key={p.id}
                          style={styles.searchResultItem}
                          onClick={() => selectPrimary(p)}
                        >
                          <div style={styles.resultName}>{getDisplayName(p)}</div>
                          <div style={styles.resultMeta}>
                            {p.email || formatPhone(p.phone) || 'No contact'}
                          </div>
                        </div>
                      ))}
                      {getMergeFilteredPatients().length === 0 && (
                        <div style={styles.noResults}>No patients found</div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Step 2: Select Duplicate */}
              {mergeStep === 2 && (
                <>
                  <div style={styles.selectedPatient}>
                    <div style={styles.selectedLabel}>Keep:</div>
                    <div style={styles.selectedName}>{getDisplayName(primaryPatient)}</div>
                    <div style={styles.selectedMeta}>
                      {primaryPatient.email || formatPhone(primaryPatient.phone) || 'No contact'}
                    </div>
                  </div>

                  <p style={styles.stepDesc}>
                    Now search for the <strong>duplicate</strong> record to merge into the patient above.
                    This record will be deleted after merging.
                  </p>
                  <input
                    type="text"
                    placeholder="Search for duplicate patient..."
                    value={mergeSearch}
                    onChange={(e) => setMergeSearch(e.target.value)}
                    style={styles.modalInput}
                    autoFocus
                  />
                  {mergeSearch && (
                    <div style={styles.searchResults}>
                      {getMergeFilteredPatients().map(p => (
                        <div
                          key={p.id}
                          style={styles.searchResultItem}
                          onClick={() => selectDuplicate(p)}
                        >
                          <div style={styles.resultName}>{getDisplayName(p)}</div>
                          <div style={styles.resultMeta}>
                            {p.email || formatPhone(p.phone) || 'No contact'}
                          </div>
                        </div>
                      ))}
                      {getMergeFilteredPatients().length === 0 && (
                        <div style={styles.noResults}>No patients found</div>
                      )}
                    </div>
                  )}

                  <button
                    style={styles.backStepBtn}
                    onClick={() => { setMergeStep(1); setPrimaryPatient(null); setMergeSearch(''); }}
                  >
                    ← Back
                  </button>
                </>
              )}

              {/* Step 3: Preview & Confirm */}
              {mergeStep === 3 && !mergeResult && (
                <>
                  <div style={styles.mergePreview}>
                    <div style={styles.previewBox}>
                      <div style={styles.previewLabel}>KEEP (Primary)</div>
                      <div style={styles.previewName}>{getDisplayName(primaryPatient)}</div>
                      <div style={styles.previewMeta}>
                        {primaryPatient.email && <div>Email: {primaryPatient.email}</div>}
                        {primaryPatient.phone && <div>Phone: {formatPhone(primaryPatient.phone)}</div>}
                        {primaryPatient.ghl_contact_id && <div>GHL ID: {primaryPatient.ghl_contact_id}</div>}
                      </div>
                    </div>

                    <div style={styles.mergeArrow}>←</div>

                    <div style={{ ...styles.previewBox, ...styles.previewBoxDelete }}>
                      <div style={styles.previewLabelDelete}>DELETE (Duplicate)</div>
                      <div style={styles.previewName}>{getDisplayName(duplicatePatient)}</div>
                      <div style={styles.previewMeta}>
                        {duplicatePatient.email && <div>Email: {duplicatePatient.email}</div>}
                        {duplicatePatient.phone && <div>Phone: {formatPhone(duplicatePatient.phone)}</div>}
                        {duplicatePatient.ghl_contact_id && <div>GHL ID: {duplicatePatient.ghl_contact_id}</div>}
                      </div>
                    </div>
                  </div>

                  {mergePreview && (
                    <div style={styles.recordsPreview}>
                      <div style={styles.recordsTitle}>
                        Records to Transfer: {mergePreview.totalRecords}
                      </div>
                      {Object.entries(mergePreview.recordsToMove || {}).map(([table, count]) => (
                        <div key={table} style={styles.recordRow}>
                          <span>{table.replace(/_/g, ' ')}</span>
                          <span style={styles.recordCount}>{count}</span>
                        </div>
                      ))}
                      {mergePreview.totalRecords === 0 && (
                        <div style={styles.noRecords}>No linked records to transfer</div>
                      )}
                    </div>
                  )}

                  <div style={styles.warningBox}>
                    <strong>Warning:</strong> This action cannot be undone. The duplicate patient record
                    will be permanently deleted after all data is transferred.
                  </div>

                  <div style={styles.confirmActions}>
                    <button
                      style={styles.backStepBtn}
                      onClick={() => { setMergeStep(2); setDuplicatePatient(null); setMergePreview(null); setMergeSearch(''); }}
                    >
                      ← Back
                    </button>
                    <button
                      style={styles.confirmMergeBtn}
                      onClick={executeMerge}
                      disabled={merging}
                    >
                      {merging ? 'Merging...' : 'Confirm Merge'}
                    </button>
                  </div>
                </>
              )}

              {/* Merge Result */}
              {mergeResult && (
                <div style={styles.resultContainer}>
                  {mergeResult.success ? (
                    <>
                      <div style={styles.successIcon}>✓</div>
                      <div style={styles.successTitle}>Merge Complete</div>
                      <div style={styles.successDetail}>
                        <strong>{getDisplayName(duplicatePatient)}</strong> has been merged into{' '}
                        <strong>{getDisplayName(primaryPatient)}</strong>
                      </div>
                      {mergeResult.recordsMoved && Object.keys(mergeResult.recordsMoved).length > 0 && (
                        <div style={styles.movedRecords}>
                          Transferred: {Object.entries(mergeResult.recordsMoved).map(([t, c]) => `${c} ${t}`).join(', ')}
                        </div>
                      )}
                      <button style={styles.doneBtn} onClick={closeMergeModal}>
                        Done
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={styles.errorIcon}>×</div>
                      <div style={styles.errorTitle}>Merge Failed</div>
                      <div style={styles.errorDetail}>{mergeResult.error}</div>
                      <button style={styles.doneBtn} onClick={closeMergeModal}>
                        Close
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#666'
  },
  header: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px'
  },
  navLinks: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  navLink: {
    color: '#000',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px'
  },
  addBtn: {
    padding: '8px 16px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  addLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '4px'
  },
  addInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  mergeBtn: {
    padding: '8px 16px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  searchContainer: {
    marginBottom: '24px'
  },
  searchInput: {
    width: '100%',
    maxWidth: '400px',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '12px',
  },
  filterBtn: {
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    background: '#fff',
    color: '#666',
    cursor: 'pointer',
  },
  filterBtnActive: {
    background: '#111',
    color: '#fff',
    borderColor: '#111',
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '6px',
  },
  tag: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '500',
    padding: '2px 8px',
    borderRadius: '10px',
    lineHeight: '16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    color: '#9ca3af',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s'
  },
  cardMain: {
    flex: 1
  },
  patientName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#000',
    marginBottom: '4px'
  },
  patientMeta: {
    fontSize: '14px',
    color: '#666'
  },
  patientDate: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  cardArrow: {
    fontSize: '18px',
    color: '#9ca3af',
    marginLeft: '16px'
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    width: '500px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#9ca3af'
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
  },
  stepDesc: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
    lineHeight: '1.5'
  },
  modalInput: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  searchResults: {
    marginTop: '8px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    maxHeight: '250px',
    overflowY: 'auto'
  },
  searchResultItem: {
    padding: '12px 14px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6'
  },
  resultName: {
    fontWeight: '500',
    marginBottom: '2px'
  },
  resultMeta: {
    fontSize: '13px',
    color: '#6b7280'
  },
  noResults: {
    padding: '16px',
    textAlign: 'center',
    color: '#9ca3af'
  },
  selectedPatient: {
    background: '#f0fdf4',
    border: '2px solid #86efac',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px'
  },
  selectedLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#166534',
    textTransform: 'uppercase',
    marginBottom: '4px'
  },
  selectedName: {
    fontSize: '16px',
    fontWeight: '600'
  },
  selectedMeta: {
    fontSize: '13px',
    color: '#666'
  },
  backStepBtn: {
    padding: '8px 16px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '16px'
  },

  // Preview styles
  mergePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px'
  },
  previewBox: {
    flex: 1,
    padding: '14px',
    background: '#f0fdf4',
    border: '2px solid #86efac',
    borderRadius: '8px'
  },
  previewBoxDelete: {
    background: '#fef2f2',
    borderColor: '#fca5a5'
  },
  previewLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#166534',
    textTransform: 'uppercase',
    marginBottom: '6px'
  },
  previewLabelDelete: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#dc2626',
    textTransform: 'uppercase',
    marginBottom: '6px'
  },
  previewName: {
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  previewMeta: {
    fontSize: '12px',
    color: '#666'
  },
  mergeArrow: {
    fontSize: '24px',
    color: '#9ca3af'
  },
  recordsPreview: {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '16px'
  },
  recordsTitle: {
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '10px'
  },
  recordRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '4px 0',
    textTransform: 'capitalize'
  },
  recordCount: {
    fontWeight: '500',
    color: '#059669'
  },
  noRecords: {
    fontSize: '13px',
    color: '#9ca3af'
  },
  warningBox: {
    background: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '13px',
    color: '#92400e',
    marginBottom: '16px'
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  confirmMergeBtn: {
    padding: '12px 24px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // Result styles
  resultContainer: {
    textAlign: 'center',
    padding: '20px 0'
  },
  successIcon: {
    width: '60px',
    height: '60px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    margin: '0 auto 16px'
  },
  successTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  successDetail: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px'
  },
  movedRecords: {
    fontSize: '13px',
    color: '#059669',
    marginBottom: '20px'
  },
  errorIcon: {
    width: '60px',
    height: '60px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    margin: '0 auto 16px'
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#dc2626'
  },
  errorDetail: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px'
  },
  doneBtn: {
    padding: '12px 32px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};
