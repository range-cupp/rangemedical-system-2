// /pages/admin/email-campaigns.js
// Email campaign management — segment patients, compose emails, send campaigns
// Range Medical System V2

import { useState, useEffect } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';
import { Mail, Users, Send, ChevronLeft, Eye, Save, Filter, Trash2, Plus, Sparkles } from 'lucide-react';

const PROTOCOL_TYPES = [
  { value: 'peptide', label: 'Peptide' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'hrt', label: 'HRT' },
  { value: 'iv', label: 'IV Therapy' },
  { value: 'hbot', label: 'Hyperbaric (HBOT)' },
  { value: 'rlt', label: 'Red Light (RLT)' },
  { value: 'injection', label: 'Injection' },
];

const SERVICE_CATEGORIES = [
  { value: 'testosterone', label: 'Testosterone' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'peptide', label: 'Peptide' },
  { value: 'iv_therapy', label: 'IV Therapy' },
  { value: 'hbot', label: 'HBOT' },
  { value: 'red_light', label: 'Red Light' },
  { value: 'vitamin', label: 'Vitamin Injection' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
];

export default function EmailCampaignsPage() {
  const { isAdmin } = useAuth();
  const [view, setView] = useState('list'); // list, compose
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Segment builder state
  const [selectedProtocols, setSelectedProtocols] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [previewPatients, setPreviewPatients] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [segmentPreviewOpen, setSegmentPreviewOpen] = useState(false);

  // Email composer state
  const [campaignName, setCampaignName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailHtml, setEmailHtml] = useState(DEFAULT_TEMPLATE);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // AI compose state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Edit mode
  const [editingCampaign, setEditingCampaign] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/email-campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilters = () => ({
    protocolTypes: selectedProtocols.length > 0 ? selectedProtocols : undefined,
    purchaseCategories: selectedServices.length > 0 ? selectedServices : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const previewSegment = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/admin/email-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: getFilters() }),
      });
      const data = await res.json();
      setPreviewPatients(data.patients || []);
      setSegmentPreviewOpen(true);
    } catch (err) {
      console.error('Segment preview error:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const saveDraft = async () => {
    try {
      const res = await fetch('/api/admin/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          campaign: {
            id: editingCampaign?.id,
            name: campaignName,
            subject: emailSubject,
            htmlBody: emailHtml,
            filters: getFilters(),
          },
        }),
      });
      const data = await res.json();
      if (data.campaign) {
        setEditingCampaign(data.campaign);
        alert('Draft saved');
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving draft');
    }
  };

  const sendCampaign = async () => {
    if (!emailSubject || !emailHtml) {
      alert('Subject and email body are required');
      return;
    }
    if (previewPatients.length === 0) {
      alert('Preview your segment first to confirm recipients');
      return;
    }
    if (!confirm(`Send this email to ${previewPatients.length} recipients?`)) return;

    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/admin/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          campaign: {
            name: campaignName || `Campaign ${new Date().toLocaleDateString()}`,
            subject: emailSubject,
            htmlBody: emailHtml,
            filters: getFilters(),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult(data);
        fetchCampaigns();
      } else {
        alert(data.error || 'Send failed');
      }
    } catch (err) {
      console.error('Send error:', err);
      alert('Error sending campaign');
    } finally {
      setSending(false);
    }
  };

  const generateEmail = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/admin/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, subject: emailSubject || undefined }),
      });
      const data = await res.json();
      if (data.html) {
        setEmailHtml(data.html);
        if (data.subject && !emailSubject) {
          setEmailSubject(data.subject);
        }
        setShowPreview(true);
      } else {
        alert(data.error || 'Failed to generate email');
      }
    } catch (err) {
      console.error('AI generate error:', err);
      alert('Error generating email');
    } finally {
      setAiGenerating(false);
    }
  };

  const toggleProtocol = (val) => {
    setSelectedProtocols(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const toggleService = (val) => {
    setSelectedServices(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const clearFilters = () => {
    setSelectedProtocols([]);
    setSelectedServices([]);
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setPreviewPatients([]);
    setSegmentPreviewOpen(false);
  };

  const startNewCampaign = () => {
    setEditingCampaign(null);
    setCampaignName('');
    setEmailSubject('');
    setEmailHtml(DEFAULT_TEMPLATE);
    clearFilters();
    setSendResult(null);
    setView('compose');
  };

  const editDraft = (campaign) => {
    setEditingCampaign(campaign);
    setCampaignName(campaign.name);
    setEmailSubject(campaign.subject);
    setEmailHtml(campaign.html_body);
    // Restore filters from snapshot
    const f = campaign.segment_snapshot || {};
    setSelectedProtocols(f.protocolTypes || []);
    setSelectedServices(f.purchaseCategories || []);
    setStatusFilter(f.status || 'all');
    setDateFrom(f.dateFrom || '');
    setDateTo(f.dateTo || '');
    setSendResult(null);
    setView('compose');
  };

  // ─── ADMIN-ONLY GATE ───────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <AdminLayout title="Email Campaigns">
        <div style={sharedStyles.emptyState}>
          <p style={sharedStyles.emptyText}>Admin access required</p>
          <p style={{ fontSize: '14px', color: '#999' }}>Only admins can manage email campaigns</p>
        </div>
      </AdminLayout>
    );
  }

  // ─── CAMPAIGN LIST VIEW ───────────────────────────────────────────
  if (view === 'list') {
    return (
      <AdminLayout title="Email Campaigns">
        <div style={sharedStyles.pageHeader}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={sharedStyles.pageTitle}>Email Campaigns</h1>
              <p style={sharedStyles.pageSubtitle}>Segment patients and send marketing emails</p>
            </div>
            <button onClick={startNewCampaign} style={{ ...sharedStyles.btnPrimary, gap: '8px' }}>
              <Plus size={16} /> New Campaign
            </button>
          </div>
        </div>

        {loading ? (
          <div style={sharedStyles.loading}>Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div style={sharedStyles.emptyState}>
            <div style={sharedStyles.emptyIcon}><Mail size={48} color="#ccc" /></div>
            <p style={sharedStyles.emptyText}>No campaigns yet</p>
            <p style={{ fontSize: '14px', color: '#999' }}>Create your first email campaign to get started</p>
          </div>
        ) : (
          <div style={sharedStyles.card}>
            <table style={sharedStyles.table}>
              <thead>
                <tr>
                  <th style={sharedStyles.th}>Campaign</th>
                  <th style={sharedStyles.th}>Subject</th>
                  <th style={sharedStyles.th}>Status</th>
                  <th style={sharedStyles.th}>Recipients</th>
                  <th style={sharedStyles.th}>Sent</th>
                  <th style={sharedStyles.th}>Date</th>
                  <th style={sharedStyles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id}>
                    <td style={{ ...sharedStyles.td, fontWeight: '500' }}>{c.name}</td>
                    <td style={sharedStyles.td}>{c.subject}</td>
                    <td style={sharedStyles.td}>
                      <span style={{
                        ...sharedStyles.badge,
                        ...(c.status === 'sent' ? sharedStyles.badgeActive :
                           c.status === 'draft' ? sharedStyles.badgePending :
                           c.status === 'sending' ? { background: '#dbeafe', color: '#1e40af' } :
                           { background: '#fee2e2', color: '#991b1b' }),
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={sharedStyles.td}>{c.total_recipients || '—'}</td>
                    <td style={sharedStyles.td}>
                      {c.sent_count > 0 ? (
                        <span>{c.sent_count}{c.error_count > 0 ? ` (${c.error_count} errors)` : ''}</span>
                      ) : '—'}
                    </td>
                    <td style={sharedStyles.td}>
                      {c.sent_at ? new Date(c.sent_at).toLocaleDateString() : new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td style={sharedStyles.td}>
                      {c.status === 'draft' && (
                        <button
                          onClick={() => editDraft(c)}
                          style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminLayout>
    );
  }

  // ─── COMPOSE VIEW ─────────────────────────────────────────────────
  return (
    <AdminLayout title="Compose Campaign">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setView('list')} style={{ ...sharedStyles.btnSecondary, padding: '8px 12px' }}>
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 style={{ ...sharedStyles.pageTitle, fontSize: '24px' }}>
              {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
            </h1>
            <p style={sharedStyles.pageSubtitle}>Select audience, compose email, and send</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={saveDraft} style={sharedStyles.btnSecondary}>
            <Save size={16} /> Save Draft
          </button>
          <button
            onClick={sendCampaign}
            disabled={sending || previewPatients.length === 0}
            style={{
              ...sharedStyles.btnPrimary,
              opacity: sending || previewPatients.length === 0 ? 0.5 : 1,
            }}
          >
            <Send size={16} /> {sending ? 'Sending...' : `Send${previewPatients.length > 0 ? ` to ${previewPatients.length}` : ''}`}
          </button>
        </div>
      </div>

      {/* Send result banner */}
      {sendResult && (
        <div style={{
          padding: '16px 20px',
          background: sendResult.errors > 0 ? '#fef3c7' : '#dcfce7',
          border: `1px solid ${sendResult.errors > 0 ? '#f59e0b' : '#22c55e'}`,
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: '500' }}>
            Campaign sent: {sendResult.sent} delivered, {sendResult.errors} errors out of {sendResult.total} recipients
          </span>
          <button onClick={() => { setSendResult(null); setView('list'); }} style={sharedStyles.btnSecondary}>
            Back to Campaigns
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
        {/* LEFT: Segment Builder */}
        <div>
          <div style={sharedStyles.card}>
            <div style={sharedStyles.cardHeader}>
              <h3 style={sharedStyles.cardTitle}><Filter size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Audience Segment</h3>
            </div>
            <div style={sharedStyles.cardBody}>
              {/* Protocol Type Filters */}
              <div style={sharedStyles.fieldGroup}>
                <label style={sharedStyles.label}>Protocol Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PROTOCOL_TYPES.map(pt => (
                    <button
                      key={pt.value}
                      onClick={() => toggleProtocol(pt.value)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        border: '1px solid #ddd',
                        background: selectedProtocols.includes(pt.value) ? '#000' : '#fff',
                        color: selectedProtocols.includes(pt.value) ? '#fff' : '#333',
                        cursor: 'pointer',
                      }}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service History Filters */}
              <div style={sharedStyles.fieldGroup}>
                <label style={sharedStyles.label}>Service History</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {SERVICE_CATEGORIES.map(sc => (
                    <button
                      key={sc.value}
                      onClick={() => toggleService(sc.value)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        border: '1px solid #ddd',
                        background: selectedServices.includes(sc.value) ? '#000' : '#fff',
                        color: selectedServices.includes(sc.value) ? '#fff' : '#333',
                        cursor: 'pointer',
                      }}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div style={sharedStyles.fieldGroup}>
                <label style={sharedStyles.label}>Protocol Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ ...sharedStyles.select, width: '100%' }}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div style={sharedStyles.fieldGroup}>
                <label style={sharedStyles.label}>Patient Since</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    style={{ ...sharedStyles.input, flex: 1 }}
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    style={{ ...sharedStyles.input, flex: 1 }}
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={previewSegment}
                  disabled={previewLoading}
                  style={{ ...sharedStyles.btnPrimary, flex: 1, justifyContent: 'center' }}
                >
                  <Users size={14} /> {previewLoading ? 'Loading...' : 'Preview Audience'}
                </button>
                <button onClick={clearFilters} style={{ ...sharedStyles.btnSecondary, padding: '10px 14px' }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Preview results */}
              {segmentPreviewOpen && (
                <div style={{ marginTop: '16px', borderTop: '1px solid #e5e5e5', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      {previewPatients.length} recipients
                    </span>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {previewPatients.map(p => (
                      <div key={p.id} style={{
                        padding: '8px 0',
                        borderBottom: '1px solid #f0f0f0',
                        fontSize: '13px',
                      }}>
                        <div style={{ fontWeight: '500' }}>{p.name}</div>
                        <div style={{ color: '#666' }}>{p.email}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Email Composer */}
        <div>
          {/* Campaign name + subject */}
          <div style={{ ...sharedStyles.card, marginBottom: '20px' }}>
            <div style={sharedStyles.cardBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={sharedStyles.fieldGroup}>
                  <label style={sharedStyles.label}>Campaign Name (internal)</label>
                  <input
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                    placeholder="e.g. April Peptide Promo"
                    style={sharedStyles.input}
                  />
                </div>
                <div style={sharedStyles.fieldGroup}>
                  <label style={sharedStyles.label}>Email Subject Line</label>
                  <input
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder="e.g. New peptide protocols available"
                    style={sharedStyles.input}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Email Generator */}
          <div style={{ ...sharedStyles.card, marginBottom: '20px' }}>
            <div style={sharedStyles.cardHeader}>
              <h3 style={sharedStyles.cardTitle}>
                <Sparkles size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                AI Compose
              </h3>
            </div>
            <div style={sharedStyles.cardBody}>
              <p style={{ fontSize: '13px', color: '#666', margin: '0 0 12px' }}>
                Describe your email concept and AI will generate a branded HTML email
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && !aiGenerating) {
                      e.preventDefault();
                      generateEmail();
                    }
                  }}
                  placeholder="e.g. Promote our new BPC-157 peptide protocol for recovery. Mention spring pricing special at $299/month. Target active patients."
                  style={{
                    ...sharedStyles.input,
                    flex: 1,
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={generateEmail}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  style={{
                    ...sharedStyles.btnPrimary,
                    alignSelf: 'flex-end',
                    opacity: aiGenerating || !aiPrompt.trim() ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Sparkles size={14} /> {aiGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>

          {/* HTML Editor + Preview toggle */}
          <div style={sharedStyles.card}>
            <div style={sharedStyles.cardHeader}>
              <h3 style={sharedStyles.cardTitle}>Email Body</h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}
              >
                <Eye size={14} /> {showPreview ? 'Edit HTML' : 'Preview'}
              </button>
            </div>
            <div style={{ padding: '0' }}>
              {showPreview ? (
                <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '500px' }}>
                  <div style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
                  </div>
                </div>
              ) : (
                <textarea
                  value={emailHtml}
                  onChange={e => setEmailHtml(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '500px',
                    padding: '16px',
                    border: 'none',
                    fontFamily: 'Monaco, Menlo, monospace',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  placeholder="Paste or write your HTML email here..."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Default email template with Range Medical branding
const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Range Medical</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 2px solid #000000;">
              <span style="font-size: 18px; font-weight: 700; letter-spacing: 1px; color: #000000;">RANGE MEDICAL</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #000000; line-height: 1.3;">
                Your headline here
              </h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Your email body content goes here. Write naturally and keep it concise.
              </p>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333333;">
                Second paragraph with more details about the offer or update.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #000000; padding: 14px 32px;">
                    <a href="https://range-medical.com" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">
                      BOOK NOW
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e5e5; background-color: #fafafa;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #999999;">
                Range Medical &bull; 1901 Westcliff Drive, Suite 10, Newport Beach, CA
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                (949) 997-3988 &bull; range-medical.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
