// /components/MedicationCheckoutModal.js
// Universal Medication Checkout Modal
// Patient-first checkout flow for ALL dispensing events
// Handles zero-balance (membership/protocol covered) and paid checkouts

import { useState, useEffect, useRef } from 'react';
import { X, Search, ChevronRight, Check, Package, Syringe, Clock, User, AlertTriangle } from 'lucide-react';
import {
  TESTOSTERONE_DOSES,
  WEIGHT_LOSS_MEDICATIONS,
  WEIGHT_LOSS_DOSAGES,
  WEIGHT_LOSS_DURATIONS,
  INJECTION_MEDICATIONS,
  HRT_MEDICATIONS,
  HRT_SUPPLY_TYPES,
  HRT_SECONDARY_MEDICATIONS,
  HRT_SECONDARY_DOSAGES,
  PEPTIDE_OPTIONS,
  PEPTIDE_DURATIONS,
  IV_THERAPY_TYPES,
  CATEGORY_COLORS,
} from '../lib/protocol-config';

const SERVICE_CATEGORIES = [
  { id: 'testosterone', label: 'HRT / Testosterone', icon: '💉', color: '#7c3aed' },
  { id: 'weight_loss', label: 'Weight Loss', icon: '📉', color: '#ea580c' },
  { id: 'peptide', label: 'Peptide', icon: '🧬', color: '#0891b2' },
  { id: 'iv_therapy', label: 'IV Therapy', icon: '💧', color: '#2563eb' },
  { id: 'hbot', label: 'HBOT', icon: '🫁', color: '#059669' },
  { id: 'red_light', label: 'Red Light Therapy', icon: '🔴', color: '#dc2626' },
  { id: 'vitamin', label: 'Vitamin Injection', icon: '💊', color: '#ca8a04' },
  { id: 'supplement', label: 'Supplement / Product', icon: '🧴', color: '#64748b' },
];

export default function MedicationCheckoutModal({ isOpen, onClose, preselectedPatient, onCheckoutComplete }) {
  // Step management
  const [step, setStep] = useState(1); // 1=patient, 2=service, 3=details, 4=confirm, 5=done

  // Step 1: Patient
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const searchTimeout = useRef(null);

  // Coverage data (loaded after patient + category selection)
  const [coverage, setCoverage] = useState(null);
  const [loadingCoverage, setLoadingCoverage] = useState(false);

  // Step 2: Service selection
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Step 3: Details
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [supplyType, setSupplyType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [duration, setDuration] = useState('');
  const [weight, setWeight] = useState('');
  const [entryType, setEntryType] = useState(''); // injection, pickup, session, med_pickup
  const [notes, setNotes] = useState('');
  const [administeredBy, setAdministeredBy] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState('in_clinic');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Protocol linking
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [coverageType, setCoverageType] = useState(null); // subscription, protocol, paid, comp

  // Employees
  const [employees, setEmployees] = useState([]);

  // Email receipt
  const [sendReceipt, setSendReceipt] = useState(true);

  // Payment (for non-covered items)
  const [selectedService, setSelectedService] = useState(null); // pos_service item
  const [paymentMethod, setPaymentMethod] = useState(''); // saved_card, cash, comp
  const [selectedCardId, setSelectedCardId] = useState('');

  // Cart — multiple items per checkout
  const [cartItems, setCartItems] = useState([]);

  // Step 5: Result
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]); // results for each cart item
  const [error, setError] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchEmployees();
      if (preselectedPatient) {
        setSelectedPatient(preselectedPatient);
        setStep(2);
      }
    }
  }, [isOpen]);

  function resetForm() {
    setStep(1);
    setPatientSearch('');
    setPatientResults([]);
    setSelectedPatient(null);
    setCoverage(null);
    setSelectedCategory(null);
    setMedication('');
    setDosage('');
    setSupplyType('');
    setQuantity('');
    setDuration('');
    setWeight('');
    setEntryType('');
    setNotes('');
    setAdministeredBy('');
    setVerifiedBy('');
    setLotNumber('');
    setExpirationDate('');
    setFulfillmentMethod('in_clinic');
    setTrackingNumber('');
    setSelectedProtocol(null);
    setCoverageType(null);
    setSendReceipt(true);
    setSelectedService(null);
    setPaymentMethod('');
    setSelectedCardId('');
    setCartItems([]);
    setSubmitting(false);
    setResult(null);
    setResults([]);
    setError('');
  }

  function resetItemFields() {
    setCoverage(null);
    setSelectedCategory(null);
    setMedication('');
    setDosage('');
    setSupplyType('');
    setQuantity('');
    setDuration('');
    setWeight('');
    setEntryType('');
    setNotes('');
    setAdministeredBy('');
    setVerifiedBy('');
    setLotNumber('');
    setExpirationDate('');
    setFulfillmentMethod('in_clinic');
    setTrackingNumber('');
    setSelectedProtocol(null);
    setCoverageType(null);
    setSelectedService(null);
    setPaymentMethod('');
    setSelectedCardId('');
    setError('');
  }

  function addToCart() {
    const item = {
      id: Date.now(), // temp id for key/removal
      category: selectedCategory,
      medication, dosage, supplyType, quantity, duration, weight,
      entryType, notes, administeredBy, verifiedBy,
      lotNumber, expirationDate, fulfillmentMethod, trackingNumber,
      selectedProtocol, coverageType, coverage,
      selectedService, paymentMethod, selectedCardId,
    };
    setCartItems(prev => [...prev, item]);
    resetItemFields();
    setStep(2);
  }

  function removeFromCart(itemId) {
    setCartItems(prev => prev.filter(i => i.id !== itemId));
  }

  // Patient search
  useEffect(() => {
    if (patientSearch.length < 2) {
      setPatientResults([]);
      return;
    }
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}`);
        const data = await res.json();
        setPatientResults(data.patients || []);
      } catch (err) {
        console.error('Patient search error:', err);
      }
      setSearching(false);
    }, 300);
  }, [patientSearch]);

  // Fetch coverage when patient + category are selected
  async function fetchCoverage(patientId, category) {
    setLoadingCoverage(true);
    setCoverage(null);
    try {
      const res = await fetch(`/api/medication-checkout/coverage?patient_id=${patientId}&category=${category}`);
      const data = await res.json();
      setCoverage(data);

      // Auto-select coverage type
      if (data.covered) {
        setCoverageType(data.coverage_type);
      } else {
        setCoverageType('paid');
      }

      // Auto-select protocol if there's a matching one
      if (data.available_protocols?.length === 1) {
        const proto = data.available_protocols[0];
        setSelectedProtocol(proto);
        // Pre-fill from protocol
        if (proto.medication) setMedication(proto.medication);
        if (proto.selected_dose) setDosage(proto.selected_dose);
        if (proto.supply_type) setSupplyType(proto.supply_type);
      }

      // Auto-set entry type based on category
      if (['hbot', 'iv_therapy', 'red_light'].includes(category)) {
        setEntryType('session');
      } else if (['testosterone', 'peptide'].includes(category)) {
        setEntryType('pickup');
      } else if (['weight_loss', 'vitamin'].includes(category)) {
        setEntryType('injection');
      } else {
        setEntryType('pickup');
      }
    } catch (err) {
      console.error('Coverage fetch error:', err);
    }
    setLoadingCoverage(false);
  }

  async function fetchEmployees() {
    try {
      const res = await fetch('/api/admin/employees?basic=true');
      const data = await res.json();
      setEmployees(data.employees || data || []);
    } catch (err) {
      console.error('Employees fetch error:', err);
    }
  }

  // Select category and move to step 3
  function handleCategorySelect(cat) {
    setSelectedCategory(cat);
    fetchCoverage(selectedPatient.id, cat.id);
    setStep(3);
  }

  // Build all items to process (cart items already added + nothing else — all items are in cart now)
  function getAllCheckoutItems() {
    return [...cartItems];
  }

  // Process payment for a single item
  async function processPayment(item) {
    if (item.coverageType !== 'paid' || !item.selectedService) return null;
    const amountCents = item.selectedService.price_cents;
    const description = item.selectedService.name;

    if (item.paymentMethod === 'cash') {
      const purchaseRes = await fetch('/api/stripe/record-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          amount: amountCents,
          description,
          payment_method: 'cash',
          service_category: item.selectedService.category,
          service_name: item.selectedService.name,
        }),
      });
      const purchaseData = await purchaseRes.json();
      if (!purchaseRes.ok) throw new Error(purchaseData.error || 'Cash recording failed');
      return purchaseData.purchase?.id;
    } else if (item.paymentMethod === 'saved_card' && item.selectedCardId) {
      const piRes = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          amount: amountCents,
          description,
          payment_method_id: item.selectedCardId,
        }),
      });
      const piData = await piRes.json();
      if (!piRes.ok) throw new Error(piData.error || 'Payment failed');

      if (piData.status === 'succeeded') {
        const purchaseRes = await fetch('/api/stripe/record-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: selectedPatient.id,
            amount: amountCents,
            description,
            payment_method: 'stripe',
            stripe_payment_intent_id: piData.payment_intent_id,
            service_category: item.selectedService.category,
            service_name: item.selectedService.name,
          }),
        });
        const purchaseData = await purchaseRes.json();
        if (!purchaseRes.ok) throw new Error(purchaseData.error || 'Purchase recording failed');
        return purchaseData.purchase?.id;
      } else if (piData.status === 'requires_action') {
        throw new Error('Card requires additional verification for 3D Secure.');
      } else {
        throw new Error(`Payment status: ${piData.status}. Please try again.`);
      }
    }
    return null;
  }

  // Submit all cart items
  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    const allItems = getAllCheckoutItems();

    try {
      const allResults = [];
      let totalPaid = 0;

      for (let i = 0; i < allItems.length; i++) {
        const item = allItems[i];
        const isLastItem = i === allItems.length - 1;

        // Process payment if paid
        let purchaseId = null;
        if (item.coverageType === 'paid' && item.selectedService && item.paymentMethod !== 'comp') {
          purchaseId = await processPayment(item);
          totalPaid += item.selectedService.price_cents;
        }

        const itemCovType = item.paymentMethod === 'comp' ? 'comp' : item.coverageType;

        // Log the dispensing
        const body = {
          patient_id: selectedPatient.id,
          category: item.category.id,
          entry_type: item.entryType,
          medication: item.medication || null,
          dosage: item.dosage || null,
          quantity: item.quantity ? parseInt(item.quantity) : null,
          supply_type: item.supplyType || null,
          duration: item.duration ? parseInt(item.duration) : null,
          weight: item.weight || null,
          notes: item.notes || null,
          protocol_id: item.selectedProtocol?.id || null,
          coverage_type: itemCovType,
          coverage_source: itemCovType === 'subscription'
            ? item.coverage?.coverage_source
            : itemCovType === 'protocol'
              ? (item.selectedProtocol?.program_name || item.coverage?.coverage_source)
              : itemCovType === 'comp'
                ? 'Complimentary'
                : 'Paid at checkout',
          administered_by: item.administeredBy || null,
          verified_by: item.verifiedBy || null,
          lot_number: item.lotNumber || null,
          expiration_date: item.expirationDate || null,
          fulfillment_method: item.fulfillmentMethod,
          tracking_number: item.trackingNumber || null,
          purchase_id: purchaseId,
          send_receipt: sendReceipt && isLastItem, // only send email on last item
        };

        const res = await fetch('/api/medication-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Checkout failed for ${item.medication || item.category.label}`);

        allResults.push({
          ...data,
          category: item.category,
          medication: item.medication,
          coverageType: itemCovType,
          amount: item.selectedService?.price_cents || 0,
        });
      }

      setResults(allResults);
      setResult({ success: true, totalPaid, itemCount: allResults.length, receipt_sent: sendReceipt });
      setStep(5);
      if (onCheckoutComplete) onCheckoutComplete(allResults);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  if (!isOpen) return null;

  const isCovered = coverageType === 'subscription' || coverageType === 'protocol' || coverageType === 'comp';
  const allCartItems = getAllCheckoutItems();
  const cartHasPaidItems = allCartItems.some(i => i.coverageType === 'paid' && i.paymentMethod !== 'comp');
  const cartTotal = allCartItems.reduce((sum, i) => sum + (i.coverageType === 'paid' && i.paymentMethod !== 'comp' ? (i.selectedService?.price_cents || 0) : 0), 0);

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>Medication Checkout</h2>
            <div style={styles.headerSub}>
              {step === 1 && 'Select Patient'}
              {step === 2 && `${selectedPatient?.name || ''} — Select Service`}
              {step === 3 && `${selectedPatient?.name || ''} — ${selectedCategory?.label || ''}`}
              {step === 4 && 'Confirm Checkout'}
              {step === 5 && 'Checkout Complete'}
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>

        {/* Step indicator */}
        <div style={styles.steps}>
          {['Patient', 'Service', 'Details', 'Confirm', 'Done'].map((label, i) => (
            <div key={i} style={{
              ...styles.stepDot,
              background: step > i + 1 ? '#000' : step === i + 1 ? '#000' : '#e5e5e5',
              color: step >= i + 1 ? '#fff' : '#999',
            }}>
              {step > i + 1 ? <Check size={12} /> : i + 1}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={styles.body}>

          {/* STEP 1: Patient Selection */}
          {step === 1 && (
            <div>
              <div style={styles.searchWrap}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: '#999' }} />
                <input
                  type="text"
                  placeholder="Search patient by name..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  style={styles.searchInput}
                  autoFocus
                />
                {searching && <span style={styles.searchSpinner}>Searching...</span>}
              </div>

              <div style={styles.patientList}>
                {patientResults.map(p => (
                  <div
                    key={p.id}
                    style={styles.patientItem}
                    onClick={() => {
                      setSelectedPatient(p);
                      setStep(2);
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{p.name}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>{p.email || p.phone || ''}</div>
                    </div>
                    <ChevronRight size={16} color="#ccc" />
                  </div>
                ))}
                {patientSearch.length >= 2 && !searching && patientResults.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No patients found</div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Service Category Selection */}
          {step === 2 && (
            <div>
              {/* Patient summary card */}
              <div style={styles.patientCard}>
                <div style={{ fontWeight: 600 }}>{selectedPatient?.name}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>{selectedPatient?.email || ''} {selectedPatient?.phone ? `· ${selectedPatient.phone}` : ''}</div>
                <button onClick={() => { setSelectedPatient(null); setStep(1); }} style={styles.changeBtn}>Change</button>
              </div>

              <div style={{ fontSize: '13px', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>
                What are we checking out?
              </div>

              <div style={styles.categoryGrid}>
                {SERVICE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    style={styles.categoryCard}
                    onClick={() => handleCategorySelect(cat)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.background = '#fafafa'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e5e5'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Cart items already added */}
              {cartItems.length > 0 && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #e5e5e5', paddingTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                  </div>
                  {cartItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e5e5e5', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{item.category.icon}</span>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.medication || item.category.label}</span>
                        {item.dosage && <span style={{ fontSize: '12px', color: '#666' }}>({item.dosage})</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: (item.coverageType === 'subscription' || item.coverageType === 'protocol' || item.paymentMethod === 'comp') ? '#16a34a' : '#000' }}>
                          {(item.coverageType === 'subscription' || item.coverageType === 'protocol' || item.paymentMethod === 'comp') ? '$0' : item.selectedService ? item.selectedService.price_display : 'Paid'}
                        </span>
                        <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setStep(4)}
                    style={{ ...styles.primaryBtn, marginTop: '12px' }}
                  >
                    Review Checkout ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}) →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Details */}
          {step === 3 && (
            <div>
              {/* Back + Category badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <button onClick={() => { setSelectedCategory(null); setCoverage(null); setStep(2); }} style={styles.backBtn}>← Back</button>
                <span style={{ ...styles.catBadge, background: selectedCategory?.color || '#000' }}>
                  {selectedCategory?.icon} {selectedCategory?.label}
                </span>
              </div>

              {/* Coverage indicator */}
              {loadingCoverage ? (
                <div style={styles.coverageCard}>Loading coverage...</div>
              ) : coverage && (
                <div style={{
                  ...styles.coverageCard,
                  borderColor: coverage.covered ? '#16a34a' : '#e5e5e5',
                  background: coverage.covered ? '#f0fdf4' : '#fff',
                }}>
                  {coverage.covered ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={16} color="#16a34a" />
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>Covered</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#333', marginTop: '4px' }}>
                        {coverage.coverage_source} — $0.00 balance
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={16} color="#666" />
                        <span style={{ fontWeight: 600, color: '#333' }}>New Purchase</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        Not covered by a membership or existing pack. Select pricing and payment method on the next step.
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Current protocol summary — so staff can see what patient is on */}
              {selectedProtocol && (
                <div style={{
                  padding: '14px 16px',
                  background: '#f8f9fa',
                  border: '1px solid #e5e5e5',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Current Protocol
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                    {selectedProtocol.medication && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#888' }}>Medication</span>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedProtocol.medication}</div>
                      </div>
                    )}
                    {selectedProtocol.selected_dose && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#888' }}>Dosage</span>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedProtocol.selected_dose}</div>
                      </div>
                    )}
                    {selectedProtocol.frequency && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#888' }}>Frequency</span>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedProtocol.frequency}</div>
                      </div>
                    )}
                    {selectedProtocol.delivery_method && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#888' }}>Delivery</span>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedProtocol.delivery_method === 'take_home' ? 'Take-Home' : selectedProtocol.delivery_method === 'in_clinic' ? 'In-Clinic' : selectedProtocol.delivery_method}</div>
                      </div>
                    )}
                    {selectedProtocol.supply_type && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#888' }}>Supply</span>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{formatSupplyType(selectedProtocol.supply_type)}</div>
                      </div>
                    )}
                    {selectedProtocol.total_sessions != null && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#888' }}>Sessions</span>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedProtocol.sessions_used || 0}/{selectedProtocol.total_sessions} used</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Peptide cycle tracker */}
              {coverage?.peptide_cycle && (
                <div style={{
                  ...styles.coverageCard,
                  borderColor: coverage.peptide_cycle.cycle_blocked ? '#dc2626' : '#0891b2',
                  background: coverage.peptide_cycle.cycle_blocked ? '#fef2f2' : '#f0fdfa',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: coverage.peptide_cycle.cycle_blocked ? '#dc2626' : '#0891b2' }}>
                      {coverage.peptide_cycle.cycle_label}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      {coverage.peptide_cycle.days_dispensed}/{coverage.peptide_cycle.max_days} days
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '6px', background: '#e5e5e5', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (coverage.peptide_cycle.days_dispensed / coverage.peptide_cycle.max_days) * 100)}%`,
                      background: coverage.peptide_cycle.cycle_blocked ? '#dc2626' : '#0891b2',
                      borderRadius: '3px',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {coverage.peptide_cycle.medication}
                    {coverage.peptide_cycle.days_remaining > 0 && !coverage.peptide_cycle.cycle_blocked
                      ? ` — ${coverage.peptide_cycle.days_remaining} days remaining in cycle`
                      : ''
                    }
                  </div>
                  {coverage.peptide_cycle.cycle_blocked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>
                      <AlertTriangle size={14} />
                      Cycle complete — {coverage.peptide_cycle.off_days}-day break required. Can restart {coverage.peptide_cycle.off_period_end}
                    </div>
                  )}
                  {coverage.peptide_cycle.can_extend && (
                    <div style={{ fontSize: '12px', color: '#0891b2', marginTop: '4px' }}>
                      Extending existing protocol — purchase adds 30 days
                    </div>
                  )}
                </div>
              )}

              {/* Protocol selector (if multiple) */}
              {coverage?.available_protocols?.length > 1 && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Link to Protocol</label>
                  <select
                    value={selectedProtocol?.id || ''}
                    onChange={e => {
                      const proto = coverage.available_protocols.find(p => p.id === e.target.value);
                      setSelectedProtocol(proto || null);
                      if (proto?.medication) setMedication(proto.medication);
                      if (proto?.selected_dose) setDosage(proto.selected_dose);
                    }}
                    style={styles.select}
                  >
                    <option value="">Select protocol...</option>
                    {coverage.available_protocols.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.program_name || p.medication} {p.total_sessions ? `(${p.sessions_used || 0}/${p.total_sessions} used)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Entry type */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Type</label>
                <div style={styles.radioGroup}>
                  {getEntryTypeOptions(selectedCategory?.id).map(opt => (
                    <label key={opt.value} style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="entryType"
                        value={opt.value}
                        checked={entryType === opt.value}
                        onChange={e => setEntryType(e.target.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Medication */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Medication / Service</label>
                {renderMedicationPicker(selectedCategory?.id, medication, setMedication)}
              </div>

              {/* Dosage */}
              {renderDosagePicker(selectedCategory?.id, medication, dosage, setDosage, selectedProtocol)}

              {/* Supply type (HRT) */}
              {selectedCategory?.id === 'testosterone' && entryType === 'pickup' && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Supply Type</label>
                  <select value={supplyType} onChange={e => setSupplyType(e.target.value)} style={styles.select}>
                    <option value="">Select supply...</option>
                    {[
                      ...HRT_SUPPLY_TYPES,
                      { value: 'prefilled_3week', label: 'Pre-filled 3 Week (6 injections)' },
                      { value: 'prefilled_8week', label: 'Pre-filled 8 Week (16 injections)' },
                    ].map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Duration (Peptide) */}
              {selectedCategory?.id === 'peptide' && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Supply Duration</label>
                  <select value={quantity} onChange={e => setQuantity(e.target.value)} style={styles.select}>
                    <option value="">Select duration...</option>
                    {PEPTIDE_DURATIONS.map(d => (
                      <option key={d.value} value={d.days || d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity (Weight Loss) */}
              {selectedCategory?.id === 'weight_loss' && (entryType === 'pickup' || entryType === 'med_pickup') && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Injections Dispensed</label>
                  <select value={quantity} onChange={e => setQuantity(e.target.value)} style={styles.select}>
                    <option value="">Select...</option>
                    {WEIGHT_LOSS_DURATIONS.map(d => (
                      <option key={d.value} value={parseInt(d.value) / 7}>{d.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Weight (for weight loss visits) */}
              {selectedCategory?.id === 'weight_loss' && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Weight (lbs) — optional</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="e.g., 185"
                    style={styles.input}
                  />
                </div>
              )}

              {/* Session duration (HBOT, RLT) */}
              {['hbot', 'red_light'].includes(selectedCategory?.id) && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Session Duration (min)</label>
                  <select value={duration} onChange={e => setDuration(e.target.value)} style={styles.select}>
                    <option value="">Select...</option>
                    {selectedCategory?.id === 'hbot'
                      ? [60, 90, 120].map(d => <option key={d} value={d}>{d} minutes</option>)
                      : [10, 15, 20, 30].map(d => <option key={d} value={d}>{d} minutes</option>)
                    }
                  </select>
                </div>
              )}

              {/* IV type */}
              {selectedCategory?.id === 'iv_therapy' && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>IV Type</label>
                  <select value={medication} onChange={e => setMedication(e.target.value)} style={styles.select}>
                    <option value="">Select...</option>
                    {IV_THERAPY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}

              {/* Fulfillment method */}
              {(entryType === 'pickup' || entryType === 'med_pickup') && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Fulfillment</label>
                  <div style={styles.radioGroup}>
                    <label style={styles.radioLabel}>
                      <input type="radio" name="fulfillment" value="in_clinic" checked={fulfillmentMethod === 'in_clinic'} onChange={e => setFulfillmentMethod(e.target.value)} />
                      <span>In Clinic Pickup</span>
                    </label>
                    <label style={styles.radioLabel}>
                      <input type="radio" name="fulfillment" value="overnight" checked={fulfillmentMethod === 'overnight'} onChange={e => setFulfillmentMethod(e.target.value)} />
                      <span>Overnight Shipping</span>
                    </label>
                  </div>
                  {fulfillmentMethod === 'overnight' && (
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder="Tracking number (optional)"
                      style={{ ...styles.input, marginTop: '8px' }}
                    />
                  )}
                </div>
              )}

              {/* Staff / dispensing details */}
              {['testosterone', 'weight_loss'].includes(selectedCategory?.id) ? (
                <>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ ...styles.fieldGroup, flex: 1 }}>
                      <label style={styles.label}>Dispensed By</label>
                      <select value={administeredBy} onChange={e => setAdministeredBy(e.target.value)} style={styles.select}>
                        <option value="">Select staff...</option>
                        {employees.map(emp => (
                          <option key={emp.id || emp.name} value={emp.name || `${emp.first_name} ${emp.last_name}`}>
                            {emp.name || `${emp.first_name} ${emp.last_name}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ ...styles.fieldGroup, flex: 1 }}>
                      <label style={styles.label}>Verified By (2nd eyes)</label>
                      <select value={verifiedBy} onChange={e => setVerifiedBy(e.target.value)} style={styles.select}>
                        <option value="">Select staff...</option>
                        {employees.filter(emp => {
                          const name = emp.name || `${emp.first_name} ${emp.last_name}`;
                          return name !== administeredBy;
                        }).map(emp => (
                          <option key={emp.id || emp.name} value={emp.name || `${emp.first_name} ${emp.last_name}`}>
                            {emp.name || `${emp.first_name} ${emp.last_name}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Checked Out By</label>
                  <select value={administeredBy} onChange={e => setAdministeredBy(e.target.value)} style={styles.select}>
                    <option value="">Select staff member...</option>
                    {employees.map(emp => (
                      <option key={emp.id || emp.name} value={emp.name || `${emp.first_name} ${emp.last_name}`}>
                        {emp.name || `${emp.first_name} ${emp.last_name}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lot / Expiration (collapsible) */}
              <details style={{ marginBottom: '16px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  Lot Number & Expiration (optional)
                </summary>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Lot Number</label>
                    <input type="text" value={lotNumber} onChange={e => setLotNumber(e.target.value)} style={styles.input} placeholder="e.g., LOT-2024-001" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Expiration Date</label>
                    <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} style={styles.input} />
                  </div>
                </div>
              </details>

              {/* Notes */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
                  placeholder="Any additional notes..."
                />
              </div>

              {/* Payment section for non-covered items */}
              {!coverage?.covered && (
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '16px', marginTop: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Payment
                  </div>

                  {/* Service/price selector */}
                  {coverage?.suggested_services?.length > 0 && coverageType !== 'comp' && (
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Select Service & Price</label>
                      <select
                        value={selectedService?.id || ''}
                        onChange={e => {
                          const svc = coverage.suggested_services.find(s => s.id === e.target.value);
                          setSelectedService(svc || null);
                        }}
                        style={styles.select}
                      >
                        <option value="">Select pricing...</option>
                        {coverage.suggested_services.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} — {s.price_display}{s.recurring ? '/mo' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Payment method */}
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Payment Method</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {coverage?.saved_cards?.length > 0 && coverage.saved_cards.map(card => (
                        <label key={card.id} style={{
                          ...styles.paymentOption,
                          borderColor: paymentMethod === 'saved_card' && selectedCardId === card.id ? '#000' : '#e5e5e5',
                          background: paymentMethod === 'saved_card' && selectedCardId === card.id ? '#f5f5f5' : '#fff',
                        }}>
                          <input type="radio" name="payMethod" checked={paymentMethod === 'saved_card' && selectedCardId === card.id} onChange={() => { setPaymentMethod('saved_card'); setSelectedCardId(card.id); setCoverageType('paid'); }} />
                          <span style={{ fontWeight: 500 }}>{card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} ····{card.last4}</span>
                          <span style={{ fontSize: '12px', color: '#888', marginLeft: 'auto' }}>{card.exp_month}/{card.exp_year}</span>
                        </label>
                      ))}
                      <label style={{
                        ...styles.paymentOption,
                        borderColor: paymentMethod === 'cash' ? '#000' : '#e5e5e5',
                        background: paymentMethod === 'cash' ? '#f5f5f5' : '#fff',
                      }}>
                        <input type="radio" name="payMethod" checked={paymentMethod === 'cash'} onChange={() => { setPaymentMethod('cash'); setSelectedCardId(''); setCoverageType('paid'); }} />
                        <span style={{ fontWeight: 500 }}>Cash</span>
                      </label>
                      <label style={{
                        ...styles.paymentOption,
                        borderColor: paymentMethod === 'comp' ? '#000' : '#e5e5e5',
                        background: paymentMethod === 'comp' ? '#f5f5f5' : '#fff',
                      }}>
                        <input type="radio" name="payMethod" checked={paymentMethod === 'comp'} onChange={() => { setPaymentMethod('comp'); setSelectedCardId(''); setCoverageType('comp'); }} />
                        <span style={{ fontWeight: 500 }}>Complimentary ($0)</span>
                      </label>
                    </div>
                  </div>

                  {/* Price display */}
                  {selectedService && paymentMethod && paymentMethod !== 'comp' && (
                    <div style={{ fontSize: '14px', fontWeight: 600, textAlign: 'right', color: '#000' }}>
                      {selectedService.price_display}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div style={styles.errorMsg}>{error}</div>
              )}

              {coverage?.peptide_cycle?.cycle_blocked ? (
                <button disabled style={{ ...styles.primaryBtn, opacity: 0.5 }}>
                  Cycle Complete — Cannot Checkout
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={addToCart}
                    disabled={!medication && !['hbot', 'red_light'].includes(selectedCategory?.id)}
                    style={{
                      ...styles.secondaryBtn,
                      flex: 1,
                      opacity: (!medication && !['hbot', 'red_light'].includes(selectedCategory?.id)) ? 0.5 : 1,
                    }}
                  >
                    + Add to Cart{cartItems.length > 0 ? ` (${cartItems.length})` : ''}
                  </button>
                  <button
                    onClick={() => { addToCart(); setStep(4); }}
                    disabled={!medication && !['hbot', 'red_light'].includes(selectedCategory?.id)}
                    style={{
                      ...styles.primaryBtn,
                      flex: 1,
                      opacity: (!medication && !['hbot', 'red_light'].includes(selectedCategory?.id)) ? 0.5 : 1,
                    }}
                  >
                    Review Checkout →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Confirmation — all cart items */}
          {step === 4 && (
            <div>
              <button onClick={() => setStep(2)} style={styles.backBtn}>← Add More Items</button>

              <div style={styles.confirmCard}>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>Checkout Summary</h3>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                  {selectedPatient?.name} — {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </div>

                {/* Cart item list */}
                {cartItems.map((item, idx) => {
                  const itemIsCovered = item.coverageType === 'subscription' || item.coverageType === 'protocol' || item.paymentMethod === 'comp';
                  return (
                    <div key={item.id} style={{ borderBottom: idx < cartItems.length - 1 ? '1px solid #f0f0f0' : 'none', paddingBottom: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '16px' }}>{item.category.icon}</span>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.medication || item.category.label}</span>
                          </div>
                          {item.dosage && <div style={{ fontSize: '13px', color: '#666' }}>Dose: {item.dosage}</div>}
                          {item.supplyType && <div style={{ fontSize: '13px', color: '#666' }}>Supply: {formatSupplyType(item.supplyType)}</div>}
                          {item.administeredBy && (
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                              {item.verifiedBy ? `Dispensed: ${item.administeredBy} · Verified: ${item.verifiedBy}` : `Staff: ${item.administeredBy}`}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: itemIsCovered ? '#16a34a' : '#000' }}>
                            {itemIsCovered ? '$0.00' : item.selectedService ? item.selectedService.price_display : '—'}
                          </div>
                          <div style={{ fontSize: '11px', color: itemIsCovered ? '#16a34a' : '#888' }}>
                            {itemIsCovered
                              ? (item.coverageType === 'subscription' ? 'Membership' : item.paymentMethod === 'comp' ? 'Comp' : 'Protocol')
                              : item.paymentMethod === 'cash' ? 'Cash' : item.paymentMethod === 'saved_card' ? 'Card' : ''
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Total */}
                <div style={{
                  ...styles.confirmRow,
                  borderTop: '2px solid #000',
                  marginTop: '4px',
                  paddingTop: '12px',
                }}>
                  <span style={{ ...styles.confirmLabel, fontWeight: 700, fontSize: '15px' }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: '20px', color: cartTotal > 0 ? '#000' : '#16a34a' }}>
                    {cartTotal > 0 ? `$${(cartTotal / 100).toFixed(2)}` : '$0.00'}
                  </span>
                </div>
              </div>

              {/* Send receipt toggle */}
              {selectedPatient?.email && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#666', cursor: 'pointer', marginBottom: '12px' }}>
                  <input
                    type="checkbox"
                    checked={sendReceipt}
                    onChange={e => setSendReceipt(e.target.checked)}
                  />
                  Send receipt email to {selectedPatient.email}
                </label>
              )}

              {error && <div style={styles.errorMsg}>{error}</div>}

              <button
                onClick={handleSubmit}
                disabled={submitting || cartItems.length === 0}
                style={{
                  ...styles.primaryBtn,
                  background: cartTotal > 0 ? '#000' : '#16a34a',
                  opacity: submitting || cartItems.length === 0 ? 0.5 : 1,
                }}
              >
                {submitting
                  ? `Processing (${cartItems.length} items)...`
                  : cartTotal > 0
                    ? `Pay $${(cartTotal / 100).toFixed(2)} & Complete Checkout`
                    : `Complete Checkout — $0.00`
                }
              </button>
            </div>
          )}

          {/* STEP 5: Done */}
          {step === 5 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: '#dcfce7', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <Check size={32} color="#16a34a" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px' }}>Checkout Complete</h3>
              <p style={{ color: '#666', margin: '0 0 16px', fontSize: '14px' }}>
                {selectedPatient?.name} — {results.length} {results.length === 1 ? 'item' : 'items'}
              </p>

              {/* List all checked-out items */}
              <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                {results.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e5e5e5', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{r.category?.icon}</span>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{r.medication || r.category?.label}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: (r.coverageType === 'subscription' || r.coverageType === 'protocol' || r.coverageType === 'comp') ? '#16a34a' : '#000' }}>
                      {(r.coverageType === 'subscription' || r.coverageType === 'protocol' || r.coverageType === 'comp') ? '$0.00' : r.amount ? `$${(r.amount / 100).toFixed(2)}` : '$0.00'}
                    </span>
                  </div>
                ))}
              </div>

              {result?.totalPaid > 0 && (
                <div style={{
                  display: 'inline-block', padding: '8px 16px',
                  background: '#f5f5f5', border: '1px solid #e5e5e5',
                  fontSize: '14px', color: '#000', fontWeight: 600,
                  marginBottom: '20px',
                }}>
                  Total: ${(result.totalPaid / 100).toFixed(2)}
                </div>
              )}

              {result?.receipt_sent && (
                <div style={{ fontSize: '13px', color: '#16a34a', marginBottom: '20px' }}>
                  ✓ Confirmation email sent to {selectedPatient?.email}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => { resetForm(); if (preselectedPatient) { setSelectedPatient(preselectedPatient); setStep(2); } }}
                  style={styles.secondaryBtn}
                >
                  New Checkout
                </button>
                <button onClick={onClose} style={styles.primaryBtn}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// HELPER: Entry type options by category
// ================================================================
function getEntryTypeOptions(categoryId) {
  switch (categoryId) {
    case 'testosterone':
      return [
        { value: 'pickup', label: 'Medication Pickup (take-home)' },
        { value: 'injection', label: 'In-Clinic Injection' },
      ];
    case 'weight_loss':
      return [
        { value: 'injection', label: 'In-Clinic Injection' },
        { value: 'pickup', label: 'Medication Pickup (take-home)' },
      ];
    case 'peptide':
      return [
        { value: 'pickup', label: 'Medication Pickup' },
        { value: 'injection', label: 'In-Clinic Injection' },
      ];
    case 'iv_therapy':
      return [{ value: 'session', label: 'IV Session' }];
    case 'hbot':
      return [{ value: 'session', label: 'HBOT Session' }];
    case 'red_light':
      return [{ value: 'session', label: 'Red Light Session' }];
    case 'vitamin':
      return [
        { value: 'injection', label: 'Injection' },
        { value: 'pickup', label: 'Product Pickup' },
      ];
    case 'supplement':
      return [{ value: 'pickup', label: 'Product Pickup' }];
    default:
      return [
        { value: 'injection', label: 'Injection' },
        { value: 'pickup', label: 'Pickup' },
        { value: 'session', label: 'Session' },
      ];
  }
}

// ================================================================
// HELPER: Medication picker by category
// ================================================================
function renderMedicationPicker(categoryId, value, onChange) {
  switch (categoryId) {
    case 'testosterone':
      return (
        <select value={value} onChange={e => onChange(e.target.value)} style={styles.select}>
          <option value="">Select medication...</option>
          {HRT_MEDICATIONS.map(m => <option key={m} value={m}>{m}</option>)}
          <optgroup label="Secondary Medications">
            {HRT_SECONDARY_MEDICATIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </optgroup>
        </select>
      );
    case 'weight_loss':
      return (
        <select value={value} onChange={e => onChange(e.target.value)} style={styles.select}>
          <option value="">Select medication...</option>
          {WEIGHT_LOSS_MEDICATIONS.map(m => <option key={m} value={m}>{m}</option>)}
          <option value="B12">B12 (add-on)</option>
          <option value="Lipo-C">Lipo-C (add-on)</option>
        </select>
      );
    case 'peptide':
      return (
        <select value={value} onChange={e => onChange(e.target.value)} style={styles.select}>
          <option value="">Select peptide...</option>
          {PEPTIDE_OPTIONS.map(group => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map(opt => {
                const name = typeof opt === 'string' ? opt : opt.value;
                return <option key={name} value={name}>{name}</option>;
              })}
            </optgroup>
          ))}
        </select>
      );
    case 'iv_therapy':
      return null; // IV type is handled separately above
    case 'hbot':
      return (
        <select value={value} onChange={e => onChange(e.target.value)} style={styles.select}>
          <option value="HBOT Session">HBOT Session</option>
          <option value="HBOT — Mild (1.3 ATA)">Mild (1.3 ATA)</option>
          <option value="HBOT — Standard (1.5 ATA)">Standard (1.5 ATA)</option>
          <option value="HBOT — High (2.0 ATA)">High (2.0 ATA)</option>
        </select>
      );
    case 'red_light':
      return (
        <select value={value} onChange={e => onChange(e.target.value)} style={styles.select}>
          <option value="Red Light Therapy">Red Light Therapy</option>
          <option value="Full Body Panel">Full Body Panel</option>
          <option value="Targeted Treatment">Targeted Treatment</option>
        </select>
      );
    case 'vitamin':
      return (
        <select value={value} onChange={e => onChange(e.target.value)} style={styles.select}>
          <option value="">Select injection...</option>
          {INJECTION_MEDICATIONS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      );
    case 'supplement':
      return (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Enter product name..."
          style={styles.input}
        />
      );
    default:
      return <input type="text" value={value} onChange={e => onChange(e.target.value)} style={styles.input} placeholder="Medication or service..." />;
  }
}

// ================================================================
// HELPER: Dosage picker by category + medication
// ================================================================
function renderDosagePicker(categoryId, medication, dosage, setDosage, selectedProtocol) {
  if (categoryId === 'testosterone' && medication) {
    // Check if it's a secondary med
    const secDosages = HRT_SECONDARY_DOSAGES[medication];
    if (secDosages) {
      return (
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Dosage</label>
          <select value={dosage} onChange={e => setDosage(e.target.value)} style={styles.select}>
            <option value="">Select dose...</option>
            {secDosages.doses.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      );
    }
    // Primary testosterone doses — use hrt_type from protocol to show correct gender doses
    const hrtType = selectedProtocol?.hrt_type;
    const showMale = !hrtType || hrtType === 'male';
    const showFemale = !hrtType || hrtType === 'female';
    return (
      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          Dose{hrtType ? ` (${hrtType === 'female' ? 'Female' : 'Male'} HRT)` : ''}
        </label>
        <select value={dosage} onChange={e => setDosage(e.target.value)} style={styles.select}>
          <option value="">Select dose...</option>
          {showFemale && (
            <optgroup label="Female">
              {TESTOSTERONE_DOSES.female?.map(d => <option key={d.value || d.label} value={d.label}>{d.label}</option>)}
            </optgroup>
          )}
          {showMale && (
            <optgroup label="Male">
              {TESTOSTERONE_DOSES.male?.map(d => <option key={d.value || d.label} value={d.label}>{d.label}</option>)}
            </optgroup>
          )}
        </select>
      </div>
    );
  }

  if (categoryId === 'weight_loss' && medication) {
    const doses = WEIGHT_LOSS_DOSAGES[medication];
    if (doses) {
      return (
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Dosage</label>
          <select value={dosage} onChange={e => setDosage(e.target.value)} style={styles.select}>
            <option value="">Select dose...</option>
            {doses.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      );
    }
  }

  // For other categories, just show a text input if medication is selected
  if (medication && !['hbot', 'red_light', 'iv_therapy'].includes(categoryId)) {
    return (
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Dosage (optional)</label>
        <input type="text" value={dosage} onChange={e => setDosage(e.target.value)} style={styles.input} placeholder="e.g., 500mcg" />
      </div>
    );
  }

  return null;
}

// ================================================================
// HELPER: Format supply type for display
// ================================================================
function formatSupplyType(st) {
  const labels = {
    prefilled_1week: '1 Week Pre-filled (2 injections)',
    prefilled_2week: '2 Week Pre-filled (4 injections)',
    prefilled_3week: '3 Week Pre-filled (6 injections)',
    prefilled_4week: '4 Week Pre-filled (8 injections)',
    prefilled_8week: '8 Week Pre-filled (16 injections)',
    vial_5ml: '5ml Vial',
    vial_10ml: '10ml Vial',
    vial: 'Vial',
  };
  return labels[st] || st;
}

// ================================================================
// STYLES
// ================================================================
const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '40px 20px',
    overflowY: 'auto',
  },
  modal: {
    background: '#fff',
    width: '100%',
    maxWidth: '580px',
    border: '1px solid #e5e5e5',
    maxHeight: 'calc(100vh - 80px)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
  },
  headerSub: {
    fontSize: '13px',
    color: '#666',
    marginTop: '2px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: '#999',
  },
  steps: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderBottom: '1px solid #f0f0f0',
  },
  stepDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 600,
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
  },

  // Search
  searchWrap: {
    position: 'relative',
    marginBottom: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 14px 12px 40px',
    border: '1px solid #ddd',
    borderRadius: 0,
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  searchSpinner: {
    position: 'absolute',
    right: '14px',
    top: '13px',
    fontSize: '13px',
    color: '#999',
  },

  // Patient list
  patientList: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  patientItem: {
    padding: '14px 16px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background 0.1s',
  },

  // Patient card
  patientCard: {
    padding: '14px 16px',
    background: '#f5f5f5',
    border: '1px solid #e5e5e5',
    marginBottom: '20px',
    position: 'relative',
  },
  changeBtn: {
    position: 'absolute',
    right: '12px',
    top: '14px',
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },

  // Category grid
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  categoryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px 12px',
    border: '1px solid #e5e5e5',
    background: '#fff',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },

  // Coverage card
  coverageCard: {
    padding: '14px 16px',
    border: '1px solid #e5e5e5',
    marginBottom: '20px',
  },

  // Form fields
  fieldGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: '#666',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: 0,
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: 0,
    fontSize: '14px',
    background: '#fff',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  radioGroup: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },

  // Category badge
  catBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
  },

  // Back button
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
    padding: '4px 0',
    marginBottom: '12px',
  },

  // Confirmation
  confirmCard: {
    border: '1px solid #e5e5e5',
    padding: '20px',
    marginTop: '16px',
    marginBottom: '20px',
  },
  confirmRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  confirmLabel: {
    fontSize: '13px',
    color: '#666',
  },
  confirmValue: {
    fontSize: '14px',
    fontWeight: 500,
  },

  // Buttons
  primaryBtn: {
    width: '100%',
    padding: '14px 20px',
    background: '#000',
    color: '#fff',
    border: 'none',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  secondaryBtn: {
    padding: '12px 24px',
    background: '#fff',
    color: '#000',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },

  // Payment option
  paymentOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    border: '1px solid #e5e5e5',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.1s',
  },

  // Error
  errorMsg: {
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '12px',
  },
};
