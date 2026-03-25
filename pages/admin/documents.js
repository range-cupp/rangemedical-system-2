// /pages/admin/documents.js
// Documents center — print & send service PDFs to patients
// Range Medical System

import { useState, useRef } from 'react';
import AdminLayout, { sharedStyles, overlayClickProps } from '../../components/AdminLayout';
import { Printer, Mail, MessageSquare, Search, X, FileText, Package, FlaskConical, BookOpen } from 'lucide-react';

// ── Document Registry ──

const SERVICE_SHEETS = [
  { id: 'hormone', name: 'Hormone Optimization', price: '$250/mo', file: 'range_medical_hormone.pdf' },
  { id: 'weightloss', name: 'Weight Loss', price: 'Varies', file: 'range_medical_weightloss.pdf' },
  { id: 'peptides', name: 'Peptide Therapy', price: 'Varies', file: 'range_medical_peptides.pdf' },
  { id: 'bpc_tb4', name: 'BPC-157 / TB4', price: 'Varies', file: 'range_medical_bpc_tb4.pdf' },
  { id: 'ivtherapy', name: 'IV Therapy', price: '$225', file: 'range_medical_ivtherapy.pdf' },
  { id: 'injections', name: 'Vitamin Injections', price: '$35–$75', file: 'range_medical_injections.pdf' },
  { id: 'nad', name: 'NAD+ Therapy', price: '$0.50/mg', file: 'range_medical_nad.pdf' },
  { id: 'cortisone', name: 'Cortisone Injection + Consult', price: '$250', file: 'range_medical_cortisone.pdf' },
  { id: 'reset', name: '6-Week Cellular Reset', price: 'Varies', file: 'range_medical_reset.pdf' },
  { id: 'combo', name: 'Combo Membership', price: 'Varies', file: 'range_medical_combo_membership.pdf' },
  { id: 'hyperbaric', name: 'Hyperbaric Oxygen', price: 'Varies', file: 'range_medical_hyperbaric.pdf' },
  { id: 'redlight', name: 'Red Light Therapy', price: 'Varies', file: 'range_medical_redlight.pdf' },
  { id: 'exosome', name: 'Exosome Therapy', price: 'Varies', file: 'range_medical_exosome.pdf' },
  { id: 'prp', name: 'PRP', price: 'Varies', file: 'range_medical_prp.pdf' },
  { id: 'gi_stool', name: 'GI Effects Stool Test', price: '$999', file: 'range_medical_gi_stool.pdf' },
];

const LAB_PANELS = [
  { id: 'essential_male', name: 'Essential Panel — Male', price: '$350', file: 'range_medical_essential_male.pdf' },
  { id: 'essential_female', name: 'Essential Panel — Female', price: '$350', file: 'range_medical_essential_female.pdf' },
  { id: 'elite_male', name: 'Elite Panel — Male', price: '$750', file: 'range_medical_elite_male.pdf' },
  { id: 'elite_female', name: 'Elite Panel — Female', price: '$750', file: 'range_medical_elite_female.pdf' },
];

const PACKETS = [
  { id: 'all_services', name: 'All Services', desc: '14 services in one packet', pages: 14, file: 'Range_Medical_Services_Packet.pdf' },
  { id: 'essential_male', name: 'Essential Male Packet', desc: 'All services + Essential Male panel', pages: 15, file: 'Range_Medical_Essential_Male_Packet.pdf' },
  { id: 'essential_female', name: 'Essential Female Packet', desc: 'All services + Essential Female panel', pages: 15, file: 'Range_Medical_Essential_Female_Packet.pdf' },
  { id: 'elite_male', name: 'Elite Male Packet', desc: 'All services + Elite Male panel', pages: 15, file: 'Range_Medical_Elite_Male_Packet.pdf' },
  { id: 'elite_female', name: 'Elite Female Packet', desc: 'All services + Elite Female panel', pages: 15, file: 'Range_Medical_Elite_Female_Packet.pdf' },
];

const GUIDES = [
  { id: 'hrt', name: 'HRT Guide', category: 'hrt', file: 'hrt_guide.pdf' },
  { id: 'tirzepatide', name: 'Tirzepatide Guide', category: 'weight_loss', file: 'tirzepatide_guide.pdf' },
  { id: 'retatrutide', name: 'Retatrutide Guide', category: 'weight_loss', file: 'retatrutide_guide.pdf' },
  { id: 'wl_medication', name: 'WL Medication Guide', category: 'weight_loss', file: 'weight_loss_medication_guide.pdf' },
  { id: 'bpc_tb4', name: 'BPC/TB4 Guide', category: 'peptide', file: 'bpc_tb4_guide.pdf' },
  { id: 'glow', name: 'GLOW Guide', category: 'peptide', file: 'glow_guide.pdf' },
  { id: 'ghk_cu', name: 'GHK-Cu Guide', category: 'peptide', file: 'ghk_cu_guide.pdf' },
  { id: '3x_blend', name: '3x Blend Guide', category: 'peptide', file: '3x_blend_guide.pdf' },
  { id: 'nad', name: 'NAD+ Guide', category: 'iv', file: 'nad_guide.pdf' },
  { id: 'methylene_blue', name: 'Methylene Blue Guide', category: 'iv', file: 'methylene_blue_guide.pdf' },
  { id: 'mb_vitc_combo', name: 'MB+VitC Combo Guide', category: 'iv', file: 'methylene_blue_combo_guide.pdf' },
  { id: 'glutathione', name: 'Glutathione Guide', category: 'iv', file: 'glutathione_guide.pdf' },
  { id: 'vitamin_c', name: 'Vitamin C Guide', category: 'iv', file: 'vitamin_c_guide.pdf' },
  { id: 'range_iv', name: 'Range IV Guide', category: 'iv', file: 'range_iv_guide.pdf' },
  { id: 'cellular_reset', name: 'Cellular Reset Guide', category: 'iv', file: 'cellular_reset_guide.pdf' },
  { id: 'hbot', name: 'HBOT Guide', category: 'hbot', file: 'hbot_guide.pdf' },
  { id: 'red_light', name: 'Red Light Guide', category: 'rlt', file: 'red_light_guide.pdf' },
  { id: 'combo_membership', name: 'Combo Membership', category: 'membership', file: 'combo_membership_guide.pdf' },
  { id: 'hbot_membership', name: 'HBOT Membership', category: 'membership', file: 'hbot_membership_guide.pdf' },
  { id: 'rlt_membership', name: 'RLT Membership', category: 'membership', file: 'rlt_membership_guide.pdf' },
  { id: 'essential_male_panel', name: 'Essential Male Panel', category: 'labs', file: 'essential_panel_male_guide.pdf' },
  { id: 'essential_female_panel', name: 'Essential Female Panel', category: 'labs', file: 'essential_panel_female_guide.pdf' },
  { id: 'elite_male_panel', name: 'Elite Male Panel', category: 'labs', file: 'elite_panel_male_guide.pdf' },
  { id: 'elite_female_panel', name: 'Elite Female Panel', category: 'labs', file: 'elite_panel_female_guide.pdf' },
  { id: 'the_blu', name: 'The Blu', category: 'other', file: 'the_blu_guide.pdf' },
];

const GUIDE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'hrt', label: 'HRT' },
  { id: 'weight_loss', label: 'Weight Loss' },
  { id: 'peptide', label: 'Peptides' },
  { id: 'iv', label: 'IV Therapy' },
  { id: 'hbot', label: 'HBOT' },
  { id: 'rlt', label: 'Red Light' },
  { id: 'membership', label: 'Memberships' },
  { id: 'labs', label: 'Labs' },
];

const getDocUrl = (category, filename) => `/documents/${category}/${filename}`;

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('services');
  const [sendModal, setSendModal] = useState(null); // { doc, method: 'email'|'sms' }
  const [successMsg, setSuccessMsg] = useState('');

  // Patient search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [inputMode, setInputMode] = useState('search');
  const [sending, setSending] = useState(false);
  const [guideFilter, setGuideFilter] = useState('all');
  const searchTimeout = useRef(null);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // ── Patient Search ──
  const handleSearch = (query) => {
    setSearchQuery(query);
    setSelectedPatient(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(data.patients || data || []);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);
  };

  const selectPatient = async (patient) => {
    try {
      const res = await fetch(`/api/patients/${patient.id}`);
      const data = await res.json();
      const p = data.patient || data;
      setSelectedPatient({
        id: p.id,
        name: p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name,
        firstName: p.first_name || (p.name || '').split(' ')[0],
        phone: p.phone || '',
        email: p.email || '',
        ghl_contact_id: p.ghl_contact_id || null,
      });
    } catch (err) {
      setSelectedPatient({
        id: patient.id,
        name: patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        firstName: patient.first_name || (patient.name || '').split(' ')[0],
        phone: patient.phone || '',
        email: patient.email || '',
      });
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  // ── Actions ──
  const handlePrint = (category, filename) => {
    window.open(getDocUrl(category, filename), '_blank');
  };

  const openSendModal = (doc, category, method) => {
    setSendModal({ ...doc, category, method });
    setSelectedPatient(null);
    setSearchQuery('');
    setSearchResults([]);
    setManualName('');
    setManualPhone('');
    setManualEmail('');
    setInputMode('search');
  };

  const handleSend = async () => {
    if (!sendModal) return;
    const method = sendModal.method;
    const docName = sendModal.name;
    const docUrl = getDocUrl(sendModal.category, sendModal.file);

    let patientName, patientEmail, patientPhone, patientId, ghlContactId;

    if (inputMode === 'search' && selectedPatient) {
      patientName = selectedPatient.name;
      patientEmail = selectedPatient.email;
      patientPhone = selectedPatient.phone;
      patientId = selectedPatient.id;
      ghlContactId = selectedPatient.ghl_contact_id;
    } else {
      patientName = manualName || 'there';
      patientEmail = manualEmail;
      patientPhone = manualPhone;
    }

    if (method === 'email' && !patientEmail) return;
    if (method === 'sms' && !patientPhone) return;

    setSending(true);
    try {
      const res = await fetch('/api/admin/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: method,
          documentUrl: docUrl,
          documentName: docName,
          patientEmail,
          patientPhone,
          patientName,
          patientId,
          ghlContactId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendModal(null);
        showSuccess(`${docName} sent via ${method === 'email' ? 'email' : 'text'}`);
      } else {
        alert(data.error || 'Failed to send');
      }
    } catch (err) {
      console.error('Send error:', err);
      alert('Failed to send document');
    } finally {
      setSending(false);
    }
  };

  // ── Render ──
  const tabs = [
    { id: 'services', label: 'Service Sheets', icon: <FileText size={15} />, count: SERVICE_SHEETS.length },
    { id: 'panels', label: 'Lab Panels', icon: <FlaskConical size={15} />, count: LAB_PANELS.length },
    { id: 'packets', label: 'Packets', icon: <Package size={15} />, count: PACKETS.length },
    { id: 'guides', label: 'Guides', icon: <BookOpen size={15} />, count: GUIDES.length },
  ];

  const filteredGuides = guideFilter === 'all' ? GUIDES : GUIDES.filter(g => g.category === guideFilter);

  const currentDocs = activeTab === 'services' ? SERVICE_SHEETS
    : activeTab === 'panels' ? LAB_PANELS
    : activeTab === 'guides' ? filteredGuides
    : PACKETS;

  const category = activeTab === 'services' ? 'services'
    : activeTab === 'panels' ? 'panels'
    : activeTab === 'guides' ? 'guides'
    : 'packets';

  return (
    <AdminLayout title="Documents">
      {/* Success toast */}
      {successMsg && <div style={pageStyles.toast}>{successMsg}</div>}

      {/* Tabs */}
      <div style={pageStyles.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...pageStyles.tab,
              ...(activeTab === tab.id ? pageStyles.tabActive : {}),
            }}
          >
            {tab.icon}
            {tab.label}
            <span style={pageStyles.tabCount}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Description */}
      <div style={pageStyles.description}>
        {activeTab === 'services' && 'Individual service information sheets. Print for patients or send via email/text.'}
        {activeTab === 'panels' && 'Lab panel breakdowns showing what we test and pricing. Great for patients considering blood work.'}
        {activeTab === 'packets' && 'Pre-combined packets with all services. Print the right one based on the patient\'s lab panel.'}
        {activeTab === 'guides' && 'Printable patient guides — the same ones we send via email/text. Print for patients who prefer a physical copy.'}
      </div>

      {/* Guide category filter */}
      {activeTab === 'guides' && (
        <div style={pageStyles.guideFilterBar}>
          {GUIDE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setGuideFilter(cat.id)}
              style={{
                ...pageStyles.guideFilterBtn,
                ...(guideFilter === cat.id ? pageStyles.guideFilterBtnActive : {}),
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Document Grid */}
      <div style={pageStyles.grid}>
        {currentDocs.map(doc => (
          <div key={doc.id} style={pageStyles.card}>
            <div style={pageStyles.cardBody}>
              <div style={pageStyles.cardTitle}>{doc.name}</div>
              {doc.price && <div style={pageStyles.cardPrice}>{doc.price}</div>}
              {doc.desc && <div style={pageStyles.cardDesc}>{doc.desc}</div>}
              {doc.pages && <div style={pageStyles.cardPages}>{doc.pages} pages</div>}
            </div>
            <div style={pageStyles.cardActions}>
              <button
                onClick={() => handlePrint(category, doc.file)}
                style={pageStyles.actionBtn}
                title="Open PDF to print"
              >
                <Printer size={14} />
                Print
              </button>
              <button
                onClick={() => openSendModal(doc, category, 'email')}
                style={pageStyles.actionBtn}
                title="Send via email"
              >
                <Mail size={14} />
                Email
              </button>
              <button
                onClick={() => openSendModal(doc, category, 'sms')}
                style={pageStyles.actionBtn}
                title="Send via text"
              >
                <MessageSquare size={14} />
                Text
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Send Modal */}
      {sendModal && (
        <div style={sharedStyles.modalOverlay} {...overlayClickProps(() => setSendModal(null))}>
          <div style={{ ...sharedStyles.modal, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={sharedStyles.modalHeader}>
              <h2 style={sharedStyles.modalTitle}>
                {sendModal.method === 'email' ? '✉️ Email' : '💬 Text'} Document
              </h2>
              <button style={sharedStyles.modalClose} onClick={() => setSendModal(null)}>×</button>
            </div>

            <div style={sharedStyles.modalBody}>
              {/* Document being sent */}
              <div style={pageStyles.sendDocPreview}>
                <FileText size={16} style={{ color: '#666', flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{sendModal.name}</span>
              </div>

              {/* Input mode toggle */}
              <div style={pageStyles.modeToggle}>
                <button
                  onClick={() => setInputMode('search')}
                  style={{ ...pageStyles.modeBtn, ...(inputMode === 'search' ? pageStyles.modeBtnActive : {}) }}
                >
                  Search Patient
                </button>
                <button
                  onClick={() => setInputMode('manual')}
                  style={{ ...pageStyles.modeBtn, ...(inputMode === 'manual' ? pageStyles.modeBtnActive : {}) }}
                >
                  Manual Entry
                </button>
              </div>

              {inputMode === 'search' ? (
                <div>
                  {/* Patient search */}
                  {selectedPatient ? (
                    <div style={pageStyles.selectedPatient}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{selectedPatient.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {sendModal.method === 'email' ? selectedPatient.email : selectedPatient.phone}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedPatient(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <div style={pageStyles.searchWrap}>
                        <Search size={15} style={{ color: '#999', flexShrink: 0 }} />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => handleSearch(e.target.value)}
                          placeholder="Search by name or phone..."
                          style={pageStyles.searchInput}
                          autoFocus
                        />
                      </div>
                      {searchResults.length > 0 && (
                        <div style={pageStyles.searchDropdown}>
                          {searchResults.slice(0, 8).map(p => (
                            <button
                              key={p.id}
                              onClick={() => selectPatient(p)}
                              style={pageStyles.searchResult}
                            >
                              <div style={{ fontWeight: 500 }}>{p.name || `${p.first_name || ''} ${p.last_name || ''}`}</div>
                              <div style={{ fontSize: 11, color: '#999' }}>
                                {sendModal.method === 'email' ? (p.email || 'No email') : (p.phone || 'No phone')}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedPatient && sendModal.method === 'email' && !selectedPatient.email && (
                    <div style={pageStyles.noContact}>No email on file for this patient</div>
                  )}
                  {selectedPatient && sendModal.method === 'sms' && !selectedPatient.phone && (
                    <div style={pageStyles.noContact}>No phone on file for this patient</div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={sharedStyles.fieldGroup}>
                    <label style={sharedStyles.label}>Name</label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={e => setManualName(e.target.value)}
                      placeholder="Patient name"
                      style={sharedStyles.input}
                    />
                  </div>
                  {sendModal.method === 'email' ? (
                    <div style={sharedStyles.fieldGroup}>
                      <label style={sharedStyles.label}>Email</label>
                      <input
                        type="email"
                        value={manualEmail}
                        onChange={e => setManualEmail(e.target.value)}
                        placeholder="patient@email.com"
                        style={sharedStyles.input}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div style={sharedStyles.fieldGroup}>
                      <label style={sharedStyles.label}>Phone</label>
                      <input
                        type="tel"
                        value={manualPhone}
                        onChange={e => setManualPhone(e.target.value)}
                        placeholder="(949) 555-1234"
                        style={sharedStyles.input}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={sharedStyles.modalFooter}>
              <button style={sharedStyles.btnSecondary} onClick={() => setSendModal(null)}>
                Cancel
              </button>
              <button
                style={sharedStyles.btnPrimary}
                onClick={handleSend}
                disabled={sending || (
                  inputMode === 'search'
                    ? !selectedPatient || (sendModal.method === 'email' && !selectedPatient.email) || (sendModal.method === 'sms' && !selectedPatient.phone)
                    : (sendModal.method === 'email' && !manualEmail) || (sendModal.method === 'sms' && !manualPhone)
                )}
              >
                {sending ? 'Sending...' : `Send via ${sendModal.method === 'email' ? 'Email' : 'Text'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const pageStyles = {
  tabBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottom: '1px solid #e5e5e5',
  },
  tab: {
    padding: '8px 16px',
    borderRadius: 0,
    border: '1px solid #e5e5e5',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: '#555',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
  tabActive: {
    background: '#111',
    color: '#fff',
    borderColor: '#111',
  },
  tabCount: {
    fontSize: 11,
    opacity: 0.6,
  },
  description: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
    lineHeight: 1.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 14,
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
    overflow: 'hidden',
    transition: 'box-shadow 0.15s',
  },
  cardBody: {
    padding: '16px 18px 12px',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: 600,
    color: '#666',
  },
  cardDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  cardPages: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
  },
  cardActions: {
    display: 'flex',
    borderTop: '1px solid #f0f0f0',
  },
  actionBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: '10px 0',
    border: 'none',
    borderRight: '1px solid #f0f0f0',
    background: '#fafafa',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    color: '#555',
    transition: 'background 0.15s',
  },
  toast: {
    position: 'fixed',
    top: 20,
    right: 20,
    background: '#111',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 0,
    fontSize: 14,
    fontWeight: 500,
    zIndex: 9999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  sendDocPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    background: '#f8f8f8',
    borderRadius: 0,
    marginBottom: 16,
    fontSize: 14,
  },
  modeToggle: {
    display: 'flex',
    gap: 4,
    marginBottom: 16,
    background: '#f3f4f6',
    borderRadius: 0,
    padding: 3,
  },
  modeBtn: {
    flex: 1,
    padding: '7px 12px',
    border: 'none',
    borderRadius: 0,
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: '#666',
    transition: 'all 0.15s',
  },
  modeBtnActive: {
    background: '#fff',
    color: '#111',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
    background: '#fff',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: 14,
    width: '100%',
    background: 'transparent',
  },
  searchDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
    marginTop: 4,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10,
    maxHeight: 240,
    overflowY: 'auto',
  },
  searchResult: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '10px 14px',
    border: 'none',
    borderBottom: '1px solid #f5f5f5',
    background: '#fff',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  selectedPatient: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
    background: '#f9fafb',
  },
  noContact: {
    marginTop: 8,
    fontSize: 12,
    color: '#ef4444',
    fontWeight: 500,
  },
  guideFilterBar: {
    display: 'flex',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  guideFilterBtn: {
    padding: '5px 14px',
    borderRadius: 0,
    border: '1px solid #e5e5e5',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    color: '#666',
    transition: 'all 0.15s',
  },
  guideFilterBtnActive: {
    background: '#111',
    color: '#fff',
    borderColor: '#111',
  },
};
