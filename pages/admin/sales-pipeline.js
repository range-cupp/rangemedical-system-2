// /pages/admin/sales-pipeline.js
// Sales Pipeline — Kanban board for tracking leads from first contact to conversion
// Sits before the labs pipeline in the patient journey
// Range Medical System V2

import { useState, useEffect, useCallback } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';

const STAGE_CONFIG = {
  new_lead:   { label: 'New Lead',   color: '#3b82f6', bg: '#eff6ff' },
  contacted:  { label: 'Contacted',  color: '#8b5cf6', bg: '#f5f3ff' },
  follow_up:  { label: 'Follow-Up',  color: '#f59e0b', bg: '#fffbeb' },
  booked:     { label: 'Booked',     color: '#10b981', bg: '#ecfdf5' },
  showed:     { label: 'Showed',     color: '#06b6d4', bg: '#ecfeff' },
  started:    { label: 'Started',    color: '#000',    bg: '#f3f4f6' },
  lost:       { label: 'Lost',       color: '#ef4444', bg: '#fef2f2' },
};

const SOURCE_LABELS = {
  assessment: 'Assessment',
  energy_check: 'Energy Check',
  start_funnel: 'Start Funnel',
  manual: 'Manual',
  referral: 'Referral',
  walk_in: 'Walk-In',
  instagram: 'Instagram',
  google: 'Google',
  website: 'Website',
};

const PATH_LABELS = {
  injury: 'Injury',
  energy: 'Energy',
  labs: 'Labs',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SalesPipeline() {
  const [columns, setColumns] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, converted: 0, lost: 0 });
  const [loading, setLoading] = useState(true);
  const [dragItem, setDragItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ first_name: '', last_name: '', email: '', phone: '', source: 'manual', path: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editAssigned, setEditAssigned] = useState('');
  const [editLostReason, setEditLostReason] = useState('');
  const [employees, setEmployees] = useState([]);
  const [importing, setImporting] = useState(false);
  const [filterSource, setFilterSource] = useState('all');
  const [filterPath, setFilterPath] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sales-pipeline');
      const data = await res.json();
      if (data.columns) setColumns(data.columns);
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      console.error('Fetch pipeline error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  useEffect(() => {
    supabase.from('employees').select('id, name').eq('active', true).then(({ data }) => {
      if (data) setEmployees(data);
    });
  }, []);

  // Drag handlers
  const handleDragStart = (e, lead, fromStage) => {
    setDragItem({ ...lead, fromStage });
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: lead.id, fromStage }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(stageKey);
  };

  const handleDragLeave = () => setDragOverColumn(null);

  const handleDrop = async (e, toStage) => {
    e.preventDefault();
    setDragOverColumn(null);

    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (!data.id || data.fromStage === toStage) return;

    // If moving to "lost", prompt for reason
    if (toStage === 'lost') {
      setSelectedLead(columns.flatMap(c => c.leads).find(l => l.id === data.id));
      setEditLostReason('');
      setEditNotes(columns.flatMap(c => c.leads).find(l => l.id === data.id)?.notes || '');
      // We'll handle this in the detail panel
    }

    // Optimistic update
    setColumns(prev => prev.map(col => ({
      ...col,
      leads: col.key === toStage
        ? [{ ...columns.flatMap(c => c.leads).find(l => l.id === data.id), stage: toStage }, ...col.leads.filter(l => l.id !== data.id)]
        : col.leads.filter(l => l.id !== data.id),
    })));

    try {
      await fetch('/api/admin/sales-pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.id, stage: toStage }),
      });
    } catch {
      fetchBoard(); // Revert on error
    }
    setDragItem(null);
  };

  const handleAddLead = async () => {
    if (!addForm.first_name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/sales-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddForm({ first_name: '', last_name: '', email: '', phone: '', source: 'manual', path: '', notes: '' });
        fetchBoard();
      }
    } catch (err) {
      console.error('Add lead error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/admin/sales-pipeline?action=import');
      const data = await res.json();
      if (data.imported > 0) fetchBoard();
      alert(`Imported ${data.imported} leads from existing forms`);
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    setSaving(true);
    try {
      await fetch('/api/admin/sales-pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedLead.id,
          stage: selectedLead.stage,
          notes: editNotes,
          assigned_to: editAssigned,
          lost_reason: editLostReason,
        }),
      });
      setSelectedLead(null);
      fetchBoard();
    } catch (err) {
      console.error('Update lead error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveStage = async (leadId, newStage) => {
    setColumns(prev => prev.map(col => ({
      ...col,
      leads: col.key === newStage
        ? [{ ...columns.flatMap(c => c.leads).find(l => l.id === leadId), stage: newStage }, ...col.leads.filter(l => l.id !== leadId)]
        : col.leads.filter(l => l.id !== leadId),
    })));

    try {
      await fetch('/api/admin/sales-pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, stage: newStage }),
      });
    } catch {
      fetchBoard();
    }
  };

  // Filter leads within columns
  const filteredColumns = columns.map(col => ({
    ...col,
    leads: col.leads.filter(lead => {
      if (filterSource !== 'all' && lead.source !== filterSource && lead.lead_type !== filterSource) return false;
      if (filterPath !== 'all' && lead.path !== filterPath) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const name = `${lead.first_name} ${lead.last_name}`.toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        return name.includes(term) || phone.includes(term) || email.includes(term);
      }
      return true;
    }),
  }));

  return (
    <AdminLayout title="Sales Pipeline">
      {/* Summary Stats */}
      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <span style={styles.statNum}>{summary.total}</span>
          <span style={styles.statLabel}>Total Leads</span>
        </div>
        <div style={styles.stat}>
          <span style={{ ...styles.statNum, color: '#3b82f6' }}>{summary.active}</span>
          <span style={styles.statLabel}>Active</span>
        </div>
        <div style={styles.stat}>
          <span style={{ ...styles.statNum, color: '#10b981' }}>{summary.converted}</span>
          <span style={styles.statLabel}>Converted</span>
        </div>
        <div style={styles.stat}>
          <span style={{ ...styles.statNum, color: '#ef4444' }}>{summary.lost}</span>
          <span style={styles.statLabel}>Lost</span>
        </div>
      </div>

      {/* Actions Bar */}
      <div style={styles.actionsBar}>
        <div style={styles.actionsLeft}>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={styles.filterSelect}>
            <option value="all">All Sources</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={filterPath} onChange={e => setFilterPath(e.target.value)} style={styles.filterSelect}>
            <option value="all">All Paths</option>
            <option value="injury">Injury</option>
            <option value="energy">Energy</option>
            <option value="labs">Labs</option>
          </select>
        </div>
        <div style={styles.actionsRight}>
          <button onClick={handleImport} disabled={importing} style={styles.importBtn}>
            {importing ? 'Importing...' : 'Import Existing Leads'}
          </button>
          <button onClick={() => setShowAddModal(true)} style={styles.addBtn}>
            + Add Lead
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading pipeline...</div>
      ) : (
        <div style={styles.board}>
          {filteredColumns.map(col => {
            const config = STAGE_CONFIG[col.key];
            const isDragOver = dragOverColumn === col.key;
            return (
              <div
                key={col.key}
                style={{
                  ...styles.column,
                  ...(isDragOver ? styles.columnDragOver : {}),
                }}
                onDragOver={e => handleDragOver(e, col.key)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, col.key)}
              >
                <div style={styles.columnHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...styles.stageDot, background: config.color }} />
                    <span style={styles.columnTitle}>{config.label}</span>
                  </div>
                  <span style={styles.columnCount}>{col.leads.length}</span>
                </div>
                <div style={styles.columnBody}>
                  {col.leads.length === 0 ? (
                    <div style={styles.emptyCol}>
                      {isDragOver ? 'Drop here' : 'No leads'}
                    </div>
                  ) : (
                    col.leads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        stageKey={col.key}
                        onDragStart={handleDragStart}
                        onClick={() => {
                          setSelectedLead(lead);
                          setEditNotes(lead.notes || '');
                          setEditAssigned(lead.assigned_to || '');
                          setEditLostReason(lead.lost_reason || '');
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div style={sharedStyles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={{ ...sharedStyles.modal, maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>Add New Lead</h3>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.formLabel}>First Name *</label>
                <input
                  style={styles.formInput}
                  value={addForm.first_name}
                  onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label style={styles.formLabel}>Last Name</label>
                <input
                  style={styles.formInput}
                  value={addForm.last_name}
                  onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))}
                />
              </div>
              <div>
                <label style={styles.formLabel}>Phone</label>
                <input
                  style={styles.formInput}
                  value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label style={styles.formLabel}>Email</label>
                <input
                  style={styles.formInput}
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label style={styles.formLabel}>Source</label>
                <select
                  style={styles.formInput}
                  value={addForm.source}
                  onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}
                >
                  <option value="manual">Manual Entry</option>
                  <option value="referral">Referral</option>
                  <option value="walk_in">Walk-In</option>
                  <option value="instagram">Instagram</option>
                  <option value="google">Google</option>
                  <option value="website">Website</option>
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>Interest</label>
                <select
                  style={styles.formInput}
                  value={addForm.path}
                  onChange={e => setAddForm(f => ({ ...f, path: e.target.value }))}
                >
                  <option value="">Not specified</option>
                  <option value="injury">Injury Recovery</option>
                  <option value="energy">Energy / Optimization</option>
                  <option value="labs">Lab Work</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={styles.formLabel}>Notes</label>
              <textarea
                style={{ ...styles.formInput, height: '60px', resize: 'vertical' }}
                value={addForm.notes}
                onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setShowAddModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleAddLead} disabled={saving || !addForm.first_name.trim()} style={styles.saveBtn}>
                {saving ? 'Saving...' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Panel */}
      {selectedLead && (
        <div style={sharedStyles.modalOverlay} onClick={() => setSelectedLead(null)}>
          <div style={{ ...sharedStyles.modal, maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600' }}>
                  {selectedLead.first_name} {selectedLead.last_name}
                </h3>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {selectedLead.phone && <span>{selectedLead.phone}</span>}
                  {selectedLead.email && <span style={{ marginLeft: selectedLead.phone ? '12px' : 0 }}>{selectedLead.email}</span>}
                </div>
              </div>
              <span style={{
                ...styles.sourceBadge,
                background: STAGE_CONFIG[selectedLead.stage]?.bg || '#f3f4f6',
                color: STAGE_CONFIG[selectedLead.stage]?.color || '#666',
              }}>
                {STAGE_CONFIG[selectedLead.stage]?.label || selectedLead.stage}
              </span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Source</span>
              <span>{SOURCE_LABELS[selectedLead.source] || SOURCE_LABELS[selectedLead.lead_type] || selectedLead.source || '—'}</span>
            </div>
            {selectedLead.path && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Interest</span>
                <span>{PATH_LABELS[selectedLead.path] || selectedLead.path}</span>
              </div>
            )}
            {selectedLead.urgency && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Urgency</span>
                <span>{selectedLead.urgency}/10</span>
              </div>
            )}
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Created</span>
              <span>{new Date(selectedLead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={styles.formLabel}>Move to Stage</label>
              <select
                style={styles.formInput}
                value={selectedLead.stage}
                onChange={e => {
                  const newStage = e.target.value;
                  handleMoveStage(selectedLead.id, newStage);
                  setSelectedLead(prev => ({ ...prev, stage: newStage }));
                }}
              >
                {Object.entries(STAGE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={styles.formLabel}>Assigned To</label>
              <select
                style={styles.formInput}
                value={editAssigned}
                onChange={e => setEditAssigned(e.target.value)}
              >
                <option value="">Unassigned</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={styles.formLabel}>Notes</label>
              <textarea
                style={{ ...styles.formInput, height: '80px', resize: 'vertical' }}
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
              />
            </div>

            {(selectedLead.stage === 'lost' || editLostReason) && (
              <div style={{ marginTop: '12px' }}>
                <label style={styles.formLabel}>Lost Reason</label>
                <select
                  style={styles.formInput}
                  value={editLostReason}
                  onChange={e => setEditLostReason(e.target.value)}
                >
                  <option value="">Select reason...</option>
                  <option value="no_response">No Response</option>
                  <option value="price">Price</option>
                  <option value="went_elsewhere">Went Elsewhere</option>
                  <option value="not_ready">Not Ready</option>
                  <option value="wrong_fit">Wrong Fit</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div style={styles.modalActions}>
              <button onClick={() => setSelectedLead(null)} style={styles.cancelBtn}>Close</button>
              <button onClick={handleUpdateLead} disabled={saving} style={styles.saveBtn}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function LeadCard({ lead, stageKey, onDragStart, onClick }) {
  const [dragging, setDragging] = useState(false);
  const sourceName = SOURCE_LABELS[lead.source] || SOURCE_LABELS[lead.lead_type] || lead.source || '';
  const pathName = PATH_LABELS[lead.path] || '';

  return (
    <div
      draggable
      onDragStart={e => { setDragging(true); onDragStart(e, lead, stageKey); }}
      onDragEnd={() => setDragging(false)}
      onClick={onClick}
      style={{
        ...styles.card,
        opacity: dragging ? 0.5 : 1,
        cursor: 'grab',
      }}
    >
      <div style={styles.cardName}>
        {lead.first_name} {lead.last_name}
      </div>
      {lead.phone && (
        <div style={styles.cardPhone}>{lead.phone}</div>
      )}
      <div style={styles.cardMeta}>
        {sourceName && <span style={styles.cardTag}>{sourceName}</span>}
        {pathName && <span style={styles.cardTag}>{pathName}</span>}
      </div>
      <div style={styles.cardFooter}>
        <span style={styles.cardTime}>{timeAgo(lead.created_at)}</span>
        {lead.assigned_to && <span style={styles.cardAssigned}>{lead.assigned_to}</span>}
      </div>
      {lead.notes && (
        <div style={styles.cardNotes}>{lead.notes.substring(0, 80)}{lead.notes.length > 80 ? '...' : ''}</div>
      )}
    </div>
  );
}

const styles = {
  statsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 20px',
    background: '#fff',
    border: '1px solid #e5e5e5',
    minWidth: '100px',
  },
  statNum: {
    fontSize: '22px',
    fontWeight: '700',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  },
  actionsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  actionsLeft: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionsRight: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  searchInput: {
    padding: '7px 12px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    fontFamily: 'inherit',
    width: '180px',
    outline: 'none',
  },
  filterSelect: {
    padding: '7px 8px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    fontFamily: 'inherit',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  importBtn: {
    padding: '7px 14px',
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    color: '#333',
  },
  addBtn: {
    padding: '7px 14px',
    border: '1px solid #000',
    background: '#000',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  board: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '16px',
    minHeight: '500px',
  },
  column: {
    minWidth: '240px',
    flex: '0 0 240px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 280px)',
  },
  columnDragOver: {
    background: '#e8e8e8',
    outline: '2px dashed #000',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fff',
  },
  stageDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  columnTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111',
  },
  columnCount: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    background: '#e5e7eb',
    padding: '1px 8px',
    borderRadius: '10px',
  },
  columnBody: {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  },
  emptyCol: {
    padding: '24px 12px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    padding: '10px 12px',
    marginBottom: '6px',
    transition: 'box-shadow 0.15s',
  },
  cardName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111',
    marginBottom: '2px',
  },
  cardPhone: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '6px',
  },
  cardMeta: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    marginBottom: '6px',
  },
  cardTag: {
    fontSize: '11px',
    padding: '1px 6px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '2px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTime: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  cardAssigned: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '500',
  },
  cardNotes: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '4px',
    fontStyle: 'italic',
    lineHeight: '1.3',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
    marginBottom: '4px',
  },
  formInput: {
    width: '100%',
    padding: '7px 10px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '20px',
  },
  cancelBtn: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    color: '#666',
  },
  saveBtn: {
    padding: '8px 16px',
    border: '1px solid #000',
    background: '#000',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  sourceBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '2px',
    whiteSpace: 'nowrap',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '13px',
  },
  detailLabel: {
    color: '#888',
    fontWeight: '500',
  },
};
