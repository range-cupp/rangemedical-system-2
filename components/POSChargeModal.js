// POS Charge Modal — Range Medical
// Multi-step: Select Service → Payment Method → Processing → Result
// Fetches services from DB, supports discounts, optional patient pre-selection

import { useState, useEffect, useRef } from 'react';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatPrice } from '../lib/pos-pricing';

// Category display order and labels
const CATEGORY_ORDER = [
  'programs', 'combo_membership', 'hbot', 'red_light', 'hrt', 'weight_loss',
  'iv_therapy', 'specialty_iv', 'injection_standard', 'injection_premium',
  'injection_pack', 'nad_injection', 'peptide', 'labs', 'assessment', 'custom',
];
const CATEGORY_LABELS = {
  programs: 'Programs',
  combo_membership: 'Combo Memberships',
  hbot: 'HBOT',
  red_light: 'Red Light',
  hrt: 'HRT',
  weight_loss: 'Weight Loss',
  iv_therapy: 'IV Therapy',
  specialty_iv: 'Specialty IVs',
  injection_standard: 'Injections',
  injection_premium: 'Premium Injections',
  injection_pack: 'Injection Packs',
  nad_injection: 'NAD+ Injections',
  peptide: 'Peptides',
  labs: 'Lab Panels',
  assessment: 'Assessment',
  custom: 'Custom',
};

// ============================================================
// Inner component (must be inside <Elements> provider)
// ============================================================
function POSChargeForm({ patient: initialPatient, onClose, onChargeComplete }) {
  const stripe = useStripe();
  const elements = useElements();

  // Patient state (for when no patient is pre-selected)
  const [patient, setPatient] = useState(initialPatient || null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const searchTimeout = useRef(null);

  // Steps: 'patient' | 'select' | 'payment' | 'processing' | 'result'
  const [step, setStep] = useState(initialPatient ? 'select' : 'patient');

  // Services from DB
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [categories, setCategories] = useState([]);

  const [activeCategory, setActiveCategory] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [cartWarning, setCartWarning] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Discount state
  const [discountType, setDiscountType] = useState('none'); // 'none' | 'percent' | 'dollar'
  const [discountValue, setDiscountValue] = useState('');

  // Payment state
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [saveNewCard, setSaveNewCard] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  // Result state
  const [resultStatus, setResultStatus] = useState(null);
  const [resultMessage, setResultMessage] = useState('');

  // Invoice state
  const [showInvoiceSend, setShowInvoiceSend] = useState(false);
  const [invoiceSending, setInvoiceSending] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState(null); // { success, url, message }

  // Load services from DB on mount
  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch('/api/pos/services?active=true');
        const data = await res.json();
        const svc = data.services || [];
        setServices(svc);

        // Build category list from returned services, in preferred order
        const cats = [];
        for (const cat of CATEGORY_ORDER) {
          if (cat === 'custom' || svc.some(s => s.category === cat)) {
            cats.push(cat);
          }
        }
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0]);
      } catch (err) {
        console.error('Load services error:', err);
      }
      setLoadingServices(false);
    }
    loadServices();
  }, []);

  // Patient search
  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2) {
      setPatientResults([]);
      setShowPatientDropdown(false);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}`);
        const data = await res.json();
        setPatientResults(data.patients || []);
        setShowPatientDropdown(true);
      } catch (err) {
        console.error('Patient search error:', err);
      }
      setSearchingPatients(false);
    }, 300);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [patientSearch]);

  // Load saved cards when entering payment step
  useEffect(() => {
    if (step === 'payment' && patient) {
      loadSavedCards();
    }
  }, [step]);

  async function loadSavedCards() {
    setLoadingCards(true);
    try {
      const res = await fetch(`/api/stripe/saved-cards?patient_id=${patient.id}`);
      const data = await res.json();
      setSavedCards(data.cards || []);
      if (data.cards?.length > 0) {
        setSelectedCard(data.cards[0].id);
      } else {
        setSelectedCard('new');
      }
    } catch (err) {
      console.error('Load cards error:', err);
      setSelectedCard('new');
    }
    setLoadingCards(false);
  }

  function getItemsByCategory(categoryId) {
    return services.filter(s => s.category === categoryId);
  }

  // Parse peptide names into groups: "Peptide Protocol — 10 Day — BPC-157 (500mcg)"
  // → { baseName: "BPC-157", duration: "10 Day", detail: "500mcg", shortLabel: "10 Day · 500mcg" }
  function getGroupedPeptides() {
    const items = getItemsByCategory('peptide');
    const groups = {};

    for (const item of items) {
      const parts = item.name.split(' — ');
      if (parts.length < 3) {
        // Fallback for non-standard names
        if (!groups['Other']) groups['Other'] = [];
        groups['Other'].push({ ...item, shortLabel: item.name, duration: '', detail: '' });
        continue;
      }

      const duration = parts[1].trim(); // "10 Day"
      const peptidePart = parts.slice(2).join(' — ').trim(); // "BPC-157 (500mcg)"

      // Split base name from parenthetical detail
      const parenMatch = peptidePart.match(/^(.+?)\s*\((.+)\)$/);
      let baseName, detail;
      if (parenMatch) {
        baseName = parenMatch[1].trim();
        detail = parenMatch[2].trim();
      } else {
        baseName = peptidePart;
        detail = '';
      }

      const shortLabel = detail ? `${duration} · ${detail}` : duration;

      if (!groups[baseName]) groups[baseName] = [];
      groups[baseName].push({ ...item, shortLabel, duration, detail, baseName });
    }

    // Sort groups: most items first, then alphabetically
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groups[b].length !== groups[a].length) return groups[b].length - groups[a].length;
      return a.localeCompare(b);
    });

    // Sort variants within each group by duration then detail
    const durationOrder = { '10 Day': 1, '20 Day': 2, '30 Day': 3 };
    for (const key of sortedKeys) {
      groups[key].sort((a, b) => {
        const da = durationOrder[a.duration] || 99;
        const db = durationOrder[b.duration] || 99;
        if (da !== db) return da - db;
        return a.detail.localeCompare(b.detail);
      });
    }

    return { groups, sortedKeys };
  }

  function getSearchResults() {
    const q = serviceSearch.toLowerCase().trim();
    if (!q) return [];
    return services.filter(s => s.name.toLowerCase().includes(q));
  }

  const isSearching = serviceSearch.trim().length > 0;
  const searchResults = isSearching ? getSearchResults() : [];

  function toggleCartItem(item) {
    const exists = cartItems.find(i => i.id === item.id);
    if (exists) {
      setCartItems(cartItems.filter(i => i.id !== item.id));
      return;
    }
    if (item.recurring && cartItems.length > 0) {
      setCartWarning('Recurring items must be checked out alone');
      setTimeout(() => setCartWarning(''), 3000);
      return;
    }
    if (!item.recurring && cartItems.some(i => i.recurring)) {
      setCartWarning('Cannot add items when a recurring item is in cart');
      setTimeout(() => setCartWarning(''), 3000);
      return;
    }
    setCartItems([...cartItems, item]);
  }

  function getBaseAmount() {
    if (activeCategory === 'custom') {
      const dollars = parseFloat(customAmount);
      return isNaN(dollars) ? 0 : Math.round(dollars * 100);
    }
    return cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  }

  function getDiscountCents() {
    const base = getBaseAmount();
    const val = parseFloat(discountValue);
    if (!val || val <= 0 || discountType === 'none') return 0;

    if (discountType === 'percent') {
      return Math.round(base * (Math.min(val, 100) / 100));
    }
    if (discountType === 'dollar') {
      return Math.min(Math.round(val * 100), base);
    }
    return 0;
  }

  function getChargeAmount() {
    return Math.max(getBaseAmount() - getDiscountCents(), 0);
  }

  function getChargeDescription() {
    if (activeCategory === 'custom') {
      return customDescription || 'Custom charge';
    }
    if (cartItems.length === 0) return '';
    return cartItems.map(i => i.name).join(', ');
  }

  function isRecurring() {
    return cartItems.length === 1 && !!cartItems[0]?.recurring;
  }

  function canProceedToPayment() {
    if (activeCategory === 'custom') {
      return parseFloat(customAmount) > 0;
    }
    return cartItems.length > 0;
  }

  function getResultMessage(amount) {
    const hasPeptides = cartItems.some(i => i.category === 'peptide');
    const suffix = hasPeptides ? '\nProtocol created & journey started' : '';
    if (activeCategory === 'custom' || cartItems.length <= 1) {
      return `Charged ${formatPrice(amount)} for ${getChargeDescription()}${suffix}`;
    }
    return `Charged ${formatPrice(amount)} for ${cartItems.length} items${suffix}`;
  }

  function getDiscountData() {
    if (discountType === 'none' || !parseFloat(discountValue)) return {};
    return {
      discount_type: discountType,
      discount_amount: parseFloat(discountValue),
      original_amount: getBaseAmount(),
    };
  }

  async function handleSendInvoice(via) {
    if (!patient) return;
    setInvoiceSending(true);
    try {
      const items = cartItems.map(item => ({
        name: item.name,
        category: item.category,
        price_cents: item.price,
        quantity: 1,
      }));
      const baseAmount = getBaseAmount();
      const discountCentsVal = getDiscountCents();
      const finalAmountVal = getChargeAmount();

      // Create invoice
      const createRes = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          patient_name: patient.name,
          patient_email: patient.email,
          patient_phone: patient.phone,
          items,
          subtotal_cents: baseAmount,
          discount_cents: discountCentsVal,
          discount_description: discountType !== 'none' ? `${discountValue}${discountType === 'percent' ? '%' : '$'} off` : null,
          total_cents: finalAmountVal,
          created_by: 'pos_modal',
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Could not create invoice');

      // Send invoice
      const sendRes = await fetch(`/api/invoices/${createData.invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ via }),
      });
      if (!sendRes.ok) throw new Error('Could not send invoice');

      setInvoiceResult({ success: true, url: createData.payment_url, message: `Invoice sent to ${patient.name}` });
      setShowInvoiceSend(false);
    } catch (err) {
      setInvoiceResult({ success: false, message: err.message });
    } finally {
      setInvoiceSending(false);
    }
  }

  async function recordPurchases(extraFields) {
    const baseTotal = getBaseAmount();
    const discountTotal = getDiscountCents();
    const discountSuffix = discountType === 'percent'
      ? `${discountValue}% off`
      : `$${discountValue} off`;

    // Custom charge — single record
    if (activeCategory === 'custom') {
      const amount = getChargeAmount();
      const desc = getChargeDescription();
      const discountData = getDiscountData();
      await fetch('/api/stripe/record-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          amount,
          description: discountData.discount_type ? `${desc} (${discountSuffix})` : desc,
          payment_method: 'stripe',
          service_category: activeCategory,
          service_name: customDescription,
          ...discountData,
          ...extraFields,
        }),
      });
      return;
    }

    // Cart items — one record per item with proportional discount
    for (const item of cartItems) {
      const itemBase = item.price || 0;
      const itemDiscount = baseTotal > 0
        ? Math.round(discountTotal * (itemBase / baseTotal))
        : 0;
      const itemAmount = Math.max(itemBase - itemDiscount, 0);
      const itemName = item.name;

      await fetch('/api/stripe/record-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          amount: itemAmount,
          description: itemDiscount > 0 ? `${itemName} (${discountSuffix})` : itemName,
          payment_method: 'stripe',
          service_category: item.category,
          service_name: itemName,
          ...(itemDiscount > 0 ? {
            discount_type: discountType,
            discount_amount: parseFloat(discountValue),
            original_amount: itemBase,
          } : {}),
          ...extraFields,
        }),
      });
    }
  }

  // After successful payment, auto-create protocols for peptide purchases
  // Patient has already done consult + forms, so start at 'dispensed' stage
  async function createProtocolsForPeptides() {
    if (!patient) return;

    const peptideItems = cartItems.filter(i => i.category === 'peptide');
    if (peptideItems.length === 0) return;

    for (const item of peptideItems) {
      try {
        // Parse: "Peptide Protocol — 10 Day — BPC-157 (500mcg)"
        const parts = item.name.split(' — ');
        if (parts.length < 3) continue;

        const durationStr = parts[1].trim(); // "10 Day"
        const peptidePart = parts.slice(2).join(' — ').trim(); // "BPC-157 (500mcg)"
        const duration = parseInt(durationStr) || 10;

        // Split base name from dose detail
        const parenMatch = peptidePart.match(/^(.+?)\s*\((.+)\)$/);
        const medication = parenMatch ? parenMatch[1].trim() : peptidePart;
        const dosage = parenMatch ? parenMatch[2].trim() : '';

        const today = new Date();
        const startDate = today.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); // YYYY-MM-DD

        await fetch('/api/admin/protocols/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patient.id,
            ghl_contact_id: patient.ghl_contact_id || null,
            protocolType: 'peptide',
            patientName: patient.name,
            patientPhone: patient.phone || '',
            patientEmail: patient.email || '',
            medication,
            dosage,
            frequency: 'daily',
            deliveryMethod: 'Subcutaneous Injection',
            startDate,
            duration,
            notes: `Auto-created from POS purchase: ${item.name}`,
            initial_journey_stage: 'dispensed',
            source: 'pos',
          }),
        });

        console.log(`✓ Protocol auto-created for ${patient.name}: ${medication} ${duration}-day`);
      } catch (err) {
        console.error('Auto-create protocol error (non-fatal):', err);
        // Don't fail the payment over protocol creation issues
      }
    }
  }

  async function handlePay() {
    const amount = getChargeAmount();
    const description = getChargeDescription();

    // $0 comp — skip Stripe entirely, just record the purchase
    if (amount === 0) {
      setStep('processing');
      try {
        await recordPurchases({ payment_method: 'comp' });
        await createProtocolsForPeptides();
        setResultStatus('success');
        setResultMessage(`Comped ${description} for ${patient.name}`);
        setStep('result');
      } catch (error) {
        console.error('Comp recording error:', error);
        setResultStatus('error');
        setResultMessage(error.message || 'Failed to record comp');
        setStep('result');
      }
      return;
    }

    if (!stripe || !elements) return;

    setStep('processing');

    try {
      // For recurring items, create a subscription
      if (isRecurring()) {
        if (selectedCard === 'new') {
          const saveResult = await saveCardFirst();
          if (!saveResult) return;
        }

        const subRes = await fetch('/api/stripe/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patient.id,
            price_amount: amount,
            interval: cartItems[0].interval || 'month',
            description,
          }),
        });

        const subData = await subRes.json();
        if (!subRes.ok) throw new Error(subData.error);

        await recordPurchases({
          stripe_subscription_id: subData.subscription_id,
          description: `${description} (monthly subscription)`,
        });

        setResultStatus('success');
        setResultMessage(`Subscription created for ${description} — ${formatPrice(amount)}/mo`);
        setStep('result');
        return;
      }

      // One-time charge
      if (selectedCard === 'new') {
        if (saveNewCard) {
          const saved = await saveCardFirst();
          if (!saved) return;
          await chargeWithSavedCard(saved, amount, description);
        } else {
          await chargeWithNewCard(amount, description);
        }
      } else {
        await chargeWithSavedCard(selectedCard, amount, description);
      }

    } catch (error) {
      console.error('Payment error:', error);
      setResultStatus('error');
      setResultMessage(error.message || 'Payment failed');
      setStep('result');
    }
  }

  async function saveCardFirst() {
    const setupRes = await fetch('/api/stripe/saved-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patient.id }),
    });

    const setupData = await setupRes.json();
    if (!setupRes.ok) throw new Error(setupData.error);

    const cardElement = elements.getElement(CardElement);
    const { error, setupIntent } = await stripe.confirmCardSetup(setupData.client_secret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setResultStatus('error');
      setResultMessage(error.message);
      setStep('result');
      return null;
    }

    return setupIntent.payment_method;
  }

  async function chargeWithNewCard(amount, description) {
    const piRes = await fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patient.id,
        amount,
        description,
      }),
    });

    const piData = await piRes.json();
    if (!piRes.ok) throw new Error(piData.error);

    const cardElement = elements.getElement(CardElement);
    const { error, paymentIntent } = await stripe.confirmCardPayment(piData.client_secret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setResultStatus('error');
      setResultMessage(error.message);
      setStep('result');
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      await recordPurchases({ stripe_payment_intent_id: paymentIntent.id });
      await createProtocolsForPeptides();

      setResultStatus('success');
      setResultMessage(getResultMessage(amount));
      setStep('result');
    }
  }

  async function chargeWithSavedCard(paymentMethodId, amount, description) {
    const piRes = await fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patient.id,
        amount,
        description,
        payment_method_id: paymentMethodId,
      }),
    });

    const piData = await piRes.json();
    if (!piRes.ok) throw new Error(piData.error);

    if (piData.status === 'succeeded') {
      await recordPurchases({ stripe_payment_intent_id: piData.payment_intent_id });
      await createProtocolsForPeptides();

      setResultStatus('success');
      setResultMessage(getResultMessage(amount));
      setStep('result');
      return;
    }

    if (piData.status === 'requires_action' || piData.status === 'requires_confirmation') {
      const { error, paymentIntent } = await stripe.confirmCardPayment(piData.client_secret);

      if (error) {
        setResultStatus('error');
        setResultMessage(error.message);
        setStep('result');
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        await recordPurchases({ stripe_payment_intent_id: paymentIntent.id });
        await createProtocolsForPeptides();

        setResultStatus('success');
        setResultMessage(getResultMessage(amount));
        setStep('result');
      }
    }
  }

  function handleClose() {
    setStep(initialPatient ? 'select' : 'patient');
    setPatient(initialPatient || null);
    setPatientSearch('');
    setCartItems([]);
    setCartWarning('');
    setServiceSearch('');
    setCustomAmount('');
    setCustomDescription('');
    setSelectedCard(null);
    setSaveNewCard(false);
    setDiscountType('none');
    setDiscountValue('');
    setResultStatus(null);
    setResultMessage('');
    onClose();
  }

  function handleDone() {
    if (resultStatus === 'success' && onChargeComplete) {
      onChargeComplete();
    }
    handleClose();
  }

  // ============================================================
  // RENDER
  // ============================================================

  const hasDiscount = discountType !== 'none' && parseFloat(discountValue) > 0;
  const baseAmount = getBaseAmount();
  const discountCents = getDiscountCents();
  const finalAmount = getChargeAmount();

  return (
    <>
      <div style={modalStyles.overlay} onClick={handleClose} />
      <div style={modalStyles.modal}>
        {/* Header */}
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>
            {step === 'patient' && 'Select Patient'}
            {step === 'select' && 'Charge Patient'}
            {step === 'payment' && 'Payment Method'}
            {step === 'processing' && 'Processing...'}
            {step === 'result' && (resultStatus === 'success' ? 'Payment Complete' : 'Payment Failed')}
          </h2>
          {patient && step !== 'patient' && (
            <div style={modalStyles.patientName}>{patient.name}</div>
          )}
          <button style={modalStyles.closeBtn} onClick={handleClose}>×</button>
        </div>

        {/* Step 0: Patient Search (when no patient pre-selected) */}
        {step === 'patient' && (
          <div style={modalStyles.body}>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search patient by name..."
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                style={modalStyles.input}
                autoFocus
              />
              {searchingPatients && (
                <div style={{ position: 'absolute', right: '12px', top: '12px', color: '#888', fontSize: '13px' }}>
                  Searching...
                </div>
              )}
              {showPatientDropdown && patientResults.length > 0 && (
                <div style={modalStyles.dropdown}>
                  {patientResults.map(p => (
                    <div
                      key={p.id}
                      style={modalStyles.dropdownItem}
                      onClick={() => {
                        setPatient(p);
                        setPatientSearch('');
                        setShowPatientDropdown(false);
                        setStep('select');
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      {p.email && <div style={{ fontSize: '12px', color: '#888' }}>{p.email}</div>}
                    </div>
                  ))}
                </div>
              )}
              {showPatientDropdown && patientResults.length === 0 && patientSearch.length >= 2 && !searchingPatients && (
                <div style={modalStyles.dropdown}>
                  <div style={{ padding: '12px', color: '#888', textAlign: 'center' }}>No patients found</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Service Selection */}
        {step === 'select' && (
          <div style={modalStyles.body}>
            {loadingServices ? (
              <div style={modalStyles.loading}>Loading services...</div>
            ) : (
              <>
                {/* Service Search */}
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={e => setServiceSearch(e.target.value)}
                    style={modalStyles.input}
                  />
                </div>

                {/* Category Tabs (hidden while searching) */}
                {!isSearching && (
                  <div style={modalStyles.categoryTabs}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        style={{
                          ...modalStyles.categoryTab,
                          ...(activeCategory === cat ? modalStyles.categoryTabActive : {}),
                        }}
                        onClick={() => {
                          setActiveCategory(cat);
                          setDiscountType('none');
                          setDiscountValue('');
                        }}
                      >
                        {CATEGORY_LABELS[cat] || cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Service Items */}
                {isSearching ? (
                  searchResults.length > 0 ? (
                    <div style={modalStyles.itemGrid}>
                      {searchResults.map(item => (
                        <button
                          key={item.id}
                          style={{
                            ...modalStyles.itemCard,
                            ...(cartItems.some(i => i.id === item.id) ? modalStyles.itemCardSelected : {}),
                          }}
                          onClick={() => toggleCartItem(item)}
                        >
                          {cartItems.some(i => i.id === item.id) && (
                            <span style={modalStyles.inCartBadge}>&#10003;</span>
                          )}
                          <div style={modalStyles.itemName}>{item.name}</div>
                          <div style={modalStyles.itemPrice}>
                            {formatPrice(item.price)}
                            {item.recurring && <span style={modalStyles.recurringBadge}>/mo</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No services match "{serviceSearch}"</div>
                  )
                ) : activeCategory === 'peptide' ? (
                  // Grouped peptide view
                  (() => {
                    const { groups, sortedKeys } = getGroupedPeptides();
                    return (
                      <div style={{ marginBottom: '16px' }}>
                        {sortedKeys.map(groupName => (
                          <div key={groupName} style={modalStyles.peptideGroup}>
                            <div style={modalStyles.peptideGroupHeader}>{groupName}</div>
                            <div style={modalStyles.peptideGroupGrid}>
                              {groups[groupName].map(item => (
                                <button
                                  key={item.id}
                                  style={{
                                    ...modalStyles.peptideVariantCard,
                                    ...(cartItems.some(i => i.id === item.id) ? modalStyles.itemCardSelected : {}),
                                  }}
                                  onClick={() => toggleCartItem(item)}
                                >
                                  {cartItems.some(i => i.id === item.id) && (
                                    <span style={modalStyles.inCartBadge}>&#10003;</span>
                                  )}
                                  <div style={modalStyles.peptideVariantLabel}>{item.shortLabel}</div>
                                  <div style={modalStyles.itemPrice}>{formatPrice(item.price)}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : activeCategory !== 'custom' ? (
                  <div style={modalStyles.itemGrid}>
                    {getItemsByCategory(activeCategory).map(item => (
                      <button
                        key={item.id}
                        style={{
                          ...modalStyles.itemCard,
                          ...(cartItems.some(i => i.id === item.id) ? modalStyles.itemCardSelected : {}),
                        }}
                        onClick={() => toggleCartItem(item)}
                      >
                        {cartItems.some(i => i.id === item.id) && (
                          <span style={modalStyles.inCartBadge}>&#10003;</span>
                        )}
                        <div style={modalStyles.itemName}>{item.name}</div>
                        <div style={modalStyles.itemPrice}>
                          {formatPrice(item.price)}
                          {item.recurring && <span style={modalStyles.recurringBadge}>/mo</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={modalStyles.customForm}>
                    <div style={modalStyles.fieldGroup}>
                      <label style={modalStyles.label}>Amount ($)</label>
                      <input
                        type="number"
                        min="0.50"
                        step="0.01"
                        value={customAmount}
                        onChange={e => setCustomAmount(e.target.value)}
                        placeholder="0.00"
                        style={modalStyles.input}
                      />
                    </div>
                    <div style={modalStyles.fieldGroup}>
                      <label style={modalStyles.label}>Description</label>
                      <input
                        type="text"
                        value={customDescription}
                        onChange={e => setCustomDescription(e.target.value)}
                        placeholder="What is this charge for?"
                        style={modalStyles.input}
                      />
                    </div>
                  </div>
                )}

                {/* Cart Summary */}
                {cartItems.length > 0 && activeCategory !== 'custom' && (
                  <div style={modalStyles.cartSection}>
                    <div style={modalStyles.discountLabel}>
                      Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                    </div>
                    {cartItems.map(item => (
                      <div key={item.id} style={modalStyles.cartRow}>
                        <span style={{ flex: 1, fontSize: '14px' }}>{item.name}</span>
                        <span style={{ fontSize: '14px', fontWeight: 500, marginRight: '8px' }}>
                          {formatPrice(item.price)}
                        </span>
                        <button
                          style={modalStyles.cartRemoveBtn}
                          onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <div style={modalStyles.cartTotal}>
                      <span>Total</span>
                      <span>{formatPrice(cartItems.reduce((sum, i) => sum + (i.price || 0), 0))}</span>
                    </div>
                  </div>
                )}

                {/* Cart Warning */}
                {cartWarning && (
                  <div style={modalStyles.cartWarning}>{cartWarning}</div>
                )}

                {/* Discount Section */}
                {canProceedToPayment() && (
                  <div style={modalStyles.discountSection}>
                    <div style={modalStyles.discountLabel}>Discount</div>
                    <div style={modalStyles.discountRow}>
                      <div style={modalStyles.discountToggle}>
                        {['none', 'percent', 'dollar'].map(type => (
                          <button
                            key={type}
                            style={{
                              ...modalStyles.discountBtn,
                              ...(discountType === type ? modalStyles.discountBtnActive : {}),
                            }}
                            onClick={() => {
                              setDiscountType(type);
                              setDiscountValue('');
                            }}
                          >
                            {type === 'none' ? 'None' : type === 'percent' ? '% Off' : '$ Off'}
                          </button>
                        ))}
                      </div>
                      {discountType !== 'none' && (
                        <div style={modalStyles.discountInputWrap}>
                          {discountType === 'dollar' && <span style={modalStyles.discountPrefix}>$</span>}
                          <input
                            type="number"
                            min="0"
                            step={discountType === 'percent' ? '1' : '0.01'}
                            max={discountType === 'percent' ? '100' : undefined}
                            value={discountValue}
                            onChange={e => setDiscountValue(e.target.value)}
                            placeholder={discountType === 'percent' ? '10' : '25.00'}
                            style={modalStyles.discountInput}
                          />
                          {discountType === 'percent' && <span style={modalStyles.discountSuffix}>%</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Charge Summary + Next */}
                <div style={modalStyles.footer}>
                  {canProceedToPayment() && (
                    <div style={modalStyles.summaryLine}>
                      <div>{getChargeDescription()}</div>
                      {hasDiscount ? (
                        <div>
                          <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '8px' }}>
                            {formatPrice(baseAmount)}
                          </span>
                          <strong style={{ color: '#16A34A' }}>{formatPrice(finalAmount)}</strong>
                          <span style={{ fontSize: '12px', color: '#888', marginLeft: '6px' }}>
                            (save {formatPrice(discountCents)})
                          </span>
                        </div>
                      ) : (
                        <strong>{formatPrice(baseAmount)}{isRecurring() ? ' /mo' : ''}</strong>
                      )}
                    </div>
                  )}
                  {!initialPatient && (
                    <button style={modalStyles.secondaryBtn} onClick={() => {
                      setPatient(null);
                      setStep('patient');
                    }}>
                      Change Patient
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button
                      style={{
                        ...modalStyles.primaryBtn,
                        flex: 1,
                        ...(canProceedToPayment() ? {} : modalStyles.disabledBtn),
                      }}
                      disabled={!canProceedToPayment()}
                      onClick={() => setStep('payment')}
                    >
                      Continue to Payment
                    </button>
                    {patient && canProceedToPayment() && (
                      <button
                        style={{ ...modalStyles.secondaryBtn, flex: 1, background: '#f0f9ff', color: '#1e40af', borderColor: '#bfdbfe' }}
                        onClick={() => setShowInvoiceSend(true)}
                      >
                        Send Invoice
                      </button>
                    )}
                  </div>

                  {/* Invoice send options */}
                  {showInvoiceSend && (
                    <div style={{ marginTop: '12px', padding: '14px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#1e40af' }}>Send invoice via:</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleSendInvoice('sms')}
                          disabled={invoiceSending}
                          style={{ padding: '8px 16px', border: '1px solid #bfdbfe', borderRadius: '6px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                        >
                          SMS
                        </button>
                        <button
                          onClick={() => handleSendInvoice('email')}
                          disabled={invoiceSending}
                          style={{ padding: '8px 16px', border: '1px solid #bfdbfe', borderRadius: '6px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                        >
                          Email
                        </button>
                        <button
                          onClick={() => handleSendInvoice('both')}
                          disabled={invoiceSending}
                          style={{ padding: '8px 16px', border: '1px solid #bfdbfe', borderRadius: '6px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                        >
                          Both
                        </button>
                        <button
                          onClick={() => setShowInvoiceSend(false)}
                          style={{ padding: '8px 16px', border: '1px solid #e5e5e5', borderRadius: '6px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#888' }}
                        >
                          Cancel
                        </button>
                      </div>
                      {invoiceSending && <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Sending...</p>}
                    </div>
                  )}

                  {/* Invoice result */}
                  {invoiceResult && (
                    <div style={{ marginTop: '12px', padding: '14px', background: invoiceResult.success ? '#dcfce7' : '#fee2e2', borderRadius: '8px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: invoiceResult.success ? '#166534' : '#dc2626' }}>
                        {invoiceResult.message}
                      </p>
                      {invoiceResult.success && invoiceResult.url && (
                        <div style={{ marginTop: '8px' }}>
                          <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Payment link:</p>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input
                              type="text"
                              readOnly
                              value={invoiceResult.url}
                              style={{ flex: 1, padding: '6px 10px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', background: '#fff' }}
                              onClick={e => e.target.select()}
                            />
                            <button
                              onClick={() => navigator.clipboard.writeText(invoiceResult.url)}
                              style={{ padding: '6px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', background: '#fff', fontSize: '12px', cursor: 'pointer' }}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => { setInvoiceResult(null); onClose(); onChargeComplete && onChargeComplete(); }}
                        style={{ ...modalStyles.primaryBtn, marginTop: '10px', background: invoiceResult.success ? '#166534' : '#000' }}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Payment Method */}
        {step === 'payment' && (
          <div style={modalStyles.body}>
            <div style={{
              ...modalStyles.chargeSummary,
              ...(cartItems.length > 1 ? { flexDirection: 'column', gap: '4px' } : {}),
            }}>
              {cartItems.length > 1 ? (
                <>
                  {cartItems.map(item => (
                    <div key={item.id} style={modalStyles.summaryItemRow}>
                      <span>{item.name}</span>
                      <span>{formatPrice(item.price)}</span>
                    </div>
                  ))}
                  <div style={modalStyles.summaryTotalRow}>
                    <span>Total</span>
                    <div>
                      {hasDiscount && (
                        <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '8px', fontSize: '13px' }}>
                          {formatPrice(baseAmount)}
                        </span>
                      )}
                      <strong>{formatPrice(finalAmount)}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span>{getChargeDescription()}</span>
                  <div>
                    {hasDiscount && (
                      <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '8px', fontSize: '13px' }}>
                        {formatPrice(baseAmount)}
                      </span>
                    )}
                    <strong>{formatPrice(finalAmount)}{isRecurring() ? '/mo' : ''}</strong>
                  </div>
                </>
              )}
            </div>

            {loadingCards ? (
              <div style={modalStyles.loading}>Loading saved cards...</div>
            ) : (
              <>
                {/* Saved Cards */}
                {savedCards.length > 0 && (
                  <div style={modalStyles.cardList}>
                    <div style={modalStyles.sectionLabel}>Saved Cards</div>
                    {savedCards.map(card => (
                      <label key={card.id} style={modalStyles.cardOption}>
                        <input
                          type="radio"
                          name="payment_method"
                          checked={selectedCard === card.id}
                          onChange={() => setSelectedCard(card.id)}
                        />
                        <span style={modalStyles.cardBrand}>{card.brand.toUpperCase()}</span>
                        <span>•••• {card.last4}</span>
                        <span style={modalStyles.cardExp}>{card.exp_month}/{card.exp_year}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* New Card Option */}
                <div style={modalStyles.cardList}>
                  <label style={modalStyles.cardOption}>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedCard === 'new'}
                      onChange={() => setSelectedCard('new')}
                    />
                    <span>Add New Card</span>
                  </label>

                  {selectedCard === 'new' && (
                    <div style={modalStyles.cardElementWrapper}>
                      <CardElement options={CARD_ELEMENT_OPTIONS} />
                      <label style={modalStyles.saveCardLabel}>
                        <input
                          type="checkbox"
                          checked={saveNewCard}
                          onChange={e => setSaveNewCard(e.target.checked)}
                        />
                        Save card for future charges
                      </label>
                    </div>
                  )}
                </div>
              </>
            )}

            <div style={modalStyles.footer}>
              <button style={modalStyles.secondaryBtn} onClick={() => setStep('select')}>
                Back
              </button>
              <button
                style={modalStyles.primaryBtn}
                onClick={handlePay}
                disabled={!stripe}
              >
                {isRecurring()
                  ? `Subscribe ${formatPrice(finalAmount)}/mo`
                  : `Pay ${formatPrice(finalAmount)}`
                }
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div style={modalStyles.body}>
            <div style={modalStyles.processingState}>
              <div style={modalStyles.spinner} />
              <p>Processing payment...</p>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 'result' && (
          <div style={modalStyles.body}>
            <div style={modalStyles.resultState}>
              {resultStatus === 'success' ? (
                <>
                  <div style={modalStyles.successIcon}>✓</div>
                  <p style={modalStyles.resultText}>{resultMessage}</p>
                </>
              ) : (
                <>
                  <div style={modalStyles.errorIcon}>✗</div>
                  <p style={modalStyles.resultText}>{resultMessage}</p>
                </>
              )}
            </div>
            <div style={modalStyles.footer}>
              {resultStatus === 'error' && (
                <button style={modalStyles.secondaryBtn} onClick={() => setStep('payment')}>
                  Try Again
                </button>
              )}
              <button style={modalStyles.primaryBtn} onClick={handleDone}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// Wrapper with Elements provider
// ============================================================
export default function POSChargeModal({ isOpen, onClose, patient, stripePromise, onChargeComplete }) {
  if (!isOpen) return null;

  return (
    <Elements stripe={stripePromise}>
      <POSChargeForm patient={patient} onClose={onClose} onChargeComplete={onChargeComplete} />
    </Elements>
  );
}

// ============================================================
// Stripe CardElement styling
// ============================================================
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a1a1a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': { color: '#a0a0a0' },
    },
    invalid: { color: '#dc2626' },
  },
};

// ============================================================
// Styles
// ============================================================
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#fff',
    borderRadius: '12px',
    width: '520px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1001,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  header: {
    padding: '20px 24px 16px',
    borderBottom: '1px solid #e5e7eb',
    position: 'relative',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#111',
  },
  patientName: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#999',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
  },
  body: {
    padding: '16px 24px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  categoryTabs: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  categoryTab: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: '13px',
    color: '#555',
    cursor: 'pointer',
    fontWeight: 500,
  },
  categoryTabActive: {
    background: '#16A34A',
    color: '#fff',
    border: '1px solid #16A34A',
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '16px',
  },
  itemCard: {
    position: 'relative',
    padding: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    background: '#fafafa',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.15s',
  },
  itemCardSelected: {
    borderColor: '#16A34A',
    background: '#f0fdf4',
  },
  // Grouped peptide styles
  peptideGroup: {
    marginBottom: '20px',
  },
  peptideGroupHeader: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#111',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    padding: '8px 0 8px 2px',
    borderBottom: '2px solid #111',
    marginBottom: '10px',
  },
  peptideGroupGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  peptideVariantCard: {
    position: 'relative',
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    background: '#fafafa',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.15s',
  },
  peptideVariantLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '3px',
  },
  itemName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111',
    marginBottom: '4px',
  },
  itemPrice: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#16A34A',
  },
  recurringBadge: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#666',
  },
  customForm: {
    marginBottom: '16px',
  },
  fieldGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#555',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  // Discount styles
  discountSection: {
    padding: '12px 16px',
    background: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #e5e7eb',
  },
  discountLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  discountRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  discountToggle: {
    display: 'flex',
    gap: '4px',
  },
  discountBtn: {
    padding: '5px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: '13px',
    color: '#555',
    cursor: 'pointer',
    fontWeight: 500,
  },
  discountBtnActive: {
    background: '#16A34A',
    color: '#fff',
    border: '1px solid #16A34A',
  },
  discountInputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
    maxWidth: '140px',
  },
  discountPrefix: {
    fontSize: '14px',
    color: '#555',
    fontWeight: 500,
  },
  discountSuffix: {
    fontSize: '14px',
    color: '#555',
    fontWeight: 500,
  },
  discountInput: {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  // Patient search dropdown
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10,
    maxHeight: '240px',
    overflowY: 'auto',
  },
  dropdownItem: {
    padding: '10px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
  },
  footer: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
    flexWrap: 'wrap',
  },
  summaryLine: {
    flex: 1,
    fontSize: '14px',
    color: '#333',
  },
  primaryBtn: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#16A34A',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#333',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  chargeSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f0fdf4',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '15px',
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    color: '#888',
  },
  cardList: {
    marginBottom: '12px',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  cardOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginBottom: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cardBrand: {
    fontWeight: 600,
    fontSize: '12px',
    color: '#333',
    background: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  cardExp: {
    color: '#999',
    fontSize: '13px',
    marginLeft: 'auto',
  },
  cardElementWrapper: {
    padding: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    marginTop: '8px',
    background: '#fafafa',
  },
  saveCardLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    fontSize: '13px',
    color: '#555',
    cursor: 'pointer',
  },
  processingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 0',
    color: '#555',
    fontSize: '15px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#16A34A',
    borderRadius: '50%',
    animation: 'pos-spin 0.8s linear infinite',
    marginBottom: '16px',
  },
  resultState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 0',
    textAlign: 'center',
  },
  successIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#16A34A',
    color: '#fff',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  errorIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#dc2626',
    color: '#fff',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  resultText: {
    fontSize: '15px',
    color: '#333',
    margin: 0,
  },
  // Cart styles
  cartSection: {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    border: '1px solid #e5e7eb',
  },
  cartRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  cartTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '8px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#111',
  },
  cartRemoveBtn: {
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  cartWarning: {
    background: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#92400e',
    marginBottom: '16px',
  },
  inCartBadge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#16A34A',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    width: '100%',
  },
  summaryTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid #d1d5db',
    paddingTop: '6px',
    marginTop: '4px',
    width: '100%',
  },
};
