// /pages/admin/payments.js
// Payments page - POS and Invoices with create, send, void actions
// Range Medical System V2

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import InvoiceModal from '../../components/InvoiceModal';
import POSChargeModal from '../../components/POSChargeModal';
import PaymentCalendar from '../../components/PaymentCalendar';
import { loadStripe } from '@stripe/stripe-js';
import { List, Calendar, CreditCard, AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw, X } from 'lucide-react';

const PurchasesTab = dynamic(() => import('./purchases').then(mod => ({ default: mod.PurchasesContent })), {
  ssr: false,
  loading: () => <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading purchases...</div>,
});

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function PaymentsPage() {
  const [tab, setTab] = useState('checkout');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [voidingId, setVoidingId] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [markingPaidId, setMarkingPaidId] = useState(null);
  const [showPayDropdown, setShowPayDropdown] = useState(null);
  const [markPaidSkipNotification, setMarkPaidSkipNotification] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Products & Services state
  const [posServices, setPosServices] = useState([]);
  const [posServicesLoading, setPosServicesLoading] = useState(false);
  const [posServicesLoaded, setPosServicesLoaded] = useState(false);

  // Gift Cards state
  const [giftCards, setGiftCards] = useState([]);
  const [giftCardsLoading, setGiftCardsLoading] = useState(false);
  const [giftCardsLoaded, setGiftCardsLoaded] = useState(false);
  const [giftCardSearch, setGiftCardSearch] = useState('');
  const [giftCardStatusFilter, setGiftCardStatusFilter] = useState('all');

  // Subscriptions state
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsLoaded, setSubsLoaded] = useState(false);
  const [subsSearch, setSubsSearch] = useState('');
  const [subsStatusFilter, setSubsStatusFilter] = useState('all');
  const [subActionLoading, setSubActionLoading] = useState(null);
  const [showNewSubModal, setShowNewSubModal] = useState(false);
  const [newSubPatientSearch, setNewSubPatientSearch] = useState('');
  const [newSubPatientResults, setNewSubPatientResults] = useState([]);
  const [newSubPatient, setNewSubPatient] = useState(null);
  const [newSubForm, setNewSubForm] = useState({ amount: '', interval: 'month', description: '', service_category: 'hrt' });
  const [creatingSub, setCreatingSub] = useState(false);
  const [subPlans, setSubPlans] = useState([]);
  const [loadingSubPlans, setLoadingSubPlans] = useState(false);
  const [newSubPatientCards, setNewSubPatientCards] = useState([]);
  const [expandedGiftCard, setExpandedGiftCard] = useState(null);
  const [giftCardRedemptions, setGiftCardRedemptions] = useState({});
  const [voidingGiftCardId, setVoidingGiftCardId] = useState(null);

  // Calendar / day detail state
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayTransactions, setDayTransactions] = useState([]);
  const [daySummary, setDaySummary] = useState(null);
  const [loadingDay, setLoadingDay] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Charge Card on File state
  const [chargeCardInvoice, setChargeCardInvoice] = useState(null);
  const [chargeCardCards, setChargeCardCards] = useState([]);
  const [chargeCardLoading, setChargeCardLoading] = useState(false);
  const [chargingCard, setChargingCard] = useState(false);

  const router = useRouter();
  const [recentCheckouts, setRecentCheckouts] = useState([]);
  const [loadingCheckouts, setLoadingCheckouts] = useState(false);

  // Stripe Verify state
  const [verifyMonth, setVerifyMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyApplying, setVerifyApplying] = useState(false);
  const [flaggedEdits, setFlaggedEdits] = useState({});  // { piId: { purchaseId: editedAmount } }
  const [savingFlagged, setSavingFlagged] = useState(null);  // piId being saved

  // POS state
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargePatient, setChargePatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const searchTimeout = useRef(null);

  useEffect(() => {
    fetchInvoices();
    loadRecentPurchases();
  }, []);

  // Fetch POS services when Products tab is first selected
  useEffect(() => {
    if (tab === 'products' && !posServicesLoaded) {
      fetchPosServices();
    }
    if (tab === 'gift_cards' && !giftCardsLoaded) {
      fetchGiftCards();
    }
    if (tab === 'subscriptions' && !subsLoaded) {
      fetchAllSubscriptions();
    }
    if (tab === 'subscriptions' && subPlans.length === 0) {
      fetchSubPlans();
    }
  }, [tab]);

  const fetchSubPlans = async () => {
    setLoadingSubPlans(true);
    try {
      const res = await fetch('/api/pos/services?active=true');
      const data = await res.json();
      const recurring = (data.services || [])
        .filter(s => s.recurring && s.price > 0)
        .map(s => ({ id: s.id, name: s.name, price: s.price, category: s.category, interval: s.interval || 'month' }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setSubPlans(recurring);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
    }
    setLoadingSubPlans(false);
  };

  const fetchAllSubscriptions = async () => {
    setSubsLoading(true);
    try {
      const { data, error } = await (await import('../../lib/supabase')).supabase
        .from('subscriptions')
        .select('*, patients!inner(id, first_name, last_name, email, stripe_customer_id)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAllSubscriptions((data || []).map(s => ({
        ...s,
        patient_name: `${s.patients?.first_name || ''} ${s.patients?.last_name || ''}`.trim(),
        patient_email: s.patients?.email || '',
        patient_stripe_id: s.patients?.stripe_customer_id || '',
      })));
      setSubsLoaded(true);
    } catch (err) {
      console.error('Fetch subscriptions error:', err);
    } finally {
      setSubsLoading(false);
    }
  };

  const handleSubAction = async (subscriptionId, action, paymentMethodId) => {
    setSubActionLoading(subscriptionId + '_' + action);
    try {
      const res = await fetch('/api/stripe/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: subscriptionId, action, payment_method_id: paymentMethodId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      alert(data.message || 'Success');
      fetchAllSubscriptions();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubActionLoading(null);
    }
  };

  const handleCancelSub = async (subscriptionId, immediate) => {
    const msg = immediate
      ? 'Cancel this subscription immediately? This cannot be undone.'
      : 'Cancel at the end of the current billing period?';
    if (!confirm(msg)) return;
    setSubActionLoading(subscriptionId + '_cancel');
    try {
      if (immediate) {
        const res = await fetch('/api/stripe/subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription_id: subscriptionId }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Cancel failed');
        alert('Subscription cancelled');
      } else {
        await handleSubAction(subscriptionId, 'cancel_at_period_end');
        return;
      }
      fetchAllSubscriptions();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubActionLoading(null);
    }
  };

  const searchNewSubPatients = async (q) => {
    setNewSubPatientSearch(q);
    if (q.length < 2) { setNewSubPatientResults([]); return; }
    try {
      const { data } = await (await import('../../lib/supabase')).supabase
        .from('patients')
        .select('id, first_name, last_name, email, stripe_customer_id')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(8);
      setNewSubPatientResults(data || []);
    } catch { setNewSubPatientResults([]); }
  };

  const selectNewSubPatient = async (p) => {
    setNewSubPatient(p);
    setNewSubPatientSearch('');
    setNewSubPatientResults([]);
    // Load their cards
    try {
      const res = await fetch(`/api/stripe/saved-cards?patient_id=${p.id}`);
      const data = await res.json();
      setNewSubPatientCards(data.cards || []);
    } catch { setNewSubPatientCards([]); }
  };

  const handleCreateNewSub = async () => {
    if (!newSubPatient) { alert('Select a patient first'); return; }
    if (!newSubForm.amount || parseFloat(newSubForm.amount) <= 0) { alert('Enter a valid amount'); return; }
    if (newSubPatientCards.length === 0) { alert('Patient needs a card on file first.'); return; }
    setCreatingSub(true);
    try {
      const res = await fetch('/api/stripe/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: newSubPatient.id,
          price_amount: Math.round(parseFloat(newSubForm.amount) * 100),
          interval: newSubForm.interval,
          description: newSubForm.description || `${newSubForm.service_category?.toUpperCase() || ''} Subscription`.trim(),
          service_category: newSubForm.service_category || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create subscription');
      alert(`Subscription created! Status: ${data.status}`);
      setShowNewSubModal(false);
      setNewSubPatient(null);
      setNewSubForm({ amount: '', interval: 'month', description: '', service_category: 'hrt' });
      setNewSubPatientCards([]);
      fetchAllSubscriptions();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setCreatingSub(false);
    }
  };

  const fetchPosServices = async () => {
    setPosServicesLoading(true);
    try {
      const res = await fetch('/api/pos/services?active=true');
      const data = await res.json();
      setPosServices(data.services || []);
      setPosServicesLoaded(true);
    } catch (err) {
      console.error('Error fetching POS services:', err);
    } finally {
      setPosServicesLoading(false);
    }
  };

  const fetchGiftCards = async () => {
    setGiftCardsLoading(true);
    try {
      const res = await fetch('/api/gift-cards');
      const data = await res.json();
      setGiftCards(data.gift_cards || []);
      setGiftCardsLoaded(true);
    } catch (err) {
      console.error('Error fetching gift cards:', err);
    } finally {
      setGiftCardsLoading(false);
    }
  };

  const fetchGiftCardDetail = async (id) => {
    if (giftCardRedemptions[id]) return; // already loaded
    try {
      const res = await fetch(`/api/gift-cards/${id}`);
      const data = await res.json();
      setGiftCardRedemptions(prev => ({ ...prev, [id]: data.redemptions || [] }));
    } catch (err) {
      console.error('Error fetching gift card detail:', err);
    }
  };

  const handleVoidGiftCard = async (card) => {
    if (!confirm(`Void gift card ${card.code}? This cannot be undone.`)) return;
    setVoidingGiftCardId(card.id);
    try {
      const res = await fetch(`/api/gift-cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'voided' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setActionMsg('Gift card voided');
      setTimeout(() => setActionMsg(''), 3000);
      fetchGiftCards();
    } catch (err) {
      alert('Void failed: ' + err.message);
    } finally {
      setVoidingGiftCardId(null);
    }
  };

  const filteredGiftCards = giftCards.filter(gc => {
    if (giftCardStatusFilter !== 'all' && gc.status !== giftCardStatusFilter) return false;
    if (giftCardSearch) {
      const q = giftCardSearch.toLowerCase();
      return (gc.code || '').toLowerCase().includes(q) ||
        (gc.buyer_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const giftCardStats = {
    totalSold: giftCards.length,
    totalValue: giftCards.reduce((s, gc) => s + (gc.initial_amount || 0), 0),
    outstanding: giftCards.filter(gc => gc.status === 'active').reduce((s, gc) => s + (gc.remaining_amount || 0), 0),
    active: giftCards.filter(gc => gc.status === 'active').length,
    depleted: giftCards.filter(gc => gc.status === 'depleted').length,
    voided: giftCards.filter(gc => gc.status === 'voided').length,
  };

  // Patient search with debounce
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

  const loadRecentPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const res = await fetch('/api/admin/purchases?limit=10&source=stripe_pos');
      const data = await res.json();
      setRecentPurchases(data.purchases || []);
    } catch (err) {
      console.error('Load purchases error:', err);
    }
    setLoadingPurchases(false);
  };

  const formatPurchaseDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices/list?limit=200');
      const data = await res.json();
      setInvoices(data.invoices || data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCents = (cents) => {
    if (!cents && cents !== 0) return '-';
    return '$' + (cents / 100).toFixed(2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const statusColors = {
    paid: { bg: '#dcfce7', color: '#166534' },
    sent: { bg: '#dbeafe', color: '#1e40af' },
    pending: { bg: '#fef3c7', color: '#92400e' },
    expired: { bg: '#fee2e2', color: '#dc2626' },
    cancelled: { bg: '#f0f0f0', color: '#666' },
    voided: { bg: '#fce7f3', color: '#be185d' }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (inv.patient_name || '').toLowerCase().includes(q) ||
        (inv.patient_email || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Summary stats
  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === 'pending' || i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    paidTotal: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_cents || 0), 0),
    outstanding: invoices.filter(i => i.status === 'pending' || i.status === 'sent').reduce((s, i) => s + (i.total_cents || 0), 0),
  };

  // Void invoice
  const handleVoid = async (inv) => {
    if (!confirm(`Void this ${formatCents(inv.total_cents)} invoice for ${inv.patient_name}?${inv.status === 'paid' ? ' This will also issue a Stripe refund.' : ''}`)) return;

    setVoidingId(inv.id);
    try {
      const res = await fetch('/api/invoices/void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: inv.id,
          reason: 'Voided by admin',
          voided_by: 'admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActionMsg(data.refund ? `Invoice voided & refund of ${formatCents(data.refund.amount)} issued` : 'Invoice voided');
      setTimeout(() => setActionMsg(''), 4000);
      fetchInvoices();
    } catch (err) {
      alert('Void failed: ' + err.message);
    } finally {
      setVoidingId(null);
    }
  };

  // Resend invoice
  const handleResend = async (inv, via) => {
    setSendingId(inv.id);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ via }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.twoStep) {
        setActionMsg('Opt-in text sent — invoice link will be delivered when patient replies YES');
        setTimeout(() => setActionMsg(''), 6000);
      } else {
        setActionMsg(`Invoice sent via ${via}`);
        setTimeout(() => setActionMsg(''), 3000);
      }
      fetchInvoices();
    } catch (err) {
      alert('Send failed: ' + err.message);
    } finally {
      setSendingId(null);
    }
  };

  const handleInvoiceCreated = () => {
    fetchInvoices();
    setActionMsg('Invoice created successfully');
    setTimeout(() => setActionMsg(''), 3000);
  };

  // Mark invoice as paid from admin
  const handleMarkPaid = async (inv, paymentMethod) => {
    const label = paymentMethod === 'comp' ? 'comp (no charge)' : paymentMethod;
    if (!confirm(`Mark this ${formatCents(inv.total_cents)} invoice for ${inv.patient_name} as paid via ${label}?`)) return;
    const skipNotif = markPaidSkipNotification;
    setMarkingPaidId(inv.id);
    setShowPayDropdown(null);
    setMarkPaidSkipNotification(false);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method: paymentMethod, notes: `Paid via ${label}`, skip_notification: skipNotif }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMsg(`Invoice marked as paid (${label})`);
      setTimeout(() => setActionMsg(''), 3000);
      fetchInvoices();
    } catch (err) {
      alert('Mark paid failed: ' + err.message);
    } finally {
      setMarkingPaidId(null);
    }
  };

  // Charge card on file for an invoice
  const openChargeCardModal = async (inv) => {
    setShowPayDropdown(null);
    if (!inv.patient_id) {
      alert('This invoice has no linked patient — cannot look up saved cards.');
      return;
    }
    setChargeCardInvoice(inv);
    setChargeCardCards([]);
    setChargeCardLoading(true);
    try {
      const res = await fetch(`/api/stripe/saved-cards?patient_id=${inv.patient_id}`);
      const data = await res.json();
      setChargeCardCards(data.cards || []);
    } catch {
      setChargeCardCards([]);
    }
    setChargeCardLoading(false);
  };

  const handleChargeCard = async (paymentMethodId) => {
    if (!chargeCardInvoice) return;
    const inv = chargeCardInvoice;
    if (!confirm(`Charge ${formatCents(inv.total_cents)} to this card for ${inv.patient_name}?`)) return;
    setChargingCard(true);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/charge-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method_id: paymentMethodId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMsg('Card charged successfully');
      setTimeout(() => setActionMsg(''), 3000);
      setChargeCardInvoice(null);
      fetchInvoices();
    } catch (err) {
      alert('Charge failed: ' + err.message);
    } finally {
      setChargingCard(false);
    }
  };

  // Open edit modal
  const openEditModal = (inv) => {
    setEditingInvoice(inv);
    setEditForm({
      patient_name: inv.patient_name || '',
      patient_email: inv.patient_email || '',
      patient_phone: inv.patient_phone || '',
      items: JSON.parse(JSON.stringify(inv.items || [])),
      discount_cents: inv.discount_cents || 0,
      discount_description: inv.discount_description || '',
      notes: inv.notes || '',
    });
  };

  // Save edited invoice
  const handleSaveEdit = async () => {
    if (!editingInvoice || !editForm) return;
    setSavingEdit(true);
    try {
      const subtotal_cents = editForm.items.reduce((s, i) => s + (i.price_cents * (i.quantity || 1)), 0);
      const total_cents = Math.max(subtotal_cents - (editForm.discount_cents || 0), 0);
      const res = await fetch(`/api/invoices/${editingInvoice.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: editForm.patient_name,
          patient_email: editForm.patient_email,
          patient_phone: editForm.patient_phone,
          items: editForm.items,
          subtotal_cents,
          discount_cents: editForm.discount_cents || 0,
          discount_description: editForm.discount_description || null,
          total_cents,
          notes: editForm.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMsg('Invoice updated');
      setTimeout(() => setActionMsg(''), 3000);
      setEditingInvoice(null);
      setEditForm(null);
      fetchInvoices();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Calendar day detail handler
  const handleDaySelect = async (dateStr) => {
    setSelectedDay(dateStr);
    setLoadingDay(true);
    try {
      const res = await fetch(`/api/admin/payments/daily?date=${dateStr}`);
      const data = await res.json();
      setDayTransactions(data.transactions || []);
      setDaySummary(data.summary || null);
    } catch (err) {
      console.error('Failed to load day detail:', err);
      setDayTransactions([]);
    }
    setLoadingDay(false);
  };

  const closeDayDetail = () => {
    setSelectedDay(null);
    setDayTransactions([]);
    setDaySummary(null);
  };

  // Stripe reconciliation — deep match by email/name + date
  const handleReconcile = async () => {
    const month = calendarMonth || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();
    if (!confirm(`Run deep Stripe reconciliation for ${month}? This will pull all Stripe charges and match them to purchases by customer email/name + date, then fix any incorrect amounts.`)) return;
    setReconciling(true);
    setReconcileResult(null);
    try {
      const res = await fetch(`/api/admin/stripe-deep-reconcile?month=${month}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      });
      const data = await res.json();
      setReconcileResult(data);
      if (data.reconciliation) {
        const r = data.reconciliation;
        setActionMsg(
          `Matched ${r.matched} purchases to Stripe. Fixed ${r.mismatches} amounts. ${r.unmatched_charges} Stripe charges unmatched (Mango Mint / Zenoti).`
        );
      } else {
        setActionMsg(data.message || 'Reconciliation complete');
      }
      setTimeout(() => setActionMsg(''), 8000);
    } catch (err) {
      alert('Reconciliation failed: ' + err.message);
    }
    setReconciling(false);
  };

  const paymentStatusColors = {
    succeeded: { bg: '#dcfce7', color: '#166534', label: 'Paid' },
    paid: { bg: '#dcfce7', color: '#166534', label: 'Paid' },
    pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    sent: { bg: '#dbeafe', color: '#1e40af', label: 'Sent' },
    failed: { bg: '#fee2e2', color: '#dc2626', label: 'Failed' },
    requires_payment_method: { bg: '#fee2e2', color: '#dc2626', label: 'Failed' },
    refunded: { bg: '#f3e8ff', color: '#7c3aed', label: 'Refunded' },
    expired: { bg: '#fee2e2', color: '#dc2626', label: 'Expired' },
    voided: { bg: '#fce7f3', color: '#be185d', label: 'Voided' },
  };

  const paymentMethodLabels = {
    stripe: 'Stripe',
    manual: 'Manual',
    cash: 'Cash',
    ghl: 'GHL',
    invoice: 'Invoice',
    comp: 'Comp',
    unknown: 'Unknown',
  };

  const formatDayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });
  };

  return (
    <AdminLayout title="Payments">
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {/* Action message toast */}
      {actionMsg && (
        <div style={styles.toast}>{actionMsg}</div>
      )}

      {/* Tab bar + Create button */}
      <div style={styles.topBar}>
        <div style={styles.tabBar}>
          {['checkout', 'invoices', 'pos', 'subscriptions', 'purchases', 'products', 'gift_cards', 'verify'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.tab,
                ...(tab === t ? styles.tabActive : {})
              }}
            >
              {t === 'checkout' ? 'Checkout' : t === 'invoices' ? 'Invoices' : t === 'pos' ? 'POS Checkout' : t === 'subscriptions' ? 'Subscriptions' : t === 'purchases' ? 'Purchases' : t === 'products' ? 'Products & Services' : t === 'gift_cards' ? 'Gift Cards' : 'Verify'}
            </button>
          ))}
        </div>
        {tab === 'checkout' && (
          <button
            onClick={() => router.push('/admin/checkout')}
            style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
          >
            + New Checkout
          </button>
        )}
        {tab === 'invoices' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  ...styles.viewToggle,
                  ...(viewMode === 'list' ? styles.viewToggleActive : {}),
                }}
              >
                <List size={14} /> List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                style={{
                  ...styles.viewToggle,
                  ...(viewMode === 'calendar' ? styles.viewToggleActive : {}),
                }}
              >
                <Calendar size={14} /> Calendar
              </button>
            </div>
            <button
              onClick={handleReconcile}
              disabled={reconciling}
              style={{ ...styles.actionBtn, gap: '4px', display: 'flex', alignItems: 'center' }}
              title="Verify purchase amounts against Stripe"
            >
              <RefreshCw size={13} style={reconciling ? { animation: 'spin 1s linear infinite' } : {}} />
              {reconciling ? 'Reconciling...' : 'Verify Stripe'}
            </button>
            <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
              + Create Invoice
            </button>
          </div>
        )}
      </div>

      {/* Reconciliation results */}
      {reconcileResult && (
        <div style={{ ...styles.card, marginBottom: '16px', border: '1px solid #86efac' }}>
          <div style={{ padding: '14px 20px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: reconcileResult.stripe ? '12px' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#16a34a" />
                <span style={{ fontWeight: '600', fontSize: '13px', color: '#166534' }}>
                  {reconcileResult.message || 'Reconciliation complete'}
                </span>
              </div>
              <button onClick={() => setReconcileResult(null)} style={{ ...styles.actionBtn, fontSize: '11px' }}>Dismiss</button>
            </div>
            {reconcileResult.stripe && (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#475569' }}>
                <span>Stripe: <b style={{ color: '#166534' }}>${reconcileResult.stripe.total_collected}</b> collected</span>
                <span>DB was: <b>${reconcileResult.database?.total_amount}</b></span>
                <span>Discrepancy: <b style={{ color: parseFloat(reconcileResult.database?.discrepancy) > 0 ? '#dc2626' : '#166534' }}>${reconcileResult.database?.discrepancy}</b></span>
                <span>Matched: <b>{reconcileResult.reconciliation?.matched}</b></span>
                <span>Fixed: <b style={{ color: '#b45309' }}>{reconcileResult.reconciliation?.mismatches}</b></span>
                <span>Unmatched charges: <b>{reconcileResult.reconciliation?.unmatched_charges}</b> <span style={{ color: '#94a3b8' }}>(Mango Mint / Zenoti)</span></span>
              </div>
            )}
          </div>
          {reconcileResult.details?.mismatches?.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Was (Wrong)</th>
                  <th style={styles.th}>Now (Correct)</th>
                  <th style={styles.th}>Match</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {reconcileResult.details.mismatches.map(m => (
                  <tr key={m.purchase_id} style={styles.tr}>
                    <td style={styles.td}>{m.patient_name || m.purchase_id?.slice(0, 8)}</td>
                    <td style={{ ...styles.td, textDecoration: 'line-through', color: '#94a3b8' }}>${m.old_amount?.toFixed(2)}</td>
                    <td style={{ ...styles.td, color: '#166534', fontWeight: '600' }}>${(m.stripe_amount || m.correct_amount)?.toFixed(2)}</td>
                    <td style={{ ...styles.td, fontSize: '10px', color: '#64748b' }}>{m.match_method || '—'}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: '#dcfce7', color: '#166534' }}>Fixed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* === CHECKOUT TAB === */}
      {tab === 'checkout' && (
        <>
          <CheckoutTab
            onStartCheckout={(patient) => {
              if (patient) {
                router.push(`/admin/checkout?patient_id=${patient.id}&patient_name=${encodeURIComponent(patient.name || '')}`);
              } else {
                router.push('/admin/checkout');
              }
            }}
          />
        </>
      )}

      {tab === 'invoices' && viewMode === 'calendar' && (
        <>
          <PaymentCalendar
            onDaySelect={handleDaySelect}
            selectedDate={selectedDay}
            onMonthChange={setCalendarMonth}
          />

          {/* Day detail modal */}
          {selectedDay && (
            <div style={styles.dayModalOverlay} onClick={closeDayDetail}>
              <div style={styles.dayModal} onClick={e => e.stopPropagation()}>
                <div style={styles.dayModalHeader}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                      {formatDayDate(selectedDay)}
                    </h3>
                    {daySummary && (
                      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12px' }}>
                        <span style={{ color: '#166534', fontWeight: '600' }}>
                          <CheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                          ${daySummary.collected?.toFixed(2)} collected
                        </span>
                        {daySummary.outstanding > 0 && (
                          <span style={{ color: '#92400e', fontWeight: '600' }}>
                            <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                            ${daySummary.outstanding?.toFixed(2)} outstanding
                          </span>
                        )}
                        {daySummary.failed > 0 && (
                          <span style={{ color: '#dc2626', fontWeight: '600' }}>
                            <XCircle size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                            {daySummary.failed} failed
                          </span>
                        )}
                        {daySummary.refunded > 0 && (
                          <span style={{ color: '#7c3aed', fontWeight: '600' }}>
                            ${daySummary.refunded?.toFixed(2)} refunded
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={closeDayDetail} style={styles.dayModalClose}>
                    <X size={18} />
                  </button>
                </div>

                {loadingDay ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    Loading transactions...
                  </div>
                ) : dayTransactions.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No transactions on this day
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Time</th>
                          <th style={styles.th}>Patient</th>
                          <th style={styles.th}>Description</th>
                          <th style={styles.th}>Amount</th>
                          <th style={styles.th}>Method</th>
                          <th style={styles.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayTransactions.map(txn => {
                          const sc = paymentStatusColors[txn.status] || paymentStatusColors.pending;
                          return (
                            <tr key={`${txn.type}-${txn.id}`} style={styles.tr}>
                              <td style={{ ...styles.td, whiteSpace: 'nowrap', fontSize: '12px' }}>
                                {formatTime(txn.time)}
                              </td>
                              <td style={styles.td}>
                                {txn.patient_id ? (
                                  <Link href={`/admin/patient/${txn.patient_id}`} style={{ color: '#1e40af', textDecoration: 'none', fontWeight: '500' }}>
                                    {txn.patient_name || 'Unknown'}
                                  </Link>
                                ) : (
                                  <span style={{ fontWeight: '500' }}>{txn.patient_name || 'Unknown'}</span>
                                )}
                              </td>
                              <td style={styles.td}>
                                <div style={{ fontWeight: '500', fontSize: '13px' }}>{txn.description}</div>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                  {txn.category && (
                                    <span style={{
                                      fontSize: '10px',
                                      padding: '1px 6px',
                                      borderRadius: 0,
                                      background: '#f1f5f9',
                                      color: '#64748b',
                                      fontWeight: '500',
                                    }}>
                                      {txn.category}
                                    </span>
                                  )}
                                  <span style={{
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    borderRadius: 0,
                                    background: txn.type === 'invoice' ? '#eff6ff' : '#f0fdf4',
                                    color: txn.type === 'invoice' ? '#1e40af' : '#166534',
                                    fontWeight: '500',
                                  }}>
                                    {txn.type}
                                  </span>
                                </div>
                              </td>
                              <td style={styles.td}>
                                <div style={{ fontWeight: '600', fontSize: '14px' }}>
                                  ${txn.amount?.toFixed(2)}
                                </div>
                                {txn.amount_mismatch && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                    <AlertTriangle size={11} color="#dc2626" />
                                    <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: '600' }}>
                                      DB: ${txn.original_amount?.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                {txn.stripe_verified && !txn.amount_mismatch && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                    <CheckCircle size={11} color="#16a34a" />
                                    <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '500' }}>Verified</span>
                                  </div>
                                )}
                              </td>
                              <td style={styles.td}>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: '#475569',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}>
                                  <CreditCard size={12} />
                                  {paymentMethodLabels[txn.payment_method] || txn.payment_method}
                                </span>
                              </td>
                              <td style={styles.td}>
                                <span style={{
                                  ...styles.badge,
                                  background: sc.bg,
                                  color: sc.color,
                                }}>
                                  {sc.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'invoices' && viewMode === 'list' && (
        <>
          {/* Summary stats */}
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <div style={styles.statValue}>{stats.total}</div>
              <div style={styles.statLabel}>Total</div>
            </div>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#166534' }}>{formatCents(stats.paidTotal)}</div>
              <div style={styles.statLabel}>Collected</div>
            </div>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#92400e' }}>{formatCents(stats.outstanding)}</div>
              <div style={styles.statLabel}>Outstanding</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>{stats.paid}</div>
              <div style={styles.statLabel}>Paid</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>{stats.pending}</div>
              <div style={styles.statLabel}>Pending</div>
            </div>
          </div>

          {/* Filters */}
          <div style={styles.filters}>
            <input
              type="text"
              placeholder="Search by patient name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <div style={styles.filterPills}>
              {['all', 'pending', 'sent', 'paid', 'expired', 'voided'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    ...styles.filterPill,
                    ...(statusFilter === s ? styles.filterPillActive : {}),
                  }}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Invoice table */}
          <div style={styles.card}>
            {loading ? (
              <div style={styles.loading}>Loading invoices...</div>
            ) : filteredInvoices.length === 0 ? (
              <div style={styles.empty}>
                {search || statusFilter !== 'all' ? 'No invoices match your filters' : 'No invoices yet'}
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Items</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(inv => {
                    const sc = statusColors[inv.status] || statusColors.pending;
                    const isExpanded = expandedId === inv.id;
                    const itemNames = (inv.items || []).map(i => i.name).join(', ');

                    return (
                      <React.Fragment key={inv.id}>
                        <tr
                          style={{ ...styles.tr, cursor: 'pointer', background: isExpanded ? '#fafafa' : 'transparent' }}
                          onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                        >
                          <td style={styles.td}>
                            <div style={{ fontWeight: '500' }}>{inv.patient_name || 'Unknown'}</div>
                            {inv.patient_email && (
                              <div style={{ fontSize: '12px', color: '#999' }}>{inv.patient_email}</div>
                            )}
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontSize: '13px', color: '#666' }}>
                              {itemNames.length > 40 ? itemNames.substring(0, 40) + '...' : itemNames}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontWeight: '500' }}>{formatCents(inv.total_cents)}</span>
                            {inv.discount_cents > 0 && (
                              <div style={{ fontSize: '11px', color: '#16a34a' }}>
                                -{formatCents(inv.discount_cents)} off
                              </div>
                            )}
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badge,
                              background: sc.bg,
                              color: sc.color
                            }}>
                              {inv.status}
                            </span>
                          </td>
                          <td style={styles.td}>{formatDate(inv.created_at)}</td>
                          <td style={styles.td} onClick={e => e.stopPropagation()}>
                            <div style={styles.actions}>
                              {/* Send/resend for pending or sent */}
                              {(inv.status === 'pending' || inv.status === 'sent') && (
                                <>
                                  <button
                                    onClick={() => handleResend(inv, 'email')}
                                    disabled={sendingId === inv.id}
                                    style={styles.actionBtn}
                                    title="Send via email"
                                  >
                                    {sendingId === inv.id ? '...' : 'Email'}
                                  </button>
                                  <button
                                    onClick={() => handleResend(inv, 'sms')}
                                    disabled={sendingId === inv.id}
                                    style={styles.textBtn}
                                    title="Send via text message"
                                  >
                                    {sendingId === inv.id ? '...' : 'Text'}
                                  </button>
                                </>
                              )}
                              {/* Mark Paid for pending or sent */}
                              {(inv.status === 'pending' || inv.status === 'sent') && (
                                <div style={{ position: 'relative' }}>
                                  <button
                                    onClick={() => setShowPayDropdown(showPayDropdown === inv.id ? null : inv.id)}
                                    disabled={markingPaidId === inv.id}
                                    style={styles.payBtn}
                                    title="Mark as paid"
                                  >
                                    {markingPaidId === inv.id ? '...' : 'Pay'}
                                  </button>
                                  {showPayDropdown === inv.id && (
                                    <div style={styles.payDropdown}>
                                      <div style={styles.payDropdownItem} onClick={() => openChargeCardModal(inv)}>Charge Card on File</div>
                                      <div style={styles.payDropdownItem} onClick={() => handleMarkPaid(inv, 'comp')}>Comp (no charge)</div>
                                      <div style={styles.payDropdownItem} onClick={() => handleMarkPaid(inv, 'cash')}>Cash</div>
                                      <div style={styles.payDropdownItem} onClick={() => handleMarkPaid(inv, 'card')}>Card (manual)</div>
                                      <div style={styles.payDropdownItem} onClick={() => handleMarkPaid(inv, 'other')}>Other</div>
                                      <label
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', color: '#64748b', cursor: 'pointer', borderTop: '1px solid #e2e8f0' }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={markPaidSkipNotification}
                                          onChange={(e) => setMarkPaidSkipNotification(e.target.checked)}
                                          style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                                        />
                                        Skip receipt
                                      </label>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Edit for pending or sent */}
                              {(inv.status === 'pending' || inv.status === 'sent') && (
                                <button
                                  onClick={() => openEditModal(inv)}
                                  style={styles.editBtn}
                                  title="Edit invoice"
                                >
                                  Edit
                                </button>
                              )}
                              {/* Void for non-voided */}
                              {inv.status !== 'voided' && inv.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleVoid(inv)}
                                  disabled={voidingId === inv.id}
                                  style={styles.voidBtn}
                                  title="Void invoice"
                                >
                                  {voidingId === inv.id ? '...' : 'Void'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Expanded detail row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} style={styles.expandedRow}>
                              <div style={styles.detailGrid}>
                                <div style={styles.detailSection}>
                                  <div style={styles.detailTitle}>Line Items</div>
                                  {(inv.items || []).map((item, idx) => (
                                    <div key={idx} style={styles.detailItem}>
                                      <span>{item.name}</span>
                                      <span>
                                        {item.quantity > 1 ? `${item.quantity} × ` : ''}
                                        {formatCents(item.price_cents)}
                                      </span>
                                    </div>
                                  ))}
                                  {inv.discount_cents > 0 && (
                                    <div style={{ ...styles.detailItem, color: '#16a34a' }}>
                                      <span>Discount {inv.discount_description ? `(${inv.discount_description})` : ''}</span>
                                      <span>-{formatCents(inv.discount_cents)}</span>
                                    </div>
                                  )}
                                  <div style={{ ...styles.detailItem, fontWeight: '600', borderTop: '1px solid #e5e5e5', paddingTop: '6px', marginTop: '4px' }}>
                                    <span>Total</span>
                                    <span>{formatCents(inv.total_cents)}</span>
                                  </div>
                                </div>
                                <div style={styles.detailSection}>
                                  <div style={styles.detailTitle}>Details</div>
                                  <div style={styles.detailMeta}>
                                    <span style={styles.metaLabel}>Created</span>
                                    <span>{formatDate(inv.created_at)}</span>
                                  </div>
                                  {inv.sent_at && (
                                    <div style={styles.detailMeta}>
                                      <span style={styles.metaLabel}>Sent</span>
                                      <span>{formatDate(inv.sent_at)} via {inv.sent_via}</span>
                                    </div>
                                  )}
                                  {inv.paid_at && (
                                    <div style={styles.detailMeta}>
                                      <span style={styles.metaLabel}>Paid</span>
                                      <span>{formatDate(inv.paid_at)}</span>
                                    </div>
                                  )}
                                  {inv.voided_at && (
                                    <div style={styles.detailMeta}>
                                      <span style={styles.metaLabel}>Voided</span>
                                      <span>{formatDate(inv.voided_at)}</span>
                                    </div>
                                  )}
                                  {inv.void_reason && (
                                    <div style={styles.detailMeta}>
                                      <span style={styles.metaLabel}>Reason</span>
                                      <span>{inv.void_reason}</span>
                                    </div>
                                  )}
                                  {inv.notes && (
                                    <div style={styles.detailMeta}>
                                      <span style={styles.metaLabel}>Notes</span>
                                      <span>{inv.notes}</span>
                                    </div>
                                  )}
                                  {inv.patient_id && (
                                    <div style={{ marginTop: '8px' }}>
                                      <Link href={`/patients/${inv.patient_id}`} style={styles.patientLink}>
                                        View Patient Profile →
                                      </Link>
                                    </div>
                                  )}
                                  {inv.status === 'paid' && (
                                    <div style={{ marginTop: '10px' }}>
                                      <a
                                        href={`/api/receipt/invoice/${inv.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={styles.printReceiptBtn}
                                        title="Print receipt"
                                      >
                                        🖨️ Print Receipt
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'pos' && (
        <>
          {/* Patient Search + Quick Charge */}
          <div style={styles.posSection}>
            <h3 style={styles.posSectionTitle}>New Charge</h3>
            <div style={styles.posSearchWrap}>
              <input
                type="text"
                placeholder="Search patient by name..."
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                style={styles.posSearchInput}
              />
              {searchingPatients && (
                <div style={{ position: 'absolute', right: '12px', top: '12px', color: '#888', fontSize: '13px' }}>
                  Searching...
                </div>
              )}
              {showPatientDropdown && patientResults.length > 0 && (
                <div style={styles.posDropdown}>
                  {patientResults.map(p => (
                    <div
                      key={p.id}
                      style={styles.posDropdownItem}
                      onClick={() => {
                        setChargePatient(p);
                        setPatientSearch('');
                        setShowPatientDropdown(false);
                        setShowChargeModal(true);
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      {p.email && <div style={{ fontSize: '12px', color: '#888' }}>{p.email}</div>}
                    </div>
                  ))}
                </div>
              )}
              {showPatientDropdown && patientResults.length === 0 && patientSearch.length >= 2 && !searchingPatients && (
                <div style={styles.posDropdown}>
                  <div style={{ padding: '12px', color: '#888', textAlign: 'center' }}>No patients found</div>
                </div>
              )}
            </div>
            <button
              style={styles.posChargeBtn}
              onClick={() => {
                setChargePatient(null);
                setShowChargeModal(true);
              }}
            >
              Quick Charge (search in modal)
            </button>
          </div>

          {/* Recent Charges */}
          <div style={styles.posSection}>
            <h3 style={styles.posSectionTitle}>Recent Charges</h3>
            <div style={styles.card}>
              {loadingPurchases ? (
                <div style={styles.loading}>Loading recent charges...</div>
              ) : recentPurchases.length === 0 ? (
                <div style={styles.empty}>No recent charges</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Product / Service</th>
                      <th style={styles.th}>Patient</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Card</th>
                      <th style={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPurchases.map(p => (
                      <tr key={p.id} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={{ fontWeight: '500' }}>{p.item_name || p.description || 'Charge'}</span>
                        </td>
                        <td style={styles.td}>
                          {p.patient_name || '—'}
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: '500', color: '#16a34a' }}>
                            ${(p.amount_paid != null ? p.amount_paid : p.amount)?.toFixed(2)}
                          </span>
                          {p.discount_type && (
                            <span style={{ fontSize: '11px', color: '#888', marginLeft: '6px' }}>
                              ({p.discount_type === 'percent' ? `${p.discount_amount}% off` : `$${p.discount_amount} off`})
                            </span>
                          )}
                        </td>
                        <td style={styles.td}>
                          {p.card_last4 ? (
                            <span style={{ color: '#555', fontSize: '13px' }}>
                              {p.card_brand ? p.card_brand.charAt(0).toUpperCase() + p.card_brand.slice(1) : ''} ····{p.card_last4}
                            </span>
                          ) : (
                            <span style={{ color: '#bbb', fontSize: '13px' }}>—</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: '#888' }}>{formatPurchaseDate(p.purchase_date)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* POS Charge Modal */}
          <POSChargeModal
            isOpen={showChargeModal}
            onClose={() => setShowChargeModal(false)}
            patient={chargePatient}
            stripePromise={stripePromise}
            onChargeComplete={() => {
              loadRecentPurchases();
              setActionMsg('Charge completed successfully');
              setTimeout(() => setActionMsg(''), 3000);
            }}
          />
        </>
      )}

      {/* === PRODUCTS & SERVICES TAB === */}
      {tab === 'products' && (
        <div>
          {posServicesLoading ? (
            <div style={styles.loading}>Loading products & services...</div>
          ) : posServices.length === 0 ? (
            <div style={styles.empty}>No services found</div>
          ) : (
            (() => {
              const CATEGORY_ORDER = [
                'programs', 'combo_membership', 'hbot', 'red_light', 'hrt', 'weight_loss',
                'iv_therapy', 'specialty_iv', 'injection_standard', 'injection_premium',
                'injection_pack', 'nad_injection', 'peptide', 'labs', 'assessment', 'gift_card', 'custom',
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
                peptide: 'Peptides',
                labs: 'Lab Panels',
                assessment: 'Assessment',
                gift_card: 'Gift Cards',
                custom: 'Custom',
              };

              // Group services by category
              const grouped = {};
              for (const s of posServices) {
                if (!grouped[s.category]) grouped[s.category] = [];
                grouped[s.category].push(s);
              }

              // Sort categories by defined order
              const sortedCategories = Object.keys(grouped).sort((a, b) => {
                const ai = CATEGORY_ORDER.indexOf(a);
                const bi = CATEGORY_ORDER.indexOf(b);
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
              });

              return (
                <div style={styles.productsGrid}>
                  {sortedCategories.map(cat => (
                    <div key={cat} style={styles.productCategory}>
                      <div style={styles.productCategoryHeader}>
                        <span style={styles.productCategoryName}>
                          {CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ')}
                        </span>
                        <span style={styles.productCategoryCount}>
                          {grouped[cat].length} {grouped[cat].length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <div style={styles.productList}>
                        {grouped[cat]
                          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                          .map(service => (
                            <div key={service.id} style={styles.productRow}>
                              <span style={styles.productName}>{service.name}</span>
                              <div style={styles.productPriceWrap}>
                                <span style={styles.productPrice}>
                                  ${(service.price / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                </span>
                                {service.recurring && (
                                  <span style={styles.productRecurring}>/mo</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Purchases Tab */}
      {tab === 'purchases' && <PurchasesTab />}

      {/* Gift Cards Tab */}
      {tab === 'gift_cards' && (
        <div>
          {giftCardsLoading ? (
            <div style={styles.loading}>Loading gift cards...</div>
          ) : (
            <>
              {/* Stats */}
              <div style={styles.statsRow}>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{giftCardStats.totalSold}</div>
                  <div style={styles.statLabel}>Total Sold</div>
                </div>
                <div style={styles.stat}>
                  <div style={{ ...styles.statValue, color: '#166534' }}>{formatCents(giftCardStats.totalValue)}</div>
                  <div style={styles.statLabel}>Total Value</div>
                </div>
                <div style={styles.stat}>
                  <div style={{ ...styles.statValue, color: '#92400e' }}>{formatCents(giftCardStats.outstanding)}</div>
                  <div style={styles.statLabel}>Outstanding</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{giftCardStats.active}</div>
                  <div style={styles.statLabel}>Active</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{giftCardStats.depleted}</div>
                  <div style={styles.statLabel}>Depleted</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{giftCardStats.voided}</div>
                  <div style={styles.statLabel}>Voided</div>
                </div>
              </div>

              {/* Filters */}
              <div style={styles.filters}>
                <input
                  type="text"
                  placeholder="Search by code or buyer..."
                  value={giftCardSearch}
                  onChange={e => setGiftCardSearch(e.target.value)}
                  style={styles.searchInput}
                />
                <div style={styles.filterPills}>
                  {['all', 'active', 'depleted', 'voided'].map(s => (
                    <button
                      key={s}
                      onClick={() => setGiftCardStatusFilter(s)}
                      style={{
                        ...styles.filterPill,
                        ...(giftCardStatusFilter === s ? styles.filterPillActive : {}),
                      }}
                    >
                      {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gift Cards Table */}
              {filteredGiftCards.length === 0 ? (
                <div style={styles.empty}>No gift cards found</div>
              ) : (
                <div style={styles.card}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Code</th>
                        <th style={styles.th}>Buyer</th>
                        <th style={styles.th}>Initial</th>
                        <th style={styles.th}>Remaining</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Created</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGiftCards.map(gc => {
                        const gcStatusColors = {
                          active: { bg: '#dcfce7', color: '#166534' },
                          depleted: { bg: '#f0f0f0', color: '#666' },
                          voided: { bg: '#fee2e2', color: '#dc2626' },
                        };
                        const sc = gcStatusColors[gc.status] || { bg: '#f0f0f0', color: '#666' };
                        const isExpanded = expandedGiftCard === gc.id;
                        return (
                          <React.Fragment key={gc.id}>
                            <tr
                              style={{ ...styles.tr, cursor: 'pointer', background: isExpanded ? '#fafafa' : 'transparent' }}
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedGiftCard(null);
                                } else {
                                  setExpandedGiftCard(gc.id);
                                  fetchGiftCardDetail(gc.id);
                                }
                              }}
                            >
                              <td style={styles.td}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '1px' }}>{gc.code}</span>
                              </td>
                              <td style={styles.td}>{gc.buyer_name || '—'}</td>
                              <td style={styles.td}>{formatCents(gc.initial_amount)}</td>
                              <td style={styles.td}>
                                <span style={{ fontWeight: 600, color: gc.remaining_amount > 0 ? '#166534' : '#666' }}>
                                  {formatCents(gc.remaining_amount)}
                                </span>
                              </td>
                              <td style={styles.td}>
                                <span style={{ ...styles.badge, background: sc.bg, color: sc.color }}>{gc.status}</span>
                              </td>
                              <td style={styles.td}>{formatDate(gc.created_at)}</td>
                              <td style={styles.td}>
                                <div style={styles.actions} onClick={e => e.stopPropagation()}>
                                  {gc.status === 'active' && (
                                    <button
                                      style={styles.voidBtn}
                                      onClick={() => handleVoidGiftCard(gc)}
                                      disabled={voidingGiftCardId === gc.id}
                                    >
                                      {voidingGiftCardId === gc.id ? 'Voiding...' : 'Void'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} style={styles.expandedRow}>
                                  <div style={{ padding: '12px 0' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#999', marginBottom: '10px', letterSpacing: '0.3px' }}>
                                      Redemption History
                                    </div>
                                    {!giftCardRedemptions[gc.id] ? (
                                      <div style={{ color: '#888', fontSize: '13px' }}>Loading...</div>
                                    ) : giftCardRedemptions[gc.id].length === 0 ? (
                                      <div style={{ color: '#888', fontSize: '13px' }}>No redemptions yet</div>
                                    ) : (
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead>
                                          <tr>
                                            <th style={{ ...styles.th, fontSize: '10px', padding: '8px 12px' }}>Date</th>
                                            <th style={{ ...styles.th, fontSize: '10px', padding: '8px 12px' }}>Redeemed By</th>
                                            <th style={{ ...styles.th, fontSize: '10px', padding: '8px 12px' }}>Amount</th>
                                            <th style={{ ...styles.th, fontSize: '10px', padding: '8px 12px' }}>Balance After</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {giftCardRedemptions[gc.id].map(r => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                              <td style={{ padding: '8px 12px' }}>{formatDate(r.created_at)}</td>
                                              <td style={{ padding: '8px 12px' }}>{r.redeemed_by_name || '—'}</td>
                                              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#dc2626' }}>-{formatCents(r.amount)}</td>
                                              <td style={{ padding: '8px 12px' }}>{formatCents(r.balance_after)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {tab === 'subscriptions' && (
        <div>
          {/* Header with Create button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by patient name..."
                value={subsSearch}
                onChange={e => setSubsSearch(e.target.value)}
                style={styles.searchInput}
              />
              <div style={styles.filterPills}>
                {['all', 'active', 'past_due', 'canceled', 'paused'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSubsStatusFilter(s)}
                    style={{
                      ...styles.filterPill,
                      ...(subsStatusFilter === s ? styles.filterPillActive : {}),
                    }}
                  >
                    {s === 'all' ? 'All' : s === 'past_due' ? 'Past Due' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowNewSubModal(true)}
                style={{ ...styles.createBtn }}
              >
                + New Subscription
              </button>
              <button
                onClick={fetchAllSubscriptions}
                style={{ padding: '8px 14px', borderRadius: 0, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                {subsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Stats row */}
          {(() => {
            const active = allSubscriptions.filter(s => s.status === 'active');
            const pastDue = allSubscriptions.filter(s => s.status === 'past_due');
            const totalMRR = active.reduce((sum, s) => sum + (s.amount_cents || 0), 0);
            return (
              <div style={styles.statsRow}>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{allSubscriptions.length}</div>
                  <div style={styles.statLabel}>Total</div>
                </div>
                <div style={styles.stat}>
                  <div style={{ ...styles.statValue, color: '#166534' }}>{active.length}</div>
                  <div style={styles.statLabel}>Active</div>
                </div>
                <div style={styles.stat}>
                  <div style={{ ...styles.statValue, color: pastDue.length > 0 ? '#dc2626' : '#666' }}>{pastDue.length}</div>
                  <div style={styles.statLabel}>Past Due</div>
                </div>
                <div style={styles.stat}>
                  <div style={{ ...styles.statValue, color: '#166534' }}>${(totalMRR / 100).toLocaleString()}</div>
                  <div style={styles.statLabel}>Monthly Revenue</div>
                </div>
              </div>
            );
          })()}

          {subsLoading ? (
            <div style={styles.loading}>Loading subscriptions...</div>
          ) : (() => {
            const filtered = allSubscriptions.filter(s => {
              const matchesSearch = !subsSearch || s.patient_name?.toLowerCase().includes(subsSearch.toLowerCase());
              const matchesStatus = subsStatusFilter === 'all' ||
                (subsStatusFilter === 'paused' ? !!s.pause_collection : s.status === subsStatusFilter);
              return matchesSearch && matchesStatus;
            });
            if (filtered.length === 0) return <div style={styles.empty}>No subscriptions found</div>;
            return (
              <div style={styles.card}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Patient</th>
                      <th style={styles.th}>Description</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(sub => {
                      const isPastDue = sub.status === 'past_due';
                      const isCanceled = sub.status === 'canceled';
                      const isPaused = !!sub.pause_collection;
                      const isCancelingAtEnd = sub.cancel_at_period_end;
                      const statusColor = isPastDue ? '#dc2626' : isPaused ? '#f59e0b' : isCanceled ? '#6b7280' : isCancelingAtEnd ? '#f59e0b' : '#166534';
                      const statusBg = isPastDue ? '#fee2e2' : isPaused ? '#fef3c7' : isCanceled ? '#f3f4f6' : isCancelingAtEnd ? '#fef3c7' : '#dcfce7';
                      const statusLabel = isPastDue ? 'Past Due' : isPaused ? 'Paused' : isCanceled ? 'Canceled' : isCancelingAtEnd ? 'Canceling' : 'Active';
                      const catColors = { hrt: { bg: '#dbeafe', text: '#1e40af' }, weight_loss: { bg: '#fef3c7', text: '#92400e' }, peptide: { bg: '#e0e7ff', text: '#3730a3' } };
                      const cat = catColors[sub.service_category] || { bg: '#f3f4f6', text: '#374151' };

                      return (
                        <tr key={sub.id} style={{ ...styles.tr, background: isPastDue ? '#fef2f2' : 'transparent' }}>
                          <td style={styles.td}>
                            <Link href={`/patients/${sub.patient_id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                              {sub.patient_name || 'Unknown'}
                            </Link>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{sub.patient_email}</div>
                          </td>
                          <td style={styles.td}>{sub.description || '—'}</td>
                          <td style={{ ...styles.td, fontWeight: 700 }}>
                            ${((sub.amount_cents || 0) / 100).toFixed(0)}/{sub.interval || 'mo'}
                          </td>
                          <td style={styles.td}>
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 0, fontSize: 11, fontWeight: 700, background: statusBg, color: statusColor }}>
                              {statusLabel}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {sub.service_category && (
                              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: cat.bg, color: cat.text }}>
                                {sub.service_category}
                              </span>
                            )}
                          </td>
                          <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>
                            {!isCanceled && (
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {isPastDue && (
                                  <button
                                    onClick={() => handleSubAction(sub.stripe_subscription_id, 'retry_payment')}
                                    disabled={!!subActionLoading}
                                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 0, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}
                                  >
                                    Retry
                                  </button>
                                )}
                                {isPaused ? (
                                  <button
                                    onClick={() => handleSubAction(sub.stripe_subscription_id, 'resume')}
                                    disabled={!!subActionLoading}
                                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 0, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}
                                  >
                                    Resume
                                  </button>
                                ) : !isCancelingAtEnd && (
                                  <button
                                    onClick={() => handleSubAction(sub.stripe_subscription_id, 'pause')}
                                    disabled={!!subActionLoading}
                                    style={{ padding: '4px 10px', fontSize: 11, borderRadius: 0, background: '#fff', color: '#f59e0b', border: '1px solid #fcd34d', cursor: 'pointer' }}
                                  >
                                    Pause
                                  </button>
                                )}
                                {isCancelingAtEnd ? (
                                  <button
                                    onClick={() => handleSubAction(sub.stripe_subscription_id, 'undo_cancel')}
                                    disabled={!!subActionLoading}
                                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 0, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}
                                  >
                                    Undo Cancel
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleCancelSub(sub.stripe_subscription_id, false)}
                                    disabled={!!subActionLoading}
                                    style={{ padding: '4px 10px', fontSize: 11, borderRadius: 0, background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer' }}
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* Verify Tab */}
      {tab === 'verify' && (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              type="month"
              value={verifyMonth}
              onChange={e => { setVerifyMonth(e.target.value); setVerifyResult(null); }}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: 14, fontFamily: 'inherit' }}
            />
            <button
              onClick={async () => {
                setVerifyLoading(true);
                setVerifyResult(null);
                try {
                  const res = await fetch(`/api/admin/stripe-verify-amounts?month=${verifyMonth}`);
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);
                  setVerifyResult(data);
                } catch (err) {
                  alert('Error: ' + err.message);
                }
                setVerifyLoading(false);
              }}
              disabled={verifyLoading}
              style={{ padding: '8px 18px', background: '#1e40af', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {verifyLoading ? 'Checking...' : 'Preview'}
            </button>
            {verifyResult && verifyResult.dry_run && (verifyResult.results?.corrected > 0) && (
              <button
                onClick={async () => {
                  if (!confirm(`This will correct ${verifyResult.results.corrected} purchase amount(s) to match Stripe. Continue?`)) return;
                  setVerifyApplying(true);
                  try {
                    const res = await fetch('/api/admin/stripe-verify-amounts', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ month: verifyMonth }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    setVerifyResult(data);
                  } catch (err) {
                    alert('Error: ' + err.message);
                  }
                  setVerifyApplying(false);
                }}
                disabled={verifyApplying}
                style={{ padding: '8px 18px', background: '#16a34a', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {verifyApplying ? 'Applying...' : `Apply ${verifyResult.results.corrected} Correction${verifyResult.results.corrected !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>

          {verifyResult && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Stripe Collected</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#15803d' }}>${verifyResult.summary.stripe_total}</div>
                  <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>{verifyResult.summary.stripe_charges} charges</div>
                </div>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>DB Total (Stripe)</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1d4ed8' }}>${verifyResult.summary.db_stripe_total}</div>
                  <div style={{ fontSize: 12, color: '#1e40af', marginTop: 2 }}>{verifyResult.summary.db_purchases} purchases</div>
                </div>
                <div style={{ background: parseFloat(verifyResult.summary.discrepancy) === 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(verifyResult.summary.discrepancy) === 0 ? '#bbf7d0' : '#fecaca'}`, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: parseFloat(verifyResult.summary.discrepancy) === 0 ? '#166534' : '#991b1b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Discrepancy</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: parseFloat(verifyResult.summary.discrepancy) === 0 ? '#15803d' : '#dc2626' }}>
                    {parseFloat(verifyResult.summary.discrepancy) === 0 ? '$0.00' : `$${verifyResult.summary.discrepancy}`}
                  </div>
                  <div style={{ fontSize: 12, color: parseFloat(verifyResult.summary.discrepancy) === 0 ? '#166534' : '#991b1b', marginTop: 2 }}>
                    {parseFloat(verifyResult.summary.discrepancy) === 0 ? 'Everything matches' : 'DB vs Stripe'}
                  </div>
                </div>
                {parseFloat(verifyResult.summary.db_cash_total) > 0 && (
                  <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Cash / Gift Card</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#a16207' }}>${(parseFloat(verifyResult.summary.db_cash_total) + parseFloat(verifyResult.summary.db_gift_card_total)).toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: '#854d0e', marginTop: 2 }}>Not in Stripe</div>
                  </div>
                )}
              </div>

              {/* Status Row */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', fontSize: 13 }}>
                <span style={{ color: '#16a34a' }}><CheckCircle size={14} style={{ verticalAlign: '-2px' }} /> {verifyResult.results.verified} verified</span>
                {verifyResult.results.corrected > 0 && (
                  <span style={{ color: verifyResult.dry_run ? '#d97706' : '#16a34a' }}>
                    <AlertTriangle size={14} style={{ verticalAlign: '-2px' }} /> {verifyResult.results.corrected} {verifyResult.dry_run ? 'to correct' : 'corrected'}
                  </span>
                )}
                {verifyResult.results.flagged > 0 && (
                  <span style={{ color: '#dc2626' }}><XCircle size={14} style={{ verticalAlign: '-2px' }} /> {verifyResult.results.flagged} need review</span>
                )}
                {verifyResult.results.missing_in_db > 0 && (
                  <span style={{ color: '#6b7280' }}><Clock size={14} style={{ verticalAlign: '-2px' }} /> {verifyResult.results.missing_in_db} in Stripe only</span>
                )}
              </div>

              {/* Corrections Table */}
              {verifyResult.corrected && verifyResult.corrected.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
                    {verifyResult.dry_run ? 'Amounts to Correct' : 'Corrected Amounts'}
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>
                    Single-item charges where DB amount didn&apos;t match what Stripe actually collected.
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={checkoutStyles.th}>Patient</th>
                          <th style={checkoutStyles.th}>Item</th>
                          <th style={checkoutStyles.th}>Date</th>
                          <th style={{ ...checkoutStyles.th, textAlign: 'right' }}>DB Had</th>
                          <th style={{ ...checkoutStyles.th, textAlign: 'right' }}>Stripe Charged</th>
                          <th style={{ ...checkoutStyles.th, textAlign: 'right' }}>Diff</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verifyResult.corrected.map((c, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={checkoutStyles.td}>{c.patient_name}</td>
                            <td style={checkoutStyles.td}>{c.item_name}</td>
                            <td style={checkoutStyles.td}>{c.purchase_date}</td>
                            <td style={{ ...checkoutStyles.td, textAlign: 'right', color: '#dc2626', textDecoration: 'line-through' }}>${c.old_amount.toFixed(2)}</td>
                            <td style={{ ...checkoutStyles.td, textAlign: 'right', fontWeight: 600 }}>${c.new_amount.toFixed(2)}</td>
                            <td style={{ ...checkoutStyles.td, textAlign: 'right', color: parseFloat(c.difference) > 0 ? '#dc2626' : '#16a34a' }}>{parseFloat(c.difference) > 0 ? '+' : ''}${c.difference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Flagged Multi-Item Mismatches */}
              {verifyResult.flagged && verifyResult.flagged.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: '#dc2626' }}>
                    Multi-Item Mismatches — Adjust Amounts ({verifyResult.flagged.length})
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>
                    Edit the amounts so they add up to what Stripe charged, then hit Save.
                  </p>
                  {verifyResult.flagged.map((f, i) => {
                    const piId = f.payment_intent;
                    const edits = flaggedEdits[piId] || {};
                    const editedSum = f.items.reduce((s, item) => {
                      const val = edits[item.purchase_id] !== undefined ? parseFloat(edits[item.purchase_id]) || 0 : item.amount_paid;
                      return s + val;
                    }, 0);
                    const editedDiff = editedSum - f.stripe_amount;
                    const isBalanced = Math.abs(editedDiff) < 0.01;
                    const hasEdits = Object.keys(edits).length > 0;
                    const isSaved = savingFlagged === piId;

                    return (
                      <div key={i} style={{ border: `1px solid ${isBalanced && hasEdits ? '#bbf7d0' : '#fecaca'}`, background: isBalanced && hasEdits ? '#f0fdf4' : '#fef2f2', padding: 14, marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13, flexWrap: 'wrap', gap: 8 }}>
                          <span><strong>Stripe charged:</strong> ${f.stripe_amount.toFixed(2)}</span>
                          <span><strong>Edited total:</strong> ${editedSum.toFixed(2)}</span>
                          <span style={{ color: isBalanced ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                            {isBalanced ? 'Balanced' : `Off by $${editedDiff.toFixed(2)}`}
                          </span>
                          {isBalanced && hasEdits && (
                            <button
                              disabled={isSaved}
                              onClick={async () => {
                                setSavingFlagged(piId);
                                try {
                                  const adjustments = f.items
                                    .filter(item => edits[item.purchase_id] !== undefined)
                                    .map(item => ({ purchase_id: item.purchase_id, amount_paid: parseFloat(edits[item.purchase_id]) }));
                                  const res = await fetch('/api/admin/stripe-verify-amounts', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ adjustments }),
                                  });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.error);
                                  setActionMsg(`Saved ${data.updated} adjustment(s)`);
                                  setTimeout(() => setActionMsg(''), 3000);
                                  // Update the flagged item in-place to show new amounts
                                  setVerifyResult(prev => {
                                    const updated = { ...prev };
                                    updated.flagged = updated.flagged.map(fl => {
                                      if (fl.payment_intent !== piId) return fl;
                                      return {
                                        ...fl,
                                        db_sum: editedSum,
                                        difference: (editedSum - fl.stripe_amount).toFixed(2),
                                        items: fl.items.map(item => ({
                                          ...item,
                                          amount_paid: edits[item.purchase_id] !== undefined ? parseFloat(edits[item.purchase_id]) : item.amount_paid,
                                        })),
                                      };
                                    });
                                    // Move balanced ones out of flagged
                                    updated.flagged = updated.flagged.filter(fl => Math.abs(parseFloat(fl.difference)) > 0.01);
                                    updated.results = { ...updated.results, flagged: updated.flagged.length, verified: (updated.results.verified || 0) + 1 };
                                    return updated;
                                  });
                                  setFlaggedEdits(prev => { const n = { ...prev }; delete n[piId]; return n; });
                                } catch (err) {
                                  alert('Error saving: ' + err.message);
                                }
                                setSavingFlagged(null);
                              }}
                              style={{ padding: '5px 14px', background: '#16a34a', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              {isSaved ? 'Saving...' : 'Save'}
                            </button>
                          )}
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <tbody>
                            {f.items.map((item, j) => {
                              const editVal = edits[item.purchase_id];
                              return (
                                <tr key={j} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                  <td style={{ padding: '6px 8px', width: '25%' }}>{item.patient_name}</td>
                                  <td style={{ padding: '6px 8px' }}>{item.item_name}</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', width: 120 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                      {editVal !== undefined && (
                                        <span style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>${item.amount_paid.toFixed(2)}</span>
                                      )}
                                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <span style={{ position: 'absolute', left: 8, color: '#64748b', fontSize: 13, pointerEvents: 'none' }}>$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={editVal !== undefined ? editVal : item.amount_paid.toFixed(2)}
                                          onChange={e => {
                                            setFlaggedEdits(prev => ({
                                              ...prev,
                                              [piId]: { ...(prev[piId] || {}), [item.purchase_id]: e.target.value },
                                            }));
                                          }}
                                          style={{ width: 90, padding: '4px 8px 4px 20px', border: '1px solid #d1d5db', fontSize: 13, textAlign: 'right', fontFamily: 'inherit', background: editVal !== undefined ? '#fefce8' : '#fff' }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Missing in DB */}
              {verifyResult.missing_in_db && verifyResult.missing_in_db.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: '#6b7280' }}>
                    Stripe Charges Not in DB ({verifyResult.missing_in_db.length})
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>
                    Stripe collected money but no purchase was recorded. Could be from the website checkout, another system, or a recording failure.
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={checkoutStyles.th}>Date</th>
                          <th style={checkoutStyles.th}>Amount</th>
                          <th style={checkoutStyles.th}>Description</th>
                          <th style={checkoutStyles.th}>PI ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verifyResult.missing_in_db.map((m, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={checkoutStyles.td}>{m.stripe_date}</td>
                            <td style={checkoutStyles.td}>${m.stripe_amount.toFixed(2)}</td>
                            <td style={checkoutStyles.td}>{m.description || '—'}</td>
                            <td style={{ ...checkoutStyles.td, fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{m.payment_intent?.slice(-8)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Orphaned Purchases */}
              {verifyResult.orphaned_purchases && verifyResult.orphaned_purchases.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: '#d97706' }}>
                    DB Purchases with Invalid Stripe ID ({verifyResult.orphaned_purchases.length})
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>
                    These purchases reference a PaymentIntent that doesn&apos;t exist in Stripe.
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={checkoutStyles.th}>Patient</th>
                          <th style={checkoutStyles.th}>Item</th>
                          <th style={checkoutStyles.th}>Date</th>
                          <th style={{ ...checkoutStyles.th, textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verifyResult.orphaned_purchases.map((o, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={checkoutStyles.td}>{o.patient_name}</td>
                            <td style={checkoutStyles.td}>{o.item_name}</td>
                            <td style={checkoutStyles.td}>{o.purchase_date}</td>
                            <td style={{ ...checkoutStyles.td, textAlign: 'right' }}>${o.amount_paid.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* All good message */}
              {verifyResult.results.corrected === 0 && verifyResult.results.flagged === 0 && verifyResult.results.missing_in_db === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: '#16a34a', fontSize: 15, fontWeight: 600 }}>
                  <CheckCircle size={24} style={{ verticalAlign: '-6px', marginRight: 8 }} />
                  All {verifyResult.results.verified} Stripe purchases match. No discrepancies found.
                </div>
              )}
            </div>
          )}

          {!verifyResult && !verifyLoading && (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              Select a month and click Preview to compare your DB against Stripe.
            </div>
          )}
        </div>
      )}

      {/* New Subscription Modal */}
      {showNewSubModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 0, width: 500, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 12px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>New Subscription</h3>
              <button onClick={() => { setShowNewSubModal(false); setNewSubPatient(null); setNewSubPatientCards([]); }} style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer', padding: '4px 8px', borderRadius: 0 }}>✕</button>
            </div>
            <div style={{ padding: '16px 24px 24px' }}>

            {/* Patient search */}
            {!newSubPatient ? (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Patient</label>
                <input
                  type="text"
                  placeholder="Search patient by name or email..."
                  value={newSubPatientSearch}
                  onChange={e => searchNewSubPatients(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
                  autoFocus
                />
                {newSubPatientResults.length > 0 && (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 0, marginTop: 4, maxHeight: 200, overflow: 'auto' }}>
                    {newSubPatientResults.map(p => (
                      <div
                        key={p.id}
                        onClick={() => selectNewSubPatient(p)}
                        style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}
                        onMouseOver={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <strong>{p.first_name} {p.last_name}</strong>
                        <span style={{ color: '#94a3b8', marginLeft: 8, fontSize: 12 }}>{p.email}</span>
                        {!p.stripe_customer_id && <span style={{ color: '#f59e0b', marginLeft: 8, fontSize: 11 }}>No Stripe ID</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 0, border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{newSubPatient.first_name} {newSubPatient.last_name}</strong>
                  <span style={{ color: '#64748b', marginLeft: 8, fontSize: 12 }}>{newSubPatient.email}</span>
                  {newSubPatientCards.length > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: '#16a34a' }}>
                      {newSubPatientCards[0].brand.toUpperCase()} ····{newSubPatientCards[0].last4}
                    </span>
                  )}
                </div>
                <button onClick={() => { setNewSubPatient(null); setNewSubPatientCards([]); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>Change</button>
              </div>
            )}

            {newSubPatientCards.length === 0 && newSubPatient && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 0, border: '1px solid #fecaca', marginBottom: 12, fontSize: 13, color: '#991b1b' }}>
                No card on file. Add a card on the patient&apos;s profile first.
              </div>
            )}

            {/* Plan dropdown */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Subscription Plan</label>
              <select
                value=""
                onChange={e => {
                  const plan = subPlans.find(p => p.id === e.target.value);
                  if (plan) {
                    setNewSubForm({
                      amount: (plan.price / 100).toString(),
                      interval: plan.interval || 'month',
                      description: plan.name,
                      service_category: plan.category || 'other',
                    });
                  }
                }}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13, boxSizing: 'border-box' }}
              >
                <option value="">{loadingSubPlans ? 'Loading plans...' : '-- Select a plan --'}</option>
                {subPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} — ${(plan.price / 100).toFixed(0)}/{plan.interval === 'year' ? 'yr' : plan.interval === 'week' ? 'wk' : 'mo'}
                  </option>
                ))}
              </select>
            </div>

            {/* Editable fields (auto-filled from plan) */}
            {newSubForm.description && (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Amount ($)</label>
                    <input
                      type="number" step="0.01" min="0" placeholder="250"
                      value={newSubForm.amount}
                      onChange={e => setNewSubForm(f => ({ ...f, amount: e.target.value }))}
                      style={{ width: 100, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Interval</label>
                    <select value={newSubForm.interval} onChange={e => setNewSubForm(f => ({ ...f, interval: e.target.value }))}
                      style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13 }}>
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                      <option value="week">Weekly</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Description</label>
                  <input
                    type="text" placeholder="e.g. Male HRT Membership"
                    value={newSubForm.description}
                    onChange={e => setNewSubForm(f => ({ ...f, description: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowNewSubModal(false); setNewSubPatient(null); setNewSubPatientCards([]); setNewSubForm({ amount: '', interval: 'month', description: '', service_category: 'hrt' }); }}
                style={{ padding: '8px 16px', borderRadius: 0, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#475569', fontWeight: 500, fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewSub}
                disabled={creatingSub || !newSubPatient || newSubPatientCards.length === 0 || !newSubForm.description}
                style={{
                  padding: '8px 20px', borderRadius: 0, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  background: (!newSubPatient || newSubPatientCards.length === 0 || !newSubForm.description) ? '#e2e8f0' : '#16a34a', color: '#fff',
                  opacity: (creatingSub || !newSubPatient || newSubPatientCards.length === 0 || !newSubForm.description) ? 0.6 : 1,
                }}
              >
                {creatingSub ? 'Creating...' : 'Start Subscription'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && editForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 0, width: 560, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 12px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Edit Invoice</h3>
              <button onClick={() => { setEditingInvoice(null); setEditForm(null); }} style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer', padding: '4px 8px', borderRadius: 0 }}>✕</button>
            </div>
            <div style={{ padding: '16px 24px 24px' }}>
              {/* Patient info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Patient Name</label>
                  <input
                    type="text"
                    value={editForm.patient_name}
                    onChange={e => setEditForm(f => ({ ...f, patient_name: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Email</label>
                  <input
                    type="email"
                    value={editForm.patient_email}
                    onChange={e => setEditForm(f => ({ ...f, patient_email: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Line items */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Line Items</label>
                {editForm.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => {
                        const items = [...editForm.items];
                        items[idx] = { ...items[idx], name: e.target.value };
                        setEditForm(f => ({ ...f, items }));
                      }}
                      style={{ flex: 1, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13 }}
                      placeholder="Item name"
                    />
                    <input
                      type="number"
                      value={(item.price_cents / 100).toFixed(2)}
                      onChange={e => {
                        const items = [...editForm.items];
                        items[idx] = { ...items[idx], price_cents: Math.round(parseFloat(e.target.value || 0) * 100) };
                        setEditForm(f => ({ ...f, items }));
                      }}
                      style={{ width: 90, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13 }}
                      placeholder="Price"
                      step="0.01"
                      min="0"
                    />
                    <input
                      type="number"
                      value={item.quantity || 1}
                      onChange={e => {
                        const items = [...editForm.items];
                        items[idx] = { ...items[idx], quantity: parseInt(e.target.value || 1) };
                        setEditForm(f => ({ ...f, items }));
                      }}
                      style={{ width: 50, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13, textAlign: 'center' }}
                      min="1"
                    />
                    <button
                      onClick={() => {
                        const items = editForm.items.filter((_, i) => i !== idx);
                        setEditForm(f => ({ ...f, items }));
                      }}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setEditForm(f => ({ ...f, items: [...f.items, { name: '', price_cents: 0, quantity: 1, category: null }] }))}
                  style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 0' }}
                >
                  + Add item
                </button>
              </div>

              {/* Discount */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Discount ($)</label>
                  <input
                    type="number"
                    value={(editForm.discount_cents / 100).toFixed(2)}
                    onChange={e => setEditForm(f => ({ ...f, discount_cents: Math.round(parseFloat(e.target.value || 0) * 100) }))}
                    style={{ width: 100, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13 }}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Discount Description</label>
                  <input
                    type="text"
                    value={editForm.discount_description}
                    onChange={e => setEditForm(f => ({ ...f, discount_description: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13, boxSizing: 'border-box' }}
                    placeholder="e.g. 20% off"
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Total preview */}
              {(() => {
                const subtotal = editForm.items.reduce((s, i) => s + (i.price_cents * (i.quantity || 1)), 0);
                const total = Math.max(subtotal - (editForm.discount_cents || 0), 0);
                return (
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 0, marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
                    <span>Total</span>
                    <span>{formatCents(total)}</span>
                  </div>
                );
              })()}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setEditingInvoice(null); setEditForm(null); }}
                  style={{ padding: '8px 16px', borderRadius: 0, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#475569', fontWeight: 500, fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit || !editForm.patient_name || editForm.items.length === 0}
                  style={{
                    padding: '8px 20px', borderRadius: 0, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    background: savingEdit ? '#e2e8f0' : '#2563eb', color: '#fff',
                    opacity: savingEdit ? 0.6 : 1,
                  }}
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charge Card on File Modal */}
      {chargeCardInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 0, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 12px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Charge Card on File</h3>
              <button onClick={() => setChargeCardInvoice(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
            </div>
            <div style={{ padding: '16px 24px 24px' }}>
              <div style={{ marginBottom: 16, fontSize: 13, color: '#475569' }}>
                <strong>{chargeCardInvoice.patient_name}</strong> — {formatCents(chargeCardInvoice.total_cents)}
              </div>

              {chargeCardLoading ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading saved cards...</div>
              ) : chargeCardCards.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: '#dc2626', fontSize: 13 }}>
                  No saved cards on file for this patient.
                  <div style={{ marginTop: 8, color: '#64748b', fontSize: 12 }}>
                    The patient needs to complete a payment first, or you can use POS to save a card.
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Select a card to charge:</div>
                  {chargeCardCards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => handleChargeCard(card.id)}
                      disabled={chargingCard}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                        padding: '12px 16px',
                        marginBottom: 8,
                        border: '1px solid #e2e8f0',
                        borderRadius: 0,
                        background: chargingCard ? '#f8fafc' : '#fff',
                        cursor: chargingCard ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        color: '#1e293b',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!chargingCard) e.target.style.background = '#f0f9ff'; }}
                      onMouseLeave={e => { if (!chargingCard) e.target.style.background = '#fff'; }}
                    >
                      <CreditCard size={18} style={{ color: '#64748b', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{card.brand}</span>
                      <span>•••• {card.last4}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{card.exp_month}/{card.exp_year}</span>
                    </button>
                  ))}
                  {chargingCard && (
                    <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 13, color: '#2563eb', fontWeight: 500 }}>
                      Processing charge...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      <InvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onInvoiceCreated={handleInvoiceCreated}
      />
    </AdminLayout>
  );
}

import React from 'react';

// ================================================================
// CHECKOUT TAB — Recent checkouts + quick patient search
// ================================================================
function CheckoutTab({ onStartCheckout }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentCheckouts, setRecentCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef(null);

  useEffect(() => {
    loadRecentCheckouts();
  }, []);

  useEffect(() => {
    if (search.length < 2) { setResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        setResults(data.patients || []);
        setShowDropdown(true);
      } catch (err) { console.error(err); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function loadRecentCheckouts() {
    setLoading(true);
    try {
      const res = await fetch('/api/service-log?limit=50');
      const data = await res.json();
      setRecentCheckouts((data.logs || []).slice(0, 30));
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const catLabels = {
    testosterone: 'HRT', weight_loss: 'Weight Loss', peptide: 'Peptide',
    iv_therapy: 'IV', hbot: 'HBOT', red_light: 'Red Light',
    vitamin: 'Vitamin', supplement: 'Supplement',
  };
  const catColors = {
    testosterone: '#7c3aed', weight_loss: '#ea580c', peptide: '#0891b2',
    iv_therapy: '#2563eb', hbot: '#059669', red_light: '#dc2626',
    vitamin: '#ca8a04', supplement: '#64748b',
  };

  return (
    <div>
      {/* Quick patient search */}
      <div style={{ ...checkoutStyles.section, marginBottom: '24px' }}>
        <h3 style={checkoutStyles.sectionTitle}>New Checkout</h3>
        <div style={{ position: 'relative' }}>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search patient by name to start checkout..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            style={{
              width: '100%', padding: '14px 16px', border: '1px solid #ddd',
              fontSize: '15px', boxSizing: 'border-box',
            }}
          />
          {searching && (
            <span style={{ position: 'absolute', right: '14px', top: '15px', color: '#999', fontSize: '13px' }}>
              Searching...
            </span>
          )}
          {showDropdown && results.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: '#fff', border: '1px solid #ddd', borderTop: 'none',
              maxHeight: '240px', overflowY: 'auto',
            }}>
              {results.map(p => (
                <div
                  key={p.id}
                  style={{
                    padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                  }}
                  onMouseDown={() => {
                    setSearch('');
                    setShowDropdown(false);
                    onStartCheckout(p);
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  {p.email && <div style={{ fontSize: '12px', color: '#888' }}>{p.email}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onStartCheckout(null)}
          style={{
            marginTop: '10px', padding: '10px 20px', background: '#fff',
            border: '1px solid #ddd', fontSize: '14px', cursor: 'pointer',
          }}
        >
          Open Checkout (search in modal)
        </button>
      </div>

      {/* Recent checkouts */}
      <div style={checkoutStyles.section}>
        <h3 style={checkoutStyles.sectionTitle}>Recent Activity</h3>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Loading...</div>
          ) : recentCheckouts.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No recent activity</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={checkoutStyles.th}>Patient</th>
                  <th style={checkoutStyles.th}>Service</th>
                  <th style={checkoutStyles.th}>Medication</th>
                  <th style={checkoutStyles.th}>Staff</th>
                  <th style={checkoutStyles.th}>Type</th>
                  <th style={checkoutStyles.th}>Date</th>
                  <th style={checkoutStyles.th}></th>
                </tr>
              </thead>
              <tbody>
                {recentCheckouts.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={checkoutStyles.td}>
                      <span style={{ fontWeight: 500 }}>{log.patient_name || '—'}</span>
                    </td>
                    <td style={checkoutStyles.td}>
                      <span style={{
                        display: 'inline-block', padding: '3px 8px',
                        fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                        color: '#fff', background: catColors[log.category] || '#64748b',
                      }}>
                        {catLabels[log.category] || log.category}
                      </span>
                    </td>
                    <td style={checkoutStyles.td}>
                      <span style={{ fontSize: '13px' }}>{log.medication || '—'}</span>
                      {log.dosage && <span style={{ fontSize: '12px', color: '#888', marginLeft: '4px' }}>({log.dosage})</span>}
                    </td>
                    <td style={checkoutStyles.td}>
                      <span style={{ fontSize: '13px', color: '#444' }}>{log.administered_by || '—'}</span>
                      {log.verified_by && <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>✓ {log.verified_by}</span>}
                    </td>
                    <td style={checkoutStyles.td}>
                      <span style={{ fontSize: '13px', color: '#666' }}>
                        {log.entry_type === 'injection' ? 'Range Injection' : log.entry_type === 'pickup' ? 'Pickup' : log.entry_type === 'session' ? 'Session' : log.entry_type === 'weight_check' ? 'Weigh-in' : log.entry_type || '—'}
                      </span>
                    </td>
                    <td style={checkoutStyles.td}>
                      <span style={{ fontSize: '13px', color: '#888' }}>
                        {log.entry_date ? new Date(log.entry_date + 'T12:00:00').toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td style={checkoutStyles.td}>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete this checkout entry for ${log.patient_name}?\n\n${log.medication || log.category} — ${log.entry_date}\n\nThis cannot be undone.`)) return;
                          try {
                            const res = await fetch(`/api/service-log/${log.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setRecentCheckouts(prev => prev.filter(l => l.id !== log.id));
                            } else {
                              alert('Failed to delete entry');
                            }
                          } catch (err) { alert('Error: ' + err.message); }
                        }}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px', padding: '2px 6px' }}
                        title="Delete this checkout entry"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const checkoutStyles = {
  section: { marginBottom: '20px' },
  sectionTitle: { margin: '0 0 12px', fontSize: '16px', fontWeight: 600 },
  th: {
    padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666',
    borderBottom: '1px solid #e5e5e5', background: '#fafafa',
  },
  td: {
    padding: '10px 16px', fontSize: '14px', verticalAlign: 'middle',
  },
};

const styles = {
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  tabBar: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '6px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: 0,
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: '#1e40af',
    color: '#fff',
    border: '1px solid #1e40af',
  },
  createBtn: {
    padding: '8px 18px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 0,
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  statsRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  stat: {
    flex: 1,
    background: '#fff',
    borderRadius: 0,
    border: '1px solid #e2e8f0',
    padding: '14px 16px',
    textAlign: 'center',
    minWidth: '100px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '4px',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  filters: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  searchInput: {
    padding: '8px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: 0,
    fontSize: '13px',
    width: '260px',
    outline: 'none',
    fontFamily: 'inherit',
    color: '#1e293b',
  },
  filterPills: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  filterPill: {
    padding: '5px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 0,
    background: '#fff',
    fontSize: '11px',
    cursor: 'pointer',
    color: '#475569',
    fontWeight: '600',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  filterPillActive: {
    background: '#1e40af',
    color: '#fff',
    border: '1px solid #1e40af',
  },
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    background: '#0f172a',
    color: '#fff',
    borderRadius: 0,
    fontSize: '13px',
    fontWeight: '500',
    zIndex: 1100,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#94a3b8',
    fontSize: '13px',
  },
  card: {
    background: '#fff',
    borderRadius: 0,
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '13px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '10px 16px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#94a3b8',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    verticalAlign: 'top',
    color: '#1e293b',
  },
  badge: {
    padding: '3px 10px',
    borderRadius: 0,
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actions: {
    display: 'flex',
    gap: '4px',
  },
  actionBtn: {
    padding: '4px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: 0,
    background: '#fff',
    fontSize: '11px',
    cursor: 'pointer',
    color: '#475569',
    fontWeight: '600',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  textBtn: {
    padding: '4px 10px',
    border: '1px solid #bbf7d0',
    borderRadius: 0,
    background: '#f0fdf4',
    fontSize: '11px',
    cursor: 'pointer',
    color: '#16a34a',
    fontWeight: '600',
    fontFamily: 'inherit',
  },
  payBtn: {
    padding: '4px 10px',
    border: '1px solid #bbf7d0',
    borderRadius: 0,
    background: '#f0fdf4',
    fontSize: '11px',
    cursor: 'pointer',
    color: '#16a34a',
    fontWeight: '600',
    fontFamily: 'inherit',
  },
  payDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 0,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 20,
    marginTop: '4px',
    minWidth: '140px',
    overflow: 'hidden',
  },
  payDropdownItem: {
    padding: '8px 14px',
    fontSize: '12px',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f5f9',
    color: '#1e293b',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  editBtn: {
    padding: '4px 10px',
    border: '1px solid #bfdbfe',
    borderRadius: 0,
    background: '#eff6ff',
    fontSize: '11px',
    cursor: 'pointer',
    color: '#2563eb',
    fontWeight: '600',
    fontFamily: 'inherit',
  },
  voidBtn: {
    padding: '4px 10px',
    border: '1px solid #fecaca',
    borderRadius: 0,
    background: '#fff',
    fontSize: '11px',
    cursor: 'pointer',
    color: '#dc2626',
    fontWeight: '600',
    fontFamily: 'inherit',
  },
  expandedRow: {
    padding: '0 16px 16px',
    background: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    padding: '16px',
  },
  detailSection: {},
  detailTitle: {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '4px 0',
    color: '#1e293b',
  },
  detailMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    padding: '3px 0',
    color: '#1e293b',
  },
  metaLabel: {
    color: '#94a3b8',
    fontWeight: '600',
    minWidth: '70px',
  },
  patientLink: {
    fontSize: '13px',
    color: '#2563eb',
    fontWeight: '600',
    textDecoration: 'none',
  },
  printReceiptBtn: {
    display: 'inline-block',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  link: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '10px 20px',
    background: '#1e40af',
    color: '#fff',
    borderRadius: 0,
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600',
  },
  // POS styles
  posSection: {
    marginBottom: '24px',
  },
  posSectionTitle: {
    fontSize: '15px',
    fontWeight: '700',
    margin: '0 0 12px 0',
    color: '#0f172a',
  },
  posSearchWrap: {
    position: 'relative',
    maxWidth: '400px',
    marginBottom: '16px',
  },
  posSearchInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: 0,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#1e293b',
  },
  posDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 0,
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    zIndex: 10,
    maxHeight: '240px',
    overflowY: 'auto',
    marginTop: '4px',
  },
  posDropdownItem: {
    padding: '10px 14px',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '13px',
    color: '#1e293b',
    transition: 'background 0.1s',
  },
  posChargeBtn: {
    padding: '10px 24px',
    borderRadius: 0,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  // Products & Services styles
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '12px',
  },
  productCategory: {
    background: '#fff',
    borderRadius: 0,
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  productCategoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 18px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  productCategoryName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0f172a',
  },
  productCategoryCount: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  productList: {
    padding: '4px 0',
  },
  productRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 18px',
    borderBottom: '1px solid #f1f5f9',
  },
  productName: {
    fontSize: '13px',
    color: '#1e293b',
  },
  productPriceWrap: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
    flexShrink: 0,
  },
  productPrice: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0f172a',
  },
  productRecurring: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '400',
  },

  // View toggle (List / Calendar)
  viewToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    border: 'none',
    background: '#fff',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#475569',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  viewToggleActive: {
    background: '#1e40af',
    color: '#fff',
  },

  // Day detail modal
  dayModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '60px',
    overflowY: 'auto',
  },
  dayModal: {
    background: '#fff',
    borderRadius: 0,
    width: '90%',
    maxWidth: '900px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  dayModalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'sticky',
    top: 0,
    background: '#fff',
    borderRadius: 0,
    zIndex: 1,
  },
  dayModalClose: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: '1px solid #e2e8f0',
    borderRadius: 0,
    background: '#fff',
    cursor: 'pointer',
    color: '#64748b',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
};
