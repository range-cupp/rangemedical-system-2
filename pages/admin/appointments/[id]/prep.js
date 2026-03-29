// /pages/admin/appointments/[id]/prep.js
// Staff-facing appointment prep checklist — Tara's primary daily tool
// Reads live data from appointments table, allows toggling manual prep fields
// Range Medical

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '../../../../components/AdminLayout';

export default function AppointmentPrepPage() {
  const router = useRouter();
  const { id } = router.query;
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({});
  const [prepNotes, setPrepNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesTimer, setNotesTimer] = useState(null);

  const fetchAppointment = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/appointments/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setAppointment(data.appointment);
      setPrepNotes(data.appointment.prep_notes || '');
    } catch (err) {
      setError('Appointment not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAppointment(); }, [fetchAppointment]);

  // Toggle a prep field
  const toggleField = async (field) => {
    if (!appointment) return;
    const newValue = !appointment[field];
    setSaving(prev => ({ ...prev, [field]: true }));

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppointment(data.appointment);
      }
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      setSaving(prev => ({ ...prev, [field]: false }));
    }
  };

  // Auto-save prep notes with debounce
  const saveNotes = useCallback(async (text) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prep_notes: text }),
      });
      if (res.ok) {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      }
    } catch (err) {
      console.error('Notes save error:', err);
    }
  }, [id]);

  const handleNotesChange = (e) => {
    const text = e.target.value;
    setPrepNotes(text);
    setNotesSaved(false);
    if (notesTimer) clearTimeout(notesTimer);
    setNotesTimer(setTimeout(() => saveNotes(text), 1000));
  };

  if (loading) {
    return (
      <AdminLayout title="Appointment Prep">
        <div style={s.loadingWrap}>Loading...</div>
      </AdminLayout>
    );
  }

  if (error || !appointment) {
    return (
      <AdminLayout title="Appointment Prep">
        <div style={s.errorWrap}>
          <p>{error || 'Appointment not found'}</p>
          <Link href="/admin/schedule" style={s.backLink}>&larr; Back to Schedule</Link>
        </div>
      </AdminLayout>
    );
  }

  const apt = appointment;
  const serviceName = apt.service_name || 'Appointment';
  const patientName = apt.patient_name || 'Unknown Patient';

  // Determine if this is a prereq-gated IV
  const sn = serviceName.toLowerCase();
  const isPrereqService = sn.includes('vitamin c') || sn.includes('methylene blue') || sn.includes('mb +') || sn.includes('mb combo');

  // Determine if this is a lab appointment (review, assessment, follow-up)
  const isLabAppt = sn.includes('lab review') || sn.includes('lab assessment') || sn.includes('lab follow') || sn.includes('initial lab');
  const labDeliveryLabel = apt.modality === 'telemedicine' ? 'Labs emailed to patient' : 'Labs printed';

  // Determine if ID verification is needed (blood draws, phlebotomy, medication pickup)
  const needsIdCheck = sn.includes('blood draw') || sn.includes('phlebotomy') || sn.includes('medication pickup');

  // Modality badge
  const modalityMap = {
    in_clinic: { label: 'In-Clinic', bg: '#dcfce7', color: '#166534' },
    telemedicine: { label: 'Telemedicine', bg: '#dbeafe', color: '#1e40af' },
    phone: { label: 'Phone', bg: '#f3f4f6', color: '#374151' },
  };
  const modality = modalityMap[apt.modality] || null;

  // Overall status
  const autoItems = [
    { ok: apt.instructions_sent },
    { ok: apt.forms_complete },
  ];
  if (isPrereqService) autoItems.push({ ok: apt.prereqs_met });
  if (isLabAppt) autoItems.push({ ok: apt.labs_delivered });
  const manualItems = [
    { ok: apt.provider_briefed },
  ];
  if (needsIdCheck) manualItems.push({ ok: apt.id_verified });
  const allItems = [...autoItems, ...manualItems];
  const allReady = allItems.every(i => i.ok);

  const formatDateTime = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });
  };

  return (
    <AdminLayout title="Appointment Prep">
      <Head><title>Prep: {patientName} | Range Medical</title></Head>

      {/* Back link */}
      <Link href="/admin/schedule" style={s.backLink}>&larr; Back to Schedule</Link>

      {/* Header card */}
      <div style={s.card}>
        <div style={s.headerRow}>
          <div style={{ flex: 1 }}>
            <h2 style={s.patientName}>{patientName}</h2>
            <div style={s.serviceName}>{serviceName}</div>
            <div style={s.metaRow}>
              <span>{formatDateTime(apt.start_time)}</span>
              {apt.provider && <span style={s.metaDivider}>|</span>}
              {apt.provider && <span>{apt.provider}</span>}
              {apt.duration_minutes && <span style={s.metaDivider}>|</span>}
              {apt.duration_minutes && <span>{apt.duration_minutes} min</span>}
            </div>
            {modality && (
              <span style={{ ...s.modalityBadge, background: modality.bg, color: modality.color }}>
                {modality.label}
              </span>
            )}
          </div>
          <div style={{ ...s.statusBadge, background: allReady ? '#dcfce7' : '#fef3c7', color: allReady ? '#166534' : '#92400e' }}>
            {allReady ? '✓ Ready' : '⚠ Action Needed'}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div style={s.card}>
        <h3 style={s.sectionTitle}>Prep Checklist</h3>

        {/* Auto-set items (display only) */}
        <CheckItem
          label="Instructions sent"
          checked={apt.instructions_sent}
          auto
        />
        <CheckItem
          label="Forms complete"
          checked={apt.forms_complete}
          auto
        />
        {isPrereqService && (
          <CheckItem
            label="Blood work prereq met"
            checked={apt.prereqs_met}
            auto
          />
        )}
        {isLabAppt && (
          <CheckItem
            label={labDeliveryLabel}
            checked={apt.labs_delivered}
            saving={saving.labs_delivered}
            onToggle={() => toggleField('labs_delivered')}
          />
        )}

        {/* Manual items */}
        <div style={s.divider} />
        <div style={s.manualLabel}>Manual checks</div>
        <CheckItem
          label="Provider briefed"
          checked={apt.provider_briefed}
          saving={saving.provider_briefed}
          onToggle={() => toggleField('provider_briefed')}
        />
        {needsIdCheck && (
          <CheckItem
            label="ID verified"
            checked={apt.id_verified}
            saving={saving.id_verified}
            onToggle={() => toggleField('id_verified')}
          />
        )}
      </div>

      {/* Visit reason */}
      {apt.visit_reason && (
        <div style={s.card}>
          <h3 style={s.sectionTitle}>Visit Reason</h3>
          <p style={s.visitReason}>{apt.visit_reason}</p>
        </div>
      )}

      {/* Prep notes */}
      <div style={s.card}>
        <div style={s.notesTitleRow}>
          <h3 style={s.sectionTitle}>Prep Notes</h3>
          {notesSaved && <span style={s.savedIndicator}>Saved</span>}
        </div>
        <textarea
          value={prepNotes}
          onChange={handleNotesChange}
          placeholder="Add prep notes for this appointment..."
          style={s.textarea}
          rows={4}
        />
      </div>
    </AdminLayout>
  );
}

// Checklist item component
function CheckItem({ label, checked, auto, saving, onToggle }) {
  const isToggleable = !auto && onToggle;

  return (
    <div
      style={{
        ...s.checkRow,
        cursor: isToggleable ? 'pointer' : 'default',
        opacity: saving ? 0.6 : 1,
      }}
      onClick={isToggleable && !saving ? onToggle : undefined}
    >
      <div style={{
        ...s.checkbox,
        background: checked ? '#22c55e' : '#fff',
        borderColor: checked ? '#22c55e' : '#d1d5db',
      }}>
        {checked && <span style={s.checkmark}>✓</span>}
      </div>
      <span style={{
        ...s.checkLabel,
        textDecoration: checked ? 'line-through' : 'none',
        color: checked ? '#999' : '#111',
      }}>
        {label}
      </span>
      {auto && (
        <span style={s.autoTag}>auto</span>
      )}
      {saving && <span style={s.savingTag}>saving...</span>}
    </div>
  );
}

const s = {
  loadingWrap: { textAlign: 'center', padding: '60px', color: '#666' },
  errorWrap: { textAlign: 'center', padding: '60px', color: '#666' },
  backLink: {
    display: 'inline-block',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#666',
    textDecoration: 'none',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
    padding: '20px',
    marginBottom: '16px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap',
  },
  patientName: {
    margin: '0 0 4px',
    fontSize: '20px',
    fontWeight: '700',
    color: '#111',
  },
  serviceName: {
    fontSize: '15px',
    color: '#555',
    marginBottom: '8px',
  },
  metaRow: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '8px',
  },
  metaDivider: {
    margin: '0 8px',
    color: '#ddd',
  },
  modalityBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    borderRadius: 0,
    marginTop: '4px',
  },
  statusBadge: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '700',
    borderRadius: 0,
    whiteSpace: 'nowrap',
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    margin: '0 0 12px',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#666',
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  checkbox: {
    width: '24px',
    height: '24px',
    border: '2px solid #d1d5db',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  checkmark: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    lineHeight: 1,
  },
  checkLabel: {
    fontSize: '15px',
    flex: 1,
  },
  autoTag: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#999',
    background: '#f5f5f5',
    padding: '2px 6px',
    borderRadius: 0,
    letterSpacing: '0.05em',
  },
  savingTag: {
    fontSize: '11px',
    color: '#999',
    fontStyle: 'italic',
  },
  divider: {
    borderTop: '2px solid #e5e5e5',
    margin: '8px 0',
  },
  manualLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '8px 0 4px',
  },
  visitReason: {
    margin: 0,
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.6',
  },
  notesTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedIndicator: {
    fontSize: '12px',
    color: '#22c55e',
    fontWeight: '600',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    boxSizing: 'border-box',
  },
};
