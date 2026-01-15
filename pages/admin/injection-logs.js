// /pages/admin/injection-logs.js
// Injection Logs - Track injections and medication pickups
// Range Medical
// CREATED: 2026-01-14

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// ============================================
// MEDICATION OPTIONS
// ============================================

const TESTOSTERONE_OPTIONS = {
  male: {
    label: 'Male HRT',
    medication: 'Testosterone Cypionate 200mg/ml',
    dosages: [
      { value: '0.3ml', label: '0.3ml (60mg)' },
      { value: '0.4ml', label: '0.4ml (80mg)' },
      { value: '0.5ml', label: '0.5ml (100mg)' },
      { value: '0.6ml', label: '0.6ml (120mg)' },
      { value: 'custom', label: 'Custom dose' }
    ]
  },
  female: {
    label: 'Female HRT',
    medication: 'Testosterone Cypionate 100mg/ml',
    dosages: [
      { value: '0.1ml', label: '0.1ml (10mg)' },
      { value: '0.2ml', label: '0.2ml (20mg)' },
      { value: '0.3ml', label: '0.3ml (30mg)' },
      { value: '0.4ml', label: '0.4ml (40mg)' },
      { value: '0.5ml', label: '0.5ml (50mg)' },
      { value: 'custom', label: 'Custom dose' }
    ]
  }
};

const TESTOSTERONE_PICKUP_OPTIONS = {
  prefilled: {
    label: 'Prefilled Syringes',
    quantities: [4, 8, 12, 16, 20, 24]
  },
  vial: {
    label: 'Vial',
    quantities: [1, 2, 3]
  }
};

const WEIGHT_LOSS_OPTIONS = {
  medications: [
    { value: 'Semaglutide', label: 'Semaglutide' },
    { value: 'Tirzepatide', label: 'Tirzepatide' },
    { value: 'Retatrutide', label: 'Retatrutide' }
  ],
  dosages: {
    Semaglutide: ['0.25mg', '0.5mg', '1mg', '1.7mg', '2.4mg'],
    Tirzepatide: ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'],
    Retatrutide: ['1mg', '2mg', '4mg', '8mg', '12mg']
  }
};

const VITAMIN_INJECTION_OPTIONS = [
  { value: 'Amino Blend', label: 'Amino Blend' },
  { value: 'B12', label: 'B12' },
  { value: 'B-Complex', label: 'B-Complex' },
  { value: 'Biotin', label: 'Biotin' },
  { value: 'Vitamin D3', label: 'Vitamin D3' },
  { value: 'NAC', label: 'NAC' },
  { value: 'BCAA', label: 'BCAA' },
  { value: 'L-Carnitine', label: 'L-Carnitine' },
  { value: 'Glutathione 200mg', label: 'Glutathione 200mg' },
  { value: 'NAD+ 50mg', label: 'NAD+ 50mg' },
  { value: 'NAD+ 75mg', label: 'NAD+ 75mg' },
  { value: 'NAD+ 100mg', label: 'NAD+ 100mg' },
  { value: 'NAD+ 125mg', label: 'NAD+ 125mg' },
  { value: 'NAD+ 150mg', label: 'NAD+ 150mg' },
  { value: 'Lipotropic (MIC)', label: 'Lipotropic (MIC)' }
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function InjectionLogs() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('testosterone');
  const [logs, setLogs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    patient_id: '',
    patient_name: '',
    log_type: 'injection', // injection or pickup
    category: 'testosterone',
    hrt_type: 'male',
    medication: '',
    dosage: '',
    custom_dosage: '',
    pickup_type: 'prefilled',
    quantity: 8,
    notes: '',
    logged_at: new Date().toISOString().split('T')[0]
  });

  // URL-based tab
  useEffect(() => {
    const tab = router.query.tab;
    if (tab && ['testosterone', 'weight_loss', 'vitamin'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [router.query.tab]);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, patientsRes] = await Promise.all([
        fetch(`/api/injection-logs?category=${activeTab}`),
        fetch('/api/patients?simple=true')
      ]);
      
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
      
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData.patients || patientsData || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  const handleTabChange = (tab) => {
    router.push(`/admin/injection-logs?tab=${tab}`, undefined, { shallow: true });
    setActiveTab(tab);
    setShowForm(false);
    setFormData(prev => ({ ...prev, category: tab }));
  };

  const handlePatientSelect = (e) => {
    const patientId = e.target.value;
    const patient = patients.find(p => p.id === patientId);
    setFormData(prev => ({
      ...prev,
      patient_id: patientId,
      patient_name: patient ? patient.name : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        category: activeTab,
        dosage: formData.dosage === 'custom' ? formData.custom_dosage : formData.dosage
      };
      
      const res = await fetch('/api/injection-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setSuccessMessage('Log entry saved');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowForm(false);
        setFormData({
          patient_id: '',
          patient_name: '',
          log_type: 'injection',
          category: activeTab,
          hrt_type: 'male',
          medication: '',
          dosage: '',
          custom_dosage: '',
          pickup_type: 'prefilled',
          quantity: 8,
          notes: '',
          logged_at: new Date().toISOString().split('T')[0]
        });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save log entry');
    }
    
    setSaving(false);
  };

  const handleDelete = async (logId) => {
    if (!confirm('Delete this log entry?')) return;
    
    try {
      const res = await fetch(`/api/injection-logs?id=${logId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.patient_name?.toLowerCase().includes(searchLower) ||
      log.medication?.toLowerCase().includes(searchLower) ||
      log.notes?.toLowerCase().includes(searchLower)
    );
  });

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit'
    });
  };

  return (
    <>
      <Head>
        <title>Injection Logs - Range Medical</title>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <Link href="/admin/pipeline" style={styles.backLink}>← Back to Pipeline</Link>
            <h1 style={styles.title}>Injection Logs</h1>
          </div>
          <div style={styles.headerRight}>
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <button 
              onClick={() => setShowForm(!showForm)}
              style={styles.addButton}
            >
              + New Entry
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={styles.successBanner}>{successMessage}</div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => handleTabChange('testosterone')}
            style={{
              ...styles.tab,
              ...(activeTab === 'testosterone' ? styles.tabActive : {})
            }}
          >
            Testosterone
          </button>
          <button
            onClick={() => handleTabChange('weight_loss')}
            style={{
              ...styles.tab,
              ...(activeTab === 'weight_loss' ? styles.tabActive : {})
            }}
          >
            Weight Loss
          </button>
          <button
            onClick={() => handleTabChange('vitamin')}
            style={{
              ...styles.tab,
              ...(activeTab === 'vitamin' ? styles.tabActive : {})
            }}
          >
            Vitamin Injections
          </button>
        </div>

        {/* New Entry Form */}
        {showForm && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>
              New {activeTab === 'testosterone' ? 'Testosterone' : activeTab === 'weight_loss' ? 'Weight Loss' : 'Vitamin'} Log Entry
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                {/* Patient Selection */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Patient</label>
                  <select
                    value={formData.patient_id}
                    onChange={handlePatientSelect}
                    required
                    style={styles.select}
                  >
                    <option value="">Select patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date</label>
                  <input
                    type="date"
                    value={formData.logged_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, logged_at: e.target.value }))}
                    style={styles.input}
                  />
                </div>

                {/* Log Type - Testosterone only */}
                {activeTab === 'testosterone' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Entry Type</label>
                    <div style={styles.radioGroup}>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          name="log_type"
                          value="injection"
                          checked={formData.log_type === 'injection'}
                          onChange={(e) => setFormData(prev => ({ ...prev, log_type: e.target.value }))}
                        />
                        <span>Injection</span>
                      </label>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          name="log_type"
                          value="pickup"
                          checked={formData.log_type === 'pickup'}
                          onChange={(e) => setFormData(prev => ({ ...prev, log_type: e.target.value }))}
                        />
                        <span>Medication Pickup</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Testosterone Fields */}
                {activeTab === 'testosterone' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>HRT Type</label>
                      <select
                        value={formData.hrt_type}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          hrt_type: e.target.value,
                          medication: TESTOSTERONE_OPTIONS[e.target.value].medication,
                          dosage: ''
                        }))}
                        style={styles.select}
                      >
                        <option value="male">Male HRT (200mg/ml)</option>
                        <option value="female">Female HRT (100mg/ml)</option>
                      </select>
                    </div>

                    {formData.log_type === 'injection' ? (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Dosage</label>
                        <select
                          value={formData.dosage}
                          onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                          required
                          style={styles.select}
                        >
                          <option value="">Select dosage...</option>
                          {TESTOSTERONE_OPTIONS[formData.hrt_type].dosages.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                        {formData.dosage === 'custom' && (
                          <input
                            type="text"
                            placeholder="Enter custom dosage..."
                            value={formData.custom_dosage}
                            onChange={(e) => setFormData(prev => ({ ...prev, custom_dosage: e.target.value }))}
                            style={{ ...styles.input, marginTop: '8px' }}
                            required
                          />
                        )}
                      </div>
                    ) : (
                      <>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Pickup Type</label>
                          <select
                            value={formData.pickup_type}
                            onChange={(e) => setFormData(prev => ({ ...prev, pickup_type: e.target.value }))}
                            style={styles.select}
                          >
                            <option value="prefilled">Prefilled Syringes</option>
                            <option value="vial">Vial</option>
                          </select>
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Quantity</label>
                          <select
                            value={formData.quantity}
                            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                            style={styles.select}
                          >
                            {TESTOSTERONE_PICKUP_OPTIONS[formData.pickup_type].quantities.map(q => (
                              <option key={q} value={q}>{q} {formData.pickup_type === 'vial' ? (q === 1 ? 'vial' : 'vials') : 'syringes'}</option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Dosage per injection</label>
                          <select
                            value={formData.dosage}
                            onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                            required
                            style={styles.select}
                          >
                            <option value="">Select dosage...</option>
                            {TESTOSTERONE_OPTIONS[formData.hrt_type].dosages.map(d => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Weight Loss Fields */}
                {activeTab === 'weight_loss' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Medication</label>
                      <select
                        value={formData.medication}
                        onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value, dosage: '' }))}
                        required
                        style={styles.select}
                      >
                        <option value="">Select medication...</option>
                        {WEIGHT_LOSS_OPTIONS.medications.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    {formData.medication && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Dosage</label>
                        <select
                          value={formData.dosage}
                          onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                          required
                          style={styles.select}
                        >
                          <option value="">Select dosage...</option>
                          {WEIGHT_LOSS_OPTIONS.dosages[formData.medication]?.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Entry Type</label>
                      <div style={styles.radioGroup}>
                        <label style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="log_type"
                            value="injection"
                            checked={formData.log_type === 'injection'}
                            onChange={(e) => setFormData(prev => ({ ...prev, log_type: e.target.value }))}
                          />
                          <span>In-Clinic Injection</span>
                        </label>
                        <label style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="log_type"
                            value="pickup"
                            checked={formData.log_type === 'pickup'}
                            onChange={(e) => setFormData(prev => ({ ...prev, log_type: e.target.value }))}
                          />
                          <span>Take-Home Pickup</span>
                        </label>
                      </div>
                    </div>

                    {formData.log_type === 'pickup' && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Quantity (weeks supply)</label>
                        <select
                          value={formData.quantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                          style={styles.select}
                        >
                          <option value={1}>1 week</option>
                          <option value={2}>2 weeks</option>
                          <option value={4}>4 weeks (1 month)</option>
                          <option value={8}>8 weeks (2 months)</option>
                          <option value={12}>12 weeks (3 months)</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* Vitamin Injection Fields */}
                {activeTab === 'vitamin' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Injection Type</label>
                    <select
                      value={formData.medication}
                      onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                      required
                      style={styles.select}
                    >
                      <option value="">Select injection...</option>
                      {VITAMIN_INJECTION_OPTIONS.map(v => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notes - always visible */}
                <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>Notes (optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={2}
                    style={styles.textarea}
                  />
                </div>
              </div>

              <div style={styles.formActions}>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={styles.submitButton}
                >
                  {saving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Logs Table */}
        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={styles.empty}>
              No log entries found. Click "+ New Entry" to add one.
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Type</th>
                  {activeTab === 'testosterone' && <th style={styles.th}>HRT</th>}
                  <th style={styles.th}>Medication</th>
                  <th style={styles.th}>Dosage</th>
                  {(activeTab === 'testosterone' || activeTab === 'weight_loss') && (
                    <th style={styles.th}>Qty</th>
                  )}
                  <th style={styles.th}>Notes</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div>{formatDate(log.logged_at)}</div>
                      <div style={styles.timeText}>{formatTime(log.logged_at)}</div>
                    </td>
                    <td style={styles.td}>
                      <Link 
                        href={`/admin/protocol/${log.patient_id}`}
                        style={styles.patientLink}
                      >
                        {log.patient_name}
                      </Link>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: log.log_type === 'injection' ? '#111' : '#fff',
                        color: log.log_type === 'injection' ? '#fff' : '#111',
                        border: '1px solid #111'
                      }}>
                        {log.log_type === 'injection' ? 'Injection' : 'Pickup'}
                      </span>
                    </td>
                    {activeTab === 'testosterone' && (
                      <td style={styles.td}>
                        <span style={styles.hrtBadge}>
                          {log.hrt_type === 'female' ? 'Female' : 'Male'}
                        </span>
                      </td>
                    )}
                    <td style={styles.td}>{log.medication}</td>
                    <td style={styles.td}><strong>{log.dosage}</strong></td>
                    {(activeTab === 'testosterone' || activeTab === 'weight_loss') && (
                      <td style={styles.td}>
                        {log.log_type === 'pickup' && (
                          <>
                            {log.quantity} {activeTab === 'testosterone' 
                              ? (log.pickup_type === 'vial' ? 'vial(s)' : 'syringes')
                              : 'wk'}
                          </>
                        )}
                      </td>
                    )}
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

        {/* Stats Summary */}
        {!loading && filteredLogs.length > 0 && (
          <div style={styles.stats}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Entries:</span>
              <span style={styles.statValue}>{filteredLogs.length}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Injections:</span>
              <span style={styles.statValue}>
                {filteredLogs.filter(l => l.log_type === 'injection').length}
              </span>
            </div>
            {(activeTab === 'testosterone' || activeTab === 'weight_loss') && (
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Pickups:</span>
                <span style={styles.statValue}>
                  {filteredLogs.filter(l => l.log_type === 'pickup').length}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#111'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  backLink: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '14px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: 0
  },
  searchInput: {
    padding: '10px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    width: '200px',
    transition: 'all 0.15s'
  },
  addButton: {
    padding: '10px 20px',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  successBanner: {
    background: '#10b981',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontWeight: '500'
  },
  tabs: {
    display: 'flex',
    gap: '0',
    background: '#f3f4f6',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '24px'
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    background: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    transition: 'all 0.15s',
    flex: 1,
    textAlign: 'center'
  },
  tabActive: {
    background: '#111',
    color: '#fff'
  },
  formCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px'
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151'
  },
  input: {
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.15s'
  },
  select: {
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
    cursor: 'pointer'
  },
  textarea: {
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  radioGroup: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb'
  },
  cancelButton: {
    padding: '10px 20px',
    background: '#fff',
    color: '#111',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '10px 24px',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tableCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280'
  },
  empty: {
    padding: '60px 40px',
    textAlign: 'center',
    color: '#6b7280'
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
    color: '#374151'
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
    justifyContent: 'center',
    transition: 'all 0.15s'
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
