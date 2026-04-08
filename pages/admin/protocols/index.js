// /pages/admin/protocols/index.js
// Unified Protocols Page — Single page with category tabs
// Replaces separate HRT Patients and Weight Loss pages
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout, { sharedStyles } from '../../../components/AdminLayout';
import { CATEGORY_COLORS, getCategoryStyle } from '../../../lib/protocol-config';
import { getWLStatus, getWLDaysSinceActivity, WL_STATUS_CONFIG } from '../../../lib/protocol-tracking';

// =====================================================
// CATEGORY TABS CONFIG
// =====================================================
const CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'hrt', label: 'HRT' },
  { key: 'weight_loss', label: 'Weight Loss' },
  { key: 'peptide', label: 'Peptide' },
  { key: 'iv', label: 'IV & Injections' },
];

// Normalize program_type to match tab keys
function getCategoryKey(protocol) {
  const pt = (protocol.program_type || '').toLowerCase();
  const med = (protocol.medication || '').toLowerCase();
  const name = (protocol.program_name || '').toLowerCase();

  // NAD and Glutathione always go to IV & Injections, regardless of program_type
  if (med.includes('nad') || med.includes('glutathione')) return 'iv';

  // Direct type matches
  if (['hrt', 'weight_loss'].includes(pt)) return pt;
  if (pt === 'iv' || pt === 'injection' || pt === 'iv_therapy' || pt === 'vitamin' || pt === 'injection_pack') return 'iv';
  if (pt === 'peptide') return 'peptide';
  if (pt === 'combo_membership' || pt === 'labs' || pt === 'phlebotomy' || pt === 'medication_pickup') return 'other';
  if (pt === 'hbot' || pt === 'rlt') return 'other';

  // Fallback detection from program name / medication
  if (name.includes('hrt') || name.includes('testosterone') || name.includes('trt')) return 'hrt';
  if (['semaglutide', 'tirzepatide', 'retatrutide'].some(m => med.includes(m) || name.includes(m))) return 'weight_loss';
  if (name.includes('iv ') || name.includes('vitamin c') || name.includes('injection')) return 'iv';
  if (name.includes('bpc') || name.includes('tb500') || name.includes('peptide') || name.includes('ipamorelin') || name.includes('sermorelin') || name.includes('tesamorelin')) return 'peptide';
  return 'other';
}

function calculateCurrentDay(startDate) {
  if (!startDate) return 0;
  const parts = startDate.split('-');
  const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1);
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================
function formatDate(d) {
  if (!d) return '\u2014';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' });
}

function daysAgo(d) {
  if (!d) return null;
  const diff = Math.floor((new Date() - new Date(d + 'T00:00:00')) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

function daysUntil(d) {
  if (!d) return null;
  const diff = Math.floor((new Date(d + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

// Weight loss status helpers + STATUS_CONFIG now imported from lib/protocol-tracking
const STATUS_CONFIG = WL_STATUS_CONFIG;

// =====================================================
// MAIN PAGE COMPONENT
// =====================================================
export default function ProtocolsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState('');
  const [subFilter, setSubFilter] = useState('active');
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [expandedRow, setExpandedRow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState({});

  // Read tab from URL query on mount
  useEffect(() => {
    if (router.isReady) {
      const tab = router.query.tab;
      if (tab && CATEGORY_TABS.some(t => t.key === tab)) {
        setActiveTab(tab);
      }
    }
  }, [router.isReady, router.query.tab]);

  // Fetch data when tab changes
  useEffect(() => {
    fetchData(activeTab);
    setExpandedRow(null);
    setSubFilter('active');
    setSortField(null);
  }, [activeTab]);

  const fetchData = async (tab) => {
    setLoading(true);
    setData([]);
    setSummary({});
    try {
      if (tab === 'hrt') {
        const res = await fetch('/api/hrt/patients-overview');
        const json = await res.json();
        if (json.success) {
          setData(json.data.patients || []);
          setSummary(json.data.summary || {});
        }
      } else if (tab === 'weight_loss') {
        const res = await fetch('/api/pipelines/weight-loss');
        const json = await res.json();
        // Add computed status to each protocol
        const protocols = (json.protocols || []).map(p => ({
          ...p,
          _status: getWLStatus(p),
        }));
        setData(protocols);
        const active = protocols.filter(p => p._status !== 'complete');
        const takeHome = active.filter(p => (p.delivery_method || 'take_home') === 'take_home');
        const inClinic = active.filter(p => p.delivery_method === 'in_clinic');
        const overdue = active.filter(p => p._status === 'overdue');
        const dueSoon = active.filter(p => p._status === 'due_soon');
        setSummary({
          active: active.length,
          takeHome: takeHome.length,
          inClinic: inClinic.length,
          overdue: overdue.length,
          dueSoon: dueSoon.length,
          completed: protocols.filter(p => p._status === 'complete').length,
          total: protocols.length,
        });
      } else {
        // All, Peptide, IV — use generic protocols API
        const res = await fetch('/api/admin/protocols');
        const json = await res.json();
        const allProtocols = json.protocols || json || [];
        // Count categories for "All" tab badges
        const counts = {};
        allProtocols.forEach(p => {
          if (p.status === 'active') {
            const cat = getCategoryKey(p);
            counts[cat] = (counts[cat] || 0) + 1;
          }
        });
        setCategoryCounts(counts);

        if (tab === 'all') {
          setData(allProtocols);
          setSummary({ active: allProtocols.filter(p => p.status === 'active').length, total: allProtocols.length });
        } else {
          // Filter to category
          const filtered = allProtocols.filter(p => getCategoryKey(p) === tab);
          setData(filtered);
          if (tab === 'peptide') {
            const active = filtered.filter(p => p.status === 'active');
            const takeHome = active.filter(p => p.delivery_method === 'take_home');
            const inClinic = active.filter(p => p.delivery_method === 'in_clinic');
            setSummary({ active: active.length, takeHome: takeHome.length, inClinic: inClinic.length, completed: filtered.filter(p => p.status !== 'active').length, total: filtered.length });
          } else if (tab === 'iv') {
            const active = filtered.filter(p => p.status === 'active');
            const ivs = active.filter(p => (p.program_type || '').toLowerCase() === 'iv' || (p.program_type || '').toLowerCase() === 'iv_therapy');
            const injections = active.filter(p => (p.program_type || '').toLowerCase() === 'injection');
            const nad = active.filter(p => (p.medication || '').toLowerCase().includes('nad'));
            setSummary({ active: active.length, ivs: ivs.length, injections: injections.length, nad: nad.length, completed: filtered.filter(p => p.status !== 'active').length, total: filtered.length });
          }
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Tab change — update URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.replace(`/admin/protocols${tab !== 'all' ? `?tab=${tab}` : ''}`, undefined, { shallow: true });
  };

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortArrow = (field) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  // Delete handler (for All tab)
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/protocols?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setData(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // FILTER + SORT DATA
  // =====================================================
  const getFilteredData = () => {
    let result = [...data];

    // Sub-filter
    if (activeTab === 'hrt') {
      if (subFilter === 'active') result = result.filter(p => p.status === 'active');
      else if (subFilter === 'labs-overdue') result = result.filter(p => p.lab_status === 'overdue' && p.status === 'active');
      else if (subFilter === 'labs-due-soon') result = result.filter(p => p.lab_status === 'due_soon' && p.status === 'active');
      else if (subFilter === 'meds-overdue') result = result.filter(p => p.med_status === 'overdue' && p.status === 'active');
      else if (subFilter === 'inactive') result = result.filter(p => p.status !== 'active');
    } else if (activeTab === 'weight_loss') {
      if (subFilter === 'active') result = result.filter(p => p._status !== 'complete');
      else if (subFilter === 'take-home') result = result.filter(p => (p.delivery_method || 'take_home') === 'take_home' && p._status !== 'complete');
      else if (subFilter === 'in-clinic') result = result.filter(p => p.delivery_method === 'in_clinic' && p._status !== 'complete');
      else if (subFilter === 'overdue') result = result.filter(p => p._status === 'overdue');
      else if (subFilter === 'due-soon') result = result.filter(p => p._status === 'due_soon');
      else if (subFilter === 'completed') result = result.filter(p => p._status === 'complete');
    } else if (activeTab === 'peptide') {
      if (subFilter === 'active') result = result.filter(p => p.status === 'active');
      else if (subFilter === 'take-home') result = result.filter(p => p.delivery_method === 'take_home' && p.status === 'active');
      else if (subFilter === 'in-clinic') result = result.filter(p => p.delivery_method === 'in_clinic' && p.status === 'active');
      else if (subFilter === 'completed') result = result.filter(p => p.status !== 'active');
    } else if (activeTab === 'iv') {
      if (subFilter === 'active') result = result.filter(p => p.status === 'active');
      else if (subFilter === 'iv') result = result.filter(p => ((p.program_type || '').toLowerCase() === 'iv' || (p.program_type || '').toLowerCase() === 'iv_therapy') && p.status === 'active');
      else if (subFilter === 'injection') result = result.filter(p => (p.program_type || '').toLowerCase() === 'injection' && p.status === 'active');
      else if (subFilter === 'nad') result = result.filter(p => (p.medication || '').toLowerCase().includes('nad') && p.status === 'active');
      else if (subFilter === 'completed') result = result.filter(p => p.status !== 'active');
    } else {
      // All tab
      if (subFilter === 'active') result = result.filter(p => p.status === 'active');
    }

    // Search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => {
        const name = (p.patient_name || p.patients?.name || '').toLowerCase();
        const med = (p.medication || '').toLowerCase();
        const phone = (p.patient_phone || p.phone || '').toLowerCase();
        const program = (p.program_name || '').toLowerCase();
        return name.includes(s) || med.includes(s) || phone.includes(s) || program.includes(s);
      });
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        let aVal, bVal;
        switch (sortField) {
          case 'patient_name':
            aVal = (a.patient_name || '').toLowerCase();
            bVal = (b.patient_name || '').toLowerCase();
            return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          case 'last_pickup_date':
          case 'last_lab_date':
          case 'last_activity':
          case 'start_date':
            aVal = a[sortField] ? new Date(a[sortField]).getTime() : 0;
            bVal = b[sortField] ? new Date(b[sortField]).getTime() : 0;
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
          case 'lab_status':
            const labOrder = { overdue: 0, due_soon: 1, on_track: 2, no_data: 3, 'n/a': 4 };
            aVal = labOrder[a.lab_status] ?? 9;
            bVal = labOrder[b.lab_status] ?? 9;
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
          case 'med_status':
            const medOrder = { overdue: 0, due_soon: 1, on_track: 2, no_data: 3, 'n/a': 4 };
            aVal = medOrder[a.med_status] ?? 9;
            bVal = medOrder[b.med_status] ?? 9;
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
          case 'weight_change':
            aVal = (a.current_weight && a.starting_weight) ? a.current_weight - a.starting_weight : 999;
            bVal = (b.current_weight && b.starting_weight) ? b.current_weight - b.starting_weight : 999;
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
          case 'progress':
            aVal = a.total_injections ? a.injections_used / a.total_injections : 0;
            bVal = b.total_injections ? b.injections_used / b.total_injections : 0;
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
          default:
            return 0;
        }
      });
    }

    return result;
  };

  const filtered = getFilteredData();

  // =====================================================
  // SUB-TAB CONFIGS
  // =====================================================
  const getSubTabs = () => {
    if (activeTab === 'hrt') {
      return [
        { key: 'active', label: 'Active', count: summary.active || 0 },
        { key: 'labs-overdue', label: 'Labs Overdue', count: summary.overdueLabs || 0, color: '#ef4444' },
        { key: 'labs-due-soon', label: 'Labs Due Soon', count: summary.dueSoonLabs || 0, color: '#f59e0b' },
        { key: 'meds-overdue', label: 'Meds Overdue', count: summary.overdueMeds || 0, color: '#ef4444' },
        { key: 'inactive', label: 'Inactive', count: (summary.completed || 0) + (summary.cancelled || 0) + (summary.paused || 0) },
        { key: 'all', label: 'All', count: summary.total || 0 },
      ];
    }
    if (activeTab === 'weight_loss') {
      return [
        { key: 'active', label: 'Active', count: summary.active || 0 },
        { key: 'take-home', label: 'Take-Home', count: summary.takeHome || 0 },
        { key: 'in-clinic', label: 'In-Clinic', count: summary.inClinic || 0 },
        { key: 'overdue', label: 'Overdue', count: summary.overdue || 0, color: '#ef4444' },
        { key: 'due-soon', label: 'Due Soon', count: summary.dueSoon || 0, color: '#f59e0b' },
        { key: 'completed', label: 'Completed', count: summary.completed || 0 },
        { key: 'all', label: 'All', count: summary.total || 0 },
      ];
    }
    if (activeTab === 'peptide') {
      return [
        { key: 'active', label: 'Active', count: summary.active || 0 },
        { key: 'take-home', label: 'Take-Home', count: summary.takeHome || 0 },
        { key: 'in-clinic', label: 'In-Clinic', count: summary.inClinic || 0 },
        { key: 'completed', label: 'Completed', count: summary.completed || 0 },
        { key: 'all', label: 'All', count: summary.total || 0 },
      ];
    }
    if (activeTab === 'iv') {
      return [
        { key: 'active', label: 'Active', count: summary.active || 0 },
        { key: 'iv', label: 'IV', count: summary.ivs || 0 },
        { key: 'injection', label: 'Range Injection', count: summary.injections || 0 },
        { key: 'nad', label: 'NAD', count: summary.nad || 0 },
        { key: 'completed', label: 'Completed', count: summary.completed || 0 },
        { key: 'all', label: 'All', count: summary.total || 0 },
      ];
    }
    // All tab
    return [
      { key: 'active', label: 'Active', count: summary.active || 0 },
      { key: 'all', label: 'All', count: summary.total || 0 },
    ];
  };

  // =====================================================
  // STAT CARDS
  // =====================================================
  const renderStatCards = () => {
    if (activeTab === 'hrt') {
      return (
        <div style={styles.summaryGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#3b82f6' }}>{summary.active || 0}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: (summary.overdueLabs || 0) > 0 ? '#ef4444' : '#22c55e' }}>{summary.overdueLabs || 0}</div>
            <div style={styles.statLabel}>Labs Overdue</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: (summary.dueSoonLabs || 0) > 0 ? '#f59e0b' : '#22c55e' }}>{summary.dueSoonLabs || 0}</div>
            <div style={styles.statLabel}>Labs Due Soon</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: (summary.overdueMeds || 0) > 0 ? '#ef4444' : '#22c55e' }}>{summary.overdueMeds || 0}</div>
            <div style={styles.statLabel}>Meds Overdue</div>
          </div>
        </div>
      );
    }
    if (activeTab === 'weight_loss') {
      return (
        <div style={styles.summaryGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#8b5cf6' }}>{summary.takeHome || 0}</div>
            <div style={styles.statLabel}>Take-Home</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#3b82f6' }}>{summary.inClinic || 0}</div>
            <div style={styles.statLabel}>In-Clinic</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: (summary.overdue || 0) > 0 ? '#ef4444' : '#22c55e' }}>{summary.overdue || 0}</div>
            <div style={styles.statLabel}>Overdue</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: (summary.dueSoon || 0) > 0 ? '#f59e0b' : '#22c55e' }}>{summary.dueSoon || 0}</div>
            <div style={styles.statLabel}>Due Soon</div>
          </div>
        </div>
      );
    }
    if (activeTab === 'peptide') {
      return (
        <div style={styles.summaryGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#3b82f6' }}>{summary.active || 0}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#8b5cf6' }}>{summary.takeHome || 0}</div>
            <div style={styles.statLabel}>Take-Home</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#059669' }}>{summary.inClinic || 0}</div>
            <div style={styles.statLabel}>In-Clinic</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#666' }}>{summary.completed || 0}</div>
            <div style={styles.statLabel}>Completed</div>
          </div>
        </div>
      );
    }
    if (activeTab === 'iv') {
      return (
        <div style={styles.summaryGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#3b82f6' }}>{summary.active || 0}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#059669' }}>{summary.ivs || 0}</div>
            <div style={styles.statLabel}>IVs</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#8b5cf6' }}>{summary.injections || 0}</div>
            <div style={styles.statLabel}>Injections</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#f59e0b' }}>{summary.nad || 0}</div>
            <div style={styles.statLabel}>NAD</div>
          </div>
        </div>
      );
    }
    return null;
  };

  // =====================================================
  // TABLE RENDERERS PER CATEGORY
  // =====================================================

  const renderHRTTable = () => (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('patient_name')}>Patient{sortArrow('patient_name')}</th>
          <th style={styles.th}>Phone</th>
          <th style={styles.th}>Program</th>
          <th style={styles.th}>Status</th>
          <th style={styles.th}>Medication / Dosage</th>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('last_pickup_date')}>Last Pickup{sortArrow('last_pickup_date')}</th>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('med_status')}>Med Status{sortArrow('med_status')}</th>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('last_lab_date')}>Last Lab{sortArrow('last_lab_date')}</th>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('lab_status')}>Next Lab Due{sortArrow('lab_status')}</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <tr><td colSpan="9" style={{ ...styles.td, textAlign: 'center', padding: '48px', color: '#999' }}>No patients found</td></tr>
        ) : filtered.map(p => (
          <HRTRow key={p.protocol_id} patient={p} expanded={expandedRow === p.protocol_id}
            onToggle={() => setExpandedRow(expandedRow === p.protocol_id ? null : p.protocol_id)}
            onNavigate={() => router.push(`/admin/patient/${p.patient_id}`)} />
        ))}
      </tbody>
    </table>
  );

  const renderWLTable = () => (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('patient_name')}>Patient{sortArrow('patient_name')}</th>
          <th style={styles.th}>Phone</th>
          <th style={styles.th}>Type</th>
          <th style={styles.th}>Status</th>
          <th style={styles.th}>Medication / Dose</th>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('progress')}>Progress{sortArrow('progress')}</th>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('weight_change')}>Weight{sortArrow('weight_change')}</th>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('last_activity')}>Last Activity{sortArrow('last_activity')}</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <tr><td colSpan="8" style={{ ...styles.td, textAlign: 'center', padding: '48px', color: '#999' }}>No patients found</td></tr>
        ) : filtered.map(p => (
          <WLRow key={p.id} patient={p} expanded={expandedRow === p.id}
            onToggle={() => setExpandedRow(expandedRow === p.id ? null : p.id)}
            onNavigate={() => router.push(`/admin/patient/${p.patient_id}`)} />
        ))}
      </tbody>
    </table>
  );

  const renderPeptideTable = () => (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('patient_name')}>Patient{sortArrow('patient_name')}</th>
          <th style={styles.th}>Phone</th>
          <th style={styles.th}>Medication</th>
          <th style={styles.th}>Dose</th>
          <th style={styles.th}>Progress</th>
          <th style={styles.th}>Delivery</th>
          <th style={styles.th}>Status</th>
          <th style={styles.thAction}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <tr><td colSpan="8" style={{ ...styles.td, textAlign: 'center', padding: '48px', color: '#999' }}>No protocols found</td></tr>
        ) : filtered.map(p => {
          const total = p.duration_days || p.total_sessions || (() => {
            if (p.start_date && p.end_date) {
              const s = new Date(p.start_date + 'T00:00:00');
              const e = new Date(p.end_date + 'T00:00:00');
              return Math.round((e - s) / (1000 * 60 * 60 * 24));
            }
            return null;
          })();
          const current = calculateCurrentDay(p.start_date);
          const isActive = p.status === 'active';
          return (
            <tr key={p.id} style={styles.tr}>
              <td style={styles.td}>
                <Link href={`/admin/patient/${p.patient_id}`} style={styles.patientLink}>
                  {p.patient_name || 'Unknown'}
                </Link>
              </td>
              <td style={styles.td}><span style={{ fontSize: 13 }}>{p.patients?.phone || '\u2014'}</span></td>
              <td style={styles.td}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.medication || p.primary_peptide || '\u2014'}</div>
              </td>
              <td style={styles.td}><span style={{ fontSize: 13 }}>{p.selected_dose || '\u2014'}</span></td>
              <td style={styles.td}>
                {total ? (
                  <div style={styles.progressContainer}>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${Math.min(100, Math.round((current / total) * 100))}%`, background: current > total ? '#22c55e' : '#000' }} />
                    </div>
                    <span style={styles.progressText}>Day {current}{total ? ` / ${total}` : ''}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 13, color: '#666' }}>Ongoing</span>
                )}
              </td>
              <td style={styles.td}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>
                  {(p.delivery_method || 'take_home') === 'take_home' ? 'Take-Home' : 'In-Clinic'}
                </span>
              </td>
              <td style={styles.td}>
                <span style={{
                  ...styles.statusBadge,
                  background: isActive ? '#dcfce7' : '#f3f4f6',
                  color: isActive ? '#166534' : '#666',
                }}>{p.status}</span>
              </td>
              <td style={styles.tdAction}>
                <Link href={`/admin/patient/${p.patient_id}`} style={styles.viewBtn}>View</Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderIVTable = () => (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('patient_name')}>Patient{sortArrow('patient_name')}</th>
          <th style={styles.th}>Phone</th>
          <th style={styles.th}>Type</th>
          <th style={styles.th}>Medication</th>
          <th style={styles.th}>Progress</th>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('start_date')}>Started{sortArrow('start_date')}</th>
          <th style={styles.th}>Status</th>
          <th style={styles.thAction}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <tr><td colSpan="8" style={{ ...styles.td, textAlign: 'center', padding: '48px', color: '#999' }}>No protocols found</td></tr>
        ) : filtered.map(p => {
          const isActive = p.status === 'active';
          const sessions = p.sessions_used || 0;
          const total = p.total_sessions || 0;
          return (
            <tr key={p.id} style={styles.tr}>
              <td style={styles.td}>
                <Link href={`/admin/patient/${p.patient_id}`} style={styles.patientLink}>
                  {p.patient_name || 'Unknown'}
                </Link>
              </td>
              <td style={styles.td}><span style={{ fontSize: 13 }}>{p.patients?.phone || '\u2014'}</span></td>
              <td style={styles.td}>
                <span style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase' }}>
                  {(p.program_type || '').replace(/_/g, ' ')}
                </span>
              </td>
              <td style={styles.td}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.medication || p.program_name || '\u2014'}</div>
              </td>
              <td style={styles.td}>
                {total > 0 ? (
                  <div style={styles.progressContainer}>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${Math.min(100, Math.round((sessions / total) * 100))}%`, background: sessions >= total ? '#22c55e' : '#000' }} />
                    </div>
                    <span style={styles.progressText}>{sessions} / {total}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 13, color: '#666' }}>Ongoing</span>
                )}
              </td>
              <td style={styles.td}>
                <span style={{ fontSize: 13 }}>{formatDate(p.start_date)}</span>
              </td>
              <td style={styles.td}>
                <span style={{
                  ...styles.statusBadge,
                  background: isActive ? '#dcfce7' : '#f3f4f6',
                  color: isActive ? '#166534' : '#666',
                }}>{p.status}</span>
              </td>
              <td style={styles.tdAction}>
                <Link href={`/admin/patient/${p.patient_id}`} style={styles.viewBtn}>View</Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderAllTable = () => (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('patient_name')}>Patient{sortArrow('patient_name')}</th>
          <th style={styles.th}>Category</th>
          <th style={styles.th}>Program</th>
          <th style={styles.th}>Medication</th>
          <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('start_date')}>Started{sortArrow('start_date')}</th>
          <th style={styles.th}>Progress</th>
          <th style={styles.th}>Status</th>
          <th style={styles.thAction}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <tr><td colSpan="8" style={{ ...styles.td, textAlign: 'center', padding: '48px', color: '#999' }}>No protocols found</td></tr>
        ) : filtered.map(protocol => {
          const cat = getCategoryKey(protocol);
          const catStyle = getCategoryStyle(cat);
          const isOngoing = cat === 'hrt';
          const isWeightLoss = cat === 'weight_loss';
          let total;
          if (isWeightLoss) {
            total = protocol.total_sessions || 4;
          } else {
            total = protocol.duration_days || protocol.total_sessions;
            if (!total && protocol.start_date && protocol.end_date) {
              const sp = protocol.start_date.split('-');
              const ep = protocol.end_date.split('-');
              const s = new Date(parseInt(sp[0]), parseInt(sp[1]) - 1, parseInt(sp[2]));
              const e = new Date(parseInt(ep[0]), parseInt(ep[1]) - 1, parseInt(ep[2]));
              total = Math.round((e - s) / (1000 * 60 * 60 * 24));
            }
            if (!total) total = 10;
          }
          const current = isWeightLoss ? (protocol.sessions_used || 0) : calculateCurrentDay(protocol.start_date);
          const isEnded = isOngoing ? false : (isWeightLoss ? current >= total : current > total);
          const isActive = protocol.status === 'active';
          const progress = isOngoing ? 100 : Math.min(100, Math.round((current / total) * 100));

          return (
            <tr key={protocol.id} style={styles.tr}>
              <td style={styles.td}>
                <Link href={`/admin/patient/${protocol.patient_id}`} style={styles.patientLink}>
                  {protocol.patient_name || 'Unknown'}
                </Link>
              </td>
              <td style={styles.td}>
                <span style={{ ...styles.categoryBadge, background: catStyle.bg, color: catStyle.text }}>
                  {catStyle.label}
                </span>
              </td>
              <td style={styles.td}>
                {protocol.program_name || protocol.program_type}
                {cat === 'hrt' && protocol.hrt_type && (
                  <span style={{ fontSize: 11, color: '#7C3AED', marginLeft: 6 }}>
                    ({protocol.hrt_type === 'female' ? 'Female' : 'Male'})
                  </span>
                )}
              </td>
              <td style={styles.td}>
                <div>{protocol.medication || protocol.primary_peptide || protocol.selected_dose || '\u2014'}</div>
                {cat === 'hrt' && (() => {
                  try {
                    const sec = typeof protocol.secondary_medications === 'string'
                      ? JSON.parse(protocol.secondary_medications) : protocol.secondary_medications;
                    if (sec && sec.length > 0) return <div style={{ fontSize: 11, color: '#7C3AED', marginTop: 2 }}>+ {sec.join(', ')}</div>;
                  } catch {}
                  return null;
                })()}
              </td>
              <td style={styles.td}>
                {protocol.start_date ? new Date(protocol.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' }) : '\u2014'}
              </td>
              <td style={styles.td}>
                <div style={styles.progressContainer}>
                  {isOngoing ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#166534' : '#666', background: isActive ? '#dcfce7' : '#f3f4f6', padding: '3px 10px', borderRadius: 0 }}>Ongoing</span>
                  ) : (
                    <>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${progress}%`, background: isEnded ? '#22c55e' : '#000' }} />
                      </div>
                      <span style={styles.progressText}>{isEnded ? `\u2713 ${total}/${total}` : `${current}/${total}`}</span>
                    </>
                  )}
                </div>
              </td>
              <td style={styles.td}>
                <span style={{ ...styles.statusBadge, background: isActive ? '#dcfce7' : protocol.status === 'exchanged' ? '#fef3c7' : '#f3f4f6', color: isActive ? '#166534' : protocol.status === 'exchanged' ? '#92400e' : '#666' }}>
                  {protocol.status === 'exchanged' ? '\ud83d\udd04 exchanged' : protocol.status}
                </span>
              </td>
              <td style={styles.tdAction}>
                <div style={styles.actionGroup}>
                  <Link href={`/admin/patient/${protocol.patient_id}`} style={styles.viewBtn}>View</Link>
                  <button onClick={() => setDeleteTarget(protocol)} style={styles.deleteBtn}>\ud83d\uddd1\ufe0f</button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderTable = () => {
    if (activeTab === 'hrt') return renderHRTTable();
    if (activeTab === 'weight_loss') return renderWLTable();
    if (activeTab === 'peptide') return renderPeptideTable();
    if (activeTab === 'iv') return renderIVTable();
    return renderAllTable();
  };

  // =====================================================
  // RENDER
  // =====================================================
  const activeCount = activeTab === 'all' ? (summary.active || 0) : (data.filter(p => (p.status || p._status) === 'active' || (activeTab === 'weight_loss' && p._status !== 'complete')).length);
  const totalCount = data.length;

  return (
    <AdminLayout title={`Protocols (${activeCount} active / ${totalCount} total)`}>
      {/* Category Tabs */}
      <div style={styles.categoryBar}>
        {CATEGORY_TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const catStyle = tab.key !== 'all' ? getCategoryStyle(tab.key === 'iv' ? 'iv' : tab.key) : null;
          const count = tab.key === 'all' ? (summary.active || Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 0)
            : (categoryCounts[tab.key] || (isActive ? (summary.active || 0) : 0));
          return (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              style={{
                ...styles.categoryTab,
                background: isActive ? (catStyle ? catStyle.bg : '#000') : '#fff',
                color: isActive ? (catStyle ? catStyle.text : '#fff') : '#666',
                border: isActive ? `1px solid ${catStyle ? catStyle.text : '#000'}` : '1px solid #e5e5e5',
                fontWeight: isActive ? '600' : '500',
              }}>
              {tab.label}
              {count > 0 && <span style={{ marginLeft: 6, fontSize: 11, opacity: isActive ? 1 : 0.6 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Stat Cards */}
      {renderStatCards()}

      {/* Search + Sub-Filters */}
      <div style={styles.toolbar}>
        <input type="text" placeholder="Search by name, phone, or medication..."
          value={search} onChange={e => setSearch(e.target.value)} style={styles.searchInput} />
        <button onClick={() => fetchData(activeTab)} style={styles.refreshBtn}>Refresh</button>
      </div>

      <div style={styles.subTabs}>
        {getSubTabs().map(tab => (
          <button key={tab.key} onClick={() => setSubFilter(tab.key)}
            style={{
              ...styles.subTabBtn,
              background: subFilter === tab.key ? '#000' : '#fff',
              color: subFilter === tab.key ? '#fff' : '#333',
              border: subFilter === tab.key ? '1px solid #000' : '1px solid #ddd',
            }}>
            {tab.label}
            <span style={{
              ...styles.subTabCount,
              background: subFilter === tab.key ? 'rgba(255,255,255,0.2)' : (tab.color || '#e5e5e5'),
              color: subFilter === tab.key ? '#fff' : (tab.color ? '#fff' : '#666'),
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loading}>Loading protocols...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {renderTable()}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <>
          <div onClick={() => !deleting && setDeleteTarget(null)} style={styles.overlay} />
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Delete Protocol</h3>
            <p style={styles.modalText}>Are you sure you want to delete the protocol for <strong>{deleteTarget.patient_name || 'Unknown'}</strong>?</p>
            <p style={styles.modalDetail}>{deleteTarget.program_name || deleteTarget.program_type} \u00b7 Started {deleteTarget.start_date ? new Date(deleteTarget.start_date + 'T12:00:00').toLocaleDateString() : 'N/A'}</p>
            <p style={styles.modalWarning}>This will also delete all injection logs and unlink any purchases. This cannot be undone.</p>
            <div style={styles.modalActions}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={styles.confirmDeleteBtn}>{deleting ? 'Deleting...' : 'Delete Protocol'}</button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

// =====================================================
// HRT ROW COMPONENT
// =====================================================
function HRTRow({ patient: p, expanded, onToggle, onNavigate }) {
  const getStatusBadge = (status) => {
    const map = {
      active: { bg: '#dcfce7', color: '#166534' },
      completed: { bg: '#e5e5e5', color: '#666' },
      cancelled: { bg: '#fee2e2', color: '#991b1b' },
      paused: { bg: '#fef3c7', color: '#92400e' },
    };
    const s = map[status] || map.completed;
    return <span style={{ ...sharedStyles.badge, background: s.bg, color: s.color }}>{status}</span>;
  };

  const getLabBadge = () => {
    if (p.lab_status === 'n/a') return <span style={{ color: '#999', fontSize: 12 }}>N/A</span>;
    const map = {
      overdue: { bg: '#fee2e2', color: '#991b1b', label: 'OVERDUE' },
      due_soon: { bg: '#fef3c7', color: '#92400e', label: 'DUE SOON' },
      on_track: { bg: '#dcfce7', color: '#166534', label: 'On Track' },
      no_data: { bg: '#f3f4f6', color: '#666', label: 'No Data' },
    };
    const s = map[p.lab_status] || map.no_data;
    return (
      <div>
        <span style={{ ...sharedStyles.badge, background: s.bg, color: s.color }}>{s.label}</span>
        {p.next_draw_target && (
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            {p.next_draw_label}: {formatDate(p.next_draw_target)}<br />
            <span style={{ color: p.lab_status === 'overdue' ? '#ef4444' : '#999' }}>{daysUntil(p.next_draw_target)}</span>
          </div>
        )}
      </div>
    );
  };

  const getMedBadge = () => {
    if (p.med_status === 'n/a') return <span style={{ color: '#999', fontSize: 12 }}>N/A</span>;
    const map = {
      overdue: { bg: '#fee2e2', color: '#991b1b', label: 'OVERDUE' },
      due_soon: { bg: '#fef3c7', color: '#92400e', label: 'DUE SOON' },
      on_track: { bg: '#dcfce7', color: '#166534', label: 'On Track' },
      no_data: { bg: '#f3f4f6', color: '#666', label: 'No Data' },
    };
    const s = map[p.med_status] || map.no_data;
    return (
      <div>
        <span style={{ ...sharedStyles.badge, background: s.bg, color: s.color }}>{s.label}</span>
        {p.next_expected_date && (
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Next: {formatDate(p.next_expected_date)}</div>
        )}
      </div>
    );
  };

  return (
    <>
      <tr style={{ ...styles.trHover, background: expanded ? '#f9fafb' : undefined }} onClick={onToggle}>
        <td style={styles.td}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.patient_name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{p.patient_email}</div>
        </td>
        <td style={styles.td}><span style={{ fontSize: 13 }}>{p.patient_phone || '\u2014'}</span></td>
        <td style={styles.td}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>HRT ({p.hrt_type === 'female' ? 'Female' : 'Male'})</span>
          {p.program_week != null && p.status === 'active' && (
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Week {p.program_week}</div>
          )}
          {p.range_iv && (
            <div style={{ fontSize: 10, marginTop: 3, padding: '1px 6px', borderRadius: 0, display: 'inline-block',
              background: p.range_iv === 'available' ? '#dcfce7' : p.range_iv === 'used' ? '#f3f4f6' : '#fef3c7',
              color: p.range_iv === 'available' ? '#166534' : p.range_iv === 'used' ? '#6b7280' : '#92400e' }}>
              IV {p.range_iv === 'available' ? 'available' : p.range_iv === 'used' ? 'used' : 'expired'}
            </div>
          )}
        </td>
        <td style={styles.td}>{getStatusBadge(p.status)}</td>
        <td style={styles.td}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{p.medication || '\u2014'}</div>
          {p.current_dose && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{p.current_dose}</div>}
          {Array.isArray(p.secondary_medications) && p.secondary_medications.length > 0 && (
            <div style={{ fontSize: 11, color: '#7C3AED', marginTop: 3 }}>+ {(Array.isArray(p.secondary_medications) ? p.secondary_medications : []).join(', ')}</div>
          )}
        </td>
        <td style={styles.td}>
          <div style={{ fontSize: 13 }}>{formatDate(p.last_pickup_date)}</div>
          {p.last_pickup_date && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{daysAgo(p.last_pickup_date)}</div>}
        </td>
        <td style={styles.td}>{getMedBadge()}</td>
        <td style={styles.td}>
          <div style={{ fontSize: 13 }}>{formatDate(p.last_lab_date)}</div>
          {p.last_lab_date && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{daysAgo(p.last_lab_date)}</div>}
        </td>
        <td style={styles.td}>{getLabBadge()}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="9" style={{ padding: 0, borderBottom: '1px solid #e5e5e5' }}>
            <div style={styles.expandedPanel}>
              <div style={styles.expandedGrid}>
                <div>
                  <div style={styles.expandedLabel}>Patient Details</div>
                  <div style={styles.expandedDetail}>DOB: {formatDate(p.patient_dob)}</div>
                  <div style={styles.expandedDetail}>Gender: {p.gender || '\u2014'}</div>
                  <div style={styles.expandedDetail}>Started: {formatDate(p.start_date)}</div>
                  {p.delivery_method && <div style={styles.expandedDetail}>Delivery: {p.delivery_method.replace(/_/g, ' ')}</div>}
                  {p.supply_type && <div style={styles.expandedDetail}>Supply: {p.supply_type.replace(/_/g, ' ')}</div>}
                  {Array.isArray(p.secondary_medications) && p.secondary_medications.length > 0 && (
                    <div style={styles.expandedDetail}>Secondary Meds: {(Array.isArray(p.secondary_medications) ? p.secondary_medications : []).join(', ')}</div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                    style={{ ...sharedStyles.btnPrimary, ...sharedStyles.btnSmall, marginTop: 8 }}>View Patient</button>
                </div>
                <div>
                  <div style={styles.expandedLabel}>Lab Schedule</div>
                  {p.schedule && p.schedule.length > 0 ? (
                    p.schedule.map((draw, i) => {
                      const color = draw.status === 'completed' ? '#22c55e' : draw.status === 'overdue' ? '#ef4444' : draw.status === 'skipped' ? '#d1d5db' : '#9ca3af';
                      return (
                        <div key={i} style={{ ...styles.expandedDetail, display: 'flex', gap: 8, alignItems: 'center', opacity: draw.status === 'skipped' ? 0.5 : 1 }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontWeight: 500, fontSize: 13, color: draw.status === 'skipped' ? '#9ca3af' : '#374151', minWidth: 100 }}>{draw.label}</span>
                          <span style={{ fontSize: 13, color: '#6b7280' }}>{draw.weekLabel}</span>
                          {draw.status === 'completed' && draw.completedDate && (
                            <span style={{ color: '#22c55e', marginLeft: 'auto', fontSize: 12, fontWeight: 500 }}>\u2713 {formatDate(draw.completedDate)}</span>
                          )}
                          {draw.status === 'overdue' && <span style={{ color: '#ef4444', marginLeft: 'auto', fontSize: 12, fontWeight: 500 }}>Overdue</span>}
                          {draw.status === 'skipped' && <span style={{ color: '#9ca3af', marginLeft: 'auto', fontSize: 12 }}>Skipped</span>}
                          {draw.status === 'upcoming' && <span style={{ color: '#9ca3af', marginLeft: 'auto', fontSize: 12 }}>Upcoming</span>}
                        </div>
                      );
                    })
                  ) : <div style={styles.expandedDetail}>No schedule available</div>}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// =====================================================
// WEIGHT LOSS ROW COMPONENT
// =====================================================
function WLRow({ patient: p, expanded, onToggle, onNavigate }) {
  const cfg = STATUS_CONFIG[p._status] || STATUS_CONFIG.on_track;
  const weightChange = (p.current_weight && p.starting_weight) ? (p.current_weight - p.starting_weight) : null;
  const progressPct = p.total_injections > 0 ? Math.round((p.injections_used / p.total_injections) * 100) : 0;

  return (
    <>
      <tr style={{ ...styles.trHover, background: expanded ? '#f9fafb' : undefined, opacity: p._status === 'complete' ? 0.55 : 1 }} onClick={onToggle}>
        <td style={styles.td}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>
            {p.patient_name || 'Unknown'}
            {p.preferred_name && p.preferred_name !== p.patient_first_name && (
              <span style={{ color: '#888', fontWeight: 400 }}> ({'\u201C'}{p.preferred_name}{'\u201D'})</span>
            )}
          </div>
        </td>
        <td style={styles.td}><span style={{ fontSize: 13 }}>{p.phone || '\u2014'}</span></td>
        <td style={styles.td}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            {(p.delivery_method || 'take_home') === 'take_home' ? 'Take-Home' : 'In-Clinic'}
          </span>
        </td>
        <td style={styles.td}>
          <span style={{ ...sharedStyles.badge, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        </td>
        <td style={styles.td}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{p.medication || '\u2014'}</div>
          {p.current_dose && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{p.current_dose}</div>}
        </td>
        <td style={styles.td}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{p.injections_used} / {p.total_injections}</div>
          <div style={styles.progressBarWL}>
            <div style={{ ...styles.progressFillWL, width: `${Math.min(progressPct, 100)}%` }} />
          </div>
        </td>
        <td style={styles.td}>
          {weightChange !== null ? (
            <div>
              <span style={{ fontWeight: 600, color: weightChange < 0 ? '#16a34a' : weightChange > 0 ? '#dc2626' : '#666' }}>
                {weightChange < 0 ? '' : '+'}{weightChange.toFixed(1)} lbs
              </span>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{p.current_weight} lbs</div>
            </div>
          ) : <span style={{ color: '#999' }}>\u2014</span>}
        </td>
        <td style={styles.td}>
          <div style={{ fontSize: 13 }}>{formatDate(p.last_activity)}</div>
          {p.last_activity && (
            <div style={{ fontSize: 11, color: p._status === 'overdue' ? '#ef4444' : '#999', marginTop: 2, fontWeight: p._status === 'overdue' ? 600 : 400 }}>
              {daysAgo(p.last_activity)}
            </div>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="8" style={{ padding: 0, borderBottom: '1px solid #e5e5e5' }}>
            <div style={styles.expandedPanel}>
              <div style={styles.expandedGrid}>
                <div>
                  <div style={styles.expandedLabel}>Patient Details</div>
                  <div style={styles.expandedDetail}>Started: {formatDate(p.start_date)}</div>
                  <div style={styles.expandedDetail}>Delivery: {(p.delivery_method || 'take_home').replace(/_/g, ' ')}</div>
                  {p.starting_weight && <div style={styles.expandedDetail}>Starting Weight: {p.starting_weight} lbs</div>}
                  {p.current_weight && <div style={styles.expandedDetail}>Current Weight: {p.current_weight} lbs</div>}
                  {p.next_expected_date && <div style={styles.expandedDetail}>Next Refill: {formatDate(p.next_expected_date)}</div>}
                  <button onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                    style={{ ...sharedStyles.btnPrimary, ...sharedStyles.btnSmall, marginTop: 8 }}>View Patient</button>
                </div>
                <div>
                  <div style={styles.expandedLabel}>Protocol Progress</div>
                  <div style={styles.expandedDetail}>Medication: {p.medication || '\u2014'} {p.current_dose ? `(${p.current_dose})` : ''}</div>
                  <div style={styles.expandedDetail}>Injections: {p.injections_used} of {p.total_injections} ({progressPct}%)</div>
                  <div style={styles.expandedDetail}>Remaining: {p.injections_remaining || 0}</div>
                  {weightChange !== null && (
                    <div style={{ ...styles.expandedDetail, marginTop: 8 }}>
                      <span style={{ fontWeight: 600, color: weightChange < 0 ? '#16a34a' : weightChange > 0 ? '#dc2626' : '#666' }}>
                        Total Change: {weightChange < 0 ? '' : '+'}{weightChange.toFixed(1)} lbs
                      </span>
                      <span style={{ color: '#999', marginLeft: 8 }}>({p.starting_weight} \u2192 {p.current_weight})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// =====================================================
// STYLES
// =====================================================
const styles = {
  categoryBar: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  categoryTab: { padding: '7px 16px', borderRadius: 0, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { padding: '20px', background: '#fff', borderRadius: 0, border: '1px solid #e5e5e5' },
  statValue: { fontSize: '32px', fontWeight: '700', lineHeight: 1 },
  statLabel: { fontSize: '12px', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  toolbar: { display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' },
  searchInput: { flex: 1, maxWidth: '400px', padding: '10px 14px', border: '1px solid #e5e5e5', borderRadius: 0, fontSize: '14px', background: '#fff' },
  refreshBtn: { padding: '10px 16px', border: '1px solid #e5e5e5', borderRadius: 0, background: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  subTabs: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  subTabBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 0, fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s' },
  subTabCount: { padding: '2px 7px', borderRadius: 0, fontSize: '11px', fontWeight: '600' },
  tableCard: { background: '#fff', borderRadius: 0, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  loading: { padding: '40px', textAlign: 'center', color: '#666' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#666', borderBottom: '1px solid #e5e5e5', background: '#fafafa' },
  thAction: { textAlign: 'right', padding: '12px 16px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#666', borderBottom: '1px solid #e5e5e5', background: '#fafafa', width: '120px' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  trHover: { borderBottom: '1px solid #f0f0f0', cursor: 'pointer', transition: 'background 0.1s' },
  td: { padding: '12px 16px', fontSize: '14px', verticalAlign: 'middle' },
  tdAction: { padding: '12px 16px', fontSize: '14px', textAlign: 'right', verticalAlign: 'middle', width: '120px' },
  patientLink: { fontWeight: '600', color: '#111', textDecoration: 'none', fontSize: '14px' },
  categoryBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: 0, fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' },
  progressContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
  progressBar: { width: '80px', height: '6px', background: '#e5e5e5', borderRadius: 0, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 0, transition: 'width 0.3s' },
  progressBarWL: { width: '80px', height: '6px', background: '#f0f0f0', borderRadius: 0, overflow: 'hidden' },
  progressFillWL: { height: '100%', background: '#8b5cf6', borderRadius: 0, transition: 'width 0.3s ease' },
  progressText: { fontSize: '12px', color: '#666', whiteSpace: 'nowrap' },
  statusBadge: { display: 'inline-block', padding: '4px 10px', borderRadius: 0, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' },
  actionGroup: { display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' },
  viewBtn: { display: 'inline-block', padding: '6px 14px', background: '#000', color: '#fff', borderRadius: 0, fontSize: '12px', fontWeight: '500', textDecoration: 'none', whiteSpace: 'nowrap', lineHeight: '1.4' },
  deleteBtn: { padding: '4px 8px', background: 'transparent', border: '1px solid #e5e5e5', borderRadius: 0, fontSize: '14px', cursor: 'pointer', lineHeight: 1 },
  expandedPanel: { padding: '20px 24px', background: '#fafafa', borderTop: '1px solid #e5e5e5' },
  expandedGrid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' },
  expandedLabel: { fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', marginBottom: '8px' },
  expandedDetail: { fontSize: '13px', color: '#333', marginBottom: '4px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000 },
  modal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', borderRadius: 0, padding: '24px', zIndex: 10001, width: '90%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle: { margin: '0 0 12px', fontSize: '18px', fontWeight: '700' },
  modalText: { margin: '0 0 8px', fontSize: '14px', color: '#374151' },
  modalDetail: { margin: '0 0 12px', fontSize: '13px', color: '#6b7280' },
  modalWarning: { margin: '0 0 20px', fontSize: '13px', color: '#dc2626', background: '#fee2e2', padding: '10px 12px', borderRadius: 0 },
  modalActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 0, background: '#fff', cursor: 'pointer', fontSize: '14px' },
  confirmDeleteBtn: { padding: '8px 20px', border: 'none', borderRadius: 0, background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};
