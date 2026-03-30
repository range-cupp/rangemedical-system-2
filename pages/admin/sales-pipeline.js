// /pages/admin/sales-pipeline.js
// Sales Pipeline — Kanban board for tracking leads from first contact to conversion
// Sits before the labs pipeline in the patient journey
// Range Medical System V2

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import LeadDetailPanel from '../../components/LeadDetailPanel';
import LabDetailPanel from '../../components/LabDetailPanel';
import { supabase } from '../../lib/supabase';

const STAGE_CONFIG = {
  new_lead:          { label: 'New Lead',          color: '#3b82f6', bg: '#eff6ff' },
  contacted:         { label: 'Contacted',         color: '#8b5cf6', bg: '#f5f3ff' },
  intake_completed:  { label: 'Intake Completed',  color: '#6366f1', bg: '#eef2ff' },
  follow_up:         { label: 'Follow-Up',         color: '#f59e0b', bg: '#fffbeb' },
  booked:            { label: 'Booked',            color: '#10b981', bg: '#ecfdf5' },
  showed:            { label: 'Showed',            color: '#06b6d4', bg: '#ecfeff' },
  started:           { label: 'Started',           color: '#111',    bg: '#f3f4f6' },
  lost:              { label: 'Lost',              color: '#ef4444', bg: '#fef2f2' },
};

const SOURCE_CONFIG = {
  assessment:     { label: 'Assessment',    color: '#7c3aed', bg: '#f5f3ff' },
  energy_check:   { label: 'Energy Check',  color: '#059669', bg: '#ecfdf5' },
  start_funnel:   { label: 'Start Funnel',  color: '#2563eb', bg: '#eff6ff' },
  research:       { label: 'Research',       color: '#0891b2', bg: '#ecfeff' },
  cellular_reset: { label: 'Cellular Reset', color: '#7c3aed', bg: '#faf5ff' },
  rlt_trial:      { label: 'RLT Trial',     color: '#dc2626', bg: '#fef2f2' },
  hbot_trial:     { label: 'HBOT Trial',    color: '#0891b2', bg: '#ecfeff' },
  manychat:       { label: 'ManyChat',       color: '#c026d3', bg: '#fdf4ff' },
  manual:         { label: 'Manual',         color: '#6b7280', bg: '#f3f4f6' },
  referral:       { label: 'Referral',       color: '#d97706', bg: '#fffbeb' },
  walk_in:        { label: 'Walk-In',        color: '#ea580c', bg: '#fff7ed' },
  instagram:      { label: 'Instagram',      color: '#c026d3', bg: '#fdf4ff' },
  google:         { label: 'Google',         color: '#2563eb', bg: '#eff6ff' },
  website:        { label: 'Website',        color: '#4f46e5', bg: '#eef2ff' },
  facebook:       { label: 'Facebook',       color: '#2563eb', bg: '#eff6ff' },
  tiktok:         { label: 'TikTok',         color: '#111',    bg: '#f3f4f6' },
  yelp:           { label: 'Yelp',           color: '#dc2626', bg: '#fef2f2' },
  friend:         { label: 'Friend',         color: '#d97706', bg: '#fffbeb' },
  other:          { label: 'Other',          color: '#6b7280', bg: '#f3f4f6' },
};

const TRIAL_STAGE_CONFIG = {
  new_lead:   { label: 'New Lead',    color: '#3b82f6', bg: '#eff6ff' },
  purchased:  { label: 'Purchased',   color: '#8b5cf6', bg: '#f5f3ff' },
  day_1:      { label: 'Day 1',       color: '#f59e0b', bg: '#fffbeb' },
  trial_active: { label: 'Active',    color: '#06b6d4', bg: '#ecfeff' },
  check_in:   { label: 'Check-In',    color: '#111',    bg: '#f3f4f6' },
  converted:  { label: 'Converted',   color: '#16a34a', bg: '#f0fdf4' },
  nurture:    { label: 'Nurture',     color: '#d97706', bg: '#fffbeb' },
  lost:       { label: 'Lost',        color: '#ef4444', bg: '#fef2f2' },
};

const LAB_STAGE_CONFIG = {
  awaiting_results:    { label: 'Awaiting Results',    color: '#f59e0b', bg: '#fffbeb', owner: 'Primex' },
  uploaded:            { label: 'Uploaded',             color: '#8b5cf6', bg: '#f5f3ff', owner: 'Chris / Evan' },
  under_review:        { label: 'Under Review',        color: '#3b82f6', bg: '#eff6ff', owner: 'Damien / Evan' },
  ready_to_schedule:   { label: 'Ready to Schedule',   color: '#f97316', bg: '#fff7ed', owner: 'Tara' },
  consult_scheduled:   { label: 'Consult Booked',      color: '#6366f1', bg: '#eef2ff', owner: null },
  in_treatment:        { label: 'In Treatment',         color: '#10b981', bg: '#ecfdf5', owner: null },
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
  const [employees, setEmployees] = useState([]);
  const [importing, setImporting] = useState(false);
  const [filterSource, setFilterSource] = useState('all');
  const [filterPath, setFilterPath] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabLead, setSelectedLabLead] = useState(null);
  const [viewMode, setViewMode] = useState('standard'); // standard | trial

  const fetchBoard = useCallback(async () => {
    try {
      if (viewMode === 'labs') {
        const res = await fetch('/api/admin/labs-pipeline');
        const data = await res.json();
        if (data.success) {
          const labColumns = Object.keys(LAB_STAGE_CONFIG).map(key => ({
            key,
            leads: (data.stages[key] || []).map(p => {
              const patient = p.patients;
              const name = patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim();
              const nameParts = name.split(' ');
              return {
                id: p.id,
                first_name: nameParts[0] || '',
                last_name: nameParts.slice(1).join(' ') || '',
                phone: patient?.phone || null,
                email: patient?.email || null,
                patient_id: p.patient_id,
                source: p.medication || 'Essential',
                path: p.delivery_method === 'follow_up' ? 'Follow-up' : 'New Patient',
                notes: p.notes || null,
                created_at: p.created_at,
                updated_at: p.updated_at,
                start_date: p.start_date,
                stage: p.status,
                _isLab: true,
              };
            }),
          }));
          setColumns(labColumns);
          const total = labColumns.reduce((sum, c) => sum + c.leads.length, 0);
          const inReview = (data.counts.under_review || 0) + (data.counts.uploaded || 0);
          const scheduled = data.counts.consult_scheduled || 0;
          const treated = data.counts.in_treatment || 0;
          setSummary({ total, active: inReview, converted: treated, lost: scheduled });
        }
      } else {
        const url = viewMode === 'trial'
          ? '/api/admin/sales-pipeline?view=trial'
          : '/api/admin/sales-pipeline';
        const res = await fetch(url);
        const data = await res.json();
        if (data.columns) setColumns(data.columns);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error('Fetch pipeline error:', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

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

    // If moving to "lost", open detail panel for reason
    if (toStage === 'lost' && viewMode !== 'labs') {
      const lead = columns.flatMap(c => c.leads).find(l => l.id === data.id);
      setSelectedLead({ ...lead, stage: toStage });
    }

    // Optimistic update
    setColumns(prev => prev.map(col => ({
      ...col,
      leads: col.key === toStage
        ? [{ ...columns.flatMap(c => c.leads).find(l => l.id === data.id), stage: toStage }, ...col.leads.filter(l => l.id !== data.id)]
        : col.leads.filter(l => l.id !== data.id),
    })));

    try {
      if (viewMode === 'labs') {
        await fetch('/api/admin/labs-pipeline', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: data.id, newStage: toStage }),
        });
      } else {
        await fetch('/api/admin/sales-pipeline', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: data.id, stage: toStage }),
        });
      }
    } catch {
      fetchBoard();
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

  const handleCloseLab = async (protocolId) => {
    // Optimistic remove
    setColumns(prev => prev.map(col => ({
      ...col,
      leads: col.leads.filter(l => l.id !== protocolId),
    })));
    try {
      await fetch('/api/admin/labs-pipeline', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: protocolId }),
      });
    } catch {
      fetchBoard();
    }
  };

  const handleUpdateLead = async (updates) => {
    if (!updates) return;
    try {
      await fetch('/api/admin/sales-pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setSelectedLead(null);
      fetchBoard();
    } catch (err) {
      console.error('Update lead error:', err);
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

  const handleDeleteLead = async (leadId) => {
    try {
      const res = await fetch('/api/admin/sales-pipeline', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId }),
      });
      if (res.ok) {
        setColumns(prev => prev.map(col => ({
          ...col,
          leads: col.leads.filter(l => l.id !== leadId),
        })));
        setDeleteConfirm(null);
        setSelectedLead(null);
        fetchBoard();
      }
    } catch (err) {
      console.error('Delete lead error:', err);
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
        {(viewMode === 'labs' ? [
          { num: summary.total, label: 'In Pipeline', color: '#111' },
          { num: summary.active, label: 'Needs Action', color: '#f59e0b' },
          { num: summary.lost, label: 'Scheduled', color: '#6366f1' },
          { num: summary.converted, label: 'In Treatment', color: '#10b981' },
        ] : [
          { num: summary.total, label: 'Total Leads', color: '#111' },
          { num: summary.active, label: 'Active', color: '#3b82f6' },
          { num: summary.converted, label: 'Converted', color: '#10b981' },
          { num: summary.lost, label: 'Lost', color: '#ef4444' },
        ]).map(s => (
          <div key={s.label} style={styles.stat}>
            <span style={{ ...styles.statNum, color: s.color }}>{s.num}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
        {[
          { key: 'standard', label: 'All Leads', radius: '6px 0 0 6px' },
          { key: 'trial', label: 'RLT Trials', radius: '0' },
          { key: 'labs', label: 'Labs', radius: '0 6px 6px 0' },
        ].map(v => (
          <button
            key={v.key}
            onClick={() => { setViewMode(v.key); setLoading(true); }}
            style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              border: '1px solid #d1d5db', cursor: 'pointer',
              background: viewMode === v.key ? '#111' : '#fff',
              color: viewMode === v.key ? '#fff' : '#374151',
              borderRadius: v.radius,
              marginLeft: v.key === 'standard' ? 0 : '-1px',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Actions Bar — hidden for labs view */}
      {viewMode !== 'labs' && <div style={styles.actionsBar}>
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
            {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
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
      </div>}

      {/* Kanban Board */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading pipeline...</div>
      ) : (
        <div style={styles.board}>
          {filteredColumns.map(col => {
            const activeStageConfig = viewMode === 'labs' ? LAB_STAGE_CONFIG : viewMode === 'trial' ? TRIAL_STAGE_CONFIG : STAGE_CONFIG;
            const config = activeStageConfig[col.key] || { label: col.label || col.key, color: '#6b7280', bg: '#f3f4f6' };
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
                <div style={{ ...styles.columnHeader, borderTop: `3px solid ${config.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={styles.columnTitle}>{config.label}</span>
                    {config.owner && (
                      <span style={{
                        fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '3px',
                        background: `${config.color}15`, color: config.color, border: `1px solid ${config.color}30`,
                      }}>{config.owner}</span>
                    )}
                  </div>
                  <span style={styles.columnCount}>{col.leads.length}</span>
                </div>
                <div style={styles.columnBody}>
                  {col.leads.length === 0 ? (
                    <div style={styles.emptyCol}>
                      {isDragOver ? 'Drop here' : viewMode === 'labs' ? 'No patients' : 'No leads'}
                    </div>
                  ) : (
                    col.leads.map(lead => (
                      lead._isLab ? (
                        <LabCard
                          key={lead.id}
                          lead={lead}
                          stageKey={col.key}
                          onDragStart={handleDragStart}
                          onClose={handleCloseLab}
                          onClick={() => setSelectedLabLead(lead)}
                        />
                      ) : (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          stageKey={col.key}
                          onDragStart={handleDragStart}
                          onClick={() => setSelectedLead(lead)}
                        />
                      )
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
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Lead</h3>
              <button onClick={() => setShowAddModal(false)} style={styles.modalClose}>&times;</button>
            </div>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.formLabel}>First Name *</label>
                <input
                  style={styles.formInput}
                  placeholder="First name"
                  value={addForm.first_name}
                  onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label style={styles.formLabel}>Last Name</label>
                <input
                  style={styles.formInput}
                  placeholder="Last name"
                  value={addForm.last_name}
                  onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))}
                />
              </div>
              <div>
                <label style={styles.formLabel}>Phone</label>
                <input
                  style={styles.formInput}
                  placeholder="(555) 123-4567"
                  value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label style={styles.formLabel}>Email</label>
                <input
                  style={styles.formInput}
                  placeholder="email@example.com"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label style={styles.formLabel}>Lead Source</label>
                <select
                  style={styles.formInput}
                  value={addForm.source}
                  onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}
                >
                  <option value="manual">Manual Entry</option>
                  <option value="referral">Referral</option>
                  <option value="friend">Friend</option>
                  <option value="walk_in">Walk-In</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                  <option value="google">Google</option>
                  <option value="yelp">Yelp</option>
                  <option value="website">Website</option>
                  <option value="other">Other</option>
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
            <div style={{ marginTop: '16px' }}>
              <label style={styles.formLabel}>Notes</label>
              <textarea
                style={{ ...styles.formInput, height: '70px', resize: 'vertical' }}
                placeholder="Any notes about this lead..."
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

      {/* Lead Detail Slide Panel */}
      <LeadDetailPanel
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        lead={selectedLead}
        employees={employees}
        onUpdate={handleUpdateLead}
        onDelete={(id) => { handleDeleteLead(id); setSelectedLead(null); }}
        onMoveStage={(id, stage) => {
          handleMoveStage(id, stage);
          setSelectedLead(prev => prev ? { ...prev, stage } : null);
        }}
      />

      <LabDetailPanel
        isOpen={!!selectedLabLead}
        onClose={() => setSelectedLabLead(null)}
        lead={selectedLabLead}
      />
    </AdminLayout>
  );
}

function SourceBadge({ source }) {
  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.other || { label: source || 'Unknown', color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: '600',
      padding: '2px 8px',
      borderRadius: '3px',
      background: config.bg,
      color: config.color,
      whiteSpace: 'nowrap',
    }}>
      {config.label}
    </span>
  );
}

function LeadCard({ lead, stageKey, onDragStart, onClick }) {
  const [dragging, setDragging] = useState(false);
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
        <SourceBadge source={lead.source || lead.lead_type} />
        {pathName && (
          <span style={styles.cardPathTag}>{pathName}</span>
        )}
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

function LabCard({ lead, stageKey, onDragStart, onClose, onClick }) {
  const [dragging, setDragging] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const panelType = lead.source || 'Essential';
  const isElite = panelType === 'Elite';
  const daysInStage = lead.updated_at ? Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const drawDate = lead.start_date ? new Date(lead.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  return (
    <div
      draggable
      onDragStart={e => { setDragging(true); onDragStart(e, lead, stageKey); }}
      onDragEnd={() => setDragging(false)}
      style={{
        ...styles.card,
        opacity: dragging ? 0.5 : 1,
        cursor: 'grab',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{ ...styles.cardName, cursor: 'pointer', borderBottom: '1px dashed #d1d5db' }}
          onClick={e => { e.stopPropagation(); onClick && onClick(); }}
        >
          {lead.first_name} {lead.last_name}
        </div>
        <button
          onClick={e => { e.stopPropagation(); setConfirmClose(true); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#d1d5db', padding: '0 2px', lineHeight: 1 }}
          title="Close"
        >&times;</button>
      </div>
      {confirmClose && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '8px 10px', margin: '6px 0', fontSize: '12px' }}>
          <div style={{ color: '#991b1b', fontWeight: 600, marginBottom: '6px' }}>Remove from pipeline?</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={e => { e.stopPropagation(); onClose(lead.id); }}
              style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >Close</button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmClose(false); }}
              style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 500, background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
            >Cancel</button>
          </div>
        </div>
      )}
      {lead.phone && (
        <div style={styles.cardPhone}>{lead.phone}</div>
      )}
      <div style={styles.cardMeta}>
        <span style={{
          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap',
          background: isElite ? '#fdf2f8' : '#f0f9ff',
          color: isElite ? '#9d174d' : '#0369a1',
        }}>
          {panelType}
        </span>
        <span style={styles.cardPathTag}>{lead.path}</span>
      </div>
      <div style={styles.cardFooter}>
        <span style={styles.cardTime}>{drawDate ? `Draw: ${drawDate}` : timeAgo(lead.created_at)}</span>
        <span style={{
          fontSize: '11px', fontWeight: 600,
          color: daysInStage > 3 ? '#ef4444' : daysInStage > 1 ? '#f59e0b' : '#9ca3af',
        }}>
          {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
        </span>
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
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 24px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    minWidth: '110px',
    flex: '1 0 110px',
  },
  statNum: {
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '6px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  actionsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
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
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    width: '200px',
    outline: 'none',
  },
  filterSelect: {
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  importBtn: {
    padding: '8px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    color: '#374151',
    fontWeight: '500',
  },
  addBtn: {
    padding: '8px 16px',
    border: '1px solid #111',
    borderRadius: '6px',
    background: '#111',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  board: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '16px',
    minHeight: '500px',
  },
  column: {
    minWidth: '250px',
    flex: '1 0 250px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 300px)',
    overflow: 'hidden',
  },
  columnDragOver: {
    background: '#f0f0f0',
    boxShadow: 'inset 0 0 0 2px #111',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fff',
    borderRadius: '8px 8px 0 0',
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
    padding: '2px 8px',
    borderRadius: '10px',
    minWidth: '24px',
    textAlign: 'center',
  },
  columnBody: {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  },
  emptyCol: {
    padding: '32px 12px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '6px',
    transition: 'box-shadow 0.15s, transform 0.1s',
  },
  cardName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111',
    marginBottom: '3px',
  },
  cardPhone: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  cardMeta: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  cardPathTag: {
    fontSize: '11px',
    padding: '2px 8px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '3px',
    fontWeight: '500',
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
    color: '#374151',
    fontWeight: '600',
    background: '#f3f4f6',
    padding: '1px 6px',
    borderRadius: '3px',
  },
  cardNotes: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '6px',
    fontStyle: 'italic',
    lineHeight: '1.4',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '6px',
  },
  // Modal styles
  modalBox: {
    background: '#fff',
    borderRadius: '10px',
    padding: '24px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '600',
    color: '#111',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  formInput: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6',
  },
  cancelBtn: {
    padding: '9px 18px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'inherit',
    cursor: 'pointer',
    color: '#374151',
  },
  saveBtn: {
    padding: '9px 18px',
    border: '1px solid #111',
    borderRadius: '6px',
    background: '#111',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
};
