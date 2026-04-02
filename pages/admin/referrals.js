import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';

const STAFF_OPTIONS = [
  { value: 'damon@range-medical.com', label: 'Damon Durante' },
  { value: 'cupp@range-medical.com', label: 'Chris Cupp' },
  { value: 'damien@range-medical.com', label: 'Dr. Damien Burgess' },
  { value: 'lily@range-medical.com', label: 'Lily Diaz' },
  { value: 'evan@range-medical.com', label: 'Evan' },
];

const INTEREST_LABELS = {
  peptides_recovery: 'Peptides & Recovery',
  hormone_optimization: 'Hormone Optimization',
  weight_loss: 'Weight Loss',
  energy_performance: 'Energy & Performance',
  red_light: 'Red Light Therapy',
  hyperbaric_oxygen: 'Hyperbaric Oxygen',
  not_sure: 'Not sure yet',
};

export default function ReferralsAdmin() {
  const [partners, setPartners] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subView, setSubView] = useState('partners');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ slug: '', name: '', partner_type: '', assigned_to: '', headline: '', subheadline: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [leadPartnerFilter, setLeadPartnerFilter] = useState('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [expandedLead, setExpandedLead] = useState(null);
  const [copied, setCopied] = useState(null);
  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [invitePatients, setInvitePatients] = useState([]);
  const [inviteSelected, setInviteSelected] = useState(null);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/referral-partners');
      const data = await res.json();
      setPartners(data.partners || []);
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Load referral data error:', err);
    }
    setLoading(false);
  }

  // Patient search for invite modal
  useEffect(() => {
    if (!inviteSearch || inviteSearch.length < 2) {
      setInvitePatients([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/patients?search=${encodeURIComponent(inviteSearch)}`);
        const data = await res.json();
        setInvitePatients(Array.isArray(data) ? data.slice(0, 8) : []);
      } catch (err) {
        console.error('Patient search error:', err);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [inviteSearch]);

  async function sendInviteText() {
    if (!inviteSelected?.phone) return;
    setInviteSending(true);
    try {
      const firstName = inviteSelected.first_name || inviteSelected.name?.split(' ')[0] || '';
      const message = `Hey ${firstName} — we set up a way for you to refer people to Range Medical. Tap the link below, enter your info, and you'll get your own personal referral link you can text to anyone:\n\nhttps://range-medical.com/refer/join\n\nTakes about 15 seconds. After that, we'll text you your link so you always have it.`;

      await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: inviteSelected.id,
          to: inviteSelected.phone,
          message,
          message_type: 'referral_invite',
        }),
      });
      setInviteSent(true);
    } catch (err) {
      console.error('Send invite error:', err);
      alert('Failed to send. Try again.');
    }
    setInviteSending(false);
  }

  function closeInviteModal() {
    setShowInviteModal(false);
    setInviteSearch('');
    setInvitePatients([]);
    setInviteSelected(null);
    setInviteSent(false);
  }

  async function toggleActive(partner) {
    try {
      await fetch('/api/admin/referral-partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partner.id, active: !partner.active }),
      });
      loadData();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  }

  async function updateAssignedTo(partner, assigned_to) {
    try {
      await fetch('/api/admin/referral-partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partner.id, assigned_to }),
      });
      setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, assigned_to } : p));
    } catch (err) {
      console.error('Update assigned_to error:', err);
    }
  }

  async function updateLeadStatus(leadId, status) {
    try {
      await fetch('/api/admin/referral-partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, status }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch (err) {
      console.error('Update lead status error:', err);
    }
  }

  async function handleAddPartner(e) {
    e.preventDefault();
    if (!addForm.slug || !addForm.name) return;
    setAddLoading(true);
    try {
      const res = await fetch('/api/admin/referral-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddForm({ slug: '', name: '', partner_type: '', assigned_to: '', headline: '', subheadline: '' });
        loadData();
      }
    } catch (err) {
      console.error('Add partner error:', err);
    }
    setAddLoading(false);
  }

  function copyLink(slug) {
    navigator.clipboard.writeText(`https://range-medical.com/refer/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  }

  const filteredLeads = leads.filter(l => {
    if (leadPartnerFilter !== 'all' && l.partner_slug !== leadPartnerFilter) return false;
    if (leadStatusFilter !== 'all' && l.status !== leadStatusFilter) return false;
    return true;
  });

  const leadCountByPartner = {};
  leads.forEach(l => {
    leadCountByPartner[l.partner_slug] = (leadCountByPartner[l.partner_slug] || 0) + 1;
  });

  const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '24px', fontWeight: '700', margin: 0 },
    toggleRow: { display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid #e5e5e5' },
    toggleBtn: { padding: '10px 24px', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', marginBottom: '-2px', fontSize: '14px', fontWeight: '500', color: '#888', cursor: 'pointer' },
    toggleActive: { color: '#1a1a1a', borderBottomColor: '#1a1a1a' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' },
    statCard: { background: '#fafafa', padding: '20px', textAlign: 'center', border: '1px solid #f0f0f0' },
    statNum: { fontSize: '32px', fontWeight: '700', color: '#0a0a0a', marginBottom: '4px' },
    statLabel: { fontSize: '13px', color: '#888', fontWeight: '500' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: '600', borderBottom: '2px solid #e5e5e5', textTransform: 'uppercase', letterSpacing: '0.03em' },
    td: { padding: '12px 14px', fontSize: '14px', borderBottom: '1px solid #f5f5f5' },
    badge: (active) => ({ display: 'inline-block', padding: '2px 10px', fontSize: '11px', fontWeight: '600', background: active ? '#dcfce7' : '#f3f4f6', color: active ? '#166534' : '#666' }),
    statusBadge: (status) => {
      const colors = { new: { bg: '#dbeafe', color: '#1e40af' }, contacted: { bg: '#fef3c7', color: '#92400e' }, converted: { bg: '#dcfce7', color: '#166534' }, not_interested: { bg: '#f3f4f6', color: '#666' } };
      const c = colors[status] || colors.new;
      return { display: 'inline-block', padding: '2px 10px', fontSize: '11px', fontWeight: '600', background: c.bg, color: c.color };
    },
    copyBtn: { padding: '4px 10px', border: '1px solid #e5e5e5', background: '#fff', fontSize: '11px', cursor: 'pointer' },
    addBtn: { padding: '8px 16px', background: '#1a1a1a', color: '#fff', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    refreshBtn: { padding: '6px 14px', border: '1px solid #e5e5e5', background: '#fff', fontSize: '13px', cursor: 'pointer' },
    filterRow: { display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' },
    filterSelect: { padding: '6px 12px', border: '1px solid #e0e0e0', background: '#fff', fontSize: '13px', color: '#1a1a1a' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#fff', width: '90%', maxWidth: '500px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
    modalTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '24px' },
    formField: { marginBottom: '16px' },
    formLabel: { display: 'block', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', color: '#737373', textTransform: 'uppercase', marginBottom: '6px' },
    formInput: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #d1d5db', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' },
    formBtnRow: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
    cancelBtn: { padding: '10px 20px', background: '#fff', border: '1px solid #d1d5db', fontSize: '14px', cursor: 'pointer' },
    submitBtn: { padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  };

  return (
    <AdminLayout title="Referral Partners">
      <Head><title>Referral Partners | Range Medical</title></Head>

      <div style={s.header}>
        <h1 style={s.title}>Referral Partners</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={loadData} style={s.refreshBtn}>Refresh</button>
          <button onClick={() => setShowInviteModal(true)} style={{ ...s.addBtn, background: '#059669' }}>Send Invite</button>
          <button onClick={() => setShowAddModal(true)} style={s.addBtn}>+ Add Partner</button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#888', padding: '20px' }}>Loading...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={s.statsRow}>
            <div style={s.statCard}>
              <div style={s.statNum}>{partners.length}</div>
              <div style={s.statLabel}>Partners</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statNum}>{leads.length}</div>
              <div style={s.statLabel}>Total Leads</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statNum}>{leads.filter(l => l.status === 'new').length}</div>
              <div style={s.statLabel}>New (Uncontacted)</div>
            </div>
          </div>

          {/* Sub-view toggle */}
          <div style={s.toggleRow}>
            <button style={{ ...s.toggleBtn, ...(subView === 'partners' ? s.toggleActive : {}) }} onClick={() => setSubView('partners')}>Partners</button>
            <button style={{ ...s.toggleBtn, ...(subView === 'leads' ? s.toggleActive : {}) }} onClick={() => setSubView('leads')}>Leads ({leads.length})</button>
          </div>

          {/* Partners sub-view */}
          {subView === 'partners' && (
            partners.length === 0 ? (
              <div style={{ color: '#888', padding: '20px', textAlign: 'center' }}>No partners yet. Add one to get started.</div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Name</th>
                    <th style={s.th}>Slug</th>
                    <th style={s.th}>Type</th>
                    <th style={s.th}>Assigned To</th>
                    <th style={s.th}>Leads</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map(p => (
                    <tr key={p.id}>
                      <td style={{ ...s.td, fontWeight: '600' }}>{p.name}</td>
                      <td style={{ ...s.td, color: '#888', fontFamily: 'monospace', fontSize: '13px' }}>/refer/{p.slug}</td>
                      <td style={s.td}>{p.partner_type || '—'}</td>
                      <td style={s.td}>
                        <select
                          value={p.assigned_to || ''}
                          onChange={e => updateAssignedTo(p, e.target.value)}
                          style={{ border: 'none', background: 'transparent', fontSize: '13px', color: '#1a1a1a', cursor: 'pointer', padding: '0' }}
                        >
                          <option value="">Unassigned</option>
                          {STAFF_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      <td style={{ ...s.td, fontWeight: '600' }}>{leadCountByPartner[p.slug] || 0}</td>
                      <td style={s.td}>
                        <button onClick={() => toggleActive(p)} style={{ ...s.badge(p.active), cursor: 'pointer', border: 'none' }}>
                          {p.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td style={s.td}>
                        <button onClick={() => copyLink(p.slug)} style={s.copyBtn}>
                          {copied === p.slug ? 'Copied!' : 'Copy Link'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Leads sub-view */}
          {subView === 'leads' && (
            <>
              <div style={s.filterRow}>
                <select value={leadPartnerFilter} onChange={e => setLeadPartnerFilter(e.target.value)} style={s.filterSelect}>
                  <option value="all">All Partners</option>
                  {partners.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                </select>
                <select value={leadStatusFilter} onChange={e => setLeadStatusFilter(e.target.value)} style={s.filterSelect}>
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="not_interested">Not Interested</option>
                </select>
                <span style={{ fontSize: '13px', color: '#888' }}>{filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}</span>
              </div>

              {filteredLeads.length === 0 ? (
                <div style={{ color: '#888', padding: '20px', textAlign: 'center' }}>No leads match the current filters.</div>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Date</th>
                      <th style={s.th}>Name</th>
                      <th style={s.th}>Phone</th>
                      <th style={s.th}>Email</th>
                      <th style={s.th}>Partner</th>
                      <th style={s.th}>Interests</th>
                      <th style={s.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => (
                      <React.Fragment key={lead.id}>
                        <tr
                          style={{ cursor: lead.notes ? 'pointer' : 'default' }}
                          onClick={() => lead.notes && setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                        >
                          <td style={{ ...s.td, fontSize: '13px', color: '#888', whiteSpace: 'nowrap' }}>
                            {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td style={{ ...s.td, fontWeight: '600' }}>{lead.first_name} {lead.last_name}</td>
                          <td style={s.td}><a href={`tel:${lead.phone}`} style={{ color: '#1a1a1a', textDecoration: 'none' }}>{lead.phone}</a></td>
                          <td style={{ ...s.td, fontSize: '13px' }}><a href={`mailto:${lead.email}`} style={{ color: '#1a1a1a', textDecoration: 'none' }}>{lead.email}</a></td>
                          <td style={{ ...s.td, fontSize: '13px' }}>{lead.partner_slug}</td>
                          <td style={{ ...s.td, fontSize: '12px', color: '#666' }}>
                            {(lead.interests || []).map(i => INTEREST_LABELS[i] || i).join(', ') || '—'}
                          </td>
                          <td style={s.td}>
                            <select
                              value={lead.status}
                              onChange={e => updateLeadStatus(lead.id, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{ ...s.statusBadge(lead.status), border: 'none', cursor: 'pointer', paddingRight: '20px' }}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="converted">Converted</option>
                              <option value="not_interested">Not Interested</option>
                            </select>
                          </td>
                        </tr>
                        {expandedLead === lead.id && lead.notes && (
                          <tr>
                            <td colSpan={7} style={{ ...s.td, background: '#fafafa', fontSize: '13px', color: '#555', padding: '12px 14px 12px 40px' }}>
                              <strong>Notes:</strong> {lead.notes}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </>
      )}

      {/* Add Partner Modal */}
      {showAddModal && (
        <div style={s.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Add Referral Partner</h3>
            <form onSubmit={handleAddPartner}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={s.formField}>
                  <label style={s.formLabel}>Name *</label>
                  <input style={s.formInput} value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Greg" />
                </div>
                <div style={s.formField}>
                  <label style={s.formLabel}>Slug *</label>
                  <input style={s.formInput} value={addForm.slug} onChange={e => setAddForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} placeholder="greg" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={s.formField}>
                  <label style={s.formLabel}>Partner Type</label>
                  <select style={s.formInput} value={addForm.partner_type} onChange={e => setAddForm(f => ({ ...f, partner_type: e.target.value }))}>
                    <option value="">Select type</option>
                    <option value="trainer">Trainer</option>
                    <option value="physician">Physician</option>
                    <option value="chiropractor">Chiropractor</option>
                    <option value="athlete">Athlete</option>
                    <option value="influencer">Influencer</option>
                    <option value="patient">Patient</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={s.formField}>
                  <label style={s.formLabel}>Assigned To (email)</label>
                  <select style={s.formInput} value={addForm.assigned_to} onChange={e => setAddForm(f => ({ ...f, assigned_to: e.target.value }))}>
                    <option value="">Select staff member</option>
                    {STAFF_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={s.formField}>
                <label style={s.formLabel}>Headline</label>
                <input style={s.formInput} value={addForm.headline} onChange={e => setAddForm(f => ({ ...f, headline: e.target.value }))} placeholder="[Name] sent you here for a reason." />
              </div>
              <div style={s.formField}>
                <label style={s.formLabel}>Subheadline</label>
                <input style={s.formInput} value={addForm.subheadline} onChange={e => setAddForm(f => ({ ...f, subheadline: e.target.value }))} placeholder="Here's what we actually do for people who want to perform at a higher level." />
              </div>
              <div style={s.formBtnRow}>
                <button type="button" onClick={() => setShowAddModal(false)} style={s.cancelBtn}>Cancel</button>
                <button type="submit" disabled={addLoading || !addForm.slug || !addForm.name} style={{ ...s.submitBtn, opacity: addLoading ? 0.5 : 1 }}>
                  {addLoading ? 'Adding...' : 'Add Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Patient Modal */}
      {showInviteModal && (
        <div style={s.modalOverlay} onClick={closeInviteModal}>
          <div style={{ ...s.modal, maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            {inviteSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Invite Sent</h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                  {inviteSelected.first_name || inviteSelected.name?.split(' ')[0]} will get a text with their referral signup link.
                </p>
                <button onClick={closeInviteModal} style={s.addBtn}>Done</button>
              </div>
            ) : !inviteSelected ? (
              <>
                <h3 style={s.modalTitle}>Send Referral Invite</h3>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px', marginTop: '-16px' }}>
                  Search for a patient to text them the referral signup link.
                </p>
                <div style={s.formField}>
                  <label style={s.formLabel}>Search Patient</label>
                  <input
                    style={s.formInput}
                    value={inviteSearch}
                    onChange={e => setInviteSearch(e.target.value)}
                    placeholder="Type a name..."
                    autoFocus
                  />
                </div>
                {invitePatients.length > 0 && (
                  <div style={{ border: '1px solid #e5e5e5', maxHeight: '280px', overflowY: 'auto' }}>
                    {invitePatients.map(p => {
                      const name = p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : p.name;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setInviteSelected(p)}
                          style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>{name}</span>
                          <span style={{ fontSize: '12px', color: '#888' }}>{p.phone || 'No phone'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ ...s.formBtnRow, marginTop: '16px' }}>
                  <button onClick={closeInviteModal} style={s.cancelBtn}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h3 style={s.modalTitle}>Confirm Invite</h3>
                <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>
                    {inviteSelected.first_name ? `${inviteSelected.first_name} ${inviteSelected.last_name || ''}`.trim() : inviteSelected.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>{inviteSelected.phone}</div>
                </div>
                <div style={{ background: '#f8f9fa', border: '1px solid #e5e5e5', padding: '14px', marginBottom: '20px', fontSize: '13px', color: '#444', lineHeight: '1.6' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Text Preview</div>
                  Hey {inviteSelected.first_name || inviteSelected.name?.split(' ')[0]} — thanks for being a Range Medical patient. Here's a quick link to set up your personal referral page. Takes 15 seconds, then you can text it to anyone you think should check us out: range-medical.com/refer/join
                </div>
                <div style={s.formBtnRow}>
                  <button onClick={() => setInviteSelected(null)} style={s.cancelBtn}>Back</button>
                  <button
                    onClick={sendInviteText}
                    disabled={inviteSending || !inviteSelected.phone}
                    style={{ ...s.submitBtn, opacity: inviteSending ? 0.5 : 1 }}
                  >
                    {inviteSending ? 'Sending...' : 'Send Text'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
