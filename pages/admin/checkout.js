// /pages/admin/checkout.js
// Full-page guided checkout flow for in-clinic staff
// Mirrors the public services page UX with category cards, service selection, cart, and payment

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import AdminLayout from '../../components/AdminLayout';
import { formatPrice } from '../../lib/pos-pricing';
import {
  TESTOSTERONE_DOSES,
  WEIGHT_LOSS_MEDICATIONS,
  WEIGHT_LOSS_DOSAGES,
  HRT_SUPPLY_TYPES,
  HRT_MEDICATIONS,
  HRT_SECONDARY_MEDICATIONS,
  HRT_SECONDARY_DOSAGES,
  INJECTION_MEDICATIONS,
  PEPTIDE_OPTIONS,
  IV_THERAPY_TYPES,
  getDoseOptions,
} from '../../lib/protocol-config';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// ── Service category segments (mirrors the public services page) ──
const SERVICE_SEGMENTS = [
  {
    id: 'iv_therapy',
    label: 'IV Therapy',
    icon: '💧',
    description: 'Signature formulas, specialty IVs, and add-ons',
    categories: ['iv_therapy', 'specialty_iv'],
  },
  {
    id: 'injections',
    label: 'Injections',
    icon: '💉',
    description: 'Standard, premium, NAD+, and injection packs',
    categories: ['injection_standard', 'injection_premium', 'nad_injection', 'injection_pack'],
  },
  {
    id: 'recovery',
    label: 'Recovery & Healing',
    icon: '🔄',
    description: 'HBOT, red light therapy, and combo memberships',
    categories: ['hbot', 'red_light', 'combo_membership'],
  },
  {
    id: 'optimization',
    label: 'Optimization',
    icon: '⚡',
    description: 'HRT, weight loss, and peptide protocols',
    categories: ['hrt', 'weight_loss', 'peptide'],
  },
  {
    id: 'labs',
    label: 'Labs & Testing',
    icon: '🔬',
    description: 'Essential and elite blood panels',
    categories: ['labs', 'assessment'],
  },
  {
    id: 'other',
    label: 'More',
    icon: '✦',
    description: 'Packages, PRP, supplements, gift cards, custom',
    categories: ['programs', 'packages', 'prp', 'longevity', 'vials', 'supplements', 'gift_card', 'custom', 'other'],
  },
];

const CATEGORY_LABELS = {
  programs: 'Programs',
  combo_membership: 'Combo Memberships',
  hbot: 'HBOT',
  red_light: 'Red Light Therapy',
  hrt: 'HRT',
  weight_loss: 'Weight Loss',
  iv_therapy: 'IV Therapy',
  specialty_iv: 'Specialty IVs',
  injection_standard: 'Standard Injections',
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
  custom: 'Custom Charge',
};

// Sub-group rules for categories that benefit from segmentation
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

function getSubGroupedItems(items, categoryId) {
  const rules = SUBGROUP_RULES[categoryId];
  if (!rules) return null;
  const assigned = new Set();
  const subgroups = [];
  for (const rule of rules) {
    const matched = items.filter(i => !assigned.has(i.id) && rule.match(i));
    if (matched.length > 0) {
      matched.forEach(i => assigned.add(i.id));
      subgroups.push({ label: rule.label, items: matched });
    }
  }
  const ungrouped = items.filter(i => !assigned.has(i.id));
  return { subgroups, ungrouped };
}


// ══════════════════════════════════════════════════════════════════════
// Main checkout page (wrapped in Stripe Elements)
// ══════════════════════════════════════════════════════════════════════
function CheckoutInner() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  // ── Steps: patient → browse → payment → processing → result ──
  const [step, setStep] = useState('patient');

  // ── Patient ──
  const [patient, setPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [activeProtocols, setActiveProtocols] = useState([]);
  const searchTimeout = useRef(null);

  // ── Services ──
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [activeSegment, setActiveSegment] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [serviceSearch, setServiceSearch] = useState('');
  const [expandedPeptideGroups, setExpandedPeptideGroups] = useState({});

  // ── Cart ──
  const [cartItems, setCartItems] = useState([]);
  const [cartWarning, setCartWarning] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  // ── Cart-wide discount ──
  const [cartDiscountType, setCartDiscountType] = useState('none');
  const [cartDiscountValue, setCartDiscountValue] = useState('');

  // ── Promo code ──
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  // ── Custom charge ──
  const [customAmount, setCustomAmount] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // ── Gift card (buying) ──
  const [giftCardCustomAmount, setGiftCardCustomAmount] = useState('');
  const [createdGiftCardCode, setCreatedGiftCardCode] = useState(null);

  // ── Payment ──
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [saveNewCard, setSaveNewCard] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  // ── Fulfillment ──
  const [fulfillmentMethod, setFulfillmentMethod] = useState('in_clinic');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingAmount, setShippingAmount] = useState('');

  // ── Split payment ──
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitCardSelection, setSplitCardSelection] = useState(null);

  // ── Gift card (redeeming) ──
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardLookup, setGiftCardLookup] = useState(null);
  const [lookingUpGiftCard, setLookingUpGiftCard] = useState(false);

  // ── Account credit ──
  const [creditBalanceCents, setCreditBalanceCents] = useState(0);

  // ── Energy & Recovery Pack ──
  const [energyPacks, setEnergyPacks] = useState([]);
  const [energyPackApply, setEnergyPackApply] = useState(false);

  // ── Misc ──
  const [skipNotification, setSkipNotification] = useState(false);
  const [resultStatus, setResultStatus] = useState(null);
  const [resultMessage, setResultMessage] = useState('');

  // ── Invoice ──
  const [showInvoiceSend, setShowInvoiceSend] = useState(false);
  const [invoiceSending, setInvoiceSending] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState(null);

  // ── Recent charges ──
  const [recentCharges, setRecentCharges] = useState([]);
  const [recentChargesOpen, setRecentChargesOpen] = useState(false);

  // ── Medication Dispensing ──
  const [employees, setEmployees] = useState([]);
  const [dispensingProtocolId, setDispensingProtocolId] = useState(null);
  const [dispCoverage, setDispCoverage] = useState(null);
  const [dispLoadingCoverage, setDispLoadingCoverage] = useState(false);
  const [dispEntryType, setDispEntryType] = useState('');
  const [dispMedication, setDispMedication] = useState('');
  const [dispDosage, setDispDosage] = useState('');
  const [dispSupplyType, setDispSupplyType] = useState('');
  const [dispQuantity, setDispQuantity] = useState('');
  const [dispAdministeredBy, setDispAdministeredBy] = useState('');
  const [dispVerifiedBy, setDispVerifiedBy] = useState('');
  const [dispFulfillment, setDispFulfillment] = useState('in_clinic');
  const [dispTrackingNumber, setDispTrackingNumber] = useState('');
  const [dispNotes, setDispNotes] = useState('');
  const [dispCoverageType, setDispCoverageType] = useState(null);
  const [dispSelectedService, setDispSelectedService] = useState(null); // POS service for paid dispensing
  const [dispItemQty, setDispItemQty] = useState(1);
  const [dispSubmitting, setDispSubmitting] = useState(false);
  const [dispResult, setDispResult] = useState(null);

  // ══════════════════════════════════════════════════════════════════
  // Load services on mount
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch('/api/pos/services?active=true');
        const data = await res.json();
        setServices(data.services || []);
      } catch (err) {
        console.error('Load services error:', err);
      }
      setLoadingServices(false);
    }
    loadServices();
  }, []);

  // ── Pre-select patient from query params (from calendar link) ──
  useEffect(() => {
    if (!router.isReady) return;
    const { patient_id, patient_name } = router.query;
    if (patient_id) {
      // Fetch full patient record
      fetch(`/api/patients/search?q=${encodeURIComponent(patient_name || '')}&id=${encodeURIComponent(patient_id)}`)
        .then(r => r.json())
        .then(data => {
          const p = data.patients?.find(pt => pt.id === patient_id) || { id: patient_id, name: patient_name || 'Patient' };
          setPatient(p);
          setStep('browse');
        })
        .catch(() => {});
    }
  }, [router.isReady]);

  // ── Patient search ──
  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2) {
      setPatientResults([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}`);
        const data = await res.json();
        setPatientResults(data.patients || []);
      } catch (err) {
        console.error('Patient search error:', err);
      }
      setSearchingPatients(false);
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [patientSearch]);

  // ── Load protocols + employees + recent charges when patient is selected ──
  useEffect(() => {
    if (!patient?.id) return;
    fetch(`/api/protocols?patient_id=${patient.id}&status=active`)
      .then(r => r.json())
      .then(data => setActiveProtocols(data.protocols || data || []))
      .catch(() => setActiveProtocols([]));
    // Load employees for dispensing sign-off
    fetch('/api/admin/employees?basic=true')
      .then(r => r.json())
      .then(data => setEmployees(data.employees || data || []))
      .catch(() => setEmployees([]));
    // Load recent Stripe charges (actual amounts paid, not line items)
    fetch(`/api/patients/${patient.id}/stripe-charges`)
      .then(r => r.json())
      .then(data => setRecentCharges(data.charges || []))
      .catch(() => setRecentCharges([]));
  }, [patient?.id]);

  // ── Load saved cards + credit when entering payment ──
  useEffect(() => {
    if (step === 'payment' && patient?.id) {
      loadSavedCards();
      loadCreditBalance();
      loadEnergyPacks();
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
        setSplitCardSelection(data.cards[0].id);
      } else {
        setSelectedCard('new');
        setSplitCardSelection('new');
      }
    } catch (err) {
      setSelectedCard('new');
    }
    setLoadingCards(false);
  }

  async function loadCreditBalance() {
    try {
      const res = await fetch(`/api/credits/${patient.id}`);
      if (res.ok) {
        const data = await res.json();
        setCreditBalanceCents(data.balance_cents || 0);
      }
    } catch (err) {}
  }

  async function loadEnergyPacks() {
    try {
      const res = await fetch(`/api/energy-packs?patient_id=${patient.id}&status=active`);
      if (res.ok) {
        const data = await res.json();
        setEnergyPacks(data.packs || []);
      }
    } catch (err) {}
  }

  function getEnergyPackBalance() {
    const now = new Date();
    return energyPacks.reduce((sum, p) => {
      const bonus = new Date(p.bonus_expires_at) < now ? 0 : p.remaining_bonus_cents;
      return sum + p.remaining_base_cents + bonus;
    }, 0);
  }

  function cartHasEnergyEligible() {
    return cartItems.some(i => ['red_light', 'hbot'].includes(i.category));
  }

  // ══════════════════════════════════════════════════════════════════
  // Service helpers
  // ══════════════════════════════════════════════════════════════════
  function getItemsByCategory(catId) {
    return services.filter(s => s.category === catId);
  }

  function getGroupedPeptides() {
    const items = getItemsByCategory('peptide');
    const groups = {};
    for (const item of items) {
      const groupKey = item.sub_category || 'Other';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    }
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const aOrder = Math.min(...groups[a].map(i => i.sort_order || 99999));
      const bOrder = Math.min(...groups[b].map(i => i.sort_order || 99999));
      return aOrder - bOrder;
    });
    for (const key of sortedKeys) {
      groups[key].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
    return { groups, sortedKeys };
  }

  function getSearchResults() {
    const q = serviceSearch.toLowerCase().trim();
    if (!q) return [];
    return services.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.peptide_identifier && s.peptide_identifier.toLowerCase().includes(q))
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // Cart logic
  // ══════════════════════════════════════════════════════════════════
  function toggleCartItem(item) {
    const exists = cartItems.find(i => i.id === item.id);
    if (exists) {
      setCartItems(cartItems.filter(i => i.id !== item.id));
      setGiftCardCustomAmount('');
      return;
    }
    // Gift card isolation
    if (item.category === 'gift_card') {
      if (cartItems.some(i => i.category !== 'gift_card')) {
        showWarning('Gift cards must be purchased alone');
        return;
      }
      setGiftCardCustomAmount('');
      setCartItems([{ ...item, quantity: 1, itemDiscountType: 'none', itemDiscountValue: '' }]);
      return;
    }
    const serviceItems = cartItems.filter(i => i.type !== 'dispense');
    if (serviceItems.some(i => i.category === 'gift_card')) {
      showWarning('Cannot add items when a gift card is in cart');
      return;
    }
    if (item.recurring && serviceItems.length > 0) {
      showWarning('Recurring items must be checked out alone');
      return;
    }
    if (!item.recurring && serviceItems.some(i => i.recurring)) {
      showWarning('Cannot add items when a recurring item is in cart');
      return;
    }
    setCartItems([...cartItems, { ...item, quantity: 1, itemDiscountType: 'none', itemDiscountValue: '' }]);
    setCartOpen(true);
  }

  function showWarning(msg) {
    setCartWarning(msg);
    setTimeout(() => setCartWarning(''), 3000);
  }

  function updateItemQuantity(itemId, newQty) {
    if (newQty < 1) { setCartItems(cartItems.filter(i => i.id !== itemId)); return; }
    setCartItems(cartItems.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));
  }

  function updateItemDiscount(itemId, field, value) {
    setCartItems(cartItems.map(i => {
      if (i.id !== itemId) return i;
      if (field === 'type') return { ...i, itemDiscountType: value, itemDiscountValue: '' };
      return { ...i, itemDiscountValue: value };
    }));
  }

  function getItemLineCents(item) {
    const base = (item.price || 0) * (item.quantity || 1);
    const val = parseFloat(item.itemDiscountValue);
    if (!val || val <= 0 || item.itemDiscountType === 'none') return base;
    if (item.itemDiscountType === 'percent') return base - Math.round(base * (Math.min(val, 100) / 100));
    if (item.itemDiscountType === 'dollar') return Math.max(base - Math.round(val * 100), 0);
    return base;
  }

  function getItemDiscountCents(item) {
    return (item.price || 0) * (item.quantity || 1) - getItemLineCents(item);
  }

  function getBaseAmount() {
    if (activeSubCategory === 'custom') {
      const dollars = parseFloat(customAmount);
      return isNaN(dollars) ? 0 : Math.round(dollars * 100);
    }
    // Include all items with a price (paid dispense items have price > 0)
    return cartItems.filter(i => i.type !== 'dispense' || (i.price || 0) > 0).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  }

  function getItemDiscountTotal() {
    return cartItems.reduce((sum, item) => sum + getItemDiscountCents(item), 0);
  }

  function getCartDiscountCents() {
    const afterItemDiscounts = getBaseAmount() - getItemDiscountTotal();
    const val = parseFloat(cartDiscountValue);
    if (!val || val <= 0 || cartDiscountType === 'none') return 0;
    if (cartDiscountType === 'percent') return Math.round(afterItemDiscounts * (Math.min(val, 100) / 100));
    if (cartDiscountType === 'dollar') return Math.min(Math.round(val * 100), afterItemDiscounts);
    return 0;
  }

  function getPromoDiscountCents() {
    if (!promoApplied) return 0;
    const afterOtherDiscounts = getBaseAmount() - getItemDiscountTotal() - getCartDiscountCents();
    if (promoApplied.type === 'percent') return Math.round(afterOtherDiscounts * (Math.min(promoApplied.value, 100) / 100));
    if (promoApplied.type === 'dollar') return Math.min(Math.round(promoApplied.value * 100), afterOtherDiscounts);
    return 0;
  }

  function getTotalDiscountCents() {
    return getItemDiscountTotal() + getCartDiscountCents() + getPromoDiscountCents();
  }

  function getShippingCents() {
    const val = parseFloat(shippingAmount);
    return isNaN(val) || val <= 0 ? 0 : Math.round(val * 100);
  }

  function getChargeAmount() {
    return Math.max(getBaseAmount() - getTotalDiscountCents(), 0) + getShippingCents();
  }

  function getChargeDescription() {
    if (activeSubCategory === 'custom') return customDescription || 'Custom charge';
    const paidItems = getPaidCartItems();
    if (paidItems.length === 0) return '';
    return paidItems.map(i => (i.quantity || 1) > 1 ? `${i.name} x${i.quantity}` : i.name).join(', ');
  }

  function isRecurring() {
    return cartItems.length === 1 && !!cartItems[0]?.recurring;
  }

  function isGiftCardPurchase() {
    return cartItems.length > 0 && cartItems[0]?.category === 'gift_card';
  }

  function isEnergyPackPurchase() {
    return cartItems.some(i => i.name?.toLowerCase().includes('energy') && i.name?.toLowerCase().includes('recovery'));
  }

  async function createEnergyPackAfterPurchase(purchaseId) {
    try {
      const res = await fetch('/api/energy-packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          purchase_id: purchaseId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.pack) return data.pack;
    } catch (err) {
      console.error('Failed to create energy pack:', err);
    }
    return null;
  }

  function getDispenseItems() {
    return cartItems.filter(i => i.type === 'dispense');
  }

  function getFreeDispenseItems() {
    return cartItems.filter(i => i.type === 'dispense' && (i.price || 0) === 0);
  }

  function getPaidDispenseItems() {
    return cartItems.filter(i => i.type === 'dispense' && (i.price || 0) > 0);
  }

  function getPaidCartItems() {
    // Regular service items + paid dispense items (renewals, etc.)
    return cartItems.filter(i => i.type !== 'dispense' || (i.price || 0) > 0);
  }

  function hasOnlyFreeDispenseItems() {
    // True only when ALL items are $0 dispense — no payment needed
    return cartItems.length > 0 && cartItems.every(i => i.type === 'dispense' && (i.price || 0) === 0);
  }

  function canProceedToPayment() {
    if (activeSubCategory === 'custom') return parseFloat(customAmount) > 0;
    if (activeSubCategory === 'gift_card') return cartItems.length > 0 && cartItems[0]?.category === 'gift_card';
    return cartItems.length > 0;
  }

  // ══════════════════════════════════════════════════════════════════
  // Promo code lookup
  // ══════════════════════════════════════════════════════════════════
  async function applyPromoCode() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch(`/api/promo-codes/lookup?code=${encodeURIComponent(promoCode.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setPromoApplied(data.promo);
      } else {
        const data = await res.json();
        showWarning(data.error || 'Invalid promo code');
        setPromoApplied(null);
      }
    } catch (err) {
      showWarning('Failed to look up promo code');
    }
    setPromoLoading(false);
  }

  // ══════════════════════════════════════════════════════════════════
  // Gift card custom amount
  // ══════════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════════
  // Payment processing (mirrors POSChargeModal exactly)
  // ══════════════════════════════════════════════════════════════════
  async function recordPurchasesWithReturn(extraFields) {
    const { amount_override, description_suffix, ...restFields } = extraFields || {};
    const shippingCents = getShippingCents();

    if (activeSubCategory === 'custom') {
      const amount = amount_override || getChargeAmount();
      const desc = getChargeDescription();
      const totalDiscount = getTotalDiscountCents();
      let finalDesc = totalDiscount > 0 ? `${desc} (discounted)` : desc;
      if (description_suffix) finalDesc = `${finalDesc} ${description_suffix}`;
      const res = await fetch('/api/stripe/record-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          amount,
          description: finalDesc,
          payment_method: 'stripe',
          service_category: 'custom',
          service_name: customDescription,
          quantity: 1,
          shipping: amount_override ? 0 : shippingCents,
          skip_receipt: skipNotification,
          ...(totalDiscount > 0 && !amount_override ? { original_amount: getBaseAmount() } : {}),
          ...restFields,
        }),
      });
      return await res.json();
    }

    let firstPurchase = null;
    let shippingApplied = false;
    const purchaseIds = [];
    const paidItems = getPaidCartItems();
    for (const item of paidItems) {
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

      const serviceName = item.peptide_identifier ? `${item.name} — ${item.peptide_identifier}` : item.name;

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
          delivery_method: item.delivery_method || null,
          duration_days: item.duration_days || null,
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
      console.error('Gift card creation error:', err);
    }
    return null;
  }

  async function handlePaymentSuccess(stripePaymentIntentId, amount) {
    const purchaseData = await recordPurchasesWithReturn(
      stripePaymentIntentId ? { stripe_payment_intent_id: stripePaymentIntentId } : {}
    );
    let message = `Charged ${formatPrice(amount)} for ${getChargeDescription()}`;
    if (isGiftCardPurchase() && purchaseData?.purchase?.id) {
      const code = await createGiftCardAfterPurchase(purchaseData.purchase.id, amount);
      if (code) message = `Payment successful: ${formatPrice(amount)}\nGift Card Created: ${code}`;
    }
    if (isEnergyPackPurchase() && purchaseData?.purchase?.id) {
      const pack = await createEnergyPackAfterPurchase(purchaseData.purchase.id);
      if (pack) message = `Payment successful: ${formatPrice(amount)}\nEnergy & Recovery Pack activated — $750 balance`;
    }
    // Also process any dispense items in the cart
    message = await processDispenseAndAppend(message);
    setResultStatus('success');
    setResultMessage(message);
    setStep('result');
  }

  // Helper: process dispense items and build result suffix
  async function processDispenseAndAppend(baseMessage) {
    let message = baseMessage;
    const dispItems = getDispenseItems();
    if (dispItems.length > 0) {
      const dispResults = await processDispenseItems();
      const dispensedNames = dispResults.filter(r => r.success).map(r => r.name).join(', ');
      if (dispensedNames) message += `\n\nDispensed: ${dispensedNames}`;
      const failures = dispResults.filter(r => !r.success);
      if (failures.length > 0) message += `\n\nDispense errors: ${failures.map(f => `${f.name}: ${f.error}`).join(', ')}`;
      fetch(`/api/protocols?patient_id=${patient.id}&status=active`)
        .then(r => r.json())
        .then(d => setActiveProtocols(d.protocols || d || []))
        .catch(() => {});
    }
    return message;
  }

  async function redeemEnergyPack(amountCents, purchaseId) {
    // Redeem from active packs in order (oldest first, bonus-first within each)
    let remaining = amountCents;
    let totalApplied = 0;
    const eligibleCategory = cartItems.find(i => ['red_light', 'hbot'].includes(i.category))?.category || 'red_light';
    const serviceType = eligibleCategory === 'hbot' ? 'hyperbaric' : 'red_light';
    const serviceName = cartItems.find(i => ['red_light', 'hbot'].includes(i.category))?.name || serviceType;

    for (const pack of energyPacks) {
      if (remaining <= 0) break;
      const now = new Date();
      const bonus = new Date(pack.bonus_expires_at) < now ? 0 : pack.remaining_bonus_cents;
      const available = pack.remaining_base_cents + bonus;
      if (available <= 0) continue;

      const toRedeem = Math.min(remaining, available);
      const res = await fetch('/api/energy-packs/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack_id: pack.id,
          patient_id: patient.id,
          service_type: serviceType,
          service_name: serviceName,
          amount_cents: toRedeem,
          purchase_id: purchaseId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply Energy & Recovery balance');
      totalApplied += data.applied_cents;
      remaining -= data.applied_cents;
    }
    return { totalApplied, remaining };
  }

  async function handlePay() {
    const amount = getChargeAmount();
    const description = getChargeDescription();

    // $0 comp (or $0 with only dispense items)
    if (amount === 0) {
      setStep('processing');
      try {
        const paidItems = getPaidCartItems();
        if (paidItems.length > 0) {
          await recordPurchasesWithReturn({ payment_method: 'comp' });
        }
        let message = paidItems.length > 0
          ? `Comped ${description} for ${patient.name}`
          : `Checkout complete for ${patient.name}`;
        message = await processDispenseAndAppend(message);
        setResultStatus('success');
        setResultMessage(message);
        setStep('result');
      } catch (error) {
        setResultStatus('error');
        setResultMessage(error.message || 'Failed to record comp');
        setStep('result');
      }
      return;
    }

    // Energy & Recovery Pack — full coverage (balance >= charge)
    if (energyPackApply && cartHasEnergyEligible() && getEnergyPackBalance() >= amount) {
      setStep('processing');
      try {
        const purchaseData = await recordPurchasesWithReturn({ payment_method: 'energy_pack' });
        const { totalApplied } = await redeemEnergyPack(amount, purchaseData?.purchase?.id);
        let message = `Applied ${formatPrice(totalApplied)} from Energy & Recovery balance for ${patient.name}`;
        message = await processDispenseAndAppend(message);
        setResultStatus('success');
        setResultMessage(message);
        setStep('result');
      } catch (error) {
        setResultStatus('error');
        setResultMessage(error.message || 'Failed to apply Energy & Recovery balance');
        setStep('result');
      }
      return;
    }

    // Energy & Recovery Pack — partial (balance < charge, remainder to selected payment method)
    // Handled inline below: if energyPackApply is on, we deduct what we can and charge the rest

    // Cash
    if (selectedCard === 'cash') {
      setStep('processing');
      try {
        const purchaseData = await recordPurchasesWithReturn({ payment_method: 'cash' });
        let message;
        if (isGiftCardPurchase() && purchaseData?.purchase?.id) {
          const code = await createGiftCardAfterPurchase(purchaseData.purchase.id, amount);
          message = code
            ? `Cash payment: ${formatPrice(amount)}\nGift Card Created: ${code}`
            : `Cash payment: ${description} — ${formatPrice(amount)}`;
        } else if (isEnergyPackPurchase() && purchaseData?.purchase?.id) {
          const pack = await createEnergyPackAfterPurchase(purchaseData.purchase.id);
          message = pack
            ? `Cash payment: ${formatPrice(amount)}\nEnergy & Recovery Pack activated — $750 balance`
            : `Cash payment: ${description} — ${formatPrice(amount)}`;
        } else {
          message = `Cash payment recorded: ${description} — ${formatPrice(amount)}`;
        }
        message = await processDispenseAndAppend(message);
        setResultStatus('success');
        setResultMessage(message);
        setStep('result');
      } catch (error) {
        setResultStatus('error');
        setResultMessage(error.message || 'Failed to record cash payment');
        setStep('result');
      }
      return;
    }

    // Split payment
    if (selectedCard === 'split') {
      const cashCents = Math.round((parseFloat(splitCashAmount) || 0) * 100);
      const cardCents = amount - cashCents;
      if (cashCents <= 0 || cardCents <= 0 || cashCents >= amount) return;
      try {
        let savedPaymentMethodId = null;
        if (splitCardSelection === 'new') {
          const cardElement = elements.getElement(CardElement);
          if (saveNewCard) {
            savedPaymentMethodId = await saveCardFirst(cardElement);
            if (!savedPaymentMethodId) return;
          } else {
            const piRes = await fetch('/api/stripe/payment-intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ patient_id: patient.id, amount: cardCents, description: `${description} (card portion)` }),
            });
            const piData = await piRes.json();
            if (!piRes.ok) throw new Error(piData.error);
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(piData.client_secret, {
              payment_method: { card: cardElement },
            });
            if (stripeError) { setResultStatus('error'); setResultMessage(stripeError.message); setStep('result'); return; }
            if (paymentIntent.status === 'succeeded') {
              setStep('processing');
              await recordPurchasesWithReturn({ payment_method: 'cash', amount_override: cashCents, description_suffix: '(cash portion)' });
              await recordPurchasesWithReturn({ payment_method: 'stripe', stripe_payment_intent_id: paymentIntent.id, amount_override: cardCents, description_suffix: '(card portion)' });
              setResultStatus('success');
              setResultMessage(`Split payment: ${formatPrice(cashCents)} cash + ${formatPrice(cardCents)} card = ${formatPrice(amount)}`);
              setStep('result');
            }
            return;
          }
        }
        setStep('processing');
        const paymentMethodId = savedPaymentMethodId || splitCardSelection;
        const piRes = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: patient.id, amount: cardCents, description: `${description} (card portion)`, payment_method_id: paymentMethodId }),
        });
        const piData = await piRes.json();
        if (!piRes.ok) throw new Error(piData.error);
        let stripePaymentIntentId = null;
        if (piData.status === 'succeeded') {
          stripePaymentIntentId = piData.payment_intent_id;
        } else if (piData.status === 'requires_action' || piData.status === 'requires_confirmation') {
          const { error: nextError, paymentIntent } = await stripe.handleNextAction({ clientSecret: piData.client_secret });
          if (nextError) throw new Error(nextError.message);
          if (paymentIntent.status === 'succeeded') stripePaymentIntentId = paymentIntent.id;
          else throw new Error(`Payment not completed — status: ${paymentIntent.status}`);
        }
        await recordPurchasesWithReturn({ payment_method: 'cash', amount_override: cashCents, description_suffix: '(cash portion)' });
        await recordPurchasesWithReturn({ payment_method: 'stripe', stripe_payment_intent_id: stripePaymentIntentId, amount_override: cardCents, description_suffix: '(card portion)' });
        setResultStatus('success');
        setResultMessage(`Split payment: ${formatPrice(cashCents)} cash + ${formatPrice(cardCents)} card = ${formatPrice(amount)}`);
        setStep('result');
      } catch (error) {
        setResultStatus('error');
        setResultMessage(error.message || 'Split payment failed');
        setStep('result');
      }
      return;
    }

    // Gift card redemption
    if (selectedCard === 'gift_card') {
      if (!giftCardLookup || giftCardLookup.error) return;
      setStep('processing');
      try {
        const purchaseData = await recordPurchasesWithReturn({ payment_method: 'gift_card' });
        const redeemRes = await fetch('/api/gift-cards/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: giftCardLookup.code,
            amount,
            purchase_id: purchaseData?.purchase?.id || null,
            redeemed_by_patient_id: patient.id,
            redeemed_by_name: patient.name,
          }),
        });
        const redeemData = await redeemRes.json();
        if (!redeemRes.ok) throw new Error(redeemData.error || 'Failed to redeem gift card');
        const remaining = redeemData.redemption?.balance_after ?? 0;
        setResultStatus('success');
        setResultMessage(`Paid ${formatPrice(amount)} with Gift Card ${giftCardLookup.code}\nRemaining: ${formatPrice(remaining)}`);
        setStep('result');
      } catch (error) {
        setResultStatus('error');
        setResultMessage(error.message || 'Failed to redeem gift card');
        setStep('result');
      }
      return;
    }

    // Account credit
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
            description: 'Applied at checkout',
            created_by: 'pos',
          }),
        });
        const applyData = await applyRes.json();
        if (!applyRes.ok) throw new Error(applyData.error || 'Failed to apply credit');
        const remaining = applyData.new_balance_cents ?? 0;
        setResultStatus('success');
        setResultMessage(`Paid ${formatPrice(amount)} with Account Credit\nRemaining: ${formatPrice(remaining)}`);
        setStep('result');
      } catch (error) {
        setResultStatus('error');
        setResultMessage(error.message || 'Failed to apply account credit');
        setStep('result');
      }
      return;
    }

    // Stripe card payment
    if (!stripe || !elements) return;
    try {
      let savedPaymentMethodId = null;
      if (selectedCard === 'new') {
        const cardElement = elements.getElement(CardElement);
        if (isRecurring() || saveNewCard) {
          savedPaymentMethodId = await saveCardFirst(cardElement);
          if (!savedPaymentMethodId) return;
        } else {
          await chargeWithNewCard(cardElement, amount, description);
          return;
        }
      }
      setStep('processing');
      const paymentMethodId = savedPaymentMethodId || selectedCard;
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
        await recordPurchasesWithReturn({ stripe_subscription_id: subData.subscription_id, description: `${description} (monthly subscription)` });
        setResultStatus('success');
        setResultMessage(`Subscription created for ${description} — ${formatPrice(amount)}/mo`);
        setStep('result');
        return;
      }
      await chargeWithSavedCard(paymentMethodId, amount, description);
    } catch (error) {
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
    if (error) { setResultStatus('error'); setResultMessage(error.message); setStep('result'); return null; }
    return setupIntent.payment_method;
  }

  async function chargeWithNewCard(cardElement, amount, description) {
    const piRes = await fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patient.id, amount, description }),
    });
    const piData = await piRes.json();
    if (!piRes.ok) throw new Error(piData.error);
    const { error, paymentIntent } = await stripe.confirmCardPayment(piData.client_secret, {
      payment_method: { card: cardElement },
    });
    if (error) { setResultStatus('error'); setResultMessage(error.message); setStep('result'); return; }
    if (paymentIntent.status === 'succeeded') await handlePaymentSuccess(paymentIntent.id, amount);
  }

  async function chargeWithSavedCard(paymentMethodId, amount, description) {
    const piRes = await fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patient.id, amount, description, payment_method_id: paymentMethodId }),
    });
    const piData = await piRes.json();
    if (!piRes.ok) throw new Error(piData.error);
    if (piData.status === 'succeeded') { await handlePaymentSuccess(piData.payment_intent_id, amount); return; }
    if (piData.status === 'requires_action' || piData.status === 'requires_confirmation') {
      const { error, paymentIntent } = await stripe.handleNextAction({ clientSecret: piData.client_secret });
      if (error) { setResultStatus('error'); setResultMessage(error.message); setStep('result'); return; }
      if (paymentIntent.status === 'succeeded') {
        await handlePaymentSuccess(paymentIntent.id, amount);
      } else if (paymentIntent.status === 'requires_confirmation') {
        const confirmResult = await stripe.confirmPayment({
          clientSecret: piData.client_secret,
          confirmParams: { payment_method: paymentMethodId, return_url: `${window.location.origin}/admin/checkout` },
          redirect: 'if_required',
        });
        if (confirmResult.error) { setResultStatus('error'); setResultMessage(confirmResult.error.message); setStep('result'); }
        else if (confirmResult.paymentIntent?.status === 'succeeded') await handlePaymentSuccess(confirmResult.paymentIntent.id, amount);
        else { setResultStatus('error'); setResultMessage(`Payment not completed — status: ${confirmResult.paymentIntent?.status}`); setStep('result'); }
      } else {
        setResultStatus('error');
        setResultMessage(`Payment not completed — status: ${paymentIntent.status}`);
        setStep('result');
      }
      return;
    }
    setResultStatus('error');
    setResultMessage(`Unexpected payment status: ${piData.status}`);
    setStep('result');
  }

  // ── Invoice sending ──
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
      const createRes = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          patient_name: patient.name,
          patient_email: patient.email,
          patient_phone: patient.phone,
          items,
          subtotal_cents: getBaseAmount(),
          discount_cents: getTotalDiscountCents(),
          total_cents: getChargeAmount(),
          created_by: 'checkout_page',
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Could not create invoice');
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

  // ── Gift card lookup (payment step) ──
  async function handleGiftCardLookup() {
    const code = giftCardCode.trim().toUpperCase();
    if (!code) return;
    setLookingUpGiftCard(true);
    setGiftCardLookup(null);
    try {
      const res = await fetch(`/api/gift-cards/lookup?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) setGiftCardLookup({ error: data.error || 'Not found' });
      else setGiftCardLookup(data.gift_card);
    } catch (err) {
      setGiftCardLookup({ error: 'Failed to look up gift card' });
    }
    setLookingUpGiftCard(false);
  }

  // ── Reset / new checkout ──
  function handleNewCheckout() {
    setCartItems([]);
    setCartWarning('');
    setCartOpen(false);
    setCartDiscountType('none');
    setCartDiscountValue('');
    setPromoCode('');
    setPromoApplied(null);
    setCustomAmount('');
    setCustomDescription('');
    setGiftCardCustomAmount('');
    setCreatedGiftCardCode(null);
    setSelectedCard(null);
    setSaveNewCard(false);
    setFulfillmentMethod('in_clinic');
    setTrackingNumber('');
    setShippingAmount('');
    setSplitCashAmount('');
    setSplitCardSelection(null);
    setGiftCardCode('');
    setGiftCardLookup(null);
    setCreditBalanceCents(0);
    setSkipNotification(false);
    setResultStatus(null);
    setResultMessage('');
    setShowInvoiceSend(false);
    setInvoiceResult(null);
    setActiveSegment(null);
    setActiveSubCategory(null);
    setServiceSearch('');
    setStep('browse');
  }

  function handleNewPatient() {
    setPatient(null);
    setPatientSearch('');
    setPatientResults([]);
    setActiveProtocols([]);
    setRecentCharges([]);
    setRecentChargesOpen(false);
    handleNewCheckout();
    setStep('patient');
  }

  // ══════════════════════════════════════════════════════════════════
  // Medication dispensing
  // ══════════════════════════════════════════════════════════════════

  function resetDispensing() {
    setDispensingProtocolId(null);
    setDispCoverage(null);
    setDispEntryType('');
    setDispMedication('');
    setDispDosage('');
    setDispSupplyType('');
    setDispQuantity('');
    setDispAdministeredBy('');
    setDispVerifiedBy('');
    setDispFulfillment('in_clinic');
    setDispTrackingNumber('');
    setDispNotes('');
    setDispCoverageType(null);
    setDispSelectedService(null);
    setDispItemQty(1);
    setDispSubmitting(false);
    setDispResult(null);
  }

  // Map protocol program_type to medication-checkout category
  function protocolToCategory(programType) {
    const map = {
      hrt: 'testosterone',
      weight_loss: 'weight_loss',
      peptide: 'peptide',
      iv: 'iv_therapy',
      iv_therapy: 'iv_therapy',
      hbot: 'hbot',
      rlt: 'red_light',
      red_light: 'red_light',
      injection: 'injection',
      nad_injection: 'nad_injection',
      vitamin: 'vitamin',
      supplement: 'supplement',
      labs: 'labs',
      prp: 'prp',
      packages: 'packages',
      combo_membership: 'combo_membership',
    };
    return map[programType] || programType;
  }

  async function openDispensing(protocol) {
    resetDispensing();
    setDispensingProtocolId(protocol.id);

    // Pre-fill from protocol
    if (protocol.medication) setDispMedication(protocol.medication);
    if (protocol.selected_dose) setDispDosage(protocol.selected_dose);
    if (protocol.supply_type) setDispSupplyType(protocol.supply_type);

    // Auto-set entry type based on category
    const cat = protocolToCategory(protocol.program_type);
    if (['hbot', 'iv_therapy', 'red_light', 'labs', 'prp', 'packages', 'combo_membership'].includes(cat)) {
      setDispEntryType('session');
    } else if (['testosterone', 'peptide'].includes(cat)) {
      setDispEntryType('pickup');
    } else if (['weight_loss', 'vitamin', 'nad_injection', 'injection'].includes(cat)) {
      setDispEntryType('injection');
    } else {
      setDispEntryType('pickup');
    }

    // Fetch coverage for this category
    setDispLoadingCoverage(true);
    try {
      const res = await fetch(`/api/medication-checkout/coverage?patient_id=${patient.id}&category=${cat}`);
      const data = await res.json();
      setDispCoverage(data);
      if (data.covered) {
        setDispCoverageType(data.coverage_type);
      } else {
        setDispCoverageType('paid');
      }
    } catch (err) {
      console.error('Dispense coverage error:', err);
    }
    setDispLoadingCoverage(false);
  }

  function handleAddDispenseToCart() {
    const protocol = activeProtocols.find(p => p.id === dispensingProtocolId);
    if (!protocol) return;
    const cat = protocolToCategory(protocol.program_type);
    const isCovered = dispCoverageType === 'subscription' || dispCoverageType === 'protocol' || dispCoverageType === 'comp';
    const covSource = dispCoverageType === 'subscription'
      ? (dispCoverage?.coverage_source || 'Active Membership')
      : dispCoverageType === 'protocol'
        ? (protocol.program_name || dispCoverage?.coverage_source || 'Active Protocol')
        : dispCoverageType === 'comp'
          ? 'Complimentary'
          : null;

    // For paid dispense items, use the selected POS service price
    const isPaid = !isCovered && dispSelectedService;
    const itemPrice = isPaid ? (dispSelectedService.price_cents || 0) : 0;
    const qty = isPaid ? (dispItemQty || 1) : 1;

    const dispenseItem = {
      id: `disp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'dispense',
      name: dispMedication || protocol.program_name || protocol.medication || cat,
      price: itemPrice,
      quantity: qty,
      category: cat,
      itemDiscountType: 'none',
      itemDiscountValue: '',
      recurring: isPaid ? dispSelectedService.recurring : false,
      coverageBadge: isCovered ? (covSource || 'Covered') : null,
      dispenseDetails: {
        protocolId: protocol.id,
        protocolName: protocol.program_name,
        category: cat,
        entryType: dispEntryType,
        medication: dispMedication || null,
        dosage: dispDosage || null,
        supplyType: dispSupplyType || null,
        quantity: dispQuantity ? parseInt(dispQuantity) : null,
        administeredBy: dispAdministeredBy || null,
        verifiedBy: dispVerifiedBy || null,
        fulfillmentMethod: dispFulfillment,
        trackingNumber: dispTrackingNumber || null,
        notes: dispNotes || null,
        coverageType: isCovered ? dispCoverageType : 'paid',
        coverageSource: covSource || 'Paid at checkout',
        // For paid items, store service info for purchase recording
        selectedService: isPaid ? dispSelectedService : null,
        itemQty: qty,
      },
    };

    // Build display name with details
    const parts = [dispMedication || protocol.medication || cat];
    if (dispDosage) parts.push(dispDosage);
    if (dispSupplyType) {
      const supplyLabel = (HRT_SUPPLY_TYPES || []).find(s => s.value === dispSupplyType)?.label || dispSupplyType;
      parts.push(supplyLabel);
    }
    if (dispQuantity && parseInt(dispQuantity) > 1) parts.push(`x${dispQuantity}`);
    dispenseItem.name = parts.join(' — ');

    setCartItems(prev => [...prev, dispenseItem]);
    setCartOpen(true);
    resetDispensing();
  }

  // Process all dispense items in the cart via /api/medication-checkout
  async function processDispenseItems() {
    const dispItems = getDispenseItems();
    const results = [];
    for (const item of dispItems) {
      const d = item.dispenseDetails;
      if (!d) continue;
      try {
        const body = {
          patient_id: patient.id,
          category: d.category,
          entry_type: d.entryType,
          medication: d.medication,
          dosage: d.dosage,
          quantity: d.quantity,
          supply_type: d.supplyType,
          notes: d.notes,
          protocol_id: d.protocolId,
          coverage_type: d.coverageType,
          coverage_source: d.coverageSource,
          administered_by: d.administeredBy,
          verified_by: d.verifiedBy,
          fulfillment_method: d.fulfillmentMethod,
          tracking_number: d.trackingNumber,
          send_receipt: false, // will send consolidated at end
        };
        const res = await fetch('/api/medication-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to dispense ${d.medication}`);
        results.push({ success: true, name: item.name, data });
      } catch (err) {
        results.push({ success: false, name: item.name, error: err.message });
      }
    }
    return results;
  }

  // Dispense-only checkout (no payment needed)
  async function processDispenseOnly() {
    setStep('processing');
    try {
      const results = await processDispenseItems();
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        setResultStatus('error');
        setResultMessage(`Some items failed:\n${failures.map(f => `${f.name}: ${f.error}`).join('\n')}`);
      } else {
        setResultStatus('success');
        const dispensedNames = results.map(r => r.name).join(', ');
        setResultMessage(`Dispensed for ${patient.name}:\n${dispensedNames}`);
      }
      // Refresh protocols
      fetch(`/api/protocols?patient_id=${patient.id}&status=active`)
        .then(r => r.json())
        .then(d => setActiveProtocols(d.protocols || d || []))
        .catch(() => {});
      setStep('result');
    } catch (err) {
      setResultStatus('error');
      setResultMessage(err.message);
      setStep('result');
    }
  }

  function getDispenseEntryLabel(type) {
    const labels = { injection: 'In-Clinic Injection', pickup: 'Take-Home Pickup', session: 'Session', med_pickup: 'Medication Pickup' };
    return labels[type] || type;
  }

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════

  const totalItems = cartItems.filter(i => i.type !== 'dispense').reduce((sum, i) => sum + (i.quantity || 1), 0) + getFreeDispenseItems().length + getPaidDispenseItems().reduce((sum, i) => sum + (i.quantity || 1), 0);
  const chargeAmount = getChargeAmount();
  const baseAmount = getBaseAmount();
  const totalDiscount = getTotalDiscountCents();

  return (
    <AdminLayout title="Checkout">
      <Head>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .checkout-segment-card:hover { border-color: #1a1a1a !important; box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important; }
          .checkout-service-card:hover { border-color: #c0c0c0 !important; box-shadow: 0 2px 12px rgba(0,0,0,0.04) !important; }
          .checkout-search-result:hover { background: #f9fafb !important; }
        `}</style>
      </Head>
      <div style={styles.pageContainer}>
        {/* ═══════════════════════════════ STEP: PATIENT ═══════════════════════════════ */}
        {step === 'patient' && (
          <div style={styles.patientStep}>
            <div style={styles.patientCard}>
              <div style={styles.patientCardHeader}>
                <span style={styles.stepLabel}>STEP 1</span>
                <h2 style={styles.stepTitle}>Who's checking out?</h2>
                <p style={styles.stepSubtitle}>Search for a patient to begin</p>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search by patient name..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  style={styles.searchInput}
                  autoFocus
                />
                {searchingPatients && (
                  <div style={{ position: 'absolute', right: '16px', top: '18px', color: '#888', fontSize: '13px' }}>Searching...</div>
                )}
                {patientResults.length > 0 && (
                  <div style={styles.searchDropdown}>
                    {patientResults.map(p => (
                      <button
                        key={p.id}
                        className="checkout-search-result"
                        style={styles.searchResult}
                        onClick={() => {
                          setPatient(p);
                          setPatientSearch('');
                          setPatientResults([]);
                          setStep('browse');
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{p.name}</div>
                        <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
                          {[p.email, p.phone].filter(Boolean).join(' · ')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {patientSearch.length >= 2 && patientResults.length === 0 && !searchingPatients && (
                  <div style={styles.searchDropdown}>
                    <div style={{ padding: '16px', color: '#888', textAlign: 'center' }}>No patients found</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════ STEP: BROWSE ═══════════════════════════════ */}
        {step === 'browse' && (
          <div style={styles.browseLayout}>
            {/* Main content area */}
            <div style={styles.browseMain}>
              {/* Patient bar */}
              <div style={styles.patientBar}>
                <div style={styles.patientBarInfo}>
                  <div style={styles.patientBarAvatar}>{patient?.name?.charAt(0) || '?'}</div>
                  <div>
                    <div style={styles.patientBarName}>{patient?.name}</div>
                    <div style={styles.patientBarMeta}>
                      {[patient?.phone, patient?.email].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {activeProtocols.length > 0 && (
                    <div style={styles.protocolBadge}>
                      {activeProtocols.length} active protocol{activeProtocols.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  <button style={styles.changePatientBtn} onClick={handleNewPatient}>Change</button>
                </div>
              </div>

              {/* Active protocols summary — click to dispense */}
              {activeProtocols.length > 0 && !activeSegment && (
                <div style={styles.protocolsBar}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={styles.protocolsLabel}>ACTIVE PROTOCOLS</div>
                    <button
                      style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => { setActiveSegment({ id: 'dispense', label: 'Dispense Medication', icon: '💊' }); setActiveSubCategory(null); }}
                    >
                      Dispense →
                    </button>
                  </div>
                  <div style={styles.protocolsList}>
                    {activeProtocols.slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        style={{ ...styles.protocolChip, cursor: 'pointer', border: '1px solid #bfdbfe' }}
                        onClick={() => { setActiveSegment({ id: 'dispense', label: 'Dispense Medication', icon: '💊' }); setActiveSubCategory(null); openDispensing(p); }}
                      >
                        {p.medication || p.program_name || p.program_type || 'Protocol'}
                        {p.total_sessions ? ` (${p.sessions_used || 0}/${p.total_sessions})` : ''}
                      </button>
                    ))}
                    {activeProtocols.length > 5 && (
                      <div style={{ ...styles.protocolChip, background: '#f3f4f6', color: '#888' }}>+{activeProtocols.length - 5} more</div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent charges — collapsible */}
              {recentCharges.length > 0 && !activeSegment && (
                <div style={styles.recentChargesBar}>
                  <button
                    style={styles.recentChargesToggle}
                    onClick={() => setRecentChargesOpen(!recentChargesOpen)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', transition: 'transform 0.2s', transform: recentChargesOpen ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '0.05em' }}>RECENT CHARGES</span>
                      <span style={{ fontSize: '11px', color: '#aaa' }}>({recentCharges.length})</span>
                    </span>
                  </button>
                  {recentChargesOpen && (
                    <div style={styles.recentChargesList}>
                      {recentCharges.map(c => {
                        const dateStr = c.created
                          ? new Date(c.created * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '';
                        const amount = formatPrice(c.amount || 0);
                        const desc = c.description || 'Payment';
                        const card = c.card_brand
                          ? `${c.card_brand} ···${c.card_last4}`
                          : '';
                        const isRefunded = c.refunded;
                        const partialRefund = !c.refunded && c.amount_refunded > 0;
                        return (
                          <div key={c.id} style={{ ...styles.recentChargeRow, ...(isRefunded ? { opacity: 0.5 } : {}) }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {desc}
                                {isRefunded && <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, marginLeft: '6px' }}>REFUNDED</span>}
                                {partialRefund && <span style={{ fontSize: '10px', color: '#d97706', fontWeight: 700, marginLeft: '6px' }}>PARTIAL REFUND</span>}
                              </div>
                              <div style={{ fontSize: '11px', color: '#999' }}>
                                {dateStr}{card ? ` · ${card}` : ''}
                              </div>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}>{amount}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Search bar */}
              <div style={styles.serviceSearchWrap}>
                <input
                  type="text"
                  placeholder="Search all services..."
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  style={styles.serviceSearchInput}
                />
                {serviceSearch && (
                  <button
                    style={styles.clearSearchBtn}
                    onClick={() => setServiceSearch('')}
                  >×</button>
                )}
              </div>

              {/* Dispense result banner */}
              {dispResult && (
                <div style={{
                  padding: '12px 16px',
                  background: dispResult.success ? '#dcfce7' : '#fee2e2',
                  border: `1px solid ${dispResult.success ? '#86efac' : '#fca5a5'}`,
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: dispResult.success ? '#166534' : '#dc2626' }}>
                    {dispResult.success ? '✓ ' : '✗ '}{dispResult.message}
                  </div>
                  <button
                    onClick={() => { setDispResult(null); resetDispensing(); }}
                    style={{ background: 'none', border: 'none', fontSize: '18px', color: '#888', cursor: 'pointer' }}
                  >×</button>
                </div>
              )}

              {/* Search results */}
              {serviceSearch.trim() ? (
                <div>
                  <div style={styles.sectionLabel}>
                    SEARCH RESULTS ({getSearchResults().length})
                  </div>
                  {getSearchResults().length > 0 ? (
                    <div style={styles.serviceGrid}>
                      {getSearchResults().map(item => (
                        <ServiceCard
                          key={item.id}
                          item={item}
                          inCart={cartItems.some(i => i.id === item.id)}
                          onClick={() => toggleCartItem(item)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                      No services match "{serviceSearch}"
                    </div>
                  )}
                </div>
              ) : !activeSegment ? (
                /* ── Segment cards (home view) ── */
                <div>
                  <div style={styles.sectionLabel}>SELECT A CATEGORY</div>
                  <div style={styles.segmentGrid}>
                    {/* Dispense Medication card — only shown when patient has active protocols */}
                    {activeProtocols.length > 0 && (
                      <button
                        className="checkout-segment-card"
                        style={{ ...styles.segmentCard, borderColor: '#bfdbfe', background: '#f0f9ff' }}
                        onClick={() => { setActiveSegment({ id: 'dispense', label: 'Dispense Medication', icon: '💊' }); setActiveSubCategory(null); }}
                      >
                        <div style={styles.segmentIcon}>💊</div>
                        <div style={styles.segmentLabel}>Dispense</div>
                        <div style={styles.segmentDesc}>Dispense medications for active protocols</div>
                        <div style={styles.segmentCount}>{activeProtocols.length} protocol{activeProtocols.length !== 1 ? 's' : ''}</div>
                      </button>
                    )}
                    {SERVICE_SEGMENTS.map(seg => {
                      const segCats = seg.categories.filter(c => c !== 'custom');
                      const itemCount = segCats.reduce((sum, c) => sum + getItemsByCategory(c).length, 0);
                      if (itemCount === 0 && seg.id !== 'other') return null;
                      return (
                        <button
                          key={seg.id}
                          className="checkout-segment-card"
                          style={styles.segmentCard}
                          onClick={() => {
                            setActiveSegment(seg);
                            setActiveSubCategory(seg.categories[0]);
                          }}
                        >
                          <div style={styles.segmentIcon}>{seg.icon}</div>
                          <div style={styles.segmentLabel}>{seg.label}</div>
                          <div style={styles.segmentDesc}>{seg.description}</div>
                          <div style={styles.segmentCount}>{itemCount} items</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : activeSegment?.id === 'dispense' ? (
                /* ── Dispense medication view ── */
                <div>
                  <button
                    style={styles.backBtn}
                    onClick={() => { setActiveSegment(null); setActiveSubCategory(null); resetDispensing(); }}
                  >
                    ← Back to categories
                  </button>

                  <div style={styles.segmentHeader}>
                    <span style={styles.segmentHeaderIcon}>💊</span>
                    <h2 style={styles.segmentHeaderTitle}>Dispense Medication</h2>
                  </div>

                  {activeProtocols.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                      No active protocols for this patient
                    </div>
                  ) : (
                    <div style={styles.dispenseGrid}>
                      {activeProtocols.map(proto => {
                        const isExpanded = dispensingProtocolId === proto.id;
                        const hasSessions = proto.total_sessions > 0;
                        const sessionsRemaining = hasSessions ? Math.max(0, proto.total_sessions - (proto.sessions_used || 0)) : null;
                        const cat = protocolToCategory(proto.program_type);

                        return (
                          <div key={proto.id} style={styles.dispenseCard}>
                            {/* Protocol header — always visible */}
                            <button
                              style={{
                                ...styles.dispenseCardHeader,
                                ...(isExpanded ? { borderColor: '#1a1a1a', background: '#fafafa' } : {}),
                              }}
                              onClick={() => {
                                if (isExpanded) { resetDispensing(); }
                                else { openDispensing(proto); }
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={styles.dispenseCardTitle}>
                                  {proto.medication || proto.program_name || proto.program_type}
                                </div>
                                <div style={styles.dispenseCardMeta}>
                                  {proto.program_type?.replace(/_/g, ' ').toUpperCase()}
                                  {proto.selected_dose ? ` · ${proto.selected_dose}` : ''}
                                  {proto.frequency ? ` · ${proto.frequency}` : ''}
                                </div>
                                <div style={styles.dispenseCardMeta}>
                                  {hasSessions && (
                                    <span style={{ color: sessionsRemaining > 0 ? '#166534' : '#dc2626', fontWeight: 600 }}>
                                      {sessionsRemaining} of {proto.total_sessions} remaining
                                    </span>
                                  )}
                                  {proto.last_refill_date && (
                                    <span style={{ marginLeft: hasSessions ? '12px' : 0 }}>
                                      Last: {proto.last_refill_date}
                                    </span>
                                  )}
                                  {proto.next_expected_date && (
                                    <span style={{ marginLeft: '12px' }}>
                                      Next: {proto.next_expected_date}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{
                                fontSize: '13px', fontWeight: 700,
                                color: isExpanded ? '#666' : '#1e40af',
                                padding: '6px 14px',
                                border: `1px solid ${isExpanded ? '#e0e0e0' : '#bfdbfe'}`,
                                background: isExpanded ? '#fff' : '#f0f9ff',
                                whiteSpace: 'nowrap',
                              }}>
                                {isExpanded ? '✕ Close' : 'Dispense →'}
                              </div>
                            </button>

                            {/* Expanded dispensing form */}
                            {isExpanded && (
                              <div style={styles.dispenseForm}>
                                {dispLoadingCoverage ? (
                                  <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Loading coverage...</div>
                                ) : (
                                  <>
                                    {/* Coverage status */}
                                    {dispCoverage && (
                                      <div style={{
                                        padding: '10px 14px',
                                        background: dispCoverage.covered ? '#f0fdf4' : '#fefce8',
                                        border: `1px solid ${dispCoverage.covered ? '#bbf7d0' : '#fde68a'}`,
                                        marginBottom: '16px',
                                        fontSize: '13px',
                                      }}>
                                        {dispCoverage.covered ? (
                                          <span style={{ color: '#166534', fontWeight: 600 }}>
                                            ✓ Covered — {dispCoverage.coverage_source}
                                          </span>
                                        ) : (
                                          <span style={{ color: '#92400e', fontWeight: 600 }}>
                                            Not covered by subscription — dispensing will log to protocol
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Entry type */}
                                    <div style={styles.dispenseFieldGroup}>
                                      <label style={styles.fieldLabel}>Entry Type</label>
                                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {['injection', 'pickup', 'session'].map(type => (
                                          <button
                                            key={type}
                                            style={{
                                              ...styles.subCategoryTab,
                                              ...(dispEntryType === type ? styles.subCategoryTabActive : {}),
                                              padding: '6px 14px',
                                            }}
                                            onClick={() => setDispEntryType(type)}
                                          >
                                            {getDispenseEntryLabel(type)}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Medication — HRT shows full med list including HCG */}
                                    <div style={styles.dispenseFieldGroup}>
                                      <label style={styles.fieldLabel}>Medication</label>
                                      {cat === 'testosterone' ? (
                                        <select
                                          value={dispMedication}
                                          onChange={e => { setDispMedication(e.target.value); setDispDosage(''); }}
                                          style={styles.fieldInput}
                                        >
                                          <option value="">Select medication...</option>
                                          {(HRT_MEDICATIONS || []).map(m => (
                                            <option key={m} value={m}>{m}</option>
                                          ))}
                                        </select>
                                      ) : cat === 'weight_loss' ? (
                                        <select
                                          value={dispMedication}
                                          onChange={e => { setDispMedication(e.target.value); setDispDosage(''); }}
                                          style={styles.fieldInput}
                                        >
                                          <option value="">Select medication...</option>
                                          {(WEIGHT_LOSS_MEDICATIONS || []).map(m => (
                                            <option key={m.value || m} value={m.value || m}>{m.label || m}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type="text"
                                          value={dispMedication}
                                          onChange={e => setDispMedication(e.target.value)}
                                          placeholder="Medication name"
                                          style={styles.fieldInput}
                                        />
                                      )}
                                    </div>

                                    {/* Dosage — context-aware based on medication */}
                                    <div style={styles.dispenseFieldGroup}>
                                      <label style={styles.fieldLabel}>Dosage</label>
                                      {(() => {
                                        // HRT: testosterone doses are gender-specific
                                        if (cat === 'testosterone' && (dispMedication === 'Testosterone Cypionate' || dispMedication === 'Testosterone Enanthate')) {
                                          const gender = dispCoverage?.patient_gender || 'male';
                                          const doses = TESTOSTERONE_DOSES[gender] || TESTOSTERONE_DOSES.male || [];
                                          return (
                                            <select value={dispDosage} onChange={e => setDispDosage(e.target.value)} style={styles.fieldInput}>
                                              <option value="">Select dose...</option>
                                              {doses.map(d => (
                                                <option key={d.value} value={d.value}>{d.label}</option>
                                              ))}
                                            </select>
                                          );
                                        }
                                        // HRT: secondary meds (HCG, Gonadorelin, Nandrolone)
                                        if (cat === 'testosterone' && HRT_SECONDARY_DOSAGES[dispMedication]) {
                                          const secDoses = HRT_SECONDARY_DOSAGES[dispMedication].doses || [];
                                          return (
                                            <select value={dispDosage} onChange={e => setDispDosage(e.target.value)} style={styles.fieldInput}>
                                              <option value="">Select dose...</option>
                                              {secDoses.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                              ))}
                                            </select>
                                          );
                                        }
                                        // Weight loss doses
                                        if (cat === 'weight_loss' && dispMedication) {
                                          const wlDoses = getDoseOptions('weight_loss', dispMedication) || [];
                                          return (
                                            <select value={dispDosage} onChange={e => setDispDosage(e.target.value)} style={styles.fieldInput}>
                                              <option value="">Select dose...</option>
                                              {wlDoses.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                              ))}
                                            </select>
                                          );
                                        }
                                        // Default: free text
                                        return (
                                          <input
                                            type="text"
                                            value={dispDosage}
                                            onChange={e => setDispDosage(e.target.value)}
                                            placeholder="e.g. 200mg/ml"
                                            style={styles.fieldInput}
                                          />
                                        );
                                      })()}
                                    </div>

                                    {/* Supply type for HRT testosterone */}
                                    {cat === 'testosterone' && (dispMedication === 'Testosterone Cypionate' || dispMedication === 'Testosterone Enanthate') && (
                                      <div style={styles.dispenseFieldGroup}>
                                        <label style={styles.fieldLabel}>Supply Type</label>
                                        <select
                                          value={dispSupplyType}
                                          onChange={e => setDispSupplyType(e.target.value)}
                                          style={styles.fieldInput}
                                        >
                                          <option value="">Select supply type...</option>
                                          {(HRT_SUPPLY_TYPES || []).map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                          ))}
                                        </select>
                                      </div>
                                    )}

                                    {/* Quantity */}
                                    <div style={styles.dispenseFieldGroup}>
                                      <label style={styles.fieldLabel}>Quantity</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={dispQuantity}
                                        onChange={e => setDispQuantity(e.target.value)}
                                        placeholder={dispEntryType === 'injection' ? 'Number of injections' : dispEntryType === 'session' ? 'Number of sessions' : 'Units dispensed'}
                                        style={{ ...styles.fieldInput, width: '120px' }}
                                      />
                                    </div>

                                    {/* Administered by + Verified by */}
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                      <div style={{ ...styles.dispenseFieldGroup, flex: 1 }}>
                                        <label style={styles.fieldLabel}>Administered By</label>
                                        <select
                                          value={dispAdministeredBy}
                                          onChange={e => setDispAdministeredBy(e.target.value)}
                                          style={styles.fieldInput}
                                        >
                                          <option value="">Select...</option>
                                          {employees.map(emp => (
                                            <option key={emp.id} value={emp.name || emp.full_name}>
                                              {emp.name || emp.full_name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div style={{ ...styles.dispenseFieldGroup, flex: 1 }}>
                                        <label style={styles.fieldLabel}>Verified By</label>
                                        <select
                                          value={dispVerifiedBy}
                                          onChange={e => setDispVerifiedBy(e.target.value)}
                                          style={styles.fieldInput}
                                        >
                                          <option value="">Select...</option>
                                          {employees.map(emp => (
                                            <option key={emp.id} value={emp.name || emp.full_name}>
                                              {emp.name || emp.full_name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    {/* Fulfillment */}
                                    <div style={styles.dispenseFieldGroup}>
                                      <label style={styles.fieldLabel}>Fulfillment</label>
                                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {['injection', 'pickup'].includes(dispEntryType) && (
                                          <>
                                            <button
                                              onClick={() => setDispFulfillment('in_clinic')}
                                              style={{
                                                ...styles.fulfillmentBtn,
                                                ...(dispFulfillment === 'in_clinic' ? { border: '2px solid #2E75B6', background: '#EBF3FB', color: '#2E75B6' } : {}),
                                              }}
                                            >In Clinic</button>
                                            <button
                                              onClick={() => setDispFulfillment('overnight')}
                                              style={{
                                                ...styles.fulfillmentBtn,
                                                ...(dispFulfillment === 'overnight' ? { border: '2px solid #e67e22', background: '#FFF5EB', color: '#e67e22' } : {}),
                                              }}
                                            >Overnighted</button>
                                          </>
                                        )}
                                        {dispEntryType === 'session' && (
                                          <span style={{ fontSize: '13px', color: '#888', padding: '10px 0' }}>In-clinic session</span>
                                        )}
                                      </div>
                                      {dispFulfillment === 'overnight' && (
                                        <input
                                          type="text"
                                          placeholder="Tracking number (optional)"
                                          value={dispTrackingNumber}
                                          onChange={e => setDispTrackingNumber(e.target.value)}
                                          style={{ ...styles.fieldInput, marginTop: '8px' }}
                                        />
                                      )}
                                    </div>

                                    {/* POS service selector — shown when NOT covered (paid renewals, etc.) */}
                                    {dispCoverage && !dispCoverage.covered && (dispCoverage.suggested_services || []).length > 0 && (
                                      <div style={styles.dispenseFieldGroup}>
                                        <label style={styles.fieldLabel}>Charge Service (Renewal / Add-On)</label>
                                        <div style={{
                                          fontSize: '11px', color: '#92400e', marginBottom: '8px',
                                        }}>
                                          Select a service to charge for this dispensing, or leave blank to log without charging.
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <button
                                            style={{
                                              ...styles.posServiceOption,
                                              ...(dispSelectedService === null ? { border: '2px solid #1a1a1a', background: '#f9fafb' } : {}),
                                            }}
                                            onClick={() => setDispSelectedService(null)}
                                          >
                                            <span style={{ fontWeight: 600 }}>No charge — log to protocol only</span>
                                            <span style={{ color: '#166534', fontWeight: 700 }}>$0.00</span>
                                          </button>
                                          {(dispCoverage.suggested_services || []).map(svc => (
                                            <button
                                              key={svc.id}
                                              style={{
                                                ...styles.posServiceOption,
                                                ...(dispSelectedService?.id === svc.id ? { border: '2px solid #1e40af', background: '#eff6ff' } : {}),
                                              }}
                                              onClick={() => setDispSelectedService(svc)}
                                            >
                                              <span style={{ fontWeight: 500 }}>{svc.name}</span>
                                              <span style={{ fontWeight: 700 }}>{svc.price_display}{svc.recurring ? '/mo' : ''}</span>
                                            </button>
                                          ))}
                                        </div>
                                        {dispSelectedService && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                            <label style={{ fontSize: '12px', color: '#666' }}>Qty:</label>
                                            <input
                                              type="number"
                                              min="1"
                                              value={dispItemQty}
                                              onChange={e => setDispItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                                              style={{ ...styles.fieldInput, width: '70px' }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Notes */}
                                    <div style={styles.dispenseFieldGroup}>
                                      <label style={styles.fieldLabel}>Notes (optional)</label>
                                      <input
                                        type="text"
                                        value={dispNotes}
                                        onChange={e => setDispNotes(e.target.value)}
                                        placeholder="Any notes for this dispensing..."
                                        style={styles.fieldInput}
                                      />
                                    </div>

                                    {/* Add to Cart */}
                                    <button
                                      onClick={handleAddDispenseToCart}
                                      disabled={!dispEntryType || !dispMedication}
                                      style={{
                                        ...styles.primaryBtn,
                                        marginTop: '8px',
                                        opacity: (!dispEntryType || !dispMedication) ? 0.5 : 1,
                                      }}
                                    >
                                      Add to Cart — {dispMedication || proto.program_name || 'Medication'}
                                      {dispCoverage?.covered
                                        ? ' ($0 Covered)'
                                        : dispSelectedService
                                          ? ` (${dispSelectedService.price_display})`
                                          : ' ($0 Log Only)'
                                      }
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* ── Category detail view ── */
                <div>
                  <button
                    style={styles.backBtn}
                    onClick={() => { setActiveSegment(null); setActiveSubCategory(null); }}
                  >
                    ← Back to categories
                  </button>

                  <div style={styles.segmentHeader}>
                    <span style={styles.segmentHeaderIcon}>{activeSegment.icon}</span>
                    <h2 style={styles.segmentHeaderTitle}>{activeSegment.label}</h2>
                  </div>

                  {/* Sub-category tabs */}
                  {activeSegment.categories.length > 1 && (
                    <div style={styles.subCategoryTabs}>
                      {activeSegment.categories.map(catId => {
                        const items = getItemsByCategory(catId);
                        if (items.length === 0 && catId !== 'custom') return null;
                        return (
                          <button
                            key={catId}
                            style={{
                              ...styles.subCategoryTab,
                              ...(activeSubCategory === catId ? styles.subCategoryTabActive : {}),
                            }}
                            onClick={() => setActiveSubCategory(catId)}
                          >
                            {CATEGORY_LABELS[catId] || catId}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Service items */}
                  {activeSubCategory === 'custom' ? (
                    <div style={styles.customForm}>
                      <div style={styles.fieldGroup}>
                        <label style={styles.fieldLabel}>Amount ($)</label>
                        <input
                          type="number"
                          min="0.50"
                          step="0.01"
                          value={customAmount}
                          onChange={e => setCustomAmount(e.target.value)}
                          placeholder="0.00"
                          style={styles.fieldInput}
                        />
                      </div>
                      <div style={styles.fieldGroup}>
                        <label style={styles.fieldLabel}>Description</label>
                        <input
                          type="text"
                          value={customDescription}
                          onChange={e => setCustomDescription(e.target.value)}
                          placeholder="What is this charge for?"
                          style={styles.fieldInput}
                        />
                      </div>
                    </div>
                  ) : activeSubCategory === 'gift_card' ? (
                    <div>
                      <div style={styles.serviceGrid}>
                        {getItemsByCategory('gift_card').map(item => (
                          <ServiceCard
                            key={item.id}
                            item={item}
                            inCart={cartItems.some(i => i.id === item.id)}
                            onClick={() => toggleCartItem(item)}
                          />
                        ))}
                      </div>
                      <div style={styles.customForm}>
                        <div style={styles.fieldGroup}>
                          <label style={styles.fieldLabel}>Custom Gift Card Amount</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={giftCardCustomAmount}
                              onChange={e => setGiftCardCustomAmount(e.target.value)}
                              placeholder="Enter amount"
                              style={{ ...styles.fieldInput, flex: 1 }}
                            />
                            <button
                              onClick={addGiftCardCustom}
                              disabled={!giftCardCustomAmount || parseFloat(giftCardCustomAmount) < 1}
                              style={{
                                ...styles.primaryBtn,
                                padding: '12px 24px',
                                opacity: (!giftCardCustomAmount || parseFloat(giftCardCustomAmount) < 1) ? 0.4 : 1,
                              }}
                            >
                              Add ${giftCardCustomAmount || '0'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeSubCategory === 'peptide' ? (
                    /* Peptide accordion */
                    (() => {
                      const { groups, sortedKeys } = getGroupedPeptides();
                      return (
                        <div style={{ marginTop: '16px' }}>
                          {sortedKeys.map(groupName => {
                            const isExpanded = expandedPeptideGroups[groupName];
                            const groupHasCartItem = groups[groupName].some(item => cartItems.some(ci => ci.id === item.id));
                            return (
                              <div key={groupName} style={styles.peptideGroup}>
                                <button
                                  style={{
                                    ...styles.peptideGroupHeader,
                                    ...(groupHasCartItem ? { borderColor: '#10b981', background: '#f0fdf4' } : {}),
                                  }}
                                  onClick={() => setExpandedPeptideGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '16px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{groupName}</span>
                                    <span style={{ fontSize: '13px', color: '#888' }}>({groups[groupName].length})</span>
                                  </div>
                                  {groupHasCartItem && (
                                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>✓ In Cart</span>
                                  )}
                                </button>
                                {isExpanded && (
                                  <div style={styles.serviceGrid}>
                                    {groups[groupName].map(item => (
                                      <ServiceCard
                                        key={item.id}
                                        item={item}
                                        inCart={cartItems.some(i => i.id === item.id)}
                                        onClick={() => toggleCartItem(item)}
                                        showPeptideId
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    /* Standard category with optional sub-groups */
                    (() => {
                      const items = getItemsByCategory(activeSubCategory);
                      const grouped = getSubGroupedItems(items, activeSubCategory);
                      if (grouped && grouped.subgroups.length > 0) {
                        return (
                          <div style={{ marginTop: '16px' }}>
                            {grouped.subgroups.map(sg => (
                              <div key={sg.label} style={{ marginBottom: '24px' }}>
                                <div style={styles.subGroupLabel}>{sg.label}</div>
                                <div style={styles.serviceGrid}>
                                  {sg.items.map(item => (
                                    <ServiceCard
                                      key={item.id}
                                      item={item}
                                      inCart={cartItems.some(i => i.id === item.id)}
                                      onClick={() => toggleCartItem(item)}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                            {grouped.ungrouped.length > 0 && (
                              <div style={{ marginBottom: '24px' }}>
                                <div style={styles.subGroupLabel}>Other</div>
                                <div style={styles.serviceGrid}>
                                  {grouped.ungrouped.map(item => (
                                    <ServiceCard
                                      key={item.id}
                                      item={item}
                                      inCart={cartItems.some(i => i.id === item.id)}
                                      onClick={() => toggleCartItem(item)}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div style={styles.serviceGrid}>
                          {items.map(item => (
                            <ServiceCard
                              key={item.id}
                              item={item}
                              inCart={cartItems.some(i => i.id === item.id)}
                              onClick={() => toggleCartItem(item)}
                            />
                          ))}
                          {items.length === 0 && (
                            <div style={{ padding: '40px', color: '#888', textAlign: 'center', gridColumn: '1 / -1' }}>
                              No services in this category
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>

            {/* ── Sticky cart sidebar ── */}
            <div style={styles.cartSidebar}>
              <div style={styles.cartHeader}>
                <h3 style={styles.cartTitle}>Cart</h3>
                {totalItems > 0 && (
                  <span style={styles.cartBadge}>{totalItems}</span>
                )}
              </div>

              {cartItems.length === 0 && activeSubCategory !== 'custom' ? (
                <div style={styles.cartEmpty}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
                  <div>Select services to add them here</div>
                </div>
              ) : (
                <div style={styles.cartBody}>
                  {/* Cart items — dispense items + service items */}
                  {cartItems.map(item => {
                    // Dispense items
                    if (item.type === 'dispense') {
                      const d = item.dispenseDetails;
                      const isPaidDispense = (item.price || 0) > 0;
                      const lineTotal = isPaidDispense ? (item.price || 0) * (item.quantity || 1) : 0;
                      return (
                        <div key={item.id} style={{
                          ...styles.cartItem,
                          background: isPaidDispense ? '#eff6ff' : '#f0fdf4',
                          padding: '10px', marginLeft: '-10px', marginRight: '-10px', borderRadius: '0',
                        }}>
                          <div style={styles.cartItemHeader}>
                            <span style={styles.cartItemName}>{item.name}</span>
                            <button
                              style={styles.cartRemoveBtn}
                              onClick={() => setCartItems(cartItems.filter(i => i.id !== item.id))}
                            >×</button>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#888' }}>
                              {getDispenseEntryLabel(d?.entryType || 'pickup')}
                              {d?.quantity ? ` · Qty: ${d.quantity}` : ''}
                              {d?.fulfillmentMethod === 'overnight' ? ' · Overnighted' : ''}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {item.coverageBadge ? (
                                <span style={{
                                  fontSize: '10px', fontWeight: 700, color: '#166534',
                                  background: '#dcfce7', border: '1px solid #86efac',
                                  padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em',
                                }}>
                                  {item.coverageBadge}
                                </span>
                              ) : isPaidDispense && d?.protocolName ? (
                                <span style={{
                                  fontSize: '10px', fontWeight: 700, color: '#1e40af',
                                  background: '#dbeafe', border: '1px solid #93c5fd',
                                  padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em',
                                }}>
                                  Linked to {d.protocolName}
                                </span>
                              ) : null}
                              <span style={{ fontSize: '14px', fontWeight: 700, color: isPaidDispense ? '#1a1a1a' : '#166534' }}>
                                {isPaidDispense ? formatPrice(lineTotal) : '$0.00'}
                              </span>
                            </div>
                          </div>
                          {/* Quantity controls for paid dispense items */}
                          {isPaidDispense && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                              <div style={styles.qtyControls}>
                                <button style={styles.qtyBtn} onClick={() => updateItemQuantity(item.id, (item.quantity || 1) - 1)}>−</button>
                                <span style={styles.qtyValue}>{item.quantity || 1}</span>
                                <button style={styles.qtyBtn} onClick={() => updateItemQuantity(item.id, (item.quantity || 1) + 1)}>+</button>
                              </div>
                              {item.recurring && <span style={{ fontSize: '11px', color: '#888' }}>/mo</span>}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Regular service items
                    const qty = item.quantity || 1;
                    const lineBase = (item.price || 0) * qty;
                    const lineDiscount = getItemDiscountCents(item);
                    const lineTotal = lineBase - lineDiscount;
                    return (
                      <div key={item.id} style={styles.cartItem}>
                        <div style={styles.cartItemHeader}>
                          <span style={styles.cartItemName}>
                            {item.peptide_identifier ? `${item.name} — ${item.peptide_identifier}` : item.name}
                          </span>
                          <button
                            style={styles.cartRemoveBtn}
                            onClick={() => setCartItems(cartItems.filter(i => i.id !== item.id))}
                          >×</button>
                        </div>
                        <div style={styles.cartItemDetails}>
                          <div style={styles.qtyControls}>
                            <button style={styles.qtyBtn} onClick={() => updateItemQuantity(item.id, qty - 1)}>−</button>
                            <span style={styles.qtyValue}>{qty}</span>
                            <button style={styles.qtyBtn} onClick={() => updateItemQuantity(item.id, qty + 1)}>+</button>
                          </div>
                          <div style={styles.cartItemPrice}>
                            {lineDiscount > 0 && (
                              <span style={styles.originalPrice}>{formatPrice(lineBase)}</span>
                            )}
                            {formatPrice(lineTotal)}
                            {item.recurring && <span style={styles.recurringLabel}>/mo</span>}
                          </div>
                        </div>
                        {/* Per-item discount */}
                        <div style={styles.itemDiscountRow}>
                          <span style={{ fontSize: '11px', color: '#888', marginRight: '6px' }}>Discount:</span>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {['none', 'percent', 'dollar'].map(type => (
                              <button
                                key={type}
                                style={{
                                  ...styles.miniToggle,
                                  ...(item.itemDiscountType === type ? styles.miniToggleActive : {}),
                                }}
                                onClick={() => updateItemDiscount(item.id, 'type', type)}
                              >
                                {type === 'none' ? '—' : type === 'percent' ? '%' : '$'}
                              </button>
                            ))}
                          </div>
                          {item.itemDiscountType !== 'none' && (
                            <input
                              type="number"
                              min="0"
                              step={item.itemDiscountType === 'percent' ? '1' : '0.01'}
                              max={item.itemDiscountType === 'percent' ? '100' : undefined}
                              value={item.itemDiscountValue}
                              onChange={e => updateItemDiscount(item.id, 'value', e.target.value)}
                              placeholder={item.itemDiscountType === 'percent' ? '10' : '25'}
                              style={styles.miniInput}
                            />
                          )}
                          {lineDiscount > 0 && (
                            <span style={{ fontSize: '11px', color: '#16a34a', marginLeft: '4px' }}>
                              −{formatPrice(lineDiscount)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Custom charge in cart area */}
                  {activeSubCategory === 'custom' && parseFloat(customAmount) > 0 && (
                    <div style={styles.cartItem}>
                      <div style={styles.cartItemHeader}>
                        <span style={styles.cartItemName}>{customDescription || 'Custom charge'}</span>
                      </div>
                      <div style={styles.cartItemPrice}>{formatPrice(Math.round(parseFloat(customAmount) * 100))}</div>
                    </div>
                  )}

                  {/* Cart-wide discount */}
                  {(cartItems.length > 0 || (activeSubCategory === 'custom' && parseFloat(customAmount) > 0)) && (
                    <div style={styles.cartDiscountSection}>
                      <div style={styles.cartDiscountLabel}>Cart Discount</div>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                        {['none', 'percent', 'dollar'].map(type => (
                          <button
                            key={type}
                            style={{
                              ...styles.discountToggle,
                              ...(cartDiscountType === type ? styles.discountToggleActive : {}),
                            }}
                            onClick={() => { setCartDiscountType(type); setCartDiscountValue(''); }}
                          >
                            {type === 'none' ? 'None' : type === 'percent' ? '% Off' : '$ Off'}
                          </button>
                        ))}
                      </div>
                      {cartDiscountType !== 'none' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {cartDiscountType === 'dollar' && <span style={{ fontSize: '13px', color: '#888' }}>$</span>}
                          <input
                            type="number"
                            min="0"
                            step={cartDiscountType === 'percent' ? '1' : '0.01'}
                            max={cartDiscountType === 'percent' ? '100' : undefined}
                            value={cartDiscountValue}
                            onChange={e => setCartDiscountValue(e.target.value)}
                            placeholder={cartDiscountType === 'percent' ? '10' : '25'}
                            style={styles.miniInput}
                          />
                          {cartDiscountType === 'percent' && <span style={{ fontSize: '13px', color: '#888' }}>%</span>}
                          {getCartDiscountCents() > 0 && (
                            <span style={{ fontSize: '12px', color: '#16a34a', marginLeft: '4px' }}>
                              −{formatPrice(getCartDiscountCents())}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Promo code */}
                  {(cartItems.length > 0 || (activeSubCategory === 'custom' && parseFloat(customAmount) > 0)) && (
                    <div style={styles.promoSection}>
                      <div style={styles.cartDiscountLabel}>Promo Code</div>
                      {promoApplied ? (
                        <div style={styles.promoApplied}>
                          <span style={{ fontWeight: 600, color: '#166534' }}>
                            {promoApplied.code} — {promoApplied.type === 'percent' ? `${promoApplied.value}% off` : `$${promoApplied.value} off`}
                          </span>
                          <button
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                            onClick={() => { setPromoApplied(null); setPromoCode(''); }}
                          >Remove</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            value={promoCode}
                            onChange={e => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="Enter code"
                            style={{ ...styles.miniInput, flex: 1, width: 'auto' }}
                          />
                          <button
                            onClick={applyPromoCode}
                            disabled={!promoCode.trim() || promoLoading}
                            style={{
                              ...styles.primaryBtn,
                              padding: '6px 14px',
                              fontSize: '12px',
                              opacity: (!promoCode.trim() || promoLoading) ? 0.4 : 1,
                            }}
                          >
                            {promoLoading ? '...' : 'Apply'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cart totals */}
                  {(cartItems.length > 0 || (activeSubCategory === 'custom' && parseFloat(customAmount) > 0)) && (
                    <div style={styles.cartTotals}>
                      {totalDiscount > 0 && (
                        <>
                          <div style={styles.cartTotalRow}>
                            <span>Subtotal</span>
                            <span>{formatPrice(baseAmount)}</span>
                          </div>
                          <div style={{ ...styles.cartTotalRow, color: '#16a34a' }}>
                            <span>Discount</span>
                            <span>−{formatPrice(totalDiscount)}</span>
                          </div>
                        </>
                      )}
                      <div style={styles.cartTotalFinal}>
                        <span>Total</span>
                        <span style={{ fontSize: '20px' }}>
                          {formatPrice(chargeAmount)}
                          {isRecurring() && <span style={{ fontSize: '14px', color: '#888' }}>/mo</span>}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Warning */}
                  {cartWarning && (
                    <div style={styles.cartWarningMsg}>{cartWarning}</div>
                  )}

                  {/* Action buttons */}
                  {canProceedToPayment() && (
                    <div style={styles.cartActions}>
                      <button
                        style={styles.primaryBtn}
                        onClick={() => {
                          if (hasOnlyFreeDispenseItems()) {
                            processDispenseOnly();
                          } else {
                            setStep('payment');
                          }
                        }}
                      >
                        {hasOnlyFreeDispenseItems()
                          ? 'Complete Checkout — Dispense Only'
                          : `Continue to Payment — ${formatPrice(chargeAmount)}`
                        }
                      </button>
                      <button
                        style={styles.invoiceBtn}
                        onClick={() => setShowInvoiceSend(true)}
                      >
                        Send Invoice Instead
                      </button>

                      {/* Invoice send options */}
                      {showInvoiceSend && (
                        <div style={styles.invoicePanel}>
                          <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#1e40af' }}>Send invoice via:</p>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {['sms', 'email', 'both'].map(via => (
                              <button
                                key={via}
                                onClick={() => handleSendInvoice(via)}
                                disabled={invoiceSending}
                                style={styles.invoiceOptionBtn}
                              >
                                {via === 'sms' ? 'SMS' : via === 'email' ? 'Email' : 'Both'}
                              </button>
                            ))}
                            <button
                              onClick={() => setShowInvoiceSend(false)}
                              style={{ ...styles.invoiceOptionBtn, color: '#888' }}
                            >Cancel</button>
                          </div>
                          {invoiceSending && <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>Sending...</p>}
                        </div>
                      )}

                      {/* Invoice result */}
                      {invoiceResult && (
                        <div style={{
                          padding: '12px',
                          background: invoiceResult.success ? '#dcfce7' : '#fee2e2',
                          marginTop: '8px',
                        }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: invoiceResult.success ? '#166534' : '#dc2626' }}>
                            {invoiceResult.message}
                          </p>
                          {invoiceResult.success && invoiceResult.url && (
                            <div style={{ marginTop: '6px' }}>
                              <input
                                type="text"
                                readOnly
                                value={invoiceResult.url}
                                style={{ width: '100%', padding: '6px 8px', border: '1px solid #e5e5e5', fontSize: '11px', background: '#fff', boxSizing: 'border-box' }}
                                onClick={e => e.target.select()}
                              />
                            </div>
                          )}
                          <button
                            onClick={() => { setInvoiceResult(null); handleNewCheckout(); }}
                            style={{ ...styles.primaryBtn, marginTop: '8px', background: invoiceResult.success ? '#166534' : '#000' }}
                          >Done</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════ STEP: PAYMENT ═══════════════════════════════ */}
        {step === 'payment' && (
          <div style={styles.paymentStep}>
            <div style={styles.paymentCard}>
              <div style={styles.paymentHeader}>
                <button style={styles.backBtn} onClick={() => setStep('browse')}>← Back to services</button>
                <h2 style={styles.stepTitle}>Payment</h2>
                <div style={styles.paymentPatient}>{patient?.name}</div>
              </div>

              {/* Order summary */}
              <div style={styles.orderSummary}>
                <div style={styles.orderSummaryLabel}>ORDER SUMMARY</div>
                {/* Free dispense items first */}
                {getFreeDispenseItems().map(item => (
                  <div key={item.id} style={{ ...styles.orderItem, color: '#166534' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.name}
                      <span style={{
                        fontSize: '9px', fontWeight: 700, background: '#dcfce7', border: '1px solid #86efac',
                        padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {item.coverageBadge || 'Covered'}
                      </span>
                    </span>
                    <span>$0.00</span>
                  </div>
                ))}
                {/* Paid items (including paid dispense items) */}
                {getPaidCartItems().map(item => {
                  const qty = item.quantity || 1;
                  const lineBase = (item.price || 0) * qty;
                  const lineDisc = getItemDiscountCents(item);
                  const lineTotal = lineBase - lineDisc;
                  return (
                    <div key={item.id} style={styles.orderItem}>
                      <span>{qty > 1 ? `${item.name} x${qty}` : item.name}</span>
                      <span>
                        {lineDisc > 0 && <span style={styles.originalPrice}>{formatPrice(lineBase)}</span>}
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  );
                })}
                {activeSubCategory === 'custom' && (
                  <div style={styles.orderItem}>
                    <span>{customDescription || 'Custom charge'}</span>
                    <span>{formatPrice(getBaseAmount())}</span>
                  </div>
                )}
                {totalDiscount > 0 && (
                  <div style={{ ...styles.orderItem, color: '#16a34a' }}>
                    <span>Discount</span>
                    <span>−{formatPrice(totalDiscount)}</span>
                  </div>
                )}
                <div style={styles.orderTotal}>
                  <span>Total</span>
                  <span>{formatPrice(chargeAmount)}{isRecurring() ? '/mo' : ''}</span>
                </div>
              </div>

              {/* Shipping */}
              <div style={styles.paymentSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#666' }}>Shipping $</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingAmount}
                    onChange={e => setShippingAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100px', padding: '8px 10px', border: '1px solid #e0e0e0', fontSize: '14px' }}
                  />
                  {getShippingCents() > 0 && (
                    <span style={{ fontSize: '13px', color: '#888' }}>
                      New total: <strong>{formatPrice(chargeAmount)}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Fulfillment */}
              {cartItems.some(i => ['peptide', 'weight_loss', 'hrt', 'vials'].includes(i.category)) && (
                <div style={styles.paymentSection}>
                  <div style={styles.paymentSectionLabel}>FULFILLMENT</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {cartItems.some(i => i.category === 'weight_loss') && (
                      <button
                        onClick={() => setFulfillmentMethod('in_clinic_injections')}
                        style={{
                          ...styles.fulfillmentBtn,
                          ...(fulfillmentMethod === 'in_clinic_injections' ? { border: '2px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed' } : {}),
                        }}
                      >In-Clinic Injections</button>
                    )}
                    <button
                      onClick={() => setFulfillmentMethod('in_clinic')}
                      style={{
                        ...styles.fulfillmentBtn,
                        ...(fulfillmentMethod === 'in_clinic' ? { border: '2px solid #2E75B6', background: '#EBF3FB', color: '#2E75B6' } : {}),
                      }}
                    >Picked Up In Clinic</button>
                    <button
                      onClick={() => setFulfillmentMethod('overnight')}
                      style={{
                        ...styles.fulfillmentBtn,
                        ...(fulfillmentMethod === 'overnight' ? { border: '2px solid #e67e22', background: '#FFF5EB', color: '#e67e22' } : {}),
                      }}
                    >Overnighted</button>
                  </div>
                  {fulfillmentMethod === 'overnight' && (
                    <input
                      type="text"
                      placeholder="Tracking number (optional)"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', fontSize: '13px', boxSizing: 'border-box', marginTop: '8px' }}
                    />
                  )}
                </div>
              )}

              {/* Payment methods */}
              <div style={styles.paymentSection}>
                <div style={styles.paymentSectionLabel}>PAYMENT METHOD</div>
                {loadingCards ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Loading saved cards...</div>
                ) : (
                  <>
                    {savedCards.length > 0 && savedCards.map(card => (
                      <label key={card.id} style={styles.paymentOption}>
                        <input type="radio" name="pay_method" checked={selectedCard === card.id} onChange={() => setSelectedCard(card.id)} />
                        <span style={styles.cardBrand}>{card.brand.toUpperCase()}</span>
                        <span>•••• {card.last4}</span>
                        <span style={styles.cardExp}>{card.exp_month}/{card.exp_year}</span>
                      </label>
                    ))}

                    <label style={styles.paymentOption}>
                      <input type="radio" name="pay_method" checked={selectedCard === 'new'} onChange={() => setSelectedCard('new')} />
                      <span>New Card</span>
                    </label>
                    {selectedCard === 'new' && (
                      <div style={styles.cardElementWrap}>
                        <CardElement options={CARD_ELEMENT_OPTIONS} />
                        <label style={styles.saveCardLabel}>
                          <input type="checkbox" checked={saveNewCard} onChange={e => setSaveNewCard(e.target.checked)} />
                          Save card for future charges
                        </label>
                      </div>
                    )}

                    <label style={styles.paymentOption}>
                      <input type="radio" name="pay_method" checked={selectedCard === 'cash'} onChange={() => setSelectedCard('cash')} />
                      <span>Cash</span>
                    </label>

                    <label style={styles.paymentOption}>
                      <input type="radio" name="pay_method" checked={selectedCard === 'split'} onChange={() => { setSelectedCard('split'); if (!splitCardSelection) setSplitCardSelection(savedCards.length > 0 ? savedCards[0].id : 'new'); }} />
                      <span>Split Payment (Cash + Card)</span>
                    </label>
                    {selectedCard === 'split' && (
                      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Cash Portion</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 600 }}>$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={splitCashAmount}
                              onChange={e => setSplitCashAmount(e.target.value)}
                              placeholder="0.00"
                              style={{ ...styles.fieldInput, flex: 1, fontSize: '16px', fontWeight: 600 }}
                            />
                          </div>
                        </div>
                        {(() => {
                          const cashCents = Math.round((parseFloat(splitCashAmount) || 0) * 100);
                          const cardCents = chargeAmount - cashCents;
                          const isValid = cashCents > 0 && cardCents > 0 && cashCents < chargeAmount;
                          return (
                            <div style={{ padding: '10px', background: isValid ? '#f0fdf4' : '#fef3c7', border: isValid ? '1px solid #bbf7d0' : '1px solid #fde68a', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span>Cash:</span><span style={{ fontWeight: 600 }}>{formatPrice(cashCents)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                                <span>Card:</span><span style={{ fontWeight: 600, color: cardCents > 0 ? '#166534' : '#dc2626' }}>{cardCents > 0 ? formatPrice(cardCents) : '$0'}</span>
                              </div>
                            </div>
                          );
                        })()}
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Card for Remaining Balance</label>
                        {savedCards.map(card => (
                          <label key={card.id} style={{ ...styles.paymentOption, padding: '6px 0' }}>
                            <input type="radio" name="split_card" checked={splitCardSelection === card.id} onChange={() => setSplitCardSelection(card.id)} />
                            <span style={styles.cardBrand}>{card.brand.toUpperCase()}</span>
                            <span>•••• {card.last4}</span>
                          </label>
                        ))}
                        <label style={{ ...styles.paymentOption, padding: '6px 0' }}>
                          <input type="radio" name="split_card" checked={splitCardSelection === 'new'} onChange={() => setSplitCardSelection('new')} />
                          <span>New Card</span>
                        </label>
                        {splitCardSelection === 'new' && (
                          <div style={styles.cardElementWrap}>
                            <CardElement options={CARD_ELEMENT_OPTIONS} />
                            <label style={styles.saveCardLabel}>
                              <input type="checkbox" checked={saveNewCard} onChange={e => setSaveNewCard(e.target.checked)} />
                              Save card
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {!isGiftCardPurchase() && creditBalanceCents > 0 && (
                      <>
                        <label style={styles.paymentOption}>
                          <input type="radio" name="pay_method" checked={selectedCard === 'account_credit'} onChange={() => setSelectedCard('account_credit')} />
                          <span>Account Credit — {formatPrice(creditBalanceCents)}</span>
                        </label>
                        {selectedCard === 'account_credit' && creditBalanceCents < chargeAmount && (
                          <div style={{ padding: '8px 16px', fontSize: '13px', color: '#dc2626' }}>
                            Insufficient credit ({formatPrice(creditBalanceCents)} available, {formatPrice(chargeAmount)} needed)
                          </div>
                        )}
                      </>
                    )}

                    {!isGiftCardPurchase() && (
                      <>
                        <label style={styles.paymentOption}>
                          <input type="radio" name="pay_method" checked={selectedCard === 'gift_card'} onChange={() => { setSelectedCard('gift_card'); setGiftCardLookup(null); setGiftCardCode(''); }} />
                          <span>Gift Card</span>
                        </label>
                        {selectedCard === 'gift_card' && (
                          <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <input
                                type="text"
                                value={giftCardCode}
                                onChange={e => setGiftCardCode(e.target.value.toUpperCase())}
                                placeholder="RM-XXXX-XXXX"
                                style={{ ...styles.fieldInput, flex: 1, fontFamily: 'monospace', letterSpacing: '1px' }}
                              />
                              <button
                                onClick={handleGiftCardLookup}
                                disabled={!giftCardCode.trim() || lookingUpGiftCard}
                                style={{ ...styles.primaryBtn, padding: '8px 16px', opacity: (!giftCardCode.trim() || lookingUpGiftCard) ? 0.4 : 1 }}
                              >
                                {lookingUpGiftCard ? '...' : 'Look Up'}
                              </button>
                            </div>
                            {giftCardLookup && !giftCardLookup.error && (
                              <div style={{ padding: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <div style={{ fontWeight: 600, color: '#166534' }}>Balance: {formatPrice(giftCardLookup.remaining_amount)}</div>
                                {giftCardLookup.remaining_amount < chargeAmount && (
                                  <div style={{ fontSize: '13px', color: '#dc2626', marginTop: '4px' }}>Insufficient balance</div>
                                )}
                              </div>
                            )}
                            {giftCardLookup?.error && (
                              <div style={{ padding: '8px', background: '#fee2e2', fontSize: '13px', color: '#dc2626' }}>{giftCardLookup.error}</div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Energy & Recovery Pack balance */}
                    {!isGiftCardPurchase() && cartHasEnergyEligible() && energyPacks.length > 0 && (
                      <div style={{ marginTop: '12px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '4px' }}>
                          <input type="checkbox" checked={energyPackApply} onChange={e => setEnergyPackApply(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                          <span style={{ fontWeight: 600, fontSize: '14px', color: '#166534' }}>Apply Energy & Recovery balance</span>
                        </label>
                        <div style={{ fontSize: '13px', color: '#166534', paddingLeft: '24px' }}>
                          Available: {formatPrice(getEnergyPackBalance())}
                          {getEnergyPackBalance() < chargeAmount && (
                            <span style={{ color: '#92400e' }}> — remaining {formatPrice(chargeAmount - getEnergyPackBalance())} charged to selected payment method</span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Skip notification */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                <input type="checkbox" checked={skipNotification} onChange={e => setSkipNotification(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                Don't send receipt to patient
              </label>

              {/* Pay button */}
              <div style={styles.payBtnWrap}>
                <button
                  style={{
                    ...styles.payBtn,
                    ...((() => {
                      if (selectedCard === 'split') {
                        const cashCents = Math.round((parseFloat(splitCashAmount) || 0) * 100);
                        const cardCents = chargeAmount - cashCents;
                        return cashCents <= 0 || cardCents <= 0 || cashCents >= chargeAmount;
                      }
                      if (selectedCard === 'gift_card') return !giftCardLookup || giftCardLookup.error || giftCardLookup.remaining_amount < chargeAmount;
                      if (selectedCard === 'account_credit') return creditBalanceCents < chargeAmount;
                      return selectedCard !== 'cash' && !stripe;
                    })() ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
                  }}
                  onClick={handlePay}
                  disabled={(() => {
                    if (selectedCard === 'split') {
                      const cashCents = Math.round((parseFloat(splitCashAmount) || 0) * 100);
                      const cardCents = chargeAmount - cashCents;
                      return cashCents <= 0 || cardCents <= 0 || cashCents >= chargeAmount;
                    }
                    if (selectedCard === 'gift_card') return !giftCardLookup || giftCardLookup.error || giftCardLookup.remaining_amount < chargeAmount;
                    if (selectedCard === 'account_credit') return creditBalanceCents < chargeAmount;
                    return selectedCard !== 'cash' && !stripe;
                  })()}
                >
                  {selectedCard === 'cash'
                    ? `Record Cash — ${formatPrice(chargeAmount)}`
                    : selectedCard === 'split'
                    ? `Split Payment — ${formatPrice(chargeAmount)}`
                    : selectedCard === 'gift_card'
                    ? `Redeem Gift Card — ${formatPrice(chargeAmount)}`
                    : selectedCard === 'account_credit'
                    ? `Apply Credit — ${formatPrice(chargeAmount)}`
                    : isRecurring()
                    ? `Subscribe — ${formatPrice(chargeAmount)}/mo`
                    : `Pay — ${formatPrice(chargeAmount)}`
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════ STEP: PROCESSING ═══════════════════════════════ */}
        {step === 'processing' && (
          <div style={styles.centerStep}>
            <div style={styles.processingCard}>
              <div style={styles.spinner} />
              <p style={{ fontSize: '16px', color: '#666', marginTop: '16px' }}>Processing payment...</p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════ STEP: RESULT ═══════════════════════════════ */}
        {step === 'result' && (
          <div style={styles.centerStep}>
            <div style={styles.resultCard}>
              {resultStatus === 'success' ? (
                <>
                  <div style={styles.successIcon}>✓</div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Payment Complete</h2>
                  <p style={{ fontSize: '15px', color: '#555', whiteSpace: 'pre-line', marginBottom: '24px' }}>{resultMessage}</p>
                  {createdGiftCardCode && (
                    <div style={{ padding: '16px', background: '#f0fdf4', border: '2px solid #86efac', textAlign: 'center', marginBottom: '24px' }}>
                      <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '6px', fontWeight: 600 }}>GIFT CARD CODE</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '2px', color: '#166534' }}>
                        {createdGiftCardCode}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(createdGiftCardCode)}
                        style={{ marginTop: '8px', padding: '6px 16px', background: '#166534', color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer' }}
                      >Copy Code</button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={styles.errorIcon}>✗</div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#dc2626' }}>Payment Failed</h2>
                  <p style={{ fontSize: '15px', color: '#555', marginBottom: '24px' }}>{resultMessage}</p>
                </>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {resultStatus === 'error' && (
                  <button style={styles.secondaryBtn} onClick={() => setStep('payment')}>Try Again</button>
                )}
                <button style={styles.primaryBtn} onClick={handleNewCheckout}>New Checkout</button>
                <button style={styles.secondaryBtn} onClick={handleNewPatient}>Different Patient</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


// ══════════════════════════════════════════════════════════════════════
// Service card component
// ══════════════════════════════════════════════════════════════════════
function ServiceCard({ item, inCart, onClick, showPeptideId }) {
  return (
    <button
      className="checkout-service-card"
      style={{
        ...styles.serviceCard,
        ...(inCart ? styles.serviceCardSelected : {}),
      }}
      onClick={onClick}
    >
      {inCart && <span style={styles.inCartCheck}>✓</span>}
      <div style={styles.serviceCardName}>
        {showPeptideId && item.peptide_identifier
          ? item.peptide_identifier
          : item.name}
      </div>
      <div style={styles.serviceCardPrice}>
        {formatPrice(item.price)}
        {item.recurring && <span style={styles.recurringLabel}>/mo</span>}
      </div>
      {item.description && (
        <div style={styles.serviceCardDesc}>{item.description}</div>
      )}
    </button>
  );
}


// ══════════════════════════════════════════════════════════════════════
// Page export with Stripe Elements wrapper
// ══════════════════════════════════════════════════════════════════════
export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutInner />
    </Elements>
  );
}


// ══════════════════════════════════════════════════════════════════════
// Stripe card element options
// ══════════════════════════════════════════════════════════════════════
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


// ══════════════════════════════════════════════════════════════════════
// Styles
// ══════════════════════════════════════════════════════════════════════
const styles = {
  pageContainer: {
    minHeight: 'calc(100vh - 64px)',
    background: '#fafafa',
  },

  // ── Patient step ──
  patientStep: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '60px 24px',
  },
  patientCard: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    padding: '40px',
    width: '100%',
    maxWidth: '520px',
  },
  patientCardHeader: {
    marginBottom: '24px',
  },
  stepLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#888',
    marginBottom: '8px',
    display: 'block',
  },
  stepTitle: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#1a1a1a',
    margin: '0 0 4px',
  },
  stepSubtitle: {
    fontSize: '14px',
    color: '#888',
    margin: 0,
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '1px solid #e0e0e0',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  searchDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderTop: 'none',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 10,
  },
  searchResult: {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    textAlign: 'left',
    border: 'none',
    borderBottom: '1px solid #f5f5f5',
    background: '#fff',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },

  // ── Browse step ──
  browseLayout: {
    display: 'flex',
    gap: '0',
    minHeight: 'calc(100vh - 64px)',
  },
  browseMain: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    minWidth: 0,
  },
  cartSidebar: {
    width: '360px',
    minWidth: '360px',
    background: '#fff',
    borderLeft: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)',
    position: 'sticky',
    top: '64px',
    overflowY: 'auto',
  },

  // ── Patient bar ──
  patientBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: '#fff',
    border: '1px solid #e0e0e0',
    marginBottom: '16px',
  },
  patientBarInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  patientBarAvatar: {
    width: '36px',
    height: '36px',
    background: '#1a1a1a',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '16px',
  },
  patientBarName: {
    fontWeight: 700,
    fontSize: '15px',
    color: '#1a1a1a',
  },
  patientBarMeta: {
    fontSize: '12px',
    color: '#888',
    marginTop: '1px',
  },
  protocolBadge: {
    fontSize: '12px',
    padding: '4px 10px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    fontWeight: 600,
  },
  changePatientBtn: {
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid #e0e0e0',
    background: '#fff',
    cursor: 'pointer',
    color: '#666',
  },

  // ── Protocols bar ──
  protocolsBar: {
    padding: '12px 16px',
    background: '#fff',
    border: '1px solid #e0e0e0',
    marginBottom: '16px',
  },
  protocolsLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#888',
    marginBottom: '8px',
  },
  protocolsList: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  protocolChip: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 500,
    background: '#f0f9ff',
    border: '1px solid #bfdbfe',
    color: '#1e40af',
  },

  // ── Service search ──
  serviceSearchWrap: {
    position: 'relative',
    marginBottom: '20px',
  },
  serviceSearchInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#888',
    cursor: 'pointer',
    padding: '4px',
  },

  // ── Segment cards ──
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#888',
    marginBottom: '12px',
  },
  segmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '12px',
  },
  segmentCard: {
    padding: '24px 20px',
    background: '#fff',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  segmentIcon: {
    fontSize: '28px',
    marginBottom: '4px',
  },
  segmentLabel: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: '-0.01em',
  },
  segmentDesc: {
    fontSize: '13px',
    color: '#888',
    lineHeight: '1.4',
  },
  segmentCount: {
    fontSize: '12px',
    color: '#aaa',
    marginTop: '4px',
  },

  // ── Back button ──
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    color: '#888',
    cursor: 'pointer',
    padding: '0',
    marginBottom: '16px',
    fontWeight: 500,
  },

  // ── Segment header ──
  segmentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  segmentHeaderIcon: {
    fontSize: '28px',
  },
  segmentHeaderTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#1a1a1a',
    textTransform: 'uppercase',
    margin: 0,
  },

  // ── Sub-category tabs ──
  subCategoryTabs: {
    display: 'flex',
    gap: '6px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  subCategoryTab: {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: '1px solid #e0e0e0',
    background: '#fff',
    cursor: 'pointer',
    color: '#666',
    transition: 'all 0.15s',
  },
  subCategoryTabActive: {
    background: '#1a1a1a',
    color: '#fff',
    borderColor: '#1a1a1a',
  },

  // ── Sub-group label ──
  subGroupLabel: {
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#888',
    marginBottom: '10px',
    paddingBottom: '6px',
    borderBottom: '1px solid #f0f0f0',
  },

  // ── Service grid ──
  serviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
    marginTop: '12px',
  },
  serviceCard: {
    padding: '16px',
    background: '#fff',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  serviceCardSelected: {
    borderColor: '#1a1a1a',
    borderWidth: '2px',
    background: '#f9fafb',
  },
  inCartCheck: {
    position: 'absolute',
    top: '8px',
    right: '10px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  serviceCardName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a1a',
    paddingRight: '20px',
  },
  serviceCardPrice: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#1a1a1a',
  },
  serviceCardDesc: {
    fontSize: '12px',
    color: '#888',
    lineHeight: '1.3',
    marginTop: '2px',
  },
  recurringLabel: {
    fontSize: '12px',
    fontWeight: 400,
    color: '#888',
  },

  // ── Peptide groups ──
  peptideGroup: {
    marginBottom: '8px',
  },
  peptideGroupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '12px 16px',
    background: '#fff',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    textAlign: 'left',
  },

  // ── Cart sidebar ──
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
  },
  cartTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },
  cartBadge: {
    background: '#1a1a1a',
    color: '#fff',
    padding: '2px 10px',
    fontSize: '12px',
    fontWeight: 700,
  },
  cartEmpty: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '14px',
  },
  cartBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
  },
  cartItem: {
    paddingBottom: '12px',
    marginBottom: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  cartItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
  },
  cartItemName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a1a',
    flex: 1,
    paddingRight: '8px',
  },
  cartRemoveBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#ccc',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  cartItemDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  qtyBtn: {
    width: '26px',
    height: '26px',
    border: '1px solid #e0e0e0',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1a1a1a',
  },
  qtyValue: {
    fontSize: '14px',
    fontWeight: 700,
    minWidth: '20px',
    textAlign: 'center',
  },
  cartItemPrice: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  originalPrice: {
    textDecoration: 'line-through',
    color: '#ccc',
    marginRight: '6px',
    fontSize: '13px',
    fontWeight: 400,
  },
  itemDiscountRow: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '6px',
    flexWrap: 'wrap',
    gap: '4px',
  },
  miniToggle: {
    padding: '2px 8px',
    fontSize: '11px',
    border: '1px solid #e0e0e0',
    background: '#fff',
    cursor: 'pointer',
    fontWeight: 500,
    color: '#555',
  },
  miniToggleActive: {
    background: '#1a1a1a',
    color: '#fff',
    borderColor: '#1a1a1a',
  },
  miniInput: {
    width: '60px',
    padding: '3px 6px',
    fontSize: '12px',
    border: '1px solid #e0e0e0',
    textAlign: 'center',
  },

  // ── Cart discount section ──
  cartDiscountSection: {
    paddingBottom: '12px',
    marginBottom: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  cartDiscountLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  discountToggle: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid #e0e0e0',
    background: '#fff',
    cursor: 'pointer',
    color: '#666',
  },
  discountToggleActive: {
    background: '#1a1a1a',
    color: '#fff',
    borderColor: '#1a1a1a',
  },

  // ── Promo code ──
  promoSection: {
    paddingBottom: '12px',
    marginBottom: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  promoApplied: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    fontSize: '13px',
  },

  // ── Cart totals ──
  cartTotals: {
    paddingTop: '12px',
    marginBottom: '12px',
  },
  cartTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#888',
    marginBottom: '4px',
  },
  cartTotalFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: 800,
    color: '#1a1a1a',
    paddingTop: '8px',
    borderTop: '1px solid #e0e0e0',
  },

  // ── Cart warning ──
  cartWarningMsg: {
    padding: '8px 12px',
    background: '#fef3c7',
    border: '1px solid #fde68a',
    fontSize: '13px',
    color: '#92400e',
    marginBottom: '12px',
  },

  // ── Cart actions ──
  cartActions: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  primaryBtn: {
    padding: '14px 24px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    width: '100%',
    textAlign: 'center',
  },
  secondaryBtn: {
    padding: '12px 24px',
    background: '#fff',
    color: '#1a1a1a',
    border: '1px solid #e0e0e0',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  invoiceBtn: {
    padding: '10px',
    background: '#f0f9ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
  },
  invoicePanel: {
    padding: '12px',
    background: '#f0f9ff',
    border: '1px solid #bfdbfe',
    marginTop: '4px',
  },
  invoiceOptionBtn: {
    padding: '6px 14px',
    border: '1px solid #bfdbfe',
    background: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: 500,
  },

  // ── Payment step ──
  paymentStep: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px',
  },
  paymentCard: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    padding: '32px',
    width: '100%',
    maxWidth: '600px',
  },
  paymentHeader: {
    marginBottom: '24px',
  },
  paymentPatient: {
    fontSize: '14px',
    color: '#888',
    marginTop: '4px',
  },
  orderSummary: {
    padding: '16px',
    background: '#fafafa',
    border: '1px solid #f0f0f0',
    marginBottom: '20px',
  },
  orderSummaryLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#888',
    marginBottom: '12px',
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    padding: '4px 0',
    color: '#1a1a1a',
  },
  orderTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: 800,
    padding: '12px 0 0',
    borderTop: '1px solid #e0e0e0',
    marginTop: '8px',
    color: '#1a1a1a',
  },
  paymentSection: {
    marginBottom: '20px',
  },
  paymentSectionLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#888',
    marginBottom: '10px',
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
    borderBottom: '1px solid #f5f5f5',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cardBrand: {
    fontSize: '11px',
    fontWeight: 700,
    background: '#f3f4f6',
    padding: '2px 6px',
    color: '#555',
  },
  cardExp: {
    fontSize: '12px',
    color: '#888',
    marginLeft: 'auto',
  },
  cardElementWrap: {
    padding: '16px',
    background: '#fafafa',
    border: '1px solid #f0f0f0',
    marginTop: '8px',
  },
  saveCardLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '10px',
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer',
  },
  fulfillmentBtn: {
    flex: 1,
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid #e0e0e0',
    background: '#fff',
    color: '#666',
    minWidth: '120px',
    textAlign: 'center',
  },
  payBtnWrap: {
    marginTop: '24px',
  },
  payBtn: {
    width: '100%',
    padding: '16px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    fontSize: '16px',
    fontWeight: 800,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  // ── Custom form ──
  customForm: {
    padding: '20px',
    background: '#fff',
    border: '1px solid #e0e0e0',
    marginTop: '16px',
  },
  fieldGroup: {
    marginBottom: '16px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  fieldInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    outline: 'none',
    boxSizing: 'border-box',
  },

  // ── Center steps (processing, result) ──
  centerStep: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '60px 24px',
  },
  processingCard: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    padding: '60px 40px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '400px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f0f0f0',
    borderTop: '3px solid #1a1a1a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
  resultCard: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    padding: '48px 40px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '500px',
  },
  successIcon: {
    width: '56px',
    height: '56px',
    background: '#dcfce7',
    color: '#166534',
    fontSize: '28px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  errorIcon: {
    width: '56px',
    height: '56px',
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: '28px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },

  // ── Dispensing ──
  dispenseGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  dispenseCard: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  },
  dispenseCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '16px 20px',
    background: '#fff',
    border: 'none',
    borderBottom: '1px solid transparent',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s, border-color 0.15s',
  },
  dispenseCardTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '3px',
  },
  dispenseCardMeta: {
    fontSize: '12px',
    color: '#888',
    marginTop: '2px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0',
  },
  dispenseForm: {
    padding: '20px',
    background: '#fafafa',
    borderTop: '1px solid #e0e0e0',
  },
  dispenseFieldGroup: {
    marginBottom: '14px',
  },
  recentChargesBar: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    marginBottom: '16px',
  },
  recentChargesToggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  recentChargesList: {
    borderTop: '1px solid #f0f0f0',
    maxHeight: '280px',
    overflowY: 'auto',
  },
  recentChargeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 14px',
    gap: '12px',
    borderBottom: '1px solid #f5f5f5',
  },
  posServiceOption: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.15s',
    width: '100%',
    textAlign: 'left',
  },
};
