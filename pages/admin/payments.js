// /pages/admin/payments.js
// Payments page - POS and Invoices with create, send, void actions
// Range Medical System V2

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import InvoiceModal from '../../components/InvoiceModal';
import POSChargeModal from '../../components/POSChargeModal';
import { loadStripe } from '@stripe/stripe-js';

const PurchasesTab = dynamic(() => import('./purchases').then(mod => ({ default: mod.PurchasesContent })), {
  ssr: false,
  loading: () => <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading purchases...</div>,
});

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function PaymentsPage() {
  const [tab, setTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [voidingId, setVoidingId] = useState(null);
  const [sendingId, setSendingId] = useState(null);
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
  const [newSubPatientCards, setNewSubPatientCards] = useState([]);
  const [expandedGiftCard, setExpandedGiftCard] = useState(null);
  const [giftCardRedemptions, setGiftCardRedemptions] = useState({});
  const [voidingGiftCardId, setVoidingGiftCardId] = useState(null);

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
  }, [tab]);

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

  return (
    <AdminLayout title="Payments">
      {/* Action message toast */}
      {actionMsg && (
        <div style={styles.toast}>{actionMsg}</div>
      )}

      {/* Tab bar + Create button */}
      <div style={styles.topBar}>
        <div style={styles.tabBar}>
          {['invoices', 'pos', 'subscriptions', 'purchases', 'products', 'gift_cards'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.tab,
                ...(tab === t ? styles.tabActive : {})
              }}
            >
              {t === 'invoices' ? 'Invoices' : t === 'pos' ? 'POS Checkout' : t === 'subscriptions' ? 'Subscriptions' : t === 'purchases' ? 'Purchases' : t === 'products' ? 'Products & Services' : 'Gift Cards'}
            </button>
          ))}
        </div>
        {tab === 'invoices' && (
          <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
            + Create Invoice
          </button>
        )}
      </div>

      {tab === 'invoices' && (
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
                      <th style={styles.th}>Description</th>
                      <th style={styles.th}>Patient</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPurchases.map(p => (
                      <tr key={p.id} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={{ fontWeight: '500' }}>{p.description || 'Charge'}</span>
                        </td>
                        <td style={styles.td}>
                          {p.patient_name || '—'}
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: '500', color: '#16a34a' }}>
                            ${p.amount?.toFixed(2)}
                          </span>
                          {p.discount_type && (
                            <span style={{ fontSize: '11px', color: '#888', marginLeft: '6px' }}>
                              ({p.discount_type === 'percent' ? `${p.discount_amount}% off` : `$${p.discount_amount} off`})
                            </span>
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
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer' }}
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
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: statusBg, color: statusColor }}>
                              {statusLabel}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {sub.service_category && (
                              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: cat.bg, color: cat.text }}>
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
                                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}
                                  >
                                    Retry
                                  </button>
                                )}
                                {isPaused ? (
                                  <button
                                    onClick={() => handleSubAction(sub.stripe_subscription_id, 'resume')}
                                    disabled={!!subActionLoading}
                                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}
                                  >
                                    Resume
                                  </button>
                                ) : !isCancelingAtEnd && (
                                  <button
                                    onClick={() => handleSubAction(sub.stripe_subscription_id, 'pause')}
                                    disabled={!!subActionLoading}
                                    style={{ padding: '4px 10px', fontSize: 11, borderRadius: 4, background: '#fff', color: '#f59e0b', border: '1px solid #fcd34d', cursor: 'pointer' }}
                                  >
                                    Pause
                                  </button>
                                )}
                                {isCancelingAtEnd ? (
                                  <button
                                    onClick={() => handleSubAction(sub.stripe_subscription_id, 'undo_cancel')}
                                    disabled={!!subActionLoading}
                                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}
                                  >
                                    Undo Cancel
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleCancelSub(sub.stripe_subscription_id, false)}
                                    disabled={!!subActionLoading}
                                    style={{ padding: '4px 10px', fontSize: 11, borderRadius: 4, background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer' }}
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

      {/* New Subscription Modal */}
      {showNewSubModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 500, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 12px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>New Subscription</h3>
              <button onClick={() => { setShowNewSubModal(false); setNewSubPatient(null); setNewSubPatientCards([]); }} style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>✕</button>
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
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  autoFocus
                />
                {newSubPatientResults.length > 0 && (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, maxHeight: 200, overflow: 'auto' }}>
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
              <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', marginBottom: 12, fontSize: 13, color: '#991b1b' }}>
                No card on file. Add a card on the patient&apos;s profile first.
              </div>
            )}

            {/* Subscription details */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Amount ($)</label>
                <input
                  type="number" step="0.01" min="0" placeholder="250"
                  value={newSubForm.amount}
                  onChange={e => setNewSubForm(f => ({ ...f, amount: e.target.value }))}
                  style={{ width: 100, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Interval</label>
                <select value={newSubForm.interval} onChange={e => setNewSubForm(f => ({ ...f, interval: e.target.value }))}
                  style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                  <option value="week">Weekly</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Category</label>
                <select value={newSubForm.service_category} onChange={e => setNewSubForm(f => ({ ...f, service_category: e.target.value }))}
                  style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
                  <option value="hrt">HRT</option>
                  <option value="weight_loss">Weight Loss</option>
                  <option value="peptide">Peptide</option>
                  <option value="iv">IV</option>
                  <option value="hbot">HBOT</option>
                  <option value="rlt">RLT</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Description</label>
              <input
                type="text" placeholder="e.g. Male HRT Membership"
                value={newSubForm.description}
                onChange={e => setNewSubForm(f => ({ ...f, description: e.target.value }))}
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowNewSubModal(false); setNewSubPatient(null); setNewSubPatientCards([]); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#475569', fontWeight: 500, fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewSub}
                disabled={creatingSub || !newSubPatient || newSubPatientCards.length === 0}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  background: (!newSubPatient || newSubPatientCards.length === 0) ? '#e2e8f0' : '#16a34a', color: '#fff',
                  opacity: (creatingSub || !newSubPatient || newSubPatientCards.length === 0) ? 0.6 : 1,
                }}
              >
                {creatingSub ? 'Creating...' : 'Start Subscription'}
              </button>
            </div>
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
    borderRadius: '20px',
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
    borderRadius: '8px',
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
    borderRadius: '12px',
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
    borderRadius: '8px',
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
    borderRadius: '20px',
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
    borderRadius: '10px',
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
    borderRadius: '12px',
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
    borderRadius: '12px',
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
    borderRadius: '6px',
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
    borderRadius: '6px',
    background: '#f0fdf4',
    fontSize: '11px',
    cursor: 'pointer',
    color: '#16a34a',
    fontWeight: '600',
    fontFamily: 'inherit',
  },
  voidBtn: {
    padding: '4px 10px',
    border: '1px solid #fecaca',
    borderRadius: '6px',
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
  link: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '10px 20px',
    background: '#1e40af',
    color: '#fff',
    borderRadius: '8px',
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
    borderRadius: '10px',
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
    borderRadius: '10px',
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
    borderRadius: '10px',
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
    borderRadius: '12px',
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
};
