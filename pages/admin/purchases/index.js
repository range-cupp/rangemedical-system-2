// /pages/admin/purchases/index.js
// Purchases - Clean UI with Protocol Creation
// Range Medical

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import { PROTOCOL_TYPES, CATEGORY_TO_TYPE, getDBProgramType } from '../../../lib/protocol-types';
import { MEMBERSHIP_FREQUENCY_OPTIONS } from '../../../lib/protocol-config';

// Classify purchase into action type: 'protocol' | 'session' | 'product'
function getPurchaseActionType(purchase) {
  const cat = (purchase.category || '').toLowerCase();
  const item = (purchase.item_name || '').toLowerCase();

  // Always protocol: peptide, hrt, weight_loss
  if (['peptide', 'hrt', 'weight_loss'].includes(cat)) return 'protocol';

  // Always protocol: combo memberships, injection packs by category
  if (cat === 'combo_membership' || cat === 'injection_pack') return 'protocol';

  // Product categories: no tracking needed
  if (['other', 'custom', 'assessment', 'programs'].includes(cat)) return 'product';

  // Session-based categories: pack vs single
  const isPackOrMulti = (
    item.includes('pack') ||
    item.includes('membership') ||
    /\d+[\s-]?session/i.test(item) ||
    /\d+[\s-]?pack/i.test(item) ||
    /x\d{2,}/i.test(item) ||                  // "x12", "x6", etc.
    /\d+[\s-]?x[\s-]?\d+/i.test(item) ||      // "100mg x 12" pattern
    (purchase.quantity && purchase.quantity > 1) // quantity > 1 means multi-pack
  );
  if (isPackOrMulti) return 'protocol';

  // Remaining service categories are single sessions
  if (['hbot', 'red_light', 'iv_therapy', 'specialty_iv',
       'injection_standard', 'injection_premium', 'nad_injection', 'injection'].includes(cat)) {
    return 'session';
  }

  // Fallback: protocol (safe default)
  return 'protocol';
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [createModal, setCreateModal] = useState(null);
  const [addToExistingModal, setAddToExistingModal] = useState(null);
  const [logSessionModal, setLogSessionModal] = useState(null);
  const [editingShipping, setEditingShipping] = useState(null);
  const [shippingValue, setShippingValue] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/admin/purchases');
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveShipping = async (purchaseId) => {
    const val = parseFloat(shippingValue) || 0;
    try {
      const res = await fetch('/api/purchases/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: purchaseId, shipping: val })
      });
      if (res.ok) {
        setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, shipping: val } : p));
      }
    } catch (err) {
      console.error('Error saving shipping:', err);
    }
    setEditingShipping(null);
  };

  // Filter purchases
  const filtered = purchases.filter(p => {
    // Status filter
    if (filter === 'unassigned' && p.protocol_id) return false;
    if (filter === 'assigned' && !p.protocol_id) return false;
    
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      return (
        (p.patient_name || '').toLowerCase().includes(s) ||
        (p.item_name || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Sort by date (newest first)
  const sorted = [...filtered].sort((a, b) => 
    new Date(b.payment_date || b.purchase_date || b.created_at || 0) - new Date(a.payment_date || a.purchase_date || a.created_at || 0)
  );

  const unassignedCount = purchases.filter(p => !p.protocol_id && !p.session_logged && getPurchaseActionType(p) !== 'product').length;
  const totalCount = purchases.length;
  const totalRevenue = purchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <AdminLayout title={`Purchases`}>
      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '-12px', marginBottom: '20px' }}>
        {totalCount} purchases · ${totalRevenue.toLocaleString()}
      </p>
          {/* Toolbar */}
          <div style={styles.toolbar}>
            <input
              type="text"
              placeholder="Search by patient or item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <div style={styles.filterGroup}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  ...styles.filterBtn,
                  background: filter === 'all' ? '#000' : '#fff',
                  color: filter === 'all' ? '#fff' : '#000'
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unassigned')}
                style={{
                  ...styles.filterBtn,
                  background: filter === 'unassigned' ? '#000' : '#fff',
                  color: filter === 'unassigned' ? '#fff' : '#000'
                }}
              >
                Unassigned
              </button>
              <button
                onClick={() => setFilter('assigned')}
                style={{
                  ...styles.filterBtn,
                  background: filter === 'assigned' ? '#000' : '#fff',
                  color: filter === 'assigned' ? '#fff' : '#000'
                }}
              >
                Assigned
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={styles.tableCard}>
            {loading ? (
              <div style={styles.loading}>Loading purchases...</div>
            ) : sorted.length === 0 ? (
              <div style={styles.empty}>No purchases found</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Shipping</th>
                    <th style={styles.th}>Protocol</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(purchase => (
                    <tr key={purchase.id} style={styles.tr}>
                      <td style={styles.td}>
                        {(purchase.payment_date || purchase.purchase_date) ? new Date(purchase.payment_date || purchase.purchase_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : '—'}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.patientName}>{purchase.patient_name || 'Unknown'}</div>
                      </td>
                      <td style={styles.td}>{purchase.item_name}</td>
                      <td style={styles.td}>
                        <span style={styles.categoryBadge}>{purchase.category || '—'}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.amount}>${purchase.amount}</span>
                      </td>
                      <td style={styles.td}>
                        {editingShipping === purchase.id ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={shippingValue}
                            onChange={e => setShippingValue(e.target.value)}
                            onBlur={() => saveShipping(purchase.id)}
                            onKeyDown={e => { if (e.key === 'Enter') saveShipping(purchase.id); if (e.key === 'Escape') setEditingShipping(null); }}
                            autoFocus
                            style={{ width: '70px', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', textAlign: 'right' }}
                          />
                        ) : (
                          <span
                            onClick={() => { setEditingShipping(purchase.id); setShippingValue(purchase.shipping || 0); }}
                            style={{ cursor: 'pointer', color: parseFloat(purchase.shipping) > 0 ? '#111827' : '#9ca3af', fontSize: '13px' }}
                            title="Click to edit shipping"
                          >
                            ${parseFloat(purchase.shipping || 0).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {purchase.protocol_id ? (
                          <Link href={`/admin/protocols/${purchase.protocol_id}`} style={styles.protocolLink}>
                            View Protocol →
                          </Link>
                        ) : purchase.session_logged ? (
                          <span style={styles.sessionLoggedBadge}>✓ Logged</span>
                        ) : (() => {
                          const actionType = getPurchaseActionType(purchase);
                          const cat = (purchase.category || '').toLowerCase();
                          if (actionType === 'protocol') {
                            return (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => setCreateModal(purchase)} style={styles.createBtn}>
                                  + Create
                                </button>
                                {cat !== 'peptide' && (
                                  <button onClick={() => setAddToExistingModal(purchase)} style={styles.addToExistingBtn}>
                                    + Add to Existing
                                  </button>
                                )}
                              </div>
                            );
                          }
                          if (actionType === 'session') {
                            return (
                              <button onClick={() => setLogSessionModal(purchase)} style={styles.logSessionBtn}>
                                Log Session
                              </button>
                            );
                          }
                          // product
                          return <span style={styles.saleBadge}>Sale</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

      {/* Create Protocol Modal */}
      {createModal && (
        <CreateProtocolModal
          purchase={createModal}
          onClose={() => setCreateModal(null)}
          onSuccess={() => {
            setCreateModal(null);
            fetchPurchases();
          }}
        />
      )}

      {/* Add to Existing Protocol Modal */}
      {addToExistingModal && (
        <AddToExistingModal
          purchase={addToExistingModal}
          onClose={() => setAddToExistingModal(null)}
          onSuccess={() => {
            setAddToExistingModal(null);
            fetchPurchases();
          }}
        />
      )}

      {/* Log Session Modal */}
      {logSessionModal && (
        <LogSessionModal
          purchase={logSessionModal}
          onClose={() => setLogSessionModal(null)}
          onSuccess={() => {
            setLogSessionModal(null);
            fetchPurchases();
          }}
        />
      )}
    </AdminLayout>
  );
}

// Create Protocol Modal Component
function CreateProtocolModal({ purchase, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [existingProtocolId, setExistingProtocolId] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [cycleInfo, setCycleInfo] = useState(null);

  // Auto-detect purchase type
  const purchaseItemLower = (purchase?.item_name || '').toLowerCase();
  const purchaseCat = (purchase?.category || '').toLowerCase();
  const isLabPurchase = purchaseCat === 'labs' || purchaseItemLower.includes('lab panel');

  // Auto-detect membership types from purchase name
  const detectInitialType = () => {
    if (isLabPurchase) return 'lab_panel';
    if (purchaseItemLower.includes('cellular reset') || purchaseItemLower.includes('six-week') || purchaseItemLower.includes('six week')) return 'cellular_reset';
    if (purchaseItemLower.includes('combo') && (purchaseItemLower.includes('membership') || purchaseItemLower.includes('hyperbaric') || purchaseItemLower.includes('red light'))) return 'combo_membership';
    if ((purchaseItemLower.includes('hyperbaric') || purchaseItemLower.includes('hbot')) && purchaseItemLower.includes('membership')) return 'hbot_membership';
    if ((purchaseItemLower.includes('red light') || purchaseItemLower.includes('rlt')) && purchaseItemLower.includes('membership')) return 'rlt_membership';
    if (purchaseCat === 'combo_membership') return 'combo_membership';
    // Peptide vials: detect from item name or category
    if (purchaseItemLower.includes('vial') || purchaseCat === 'vials') return 'peptide_vial';
    // HRT: distinguish male vs female from purchase name
    if (purchaseCat === 'hrt' || purchaseItemLower.includes('hrt') || purchaseItemLower.includes('testosterone')) {
      if (purchaseItemLower.includes('female')) return 'hrt_female';
      return 'hrt_male';
    }
    return CATEGORY_TO_TYPE[purchase?.category] || 'peptide';
  };
  const initialType = detectInitialType();

  // Auto-detect membership frequency from purchase name
  const detectFrequency = () => {
    if (purchaseItemLower.includes('3x')) return '3x_week';
    if (purchaseItemLower.includes('2x')) return '2x_week';
    return '1x_week';
  };

  // Handle both object {value, label} and plain number formats for injections
  const getInitialInjections = () => {
    const firstInjection = PROTOCOL_TYPES[initialType]?.injections?.[0];
    return typeof firstInjection === 'object' ? firstInjection.value : (firstInjection || 4);
  };

  // Auto-detect medication from vial purchase name
  const detectVialMedication = () => {
    if (!purchaseItemLower.includes('vial')) return '';
    if (purchaseItemLower.includes('nad')) return 'NAD+ 1000mg';
    if (purchaseItemLower.includes('bpc') || purchaseItemLower.includes('tb4') || purchaseItemLower.includes('thymosin')) return 'BPC-157 / Thymosin Beta-4';
    if (purchaseItemLower.includes('mots')) return 'MOTS-c';
    if (purchaseItemLower.includes('tesamorelin')) return 'Tesamorelin / Ipamorelin';
    if (purchaseItemLower.includes('cjc')) return 'CJC-1295 / Ipamorelin';
    if (purchaseItemLower.includes('aod')) return 'AOD-9604';
    if (purchaseItemLower.includes('glow')) return 'GLOW (GHK-Cu / Thymosin Beta-4)';
    return '';
  };

  const [form, setForm] = useState({
    protocolType: initialType,
    medication: initialType === 'peptide_vial' ? detectVialMedication() : '',
    dosage: '',
    dosageNotes: '',
    frequency: PROTOCOL_TYPES[initialType]?.frequencies?.[0]?.value || 'daily',
    deliveryMethod: PROTOCOL_TYPES[initialType]?.deliveryMethods?.[0]?.value || 'take_home',
    startDate: new Date().toISOString().split('T')[0],
    duration: PROTOCOL_TYPES[initialType]?.durations?.[0]?.value || 10,
    totalSessions: PROTOCOL_TYPES[initialType]?.sessions?.[0] || 1,
    totalInjections: getInitialInjections(),
    numVials: 1,
    dosesPerVial: 10,
    notes: ''
  });

  // Lab pipeline options
  const autoDetectPanel = purchaseItemLower.includes('elite') ? 'elite' : 'essential';
  const [labPanelType, setLabPanelType] = useState(autoDetectPanel);
  const [labType, setLabType] = useState('new_patient');
  const isLabMode = form.protocolType === 'lab_panel';

  // Membership options
  const [membershipFrequency, setMembershipFrequency] = useState(detectFrequency());
  const isComboMode = form.protocolType === 'combo_membership';
  const isCellularReset = form.protocolType === 'cellular_reset';
  const isHbotMembership = form.protocolType === 'hbot_membership';
  const isRltMembership = form.protocolType === 'rlt_membership';
  const isMembershipMode = isComboMode || isCellularReset || isHbotMembership || isRltMembership;

  // Get session counts from frequency
  const selectedFreq = MEMBERSHIP_FREQUENCY_OPTIONS.find(f => f.value === membershipFrequency) || MEMBERSHIP_FREQUENCY_OPTIONS[0];

  // Look up patient from patients table (single source of truth)
  useEffect(() => {
    async function lookupPatient() {
      setPatientLoading(true);
      try {
        // Try by ghl_contact_id first, then by name
        let found = null;
        if (purchase?.ghl_contact_id) {
          const res = await fetch(`/api/admin/patients?search=${encodeURIComponent(purchase.ghl_contact_id)}&limit=1`);
          if (res.ok) {
            const data = await res.json();
            const patients = data.patients || data || [];
            found = patients.find(p => p.ghl_contact_id === purchase.ghl_contact_id);
          }
        }
        if (!found && purchase?.patient_name) {
          const res = await fetch(`/api/admin/patients?search=${encodeURIComponent(purchase.patient_name)}&limit=5`);
          if (res.ok) {
            const data = await res.json();
            const patients = data.patients || data || [];
            // Match by name
            const purchaseName = (purchase.patient_name || '').toLowerCase().trim();
            found = patients.find(p => {
              const fullName = (p.first_name && p.last_name)
                ? `${p.first_name} ${p.last_name}`.toLowerCase()
                : (p.name || '').toLowerCase();
              return fullName === purchaseName;
            }) || patients[0];
          }
        }
        setPatient(found || null);
      } catch (err) {
        console.error('Patient lookup error:', err);
      } finally {
        setPatientLoading(false);
      }
    }
    lookupPatient();
  }, [purchase]);

  // Fetch 90-day cycle info for recovery/GH peptide protocols
  useEffect(() => {
    if (!patient?.id) return;
    const isPeptideType = form.protocolType === 'peptide' || form.protocolType === 'gh_peptide' || form.protocolType === 'peptide_vial';
    if (!isPeptideType) { setCycleInfo(null); return; }
    const cycleType = form.protocolType === 'gh_peptide' ? 'gh' : 'recovery';
    fetch(`/api/protocols/cycle-info?patientId=${patient.id}&cycleType=${cycleType}`)
      .then(r => r.json())
      .then(data => { if (data.success) setCycleInfo(data); else setCycleInfo(null); })
      .catch(() => setCycleInfo(null));
  }, [patient?.id, form.protocolType]);

  const selectedType = PROTOCOL_TYPES[form.protocolType];
  const isSessionBased = !!selectedType?.sessions;
  const isInjectionBased = !!selectedType?.injections;
  const isOngoing = selectedType?.ongoing;
  const hasDosageNotes = selectedType?.hasDosageNotes;
  const isVialBased = !!selectedType?.vialBased;

  // Calculate if this new protocol would exceed the 90-day cycle limit
  const cycleWarning = (() => {
    if (!cycleInfo?.hasCycle) return null;
    const newDuration = parseInt(form.duration) || 0;
    const wouldTotal = cycleInfo.cycleDaysUsed + newDuration;
    if (cycleInfo.cycleExhausted) {
      return { level: 'error', message: `Patient has already used ${cycleInfo.cycleDaysUsed}/${cycleInfo.maxDays} days in current cycle. A ${cycleInfo.offDays}-day off period is recommended${cycleInfo.offPeriodEnds ? ` (ends ${new Date(cycleInfo.offPeriodEnds + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})` : ''}.` };
    }
    if (wouldTotal > cycleInfo.maxDays) {
      return { level: 'warning', message: `Adding ${newDuration} days would bring this patient to ${wouldTotal}/${cycleInfo.maxDays} days — exceeds the 90-day cycle limit. ${cycleInfo.daysRemaining} days remaining.` };
    }
    if (cycleInfo.daysRemaining <= 20) {
      return { level: 'info', message: `Patient has used ${cycleInfo.cycleDaysUsed}/${cycleInfo.maxDays} days. ${cycleInfo.daysRemaining} days remaining in cycle.` };
    }
    return { level: 'ok', message: `${cycleInfo.cycleDaysUsed}/${cycleInfo.maxDays} cycle days used. ${cycleInfo.daysRemaining} remaining.` };
  })();

  const handleTypeChange = (type) => {
    const typeConfig = PROTOCOL_TYPES[type];
    // Handle both object {value, label} and plain number formats for injections
    const firstInjection = typeConfig?.injections?.[0];
    const injectionValue = typeof firstInjection === 'object' ? firstInjection.value : firstInjection;

    setForm(prev => ({
      ...prev,
      protocolType: type,
      medication: '',
      dosage: '',
      dosageNotes: '',
      frequency: typeConfig?.frequencies?.[0]?.value || 'daily',
      deliveryMethod: typeConfig?.deliveryMethods?.[0]?.value || 'take_home',
      duration: typeConfig?.durations?.[0]?.value || 10,
      totalSessions: typeConfig?.sessions?.[0] || 1,
      totalInjections: injectionValue || 4,
      numVials: typeConfig?.vialBased ? 1 : prev.numVials,
      dosesPerVial: typeConfig?.vialBased ? (typeConfig.defaultDosesPerVial || 10) : prev.dosesPerVial
    }));
  };

  // Build patient name from the patients table (source of truth)
  const patientName = patient
    ? (patient.first_name && patient.last_name ? `${patient.first_name} ${patient.last_name}` : patient.name)
    : purchase?.patient_name || 'Unknown';
  const patientPhone = patient?.phone || purchase?.patient_phone || '';
  const patientEmail = patient?.email || purchase?.patient_email || '';
  const patientId = patient?.id || null;
  const ghlContactId = patient?.ghl_contact_id || purchase?.ghl_contact_id || '';

  const handleSubmit = async () => {
    if (!patientName?.trim()) {
      setError('Could not determine patient name');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Lab Panel mode — only create lab pipeline entry, no protocol
      if (isLabMode) {
        const res = await fetch('/api/admin/labs-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patientId,
            patientName: patientName,
            panelType: labPanelType,
            labType: labType,
            bloodDrawDate: form.startDate,
            notes: form.notes || null
          })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to add to lab pipeline');
        }
        onSuccess();
        return;
      }

      // Membership modes — create protocol(s) with correct program_type for service log
      if (isMembershipMode) {
        const today = form.startDate || new Date().toISOString().split('T')[0];
        const periodDays = isCellularReset ? 42 : (selectedFreq.period || 30);
        const endDate = new Date(today + 'T12:00:00');
        endDate.setDate(endDate.getDate() + periodDays);
        const endDateStr = endDate.toISOString().split('T')[0];

        // Determine session counts
        const hbotSessions = isCellularReset ? 18 : selectedFreq.hbotSessions;
        const rltSessions = isCellularReset ? 18 : selectedFreq.rltSessions;

        const createProtocol = async (programName, programType, totalSessions, linkPurchase) => {
          const protocolData = {
            patient_id: patientId,
            ghl_contact_id: ghlContactId || null,
            patient_name: patientName,
            patient_email: patientEmail,
            patient_phone: patientPhone,
            purchase_id: linkPurchase ? purchase.id : null,
            program_name: programName,
            program_type: programType,
            total_sessions: totalSessions,
            delivery_method: 'in_clinic',
            start_date: today,
            end_date: endDateStr,
            frequency: isCellularReset ? '3x_week' : membershipFrequency,
            notes: form.notes || null,
            status: 'active'
          };

          const res = await fetch('/api/admin/protocols', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(protocolData)
          });

          if (res.status === 409) {
            const data = await res.json().catch(() => ({}));
            setExistingProtocolId(data.existing_protocol_id || null);
            throw new Error('Protocol already created for this purchase');
          }
          if (!res.ok) {
            let errorMsg = 'Failed to create protocol';
            try { const data = await res.json(); errorMsg = data.details || data.error || errorMsg; } catch (e) {}
            throw new Error(errorMsg);
          }
          return res.json();
        };

        if (isComboMode || isCellularReset) {
          // Create TWO protocols: HBOT + RLT
          const programLabel = isCellularReset ? 'Cellular Reset' : 'Combo Membership';
          await createProtocol(`${programLabel} — HBOT`, 'hbot', hbotSessions, true);
          await createProtocol(`${programLabel} — RLT`, 'red_light', rltSessions, false);
        } else if (isHbotMembership) {
          await createProtocol(`HBOT Membership (${hbotSessions} sessions)`, 'hbot', hbotSessions, true);
        } else if (isRltMembership) {
          await createProtocol(`RLT Membership (${rltSessions} sessions)`, 'red_light', rltSessions, true);
        }

        onSuccess();
        return;
      }

      const dbProgramType = getDBProgramType(form.protocolType, form.duration);

      const buildProtocolName = () => {
        const type = form.protocolType;
        if (type === 'peptide') return `${form.duration}-Day Recovery Protocol`;
        if (type === 'peptide_vial') {
          const totalDoses = parseInt(form.numVials) * parseInt(form.dosesPerVial);
          return `${form.medication || 'Peptide Vial'} (${form.numVials} vial${parseInt(form.numVials) > 1 ? 's' : ''} · ${totalDoses} doses)`;
        }
        if (type === 'hrt_male') return 'HRT Protocol (Male)';
        if (type === 'hrt_female') return 'HRT Protocol (Female)';
        if (type.startsWith('weight_loss')) return `Weight Loss - ${form.medication} ${form.dosage} (${form.totalInjections} injections)`;
        if (type === 'single_injection') return `Single Injection - ${form.medication}`;
        if (type === 'injection_pack') return `Injection Pack (${form.totalInjections} injections) - ${form.medication}`;
        if (type === 'red_light') return `Red Light Therapy (${form.totalSessions} sessions)`;
        if (type === 'hbot') return `HBOT (${form.totalSessions} sessions)`;
        if (type === 'iv_therapy') return form.medication
          ? `${form.medication} (${form.totalSessions} sessions)`
          : `IV Therapy (${form.totalSessions} sessions)`;
        return 'Protocol';
      };

      const calculateEndDate = () => {
        if (isOngoing) return null;
        if (isSessionBased && !form.startDate) return null;
        if (isVialBased) {
          const totalDoses = parseInt(form.numVials) * parseInt(form.dosesPerVial);
          const freq = (form.frequency || '').toLowerCase();
          let durationDays;
          if (freq.includes('5on') || freq === '5on2off') {
            durationDays = Math.ceil(totalDoses / 5) * 7;
          } else if (freq === 'eod' || freq.includes('every other')) {
            durationDays = totalDoses * 2;
          } else {
            durationDays = totalDoses; // daily
          }
          const start = new Date(form.startDate + 'T12:00:00');
          start.setDate(start.getDate() + durationDays);
          return start.toISOString().split('T')[0];
        }
        if (isInjectionBased) {
          // Weekly injections: 4 injections = ~28 days
          const start = new Date(form.startDate);
          start.setDate(start.getDate() + (parseInt(form.totalInjections) * 7) - 1);
          return start.toISOString().split('T')[0];
        }
        if (!form.startDate || !form.duration) return null;
        const start = new Date(form.startDate);
        start.setDate(start.getDate() + parseInt(form.duration) - 1);
        return start.toISOString().split('T')[0];
      };

      // Calculate duration_days based on protocol type
      const getDurationDays = () => {
        if (isVialBased) {
          const totalDoses = parseInt(form.numVials) * parseInt(form.dosesPerVial);
          const freq = (form.frequency || '').toLowerCase();
          if (freq.includes('5on') || freq === '5on2off') return Math.ceil(totalDoses / 5) * 7;
          if (freq === 'eod' || freq.includes('every other')) return totalDoses * 2;
          return totalDoses;
        }
        if (isInjectionBased) return parseInt(form.totalInjections) * 7; // Weekly injections
        if (isSessionBased) return parseInt(form.totalSessions);
        if (isOngoing) return 30;
        return parseInt(form.duration);
      };

      // Calculate total_sessions based on protocol type
      const getTotalSessions = () => {
        if (isVialBased) return parseInt(form.numVials) * parseInt(form.dosesPerVial);
        if (isInjectionBased) return parseInt(form.totalInjections);
        if (isSessionBased) return parseInt(form.totalSessions);
        if (isOngoing) return null;
        return parseInt(form.duration);
      };

      const protocolData = {
        patient_id: patientId,
        ghl_contact_id: ghlContactId || null,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        purchase_id: purchase.id,
        program_name: buildProtocolName(),
        program_type: dbProgramType,
        // Use actual DB column names (single source of truth)
        medication: form.medication,
        selected_dose: form.dosage || form.dosageNotes || '',
        frequency: form.frequency,
        delivery_method: isVialBased ? 'take_home' : form.deliveryMethod,
        start_date: form.startDate,
        total_sessions: getTotalSessions(),
        end_date: calculateEndDate(),
        notes: form.dosageNotes ? `Dosage: ${form.dosageNotes}${form.notes ? '\n' + form.notes : ''}` : form.notes,
        status: 'active',
        ...(isVialBased ? {
          num_vials: parseInt(form.numVials),
          doses_per_vial: parseInt(form.dosesPerVial)
        } : {})
      };

      const res = await fetch('/api/admin/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protocolData)
      });

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setExistingProtocolId(data.existing_protocol_id || null);
        setError('Protocol already created for this purchase');
        setSaving(false);
        return;
      }

      if (!res.ok) {
        let errorMsg = 'Failed to create protocol';
        try {
          const data = await res.json();
          errorMsg = data.details || data.error || errorMsg;
        } catch (e) { /* response may be empty */ }
        throw new Error(errorMsg);
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>Create Protocol</h2>
            <p style={modalStyles.subtitle}>{purchase.item_name} (${purchase.amount})</p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        <div style={modalStyles.body}>
          {error && (
            <div style={modalStyles.error}>
              {error}
              {existingProtocolId && (
                <div style={{ marginTop: '8px' }}>
                  <Link href={`/admin/protocols/${existingProtocolId}`} style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: 600 }}>
                    View Existing Protocol →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Patient (read-only from patients table) */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Patient</h3>
            {patientLoading ? (
              <div style={{ padding: '12px', color: '#9ca3af', fontSize: '14px' }}>Looking up patient...</div>
            ) : (
              <div style={modalStyles.patientCard}>
                <div style={modalStyles.patientCardName}>{patientName}</div>
                <div style={modalStyles.patientCardDetails}>
                  {patientEmail && <span>{patientEmail}</span>}
                  {patientEmail && patientPhone && <span style={{ color: '#d1d5db' }}> · </span>}
                  {patientPhone && <span>{patientPhone}</span>}
                </div>
                {!patient && (
                  <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                    Patient not found in database — using purchase data
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 90-Day Cycle Warning */}
          {cycleWarning && (form.protocolType === 'peptide' || form.protocolType === 'gh_peptide' || form.protocolType === 'peptide_vial') && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: '1.4',
              background: cycleWarning.level === 'error' ? '#fef2f2' :
                          cycleWarning.level === 'warning' ? '#fffbeb' :
                          cycleWarning.level === 'info' ? '#eff6ff' : '#f0fdf4',
              border: `1px solid ${
                cycleWarning.level === 'error' ? '#fecaca' :
                cycleWarning.level === 'warning' ? '#fde68a' :
                cycleWarning.level === 'info' ? '#bfdbfe' : '#bbf7d0'
              }`,
              color: cycleWarning.level === 'error' ? '#991b1b' :
                     cycleWarning.level === 'warning' ? '#92400e' :
                     cycleWarning.level === 'info' ? '#1e40af' : '#166534'
            }}>
              <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {cycleWarning.level === 'error' ? '⛔ Cycle Limit Reached' :
                 cycleWarning.level === 'warning' ? '⚠️ Cycle Limit Warning' :
                 '💊 90-Day Cycle'}
              </strong>
              <div style={{ marginTop: '2px' }}>{cycleWarning.message}</div>
            </div>
          )}

          {/* Type Selection */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Type</h3>
            <div style={modalStyles.typeGrid}>
              <button
                onClick={() => setForm(prev => ({ ...prev, protocolType: 'lab_panel' }))}
                style={{
                  ...modalStyles.typeBtn,
                  background: isLabMode ? '#16a34a' : '#f5f5f5',
                  color: isLabMode ? '#fff' : '#000',
                  border: isLabMode ? '1px solid #16a34a' : '1px solid transparent'
                }}
              >
                🧪 Lab Panel
              </button>
              {[
                { key: 'combo_membership', label: '🏥 Combo Membership', color: '#7c3aed' },
                { key: 'cellular_reset', label: '⚡ Cellular Reset', color: '#0891b2' },
                { key: 'hbot_membership', label: '🫧 HBOT Membership', color: '#2563eb' },
                { key: 'rlt_membership', label: '🔴 RLT Membership', color: '#dc2626' },
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setForm(prev => ({ ...prev, protocolType: key }))}
                  style={{
                    ...modalStyles.typeBtn,
                    background: form.protocolType === key ? color : '#f5f5f5',
                    color: form.protocolType === key ? '#fff' : '#000',
                    border: form.protocolType === key ? `1px solid ${color}` : '1px solid transparent'
                  }}
                >
                  {label}
                </button>
              ))}
              {Object.entries(PROTOCOL_TYPES).map(([key, type]) => (
                <button
                  key={key}
                  onClick={() => handleTypeChange(key)}
                  style={{
                    ...modalStyles.typeBtn,
                    background: form.protocolType === key ? '#000' : '#f5f5f5',
                    color: form.protocolType === key ? '#fff' : '#000'
                  }}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Lab Panel Mode */}
          {isLabMode && (
            <div style={{
              padding: '20px',
              background: '#f0fdf4',
              borderRadius: '10px',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#15803d', marginBottom: '16px' }}>
                🧪 Add to Lab Pipeline
              </div>
              <div style={modalStyles.grid}>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Panel Type</label>
                  <select
                    value={labPanelType}
                    onChange={e => setLabPanelType(e.target.value)}
                    style={modalStyles.select}
                  >
                    <option value="essential">Essential ($350)</option>
                    <option value="elite">Elite ($750)</option>
                  </select>
                </div>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Lab Type</label>
                  <select
                    value={labType}
                    onChange={e => setLabType(e.target.value)}
                    style={modalStyles.select}
                  >
                    <option value="new_patient">New Patient</option>
                    <option value="follow_up">Follow-up</option>
                  </select>
                </div>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Blood Draw Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    style={modalStyles.input}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Membership Mode */}
          {isMembershipMode && (
            <div style={{
              padding: '20px',
              background: isComboMode ? '#f5f3ff' : isCellularReset ? '#ecfeff' : isHbotMembership ? '#eff6ff' : '#fef2f2',
              borderRadius: '10px',
              border: `1px solid ${isComboMode ? '#ddd6fe' : isCellularReset ? '#a5f3fc' : isHbotMembership ? '#bfdbfe' : '#fecaca'}`
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: isComboMode ? '#6d28d9' : isCellularReset ? '#0e7490' : isHbotMembership ? '#1d4ed8' : '#dc2626', marginBottom: '16px' }}>
                {isComboMode && '🏥 Combo Membership — HBOT + Red Light'}
                {isCellularReset && '⚡ Six-Week Cellular Reset — 18 HBOT + 18 RLT'}
                {isHbotMembership && '🫧 HBOT Membership'}
                {isRltMembership && '🔴 Red Light Membership'}
              </div>

              {/* Frequency picker (not for cellular reset — it's fixed at 18+18) */}
              {!isCellularReset && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={modalStyles.label}>Frequency</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {MEMBERSHIP_FREQUENCY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setMembershipFrequency(opt.value)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: membershipFrequency === opt.value ? '2px solid #000' : '1px solid #e5e7eb',
                          background: membershipFrequency === opt.value ? '#000' : '#fff',
                          color: membershipFrequency === opt.value ? '#fff' : '#374151',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          textAlign: 'center'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Session summary */}
              <div style={{
                padding: '12px 16px',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Sessions per month
                </div>
                {(isComboMode || isCellularReset) ? (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>
                        {isCellularReset ? 18 : selectedFreq.hbotSessions}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>HBOT Sessions</div>
                    </div>
                    <div style={{ width: '1px', background: '#e5e7eb' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>
                        {isCellularReset ? 18 : selectedFreq.rltSessions}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Red Light Sessions</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: isHbotMembership ? '#2563eb' : '#dc2626' }}>
                      {isHbotMembership ? selectedFreq.hbotSessions : selectedFreq.rltSessions}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {isHbotMembership ? 'HBOT Sessions' : 'Red Light Sessions'}
                    </div>
                  </div>
                )}
              </div>

              {isCellularReset && (
                <div style={{
                  padding: '8px 12px',
                  background: '#fff7ed',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#92400e',
                  marginBottom: '16px'
                }}>
                  6-week program · 3x per week each · 42 days total
                </div>
              )}

              <div style={modalStyles.grid}>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    style={modalStyles.input}
                  />
                </div>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Notes</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    style={modalStyles.input}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Medication (protocols only) */}
          {!isLabMode && !isMembershipMode && selectedType?.medications && (
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>Medication</h3>
              <div style={modalStyles.grid}>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Medication</label>
                  <select
                    value={form.medication}
                    onChange={e => setForm({ ...form, medication: e.target.value })}
                    style={modalStyles.select}
                  >
                    <option value="">Select...</option>
                    {selectedType.medications.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                {selectedType.dosages && !hasDosageNotes && (
                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Dosage</label>
                    <select
                      value={form.dosage}
                      onChange={e => setForm({ ...form, dosage: e.target.value })}
                      style={modalStyles.select}
                    >
                      <option value="">Select...</option>
                      {selectedType.dosages.map(d => {
                        const val = typeof d === 'object' ? d.value : d;
                        const lbl = typeof d === 'object' ? d.label : d;
                        return <option key={val} value={val}>{lbl}</option>;
                      })}
                    </select>
                  </div>
                )}
                {hasDosageNotes && (
                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Dosage (write in)</label>
                    <input
                      type="text"
                      value={form.dosageNotes}
                      onChange={e => setForm({ ...form, dosageNotes: e.target.value })}
                      style={modalStyles.input}
                      placeholder="e.g., 1ml, 200mg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vial Configuration (peptide vials only) */}
          {!isLabMode && !isMembershipMode && isVialBased && (
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>Vial Configuration</h3>
              <div style={modalStyles.grid}>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Number of Vials</label>
                  <select
                    value={form.numVials}
                    onChange={e => setForm({ ...form, numVials: parseInt(e.target.value) })}
                    style={modalStyles.select}
                  >
                    {(selectedType?.vialOptions || [1, 2, 3, 4]).map(n => (
                      <option key={n} value={n}>{n} vial{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Injections per Vial</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={form.dosesPerVial}
                    onChange={e => setForm({ ...form, dosesPerVial: parseInt(e.target.value) || 10 })}
                    style={modalStyles.input}
                  />
                </div>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={e => setForm({ ...form, frequency: e.target.value })}
                    style={modalStyles.select}
                  >
                    {selectedType?.frequencies?.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    style={modalStyles.input}
                  />
                </div>
              </div>
              {/* Vial summary */}
              {(() => {
                const totalDoses = parseInt(form.numVials) * parseInt(form.dosesPerVial);
                const freq = (form.frequency || '').toLowerCase();
                let durationDays;
                let freqLabel;
                if (freq.includes('5on') || freq === '5on2off') {
                  durationDays = Math.ceil(totalDoses / 5) * 7;
                  freqLabel = '5 on / 2 off';
                } else if (freq === 'eod' || freq.includes('every other')) {
                  durationDays = totalDoses * 2;
                  freqLabel = 'every other day';
                } else {
                  durationDays = totalDoses;
                  freqLabel = 'daily';
                }
                const endDate = new Date(form.startDate + 'T12:00:00');
                endDate.setDate(endDate.getDate() + durationDays);
                return (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #bae6fd',
                    display: 'flex',
                    gap: '24px'
                  }}>
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#0369a1' }}>{totalDoses}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Total injections</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#0369a1' }}>{durationDays}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Days ({freqLabel})</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0369a1', marginTop: '4px' }}>
                        {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Estimated end</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Schedule (protocols only — not lab, membership, or vial modes) */}
          {!isLabMode && !isMembershipMode && !isVialBased && (
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>Schedule</h3>
              <div style={modalStyles.grid}>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={e => setForm({ ...form, frequency: e.target.value })}
                    style={modalStyles.select}
                  >
                    {selectedType?.frequencies?.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Delivery</label>
                  <select
                    value={form.deliveryMethod}
                    onChange={e => setForm({ ...form, deliveryMethod: e.target.value })}
                    style={modalStyles.select}
                  >
                    {selectedType?.deliveryMethods ? (
                      selectedType.deliveryMethods.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))
                    ) : (
                      <>
                        <option value="take_home">Take Home</option>
                        <option value="in_clinic">In Clinic</option>
                      </>
                    )}
                  </select>
                </div>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    style={modalStyles.input}
                  />
                </div>
                {selectedType?.durations && (
                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Duration</label>
                    <select
                      value={form.duration}
                      onChange={e => setForm({ ...form, duration: e.target.value })}
                      style={modalStyles.select}
                    >
                      {selectedType.durations.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedType?.sessions && (
                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Sessions</label>
                    <select
                      value={form.totalSessions}
                      onChange={e => setForm({ ...form, totalSessions: e.target.value })}
                      style={modalStyles.select}
                    >
                      {selectedType.sessions.map(s => (
                        <option key={s} value={s}>{s} session{s > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedType?.injections && (
                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Injections</label>
                    <select
                      value={form.totalInjections}
                      onChange={e => setForm({ ...form, totalInjections: e.target.value })}
                      style={modalStyles.select}
                    >
                      {selectedType.injections.map(i => {
                        // Handle both object format {value, label} and plain number format
                        const val = typeof i === 'object' ? i.value : i;
                        const label = typeof i === 'object' ? i.label : `${i} injection${i > 1 ? 's' : ''}`;
                        return <option key={val} value={val}>{label}</option>;
                      })}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            ...modalStyles.submitBtn,
            ...(isLabMode ? { background: '#16a34a' } : {}),
            ...(isMembershipMode ? { background: isComboMode ? '#7c3aed' : isCellularReset ? '#0891b2' : isHbotMembership ? '#2563eb' : '#dc2626' } : {})
          }}>
            {saving ? 'Creating...' : isLabMode ? '🧪 Add to Lab Pipeline' : (isComboMode || isCellularReset) ? 'Create 2 Protocols (HBOT + RLT)' : isHbotMembership ? 'Create HBOT Protocol' : isRltMembership ? 'Create RLT Protocol' : 'Create Protocol'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add to Existing Protocol Modal Component
function AddToExistingModal({ purchase, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [protocols, setProtocols] = useState([]);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [sessionsToAdd, setSessionsToAdd] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientProtocols();
  }, []);

  const fetchPatientProtocols = async () => {
    try {
      let patientProtocols = [];
      const seen = new Set();

      const addResults = (results) => {
        for (const p of results) {
          if (!seen.has(p.id)) {
            patientProtocols.push(p);
            seen.add(p.id);
          }
        }
      };

      // Strategy 1: Search by patient_id (most reliable — single source of truth)
      if (purchase.patient_id) {
        const res = await fetch(`/api/admin/protocols?patient_id=${encodeURIComponent(purchase.patient_id)}&status=active`);
        if (res.ok) {
          const data = await res.json();
          addResults(data.protocols || data || []);
        }
      }

      // Strategy 2: Search by ghl_contact_id (catches protocols linked by CRM)
      if (purchase.ghl_contact_id) {
        const res = await fetch(`/api/admin/protocols?ghl_contact_id=${encodeURIComponent(purchase.ghl_contact_id)}&status=active`);
        if (res.ok) {
          const data = await res.json();
          addResults(data.protocols || data || []);
        }
      }

      // Strategy 3: Search by patient name (fallback for edge cases)
      if (purchase.patient_name) {
        const res = await fetch(`/api/admin/protocols?search=${encodeURIComponent(purchase.patient_name)}&status=active`);
        if (res.ok) {
          const data = await res.json();
          const nameResults = (data.protocols || data || []).filter(p =>
            (p.patient_name || '').toLowerCase() === (purchase.patient_name || '').toLowerCase()
          );
          addResults(nameResults);
        }
      }

      setProtocols(patientProtocols);
    } catch (err) {
      console.error('Error fetching protocols:', err);
    } finally {
      setLoading(false);
    }
  };

  // Detect protocol type for smart behavior
  const isHRT = selectedProtocol && (
    (selectedProtocol.program_type || '').toLowerCase().includes('hrt') ||
    (selectedProtocol.program_name || '').toLowerCase().includes('hrt')
  );
  const isWeightLoss = selectedProtocol && (
    (selectedProtocol.program_type || '').toLowerCase() === 'weight_loss' ||
    (selectedProtocol.program_name || '').toLowerCase().includes('weight loss')
  );

  const handleSubmit = async () => {
    if (!selectedProtocol) {
      setError('Please select a protocol');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isHRT) {
        // HRT: Just update last_payment_date (adds 1 month of membership)
        const res = await fetch(`/api/admin/protocols/${selectedProtocol.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            last_payment_date: new Date().toISOString().split('T')[0]
          })
        });
        if (!res.ok) throw new Error('Failed to update protocol');
      } else if (isWeightLoss) {
        // Weight Loss: Add 4 injections (1 month) and update last_payment_date
        const newTotalSessions = (selectedProtocol.total_sessions || 0) + 4;
        const res = await fetch(`/api/admin/protocols/${selectedProtocol.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            total_sessions: newTotalSessions,
            last_payment_date: new Date().toISOString().split('T')[0]
          })
        });
        if (!res.ok) throw new Error('Failed to update protocol');
      } else {
        // Other: Add sessions to the protocol
        const newTotalSessions = (selectedProtocol.total_sessions || 0) + sessionsToAdd;
        const res = await fetch(`/api/admin/protocols/${selectedProtocol.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            total_sessions: newTotalSessions
          })
        });
        if (!res.ok) throw new Error('Failed to update protocol');
      }

      // Link purchase to protocol — set BOTH protocol_id AND protocol_created
      const purchaseRes = await fetch(`/api/admin/purchases/${purchase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol_id: selectedProtocol.id,
          protocol_created: true
        })
      });

      if (!purchaseRes.ok) throw new Error('Failed to link purchase');

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={{ ...modalStyles.modal, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>Add to Existing Protocol</h2>
            <p style={modalStyles.subtitle}>{purchase?.item_name} (${purchase?.amount})</p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        <div style={modalStyles.body}>
          {error && <div style={modalStyles.error}>{error}</div>}

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Patient</h3>
            <p style={{ margin: '4px 0', fontWeight: '500' }}>{purchase?.patient_name}</p>
          </div>

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Select Protocol</h3>
            {loading ? (
              <p style={{ color: '#666' }}>Loading protocols...</p>
            ) : protocols.length === 0 ? (
              <p style={{ color: '#666' }}>No active protocols found for this patient. Create a new protocol instead.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {protocols.map(protocol => {
                  const isProtoHRT = (protocol.program_type || '').toLowerCase().includes('hrt') ||
                                     (protocol.program_name || '').toLowerCase().includes('hrt');
                  return (
                    <button
                      key={protocol.id}
                      onClick={() => setSelectedProtocol(protocol)}
                      style={{
                        padding: '12px 16px',
                        border: selectedProtocol?.id === protocol.id ? '2px solid #000' : '1px solid #e5e5e5',
                        borderRadius: '8px',
                        background: selectedProtocol?.id === protocol.id ? '#f5f5f5' : '#fff',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {protocol.program_name || protocol.program_type}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {isProtoHRT ? (
                          <>Ongoing membership • Started {new Date(protocol.start_date).toLocaleDateString()}
                            {protocol.last_payment_date && <> • Last paid {new Date(protocol.last_payment_date + 'T12:00:00').toLocaleDateString()}</>}
                          </>
                        ) : (
                          <>{protocol.total_sessions || 0} sessions • Started {new Date(protocol.start_date).toLocaleDateString()}</>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedProtocol && !isHRT && !isWeightLoss && (
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>Sessions to Add</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[1, 5, 10, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setSessionsToAdd(n)}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: sessionsToAdd === n ? '#000' : '#f5f5f5',
                      color: sessionsToAdd === n ? '#fff' : '#000',
                      fontWeight: '500'
                    }}
                  >
                    +{n}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                New total: {(selectedProtocol.total_sessions || 0) + sessionsToAdd} sessions
              </p>
            </div>
          )}

          {selectedProtocol && isWeightLoss && (
            <div style={modalStyles.section}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                fontSize: '13px',
                color: '#166534'
              }}>
                <strong>+ 4 Injections (1 Month)</strong> — Adds 4 weekly injections to the existing weight loss protocol.
                <div style={{ marginTop: '6px', color: '#15803D' }}>
                  New total: {(selectedProtocol.total_sessions || 0) + 4} injections
                </div>
              </div>
            </div>
          )}

          {selectedProtocol && isHRT && (
            <div style={modalStyles.section}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                fontSize: '13px',
                color: '#166534'
              }}>
                <strong>+ 1 Month</strong> — This payment will be linked to the existing HRT protocol and the last payment date will be updated to today.
              </div>
            </div>
          )}
        </div>

        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !selectedProtocol || protocols.length === 0}
            style={{
              ...modalStyles.submitBtn,
              opacity: (!selectedProtocol || protocols.length === 0) ? 0.5 : 1
            }}
          >
            {saving ? 'Adding...' : isHRT ? 'Add 1 Month' : isWeightLoss ? 'Add 4 Injections' : `Add ${sessionsToAdd} Session${sessionsToAdd > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Log Session Modal — for single IVs, injections, and one-off sessions
function LogSessionModal({ purchase, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    medication: purchase?.item_name || '',
    notes: ''
  });

  // Patient lookup (same pattern as CreateProtocolModal)
  useEffect(() => {
    async function lookupPatient() {
      setPatientLoading(true);
      try {
        let found = null;
        if (purchase?.ghl_contact_id) {
          const res = await fetch(`/api/admin/patients?search=${encodeURIComponent(purchase.ghl_contact_id)}&limit=1`);
          if (res.ok) {
            const data = await res.json();
            const patients = data.patients || data || [];
            found = patients.find(p => p.ghl_contact_id === purchase.ghl_contact_id);
          }
        }
        if (!found && purchase?.patient_name) {
          const res = await fetch(`/api/admin/patients?search=${encodeURIComponent(purchase.patient_name)}&limit=5`);
          if (res.ok) {
            const data = await res.json();
            const patients = data.patients || data || [];
            const purchaseName = (purchase.patient_name || '').toLowerCase().trim();
            found = patients.find(p => {
              const fullName = (p.first_name && p.last_name)
                ? `${p.first_name} ${p.last_name}`.toLowerCase()
                : (p.name || '').toLowerCase();
              return fullName === purchaseName;
            }) || patients[0];
          }
        }
        setPatient(found || null);
      } catch (err) {
        console.error('Patient lookup error:', err);
      } finally {
        setPatientLoading(false);
      }
    }
    lookupPatient();
  }, [purchase]);

  const patientName = patient
    ? (patient.first_name && patient.last_name ? `${patient.first_name} ${patient.last_name}` : patient.name)
    : purchase?.patient_name || 'Unknown';

  // Map purchase category to service_log category
  const getServiceCategory = () => {
    const cat = (purchase?.category || '').toLowerCase();
    const map = {
      'hbot': 'hbot', 'red_light': 'red_light',
      'iv_therapy': 'iv_therapy', 'specialty_iv': 'iv_therapy',
      'injection_standard': 'vitamin', 'injection_premium': 'vitamin',
      'nad_injection': 'vitamin', 'injection': 'vitamin'
    };
    return map[cat] || cat;
  };

  const handleSubmit = async () => {
    if (!patient?.id) {
      setError('No patient found — cannot log session');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // 1. Create service log entry
      const logRes = await fetch('/api/service-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          category: getServiceCategory(),
          entry_type: 'session',
          entry_date: form.date,
          medication: form.medication,
          notes: form.notes || `Logged from purchase: ${purchase.item_name}`
        })
      });
      if (!logRes.ok) {
        const data = await logRes.json();
        throw new Error(data.error || 'Failed to create service log');
      }

      // 2. Mark purchase as logged
      await fetch(`/api/admin/purchases/${purchase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_logged: true })
      });

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={{ ...modalStyles.modal, maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>Log Session</h2>
            <p style={modalStyles.subtitle}>{purchase.item_name} (${purchase.amount})</p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        <div style={modalStyles.body}>
          {error && <div style={modalStyles.error}>{error}</div>}

          {/* Patient */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Patient</label>
            {patientLoading ? (
              <div style={{ padding: '8px', color: '#9ca3af', fontSize: '14px' }}>Looking up patient...</div>
            ) : (
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px', fontWeight: '500' }}>
                {patientName}
                {!patient?.id && <span style={{ color: '#dc2626', fontSize: '12px', marginLeft: '8px' }}>⚠ Not found in system</span>}
              </div>
            )}
          </div>

          {/* Date */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Session Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          {/* Medication / Service */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Service</label>
            <input
              type="text"
              value={form.medication}
              onChange={e => setForm({ ...form, medication: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || patientLoading || !patient?.id}
            style={{
              ...modalStyles.submitBtn,
              background: '#22c55e',
              opacity: (!patient?.id || saving) ? 0.5 : 1
            }}
          >
            {saving ? 'Logging...' : '✓ Log Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  toolbar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    maxWidth: '400px',
    padding: '10px 14px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff'
  },
  filterGroup: {
    display: 'flex',
    gap: '4px',
    background: '#fff',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid #e5e5e5'
  },
  filterBtn: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  tableCard: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa'
  },
  tr: {
    borderBottom: '1px solid #f0f0f0'
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px'
  },
  patientName: {
    fontWeight: '500'
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '12px'
  },
  amount: {
    fontWeight: '600'
  },
  protocolLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '13px'
  },
  createBtn: {
    padding: '6px 12px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  addToExistingBtn: {
    padding: '6px 12px',
    background: '#fff',
    color: '#000',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  logSessionBtn: {
    padding: '6px 12px',
    background: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  saleBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  sessionLoggedBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
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
    borderRadius: '12px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600'
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '13px',
    color: '#666'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  },
  body: {
    padding: '20px',
    overflow: 'auto',
    flex: 1
  },
  error: {
    padding: '12px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  section: {
    marginBottom: '20px'
  },
  patientCard: {
    padding: '12px 16px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  patientCardName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111'
  },
  patientCardDetails: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '2px'
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: '10px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
    marginBottom: '4px'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#fff'
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  typeBtn: {
    padding: '10px 8px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'center'
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  cancelBtn: {
    padding: '10px 20px',
    background: '#f5f5f5',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '10px 20px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  }
};
