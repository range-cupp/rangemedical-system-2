// /pages/admin/protocol/[id].js
// Protocol Detail Page - Shows delivery method and proper tracking
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Injection medications list - SHARED CONFIG
const INJECTION_MEDICATIONS = [
  'NAD+',  // Custom dosage will be entered separately
  'B12',
  'Glutathione',
  'Vitamin D',
  'Biotin',
  'Lipo-C',
  'Skinny Shot',
  'Toradol'
];

// Weight Loss medications
const WEIGHT_LOSS_MEDICATIONS = [
  'Semaglutide',
  'Tirzepatide',
  'Retatrutide'
];

// Weight Loss dosages by medication
const WEIGHT_LOSS_DOSAGES = {
  'Semaglutide': ['0.25mg', '0.5mg', '1mg', '1.7mg', '2.4mg'],
  'Tirzepatide': ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'],
  'Retatrutide': ['1mg', '2mg', '4mg', '8mg', '12mg']
};

const FREQUENCY_OPTIONS = [
  { value: '2x daily', label: '2x Daily' },
  { value: 'daily', label: 'Daily' },
  { value: '5x/week', label: '5x/Week' },
  { value: '4x/week', label: '4x/Week' },
  { value: '3x/week', label: '3x/Week' },
  { value: 'every other day', label: 'Every Other Day' },
  { value: '2x/week', label: '2x/Week' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'every 5 days', label: 'Every 5 Days' },
  { value: 'as needed', label: 'As Needed' }
];

export default function ProtocolDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [protocol, setProtocol] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [logForm, setLogForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [weightForm, setWeightForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    weight: ''
  });

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendWeeks, setExtendWeeks] = useState(4);

  const [editForm, setEditForm] = useState({
    medication: '',
    medicationType: '',
    nadDose: '',
    wlMedication: '',
    wlDose: '',
    selected_dose: '',
    frequency: '',
    delivery_method: '',
    start_date: '',
    end_date: '',
    status: '',
    notes: '',
    sessions_used: 0,
    total_sessions: 0
  });

  useEffect(() => {
    if (id) fetchProtocol();
  }, [id]);

  const fetchProtocol = async () => {
    try {
      const res = await fetch(`/api/protocols/${id}`);
      if (!res.ok) throw new Error('Protocol not found');
      const data = await res.json();
      setProtocol(data.protocol || data);
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching protocol:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    const medication = protocol.medication || '';
    let medicationType = '';
    let nadDose = '';
    let wlMedication = '';
    let wlDose = '';
    
    // Check if weight loss medication
    const isWLMed = WEIGHT_LOSS_MEDICATIONS.some(m => medication.toLowerCase().includes(m.toLowerCase()));
    
    if (isWLMed) {
      // Parse weight loss medication and dose
      for (const med of WEIGHT_LOSS_MEDICATIONS) {
        if (medication.toLowerCase().includes(med.toLowerCase())) {
          wlMedication = med;
          // Extract dose (e.g., "Retatrutide 2mg" -> "2mg")
          const doseMatch = medication.match(/(\d+\.?\d*mg)/i);
          wlDose = doseMatch ? doseMatch[1] : '';
          break;
        }
      }
    } else if (medication.startsWith('NAD+')) {
      medicationType = 'NAD+';
      const doseMatch = medication.match(/NAD\+\s*(\d+)/);
      nadDose = doseMatch ? doseMatch[1] : '';
    } else if (medication) {
      medicationType = medication;
    }
    
    setEditForm({
      medication: medication,
      medicationType: medicationType,
      nadDose: nadDose,
      wlMedication: wlMedication,
      wlDose: wlDose,
      selected_dose: protocol.selected_dose || '',
      frequency: protocol.frequency || '',
      delivery_method: protocol.delivery_method || '',
      start_date: protocol.start_date ? protocol.start_date.split('T')[0] : '',
      end_date: protocol.end_date ? protocol.end_date.split('T')[0] : '',
      status: protocol.status || 'active',
      notes: protocol.notes || '',
      sessions_used: protocol.sessions_used || 0,
      total_sessions: protocol.total_sessions || 0
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/protocols/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        setShowEditModal(false);
        fetchProtocol();
      } else {
        alert('Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving protocol');
    } finally {
      setSaving(false);
    }
  };

  const handleLogSession = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/protocols/${id}/log-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logForm)
      });

      if (res.ok) {
        setShowLogModal(false);
        setLogForm({ log_date: new Date().toISOString().split('T')[0], notes: '' });
        fetchProtocol();
      } else {
        alert('Failed to log session');
      }
    } catch (error) {
      console.error('Error logging session:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogWeight = async () => {
    if (!weightForm.weight) {
      alert('Please enter a weight');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/protocols/${id}/log-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_date: weightForm.log_date,
          log_type: 'weigh_in',
          weight: parseFloat(weightForm.weight),
          notes: ''
        })
      });

      if (res.ok) {
        setShowWeightModal(false);
        setWeightForm({ log_date: new Date().toISOString().split('T')[0], weight: '' });
        fetchProtocol();
      } else {
        alert('Failed to log weight');
      }
    } catch (error) {
      console.error('Error logging weight:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExtend = async () => {
    setSaving(true);
    try {
      // Calculate new end date
      const currentEndDate = protocol.end_date ? new Date(protocol.end_date) : new Date();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + (extendWeeks * 7));
      
      const res = await fetch(`/api/protocols/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...protocol,
          end_date: newEndDate.toISOString().split('T')[0],
          status: 'active' // Reactivate if it was completed
        })
      });

      if (res.ok) {
        setShowExtendModal(false);
        setExtendWeeks(4);
        fetchProtocol();
      } else {
        alert('Failed to extend protocol');
      }
    } catch (error) {
      console.error('Error extending protocol:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this protocol? This will unlink any associated purchases.')) return;
    
    try {
      const res = await fetch(`/api/protocols/${id}/delete`, { method: 'DELETE' });
      if (res.ok) {
        // Redirect back to pipeline
        router.push('/admin/pipeline?tab=active');
      } else {
        const error = await res.json();
        alert('Error deleting protocol: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting protocol:', error);
      alert('Error deleting protocol');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!logId) return;
    if (!confirm('Delete this session log entry?')) return;
    
    try {
      const res = await fetch(`/api/protocols/${id}/logs/${logId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProtocol(); // Refresh data
      } else {
        const error = await res.json();
        alert('Error deleting log: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting log:', error);
      alert('Error deleting log');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // If it's a date-only string (YYYY-MM-DD), add time to prevent timezone shift
    let dateToFormat = dateStr;
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateToFormat = dateStr + 'T12:00:00';
    }
    return new Date(dateToFormat).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  // Determine tracking type
  const isSessionBased = protocol?.total_sessions > 0;
  
  // Check if this is a weight loss protocol
  const isWeightLoss = protocol?.program_type === 'weight_loss' || 
    (protocol?.program_name || '').toLowerCase().includes('weight loss');
  
  // Get delivery method - check field first, then parse from program_name
  const getDeliveryMethod = () => {
    if (protocol?.delivery_method === 'take_home') return 'take_home';
    if (protocol?.delivery_method === 'in_clinic') return 'in_clinic';
    
    // Parse from program_name
    const programName = (protocol?.program_name || '').toLowerCase();
    if (programName.includes('take home')) return 'take_home';
    if (programName.includes('in clinic') || programName.includes('in-clinic')) return 'in_clinic';
    
    return null;
  };
  
  const deliveryMethodValue = getDeliveryMethod();
  const isTakeHome = deliveryMethodValue === 'take_home';
  const isInClinic = deliveryMethodValue === 'in_clinic';
  
  // Get display title
  const getDisplayTitle = () => {
    if (!protocol) return '';
    const medication = protocol.medication || '';
    const programName = protocol.program_name || '';
    
    // If medication exists, use it as primary title
    if (medication) return medication;
    return programName;
  };

  // Get delivery method display
  const getDeliveryDisplay = () => {
    if (isTakeHome) return 'Take Home';
    if (isInClinic) return 'In Clinic';
    return '';
  };

  // Calculate tracking stats
  const getTrackingStats = () => {
    // Determine label based on category/program_type
    const category = (protocol.category || protocol.program_type || '').toLowerCase();
    const isInjectionCategory = category === 'injection';
    const isRLT = category === 'red_light' || category === 'rlt';
    const isHBOT = category === 'hbot';
    
    // Use "Injections" for injection category, "Sessions" for RLT/HBOT
    const inClinicLabel = isInjectionCategory ? 'Injections' : 'Sessions';
    const logButtonText = isInjectionCategory ? '+ Log Injection' : '+ Log Session';
    
    if (isSessionBased && isInClinic) {
      // In Clinic: Track sessions/injections
      const used = protocol.sessions_used || 0;
      const total = protocol.total_sessions || 0;
      const left = total - used;
      return {
        type: 'sessions',
        used,
        total,
        left,
        label: inClinicLabel,
        logButtonText
      };
    } else if (isSessionBased && isTakeHome) {
      // Take Home: Calculate refill date based on frequency
      const total = protocol.total_sessions || 12;
      const freq = (protocol.frequency || '').toLowerCase();
      
      // Calculate injections per week based on frequency
      let injectionsPerWeek = 7; // default to daily
      
      if (freq.includes('daily') && !freq.includes('2x')) {
        injectionsPerWeek = 7;
      } else if (freq.includes('2x daily') || freq.includes('twice daily')) {
        injectionsPerWeek = 14;
      } else if (freq.includes('every other day') || freq.includes('every 2 days')) {
        injectionsPerWeek = 3.5;
      } else if (freq.includes('every 3 days')) {
        injectionsPerWeek = 7 / 3; // ~2.33
      } else if (freq.includes('every 5 days')) {
        injectionsPerWeek = 7 / 5; // 1.4
      } else if (freq.includes('weekly') || freq.includes('once a week') || freq.includes('1x/week') || freq.includes('1x week')) {
        injectionsPerWeek = 1;
      } else if (freq.includes('2x/week') || freq.includes('2x week') || freq.includes('twice a week') || freq.includes('2x weekly')) {
        injectionsPerWeek = 2;
      } else if (freq.includes('3x/week') || freq.includes('3x week') || freq.includes('3x weekly')) {
        injectionsPerWeek = 3;
      } else if (freq.includes('4x/week') || freq.includes('4x week')) {
        injectionsPerWeek = 4;
      } else if (freq.includes('5x/week') || freq.includes('5x week')) {
        injectionsPerWeek = 5;
      }
      
      // Calculate total weeks of supply, then convert to days
      const weeksOfSupply = total / injectionsPerWeek;
      const supplyDays = Math.round(weeksOfSupply * 7);
      
      // Calculate refill date
      const startDate = protocol.start_date ? new Date(protocol.start_date + 'T00:00:00') : new Date();
      const refillDate = new Date(startDate);
      refillDate.setDate(refillDate.getDate() + supplyDays);
      
      // Days until refill
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntilRefill = Math.ceil((refillDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        type: 'refill',
        total,
        supplyDays,
        weeksOfSupply: Math.round(weeksOfSupply * 10) / 10, // Round to 1 decimal
        refillDate,
        daysUntilRefill,
        frequency: protocol.frequency,
        label: 'Injections'
      };
    } else {
      // Time-based tracking
      const start = protocol.start_date ? new Date(protocol.start_date) : null;
      const end = protocol.end_date ? new Date(protocol.end_date) : null;
      const today = new Date();
      
      if (start && end) {
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));
        
        return {
          type: 'days',
          used: Math.min(daysElapsed, totalDays),
          total: totalDays,
          left: daysLeft,
          label: 'Days'
        };
      }
      
      return null;
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading protocol...</div>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Protocol not found</div>
      </div>
    );
  }

  const stats = getTrackingStats();
  const deliveryMethod = getDeliveryDisplay();

  return (
    <>
      <Head>
        <title>{getDisplayTitle()} | Range Medical</title>
      </Head>

      <div style={styles.container}>
        {/* Back Link */}
        <Link href={protocol.patient_id ? `/admin/patient/${protocol.patient_id}` : '/admin/pipeline?tab=active'} style={styles.backLink}>
          ← Back to Patient
        </Link>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{getDisplayTitle()}</h1>
            <div style={styles.subtitle}>
              {protocol.patient_name || 'Unknown Patient'}
              {protocol.frequency && ` • ${protocol.frequency}`}
              {deliveryMethod && ` • ${deliveryMethod}`}
            </div>
          </div>
          <div style={styles.headerActions}>
            <button onClick={openEditModal} style={styles.editButton}>Edit</button>
            {(isWeightLoss || protocol.end_date) && (
              <button 
                onClick={() => setShowExtendModal(true)} 
                style={{...styles.editButton, backgroundColor: '#059669', marginLeft: '8px'}}
              >
                Extend
              </button>
            )}
            <button onClick={handleDelete} style={styles.deleteButton}>Delete</button>
            <span style={{
              ...styles.statusBadge,
              backgroundColor: protocol.status === 'active' ? '#dcfce7' : '#e5e7eb',
              color: protocol.status === 'active' ? '#166534' : '#374151'
            }}>
              {protocol.status === 'active' ? 'Active' : protocol.status}
            </span>
          </div>
        </div>

        {/* Tracking Stats */}
        {stats && stats.type === 'sessions' && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.used}</div>
              <div style={styles.statLabel}>{stats.label} Used</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.left}</div>
              <div style={styles.statLabel}>{stats.label} Left</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{formatDate(protocol.start_date)}</div>
              <div style={styles.statLabel}>Started</div>
            </div>
          </div>
        )}

        {stats && stats.type === 'refill' && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.total}</div>
              <div style={styles.statLabel}>Injections</div>
            </div>
            <div style={styles.statCard}>
              <div style={{
                ...styles.statValue,
                color: stats.daysUntilRefill <= 7 ? '#dc2626' : stats.daysUntilRefill <= 14 ? '#f59e0b' : '#111'
              }}>
                {stats.daysUntilRefill > 0 ? stats.daysUntilRefill : 0}
              </div>
              <div style={styles.statLabel}>Days Until Refill</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{formatDate(stats.refillDate)}</div>
              <div style={styles.statLabel}>Refill Due</div>
            </div>
          </div>
        )}

        {stats && stats.type === 'days' && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.used}</div>
              <div style={styles.statLabel}>Days Elapsed</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.left}</div>
              <div style={styles.statLabel}>Days Left</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{formatDate(protocol.start_date)}</div>
              <div style={styles.statLabel}>Started</div>
            </div>
          </div>
        )}

        {/* Log Button - Only for In Clinic */}
        {isSessionBased && isInClinic && protocol.status === 'active' && (
          <button onClick={() => setShowLogModal(true)} style={styles.logButton}>
            {stats?.logButtonText || '+ Log Session'}
          </button>
        )}

        {/* Weight Log Button - For Weight Loss protocols */}
        {isWeightLoss && protocol.status === 'active' && (
          <button onClick={() => setShowWeightModal(true)} style={{...styles.logButton, backgroundColor: '#059669'}}>
            + Log Weight
          </button>
        )}

        {/* Weight History Section - For Weight Loss */}
        {isWeightLoss && (() => {
          const weightLogs = logs.filter(log => log.log_type === 'weigh_in');
          
          return (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Weight History</h2>
              {weightLogs.length === 0 ? (
                <div style={styles.emptyState}>
                  No weight logs yet
                </div>
              ) : (
                <div style={styles.logsList}>
                  {weightLogs.map((log, i) => (
                    <div key={log.id || i} style={styles.logItem}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.logDate}>{formatDate(log.log_date || log.created_at)}</div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>
                          {log.weight} lbs
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        style={styles.deleteLogButton}
                        title="Delete this entry"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* History Section - Only for In Clinic */}
        {isInClinic && (() => {
          // Filter to only show injection/session logs, not weigh_ins
          const sessionLogs = logs.filter(log => 
            log.log_type === 'injection' || log.log_type === 'session' || !log.log_type
          );
          
          return (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>{stats?.label || 'Session'} History</h2>
              {sessionLogs.length === 0 ? (
                <div style={styles.emptyState}>
                  No {(stats?.label || 'sessions').toLowerCase()} logged yet
                </div>
              ) : (
                <div style={styles.logsList}>
                  {sessionLogs.map((log, i) => (
                    <div key={log.id || i} style={styles.logItem}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.logDate}>{formatDate(log.log_date || log.created_at)}</div>
                        {log.notes && <div style={styles.logNotes}>{log.notes}</div>}
                      </div>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        style={styles.deleteLogButton}
                        title="Delete this entry"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Take Home Info */}
        {isTakeHome && stats?.type === 'refill' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Supply Info</h2>
            <div style={styles.detailsCard}>
              <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong>{stats.total} injections</strong> at <strong>{stats.frequency}</strong> = <strong>~{stats.weeksOfSupply} weeks</strong> ({stats.supplyDays} days)
                </p>
                {stats.daysUntilRefill <= 7 && stats.daysUntilRefill > 0 && (
                  <p style={{ margin: 0, color: '#dc2626', fontWeight: '500' }}>
                    ⚠️ Refill needed soon - only {stats.daysUntilRefill} days left
                  </p>
                )}
                {stats.daysUntilRefill <= 0 && (
                  <p style={{ margin: 0, color: '#dc2626', fontWeight: '500' }}>
                    ⚠️ Supply has run out - refill overdue
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Protocol Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Protocol Details</h2>
          <div style={styles.detailsCard}>
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>PROGRAM</div>
                <div style={styles.detailValue}>{protocol.program_name || '-'}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>MEDICATION</div>
                <div style={styles.detailValue}>{protocol.medication || '-'}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>FREQUENCY</div>
                <div style={styles.detailValue}>{protocol.frequency || '-'}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>DELIVERY</div>
                <div style={styles.detailValue}>{deliveryMethod || '-'}</div>
              </div>
              {protocol.selected_dose && (
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>DOSE</div>
                  <div style={styles.detailValue}>{protocol.selected_dose}</div>
                </div>
              )}
              {protocol.notes && (
                <div style={{ ...styles.detailItem, gridColumn: '1 / -1' }}>
                  <div style={styles.detailLabel}>NOTES</div>
                  <div style={styles.detailValue}>{protocol.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Log Modal - Only for In Clinic */}
        {showLogModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>
                {stats?.label === 'Injections' ? 'Log Injection' : 'Log Session'}
              </h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  style={styles.input}
                  value={logForm.log_date}
                  onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes (optional)</label>
                <textarea
                  style={styles.textarea}
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  placeholder="Any notes..."
                />
              </div>

              <div style={styles.modalActions}>
                <button onClick={() => setShowLogModal(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleLogSession} style={styles.submitButton} disabled={saving}>
                  {saving ? 'Logging...' : 'Log'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Weight Log Modal - For Weight Loss */}
        {showWeightModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>Log Weight</h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  style={styles.input}
                  value={weightForm.log_date}
                  onChange={(e) => setWeightForm({ ...weightForm, log_date: e.target.value })}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  style={styles.input}
                  value={weightForm.weight}
                  onChange={(e) => setWeightForm({ ...weightForm, weight: e.target.value })}
                  placeholder="e.g., 185.5"
                />
              </div>

              <div style={styles.modalActions}>
                <button onClick={() => setShowWeightModal(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleLogWeight} style={{...styles.submitButton, backgroundColor: '#059669'}} disabled={saving}>
                  {saving ? 'Logging...' : 'Log Weight'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Extend Protocol Modal */}
        {showExtendModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>Extend Protocol</h2>
              
              <div style={{ marginBottom: '16px', color: '#666' }}>
                Current end date: <strong>{formatDate(protocol.end_date) || 'Not set'}</strong>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Extend by</label>
                <select
                  style={styles.select}
                  value={extendWeeks}
                  onChange={(e) => setExtendWeeks(parseInt(e.target.value))}
                >
                  <option value={1}>1 week</option>
                  <option value={2}>2 weeks</option>
                  <option value={4}>4 weeks (1 month)</option>
                  <option value={8}>8 weeks (2 months)</option>
                  <option value={12}>12 weeks (3 months)</option>
                  <option value={24}>24 weeks (6 months)</option>
                </select>
              </div>

              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                New end date: <strong style={{ color: '#059669' }}>
                  {(() => {
                    const currentEndDate = protocol.end_date ? new Date(protocol.end_date) : new Date();
                    const newEndDate = new Date(currentEndDate);
                    newEndDate.setDate(newEndDate.getDate() + (extendWeeks * 7));
                    return formatDate(newEndDate.toISOString());
                  })()}
                </strong>
              </div>

              <div style={styles.modalActions}>
                <button onClick={() => setShowExtendModal(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleExtend} style={{...styles.submitButton, backgroundColor: '#059669'}} disabled={saving}>
                  {saving ? 'Extending...' : 'Extend Protocol'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Protocol Modal */}
        {showEditModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>Edit Protocol</h2>

              {/* Weight Loss Medication Fields */}
              {isWeightLoss ? (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Medication</label>
                    <select
                      style={styles.select}
                      value={editForm.wlMedication || ''}
                      onChange={(e) => {
                        const med = e.target.value;
                        setEditForm({ 
                          ...editForm, 
                          wlMedication: med, 
                          wlDose: '',
                          medication: med 
                        });
                      }}
                    >
                      <option value="">Select medication...</option>
                      {WEIGHT_LOSS_MEDICATIONS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {editForm.wlMedication && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Dosage</label>
                      <select
                        style={styles.select}
                        value={editForm.wlDose || ''}
                        onChange={(e) => {
                          const dose = e.target.value;
                          setEditForm({ 
                            ...editForm, 
                            wlDose: dose,
                            medication: `${editForm.wlMedication} ${dose}`,
                            selected_dose: dose
                          });
                        }}
                      >
                        <option value="">Select dosage...</option>
                        {(WEIGHT_LOSS_DOSAGES[editForm.wlMedication] || []).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Injection Medication Fields */}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Medication</label>
                    <select
                      style={styles.select}
                      value={editForm.medicationType || (editForm.medication?.startsWith('NAD+') ? 'NAD+' : editForm.medication) || ''}
                      onChange={(e) => {
                        const medType = e.target.value;
                        if (medType === 'NAD+') {
                          setEditForm({ ...editForm, medicationType: medType, medication: '', nadDose: '' });
                        } else {
                          setEditForm({ ...editForm, medicationType: medType, medication: medType, nadDose: '' });
                        }
                      }}
                    >
                      <option value="">Select medication...</option>
                      {INJECTION_MEDICATIONS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {(editForm.medicationType === 'NAD+' || editForm.medication?.startsWith('NAD+')) && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>NAD+ Dosage (mg)</label>
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="e.g., 50, 100, 200"
                        value={editForm.nadDose || (editForm.medication?.match(/NAD\+\s*(\d+)/)?.[1] || '')}
                        onChange={(e) => {
                          const dose = e.target.value;
                          setEditForm({ 
                            ...editForm, 
                            nadDose: dose,
                            medication: dose ? `NAD+ ${dose}mg` : 'NAD+'
                          });
                        }}
                      />
                    </div>
                  )}
                </>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Frequency</label>
                <select
                  style={styles.select}
                  value={editForm.frequency}
                  onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                >
                  <option value="">Select frequency...</option>
                  {FREQUENCY_OPTIONS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Delivery Method</label>
                <select
                  style={styles.select}
                  value={editForm.delivery_method}
                  onChange={(e) => setEditForm({ ...editForm, delivery_method: e.target.value })}
                >
                  <option value="">Select delivery...</option>
                  <option value="in_clinic">In Clinic</option>
                  <option value="take_home">Take Home</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>End Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                  />
                </div>
              </div>

              {isSessionBased && (
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Sessions Used</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={editForm.sessions_used}
                      onChange={(e) => setEditForm({ ...editForm, sessions_used: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Total Sessions</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={editForm.total_sessions}
                      onChange={(e) => setEditForm({ ...editForm, total_sessions: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.select}
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  style={styles.textarea}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Any notes..."
                />
              </div>

              <div style={styles.modalActions}>
                <button onClick={() => setShowEditModal(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleEditSubmit} style={styles.submitButton} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center',
    padding: '60px',
    color: '#dc2626',
  },
  backLink: {
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: '14px',
    display: 'inline-block',
    marginBottom: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#111',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: '#111',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    padding: '24px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#111',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  logButton: {
    padding: '12px 24px',
    backgroundColor: '#111',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '32px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#111',
  },
  emptyState: {
    padding: '40px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    textAlign: 'center',
    color: '#6b7280',
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  logItem: {
    padding: '12px 16px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logDate: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#111',
  },
  logNotes: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '4px',
  },
  deleteLogButton: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '1px solid #fecaca',
    backgroundColor: 'white',
    color: '#dc2626',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailsCard: {
    padding: '24px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  detailItem: {},
  detailLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '14px',
    color: '#111',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '24px',
    color: '#111',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#111',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
};
