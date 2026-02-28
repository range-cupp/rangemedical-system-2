// /pages/admin/payments.js
// Payments page - POS and Invoices with create, send, void actions
// Range Medical System V2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import InvoiceModal from '../../components/InvoiceModal';

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

  useEffect(() => {
    fetchInvoices();
  }, []);

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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setActionMsg(`Invoice resent via ${via}`);
      setTimeout(() => setActionMsg(''), 3000);
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
          {['invoices', 'pos'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.tab,
                ...(tab === t ? styles.tabActive : {})
              }}
            >
              {t === 'invoices' ? 'Invoices' : 'POS Checkout'}
            </button>
          ))}
        </div>
        {tab === 'invoices' && (
          <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
            + Create Invoice
          </button>
        )}
      </div>

      {tab === 'invoices' ? (
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
                                <button
                                  onClick={() => handleResend(inv, 'email')}
                                  disabled={sendingId === inv.id}
                                  style={styles.actionBtn}
                                  title="Send via email"
                                >
                                  {sendingId === inv.id ? '...' : 'Send'}
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
      ) : (
        <div style={styles.card}>
          <div style={styles.empty}>
            <p>POS Checkout is available from any patient profile.</p>
            <Link href="/admin/patients" style={styles.link}>
              Go to Patients
            </Link>
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
    gap: '8px',
  },
  tab: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '400',
    color: '#666'
  },
  tabActive: {
    background: '#000',
    color: '#fff',
    border: '1px solid #000',
    fontWeight: '500'
  },
  createBtn: {
    padding: '10px 20px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  stat: {
    flex: 1,
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    padding: '16px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '11px',
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '500',
    letterSpacing: '0.3px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  searchInput: {
    padding: '8px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    width: '280px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  filterPills: {
    display: 'flex',
    gap: '6px',
  },
  filterPill: {
    padding: '6px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '16px',
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666',
    fontWeight: '400',
  },
  filterPillActive: {
    background: '#111',
    color: '#fff',
    border: '1px solid #111',
    fontWeight: '500',
  },
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    background: '#111',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    zIndex: 1100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#666'
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e5e5'
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
    fontSize: '14px',
    verticalAlign: 'top',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  actions: {
    display: 'flex',
    gap: '6px',
  },
  actionBtn: {
    padding: '4px 10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#333',
    fontWeight: '500',
  },
  voidBtn: {
    padding: '4px 10px',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#dc2626',
    fontWeight: '500',
  },
  expandedRow: {
    padding: '0 16px 16px',
    background: '#fafafa',
    borderBottom: '2px solid #e5e5e5',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    padding: '16px',
  },
  detailSection: {},
  detailTitle: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#999',
    marginBottom: '8px',
    letterSpacing: '0.3px',
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '4px 0',
  },
  detailMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    padding: '3px 0',
  },
  metaLabel: {
    color: '#999',
    fontWeight: '500',
    minWidth: '70px',
  },
  patientLink: {
    fontSize: '13px',
    color: '#000',
    fontWeight: '500',
    textDecoration: 'none',
  },
  link: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '10px 20px',
    background: '#000',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500'
  }
};
