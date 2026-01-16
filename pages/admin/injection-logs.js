// =====================================================
// RANGE MEDICAL - INJECTION LOGS
// /pages/admin/injection-logs.js
// Searchable patient input with autocomplete
// =====================================================

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const TESTOSTERONE_DOSES = [
  { value: '0.3ml', label: '0.3ml (60mg)' },
  { value: '0.4ml', label: '0.4ml (80mg)' },
  { value: '0.5ml', label: '0.5ml (100mg)' },
  { value: '0.6ml', label: '0.6ml (120mg)' },
  { value: '0.7ml', label: '0.7ml (140mg)' },
  { value: '0.8ml', label: '0.8ml (160mg)' },
  { value: '0.9ml', label: '0.9ml (180mg)' },
  { value: '1.0ml', label: '1.0ml (200mg)' }
];

const WEIGHT_LOSS_MEDS = [
  { value: 'semaglutide', label: 'Semaglutide', doses: ['0.25mg', '0.5mg', '1mg', '1.7mg', '2.4mg'] },
  { value: 'tirzepatide', label: 'Tirzepatide', doses: ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'] },
  { value: 'retatrutide', label: 'Retatrutide', doses: ['1mg', '2mg', '4mg', '8mg', '12mg'] }
];

const VITAMIN_TYPES = [
  'Amino Blend', 'B12', 'B-Complex', 'Biotin', 'Vitamin D3', 
  'NAC', 'BCAA', 'L-Carnitine', 'Glutathione', 
  'NAD+ 100mg', 'NAD+ 250mg', 'NAD+ 500mg', 'Lipotropic'
];

export default function InjectionLogs() {
  const [activeTab, setActiveTab] = useState('testosterone');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ today: 0, week: 0 });

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/injection-logs?category=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setStats(data.stats || { today: 0, week: 0 });
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      const res = await fetch(`/api/injection-logs?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchLogs();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.patient_name?.toLowerCase().includes(search) ||
      log.medication?.toLowerCase().includes(search) ||
      log.notes?.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    });
  };

  return (
    <>
      <Head>
        <title>Injection Logs | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <Link href="/admin/pipeline" style={styles.backLink}>← Back to Pipeline</Link>
        
        <div style={styles.header}>
          <h1 style={styles.title}>Injection Logs</h1>
          <div style={styles.headerRight}>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <button onClick={() => setShowModal(true)} style={styles.addButton}>
              + New Entry
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {[
            { id: 'testosterone', label: 'Testosterone' },
            { id: 'weight_loss', label: 'Weight Loss' },
            { id: 'vitamin', label: 'Vitamin Injections' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {})
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Logs Table */}
        <div style={styles.tableWrapper}>
          {loading ? (
            <div style={styles.empty}>Loading...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={styles.empty}>No log entries found. Click "+ New Entry" to add one.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Details</th>
                  <th style={styles.th}>Notes</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div>{formatDate(log.entry_date || log.created_at)}</div>
                      <div style={styles.timeText}>{formatTime(log.created_at)}</div>
                    </td>
                    <td style={styles.td}>
                      <Link href={`/admin/patient/${log.patient_id}`} style={styles.patientLink}>
                        {log.patient_name || 'Unknown'}
                      </Link>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: log.entry_type === 'injection' ? '#dcfce7' : '#dbeafe',
                        color: log.entry_type === 'injection' ? '#166534' : '#1e40af'
                      }}>
                        {log.entry_type === 'injection' ? '💉 Injection' : '📦 Pickup'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 500 }}>{log.medication || '-'}</div>
                      {log.dosage && <div style={styles.hrtBadge}>{log.dosage}</div>}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.notesText}>{log.notes || '-'}</span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDelete(log.id)}
                        style={styles.deleteButton}
                        title="Delete"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Stats */}
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Today:</span>
            <span style={styles.statValue}>{stats.today}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>This Week:</span>
            <span style={styles.statValue}>{stats.week}</span>
          </div>
        </div>
      </div>

      {/* New Entry Modal */}
      {showModal && (
        <NewEntryModal
          category={activeTab}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchLogs();
          }}
        />
      )}
    </>
  );
}

// =====================================================
// NEW ENTRY MODAL - with searchable patient input
// =====================================================
function NewEntryModal({ category, onClose, onSave }) {
  const [allPatients, setAllPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryType, setEntryType] = useState('injection');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [hrtType, setHrtType] = useState('male');
  const [pickupQty, setPickupQty] = useState('');
  const [pickupType, setPickupType] = useState('prefilled');
  const [weekSupply, setWeekSupply] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch all patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await fetch('/api/patients?limit=2000');
      if (res.ok) {
        const data = await res.json();
        // Sort alphabetically by name
        const sorted = (data.patients || []).sort((a, b) => {
          const nameA = (a.name || a.full_name || '').toLowerCase();
          const nameB = (b.name || b.full_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setAllPatients(sorted);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Filter patients based on search query
  const filteredPatients = allPatients.filter(p => {
    if (!searchQuery || searchQuery.length < 1) return false;
    const query = searchQuery.toLowerCase();
    const name = (p.name || p.full_name || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const phone = (p.phone || '');
    return name.includes(query) || email.includes(query) || phone.includes(query);
  }).slice(0, 15); // Limit to 15 results

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(value.length >= 1);
    // Clear selected patient if user starts typing again
    if (selectedPatient && value !== (selectedPatient.name || selectedPatient.full_name)) {
      setSelectedPatient(null);
    }
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery(patient.name || patient.full_name || '');
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleSave = async () => {
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    // Validate required fields based on category
    if (category === 'testosterone') {
      if (entryType === 'injection' && !dosage) {
        setError('Please select a dosage');
        return;
      }
      if (entryType === 'pickup') {
        if (!pickupQty) {
          setError('Please select pickup quantity');
          return;
        }
        if (pickupType === 'prefilled' && !dosage) {
          setError('Please select dose per syringe');
          return;
        }
      }
    } else if (category === 'weight_loss') {
      if (!medication || !dosage) {
        setError('Please select medication and dosage');
        return;
      }
      if (entryType === 'pickup' && !weekSupply) {
        setError('Please select week supply');
        return;
      }
    } else if (category === 'vitamin') {
      if (!medication) {
        setError('Please select vitamin type');
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        patient_id: selectedPatient.id,
        ghl_contact_id: selectedPatient.ghl_contact_id,
        category,
        entry_type: entryType,
        entry_date: entryDate,
        medication: category === 'testosterone' 
          ? `${hrtType === 'male' ? 'Male' : 'Female'} HRT`
          : medication,
        dosage: category === 'testosterone' && entryType === 'pickup'
          ? pickupType === 'vial'
            ? `${pickupQty} vial${pickupQty > 1 ? 's' : ''} (10mL @ ${hrtType === 'male' ? '200mg/ml' : '100mg/ml'})`
            : `${pickupQty} prefilled @ ${dosage}`
          : entryType === 'pickup' && category === 'weight_loss'
          ? `${weekSupply} week supply`
          : dosage,
        notes
      };

      const res = await fetch('/api/injection-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        onSave();
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      setError('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const getDisplayName = (patient) => {
    return patient.name || patient.full_name || patient.email || 'Unknown';
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>
            New {category === 'testosterone' ? 'Testosterone' : 
                 category === 'weight_loss' ? 'Weight Loss' : 'Vitamin'} Entry
          </h2>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        <div style={modalStyles.body}>
          {error && <div style={modalStyles.error}>{error}</div>}

          {/* Patient Search Input */}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Patient *</label>
            <div style={modalStyles.searchWrapper} ref={dropdownRef}>
              {selectedPatient ? (
                <div style={modalStyles.selectedPatient}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{getDisplayName(selectedPatient)}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {selectedPatient.phone || selectedPatient.email || 'No contact info'}
                    </div>
                  </div>
                  <button onClick={clearPatient} style={modalStyles.clearBtn}>×</button>
                </div>
              ) : (
                <>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery.length >= 1 && setShowDropdown(true)}
                    placeholder={loadingPatients ? "Loading patients..." : "Type to search patient..."}
                    style={modalStyles.input}
                    disabled={loadingPatients}
                  />
                  {showDropdown && filteredPatients.length > 0 && (
                    <div style={modalStyles.dropdown}>
                      {filteredPatients.map(patient => (
                        <div
                          key={patient.id}
                          onClick={() => selectPatient(patient)}
                          style={modalStyles.dropdownItem}
                        >
                          <div style={{ fontWeight: 500 }}>{getDisplayName(patient)}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {patient.phone && <span>{patient.phone}</span>}
                            {patient.phone && patient.email && <span> • </span>}
                            {patient.email && <span>{patient.email}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showDropdown && searchQuery.length >= 1 && filteredPatients.length === 0 && (
                    <div style={modalStyles.dropdown}>
                      <div style={{ ...modalStyles.dropdownItem, color: '#6b7280' }}>
                        No patients found
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Date Picker */}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Date *</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              style={modalStyles.input}
            />
          </div>

          {/* Entry Type */}
          {category !== 'vitamin' && (
            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Type</label>
              <div style={modalStyles.radioGroup}>
                <label style={modalStyles.radio}>
                  <input
                    type="radio"
                    checked={entryType === 'injection'}
                    onChange={() => setEntryType('injection')}
                  />
                  💉 In-Clinic Injection
                </label>
                <label style={modalStyles.radio}>
                  <input
                    type="radio"
                    checked={entryType === 'pickup'}
                    onChange={() => setEntryType('pickup')}
                  />
                  📦 Medication Pickup
                </label>
              </div>
            </div>
          )}

          {/* Category-specific fields */}
          {category === 'testosterone' && (
            <>
              <div style={modalStyles.field}>
                <label style={modalStyles.label}>HRT Type</label>
                <select
                  value={hrtType}
                  onChange={(e) => setHrtType(e.target.value)}
                  style={modalStyles.select}
                >
                  <option value="male">Male HRT (200mg/ml)</option>
                  <option value="female">Female HRT (100mg/ml)</option>
                </select>
              </div>

              {entryType === 'injection' ? (
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Dosage *</label>
                  <select
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    style={modalStyles.select}
                  >
                    <option value="">Select dosage...</option>
                    {TESTOSTERONE_DOSES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Pickup Type</label>
                    <select
                      value={pickupType}
                      onChange={(e) => setPickupType(e.target.value)}
                      style={modalStyles.select}
                    >
                      <option value="prefilled">Prefilled Syringes</option>
                      <option value="vial">Vials</option>
                    </select>
                  </div>
                  
                  {pickupType === 'vial' ? (
                    <>
                      <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Vial Size</label>
                        <div style={modalStyles.infoBox}>
                          10mL vial @ {hrtType === 'male' ? '200mg/ml' : '100mg/ml'}
                        </div>
                      </div>
                      <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Quantity *</label>
                        <select
                          value={pickupQty}
                          onChange={(e) => setPickupQty(e.target.value)}
                          style={modalStyles.select}
                        >
                          <option value="">Select quantity...</option>
                          <option value="1">1 vial</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Dose per Syringe *</label>
                        <select
                          value={dosage}
                          onChange={(e) => setDosage(e.target.value)}
                          style={modalStyles.select}
                        >
                          <option value="">Select dose...</option>
                          {TESTOSTERONE_DOSES.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                      <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Quantity *</label>
                        <select
                          value={pickupQty}
                          onChange={(e) => setPickupQty(e.target.value)}
                          style={modalStyles.select}
                        >
                          <option value="">Select quantity...</option>
                          <option value="4">4 syringes</option>
                          <option value="8">8 syringes</option>
                        </select>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {category === 'weight_loss' && (
            <>
              <div style={modalStyles.field}>
                <label style={modalStyles.label}>Medication *</label>
                <select
                  value={medication}
                  onChange={(e) => {
                    setMedication(e.target.value);
                    setDosage('');
                  }}
                  style={modalStyles.select}
                >
                  <option value="">Select medication...</option>
                  {WEIGHT_LOSS_MEDS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div style={modalStyles.field}>
                <label style={modalStyles.label}>Dosage *</label>
                <select
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  style={modalStyles.select}
                  disabled={!medication}
                >
                  <option value="">Select dosage...</option>
                  {(WEIGHT_LOSS_MEDS.find(m => m.value === medication)?.doses || []).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {entryType === 'pickup' && (
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Week Supply *</label>
                  <select
                    value={weekSupply}
                    onChange={(e) => setWeekSupply(e.target.value)}
                    style={modalStyles.select}
                  >
                    <option value="">Select supply...</option>
                    {[1, 2, 4, 8, 12].map(w => (
                      <option key={w} value={w}>{w} week{w > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {category === 'vitamin' && (
            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Vitamin Type *</label>
              <select
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                style={modalStyles.select}
              >
                <option value="">Select type...</option>
                {VITAMIN_TYPES.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              style={modalStyles.textarea}
              rows={2}
            />
          </div>
        </div>

        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={modalStyles.saveBtn}
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  backLink: {
    fontSize: '14px',
    color: '#6b7280',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: '16px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: 0
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  searchInput: {
    padding: '10px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    width: '200px',
    outline: 'none'
  },
  addButton: {
    padding: '10px 20px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tabs: {
    display: 'flex',
    gap: '0',
    marginBottom: '24px',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb'
  },
  tab: {
    flex: 1,
    padding: '14px 20px',
    border: 'none',
    background: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s',
    color: '#6b7280'
  },
  tabActive: {
    background: '#000',
    color: '#fff'
  },
  tableWrapper: {
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
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb'
  },
  tr: {
    borderBottom: '1px solid #f3f4f6'
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    verticalAlign: 'middle'
  },
  timeText: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  patientLink: {
    color: '#111',
    textDecoration: 'none',
    fontWeight: '500'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600'
  },
  hrtBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    background: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#374151',
    marginTop: '4px'
  },
  notesText: {
    color: '#6b7280',
    fontSize: '13px',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block'
  },
  deleteButton: {
    width: '28px',
    height: '28px',
    border: 'none',
    background: 'transparent',
    color: '#9ca3af',
    fontSize: '20px',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  empty: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#9ca3af'
  },
  stats: {
    display: 'flex',
    gap: '24px',
    marginTop: '16px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  statItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280'
  },
  statValue: {
    fontSize: '14px',
    fontWeight: '600'
  }
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb'
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    border: 'none',
    background: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  body: {
    padding: '24px'
  },
  field: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    background: '#fff',
    cursor: 'pointer'
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  searchWrapper: {
    position: 'relative'
  },
  selectedPatient: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: '#f9fafb'
  },
  clearBtn: {
    width: '24px',
    height: '24px',
    border: 'none',
    background: '#e5e7eb',
    borderRadius: '50%',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginTop: '4px',
    maxHeight: '240px',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  dropdownItem: {
    padding: '12px 14px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background 0.15s'
  },
  infoBox: {
    padding: '12px 14px',
    background: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  radioGroup: {
    display: 'flex',
    gap: '20px'
  },
  radio: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  error: {
    padding: '12px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '20px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px 24px',
    borderTop: '1px solid #e5e7eb'
  },
  cancelBtn: {
    padding: '10px 20px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  saveBtn: {
    padding: '10px 24px',
    border: 'none',
    background: '#000',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};
