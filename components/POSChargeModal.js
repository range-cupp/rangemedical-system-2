// POS Charge Modal — Range Medical
// Multi-step: Select Service → Payment Method → Processing → Result
// Fetches services from DB, supports discounts, optional patient pre-selection

import { useState, useEffect, useRef } from 'react';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatPrice } from '../lib/pos-pricing';

import { overlayClickProps } from './AdminLayout';

// Category display order and labels
const CATEGORY_ORDER = [
  'programs', 'combo_membership', 'hbot', 'red_light', 'hrt', 'weight_loss',
  'iv_therapy', 'specialty_iv', 'injection_standard', 'injection_premium',
  'injection_pack', 'nad_injection', 'injections', 'peptide', 'vials', 'supplements', 'labs', 'assessment', 'longevity', 'packages', 'prp', 'other', 'gift_card', 'custom',
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
  injections: 'Injections',
  peptide: 'Peptides',
  vials: 'Vials',
  supplements: 'Supplements',
  labs: 'Lab Panels',
  assessment: 'Assessment',
  longevity: 'Longevity',
  packages: 'Packages',
  prp: 'PRP Therapy',
  other: 'Other',
  gift_card: 'Gift Cards',
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
  const [expandedPeptideGroups, setExpandedPeptideGroups] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [cartWarning, setCartWarning] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Discount state
  const [discountType, setDiscountType] = useState('none'); // 'none' | 'percent' | 'dollar'
  const [discountValue, setDiscountValue] = useState('');

  // Shipping state (in dollars, converted to cents for charge)
  const [shippingAmount, setShippingAmount] = useState('');

  // Fulfillment state (for take-home medication: peptides, weight loss, HRT)
  const [fulfillmentMethod, setFulfillmentMethod] = useState('in_clinic');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Payment state
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [saveNewCard, setSaveNewCard] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  // Result state
  const [resultStatus, setResultStatus] = useState(null);
  const [resultMessage, setResultMessage] = useState('');

  // Gift card state (buying)
  const [giftCardCustomAmount, setGiftCardCustomAmount] = useState('');
  const [createdGiftCardCode, setCreatedGiftCardCode] = useState(null);

  // Gift card state (redeeming as payment)
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardLookup, setGiftCardLookup] = useState(null); // { id, code, remaining_amount, status }
  const [lookingUpGiftCard, setLookingUpGiftCard] = useState(false);

  // Account credit state
  const [creditBalanceCents, setCreditBalanceCents] = useState(0);
  const [loadingCredit, setLoadingCredit] = useState(false);

  // Split payment state
  const [splitCashAmount, setSplitCashAmount] = useState(''); // dollar string for cash portion
  const [splitCardSelection, setSplitCardSelection] = useState(null); // card id or 'new' for card portion

  // Skip patient notification (receipt email) state
  const [skipNotification, setSkipNotification] = useState(false);

  // Price override — edit charge amount on payment step
  const [editingCharge, setEditingCharge] = useState(false);

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
        // Strip redundant "(One-Time)" label from Tirzepatide/Retatrutide monthly
        // items — none of these meds have a subscription option, so the label is noise.
        const svc = (data.services || []).map(s => {
          const n = s.name || '';
          if (/tirzepatide|retatrutide/i.test(n) && /\(one-time\)/i.test(n)) {
            return { ...s, name: n.replace(/\s*\(one-time\)\s*/i, ' ').replace(/\s+/g, ' ').trim() };
          }
          return s;
        });
        setServices(svc);

        // Build category list from returned services, in preferred order
        const cats = [];
        for (const cat of CATEGORY_ORDER) {
          if (cat === 'custom' || (cat === 'gift_card' && svc.some(s => s.category === cat)) || svc.some(s => s.category === cat)) {
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

  // Load saved cards + credit balance when entering payment step
  useEffect(() => {
    if (step === 'payment' && patient) {
      loadSavedCards();
      loadCreditBalance();
    }
  }, [step]);

  // When weight loss hits the cart, default fulfillment to 'in_clinic_injections'.
  // WL patients come in for weekly injections — picking 'in_clinic' (Picked Up In Clinic)
  // would auto-log a bogus pickup against the protocol. Only flip from the initial default;
  // never overwrite an explicit user choice.
  useEffect(() => {
    if (cartItems.some(i => i.category === 'weight_loss') && fulfillmentMethod === 'in_clinic') {
      setFulfillmentMethod('in_clinic_injections');
    }
  }, [cartItems]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCreditBalance() {
    if (!patient?.id) return;
    setLoadingCredit(true);
    try {
      const res = await fetch(`/api/credits/${patient.id}`);
      if (res.ok) {
        const data = await res.json();
        setCreditBalanceCents(data.balance_cents || 0);
      }
    } catch (err) {
      console.error('Load credit balance error:', err);
    }
    setLoadingCredit(false);
  }

  async function loadSavedCards() {
    setLoadingCards(true);
    try {
      const res = await fetch(`/api/stripe/saved-cards?patient_id=${patient.id}`);
      const data = await res.json();
      setSavedCards(data.cards || []);
      if (data.cards?.length > 0) {
        setSelectedCard(data.cards[0].id);
        setSplitCardSelection(data.cards[0].id);
      } else {
        setSelectedCard('new');
        setSplitCardSelection('new');
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

  // Sub-group definitions for categories that benefit from segmentation
  // Returns { subgroups: [{ label, items }], ungrouped: [] }
  function getSubGroupedItems(categoryId) {
    const items = getItemsByCategory(categoryId);

    const SUBGROUP_RULES = {
      hbot: [
        { label: 'Session Packs', match: i => !i.recurring && !i.name.toLowerCase().includes('additional') },
        { label: 'Memberships', match: i => i.recurring },
        { label: 'Add-Ons', match: i => !i.recurring && i.name.toLowerCase().includes('additional') },
      ],
      weight_loss: [
        { label: 'Tirzepatide — Monthly Program', match: i => i.name.toLowerCase().includes('tirzepatide') && i.name.toLowerCase().includes('monthly') },
        { label: 'Retatrutide — Monthly Program', match: i => i.name.toLowerCase().includes('retatrutide') && i.name.toLowerCase().includes('monthly') },
        { label: 'Tirzepatide — Single Injections', match: i => i.name.toLowerCase().includes('tirzepatide') && i.name.toLowerCase().includes('single') },
        { label: 'Retatrutide — Single Injections', match: i => i.name.toLowerCase().includes('retatrutide') && i.name.toLowerCase().includes('single') },
        { label: 'Semaglutide', match: i => i.name.toLowerCase().includes('semaglutide') },
      ],
      iv_therapy: [
        { label: 'Signature Formulas', match: i => i.name.toLowerCase().startsWith('range iv') && i.name !== 'Range IV' },
        { label: 'Base IV', match: i => i.name === 'Range IV' },
        { label: 'Add-Ons', match: i => i.name.toLowerCase().includes('add-on') },
        { label: 'Other', match: i => i.name.toLowerCase().includes('exosome') },
      ],
      specialty_iv: [
        { label: 'NAD+ IV', match: i => i.name.toLowerCase().includes('nad') },
        { label: 'High-Dose Vitamin C', match: i => i.name.toLowerCase().includes('vitamin c') },
        { label: 'Glutathione IV', match: i => i.name.toLowerCase().includes('glutathione') },
        { label: 'Methylene Blue', match: i => i.name.toLowerCase().includes('methylene') || i.name.toLowerCase().includes('mb ') },
        { label: 'Pre-Screening', match: i => i.name.toLowerCase().includes('pre-screening') },
      ],
      red_light: [
        { label: 'Session Packs', match: i => !i.recurring },
        { label: 'Memberships', match: i => i.recurring },
      ],
      combo_membership: [
        { label: 'HBOT + Red Light Combos', match: () => true },
      ],
      injection_standard: [
        { label: 'Standard Injections', match: () => true },
      ],
      injection_premium: [
        { label: 'Premium Injections', match: () => true },
      ],
      injection_pack: [
        { label: 'Injection Packs', match: () => true },
      ],
      nad_injection: [
        { label: 'Individual Injections', match: i => !i.name.toLowerCase().includes('12-pack') },
        { label: '12-Packs (Pay for 10)', match: i => i.name.toLowerCase().includes('12-pack') },
      ],
      labs: [
        { label: "Men's Panels", match: i => i.name.toLowerCase().includes("men's") || i.name.toLowerCase().includes('male') },
        { label: "Women's Panels", match: i => i.name.toLowerCase().includes("women's") || i.name.toLowerCase().includes('female') },
        { label: 'General', match: () => true },
      ],
    };

    const rules = SUBGROUP_RULES[categoryId];
    if (!rules) return null; // No sub-grouping defined

    const assigned = new Set();
    const subgroups = [];

    for (const rule of rules) {
      const matched = items.filter(i => !assigned.has(i.id) && rule.match(i));
      if (matched.length > 0) {
        matched.forEach(i => assigned.add(i.id));
        subgroups.push({ label: rule.label, items: matched });
      }
    }

    // Any remaining unmatched items
    const ungrouped = items.filter(i => !assigned.has(i.id));

    return { subgroups, ungrouped };
  }

  // Check if a category should use sub-grouped rendering
  function shouldSubGroup(categoryId) {
    if (categoryId === 'peptide' || categoryId === 'custom' || categoryId === 'gift_card') return false;
    const result = getSubGroupedItems(categoryId);
    return result && result.subgroups.length > 0;
  }

  // Group peptides by sub_category (accordion sections)
  function getGroupedPeptides() {
    const items = getItemsByCategory('peptide');
    const groups = {};

    for (const item of items) {
      const groupKey = item.sub_category || 'Other';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    }

    // Sort groups by sort_order of first item in each group
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const aOrder = Math.min(...groups[a].map(i => i.sort_order || 99999));
      const bOrder = Math.min(...groups[b].map(i => i.sort_order || 99999));
      return aOrder - bOrder;
    });

    // Sort items within each group by sort_order
    for (const key of sortedKeys) {
      groups[key].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    return { groups, sortedKeys };
  }

  function togglePeptideGroup(groupName) {
    setExpandedPeptideGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  }

  function getSearchResults() {
    const q = serviceSearch.toLowerCase().trim();
    if (!q) return [];
    return services.filter(s => s.name.toLowerCase().includes(q) || (s.peptide_identifier && s.peptide_identifier.toLowerCase().includes(q)));
  }

  const isSearching = serviceSearch.trim().length > 0;
  const searchResults = isSearching ? getSearchResults() : [];

  function toggleCartItem(item) {
    const exists = cartItems.find(i => i.id === item.id);
    if (exists) {
      setCartItems(cartItems.filter(i => i.id !== item.id));
      setGiftCardCustomAmount('');
      return;
    }
    // Gift card isolation: must be purchased alone, only one at a time
    if (item.category === 'gift_card') {
      if (cartItems.some(i => i.category !== 'gift_card')) {
        setCartWarning('Gift cards must be purchased alone');
        setTimeout(() => setCartWarning(''), 3000);
        return;
      }
      // Replace any existing gift card (only one at a time)
      setGiftCardCustomAmount('');
      setCartItems([{ ...item, quantity: 1, itemDiscountType: 'none', itemDiscountValue: '' }]);
      return;
    }
    if (cartItems.some(i => i.category === 'gift_card')) {
      setCartWarning('Cannot add items when a gift card is in cart');
      setTimeout(() => setCartWarning(''), 3000);
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
    setCartItems([...cartItems, { ...item, quantity: 1, itemDiscountType: 'none', itemDiscountValue: '' }]);
  }

  function updateItemQuantity(itemId, newQty) {
    if (newQty < 1) {
      setCartItems(cartItems.filter(i => i.id !== itemId));
      return;
    }
    setCartItems(cartItems.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));
  }

  function updateItemDiscount(itemId, field, value) {
    setCartItems(cartItems.map(i => {
      if (i.id !== itemId) return i;
      if (field === 'type') {
        return { ...i, itemDiscountType: value, itemDiscountValue: '' };
      }
      return { ...i, itemDiscountValue: value };
    }));
  }

  function getItemLineCents(item) {
    const base = (item.price || 0) * (item.quantity || 1);
    const val = parseFloat(item.itemDiscountValue);
    if (!val || val <= 0 || item.itemDiscountType === 'none') return base;
    if (item.itemDiscountType === 'percent') {
      return base - Math.round(base * (Math.min(val, 100) / 100));
    }
    if (item.itemDiscountType === 'dollar') {
      return Math.max(base - Math.round(val * 100), 0);
    }
    return base;
  }

  function getItemDiscountCents(item) {
    const base = (item.price || 0) * (item.quantity || 1);
    return base - getItemLineCents(item);
  }

  function getBaseAmount() {
    if (activeCategory === 'custom') {
      const dollars = parseFloat(customAmount);
      return isNaN(dollars) ? 0 : Math.round(dollars * 100);
    }
    return cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  }

  function getDiscountCents() {
    if (activeCategory === 'custom') {
      const base = getBaseAmount();
      const val = parseFloat(discountValue);
      if (!val || val <= 0 || discountType === 'none') return 0;
      if (discountType === 'percent') return Math.round(base * (Math.min(val, 100) / 100));
      if (discountType === 'dollar') return Math.min(Math.round(val * 100), base);
      return 0;
    }
    return cartItems.reduce((sum, item) => sum + getItemDiscountCents(item), 0);
  }

  function getShippingCents() {
    const val = parseFloat(shippingAmount);
    return isNaN(val) || val <= 0 ? 0 : Math.round(val * 100);
  }

  function getChargeAmount() {
    return Math.max(getBaseAmount() - getDiscountCents(), 0) + getShippingCents();
  }

  function getChargeDescription() {
    if (activeCategory === 'custom') {
      return customDescription || 'Custom charge';
    }
    if (cartItems.length === 0) return '';
    // Use generic names only — no peptide identifiers (Stripe-safe)
    return cartItems.map(i => {
      return (i.quantity || 1) > 1 ? `${i.name} x${i.quantity}` : i.name;
    }).join(', ');
  }

  function isRecurring() {
    return cartItems.length === 1 && !!cartItems[0]?.recurring;
  }

  function canProceedToPayment() {
    if (activeCategory === 'custom') {
      return parseFloat(customAmount) > 0;
    }
    if (activeCategory === 'gift_card') {
      return cartItems.length > 0 && cartItems[0]?.category === 'gift_card';
    }
    return cartItems.length > 0;
  }

  function getResultMessage(amount) {
    const hasPeptides = cartItems.some(i => i.category === 'peptide');
    const suffix = hasPeptides ? '\nProtocol created & journey started' : '';
    const totalItems = cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
    if (activeCategory === 'custom' || totalItems <= 1) {
      return `Charged ${formatPrice(amount)} for ${getChargeDescription()}${suffix}`;
    }
    return `Charged ${formatPrice(amount)} for ${totalItems} items${suffix}`;
  }

  function getDiscountData() {
    if (discountType === 'none' || !parseFloat(discountValue)) return {};
    return {
      discount_type: discountType,
      discount_amount: parseFloat(discountValue),
      original_amount: getBaseAmount(),
    };
  }

  // Handle price override from the payment step — sets discount on items/cart to achieve target amount
  function handleChargeOverride(newAmountCents) {
    const base = getBaseAmount();
    if (newAmountCents >= base || newAmountCents < 0) {
      // No discount — clear any existing
      if (activeCategory === 'custom') {
        setDiscountType('none');
        setDiscountValue('');
      } else {
        setCartItems(prev => prev.map(item => ({
          ...item, itemDiscountType: 'none', itemDiscountValue: '',
        })));
      }
      return;
    }
    const discountCentsTotal = base - newAmountCents;
    if (activeCategory === 'custom') {
      setDiscountType('dollar');
      setDiscountValue((discountCentsTotal / 100).toString());
    } else if (cartItems.length === 1) {
      setCartItems(prev => prev.map(item => ({
        ...item,
        itemDiscountType: 'dollar',
        itemDiscountValue: (discountCentsTotal / 100).toFixed(2),
      })));
    } else {
      // Multi-item — distribute proportionally
      setCartItems(prev => {
        const totalBase = prev.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
        let remaining = discountCentsTotal;
        return prev.map((item, idx) => {
          const itemBase = (item.price || 0) * (item.quantity || 1);
          const itemDiscount = idx === prev.length - 1
            ? remaining // last item gets remainder to avoid rounding drift
            : Math.round(discountCentsTotal * (itemBase / totalBase));
          remaining -= itemDiscount;
          return {
            ...item,
            itemDiscountType: 'dollar',
            itemDiscountValue: (itemDiscount / 100).toFixed(2),
          };
        });
      });
    }
    setEditingCharge(false);
  }

  async function handleSendInvoice(via) {
    if (!patient) return;
    setInvoiceSending(true);
    try {
      const items = cartItems.map(item => ({
        name: item.name,
        category: item.category,
        price_cents: item.price,
        quantity: item.quantity || 1,
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
    const { amount_override, ...restFields } = extraFields || {};
    const isComp = amount_override === 0;
    const shippingCents = getShippingCents();

    // Custom charge — single record (receipt sent by record-purchase)
    if (activeCategory === 'custom') {
      const amount = isComp ? 0 : getChargeAmount();
      const desc = getChargeDescription();
      const discountData = isComp ? {} : getDiscountData();
      const discountSuffix = discountType === 'percent'
        ? `${discountValue}% off`
        : `$${discountValue} off`;
      await fetch('/api/stripe/record-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          amount,
          description: !isComp && discountData.discount_type ? `${desc} (${discountSuffix})` : desc,
          payment_method: 'stripe',
          service_category: activeCategory,
          service_name: customDescription,
          quantity: 1,
          shipping: isComp ? 0 : shippingCents,
          skip_receipt: skipNotification,
          ...discountData,
          ...restFields,
        }),
      });
      return;
    }

    // Cart items — one record per item, one consolidated receipt for all
    let shippingApplied = false;
    const purchaseIds = [];
    for (const item of cartItems) {
      const qty = item.quantity || 1;
      const itemBase = (item.price || 0) * qty; // total before discount
      const itemDiscountAmt = getItemDiscountCents(item);
      const itemFinal = isComp ? 0 : (itemBase - itemDiscountAmt);
      const itemName = qty > 1 ? `${item.name} x${qty}` : item.name;

      const discountSuffix = item.itemDiscountType === 'percent'
        ? `${item.itemDiscountValue}% off`
        : `$${item.itemDiscountValue} off`;

      // Apply shipping to first item only (no shipping on comps)
      const itemShipping = isComp ? 0 : (!shippingApplied && shippingCents > 0 ? shippingCents : 0);
      shippingApplied = true;

      // For peptides, reconstruct full name so auto-protocol parsing works
      // e.g., "Peptide Therapy — 10 Day" + "BPC-157 (500mcg)" → "Peptide Therapy — 10 Day — BPC-157 (500mcg)"
      const serviceName = item.peptide_identifier ? `${item.name} — ${item.peptide_identifier}` : item.name;

      const res = await fetch('/api/stripe/record-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          amount: itemFinal,
          description: !isComp && itemDiscountAmt > 0 ? `${itemName} (${discountSuffix})` : itemName,
          payment_method: 'stripe',
          service_category: item.category,
          service_name: serviceName,
          quantity: qty,
          delivery_method: item.delivery_method || null,
          duration_days: item.duration_days || null,
          shipping: itemShipping,
          fulfillment_method: ['peptide', 'weight_loss', 'hrt', 'vials'].includes(item.category) ? fulfillmentMethod : null,
          tracking_number: ['peptide', 'weight_loss', 'hrt', 'vials'].includes(item.category) && fulfillmentMethod === 'overnight' ? trackingNumber : null,
          skip_receipt: true, // consolidated receipt sent below
          ...(!isComp && itemDiscountAmt > 0 ? {
            discount_type: item.itemDiscountType,
            discount_amount: parseFloat(item.itemDiscountValue),
            original_amount: itemBase,
          } : {}),
          ...restFields,
        }),
      });
      const data = await res.json();
      if (data.purchase?.id) purchaseIds.push(data.purchase.id);
    }

    // Send one consolidated receipt for all items (unless notification skipped)
    if (purchaseIds.length > 0 && !skipNotification) {
      fetch('/api/stripe/send-consolidated-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_ids: purchaseIds }),
      }).catch(err => console.error('Consolidated receipt failed:', err));
    }
  }

  // Like recordPurchases but returns the first purchase record (used for gift card linking)
  // extraFields can include amount_override (cents) and description_suffix for split payments
  async function recordPurchasesWithReturn(extraFields) {
    const { amount_override, description_suffix, ...restFields } = extraFields || {};
    const shippingCents = getShippingCents();

    if (activeCategory === 'custom') {
      const amount = amount_override || getChargeAmount();
      const desc = getChargeDescription();
      const discountData = getDiscountData();
      const discountSuffix = discountType === 'percent'
        ? `${discountValue}% off`
        : `$${discountValue} off`;
      let finalDesc = discountData.discount_type ? `${desc} (${discountSuffix})` : desc;
      if (description_suffix) finalDesc = `${finalDesc} ${description_suffix}`;
      const res = await fetch('/api/stripe/record-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          amount,
          description: finalDesc,
          payment_method: 'stripe',
          service_category: activeCategory,
          service_name: customDescription,
          quantity: 1,
          shipping: amount_override ? 0 : shippingCents,
          skip_receipt: skipNotification,
          ...(amount_override ? {} : discountData),
          ...restFields,
        }),
      });
      return await res.json();
    }

    let firstPurchase = null;
    let shippingApplied = false;
    const purchaseIds = [];
    for (const item of cartItems) {
      const qty = item.quantity || 1;
      const itemBase = (item.price || 0) * qty;
      const itemDiscountAmt = getItemDiscountCents(item);
      const itemFinal = itemBase - itemDiscountAmt;
      const itemName = qty > 1 ? `${item.name} x${qty}` : item.name;
      const discSuffix = item.itemDiscountType === 'percent'
        ? `${item.itemDiscountValue}% off`
        : `$${item.itemDiscountValue} off`;

      const itemShipping = !shippingApplied && shippingCents > 0 ? shippingCents : 0;
      shippingApplied = true;

      // For peptides, reconstruct full name so auto-protocol parsing works
      const serviceName = item.peptide_identifier ? `${item.name} — ${item.peptide_identifier}` : item.name;

      // For split payments: use overridden amount (proportionally split across items)
      let recordAmount = itemFinal;
      if (amount_override !== undefined) {
        const totalCharge = getChargeAmount();
        recordAmount = cartItems.length === 1 ? amount_override : Math.round(amount_override * (itemFinal / totalCharge));
      }

      let desc = itemDiscountAmt > 0 ? `${itemName} (${discSuffix})` : itemName;
      if (description_suffix) desc = `${desc} ${description_suffix}`;

      const res = await fetch('/api/stripe/record-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          amount: recordAmount,
          description: desc,
          payment_method: 'stripe',
          service_category: item.category,
          service_name: serviceName,
          quantity: qty,
          shipping: amount_override ? 0 : itemShipping,
          fulfillment_method: ['peptide', 'weight_loss', 'hrt', 'vials'].includes(item.category) ? fulfillmentMethod : null,
          tracking_number: ['peptide', 'weight_loss', 'hrt', 'vials'].includes(item.category) && fulfillmentMethod === 'overnight' ? trackingNumber : null,
          skip_receipt: skipNotification || cartItems.length > 1,
          ...(itemDiscountAmt > 0 && !amount_override ? {
            discount_type: item.itemDiscountType,
            discount_amount: parseFloat(item.itemDiscountValue),
            original_amount: itemBase,
          } : {}),
          ...restFields,
        }),
      });
      const data = await res.json();
      if (!firstPurchase) firstPurchase = data;
      if (data.purchase?.id) purchaseIds.push(data.purchase.id);
    }

    if (purchaseIds.length > 1 && !skipNotification) {
      fetch('/api/stripe/send-consolidated-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_ids: purchaseIds }),
      }).catch(err => console.error('Consolidated receipt failed:', err));
    }

    return firstPurchase;
  }

  // NOTE: Protocol creation for ALL categories (including peptides) is now handled
  // exclusively by record-purchase.js → autoCreateOrExtendProtocol() in lib/auto-protocol.js.
  // This prevents duplicate protocols when extending existing ones.

  // Gift card: add custom amount as a synthetic cart item
  function addGiftCardCustom() {
    const dollars = parseFloat(giftCardCustomAmount);
    if (isNaN(dollars) || dollars < 1) return;
    const cents = Math.round(dollars * 100);
    setCartItems([{
      id: 'gift_card_custom',
      name: `Gift Card — ${formatPrice(cents)}`,
      price: cents,
      category: 'gift_card',
      quantity: 1,
      itemDiscountType: 'none',
      itemDiscountValue: '',
    }]);
  }

  // Gift card: look up a code for redemption (payment step)
  async function handleGiftCardLookup() {
    const code = giftCardCode.trim().toUpperCase();
    if (!code) return;
    setLookingUpGiftCard(true);
    setGiftCardLookup(null);
    try {
      const res = await fetch(`/api/gift-cards/lookup?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        setGiftCardLookup({ error: data.error || 'Not found' });
      } else {
        setGiftCardLookup(data.gift_card);
      }
    } catch (err) {
      setGiftCardLookup({ error: 'Failed to look up gift card' });
    }
    setLookingUpGiftCard(false);
  }

  // Gift card: create card after a gift card purchase
  async function createGiftCardAfterPurchase(purchaseId, amountCents) {
    try {
      const res = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountCents,
          buyer_patient_id: patient.id,
          buyer_name: patient.name,
          purchase_id: purchaseId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.gift_card?.code) {
        setCreatedGiftCardCode(data.gift_card.code);
        return data.gift_card.code;
      }
    } catch (err) {
      console.error('Gift card creation error (non-fatal):', err);
    }
    return null;
  }

  // Check if current cart is a gift card purchase
  function isGiftCardPurchase() {
    return cartItems.length > 0 && cartItems[0]?.category === 'gift_card';
  }

  // Shared success handler — records purchase, creates gift card if needed, shows result
  async function handlePaymentSuccess(stripePaymentIntentId, amount) {
    const extraFields = stripePaymentIntentId
      ? { stripe_payment_intent_id: stripePaymentIntentId }
      : {};
    const purchaseData = await recordPurchasesWithReturn(extraFields);


    let message = getResultMessage(amount);
    if (isGiftCardPurchase() && purchaseData?.purchase?.id) {
      const code = await createGiftCardAfterPurchase(purchaseData.purchase.id, amount);
      if (code) {
        message = `Payment successful: ${formatPrice(amount)}\nGift Card Created: ${code}\nGive this code to the recipient`;
      }
    }

    setResultStatus('success');
    setResultMessage(message);
    setStep('result');
  }

  async function handlePay() {
    const amount = getChargeAmount();
    const description = getChargeDescription();

    // $0 comp — skip Stripe entirely, just record the purchase
    if (amount === 0) {
      setStep('processing');
      try {
        await recordPurchases({ payment_method: 'comp', amount_override: 0 });
    
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

    // Cash payment — skip Stripe, just record the purchase
    if (selectedCard === 'cash') {
      setStep('processing');
      try {
        const purchaseData = await recordPurchasesWithReturn({ payment_method: 'cash' });
    
        // If this was a gift card purchase, create the gift card
        if (isGiftCardPurchase() && purchaseData?.purchase?.id) {
          const code = await createGiftCardAfterPurchase(purchaseData.purchase.id, amount);
          setResultStatus('success');
          setResultMessage(code
            ? `Cash payment recorded: ${formatPrice(amount)}\nGift Card Created: ${code}\nGive this code to the recipient`
            : `Cash payment recorded: ${description} — ${formatPrice(amount)} for ${patient.name}`);
        } else {
          setResultStatus('success');
          setResultMessage(`Cash payment recorded: ${description} — ${formatPrice(amount)} for ${patient.name}`);
        }
        setStep('result');
      } catch (error) {
        console.error('Cash recording error:', error);
        setResultStatus('error');
        setResultMessage(error.message || 'Failed to record cash payment');
        setStep('result');
      }
      return;
    }

    // Split payment — cash portion + card portion
    if (selectedCard === 'split') {
      const cashCents = Math.round((parseFloat(splitCashAmount) || 0) * 100);
      const cardCents = amount - cashCents;
      if (cashCents <= 0 || cardCents <= 0 || cashCents >= amount) return;

      try {
        // For new card with split: must interact with CardElement BEFORE switching to processing step
        let savedPaymentMethodId = null;
        if (splitCardSelection === 'new') {
          const cardElement = elements.getElement(CardElement);
          if (saveNewCard) {
            savedPaymentMethodId = await saveCardFirst(cardElement);
            if (!savedPaymentMethodId) return;
          } else {
            // One-time charge with new unsaved card
            // Create payment intent for card portion only
            const piRes = await fetch('/api/stripe/payment-intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                patient_id: patient.id,
                amount: cardCents,
                description: `${description} (card portion)`,
              }),
            });
            const piData = await piRes.json();
            if (!piRes.ok) throw new Error(piData.error);

            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(piData.client_secret, {
              payment_method: { card: cardElement },
            });

            if (stripeError) {
              setResultStatus('error');
              setResultMessage(stripeError.message);
              setStep('result');
              return;
            }

            if (paymentIntent.status === 'succeeded') {
              setStep('processing');
              // Record cash portion
              await recordPurchasesWithReturn({ payment_method: 'cash', amount_override: cashCents, description_suffix: '(cash portion)' });
              // Record card portion
              await recordPurchasesWithReturn({ payment_method: 'stripe', stripe_payment_intent_id: paymentIntent.id, amount_override: cardCents, description_suffix: '(card portion)' });
              setResultStatus('success');
              setResultMessage(`Split payment recorded:\n${formatPrice(cashCents)} cash + ${formatPrice(cardCents)} card = ${formatPrice(amount)}`);
              setStep('result');
            }
            return;
          }
        }

        setStep('processing');
        const paymentMethodId = savedPaymentMethodId || splitCardSelection;

        // Charge card portion with saved card
        const piRes = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patient.id,
            amount: cardCents,
            description: `${description} (card portion)`,
            payment_method_id: paymentMethodId,
          }),
        });
        const piData = await piRes.json();
        if (!piRes.ok) throw new Error(piData.error);

        let stripePaymentIntentId = null;
        if (piData.status === 'succeeded') {
          stripePaymentIntentId = piData.payment_intent_id;
        } else if (piData.status === 'requires_action' || piData.status === 'requires_confirmation') {
          const { error: nextError, paymentIntent } = await stripe.handleNextAction({ clientSecret: piData.client_secret });
          if (nextError) throw new Error(nextError.message);
          if (paymentIntent.status === 'succeeded') {
            stripePaymentIntentId = paymentIntent.id;
          } else {
            throw new Error(`Payment not completed — status: ${paymentIntent.status}`);
          }
        }

        // Record cash portion
        await recordPurchasesWithReturn({ payment_method: 'cash', amount_override: cashCents, description_suffix: '(cash portion)' });
        // Record card portion
        await recordPurchasesWithReturn({ payment_method: 'stripe', stripe_payment_intent_id: stripePaymentIntentId, amount_override: cardCents, description_suffix: '(card portion)' });

        setResultStatus('success');
        setResultMessage(`Split payment recorded:\n${formatPrice(cashCents)} cash + ${formatPrice(cardCents)} card = ${formatPrice(amount)}`);
        setStep('result');
      } catch (error) {
        console.error('Split payment error:', error);
        setResultStatus('error');
        setResultMessage(error.message || 'Split payment failed');
        setStep('result');
      }
      return;
    }

    // Gift card redemption — deduct from gift card balance, record purchase
    if (selectedCard === 'gift_card') {
      if (!giftCardLookup || giftCardLookup.error) return;
      setStep('processing');
      try {
        // Record the purchase first
        const purchaseData = await recordPurchasesWithReturn({ payment_method: 'gift_card' });
        // Redeem from the gift card
        const redeemRes = await fetch('/api/gift-cards/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: giftCardLookup.code,
            amount: amount,
            purchase_id: purchaseData?.purchase?.id || null,
            redeemed_by_patient_id: patient.id,
            redeemed_by_name: patient.name,
          }),
        });
        const redeemData = await redeemRes.json();
        if (!redeemRes.ok) throw new Error(redeemData.error || 'Failed to redeem gift card');
    
        const remaining = redeemData.redemption?.balance_after ?? 0;
        setResultStatus('success');
        setResultMessage(
          `Paid ${formatPrice(amount)} with Gift Card ${giftCardLookup.code}\n` +
          `Remaining balance: ${formatPrice(remaining)}`
        );
        setStep('result');
      } catch (error) {
        console.error('Gift card redemption error:', error);
        setResultStatus('error');
        setResultMessage(error.message || 'Failed to redeem gift card');
        setStep('result');
      }
      return;
    }

    // Account credit — deduct from patient's balance, record purchase
    if (selectedCard === 'account_credit') {
      if (creditBalanceCents < amount) return;
      setStep('processing');
      try {
        const purchaseData = await recordPurchasesWithReturn({ payment_method: 'account_credit' });
        const applyRes = await fetch('/api/credits/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patient.id,
            amount_cents: amount,
            purchase_id: purchaseData?.purchase?.id || null,
            description: 'Applied at checkout (POS)',
            created_by: 'pos',
          }),
        });
        const applyData = await applyRes.json();
        if (!applyRes.ok) throw new Error(applyData.error || 'Failed to apply credit');
    
        const remaining = applyData.new_balance_cents ?? 0;
        setResultStatus('success');
        setResultMessage(
          `Paid ${formatPrice(amount)} with Account Credit\n` +
          `Remaining credit: ${formatPrice(remaining)}`
        );
        setStep('result');
      } catch (error) {
        console.error('Account credit error:', error);
        setResultStatus('error');
        setResultMessage(error.message || 'Failed to apply account credit');
        setStep('result');
      }
      return;
    }

    if (!stripe || !elements) return;

    try {
      // For new card: do all Stripe Element interactions BEFORE switching to processing step
      // CardElement gets unmounted when step changes, so Stripe calls must happen first
      let savedPaymentMethodId = null;

      if (selectedCard === 'new') {
        const cardElement = elements.getElement(CardElement);

        if (isRecurring() || saveNewCard) {
          // Save card first (Stripe needs the mounted CardElement for this)
          savedPaymentMethodId = await saveCardFirst(cardElement);
          if (!savedPaymentMethodId) return; // saveCardFirst already set error state
        } else {
          // One-time charge with new unsaved card — do NOT switch step yet
          // CardElement must stay mounted in the DOM for Stripe.js to read it
          await chargeWithNewCard(cardElement, amount, description);
          return;
        }
      }

      // From here, we're working with a saved card — CardElement is not needed
      setStep('processing');

      const paymentMethodId = savedPaymentMethodId || selectedCard;

      // For recurring items, create a subscription
      if (isRecurring()) {
        const subRes = await fetch('/api/stripe/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patient.id,
            price_amount: amount,
            interval: cartItems[0].interval || 'month',
            description,
            service_category: cartItems[0]?.category || null,
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

      // One-time charge with saved card
      await chargeWithSavedCard(paymentMethodId, amount, description);

    } catch (error) {
      console.error('Payment error:', error);
      setResultStatus('error');
      setResultMessage(error.message || 'Payment failed');
      setStep('result');
    }
  }

  async function saveCardFirst(cardElement) {
    const setupRes = await fetch('/api/stripe/saved-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patient.id }),
    });

    const setupData = await setupRes.json();
    if (!setupRes.ok) throw new Error(setupData.error);

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

  async function chargeWithNewCard(cardElement, amount, description) {
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
      await handlePaymentSuccess(paymentIntent.id, amount);
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
      await handlePaymentSuccess(piData.payment_intent_id, amount);
      return;
    }

    if (piData.status === 'requires_action' || piData.status === 'requires_confirmation') {
      // Use handleNextAction for server-confirmed intents — does NOT interact with Elements
      const { error, paymentIntent } = await stripe.handleNextAction({
        clientSecret: piData.client_secret,
      });

      if (error) {
        setResultStatus('error');
        setResultMessage(error.message);
        setStep('result');
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        await handlePaymentSuccess(paymentIntent.id, amount);
      } else if (paymentIntent.status === 'requires_confirmation') {
        // Intent needs another confirmation after 3DS — confirm with payment method
        const confirmResult = await stripe.confirmPayment({
          clientSecret: piData.client_secret,
          confirmParams: {
            payment_method: paymentMethodId,
            return_url: `${window.location.origin}/admin/payments`,
          },
          redirect: 'if_required',
        });

        if (confirmResult.error) {
          setResultStatus('error');
          setResultMessage(confirmResult.error.message);
          setStep('result');
        } else if (confirmResult.paymentIntent?.status === 'succeeded') {
          await handlePaymentSuccess(confirmResult.paymentIntent.id, amount);
        } else {
          setResultStatus('error');
          setResultMessage(`Payment not completed — status: ${confirmResult.paymentIntent?.status}`);
          setStep('result');
        }
      } else {
        setResultStatus('error');
        setResultMessage(`Payment not completed — status: ${paymentIntent.status}`);
        setStep('result');
      }
      return;
    }

    // Unexpected status — show what we got so we can debug
    setResultStatus('error');
    setResultMessage(`Unexpected payment status: ${piData.status}. Contact support.`);
    setStep('result');
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
    setGiftCardCustomAmount('');
    setCreatedGiftCardCode(null);
    setGiftCardCode('');
    setGiftCardLookup(null);
    setLookingUpGiftCard(false);
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
      <div style={modalStyles.overlay} {...overlayClickProps(handleClose)} />
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
            <div style={modalStyles.patientName}>
              {patient.name}
              {(patient.phone || patient.city) && (
                <div style={{ fontSize: '12px', color: '#999', fontWeight: 400, marginTop: 2 }}>
                  {[patient.phone, [patient.city, patient.state].filter(Boolean).join(', ')].filter(Boolean).join(' • ')}
                </div>
              )}
            </div>
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
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {[p.email, p.phone, [p.city, p.state].filter(Boolean).join(', ')].filter(Boolean).join(' • ')}
                      </div>
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
                          <div style={modalStyles.itemName}>{item.peptide_identifier ? `${item.name} — ${item.peptide_identifier}` : item.name}</div>
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
                  // Accordion peptide view — grouped by sub_category
                  (() => {
                    const { groups, sortedKeys } = getGroupedPeptides();
                    return (
                      <div style={{ marginBottom: '16px' }}>
                        {sortedKeys.map(groupName => {
                          const isExpanded = expandedPeptideGroups[groupName];
                          const groupHasCartItem = groups[groupName].some(item => cartItems.some(ci => ci.id === item.id));
                          return (
                            <div key={groupName} style={modalStyles.peptideGroup}>
                              <button
                                style={{
                                  ...modalStyles.peptideAccordionHeader,
                                  ...(groupHasCartItem ? { borderColor: '#10b981', background: '#f0fdf4' } : {}),
                                }}
                                onClick={() => togglePeptideGroup(groupName)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '18px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#9654;</span>
                                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{groupName}</span>
                                  <span style={{ fontSize: '12px', color: '#888' }}>({groups[groupName].length})</span>
                                </div>
                                {groupHasCartItem && (
                                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>&#10003; In Cart</span>
                                )}
                              </button>
                              {isExpanded && (
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
                                      <div style={modalStyles.peptideVariantLabel}>{item.peptide_identifier || item.name}</div>
                                      <div style={modalStyles.itemPrice}>{formatPrice(item.price)}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : activeCategory === 'gift_card' ? (
                  // Gift card view: presets + custom amount
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                      Select a preset amount or enter a custom value
                    </div>
                    <div style={modalStyles.itemGrid}>
                      {getItemsByCategory('gift_card').map(item => (
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
                          <div style={modalStyles.itemPrice}>{formatPrice(item.price)}</div>
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '0', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>Custom Amount</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={giftCardCustomAmount}
                          onChange={e => {
                            setGiftCardCustomAmount(e.target.value);
                            // Clear preset selection when typing custom amount
                            if (cartItems.some(i => i.id !== 'gift_card_custom')) {
                              setCartItems([]);
                            }
                          }}
                          placeholder="Enter amount"
                          style={{ ...modalStyles.input, flex: 1, marginBottom: 0 }}
                        />
                        <button
                          onClick={addGiftCardCustom}
                          disabled={!giftCardCustomAmount || parseFloat(giftCardCustomAmount) < 1}
                          style={{
                            ...modalStyles.primaryBtn,
                            padding: '10px 20px',
                            opacity: (!giftCardCustomAmount || parseFloat(giftCardCustomAmount) < 1) ? 0.5 : 1,
                          }}
                        >
                          Add ${giftCardCustomAmount || '0'}
                        </button>
                      </div>
                    </div>
                    {cartItems.length > 0 && cartItems[0]?.category === 'gift_card' && (
                      <div style={{ marginTop: '12px', padding: '12px', background: '#f0fdf4', borderRadius: '0', border: '1px solid #bbf7d0' }}>
                        <div style={{ fontWeight: 600, color: '#166534' }}>
                          Selected: {cartItems[0].name} — {formatPrice(cartItems[0].price)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
                          A unique gift card code will be generated after purchase
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeCategory !== 'custom' ? (
                  shouldSubGroup(activeCategory) ? (
                    // Sub-grouped view
                    (() => {
                      const { subgroups, ungrouped } = getSubGroupedItems(activeCategory);
                      return (
                        <div style={{ marginBottom: '16px' }}>
                          {subgroups.map(sg => (
                            <div key={sg.label} style={modalStyles.subGroup}>
                              <div style={modalStyles.subGroupHeader}>{sg.label}</div>
                              <div style={modalStyles.itemGrid}>
                                {sg.items.map(item => (
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
                                    {item.description && (
                                      <div style={modalStyles.itemDescription}>{item.description}</div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          {ungrouped.length > 0 && (
                            <div style={modalStyles.subGroup}>
                              <div style={modalStyles.subGroupHeader}>Other</div>
                              <div style={modalStyles.itemGrid}>
                                {ungrouped.map(item => (
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
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    // Flat grid (fallback)
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
                  )
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
                      Cart ({cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0)} {cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0) === 1 ? 'item' : 'items'})
                    </div>
                    {cartItems.map(item => {
                      const qty = item.quantity || 1;
                      const lineBase = (item.price || 0) * qty;
                      const lineDiscount = getItemDiscountCents(item);
                      const lineTotal = lineBase - lineDiscount;
                      return (
                        <div key={item.id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '10px', marginBottom: '10px' }}>
                          {/* Item name + quantity + line total + remove */}
                          <div style={modalStyles.cartRow}>
                            <span style={{ flex: 1, fontSize: '14px' }}>{item.name}</span>
                            <span style={{ fontSize: '13px', color: '#888', marginRight: '8px' }}>
                              {formatPrice(item.price)} ea
                            </span>
                            <button
                              style={modalStyles.cartRemoveBtn}
                              onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))}
                            >
                              &times;
                            </button>
                          </div>
                          {/* Quantity controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                            <span style={{ fontSize: '12px', color: '#888', width: '30px' }}>Qty:</span>
                            <button
                              style={modalStyles.qtyBtn}
                              onClick={() => updateItemQuantity(item.id, qty - 1)}
                            >−</button>
                            <span style={{ fontSize: '14px', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                            <button
                              style={modalStyles.qtyBtn}
                              onClick={() => updateItemQuantity(item.id, qty + 1)}
                            >+</button>
                            <span style={{ flex: 1 }} />
                            {lineDiscount > 0 ? (
                              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                                <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '6px', fontSize: '12px' }}>
                                  {formatPrice(lineBase)}
                                </span>
                                {formatPrice(lineTotal)}
                              </span>
                            ) : (
                              <span style={{ fontSize: '14px', fontWeight: 500 }}>{formatPrice(lineBase)}</span>
                            )}
                          </div>
                          {/* Per-item discount */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                            <span style={{ fontSize: '12px', color: '#888', width: '55px' }}>Discount:</span>
                            <div style={{ display: 'flex', gap: '3px' }}>
                              {['none', 'percent', 'dollar'].map(type => (
                                <button
                                  key={type}
                                  style={{
                                    padding: '2px 8px',
                                    fontSize: '11px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0',
                                    background: item.itemDiscountType === type ? '#000' : '#fff',
                                    color: item.itemDiscountType === type ? '#fff' : '#555',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                  }}
                                  onClick={() => updateItemDiscount(item.id, 'type', type)}
                                >
                                  {type === 'none' ? 'None' : type === 'percent' ? '%' : '$'}
                                </button>
                              ))}
                            </div>
                            {item.itemDiscountType !== 'none' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                {item.itemDiscountType === 'dollar' && <span style={{ fontSize: '12px', color: '#888' }}>$</span>}
                                <input
                                  type="number"
                                  min="0"
                                  step={item.itemDiscountType === 'percent' ? '1' : '0.01'}
                                  max={item.itemDiscountType === 'percent' ? '100' : undefined}
                                  value={item.itemDiscountValue}
                                  onChange={e => updateItemDiscount(item.id, 'value', e.target.value)}
                                  placeholder={item.itemDiscountType === 'percent' ? '10' : '25'}
                                  style={{ width: '60px', padding: '2px 6px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '0', textAlign: 'center' }}
                                />
                                {item.itemDiscountType === 'percent' && <span style={{ fontSize: '12px', color: '#888' }}>%</span>}
                                {lineDiscount > 0 && (
                                  <span style={{ fontSize: '11px', color: '#16a34a', marginLeft: '4px' }}>
                                    −{formatPrice(lineDiscount)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div style={modalStyles.cartTotal}>
                      <span>Total</span>
                      <span>
                        {getDiscountCents() > 0 && (
                          <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '8px', fontSize: '13px' }}>
                            {formatPrice(getBaseAmount())}
                          </span>
                        )}
                        <strong>{formatPrice(getChargeAmount())}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Cart Warning */}
                {cartWarning && (
                  <div style={modalStyles.cartWarning}>{cartWarning}</div>
                )}

                {/* Discount Section (Custom charges only — cart items have per-item discounts) */}
                {canProceedToPayment() && activeCategory === 'custom' && (
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
                  {canProceedToPayment() && activeCategory === 'custom' && (
                    <div style={modalStyles.summaryLine}>
                      <div>{getChargeDescription()}</div>
                      {hasDiscount ? (
                        <div>
                          <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '8px' }}>
                            {formatPrice(baseAmount)}
                          </span>
                          <strong>{formatPrice(finalAmount)}</strong>
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
                    <div style={{ marginTop: '12px', padding: '14px', background: '#f0f9ff', borderRadius: '0', border: '1px solid #bfdbfe' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#1e40af' }}>Send invoice via:</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleSendInvoice('sms')}
                          disabled={invoiceSending}
                          style={{ padding: '8px 16px', border: '1px solid #bfdbfe', borderRadius: '0', background: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                        >
                          SMS
                        </button>
                        <button
                          onClick={() => handleSendInvoice('email')}
                          disabled={invoiceSending}
                          style={{ padding: '8px 16px', border: '1px solid #bfdbfe', borderRadius: '0', background: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                        >
                          Email
                        </button>
                        <button
                          onClick={() => handleSendInvoice('both')}
                          disabled={invoiceSending}
                          style={{ padding: '8px 16px', border: '1px solid #bfdbfe', borderRadius: '0', background: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                        >
                          Both
                        </button>
                        <button
                          onClick={() => setShowInvoiceSend(false)}
                          style={{ padding: '8px 16px', border: '1px solid #e5e5e5', borderRadius: '0', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#888' }}
                        >
                          Cancel
                        </button>
                      </div>
                      {invoiceSending && <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Sending...</p>}
                    </div>
                  )}

                  {/* Invoice result */}
                  {invoiceResult && (
                    <div style={{ marginTop: '12px', padding: '14px', background: invoiceResult.success ? '#dcfce7' : '#fee2e2', borderRadius: '0' }}>
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
                              style={{ flex: 1, padding: '6px 10px', border: '1px solid #e5e5e5', borderRadius: '0', fontSize: '12px', background: '#fff' }}
                              onClick={e => e.target.select()}
                            />
                            <button
                              onClick={() => navigator.clipboard.writeText(invoiceResult.url)}
                              style={{ padding: '6px 12px', border: '1px solid #e5e5e5', borderRadius: '0', background: '#fff', fontSize: '12px', cursor: 'pointer' }}
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
            {/* Prominent charge amount banner — editable */}
            <div style={{
              background: '#000', color: '#fff', padding: '16px 20px', marginBottom: '16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Charging {patient?.name}
                </div>
                <div style={{ fontSize: '13px', color: '#d4d4d4', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cartItems.length > 0 && activeCategory !== 'custom'
                    ? cartItems.map(i => (i.quantity || 1) > 1 ? `${i.name} x${i.quantity}` : i.name).join(', ')
                    : getChargeDescription()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                {editingCharge ? (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: 700 }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      autoFocus
                      defaultValue={((finalAmount - getShippingCents()) / 100).toFixed(2)}
                      onBlur={(e) => {
                        const val = Math.round(parseFloat(e.target.value || 0) * 100);
                        if (val >= 0) handleChargeOverride(val);
                        setEditingCharge(false);
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingCharge(false); }}
                      style={{
                        background: 'transparent', border: 'none', borderBottom: '2px solid #fff',
                        color: '#fff', fontSize: '24px', fontWeight: 700, width: '110px',
                        textAlign: 'right', outline: 'none',
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '24px', fontWeight: 700 }}>{formatPrice(finalAmount)}</span>
                    <button
                      onClick={() => setEditingCharge(true)}
                      style={{
                        background: '#333', border: 'none', color: '#fff', padding: '4px 10px',
                        fontSize: '12px', cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Discount breakdown — shows when discount is active */}
            {discountCents > 0 && (
              <div style={{
                fontSize: '13px', color: '#16a34a', padding: '8px 16px', background: '#f0fdf4',
                border: '1px solid #bbf7d0', marginBottom: '16px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>Original: {formatPrice(baseAmount)}</span>
                <span>Discount: −{formatPrice(discountCents)}</span>
                <span style={{ fontWeight: 600 }}>Charging: {formatPrice(finalAmount)}</span>
              </div>
            )}

            {/* Shipping */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px' }}>
              <span style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>Shipping $</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingAmount}
                onChange={e => setShippingAmount(e.target.value)}
                placeholder="0.00"
                style={{ width: '90px', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '0', fontSize: '14px' }}
              />
              {getShippingCents() > 0 && (
                <span style={{ fontSize: '12px', color: '#888' }}>
                  Total w/ shipping: <strong>{formatPrice(finalAmount)}</strong>
                </span>
              )}
            </div>

            {/* Fulfillment Method — all medication categories */}
            {cartItems.some(i => ['peptide', 'weight_loss', 'hrt', 'vials'].includes(i.category)) && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '0', border: '1px solid #e9ecef' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fulfillment</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: fulfillmentMethod === 'overnight' ? '10px' : '0' }}>
                  {/* In-Clinic Injections — only for weight loss */}
                  {cartItems.some(i => i.category === 'weight_loss') && (
                    <button
                      type="button"
                      onClick={() => setFulfillmentMethod('in_clinic_injections')}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: '0', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                        border: fulfillmentMethod === 'in_clinic_injections' ? '2px solid #7c3aed' : '1px solid #ddd',
                        background: fulfillmentMethod === 'in_clinic_injections' ? '#f5f3ff' : '#fff',
                        color: fulfillmentMethod === 'in_clinic_injections' ? '#7c3aed' : '#666',
                        minWidth: cartItems.some(i => i.category === 'weight_loss') ? 'calc(33% - 6px)' : undefined,
                      }}
                    >
                      In-Clinic Injections
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFulfillmentMethod('in_clinic')}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: '0', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                      border: fulfillmentMethod === 'in_clinic' ? '2px solid #2E75B6' : '1px solid #ddd',
                      background: fulfillmentMethod === 'in_clinic' ? '#EBF3FB' : '#fff',
                      color: fulfillmentMethod === 'in_clinic' ? '#2E75B6' : '#666',
                    }}
                  >
                    Picked Up In Clinic
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentMethod('overnight')}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: '0', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                      border: fulfillmentMethod === 'overnight' ? '2px solid #e67e22' : '1px solid #ddd',
                      background: fulfillmentMethod === 'overnight' ? '#FFF5EB' : '#fff',
                      color: fulfillmentMethod === 'overnight' ? '#e67e22' : '#666',
                    }}
                  >
                    Overnighted
                  </button>
                </div>
                {fulfillmentMethod === 'in_clinic_injections' && (
                  <div style={{ fontSize: '12px', color: '#7c3aed', marginTop: '6px', fontStyle: 'italic' }}>
                    Patient comes in weekly for injections. Sessions will be logged as appointments are completed.
                  </div>
                )}
                {fulfillmentMethod === 'overnight' && (
                  <input
                    type="text"
                    placeholder="Tracking number (optional)"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '0', fontSize: '13px', boxSizing: 'border-box', marginTop: '6px' }}
                  />
                )}
              </div>
            )}

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

                {/* Cash Option */}
                <div style={modalStyles.cardList}>
                  <label style={modalStyles.cardOption}>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedCard === 'cash'}
                      onChange={() => setSelectedCard('cash')}
                    />
                    <span>💵 Cash</span>
                  </label>
                </div>

                {/* Split Payment Option */}
                <div style={modalStyles.cardList}>
                  <label style={modalStyles.cardOption}>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedCard === 'split'}
                      onChange={() => {
                        setSelectedCard('split');
                        if (!splitCardSelection) setSplitCardSelection(savedCards.length > 0 ? savedCards[0].id : 'new');
                      }}
                    />
                    <span>Split Payment (Cash + Card)</span>
                  </label>

                  {selectedCard === 'split' && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
                      {/* Cash amount input */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                          Cash Portion
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={splitCashAmount}
                            onChange={e => setSplitCashAmount(e.target.value)}
                            placeholder="0.00"
                            style={{ ...modalStyles.input, marginBottom: 0, flex: 1, fontSize: '16px', fontWeight: 600 }}
                          />
                        </div>
                      </div>

                      {/* Card portion display */}
                      {(() => {
                        const cashCents = Math.round((parseFloat(splitCashAmount) || 0) * 100);
                        const cardCents = finalAmount - cashCents;
                        const isValid = cashCents > 0 && cardCents > 0 && cashCents < finalAmount;
                        return (
                          <div style={{
                            padding: '10px 12px', borderRadius: '0', marginBottom: '12px',
                            background: isValid ? '#f0fdf4' : '#fef3c7',
                            border: isValid ? '1px solid #bbf7d0' : '1px solid #fde68a',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                              <span style={{ color: '#374151' }}>Cash:</span>
                              <span style={{ fontWeight: 600 }}>{formatPrice(cashCents)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                              <span style={{ color: '#374151' }}>Card:</span>
                              <span style={{ fontWeight: 600, color: cardCents > 0 ? '#166534' : '#dc2626' }}>
                                {cardCents > 0 ? formatPrice(cardCents) : '$0.00'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e5e7eb' }}>
                              <span style={{ fontWeight: 600, color: '#374151' }}>Total:</span>
                              <span style={{ fontWeight: 600 }}>{formatPrice(finalAmount)}</span>
                            </div>
                            {!isValid && cashCents > 0 && (
                              <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>
                                {cashCents >= finalAmount ? 'Cash amount must be less than total' : 'Enter a valid cash amount'}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Card selector for the card portion */}
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        Card for Remaining Balance
                      </label>
                      {savedCards.length > 0 && savedCards.map(card => (
                        <label key={card.id} style={{ ...modalStyles.cardOption, padding: '6px 0' }}>
                          <input
                            type="radio"
                            name="split_card"
                            checked={splitCardSelection === card.id}
                            onChange={() => setSplitCardSelection(card.id)}
                          />
                          <span style={modalStyles.cardBrand}>{card.brand.toUpperCase()}</span>
                          <span>•••• {card.last4}</span>
                          <span style={modalStyles.cardExp}>{card.exp_month}/{card.exp_year}</span>
                        </label>
                      ))}
                      <label style={{ ...modalStyles.cardOption, padding: '6px 0' }}>
                        <input
                          type="radio"
                          name="split_card"
                          checked={splitCardSelection === 'new'}
                          onChange={() => setSplitCardSelection('new')}
                        />
                        <span>New Card</span>
                      </label>
                      {splitCardSelection === 'new' && (
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
                  )}
                </div>

                {/* Gift Card Option (not shown when buying a gift card) */}
                {!isGiftCardPurchase() && creditBalanceCents > 0 && (
                  <div style={modalStyles.cardList}>
                    <label style={modalStyles.cardOption}>
                      <input
                        type="radio"
                        name="payment_method"
                        checked={selectedCard === 'account_credit'}
                        onChange={() => setSelectedCard('account_credit')}
                      />
                      <span>💳 Account Credit</span>
                    </label>
                    {selectedCard === 'account_credit' && (
                      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '0', border: '1px solid #bbf7d0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: '#166534' }}>
                              Balance: {formatPrice(creditBalanceCents)}
                            </span>
                            <span style={{ fontSize: '12px', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '0' }}>
                              available
                            </span>
                          </div>
                          {creditBalanceCents < finalAmount ? (
                            <div style={{ marginTop: '8px', fontSize: '13px', color: '#dc2626' }}>
                              Insufficient credit. Balance is {formatPrice(creditBalanceCents)} but charge is {formatPrice(finalAmount)}.
                            </div>
                          ) : (
                            <div style={{ marginTop: '8px', fontSize: '13px', color: '#15803d' }}>
                              This covers the full charge of {formatPrice(finalAmount)}.
                              {creditBalanceCents > finalAmount && (
                                <span> Remaining after: {formatPrice(creditBalanceCents - finalAmount)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isGiftCardPurchase() && (
                  <div style={modalStyles.cardList}>
                    <label style={modalStyles.cardOption}>
                      <input
                        type="radio"
                        name="payment_method"
                        checked={selectedCard === 'gift_card'}
                        onChange={() => { setSelectedCard('gift_card'); setGiftCardLookup(null); setGiftCardCode(''); }}
                      />
                      <span>🎁 Gift Card</span>
                    </label>

                    {selectedCard === 'gift_card' && (
                      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                          <input
                            type="text"
                            value={giftCardCode}
                            onChange={e => setGiftCardCode(e.target.value.toUpperCase())}
                            placeholder="Enter code (RM-XXXX-XXXX)"
                            style={{ ...modalStyles.input, flex: 1, marginBottom: 0, fontFamily: 'monospace', letterSpacing: '1px' }}
                          />
                          <button
                            onClick={handleGiftCardLookup}
                            disabled={!giftCardCode.trim() || lookingUpGiftCard}
                            style={{
                              ...modalStyles.primaryBtn,
                              padding: '10px 16px',
                              opacity: (!giftCardCode.trim() || lookingUpGiftCard) ? 0.5 : 1,
                            }}
                          >
                            {lookingUpGiftCard ? 'Looking up...' : 'Look Up'}
                          </button>
                        </div>

                        {giftCardLookup && !giftCardLookup.error && (
                          <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '0', border: '1px solid #bbf7d0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, color: '#166534' }}>Balance: {formatPrice(giftCardLookup.remaining_amount)}</span>
                              <span style={{ fontSize: '12px', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '0' }}>
                                {giftCardLookup.status}
                              </span>
                            </div>
                            {giftCardLookup.remaining_amount < finalAmount ? (
                              <div style={{ marginTop: '8px', fontSize: '13px', color: '#dc2626' }}>
                                Insufficient balance. Card has {formatPrice(giftCardLookup.remaining_amount)} but charge is {formatPrice(finalAmount)}.
                              </div>
                            ) : (
                              <div style={{ marginTop: '8px', fontSize: '13px', color: '#15803d' }}>
                                This card covers the full charge of {formatPrice(finalAmount)}.
                                {giftCardLookup.remaining_amount > finalAmount && (
                                  <span> Remaining after: {formatPrice(giftCardLookup.remaining_amount - finalAmount)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {giftCardLookup?.error && (
                          <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '0', fontSize: '13px', color: '#dc2626' }}>
                            {giftCardLookup.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Skip notification toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0 4px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
              <input
                type="checkbox"
                checked={skipNotification}
                onChange={(e) => setSkipNotification(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Don't send receipt to patient
            </label>

            <div style={modalStyles.footer}>
              <button style={modalStyles.secondaryBtn} onClick={() => { setEditingCharge(false); setStep('select'); }}>
                Back
              </button>
              <button
                style={modalStyles.primaryBtn}
                onClick={handlePay}
                disabled={
                  selectedCard === 'split'
                    ? (() => {
                        const cashCents = Math.round((parseFloat(splitCashAmount) || 0) * 100);
                        const cardCents = finalAmount - cashCents;
                        return cashCents <= 0 || cardCents <= 0 || cashCents >= finalAmount || (!splitCardSelection);
                      })()
                    : selectedCard === 'gift_card'
                    ? (!giftCardLookup || giftCardLookup.error || giftCardLookup.remaining_amount < finalAmount)
                    : selectedCard === 'account_credit'
                    ? (creditBalanceCents < finalAmount)
                    : (selectedCard !== 'cash' && !stripe)
                }
              >
                {selectedCard === 'cash'
                  ? `Record Cash ${formatPrice(finalAmount)}`
                  : selectedCard === 'split'
                  ? (() => {
                      const cashCents = Math.round((parseFloat(splitCashAmount) || 0) * 100);
                      const cardCents = finalAmount - cashCents;
                      return cardCents > 0 && cashCents > 0
                        ? `Split: ${formatPrice(cashCents)} Cash + ${formatPrice(cardCents)} Card`
                        : `Split Payment ${formatPrice(finalAmount)}`;
                    })()
                  : selectedCard === 'gift_card'
                  ? `Redeem Gift Card ${formatPrice(finalAmount)}`
                  : selectedCard === 'account_credit'
                  ? `Apply Credit ${formatPrice(finalAmount)}`
                  : isRecurring()
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
                  <p style={{ ...modalStyles.resultText, whiteSpace: 'pre-line' }}>{resultMessage}</p>
                  {createdGiftCardCode && (
                    <div style={{
                      marginTop: '16px', padding: '16px', background: '#f0fdf4', borderRadius: '0',
                      border: '2px solid #86efac', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '6px', fontWeight: 600 }}>GIFT CARD CODE</div>
                      <div style={{
                        fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '2px',
                        color: '#166534', padding: '8px', background: '#fff', borderRadius: '0', border: '1px solid #bbf7d0',
                      }}>
                        {createdGiftCardCode}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(createdGiftCardCode)}
                        style={{
                          marginTop: '10px', padding: '6px 16px', background: '#166534', color: '#fff',
                          border: 'none', borderRadius: '0', fontSize: '13px', cursor: 'pointer',
                        }}
                      >
                        Copy Code
                      </button>
                    </div>
                  )}
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
    borderRadius: '0',
    width: '540px',
    maxWidth: '95vw',
    maxHeight: '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1001,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
  },
  header: {
    padding: '20px 24px 12px',
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    background: '#fff',
    borderRadius: '0',
    zIndex: 1,
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a',
  },
  patientName: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '0',
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
    padding: '5px 12px',
    borderRadius: '0',
    border: '1px solid #e2e8f0',
    background: '#fff',
    fontSize: '11px',
    color: '#475569',
    cursor: 'pointer',
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  categoryTabActive: {
    background: '#1e40af',
    color: '#fff',
    borderColor: '#1e40af',
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '16px',
  },
  itemCard: {
    position: 'relative',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '0',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  itemCardSelected: {
    borderColor: '#2563eb',
    background: '#eff6ff',
  },
  // Sub-group styles (used across all grouped categories)
  subGroup: {
    marginBottom: '20px',
  },
  subGroupHeader: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '6px 0 8px 2px',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '10px',
  },
  itemDescription: {
    fontSize: '11px',
    color: '#888',
    marginTop: '2px',
    lineHeight: '1.3',
  },
  // Grouped peptide styles (accordion)
  peptideGroup: {
    marginBottom: '4px',
  },
  peptideAccordionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '0',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
    marginBottom: '2px',
    fontFamily: 'inherit',
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
    border: '1px solid #e2e8f0',
    borderRadius: '0',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  peptideVariantLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '3px',
  },
  itemName: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#1e293b',
    marginBottom: '2px',
  },
  itemPrice: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
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
    borderRadius: '0',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  // Discount styles
  discountSection: {
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: '0',
    marginBottom: '16px',
    border: '1px solid #e2e8f0',
  },
  discountLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
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
    borderRadius: '0',
    border: '1px solid #e2e8f0',
    background: '#fff',
    fontSize: '13px',
    color: '#475569',
    cursor: 'pointer',
    fontWeight: 500,
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  discountBtnActive: {
    background: '#1e40af',
    color: '#fff',
    border: '1px solid #1e40af',
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
    borderRadius: '0',
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
    borderRadius: '0',
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
    padding: '12px 24px',
    borderRadius: '0',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  secondaryBtn: {
    padding: '10px 20px',
    borderRadius: '0',
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#475569',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
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
    background: '#f8fafc',
    borderRadius: '0',
    marginBottom: '16px',
    fontSize: '15px',
    border: '1px solid #e2e8f0',
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
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  cardOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '0',
    border: '1px solid #e2e8f0',
    marginBottom: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.15s',
  },
  cardBrand: {
    fontWeight: 600,
    fontSize: '12px',
    color: '#333',
    background: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '0',
  },
  cardExp: {
    color: '#999',
    fontSize: '13px',
    marginLeft: 'auto',
  },
  cardElementWrapper: {
    padding: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '0',
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
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
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
    background: '#2563eb',
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
    background: '#f8fafc',
    borderRadius: '0',
    padding: '12px 16px',
    marginBottom: '16px',
    border: '1px solid #e2e8f0',
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
  qtyBtn: {
    width: '26px',
    height: '26px',
    borderRadius: '0',
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#333',
  },
  cartWarning: {
    background: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '0',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#92400e',
    marginBottom: '16px',
  },
  inCartBadge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '18px',
    height: '18px',
    borderRadius: '0',
    background: '#2563eb',
    color: '#fff',
    fontSize: '11px',
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
