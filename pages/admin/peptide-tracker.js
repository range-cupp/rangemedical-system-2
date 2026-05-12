import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { sharedStyles } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

function formatPhone(raw) {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  return raw;
}

export default function PeptideTracker() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState([]);
  const [lapsed, setLapsed] = useState([]);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState('ending-soon');
  const [search, setSearch] = useState('');
  const [lapsedFilter, setLapsedFilter] = useState('all');

  // Drawer state
  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerProtocol, setDrawerProtocol] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteStatus, setNoteStatus] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/peptide-tracker');
      const data = await res.json();
      setActive(data.active || []);
      setLapsed(data.lapsed || []);
      setStats(data.stats || {});
    } catch (err) {
      console.error('Failed to load peptide tracker:', err);
    }
    setLoading(false);
  }

  function openDrawer(protocol) {
    if (!protocol.patient_id) return;
    setDrawerProtocol(protocol);
    setDrawerLoading(true);
    setDrawerData(null);
    fetch(`/api/patients/${protocol.patient_id}`)
      .then(r => r.json())
      .then(data => { setDrawerData(data); setDrawerLoading(false); })
      .catch(() => setDrawerLoading(false));
  }

  function closeDrawer() {
    setDrawerData(null);
    setDrawerLoading(false);
    setDrawerProtocol(null);
    setNoteText('');
    setNoteSaving(false);
    setNoteStatus(null);
  }

  async function saveNote() {
    const pt = drawerData?.patient;
    if (!pt?.id || !noteText.trim()) return;
    setNoteSaving(true);
    setNoteStatus(null);
    try {
      const staffName = session?.user?.user_metadata?.full_name || session?.user?.email || 'Staff';
      const res = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: pt.id,
          body: noteText.trim(),
          created_by: staffName,
          note_category: 'internal',
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setNoteText('');
      setNoteStatus({ ok: true, msg: 'Note saved' });
      // Refresh drawer to show the new note
      fetch(`/api/patients/${pt.id}`)
        .then(r => r.json())
        .then(data => setDrawerData(data))
        .catch(() => {});
    } catch (err) {
      setNoteStatus({ ok: false, msg: 'Failed to save note' });
    }
    setNoteSaving(false);
  }

  function getUrgencyStyle(daysRemaining) {
    if (daysRemaining <= 0) return { background: '#fef2f2', color: '#991b1b', fontWeight: '600' };
    if (daysRemaining <= 3) return { background: '#fff7ed', color: '#9a3412', fontWeight: '600' };
    if (daysRemaining <= 7) return { background: '#fefce8', color: '#854d0e' };
    return { background: '#f0fdf4', color: '#166534' };
  }

  function getLapsedUrgencyStyle(daysSince) {
    if (daysSince <= 7) return { background: '#fef2f2', color: '#991b1b', fontWeight: '600' };
    if (daysSince <= 14) return { background: '#fff7ed', color: '#9a3412', fontWeight: '600' };
    if (daysSince <= 30) return { background: '#fefce8', color: '#854d0e' };
    return { background: '#f5f5f5', color: '#666' };
  }

  function getDurationLabel(days) {
    if (days <= 12) return '10-day';
    if (days <= 22) return '20-day';
    if (days <= 35) return '30-day';
    return `${days}d`;
  }

  function deduplicateByPatient(protocols) {
    const byPatient = {};
    protocols.forEach(p => {
      const key = p.patient_id;
      if (!byPatient[key] || p.days_remaining < byPatient[key].days_remaining) {
        byPatient[key] = { ...p };
      }
      byPatient[key].activeCount = (byPatient[key].activeCount || 0) + 1;
    });
    return Object.values(byPatient);
  }

  const filteredActive = deduplicateByPatient(active)
    .filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (p.patient_name || '').toLowerCase().includes(s) ||
             (p.medication || '').toLowerCase().includes(s);
    });

  const filteredLapsed = lapsed
    .filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (p.patient_name || '').toLowerCase().includes(s) ||
             (p.medication || '').toLowerCase().includes(s);
    })
    .filter(p => {
      if (lapsedFilter === 'all') return true;
      if (lapsedFilter === '7') return p.days_since_ended <= 7;
      if (lapsedFilter === '14') return p.days_since_ended <= 14;
      if (lapsedFilter === '30') return p.days_since_ended <= 30;
      if (lapsedFilter === 'repeat') return p.total_protocols > 1;
      return true;
    });

  const sectionHead = { margin: '0 0 10px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' };
  const drawerCard = { background: '#f9fafb', borderRadius: '0', padding: '14px 16px', marginBottom: '16px' };

  function renderRow(p, isLapsed) {
    return (
      <tr
        key={p.id}
        style={sharedStyles.trHover}
        onClick={() => openDrawer(p)}
        onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
        onMouseLeave={e => e.currentTarget.style.background = ''}
      >
        <td style={sharedStyles.td}>
          <span style={{ fontWeight: '600', color: '#000' }}>
            {p.patient_name || 'Unknown'}
          </span>
          {!isLapsed && p.activeCount > 1 && (
            <span style={{ fontSize: '12px', color: '#666', marginLeft: '6px' }}>
              ({p.activeCount} active)
            </span>
          )}
        </td>
        <td style={sharedStyles.td}>
          <span style={{ fontSize: '15px' }}>{p.medication || '—'}</span>
        </td>
        <td style={sharedStyles.td}>
          <span style={{
            ...sharedStyles.badge,
            background: '#f5f5f5',
            color: '#333',
            fontSize: '12px',
          }}>
            {getDurationLabel(p.duration_days)}
          </span>
        </td>
        <td style={sharedStyles.td}>
          {p.end_date ? new Date(p.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
        </td>
        <td style={sharedStyles.td}>
          {isLapsed ? (
            <span style={{
              ...sharedStyles.badge,
              ...getLapsedUrgencyStyle(p.days_since_ended),
              fontSize: '13px',
            }}>
              {p.days_since_ended} {p.days_since_ended === 1 ? 'day' : 'days'} ago
            </span>
          ) : (
            <span style={{
              ...sharedStyles.badge,
              ...getUrgencyStyle(p.days_remaining),
              fontSize: '13px',
            }}>
              {p.days_remaining <= 0 ? 'TODAY' : p.days_remaining === 1 ? '1 day' : `${p.days_remaining} days`}
            </span>
          )}
        </td>
        <td style={sharedStyles.td}>
          <span style={{ fontSize: '14px', color: p.total_protocols > 1 ? '#166534' : '#666' }}>
            {p.total_protocols === 1 ? '1st protocol' : `${p.total_protocols} protocols`}
          </span>
        </td>
        {isLapsed && (
          <td style={sharedStyles.td}>
            {p.last_note_date ? (
              <span style={{
                ...sharedStyles.badge,
                background: '#dbeafe', color: '#1e40af',
                fontSize: '12px',
              }}>
                Noted {new Date(p.last_note_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {p.last_note_by ? ` · ${p.last_note_by.split(' ')[0]}` : ''}
              </span>
            ) : (
              <span style={{ fontSize: '13px', color: '#999' }}>—</span>
            )}
          </td>
        )}
      </tr>
    );
  }

  // Get peptide protocols from drawer data
  function getDrawerPeptideProtocols() {
    if (!drawerData) return [];
    const all = [
      ...(drawerData.activeProtocols || []),
      ...(drawerData.completedProtocols || []),
    ];
    return all.filter(p => {
      const pt = (p.program_type || '').toLowerCase();
      const pn = (p.program_name || '').toLowerCase();
      const med = (p.medication || '').toLowerCase();
      return pt === 'peptide' || pn.includes('peptide') || med.includes('bpc') || med.includes('tb4') || med.includes('tb-500') || med.includes('wolverine') || med.includes('glow') || med.includes('klow') || med.includes('ghk') || med.includes('mots') || med.includes('blend');
    }).sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));
  }

  return (
    <AdminLayout title="Peptide Tracker">
      <div style={sharedStyles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={sharedStyles.pageTitle}>Peptide Tracker</h1>
            <p style={sharedStyles.pageSubtitle}>Follow-up cadence for active and recently completed peptide patients</p>
          </div>
          <button onClick={loadData} style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={sharedStyles.loading}>Loading tracker data...</div>
      ) : (
        <>
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div style={sharedStyles.statCard}>
              <div style={{ ...sharedStyles.statValue, color: '#000' }}>{stats.totalActive || 0}</div>
              <div style={sharedStyles.statLabel}>Active Protocols</div>
            </div>
            <div style={sharedStyles.statCard}>
              <div style={{ ...sharedStyles.statValue, color: '#dc2626' }}>{stats.endingThisWeek || 0}</div>
              <div style={sharedStyles.statLabel}>Ending This Week</div>
            </div>
            <div style={sharedStyles.statCard}>
              <div style={{ ...sharedStyles.statValue, color: '#ea580c' }}>{stats.endingNextWeek || 0}</div>
              <div style={sharedStyles.statLabel}>Ending Next Week</div>
            </div>
            <div style={sharedStyles.statCard}>
              <div style={{ ...sharedStyles.statValue, color: '#854d0e' }}>{stats.totalLapsed || 0}</div>
              <div style={sharedStyles.statLabel}>Need Follow-Up</div>
            </div>
            <div style={sharedStyles.statCard}>
              <div style={{ ...sharedStyles.statValue, color: '#991b1b' }}>{stats.lapsedUnder14 || 0}</div>
              <div style={sharedStyles.statLabel}>Lapsed {'<'} 14 Days</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '1px solid #e5e5e5' }}>
            {[
              { key: 'ending-soon', label: `Ending Soon (${filteredActive.length})` },
              { key: 'follow-up', label: `Follow Up (${filteredLapsed.length})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '14px 24px',
                  fontSize: '15px',
                  fontWeight: tab === t.key ? '600' : '400',
                  color: tab === t.key ? '#000' : '#666',
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t.key ? '2px solid #000' : '2px solid transparent',
                  cursor: 'pointer',
                  marginBottom: '-1px',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search + Filter Bar */}
          <div style={sharedStyles.filterBar}>
            <input
              type="text"
              placeholder="Search by name or medication..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={sharedStyles.searchInput}
            />
            {tab === 'follow-up' && (
              <select
                value={lapsedFilter}
                onChange={e => setLapsedFilter(e.target.value)}
                style={sharedStyles.select}
              >
                <option value="all">All Lapsed</option>
                <option value="7">Ended within 7 days</option>
                <option value="14">Ended within 14 days</option>
                <option value="30">Ended within 30 days</option>
                <option value="repeat">Repeat buyers only</option>
              </select>
            )}
          </div>

          {/* Ending Soon Tab */}
          {tab === 'ending-soon' && (
            <div style={sharedStyles.card}>
              <div style={sharedStyles.cardHeader}>
                <h3 style={sharedStyles.cardTitle}>Active Peptide Protocols</h3>
              </div>
              {filteredActive.length === 0 ? (
                <div style={sharedStyles.emptyState}>
                  <div style={sharedStyles.emptyText}>No active peptide protocols found</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={sharedStyles.table}>
                    <thead>
                      <tr>
                        <th style={sharedStyles.th}>Patient</th>
                        <th style={sharedStyles.th}>Medication</th>
                        <th style={sharedStyles.th}>Duration</th>
                        <th style={sharedStyles.th}>End Date</th>
                        <th style={sharedStyles.th}>Days Left</th>
                        <th style={sharedStyles.th}>History</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActive.map(p => renderRow(p, false))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Follow Up Tab */}
          {tab === 'follow-up' && (
            <div style={sharedStyles.card}>
              <div style={sharedStyles.cardHeader}>
                <h3 style={sharedStyles.cardTitle}>Recently Completed — No Active Protocol</h3>
              </div>
              {filteredLapsed.length === 0 ? (
                <div style={sharedStyles.emptyState}>
                  <div style={sharedStyles.emptyText}>No lapsed patients matching filter</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={sharedStyles.table}>
                    <thead>
                      <tr>
                        <th style={sharedStyles.th}>Patient</th>
                        <th style={sharedStyles.th}>Last Medication</th>
                        <th style={sharedStyles.th}>Last Duration</th>
                        <th style={sharedStyles.th}>Ended</th>
                        <th style={sharedStyles.th}>Days Since</th>
                        <th style={sharedStyles.th}>History</th>
                        <th style={sharedStyles.th}>Follow-Up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLapsed.map(p => renderRow(p, true))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Patient Drawer */}
      {(drawerProtocol || drawerLoading) && (() => {
        const pt = drawerData?.patient;
        const peptideProtos = getDrawerPeptideProtocols();

        return (
          <>
            <div onClick={closeDrawer} style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 9998
            }} />
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '440px', maxWidth: '92vw',
              background: '#fff', zIndex: 9999, boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#000', flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#fff' }}>
                  {pt ? `${pt.first_name} ${pt.last_name}` : (drawerProtocol?.patient_name || 'Patient')}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {(pt || drawerProtocol?.patient_id) && (
                    <a href={`/admin/patient/${pt?.id || drawerProtocol?.patient_id}`}
                      style={{ fontSize: '12px', color: '#fff', textDecoration: 'none', padding: '4px 12px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '0' }}>
                      Full Profile →
                    </a>
                  )}
                  <button onClick={closeDrawer}
                    style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#fff', padding: '0 4px', lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {drawerLoading && !pt ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>Loading patient...</div>
                ) : pt ? (
                  <>
                    {/* Demographics */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '13px', color: '#666' }}>
                        {pt.date_of_birth && (
                          <span style={{ background: '#f3f4f6', padding: '3px 8px' }}>
                            DOB: {new Date(pt.date_of_birth + 'T12:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                          </span>
                        )}
                        {pt.gender && <span style={{ background: '#f3f4f6', padding: '3px 8px' }}>{pt.gender}</span>}
                        {pt.created_at && (
                          <span style={{ background: '#f3f4f6', padding: '3px 8px' }}>
                            Since {new Date(pt.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact */}
                    <div style={drawerCard}>
                      <h4 style={sectionHead}>Contact</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {pt.phone ? (
                          <a href={`tel:${pt.phone}`} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            fontSize: '20px', fontWeight: '600', color: '#000',
                            textDecoration: 'none', padding: '12px 16px',
                            background: '#fff', border: '1px solid #e5e7eb',
                          }}>
                            <span style={{ fontSize: '20px' }}>📞</span>
                            {formatPhone(pt.phone)}
                          </a>
                        ) : <span style={{ fontSize: '13px', color: '#bbb' }}>No phone on file</span>}
                        {pt.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>✉️</span>
                            <a href={`mailto:${pt.email}`} style={{ fontSize: '14px', color: '#111', textDecoration: 'none' }}>{pt.email}</a>
                          </div>
                        ) : <span style={{ fontSize: '13px', color: '#bbb' }}>No email on file</span>}
                        {pt.phone && (
                          <a href={`sms:${pt.phone}`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontSize: '13px', color: '#2563eb', textDecoration: 'none',
                            padding: '8px 14px', border: '1px solid #dbeafe', background: '#eff6ff',
                            width: 'fit-content',
                          }}>
                            💬 Send Text
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Add Follow-Up Note */}
                    <div style={drawerCard}>
                      <h4 style={sectionHead}>Follow-Up Note</h4>
                      <textarea
                        value={noteText}
                        onChange={e => { setNoteText(e.target.value); setNoteStatus(null); }}
                        placeholder={`Add a follow-up note for ${pt.first_name}...`}
                        rows={3}
                        style={{
                          width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                          border: '1px solid #d1d5db', borderRadius: 0, fontSize: '14px',
                          fontFamily: 'inherit', resize: 'vertical', background: '#fff',
                          lineHeight: '1.5',
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: noteStatus ? (noteStatus.ok ? '#16a34a' : '#dc2626') : '#aaa' }}>
                          {noteStatus ? noteStatus.msg : 'Saves to Staff Notes'}
                        </span>
                        <button
                          onClick={saveNote}
                          disabled={!noteText.trim() || noteSaving}
                          style={{
                            padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                            background: !noteText.trim() || noteSaving ? '#9ca3af' : '#000',
                            color: '#fff', border: 'none', borderRadius: 0,
                            cursor: !noteText.trim() || noteSaving ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {noteSaving ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </div>

                    {/* Recent Staff Notes */}
                    {drawerData.notes && drawerData.notes.length > 0 && (
                      <div style={drawerCard}>
                        <h4 style={sectionHead}>Recent Notes ({Math.min(drawerData.notes.length, 5)})</h4>
                        {drawerData.notes.slice(0, 5).map((note, i) => (
                          <div key={note.id || i} style={{ padding: '8px 0', borderBottom: i < Math.min(drawerData.notes.length, 5) - 1 ? '1px solid #e5e7eb' : 'none' }}>
                            <div style={{ fontSize: '13px', color: '#111', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                              {(note.body || '').replace(/<[^>]+>/g, '').slice(0, 200)}
                              {(note.body || '').length > 200 ? '...' : ''}
                            </div>
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                              {note.created_by || 'Staff'}
                              {' · '}
                              {note.note_date ? new Date(note.note_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Current Protocol Context */}
                    {drawerProtocol && (
                      <div style={drawerCard}>
                        <h4 style={sectionHead}>
                          {drawerProtocol.days_remaining != null ? 'Current Protocol' : 'Last Protocol'}
                        </h4>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '6px' }}>
                          {drawerProtocol.medication || '—'}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666', flexWrap: 'wrap' }}>
                          <span>{getDurationLabel(drawerProtocol.duration_days)} protocol</span>
                          {drawerProtocol.start_date && (
                            <span>Started {new Date(drawerProtocol.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          )}
                          {drawerProtocol.end_date && (
                            <span>
                              {drawerProtocol.days_remaining != null && drawerProtocol.days_remaining >= 0
                                ? `Ends ${new Date(drawerProtocol.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                : `Ended ${new Date(drawerProtocol.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                              }
                            </span>
                          )}
                        </div>
                        {drawerProtocol.days_remaining != null && (
                          <div style={{ marginTop: '10px' }}>
                            <span style={{
                              ...sharedStyles.badge,
                              ...getUrgencyStyle(drawerProtocol.days_remaining),
                              fontSize: '13px',
                            }}>
                              {drawerProtocol.days_remaining <= 0 ? 'Ends today' : `${drawerProtocol.days_remaining} days remaining`}
                            </span>
                          </div>
                        )}
                        {drawerProtocol.days_since_ended != null && (
                          <div style={{ marginTop: '10px' }}>
                            <span style={{
                              ...sharedStyles.badge,
                              ...getLapsedUrgencyStyle(drawerProtocol.days_since_ended),
                              fontSize: '13px',
                            }}>
                              Ended {drawerProtocol.days_since_ended} days ago
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Peptide Protocol History */}
                    <div style={drawerCard}>
                      <h4 style={sectionHead}>Peptide History ({peptideProtos.length})</h4>
                      {peptideProtos.length === 0 ? (
                        <div style={{ fontSize: '13px', color: '#999' }}>No peptide protocols found</div>
                      ) : peptideProtos.map((proto, i) => {
                        const dur = proto.start_date && proto.end_date
                          ? Math.ceil((new Date(proto.end_date) - new Date(proto.start_date)) / (1000 * 60 * 60 * 24))
                          : null;
                        const isActive = proto.status === 'active';
                        return (
                          <div key={proto.id || i} style={{ padding: '10px 0', borderBottom: i < peptideProtos.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>
                                {proto.medication || proto.program_name || 'Peptide Protocol'}
                              </div>
                              <span style={{
                                fontSize: '11px', fontWeight: '600', padding: '2px 8px',
                                background: isActive ? '#dcfce7' : '#f3f4f6',
                                color: isActive ? '#166534' : '#666',
                              }}>
                                {isActive ? 'ACTIVE' : 'COMPLETED'}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                              {proto.start_date && new Date(proto.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {dur && ` · ${getDurationLabel(dur)}`}
                              {proto.frequency && ` · ${proto.frequency}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>Failed to load patient data</div>
                )}
              </div>
            </div>
          </>
        );
      })()}
    </AdminLayout>
  );
}
