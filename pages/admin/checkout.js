// /pages/admin/checkout.js
// Full-page guided checkout flow for in-clinic staff
// Mirrors the public services page UX with category cards, service selection, cart, and payment

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/pos-pricing';
import {
  TESTOSTERONE_DOSES,
  WEIGHT_LOSS_MEDICATIONS,
  WEIGHT_LOSS_DOSAGES,
  HRT_SUPPLY_TYPES,
  HRT_MEDICATIONS,
  HRT_SECONDARY_MEDICATIONS,
  INJECTION_PRICING,
  BUY_10_GET_12_THRESHOLD,
  BUY_10_GET_12_BONUS,
  HRT_SECONDARY_DOSAGES,
  INJECTION_MEDICATIONS,
  NAD_INJECTION_DOSAGES,
  PEPTIDE_OPTIONS,
  PEPTIDE_PRODUCT_CATALOG,
  getPeptideProgramName,
  IV_THERAPY_TYPES,
  RANGE_IV_OPTIONS,
  getDoseOptions,
  WL_BUILDER_DOSES,
  getWlInjectionPrice,
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
    categories: ['injections_builder'],
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
  injections_builder: 'Injections',
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
  // weight_loss: handled entirely by WL Injection Builder — no POS products needed
  iv_therapy: [
    { label: 'Signature Formulas', match: i => i.name.toLowerCase().startsWith('range iv') && i.name !== 'Range IV' },
    { label: 'Base IV', match: i => i.name === 'Range IV' },
    { label: 'Add-Ons', match: i => i.name.toLowerCase().includes('add-on') },
    { label: 'Fees', match: i => i.name.toLowerCase().includes('fee') },
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
  const { employee, isAdmin: currentUserIsAdmin } = useAuth();

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
  const [consentBlock, setConsentBlock] = useState('');
  const [consentSendStatus, setConsentSendStatus] = useState(''); // '' | 'sending' | 'sent' | 'error'
  const [consentOverride, setConsentOverride] = useState(false); // admin override for missing consent

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
  const [wlFrequencyDays, setWlFrequencyDays] = useState(7); // 7 = Weekly, 10 = Every 10 Days

  // ── WL Injection Builder ──
  const [wlMedication, setWlMedication] = useState('');
  const [wlGroups, setWlGroups] = useState([{ dose: '', quantity: 1, fulfillment: 'take_home' }]);

  // ── Peptide Builder ──
  const [peptideCategory, setPeptideCategory] = useState(''); // 'recovery' | 'gh_blend' | 'longevity' | 'skin' | 'peptide'
  const [peptideMedication, setPeptideMedication] = useState(''); // catalog medication string
  const [peptideDurationDays, setPeptideDurationDays] = useState(0);
  const [peptidePhase, setPeptidePhase] = useState(0); // 0 = not applicable
  const [peptideInClinicCount, setPeptideInClinicCount] = useState(0);
  const [peptideInjectionCount, setPeptideInjectionCount] = useState(0); // Custom count for phase-based peptides (0 = use full phase package)

  // ── Injection Builder (NAD+, Standard, Premium) ──
  const [injBuilderType, setInjBuilderType] = useState(''); // 'nad', 'standard', 'premium'
  const [injMedication, setInjMedication] = useState('');
  const [injNadDose, setInjNadDose] = useState('');
  const [injQuantity, setInjQuantity] = useState(1);
  const [injFrequency, setInjFrequency] = useState('3x per week'); // default MWF
  const [shippingAmount, setShippingAmount] = useState('');

  // ── Split payment ──
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitCardSelection, setSplitCardSelection] = useState(null);

  // ── Gift card (redeeming) ──
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardLookup, setGiftCardLookup] = useState(null);
  const [lookingUpGiftCard, setLookingUpGiftCard] = useState(false);

  // ── Tap to Pay (Stripe Terminal via Stripe iPhone app) ──
  const [terminalPiInput, setTerminalPiInput] = useState('');
  const [terminalLookup, setTerminalLookup] = useState(null);
  const [lookingUpTerminal, setLookingUpTerminal] = useState(false);

  // ── Account credit ──
  const [creditBalanceCents, setCreditBalanceCents] = useState(0);
  const [creditRemainderMethod, setCreditRemainderMethod] = useState(null); // 'cash' or 'card'
  const [creditCardSelection, setCreditCardSelection] = useState(null);

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
  const [recentChargesOpen, setRecentChargesOpen] = useState(true);

  // ── HRT membership monthly Range IV perk ──
  // { available, hrt_protocol_id, hrt_program_name, cycle_start, cycle_end } or null
  const [hrtPerk, setHrtPerk] = useState(null);
  const [perkPickerOpen, setPerkPickerOpen] = useState(false);

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
  const [dispDate, setDispDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }));
  const [dispCoverageType, setDispCoverageType] = useState(null);
  const [dispSelectedService, setDispSelectedService] = useState(null); // POS service for paid dispensing
  const [dispItemQty, setDispItemQty] = useState(1);
  const [dispSecondaryDetails, setDispSecondaryDetails] = useState([]); // parsed secondary_medication_details for current protocol
  const [dispCategoryOverride, setDispCategoryOverride] = useState(null); // override category (e.g. 'vitamin' for WL included injections)
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
        // Strip redundant "(One-Time)" label from Tirzepatide/Retatrutide monthly
        // items — none of these meds have a subscription option, so the label is noise.
        const cleaned = (data.services || []).map(s => {
          const n = s.name || '';
          if (/tirzepatide|retatrutide/i.test(n) && /\(one-time\)/i.test(n)) {
            return { ...s, name: n.replace(/\s*\(one-time\)\s*/i, ' ').replace(/\s+/g, ' ').trim() };
          }
          return s;
        });
        setServices(cleaned);
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
    // Check HRT membership monthly Range IV perk availability for this cycle
    fetch(`/api/medication-checkout/coverage?patient_id=${patient.id}&category=iv_therapy`)
      .then(r => r.json())
      .then(data => setHrtPerk(data?.hrt_membership_iv || null))
      .catch(() => setHrtPerk(null));
  }, [patient?.id]);

  // Clear consent block when cart changes
  useEffect(() => { setConsentBlock(''); setConsentSendStatus(''); }, [cartItems]);

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

    // Auto-set WL frequency from product name (10-day programs → 10, monthly/single → 7)
    if (item.category === 'weight_loss') {
      const lower = (item.name || '').toLowerCase();
      if (lower.includes('10-day') || lower.includes('10 day') || lower.includes('every 10')) {
        setWlFrequencyDays(10);
      } else {
        setWlFrequencyDays(7);
      }
    }
  }

  function showWarning(msg) {
    setCartWarning(msg);
    setTimeout(() => setCartWarning(''), 3000);
  }

  // ── HRT Membership monthly Range IV perk ──
  // Add a complimentary Range IV (signature formula) as a $0 dispense line item.
  // On checkout, processDispenseItems() writes the service_log that consumes
  // the perk for the current billing cycle — same tagging as /api/protocols/[id]/redeem-range-iv.
  function cartHasHRTPerkIV() {
    return cartItems.some(i => i.dispenseDetails?.hrtPerk === true);
  }

  function addHRTPerkIVToCart(rangeIvOption) {
    if (!patient?.id || !hrtPerk?.available || !hrtPerk?.hrt_protocol_id) return;
    if (cartHasHRTPerkIV()) return;

    const medicationName = rangeIvOption?.value || 'Range IV';
    const displayName = `${rangeIvOption?.label || 'Range IV'} IV (HRT Perk)`;

    const dispenseItem = {
      id: `hrt-perk-iv-${Date.now()}`,
      type: 'dispense',
      name: displayName,
      price: 0,
      quantity: 1,
      category: 'iv_therapy',
      itemDiscountType: 'none',
      itemDiscountValue: '',
      recurring: false,
      coverageBadge: 'HRT Membership',
      dispenseDetails: {
        hrtPerk: true,
        protocolId: hrtPerk.hrt_protocol_id,
        protocolName: hrtPerk.hrt_program_name || 'HRT Membership',
        category: 'iv_therapy',
        entryType: 'session',
        medication: medicationName,
        dosage: null,
        supplyType: null,
        quantity: null,
        administeredBy: null,
        verifiedBy: null,
        fulfillmentMethod: 'in_clinic',
        trackingNumber: null,
        notes: 'HRT Membership Perk — complimentary monthly Range IV',
        entryDate: null,
        coverageType: 'subscription',
        coverageSource: 'HRT Membership — Monthly Range IV Perk',
        selectedService: null,
        itemQty: 1,
      },
    };

    setCartItems(prev => [...prev, dispenseItem]);
    setCartOpen(true);
    setPerkPickerOpen(false);
  }

  // ── WL Injection Builder helpers ──
  function updateWlGroup(index, field, value) {
    setWlGroups(prev => prev.map((g, i) => {
      if (i !== index) return g;
      const next = { ...g, [field]: value };
      // When in custom mode, keep dose string in sync with typed mg value
      if (field === 'customMg' && next.customMode) {
        const trimmed = String(value).trim();
        next.dose = trimmed ? `${trimmed}mg` : '';
      }
      return next;
    }));
  }

  function setWlGroupCustomMode(index, on) {
    setWlGroups(prev => prev.map((g, i) => {
      if (i !== index) return g;
      return { ...g, customMode: !!on, dose: '', customMg: '', customPriceCents: 0 };
    }));
  }

  function addWlGroup() {
    // Default new group to same dose as last group — only if it's a standard priced dose
    const lastGroup = wlGroups[wlGroups.length - 1];
    const lastDose = lastGroup?.customMode ? '' : (lastGroup?.dose || '');
    const standardDoses = WL_BUILDER_DOSES[wlMedication] || [];
    const newDose = standardDoses.includes(lastDose) ? lastDose : '';
    setWlGroups(prev => [...prev, { dose: newDose, quantity: 1, fulfillment: 'take_home' }]);
  }

  function removeWlGroup(index) {
    if (wlGroups.length <= 1) return;
    setWlGroups(prev => prev.filter((_, i) => i !== index));
  }

  function getWlGroupUnitPrice(group) {
    if (group.customMode) return group.customPriceCents || 0;
    return getWlInjectionPrice(wlMedication, group.dose) || 0;
  }

  function isWlGroupValid(group) {
    if (!group.dose || !group.quantity) return false;
    if (group.customMode && !(group.customPriceCents > 0)) return false;
    return true;
  }

  function getWlBuilderTotal() {
    return wlGroups.reduce((sum, g) => sum + getWlGroupUnitPrice(g) * (g.quantity || 0), 0);
  }

  function getWlBuilderTotalInjections() {
    return wlGroups.reduce((sum, g) => sum + (g.quantity || 0), 0);
  }

  function addWlBuilderToCart() {
    if (!wlMedication || !wlGroups.some(isWlGroupValid)) return;

    const validGroups = wlGroups.filter(isWlGroupValid);
    const totalCents = validGroups.reduce((sum, g) => sum + getWlGroupUnitPrice(g) * (g.quantity || 0), 0);
    const totalInj = validGroups.reduce((sum, g) => sum + (g.quantity || 0), 0);
    const hasInClinic = validGroups.some(g => g.fulfillment === 'in_clinic');
    const hasTakeHome = validGroups.some(g => g.fulfillment !== 'in_clinic');

    // Build service name for internal tracking (protocol creation)
    // e.g. "Tirzepatide — 2x 4mg + 2x 5mg"
    const groupDescs = validGroups.map(g => `${g.quantity}x ${g.dose}`);
    const internalName = `${wlMedication} — ${groupDescs.join(' + ')}`;

    const cartItem = {
      id: 'wl-builder-' + Date.now(),
      name: 'Weight Loss Program',
      category: 'weight_loss',
      price: totalCents,
      quantity: 1,
      itemDiscountType: 'none',
      itemDiscountValue: '',
      // WL builder config — passed through to protocol creation
      wlConfig: {
        medication: wlMedication,
        frequency: wlFrequencyDays,
        groups: validGroups.map(g => ({
          dose: g.dose,
          quantity: g.quantity,
          fulfillment: g.fulfillment,
          ...(g.customMode ? { customDose: true, unitPriceCents: g.customPriceCents } : {}),
        })),
        internalName,
        totalInjections: totalInj,
        hasInClinic,
        hasTakeHome,
      },
    };

    // Determine fulfillment for the payment step
    if (hasInClinic && !hasTakeHome) {
      setFulfillmentMethod('in_clinic_injections');
    } else if (hasTakeHome && !hasInClinic) {
      setFulfillmentMethod('in_clinic');
    }
    // Mixed: leave as-is, groups carry their own fulfillment

    setCartItems(prev => [...prev, cartItem]);
    setCartOpen(true);

    // Reset builder
    setWlMedication('');
    setWlGroups([{ dose: '', quantity: 1, fulfillment: 'take_home' }]);
  }

  // ── Peptide Builder helpers ──
  // Display labels + display order for the catalog's `category` field.
  const PEPTIDE_CATEGORY_META = {
    recovery:  { label: 'Recovery',        order: 1 },
    gh_blend:  { label: 'Growth Hormone',  order: 2 },
    longevity: { label: 'Longevity',       order: 3 },
    skin:      { label: 'Skin & Hair',     order: 4 },
    peptide:   { label: 'Other',           order: 5 },
  };

  function getPeptideCatalogGroups() {
    const groups = {};
    for (const p of PEPTIDE_PRODUCT_CATALOG) {
      // NAD+ lives in the Injection Builder — hide from peptide picker to avoid confusion
      if (/^nad/i.test(p.medication)) continue;
      const cat = p.category || 'peptide';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    const keys = Object.keys(groups).sort((a, b) => (PEPTIDE_CATEGORY_META[a]?.order || 99) - (PEPTIDE_CATEGORY_META[b]?.order || 99));
    return { groups, keys };
  }

  function getPeptideProduct(med) {
    return PEPTIDE_PRODUCT_CATALOG.find(p => p.medication === med) || null;
  }

  function getPeptideDurationPriceCents(product, days, phase) {
    if (!product || !days) return 0;
    // Phase-keyed pricing (BDNF, MOTS-C, 2X/3X/4X blends)
    if (product.phases?.length && phase) {
      const ph = product.phases.find(p => p.phase === phase);
      if (ph?.price) return ph.price * 100;
    }
    const d = product.durations?.find(d => d.days === days);
    if (d?.price) return d.price * 100;
    // Custom injection count (non-tier). Use per-injection rate from the
    // largest tier whose days <= count; fall back to smallest tier if count
    // is below every tier.
    if (!product.durations?.length) return 0;
    const sorted = [...product.durations].filter(x => x.price && x.days).sort((a, b) => a.days - b.days);
    if (!sorted.length) return 0;
    let basis = sorted[0];
    for (const t of sorted) {
      if (t.days <= days) basis = t;
      else break;
    }
    const perInjCents = (basis.price * 100) / basis.days;
    return Math.round(perInjCents * days);
  }

  function getPeptideTotalInjections(product, days, phase) {
    if (!product) return 0;
    // Phase-specific injection count, keyed by duration (MOTS-C)
    if (product.phases?.length && phase) {
      const ph = product.phases.find(p => p.phase === phase);
      if (ph?.injections && typeof ph.injections === 'object') {
        const n = ph.injections[days];
        if (n) return n;
      }
    }
    if (product.totalInjections) return product.totalInjections;
    // Fallback: daily protocol → injections === days
    return days || 0;
  }

  // Effective injection count honoring custom-count for phase-based peptides.
  function getPeptideEffectiveInjections(product, days, phase) {
    const pkg = getPeptideTotalInjections(product, days, phase);
    if (product?.phases?.length && product?.allowCustomCount && peptideInjectionCount > 0) {
      return Math.min(peptideInjectionCount, pkg);
    }
    return pkg;
  }

  function getPeptideBuilderPriceCents() {
    const product = getPeptideProduct(peptideMedication);
    if (!product) return 0;
    const pkgPrice = getPeptideDurationPriceCents(product, peptideDurationDays, peptidePhase);
    // Phase-based custom count: price scales linearly from the phase package.
    if (product.phases?.length && product.allowCustomCount && peptideInjectionCount > 0) {
      const pkgCount = getPeptideTotalInjections(product, peptideDurationDays, peptidePhase);
      if (pkgCount > 0 && peptideInjectionCount < pkgCount) {
        return Math.round((pkgPrice / pkgCount) * peptideInjectionCount);
      }
    }
    return pkgPrice;
  }

  function peptideBuilderReady() {
    const product = getPeptideProduct(peptideMedication);
    if (!product || !peptideDurationDays) return false;
    if (product.phases?.length && !peptidePhase) return false;
    return getPeptideBuilderPriceCents() > 0;
  }

  function addPeptideBuilderToCart() {
    const product = getPeptideProduct(peptideMedication);
    if (!product || !peptideDurationDays) return;
    if (product.phases?.length && !peptidePhase) return;

    const totalCents = getPeptideBuilderPriceCents();
    const totalInj = getPeptideEffectiveInjections(product, peptideDurationDays, peptidePhase);
    const inClinicCount = Math.max(0, Math.min(peptideInClinicCount || 0, totalInj));
    const takeHomeCount = totalInj - inClinicCount;
    const hasInClinic = inClinicCount > 0;
    const hasTakeHome = takeHomeCount > 0;

    const pkgInj = getPeptideTotalInjections(product, peptideDurationDays, peptidePhase);
    const isPhasedCustom = product.phases?.length && product.allowCustomCount && peptideInjectionCount > 0 && peptideInjectionCount < pkgInj;
    const tierMatch = product.durations.find(d => d.days === peptideDurationDays);
    const durationLabel = isPhasedCustom
      ? `${totalInj} injection${totalInj !== 1 ? 's' : ''}`
      : (tierMatch?.label || `${totalInj} injection${totalInj !== 1 ? 's' : ''}`);
    const phaseSuffix = product.phases?.length && peptidePhase ? ` — Phase ${peptidePhase}` : '';

    // Internal service name — must match findPeptideProduct() regex patterns in protocol-config.js.
    // Used downstream for protocol resolution, vial pulls, and service log entries.
    const serviceName = `${product.medication} — ${durationLabel}${phaseSuffix}`;

    // Patient-facing display name — hides the specific peptide.
    const programName = getPeptideProgramName(product.category);
    const displayName = `${programName} — ${durationLabel}${phaseSuffix}`;

    const subCategory = PEPTIDE_CATEGORY_META[product.category]?.label || 'Peptide';

    const cartItem = {
      id: 'peptide-builder-' + Date.now(),
      name: displayName,
      category: 'peptide',
      sub_category: subCategory,
      price: totalCents,
      quantity: 1,
      peptide_identifier: product.medication,
      delivery_method: hasTakeHome ? 'take_home' : 'in_clinic',
      duration_days: peptideDurationDays,
      itemDiscountType: 'none',
      itemDiscountValue: '',
      peptideConfig: {
        medication: product.medication,
        category: product.category,
        durationDays: peptideDurationDays,
        durationLabel,
        phase: peptidePhase || null,
        totalInjections: totalInj,
        inClinicCount,
        takeHomeCount,
        hasInClinic,
        hasTakeHome,
        internalName: serviceName,
        vialId: product.vialId || null,
        guideSlug: product.guideSlug || null,
      },
    };

    // Fulfillment (mirrors WL builder pattern)
    if (hasInClinic && !hasTakeHome) {
      setFulfillmentMethod('in_clinic_injections');
    } else if (hasTakeHome && !hasInClinic) {
      setFulfillmentMethod('in_clinic');
    }
    // Mixed: leave as-is — peptideConfig carries the split

    setCartItems(prev => [...prev, cartItem]);
    setCartOpen(true);

    // Reset builder
    setPeptideCategory('');
    setPeptideMedication('');
    setPeptideDurationDays(0);
    setPeptidePhase(0);
    setPeptideInClinicCount(0);
    setPeptideInjectionCount(0);
  }

  // ── Injection Builder helpers ──
  function getInjPricePerUnit() {
    if (injBuilderType === 'nad') return INJECTION_PRICING.nad.doses[injNadDose] || 0;
    if (injBuilderType === 'standard') return INJECTION_PRICING.standard.price;
    if (injBuilderType === 'premium') return INJECTION_PRICING.premium.price;
    return 0;
  }

  function getInjBuilderTotal() {
    const pricePerUnit = getInjPricePerUnit();
    // Buy 10, Get 12: charge for 10 when quantity >= threshold
    const chargeQty = injQuantity >= BUY_10_GET_12_THRESHOLD ? BUY_10_GET_12_THRESHOLD : injQuantity;
    return pricePerUnit * chargeQty;
  }

  function getInjDeliveredQty() {
    return injQuantity >= BUY_10_GET_12_THRESHOLD ? BUY_10_GET_12_BONUS : injQuantity;
  }

  function addInjBuilderToCart() {
    if (!injBuilderType || !injMedication) return;
    if (injBuilderType === 'nad' && !injNadDose) return;

    const totalCents = getInjBuilderTotal();
    const deliveredQty = getInjDeliveredQty();
    const isBonusPack = injQuantity >= BUY_10_GET_12_THRESHOLD;
    const displayName = injBuilderType === 'nad'
      ? `NAD+ Injection — ${injNadDose}`
      : injMedication;
    const packLabel = isBonusPack ? ` (Buy 10, Get 12)` : '';

    const cartItem = {
      id: 'inj-builder-' + Date.now(),
      name: `${displayName}${packLabel}`,
      category: injBuilderType === 'nad' ? 'nad_injection' : 'injection_pack',
      price: totalCents,
      quantity: 1,
      itemDiscountType: 'none',
      itemDiscountValue: '',
      injConfig: {
        type: injBuilderType,
        medication: injMedication,
        nadDose: injBuilderType === 'nad' ? injNadDose : null,
        quantity: deliveredQty,
        chargeQuantity: isBonusPack ? BUY_10_GET_12_THRESHOLD : injQuantity,
        isBonusPack,
        frequency: injFrequency,
        internalName: `${displayName} x${deliveredQty}${packLabel}`,
      },
    };

    setCartItems(prev => [...prev, cartItem]);
    setCartOpen(true);

    // Reset builder
    setInjBuilderType('');
    setInjMedication('');
    setInjNadDose('');
    setInjQuantity(1);
    setInjFrequency('3x per week');
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

      // For builder items, use internal name for protocol creation, display name for receipt
      const isWlBuilder = !!item.wlConfig;
      const isInjBuilder = !!item.injConfig;
      const isPeptideBuilder = !!item.peptideConfig;
      const serviceName = isWlBuilder
        ? item.wlConfig.internalName
        : isInjBuilder
        ? item.injConfig.internalName
        : isPeptideBuilder
        ? item.peptideConfig.internalName
        : item.peptide_identifier ? `${item.name} — ${item.peptide_identifier}` : item.name;

      let recordAmount = itemFinal;
      if (amount_override !== undefined) {
        const totalCharge = getChargeAmount();
        recordAmount = cartItems.length === 1 ? amount_override : Math.round(amount_override * (itemFinal / totalCharge));
      }

      let desc = itemDiscountAmt > 0 ? `${itemName} (${discSuffix})` : itemName;
      if (description_suffix) desc = `${desc} ${description_suffix}`;

      // For WL builder: determine fulfillment from groups
      let wlFulfillment = fulfillmentMethod;
      if (isWlBuilder) {
        if (item.wlConfig.hasInClinic && !item.wlConfig.hasTakeHome) wlFulfillment = 'in_clinic_injections';
        else if (item.wlConfig.hasTakeHome && !item.wlConfig.hasInClinic) wlFulfillment = 'in_clinic';
        // Mixed: pass 'mixed' — backend handles per-group
      }
      // For Peptide builder: same pattern — in-clinic count drives fulfillment
      if (isPeptideBuilder) {
        if (item.peptideConfig.hasInClinic && !item.peptideConfig.hasTakeHome) wlFulfillment = 'in_clinic_injections';
        else if (item.peptideConfig.hasTakeHome && !item.peptideConfig.hasInClinic) wlFulfillment = 'in_clinic';
        // Mixed: peptideConfig carries the split — first N in clinic, rest take-home
      }

      const res = await fetch('/api/stripe/record-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          amount: recordAmount,
          description: desc,
          item_description: isWlBuilder ? 'Weight Loss Program' : undefined,
          payment_method: 'stripe',
          service_category: item.category,
          service_name: serviceName,
          quantity: isWlBuilder ? item.wlConfig.totalInjections : isInjBuilder ? item.injConfig.quantity : isPeptideBuilder ? item.peptideConfig.totalInjections : qty,
          delivery_method: item.delivery_method || null,
          duration_days: isPeptideBuilder ? item.peptideConfig.durationDays : (item.duration_days || null),
          shipping: amount_override ? 0 : itemShipping,
          fulfillment_method: ['peptide', 'weight_loss', 'hrt', 'vials'].includes(item.category) ? wlFulfillment : null,
          tracking_number: ['peptide', 'weight_loss', 'hrt', 'vials'].includes(item.category) && fulfillmentMethod === 'overnight' ? trackingNumber : null,
          wl_frequency_days: item.category === 'weight_loss' ? (isWlBuilder ? item.wlConfig.frequency : wlFrequencyDays) : undefined,
          wl_config: isWlBuilder ? item.wlConfig : undefined,
          peptide_config: isPeptideBuilder ? item.peptideConfig : undefined,
          injection_frequency: isInjBuilder ? item.injConfig.frequency : undefined,
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
      // Refresh HRT perk status — if the cycle's IV was just consumed, the banner hides
      fetch(`/api/medication-checkout/coverage?patient_id=${patient.id}&category=iv_therapy`)
        .then(r => r.json())
        .then(d => setHrtPerk(d?.hrt_membership_iv || null))
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

    // Tap to Pay (Stripe Terminal via Stripe iPhone app) — PI was already charged externally
    if (selectedCard === 'terminal') {
      if (!terminalLookup || terminalLookup.error || terminalLookup.already_recorded || !terminalLookup.ok) {
        setResultStatus('error');
        setResultMessage(terminalLookup?.error || 'Look up the PaymentIntent ID first');
        setStep('result');
        return;
      }
      setStep('processing');
      try {
        const purchaseData = await recordPurchasesWithReturn({
          payment_method: 'stripe',
          stripe_payment_intent_id: terminalLookup.pi.id,
        });
        const wallet = terminalLookup.pi.wallet;
        const walletLabel = wallet === 'apple_pay' ? 'Apple Pay' : wallet === 'google_pay' ? 'Google Pay' : (terminalLookup.pi.card_brand || 'Card').toString().toUpperCase();
        const last4 = terminalLookup.pi.card_last4 ? ` •••• ${terminalLookup.pi.card_last4}` : '';
        let message;
        if (isGiftCardPurchase() && purchaseData?.purchase?.id) {
          const code = await createGiftCardAfterPurchase(purchaseData.purchase.id, amount);
          message = code
            ? `Tap to Pay: ${formatPrice(amount)} (${walletLabel}${last4})\nGift Card Created: ${code}`
            : `Tap to Pay: ${description} — ${formatPrice(amount)} (${walletLabel}${last4})`;
        } else if (isEnergyPackPurchase() && purchaseData?.purchase?.id) {
          const pack = await createEnergyPackAfterPurchase(purchaseData.purchase.id);
          message = pack
            ? `Tap to Pay: ${formatPrice(amount)} (${walletLabel}${last4})\nEnergy & Recovery Pack activated — $750 balance`
            : `Tap to Pay: ${description} — ${formatPrice(amount)} (${walletLabel}${last4})`;
        } else {
          message = `Tap to Pay recorded: ${description} — ${formatPrice(amount)} (${walletLabel}${last4})`;
        }
        message = await processDispenseAndAppend(message);
        setResultStatus('success');
        setResultMessage(message);
        setStep('result');
      } catch (error) {
        setResultStatus('error');
        setResultMessage(error.message || 'Failed to record tap-to-pay purchase');
        setStep('result');
      }
      return;
    }

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

    // Account credit — full coverage
    if (selectedCard === 'account_credit' && creditBalanceCents >= amount) {
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
        setResultMessage(`Paid ${formatPrice(amount)} with Account Credit\nRemaining credit: ${formatPrice(remaining)}`);
        setStep('result');
      } catch (error) {
        setResultStatus('error');
        setResultMessage(error.message || 'Failed to apply account credit');
        setStep('result');
      }
      return;
    }

    // Account credit — partial (credit + cash or card for remainder)
    if (selectedCard === 'account_credit' && creditBalanceCents < amount) {
      if (!creditRemainderMethod) return;
      const creditPortion = creditBalanceCents;
      const remainderCents = amount - creditPortion;
      try {
        // If remainder is card, charge the card first
        if (creditRemainderMethod === 'card') {
          let savedPaymentMethodId = null;
          if (creditCardSelection === 'new') {
            const cardElement = elements.getElement(CardElement);
            if (saveNewCard) {
              savedPaymentMethodId = await saveCardFirst(cardElement);
              if (!savedPaymentMethodId) return;
            } else {
              const piRes = await fetch('/api/stripe/payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patient_id: patient.id, amount: remainderCents, description: `${description} (card portion)` }),
              });
              const piData = await piRes.json();
              if (!piRes.ok) throw new Error(piData.error);
              const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(piData.client_secret, {
                payment_method: { card: cardElement },
              });
              if (stripeError) { setResultStatus('error'); setResultMessage(stripeError.message); setStep('result'); return; }
              if (paymentIntent.status === 'succeeded') {
                setStep('processing');
                // Apply credit portion
                const creditPurchase = await recordPurchasesWithReturn({ payment_method: 'account_credit', amount_override: creditPortion, description_suffix: '(credit portion)' });
                const applyRes = await fetch('/api/credits/apply', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ patient_id: patient.id, amount_cents: creditPortion, purchase_id: creditPurchase?.purchase?.id || null, description: 'Applied at checkout (partial)', created_by: 'pos' }),
                });
                const applyData = await applyRes.json();
                if (!applyRes.ok) throw new Error(applyData.error || 'Failed to apply credit');
                // Record card portion
                await recordPurchasesWithReturn({ payment_method: 'stripe', stripe_payment_intent_id: paymentIntent.id, amount_override: remainderCents, description_suffix: '(card portion)' });
                const remaining = applyData.new_balance_cents ?? 0;
                setResultStatus('success');
                setResultMessage(`Split: ${formatPrice(creditPortion)} credit + ${formatPrice(remainderCents)} card = ${formatPrice(amount)}\nRemaining credit: ${formatPrice(remaining)}`);
                setStep('result');
              }
              return;
            }
          }
          // Saved card or newly-saved card
          setStep('processing');
          const paymentMethodId = savedPaymentMethodId || creditCardSelection;
          const piRes = await fetch('/api/stripe/payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: patient.id, amount: remainderCents, description: `${description} (card portion)`, payment_method_id: paymentMethodId }),
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
          // Apply credit portion
          const creditPurchase = await recordPurchasesWithReturn({ payment_method: 'account_credit', amount_override: creditPortion, description_suffix: '(credit portion)' });
          const applyRes = await fetch('/api/credits/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: patient.id, amount_cents: creditPortion, purchase_id: creditPurchase?.purchase?.id || null, description: 'Applied at checkout (partial)', created_by: 'pos' }),
          });
          const applyData = await applyRes.json();
          if (!applyRes.ok) throw new Error(applyData.error || 'Failed to apply credit');
          // Record card portion
          await recordPurchasesWithReturn({ payment_method: 'stripe', stripe_payment_intent_id: stripePaymentIntentId, amount_override: remainderCents, description_suffix: '(card portion)' });
          const remaining = applyData.new_balance_cents ?? 0;
          setResultStatus('success');
          setResultMessage(`Split: ${formatPrice(creditPortion)} credit + ${formatPrice(remainderCents)} card = ${formatPrice(amount)}\nRemaining credit: ${formatPrice(remaining)}`);
          setStep('result');
        } else {
          // Remainder is cash
          setStep('processing');
          const creditPurchase = await recordPurchasesWithReturn({ payment_method: 'account_credit', amount_override: creditPortion, description_suffix: '(credit portion)' });
          const applyRes = await fetch('/api/credits/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: patient.id, amount_cents: creditPortion, purchase_id: creditPurchase?.purchase?.id || null, description: 'Applied at checkout (partial)', created_by: 'pos' }),
          });
          const applyData = await applyRes.json();
          if (!applyRes.ok) throw new Error(applyData.error || 'Failed to apply credit');
          await recordPurchasesWithReturn({ payment_method: 'cash', amount_override: remainderCents, description_suffix: '(cash portion)' });
          const remaining = applyData.new_balance_cents ?? 0;
          setResultStatus('success');
          setResultMessage(`Split: ${formatPrice(creditPortion)} credit + ${formatPrice(remainderCents)} cash = ${formatPrice(amount)}\nRemaining credit: ${formatPrice(remaining)}`);
          setStep('result');
        }
      } catch (error) {
        setResultStatus('error');
        setResultMessage(error.message || 'Credit split payment failed');
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
        // Use the actual amount Stripe charged (not the cart price) and pass the
        // payment intent ID so the invoice.paid webhook's idempotency check skips this
        await recordPurchasesWithReturn({
          stripe_subscription_id: subData.subscription_id,
          stripe_payment_intent_id: subData.stripe_payment_intent_id || null,
          description: `${description} (monthly subscription)`,
          ...(subData.actual_amount_cents != null ? { amount_override: subData.actual_amount_cents } : {}),
        });
        const displayAmount = subData.actual_amount_cents != null ? subData.actual_amount_cents : amount;
        setResultStatus('success');
        setResultMessage(`Subscription created for ${description} — ${formatPrice(displayAmount)}/mo`);
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

  async function handleTerminalLookup() {
    const raw = terminalPiInput.trim();
    if (!raw) return;
    setLookingUpTerminal(true);
    setTerminalLookup(null);
    try {
      const res = await fetch('/api/stripe/lookup-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_intent_id: raw,
          expected_amount_cents: getChargeAmount(),
        }),
      });
      const data = await res.json();
      if (!res.ok) setTerminalLookup({ error: data.error || 'Lookup failed' });
      else setTerminalLookup(data);
    } catch (err) {
      setTerminalLookup({ error: 'Failed to look up payment' });
    }
    setLookingUpTerminal(false);
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
    setWlFrequencyDays(7);
    setWlMedication('');
    setWlGroups([{ dose: '', quantity: 1, fulfillment: 'take_home' }]);
    setTrackingNumber('');
    setShippingAmount('');
    setSplitCashAmount('');
    setSplitCardSelection(null);
    setGiftCardCode('');
    setGiftCardLookup(null);
    setTerminalPiInput('');
    setTerminalLookup(null);
    setCreditBalanceCents(0);
    setSkipNotification(false);
    setConsentOverride(false);
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
    setHrtPerk(null);
    setPerkPickerOpen(false);
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
    setDispDate(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }));
    setDispCoverageType(null);
    setDispSelectedService(null);
    setDispItemQty(1);
    setDispSecondaryDetails([]);
    setDispCategoryOverride(null);
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

  async function openDispensing(protocol, secondaryMed, categoryOverride) {
    resetDispensing();
    setDispensingProtocolId(protocol.id);

    // Store category override (e.g. 'vitamin' for included vitamin injections on WL protocols)
    if (categoryOverride) setDispCategoryOverride(categoryOverride);

    // Parse secondary medication details from protocol
    let secDetails = [];
    try {
      const raw = protocol.secondary_medication_details;
      secDetails = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    } catch { secDetails = []; }
    setDispSecondaryDetails(secDetails);

    // Use override category if provided, otherwise derive from protocol
    const cat = categoryOverride || protocolToCategory(protocol.program_type);

    // Pre-fill from protocol (or specific secondary med) — skip pre-fill for vitamin override
    if (categoryOverride) {
      // Vitamin override: don't pre-fill medication — let staff pick from injection list
    } else if (secondaryMed) {
      setDispMedication(secondaryMed);
      const detail = secDetails.find(d => d.medication === secondaryMed);
      if (detail?.dosage) setDispDosage(detail.dosage);
    } else {
      let medName = protocol.medication || protocol.program_name || '';
      // For injection/NAD categories, try to match against known medication list
      const injCat = protocolToCategory(protocol.program_type);
      if (['nad_injection', 'injection', 'vitamin'].includes(injCat) && medName) {
        const matched = (INJECTION_MEDICATIONS || []).find(m => medName.toLowerCase().includes(m.toLowerCase()));
        if (matched) medName = matched;
      }
      if (medName) setDispMedication(medName);
      const doseVal = protocol.selected_dose || (protocol.dose_per_injection ? `${protocol.dose_per_injection}mg` : '');
      if (doseVal) setDispDosage(doseVal);
      if (protocol.supply_type) setDispSupplyType(protocol.supply_type);
    }

    // Auto-set entry type based on category
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
    const cat = dispCategoryOverride || protocolToCategory(protocol.program_type);
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
        entryDate: dispDate || null,
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
  async function processDispenseItems({ sendReceipt = false } = {}) {
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
          entry_date: d.entryDate || null,
          send_receipt: sendReceipt,
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

  // Check if cart has weight loss items and patient has a signed weight-loss consent
  async function checkWeightLossConsent() {
    const hasWL = cartItems.some(i => i.category === 'weight_loss');
    if (!hasWL) return true;
    if (!patient?.id) return true;

    const { data } = await supabase
      .from('consents')
      .select('id')
      .eq('patient_id', patient.id)
      .eq('consent_type', 'weight-loss')
      .limit(1);
    if (data && data.length > 0) return true;

    // Fallback: check by email
    if (patient.email) {
      const { data: byEmail } = await supabase
        .from('consents')
        .select('id')
        .ilike('email', patient.email)
        .eq('consent_type', 'weight-loss')
        .limit(1);
      if (byEmail && byEmail.length > 0) return true;
    }
    return false;
  }

  // Send weight-loss consent form to patient via SMS
  async function sendWeightLossConsent() {
    if (!patient?.phone) {
      setConsentBlock('No phone number on file for this patient — cannot send consent form via text.');
      return;
    }
    setConsentSendStatus('sending');
    try {
      const digits = patient.phone.replace(/\D/g, '');
      const phone = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
      const firstName = (patient.first_name || patient.name?.split(' ')[0] || '').trim();
      const res = await fetch('/api/send-forms-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          firstName: firstName || null,
          formIds: ['weight-loss'],
          patientId: patient.id || null,
          patientName: patient.name || null,
          patientEmail: patient.email || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send');
      }
      setConsentSendStatus('sent');
    } catch (e) {
      console.error('Send WL consent error:', e);
      setConsentSendStatus('error');
    }
  }

  // Re-check if consent has been completed and unlock checkout
  async function recheckConsent() {
    const hasConsent = await checkWeightLossConsent();
    if (hasConsent) {
      setConsentBlock('');
      setConsentSendStatus('');
    }
  }

  // Gate checkout — enforce consent requirements before proceeding
  async function proceedToCheckout() {
    setConsentBlock('');
    const hasConsent = await checkWeightLossConsent();
    if (!hasConsent && !consentOverride) {
      setConsentBlock('Weight loss consent form required before checkout. Please have the patient complete the weight loss consent form first.');
      return;
    }
    if (hasOnlyFreeDispenseItems()) {
      processDispenseOnly();
    } else {
      setStep('payment');
    }
  }

  // Dispense-only checkout (no payment needed)
  async function processDispenseOnly() {
    setStep('processing');
    try {
      const results = await processDispenseItems({ sendReceipt: !skipNotification });
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

              {/* HRT Membership monthly Range IV perk banner */}
              {hrtPerk?.available && !cartHasHRTPerkIV() && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  marginBottom: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#14532d', marginBottom: '2px' }}>
                        HRT Membership — Monthly Range IV Available
                      </div>
                      <div style={{ fontSize: '13px', color: '#166534' }}>
                        {patient?.name?.split(' ')[0] || 'This patient'} has 1 complimentary Range IV available this billing cycle.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPerkPickerOpen(o => !o)}
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        padding: '9px 16px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {perkPickerOpen ? 'Cancel' : 'Use Membership IV'}
                    </button>
                  </div>
                  {perkPickerOpen && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', letterSpacing: '0.06em', marginBottom: '8px' }}>
                        CHOOSE A SIGNATURE FORMULA
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {RANGE_IV_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => addHRTPerkIVToCart(opt)}
                            style={{
                              background: '#fff',
                              border: '1px solid #86efac',
                              padding: '8px 14px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#14532d',
                              cursor: 'pointer',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {hrtPerk?.available && cartHasHRTPerkIV() && (
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '12px',
                  fontSize: '13px',
                  color: '#166534',
                  fontWeight: 600,
                }}>
                  ✓ HRT Membership Range IV added to cart — complimentary this cycle.
                </div>
              )}

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
                          ? new Date(c.created * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' })
                          : '';
                        const amount = formatPrice(c.amount || 0);
                        const desc = c.description || 'Payment';
                        const card = c.card_brand
                          ? `${c.card_brand} ···${c.card_last4}`
                          : '';
                        const isRefunded = c.refunded;
                        const partialRefund = !c.refunded && c.amount_refunded > 0;
                        const lineItems = c.line_items || [];
                        return (
                          <div key={c.id} style={{ ...(isRefunded ? { opacity: 0.5 } : {}) }}>
                            <div style={styles.recentChargeRow}>
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
                            {lineItems.length > 0 && (
                              <div style={{ padding: '4px 12px 10px 28px' }}>
                                {lineItems.map((li, i) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555', padding: '2px 0' }}>
                                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {li.name}</span>
                                    <span style={{ whiteSpace: 'nowrap', marginLeft: '12px' }}>
                                      {li.discounted && li.list_amount != null && li.list_amount !== li.amount_paid && (
                                        <span style={{ color: '#94a3b8', textDecoration: 'line-through', marginRight: 6 }}>
                                          {formatPrice(Math.round(li.list_amount * 100))}
                                        </span>
                                      )}
                                      <span style={{ fontWeight: 600 }}>
                                        {li.amount_paid != null ? formatPrice(Math.round(li.amount_paid * 100)) : ''}
                                      </span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
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
                      const hasBuilder = segCats.some(c => c === 'weight_loss' || c === 'injections_builder');
                      const itemCount = segCats.reduce((sum, c) => sum + getItemsByCategory(c).length, 0);
                      if (itemCount === 0 && !hasBuilder && seg.id !== 'other') return null;
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
                          <div style={styles.segmentCount}>{hasBuilder && itemCount === 0 ? 'Builder' : `${itemCount} items`}</div>
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
                        const cat = (isExpanded && dispCategoryOverride) ? dispCategoryOverride : protocolToCategory(proto.program_type);

                        // Parse secondary medications for HRT protocols
                        let secondaryMeds = [];
                        try {
                          const raw = proto.secondary_medications;
                          secondaryMeds = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
                        } catch { secondaryMeds = []; }
                        let secDetails = [];
                        try {
                          const raw = proto.secondary_medication_details;
                          secDetails = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
                        } catch { secDetails = []; }

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
                                {/* Secondary medications on the protocol */}
                                {secondaryMeds.length > 0 && (
                                  <div style={{ fontSize: '12px', color: '#7c3aed', marginTop: '2px' }}>
                                    + {secondaryMeds.map(m => {
                                      const detail = secDetails.find(d => d.medication === m);
                                      return detail?.dosage ? `${m} (${detail.dosage})` : m;
                                    }).join(', ')}
                                  </div>
                                )}
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

                            {/* Quick-dispense buttons for secondary meds + vitamin injection for WL */}
                            {!isExpanded && (secondaryMeds.length > 0 || protocolToCategory(proto.program_type) === 'weight_loss') && (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '8px 14px', borderTop: '1px solid #f0f0f0' }}>
                                {secondaryMeds.map(med => (
                                  <button
                                    key={med}
                                    style={{
                                      fontSize: '12px', fontWeight: 600, color: '#7c3aed',
                                      background: '#f5f3ff', border: '1px solid #ddd6fe',
                                      padding: '4px 12px', cursor: 'pointer',
                                    }}
                                    onClick={() => openDispensing(proto, med)}
                                  >
                                    Dispense {med} →
                                  </button>
                                ))}
                                {protocolToCategory(proto.program_type) === 'weight_loss' && (
                                  <button
                                    style={{
                                      fontSize: '12px', fontWeight: 600, color: '#047857',
                                      background: '#ecfdf5', border: '1px solid #a7f3d0',
                                      padding: '4px 12px', cursor: 'pointer',
                                    }}
                                    onClick={() => openDispensing(proto, null, 'vitamin')}
                                  >
                                    + Vitamin Injection
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Expanded dispensing form */}
                            {isExpanded && (
                              <div style={styles.dispenseForm}>
                                {dispLoadingCoverage ? (
                                  <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Loading coverage...</div>
                                ) : (
                                  <>
                                    {/* Vitamin injection mode label */}
                                    {dispCategoryOverride === 'vitamin' && (
                                      <div style={{
                                        padding: '8px 14px',
                                        background: '#ecfdf5',
                                        border: '1px solid #a7f3d0',
                                        marginBottom: '8px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: '#047857',
                                      }}>
                                        Included Vitamin Injection — Weight Loss Program
                                      </div>
                                    )}

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

                                    {/* Date — defaults to today, can backdate */}
                                    <div style={styles.dispenseFieldGroup}>
                                      <label style={styles.fieldLabel}>Date</label>
                                      <input
                                        type="date"
                                        value={dispDate}
                                        onChange={e => setDispDate(e.target.value)}
                                        max={new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })}
                                        style={{ ...styles.fieldInput, width: '160px' }}
                                      />
                                    </div>

                                    {/* Medication — HRT shows full med list including HCG */}
                                    <div style={styles.dispenseFieldGroup}>
                                      <label style={styles.fieldLabel}>Medication</label>
                                      {cat === 'testosterone' ? (
                                        <select
                                          value={dispMedication}
                                          onChange={e => {
                                            const med = e.target.value;
                                            setDispMedication(med);
                                            // Auto-fill dosage from secondary medication details if available
                                            const secDetail = dispSecondaryDetails.find(d => d.medication === med);
                                            setDispDosage(secDetail?.dosage || '');
                                            setDispSupplyType('');
                                          }}
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
                                      ) : (cat === 'nad_injection' || cat === 'injection' || cat === 'vitamin') ? (
                                        <select
                                          value={dispMedication}
                                          onChange={e => { setDispMedication(e.target.value); setDispDosage(''); }}
                                          style={styles.fieldInput}
                                        >
                                          <option value="">Select medication...</option>
                                          {(INJECTION_MEDICATIONS || []).map(m => (
                                            <option key={m} value={m}>{m}</option>
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
                                        // HRT: testosterone doses are gender-specific — use protocol hrt_type first, then patient gender
                                        if (cat === 'testosterone' && (dispMedication === 'Testosterone Cypionate' || dispMedication === 'Testosterone Enanthate')) {
                                          const rawType = proto?.hrt_type;
                                          const gender = (rawType === 'female' || rawType === 'hrt_female' ? 'female' : null)
                                            || (rawType === 'male' || rawType === 'hrt_male' ? 'male' : null)
                                            || (proto?.medication?.includes('100mg/ml') ? 'female' : null)
                                            || dispCoverage?.patient_gender
                                            || 'male';
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
                                        // NAD+ injection doses
                                        if ((cat === 'nad_injection' || cat === 'injection' || cat === 'vitamin') && dispMedication === 'NAD+') {
                                          return (
                                            <select value={dispDosage} onChange={e => setDispDosage(e.target.value)} style={styles.fieldInput}>
                                              <option value="">Select dose...</option>
                                              {NAD_INJECTION_DOSAGES.map(d => (
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
                                          onChange={e => {
                                            const val = e.target.value;
                                            setDispSupplyType(val);
                                            if (val.startsWith('vial')) setDispQuantity('1');
                                          }}
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
                                      <label style={styles.fieldLabel}>
                                        {dispEntryType === 'injection' ? '# of Injections' : dispEntryType === 'session' ? '# of Sessions' : 'Quantity'}
                                      </label>
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
                                            <label style={{ fontSize: '12px', color: '#666' }}># to charge:</label>
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
                        const isBuilderCat = catId === 'weight_loss' || catId === 'injections_builder';
                        if (items.length === 0 && !isBuilderCat && catId !== 'custom') return null;
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
                    /* ── Peptide Builder ── */
                    (() => {
                      const { groups: pepGroups, keys: pepKeys } = getPeptideCatalogGroups();
                      const pepProduct = getPeptideProduct(peptideMedication);
                      const pkgInjForCurrent = pepProduct ? getPeptideTotalInjections(pepProduct, peptideDurationDays, peptidePhase) : 0;
                      const totalInjForCurrent = pepProduct ? getPeptideEffectiveInjections(pepProduct, peptideDurationDays, peptidePhase) : 0;
                      const builderTotal = getPeptideBuilderPriceCents();
                      return (
                        <div style={{ marginTop: '16px' }}>
                          <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '24px' }}>
                            {/* Category */}
                            <div style={{ marginBottom: '20px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>CATEGORY</label>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {pepKeys.map(catKey => (
                                  <button
                                    key={catKey}
                                    onClick={() => {
                                      setPeptideCategory(catKey);
                                      setPeptideMedication('');
                                      setPeptideDurationDays(0);
                                      setPeptidePhase(0);
                                      setPeptideInClinicCount(0);
                                      setPeptideInjectionCount(0);
                                    }}
                                    style={{
                                      ...styles.fulfillmentBtn,
                                      padding: '10px 16px',
                                      fontSize: '14px',
                                      fontWeight: 600,
                                      ...(peptideCategory === catKey ? { border: '2px solid #1a1a1a', background: '#f9fafb', color: '#1a1a1a' } : {}),
                                    }}
                                  >{PEPTIDE_CATEGORY_META[catKey]?.label || catKey}</button>
                                ))}
                              </div>
                            </div>

                            {/* Peptide */}
                            {peptideCategory && (
                              <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>PEPTIDE</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                                  {(pepGroups[peptideCategory] || []).map(p => {
                                    const selected = peptideMedication === p.medication;
                                    const minPrice = Math.min(
                                      ...(p.phases?.length ? p.phases.map(ph => ph.price || 0) : (p.durations || []).map(d => d.price || 0)).filter(v => v > 0)
                                    );
                                    return (
                                      <button
                                        key={p.medication}
                                        onClick={() => {
                                          setPeptideMedication(p.medication);
                                          setPeptideDurationDays(p.durations?.length === 1 ? p.durations[0].days : 0);
                                          setPeptidePhase(0);
                                          setPeptideInClinicCount(0);
                                          setPeptideInjectionCount(0);
                                        }}
                                        style={{
                                          padding: '12px 14px',
                                          fontSize: '13px',
                                          textAlign: 'left',
                                          border: '1px solid #ddd',
                                          background: '#fff',
                                          cursor: 'pointer',
                                          ...(selected ? { border: '2px solid #10b981', background: '#f0fdf4' } : {}),
                                        }}
                                      >
                                        <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '2px' }}>{p.medication}</div>
                                        <div style={{ fontSize: '11px', color: '#888' }}>
                                          {p.phases?.length ? `${p.phases.length} phase${p.phases.length > 1 ? 's' : ''}` : `${p.durations?.length || 0} duration${(p.durations?.length || 0) > 1 ? 's' : ''}`}
                                          {isFinite(minPrice) && minPrice > 0 ? ` · from ${formatPrice(minPrice * 100)}` : ''}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Duration — phase-based peptides keep the tier buttons; simple peptides get a custom-count grid */}
                            {pepProduct && (pepProduct.durations?.length > 0) && pepProduct.phases?.length > 0 && (
                              <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>DURATION</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {pepProduct.durations.map(d => {
                                    const selected = peptideDurationDays === d.days;
                                    const durPrice = getPeptideDurationPriceCents(pepProduct, d.days, peptidePhase || (pepProduct.phases?.[0]?.phase));
                                    return (
                                      <button
                                        key={d.days}
                                        onClick={() => { setPeptideDurationDays(d.days); setPeptideInClinicCount(0); setPeptideInjectionCount(0); }}
                                        style={{
                                          padding: '12px 18px',
                                          fontSize: '14px',
                                          fontWeight: 600,
                                          border: '1px solid #ddd',
                                          background: '#fff',
                                          cursor: 'pointer',
                                          textAlign: 'left',
                                          minWidth: '140px',
                                          ...(selected ? { border: '2px solid #2E75B6', background: '#EBF3FB', color: '#2E75B6' } : {}),
                                        }}
                                      >
                                        <div>{d.label}</div>
                                        {durPrice > 0 && (
                                          <div style={{ fontSize: '12px', fontWeight: 500, color: selected ? '#2E75B6' : '#666', marginTop: '2px' }}>{formatPrice(durPrice)}</div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Injection count — simple (non-phase) peptides get a 1..maxTier grid with tier days as packages */}
                            {pepProduct && (pepProduct.durations?.length > 0) && !pepProduct.phases?.length && (() => {
                              const tierDaysSet = new Set(pepProduct.durations.map(d => d.days));
                              const maxTier = Math.max(...pepProduct.durations.map(d => d.days));
                              const tierLabel = (n) => pepProduct.durations.find(d => d.days === n)?.label || `${n} Day`;
                              return (
                                <div style={{ marginBottom: '20px' }}>
                                  <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>INJECTIONS</label>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', gap: '6px' }}>
                                    {Array.from({ length: maxTier }, (_, i) => i + 1).map(n => {
                                      const selected = peptideDurationDays === n;
                                      const isTier = tierDaysSet.has(n);
                                      const btnPrice = getPeptideDurationPriceCents(pepProduct, n, 0);
                                      return (
                                        <button
                                          key={n}
                                          onClick={() => { setPeptideDurationDays(n); setPeptideInClinicCount(0); setPeptideInjectionCount(0); }}
                                          title={isTier ? `${tierLabel(n)} package — ${formatPrice(btnPrice)}` : `${n} injection${n !== 1 ? 's' : ''} — ${formatPrice(btnPrice)}`}
                                          style={{
                                            padding: isTier ? '10px 6px' : '12px 6px',
                                            fontSize: isTier ? '12px' : '14px',
                                            fontWeight: isTier ? 700 : 500,
                                            lineHeight: 1.1,
                                            border: '1px solid #ddd',
                                            background: isTier ? '#fafafa' : '#fff',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            ...(selected ? { border: '2px solid #2E75B6', background: '#EBF3FB', color: '#2E75B6' } : {}),
                                          }}
                                        >
                                          {isTier ? tierLabel(n) : n}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
                                    Tier buttons (bold) use package pricing. Individual counts use the next-lower tier's per-injection rate.
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Phase (conditional) */}
                            {pepProduct?.phases?.length > 0 && peptideDurationDays > 0 && (
                              <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>PHASE</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {pepProduct.phases.map(ph => {
                                    const selected = peptidePhase === ph.phase;
                                    const phDose = typeof ph.doses === 'object' ? ph.doses[peptideDurationDays] : ph.dose;
                                    return (
                                      <button
                                        key={ph.phase}
                                        onClick={() => { setPeptidePhase(ph.phase); setPeptideInClinicCount(0); setPeptideInjectionCount(0); }}
                                        style={{
                                          padding: '12px 16px',
                                          fontSize: '13px',
                                          textAlign: 'left',
                                          border: '1px solid #ddd',
                                          background: '#fff',
                                          cursor: 'pointer',
                                          minWidth: '180px',
                                          ...(selected ? { border: '2px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed' } : {}),
                                        }}
                                      >
                                        <div style={{ fontWeight: 600 }}>{ph.label || `Phase ${ph.phase}`}</div>
                                        <div style={{ fontSize: '11px', color: selected ? '#7c3aed' : '#888', marginTop: '3px' }}>
                                          {phDose ? `${phDose}` : ''}{ph.price ? ` · ${formatPrice(ph.price * 100)}` : ''}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Injection count — phase-based peptides flagged allowCustomCount (e.g. MOTS-C) */}
                            {pepProduct?.phases?.length > 0 && pepProduct.allowCustomCount && peptideDurationDays > 0 && peptidePhase > 0 && pkgInjForCurrent > 0 && (() => {
                              const phaseData = pepProduct.phases.find(p => p.phase === peptidePhase);
                              const perInjDose = typeof phaseData?.doses === 'object' ? phaseData.doses[peptideDurationDays] : phaseData?.dose;
                              const pkgPriceCents = getPeptideDurationPriceCents(pepProduct, peptideDurationDays, peptidePhase);
                              const perInjCents = pkgInjForCurrent > 0 ? Math.round(pkgPriceCents / pkgInjForCurrent) : 0;
                              const effectiveCount = peptideInjectionCount > 0 ? peptideInjectionCount : pkgInjForCurrent;
                              return (
                                <div style={{ marginBottom: '20px' }}>
                                  <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>INJECTIONS</label>
                                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                                    {perInjDose ? `${perInjDose} per injection · ` : ''}{formatPrice(perInjCents)} each · full phase = {formatPrice(pkgPriceCents)}
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(pkgInjForCurrent, 10)}, minmax(0, 1fr))`, gap: '6px' }}>
                                    {Array.from({ length: pkgInjForCurrent }, (_, i) => i + 1).map(n => {
                                      const selected = effectiveCount === n;
                                      const isFull = n === pkgInjForCurrent;
                                      return (
                                        <button
                                          key={n}
                                          onClick={() => setPeptideInjectionCount(isFull ? 0 : n)}
                                          title={isFull ? `Full phase — ${pkgInjForCurrent} inj · ${formatPrice(pkgPriceCents)}` : `${n} injection${n !== 1 ? 's' : ''} · ${formatPrice(perInjCents * n)}`}
                                          style={{
                                            padding: isFull ? '10px 6px' : '12px 6px',
                                            fontSize: isFull ? '11px' : '14px',
                                            fontWeight: isFull ? 700 : 500,
                                            lineHeight: 1.1,
                                            border: '1px solid #ddd',
                                            background: isFull ? '#fafafa' : '#fff',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            ...(selected ? { border: '2px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed' } : {}),
                                          }}
                                        >
                                          {isFull ? `Full (${n})` : n}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Fulfillment (only if product supports in-clinic AND we have a total) */}
                            {pepProduct?.deliveryOptions?.includes('in_clinic') && totalInjForCurrent > 0 && (() => {
                              const mode = peptideInClinicCount === 0
                                ? 'take_home'
                                : peptideInClinicCount >= totalInjForCurrent
                                ? 'in_clinic'
                                : 'split';
                              const modeBtn = (active, color, bg) => ({
                                padding: '10px 16px', fontSize: '14px', fontWeight: 600,
                                border: '1px solid #ddd', background: '#fff', cursor: 'pointer', flex: 1,
                                ...(active ? { border: `2px solid ${color}`, background: bg, color } : {}),
                              });
                              return (
                                <div style={{ marginBottom: '20px' }}>
                                  <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>FULFILLMENT</label>
                                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                    <button onClick={() => setPeptideInClinicCount(0)} style={modeBtn(mode === 'take_home', '#2E75B6', '#EBF3FB')}>All Take-Home</button>
                                    <button onClick={() => setPeptideInClinicCount(Math.max(1, Math.min(peptideInClinicCount || 1, totalInjForCurrent - 1)))} style={modeBtn(mode === 'split', '#7c3aed', '#f5f3ff')} disabled={totalInjForCurrent < 2}>First Few In Clinic</button>
                                    <button onClick={() => setPeptideInClinicCount(totalInjForCurrent)} style={modeBtn(mode === 'in_clinic', '#e67e22', '#FFF5EB')}>All In Clinic</button>
                                  </div>
                                  {mode === 'split' && (
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px', background: '#f9fafb', border: '1px solid #e5e5e5' }}>
                                      <label style={{ fontSize: '12px', color: '#666' }}># done in clinic:</label>
                                      <input
                                        type="number"
                                        min="1"
                                        max={totalInjForCurrent - 1}
                                        value={peptideInClinicCount}
                                        onChange={e => {
                                          const n = parseInt(e.target.value) || 1;
                                          setPeptideInClinicCount(Math.max(1, Math.min(n, totalInjForCurrent - 1)));
                                        }}
                                        style={{ width: '72px', padding: '8px', border: '1px solid #ddd', fontSize: '15px', fontWeight: 600, textAlign: 'center' }}
                                      />
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        {[1, 3, 5].filter(n => n < totalInjForCurrent).map(n => (
                                          <button
                                            key={n}
                                            onClick={() => setPeptideInClinicCount(n)}
                                            style={{
                                              padding: '7px 11px', fontSize: '12px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer',
                                              ...(peptideInClinicCount === n ? { border: '2px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed', fontWeight: 600 } : {}),
                                            }}
                                          >{n}</button>
                                        ))}
                                      </div>
                                      <span style={{ fontSize: '13px', color: '#666' }}>
                                        First <strong>{peptideInClinicCount}</strong> in clinic · <strong>{totalInjForCurrent - peptideInClinicCount}</strong> take-home
                                      </span>
                                    </div>
                                  )}
                                  {mode !== 'split' && (
                                    <div style={{ fontSize: '13px', color: '#666' }}>
                                      {mode === 'in_clinic'
                                        ? <>All <strong>{totalInjForCurrent}</strong> injections done in clinic</>
                                        : <>All <strong>{totalInjForCurrent}</strong> injections take-home</>}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Summary + Add to Cart */}
                            {peptideBuilderReady() && (
                              <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '16px', marginTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                  <div style={{ fontSize: '14px', color: '#666' }}>
                                    {totalInjForCurrent} injection{totalInjForCurrent !== 1 ? 's' : ''}
                                    {(() => {
                                      const isPhasedCustom = pepProduct?.phases?.length && pepProduct.allowCustomCount && peptideInjectionCount > 0 && peptideInjectionCount < pkgInjForCurrent;
                                      // Only label "day supply" for simple (non-phased) peptides and full phase packages.
                                      return !isPhasedCustom ? ` · ${peptideDurationDays} day supply` : ` · Phase ${peptidePhase} (${pkgInjForCurrent} inj full)`;
                                    })()}
                                    {peptideInClinicCount > 0 ? ` · ${peptideInClinicCount} in clinic` : ''}
                                  </div>
                                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a' }}>{formatPrice(builderTotal)}</div>
                                </div>
                                <button
                                  onClick={addPeptideBuilderToCart}
                                  style={{
                                    ...styles.primaryBtn,
                                    width: '100%',
                                    padding: '14px',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}
                                >Add to Cart — {pepProduct?.medication} ({formatPrice(builderTotal)})</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : activeSubCategory === 'weight_loss' ? (
                    /* ── WL Injection Builder ── */
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '24px' }}>
                        {/* Medication */}
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>MEDICATION</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {['Tirzepatide', 'Retatrutide'].map(med => (
                              <button
                                key={med}
                                onClick={() => { setWlMedication(med); setWlGroups([{ dose: '', quantity: 1, fulfillment: 'take_home' }]); }}
                                style={{
                                  ...styles.fulfillmentBtn,
                                  flex: 1,
                                  padding: '12px 16px',
                                  fontSize: '15px',
                                  fontWeight: 600,
                                  ...(wlMedication === med ? { border: '2px solid #1a1a1a', background: '#f9fafb', color: '#1a1a1a' } : {}),
                                }}
                              >{med}</button>
                            ))}
                          </div>
                        </div>

                        {wlMedication && (
                          <>
                            {/* Frequency */}
                            <div style={{ marginBottom: '20px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>INJECTION FREQUENCY</label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => setWlFrequencyDays(7)}
                                  style={{
                                    ...styles.fulfillmentBtn,
                                    ...(wlFrequencyDays === 7 ? { border: '2px solid #2E75B6', background: '#EBF3FB', color: '#2E75B6' } : {}),
                                  }}
                                >Weekly (every 7 days)</button>
                                <button
                                  onClick={() => setWlFrequencyDays(10)}
                                  style={{
                                    ...styles.fulfillmentBtn,
                                    ...(wlFrequencyDays === 10 ? { border: '2px solid #e67e22', background: '#FFF5EB', color: '#e67e22' } : {}),
                                  }}
                                >Every 10 Days</button>
                              </div>
                            </div>

                            {/* Injection Groups */}
                            <div style={{ marginBottom: '20px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>INJECTIONS</label>
                              {wlGroups.map((group, idx) => {
                                const groupPrice = getWlGroupUnitPrice(group);
                                const groupTotal = groupPrice * (group.quantity || 0);
                                return (
                                  <div key={idx} style={{
                                    display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px',
                                    padding: '12px', background: '#f9fafb', border: '1px solid #e5e5e5',
                                  }}>
                                    {/* Quantity */}
                                    <div style={{ minWidth: '70px' }}>
                                      <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}># of Inj.</label>
                                      <input
                                        type="number" min="1" value={group.quantity}
                                        onChange={e => updateWlGroup(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                        style={{ width: '60px', padding: '8px', border: '1px solid #ddd', fontSize: '15px', fontWeight: 600, textAlign: 'center' }}
                                      />
                                    </div>
                                    {/* Dose */}
                                    <div style={{ flex: 1 }}>
                                      <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>Dosage</label>
                                      {group.customMode ? (
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                                            <input
                                              type="number" step="0.05" min="0"
                                              value={group.customMg || ''}
                                              onChange={e => updateWlGroup(idx, 'customMg', e.target.value)}
                                              placeholder="2.25"
                                              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                                            />
                                            <span style={{ fontSize: '12px', color: '#666' }}>mg</span>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                                            <span style={{ fontSize: '12px', color: '#666' }}>$</span>
                                            <input
                                              type="number" step="0.01" min="0"
                                              value={group.customPriceCents ? (group.customPriceCents / 100).toFixed(2) : ''}
                                              onChange={e => {
                                                const v = parseFloat(e.target.value);
                                                updateWlGroup(idx, 'customPriceCents', Number.isFinite(v) ? Math.round(v * 100) : 0);
                                              }}
                                              placeholder="0.00"
                                              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                                            />
                                            <span style={{ fontSize: '12px', color: '#666' }}>/ea</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setWlGroupCustomMode(idx, false)}
                                            title="Back to standard doses"
                                            style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #ddd', background: '#fff', color: '#666', cursor: 'pointer' }}
                                          >Standard</button>
                                        </div>
                                      ) : (
                                        <select
                                          value={group.dose}
                                          onChange={e => {
                                            if (e.target.value === '__custom__') {
                                              setWlGroupCustomMode(idx, true);
                                            } else {
                                              updateWlGroup(idx, 'dose', e.target.value);
                                            }
                                          }}
                                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                                        >
                                          <option value="">Select dose...</option>
                                          {(WL_BUILDER_DOSES[wlMedication] || []).map(d => {
                                            const p = getWlInjectionPrice(wlMedication, d);
                                            return <option key={d} value={d}>{d} — {formatPrice(p)}/ea</option>;
                                          })}
                                          <option value="__custom__">Custom dose…</option>
                                        </select>
                                      )}
                                    </div>
                                    {/* Fulfillment */}
                                    <div>
                                      <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>Fulfillment</label>
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                          onClick={() => updateWlGroup(idx, 'fulfillment', 'in_clinic')}
                                          style={{
                                            padding: '7px 10px', fontSize: '12px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer',
                                            ...(group.fulfillment === 'in_clinic' ? { border: '2px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed', fontWeight: 600 } : {}),
                                          }}
                                        >In Clinic</button>
                                        <button
                                          onClick={() => updateWlGroup(idx, 'fulfillment', 'take_home')}
                                          style={{
                                            padding: '7px 10px', fontSize: '12px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer',
                                            ...(group.fulfillment === 'take_home' ? { border: '2px solid #2E75B6', background: '#EBF3FB', color: '#2E75B6', fontWeight: 600 } : {}),
                                          }}
                                        >Take Home</button>
                                      </div>
                                    </div>
                                    {/* Line total */}
                                    <div style={{ minWidth: '80px', textAlign: 'right' }}>
                                      <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>&nbsp;</label>
                                      <span style={{ fontSize: '15px', fontWeight: 700, color: groupPrice ? '#1a1a1a' : '#ccc' }}>
                                        {groupPrice ? formatPrice(groupTotal) : '—'}
                                      </span>
                                    </div>
                                    {/* Remove */}
                                    {wlGroups.length > 1 && (
                                      <button
                                        onClick={() => removeWlGroup(idx)}
                                        style={{ padding: '4px 8px', fontSize: '16px', border: 'none', background: 'none', color: '#999', cursor: 'pointer', marginTop: '14px' }}
                                      >×</button>
                                    )}
                                  </div>
                                );
                              })}
                              <button
                                onClick={addWlGroup}
                                style={{ padding: '8px 16px', fontSize: '13px', border: '1px dashed #ccc', background: '#fff', color: '#666', cursor: 'pointer', width: '100%', marginTop: '4px' }}
                              >+ Add Group (different dose or fulfillment)</button>
                            </div>

                            {/* Summary + Add to Cart */}
                            {getWlBuilderTotal() > 0 && (
                              <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '16px', marginTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                  <div>
                                    <span style={{ fontSize: '14px', color: '#666' }}>
                                      {getWlBuilderTotalInjections()} injection{getWlBuilderTotalInjections() > 1 ? 's' : ''} × {wlFrequencyDays} days = <strong>{getWlBuilderTotalInjections() * wlFrequencyDays} day supply</strong>
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a' }}>
                                    {formatPrice(getWlBuilderTotal())}
                                  </div>
                                </div>
                                <button
                                  onClick={addWlBuilderToCart}
                                  style={{
                                    ...styles.primaryBtn,
                                    width: '100%',
                                    padding: '14px',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}
                                >Add to Cart — Weight Loss Program ({formatPrice(getWlBuilderTotal())})</button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ) : activeSubCategory === 'injections_builder' ? (
                    /* ── Injection Builder (NAD+, Standard, Premium) ── */
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '24px' }}>
                        {/* Type Selection */}
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>INJECTION TYPE</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                              { key: 'nad', label: 'NAD+' },
                              { key: 'standard', label: 'Standard ($35)' },
                              { key: 'premium', label: 'Premium ($50)' },
                            ].map(t => (
                              <button
                                key={t.key}
                                onClick={() => { setInjBuilderType(t.key); setInjMedication(''); setInjNadDose(''); setInjQuantity(1); setInjFrequency('3x per week'); }}
                                style={{
                                  ...styles.fulfillmentBtn,
                                  flex: 1,
                                  padding: '12px 16px',
                                  fontSize: '15px',
                                  fontWeight: 600,
                                  ...(injBuilderType === t.key ? { border: '2px solid #1a1a1a', background: '#f9fafb', color: '#1a1a1a' } : {}),
                                }}
                              >{t.label}</button>
                            ))}
                          </div>
                        </div>

                        {injBuilderType && (
                          <>
                            {/* Medication / Item Selection */}
                            <div style={{ marginBottom: '20px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>
                                {injBuilderType === 'nad' ? 'DOSAGE' : 'INJECTION'}
                              </label>
                              {injBuilderType === 'nad' ? (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {Object.keys(INJECTION_PRICING.nad.doses).map(dose => (
                                    <button
                                      key={dose}
                                      onClick={() => { setInjNadDose(dose); setInjMedication(`NAD+ (${dose})`); }}
                                      style={{
                                        ...styles.fulfillmentBtn,
                                        padding: '10px 16px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        ...(injNadDose === dose ? { border: '2px solid #1a1a1a', background: '#f9fafb', color: '#1a1a1a' } : {}),
                                      }}
                                    >{dose} — {formatPrice(INJECTION_PRICING.nad.doses[dose])}</button>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {(injBuilderType === 'standard' ? INJECTION_PRICING.standard.items : INJECTION_PRICING.premium.items).map(item => (
                                    <button
                                      key={item}
                                      onClick={() => setInjMedication(item)}
                                      style={{
                                        ...styles.fulfillmentBtn,
                                        padding: '10px 16px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        ...(injMedication === item ? { border: '2px solid #1a1a1a', background: '#f9fafb', color: '#1a1a1a' } : {}),
                                      }}
                                    >{item}</button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Quantity — only show when medication is selected */}
                            {(injMedication || (injBuilderType === 'nad' && injNadDose)) && (
                              <>
                                <div style={{ marginBottom: '20px' }}>
                                  <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}># OF INJECTIONS</label>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                      <button
                                        key={n}
                                        onClick={() => setInjQuantity(n)}
                                        style={{
                                          ...styles.fulfillmentBtn,
                                          width: '48px', padding: '10px 0',
                                          fontSize: '15px', fontWeight: 600, textAlign: 'center',
                                          ...(injQuantity === n ? { border: '2px solid #1a1a1a', background: '#f9fafb', color: '#1a1a1a' } : {}),
                                        }}
                                      >{n}</button>
                                    ))}
                                    <button
                                      onClick={() => setInjQuantity(BUY_10_GET_12_THRESHOLD)}
                                      style={{
                                        ...styles.fulfillmentBtn,
                                        padding: '10px 16px',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        ...(injQuantity >= BUY_10_GET_12_THRESHOLD
                                          ? { border: '2px solid #16a34a', background: '#f0fdf4', color: '#16a34a' }
                                          : { border: '2px dashed #16a34a', color: '#16a34a' }),
                                      }}
                                    >Buy 10, Get 12</button>
                                  </div>
                                </div>

                                {/* Frequency — drives protocol end_date */}
                                <div style={{ marginBottom: '20px' }}>
                                  <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: '8px' }}>FREQUENCY</label>
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {[
                                      { value: '3x per week', label: '3x / week (MWF)' },
                                      { value: '2x per week', label: '2x / week' },
                                      { value: 'Weekly', label: 'Weekly' },
                                      { value: 'Daily', label: 'Daily' },
                                    ].map(f => (
                                      <button
                                        key={f.value}
                                        onClick={() => setInjFrequency(f.value)}
                                        style={{
                                          ...styles.fulfillmentBtn,
                                          padding: '10px 16px',
                                          fontSize: '14px',
                                          fontWeight: 600,
                                          ...(injFrequency === f.value ? { border: '2px solid #1a1a1a', background: '#f9fafb', color: '#1a1a1a' } : {}),
                                        }}
                                      >{f.label}</button>
                                    ))}
                                  </div>
                                  {(() => {
                                    const delivered = getInjDeliveredQty();
                                    const dpw = { 'Daily': 7, '3x per week': 3, '2x per week': 2, 'Weekly': 1 }[injFrequency];
                                    if (!dpw || !delivered) return null;
                                    const weeks = Math.ceil(delivered / dpw);
                                    return (
                                      <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
                                        {delivered} injection{delivered > 1 ? 's' : ''} ÷ {dpw}/week = <strong>{weeks} week{weeks > 1 ? 's' : ''}</strong> of treatment
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Buy 10 Get 12 banner */}
                                {injQuantity >= BUY_10_GET_12_THRESHOLD && (
                                  <div style={{
                                    background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px',
                                    marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px',
                                  }}>
                                    <span style={{ fontSize: '20px' }}>🎉</span>
                                    <div>
                                      <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '14px' }}>Buy 10, Get 12!</div>
                                      <div style={{ fontSize: '13px', color: '#666' }}>
                                        Paying for {BUY_10_GET_12_THRESHOLD} — receiving {BUY_10_GET_12_BONUS}. Saves {formatPrice(getInjPricePerUnit() * 2)}.
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Summary + Add to Cart */}
                                <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '16px', marginTop: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div>
                                      <span style={{ fontSize: '14px', color: '#666' }}>
                                        {injMedication}{injBuilderType === 'nad' ? '' : ` Injection`} × {getInjDeliveredQty()}
                                        {injQuantity >= BUY_10_GET_12_THRESHOLD && <span style={{ color: '#16a34a', fontWeight: 600 }}> (2 bonus)</span>}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a' }}>
                                      {formatPrice(getInjBuilderTotal())}
                                    </div>
                                  </div>
                                  <button
                                    onClick={addInjBuilderToCart}
                                    style={{
                                      ...styles.primaryBtn,
                                      width: '100%',
                                      padding: '14px',
                                      fontSize: '15px',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                    }}
                                  >Add to Cart — {injMedication} × {getInjDeliveredQty()} ({formatPrice(getInjBuilderTotal())})</button>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
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
                              {d?.quantity ? ` · ${d.quantity} ${d?.entryType === 'injection' ? 'injection' : 'unit'}${d.quantity > 1 ? 's' : ''}` : ''}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={styles.qtyControls}>
                              <button style={styles.qtyBtn} onClick={() => updateItemQuantity(item.id, qty - 1)}>−</button>
                              <span style={styles.qtyValue}>{qty}</span>
                              <button style={styles.qtyBtn} onClick={() => updateItemQuantity(item.id, qty + 1)}>+</button>
                            </div>
                            {item.category === 'weight_loss' && (
                              <span style={{ fontSize: '11px', color: '#666' }}>injection{qty > 1 ? 's' : ''}</span>
                            )}
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
                  {consentBlock && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#991b1b', marginBottom: '12px', lineHeight: '1.4' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: consentSendStatus === 'sent' ? '0' : '10px' }}>
                        <span>⚠️</span>
                        <span>{consentBlock}</span>
                      </div>
                      {consentSendStatus === 'sent' ? (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: '#166534' }}>
                            ✓ Consent form sent to {patient?.phone}
                          </div>
                          <button
                            onClick={recheckConsent}
                            style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
                          >
                            Patient Completed It — Recheck
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {patient?.phone && (
                            <button
                              onClick={sendWeightLossConsent}
                              disabled={consentSendStatus === 'sending'}
                              style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: consentSendStatus === 'sending' ? 'wait' : 'pointer', opacity: consentSendStatus === 'sending' ? 0.6 : 1, flex: 1 }}
                            >
                              {consentSendStatus === 'sending' ? 'Sending...' : consentSendStatus === 'error' ? 'Retry — Send Consent Form' : `Text Consent Form to ${patient.phone}`}
                            </button>
                          )}
                        </div>
                      )}
                      {currentUserIsAdmin && (
                        <button
                          onClick={() => { setConsentOverride(true); setConsentBlock(''); }}
                          style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: '8px' }}
                        >
                          Admin Override — Proceed Without Consent
                        </button>
                      )}
                    </div>
                  )}

                  {/* Skip receipt toggle (shown for dispense-only) */}
                  {canProceedToPayment() && hasOnlyFreeDispenseItems() && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0 4px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                      <input type="checkbox" checked={skipNotification} onChange={e => setSkipNotification(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                      Don't send receipt to patient
                    </label>
                  )}

                  {/* Action buttons */}
                  {canProceedToPayment() && (
                    <div style={styles.cartActions}>
                      <button
                        style={styles.primaryBtn}
                        onClick={proceedToCheckout}
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
                    {cartItems.some(i => ['weight_loss', 'peptide'].includes(i.category)) && (
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

              {/* Weight Loss Injection Frequency */}
              {cartItems.some(i => i.category === 'weight_loss') && (
                <div style={styles.paymentSection}>
                  <div style={styles.paymentSectionLabel}>INJECTION FREQUENCY</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setWlFrequencyDays(7)}
                      style={{
                        ...styles.fulfillmentBtn,
                        ...(wlFrequencyDays === 7 ? { border: '2px solid #2E75B6', background: '#EBF3FB', color: '#2E75B6' } : {}),
                      }}
                    >Weekly (every 7 days)</button>
                    <button
                      onClick={() => setWlFrequencyDays(10)}
                      style={{
                        ...styles.fulfillmentBtn,
                        ...(wlFrequencyDays === 10 ? { border: '2px solid #e67e22', background: '#FFF5EB', color: '#e67e22' } : {}),
                      }}
                    >Every 10 Days</button>
                  </div>
                  {cartItems.some(i => i.category === 'weight_loss') && (
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                      {(() => {
                        const wlItems = cartItems.filter(i => i.category === 'weight_loss');
                        const totalInj = wlItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
                        const totalDays = totalInj * wlFrequencyDays;
                        return `${totalInj} injection${totalInj > 1 ? 's' : ''} × ${wlFrequencyDays} days = ${totalDays} day supply`;
                      })()}
                    </div>
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
                      <input type="radio" name="pay_method" checked={selectedCard === 'terminal'} onChange={() => { setSelectedCard('terminal'); setTerminalLookup(null); setTerminalPiInput(''); }} />
                      <span>Tap to Pay (Stripe iPhone app)</span>
                    </label>
                    {selectedCard === 'terminal' && (
                      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', lineHeight: '1.5' }}>
                          <strong>1.</strong> Charge <strong>{formatPrice(chargeAmount)}</strong> in the Stripe iPhone app (Tap to Pay on iPhone).<br />
                          <strong>2.</strong> Copy the Payment Intent ID (starts with <code>pi_</code>) from the Stripe app or dashboard and paste it below.
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            value={terminalPiInput}
                            onChange={e => setTerminalPiInput(e.target.value)}
                            placeholder="pi_3Qxxx..."
                            style={{ ...styles.fieldInput, flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
                          />
                          <button
                            onClick={handleTerminalLookup}
                            disabled={!terminalPiInput.trim() || lookingUpTerminal}
                            style={{ ...styles.primaryBtn, padding: '8px 16px', opacity: (!terminalPiInput.trim() || lookingUpTerminal) ? 0.4 : 1 }}
                          >
                            {lookingUpTerminal ? '...' : 'Look Up'}
                          </button>
                        </div>
                        {terminalLookup?.error && (
                          <div style={{ padding: '8px', background: '#fee2e2', fontSize: '13px', color: '#dc2626' }}>{terminalLookup.error}</div>
                        )}
                        {terminalLookup?.ok && (
                          <div style={{
                            padding: '10px',
                            background: terminalLookup.already_recorded ? '#fee2e2' : terminalLookup.amount_matches ? '#f0fdf4' : '#fef3c7',
                            border: terminalLookup.already_recorded ? '1px solid #fca5a5' : terminalLookup.amount_matches ? '1px solid #bbf7d0' : '1px solid #fde68a',
                          }}>
                            <div style={{ fontWeight: 600, color: terminalLookup.already_recorded ? '#991b1b' : '#166534', marginBottom: '4px' }}>
                              {terminalLookup.pi.wallet === 'apple_pay' ? 'Apple Pay' : terminalLookup.pi.wallet === 'google_pay' ? 'Google Pay' : (terminalLookup.pi.card_brand ? terminalLookup.pi.card_brand.toUpperCase() : 'Card')}
                              {terminalLookup.pi.card_last4 ? ` •••• ${terminalLookup.pi.card_last4}` : ''}
                            </div>
                            <div style={{ fontSize: '13px' }}>
                              Charged in Stripe: <strong>{formatPrice(terminalLookup.pi.amount_cents)}</strong>
                            </div>
                            {!terminalLookup.amount_matches && (
                              <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
                                ⚠ Doesn't match cart total of {formatPrice(chargeAmount)}
                              </div>
                            )}
                            {terminalLookup.already_recorded && (
                              <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                                ⚠ Already recorded — cannot re-use this PaymentIntent
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

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
                          <input type="radio" name="pay_method" checked={selectedCard === 'account_credit'} onChange={() => { setSelectedCard('account_credit'); if (creditBalanceCents < chargeAmount && !creditRemainderMethod) setCreditRemainderMethod('cash'); if (creditBalanceCents < chargeAmount && !creditCardSelection) setCreditCardSelection(savedCards.length > 0 ? savedCards[0].id : 'new'); }} />
                          <span>Account Credit — {formatPrice(creditBalanceCents)}</span>
                        </label>
                        {selectedCard === 'account_credit' && creditBalanceCents < chargeAmount && (
                          <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
                            <div style={{ padding: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span>Account Credit:</span><span style={{ fontWeight: 600, color: '#166534' }}>{formatPrice(creditBalanceCents)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                                <span>Remaining:</span><span style={{ fontWeight: 600 }}>{formatPrice(chargeAmount - creditBalanceCents)}</span>
                              </div>
                            </div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Pay Remaining With</label>
                            <label style={{ ...styles.paymentOption, padding: '6px 0' }}>
                              <input type="radio" name="credit_remainder" checked={creditRemainderMethod === 'cash'} onChange={() => setCreditRemainderMethod('cash')} />
                              <span>Cash</span>
                            </label>
                            <label style={{ ...styles.paymentOption, padding: '6px 0' }}>
                              <input type="radio" name="credit_remainder" checked={creditRemainderMethod === 'card'} onChange={() => { setCreditRemainderMethod('card'); if (!creditCardSelection) setCreditCardSelection(savedCards.length > 0 ? savedCards[0].id : 'new'); }} />
                              <span>Card</span>
                            </label>
                            {creditRemainderMethod === 'card' && (
                              <div style={{ paddingLeft: '24px', marginTop: '4px' }}>
                                {savedCards.map(card => (
                                  <label key={card.id} style={{ ...styles.paymentOption, padding: '6px 0' }}>
                                    <input type="radio" name="credit_card" checked={creditCardSelection === card.id} onChange={() => setCreditCardSelection(card.id)} />
                                    <span style={styles.cardBrand}>{card.brand.toUpperCase()}</span>
                                    <span>•••• {card.last4}</span>
                                  </label>
                                ))}
                                <label style={{ ...styles.paymentOption, padding: '6px 0' }}>
                                  <input type="radio" name="credit_card" checked={creditCardSelection === 'new'} onChange={() => setCreditCardSelection('new')} />
                                  <span>New Card</span>
                                </label>
                                {creditCardSelection === 'new' && (
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
                          </div>
                        )}
                        {selectedCard === 'account_credit' && creditBalanceCents >= chargeAmount && (
                          <div style={{ padding: '8px 16px', fontSize: '13px', color: '#166534' }}>
                            Full amount covered by credit
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
                      if (selectedCard === 'terminal') return !terminalLookup || !terminalLookup.ok || terminalLookup.error || terminalLookup.already_recorded;
                      if (selectedCard === 'account_credit') {
                        if (creditBalanceCents >= chargeAmount) return false;
                        if (!creditRemainderMethod) return true;
                        if (creditRemainderMethod === 'card' && !creditCardSelection) return true;
                        return false;
                      }
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
                    if (selectedCard === 'terminal') return !terminalLookup || !terminalLookup.ok || terminalLookup.error || terminalLookup.already_recorded;
                    if (selectedCard === 'account_credit') {
                      if (creditBalanceCents >= chargeAmount) return false;
                      if (!creditRemainderMethod) return true;
                      if (creditRemainderMethod === 'card' && !creditCardSelection) return true;
                      return false;
                    }
                    return selectedCard !== 'cash' && !stripe;
                  })()}
                >
                  {selectedCard === 'cash'
                    ? `Record Cash — ${formatPrice(chargeAmount)}`
                    : selectedCard === 'terminal'
                    ? `Record Tap to Pay — ${formatPrice(chargeAmount)}`
                    : selectedCard === 'split'
                    ? `Split Payment — ${formatPrice(chargeAmount)}`
                    : selectedCard === 'gift_card'
                    ? `Redeem Gift Card — ${formatPrice(chargeAmount)}`
                    : selectedCard === 'account_credit'
                    ? (creditBalanceCents >= chargeAmount
                      ? `Apply Credit — ${formatPrice(chargeAmount)}`
                      : `Credit + ${creditRemainderMethod === 'card' ? 'Card' : 'Cash'} — ${formatPrice(chargeAmount)}`)
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
