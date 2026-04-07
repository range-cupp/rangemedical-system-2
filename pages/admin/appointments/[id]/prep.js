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
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({});
  const [prepNotes, setPrepNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesTimer, setNotesTimer] = useState(null);
  const [visitReasonValue, setVisitReasonValue] = useState('');
  const [visitReasonSaved, setVisitReasonSaved] = useState(false);
  const [visitReasonTimer, setVisitReasonTimer] = useState(null);

  const fetchAppointment = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/appointments/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setAppointment(data.appointment);
      setPrepNotes(data.appointment.prep_notes || '');
      setVisitReasonValue(data.appointment.visit_reason || '');
    } catch (err) {
      setError('Appointment not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAppointment(); }, [fetchAppointment]);

  // Fetch provider briefing synopsis
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/appointments/${id}/briefing`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setBriefing(data.briefing);
      } catch (err) {
        console.error('Briefing fetch error:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

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

  // Auto-save visit reason with debounce
  const saveVisitReason = useCallback(async (text) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visit_reason: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppointment(data.appointment);
        setVisitReasonSaved(true);
        setTimeout(() => setVisitReasonSaved(false), 2000);
      }
    } catch (err) {
      console.error('Visit reason save error:', err);
    }
  }, [id]);

  const handleVisitReasonChange = (e) => {
    const text = e.target.value;
    setVisitReasonValue(text);
    setVisitReasonSaved(false);
    if (visitReasonTimer) clearTimeout(visitReasonTimer);
    setVisitReasonTimer(setTimeout(() => saveVisitReason(text), 1000));
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

  // Modality badge
  const modalityMap = {
    in_clinic: { label: 'In-Clinic', bg: '#dcfce7', color: '#166534' },
    telemedicine: { label: 'Telemedicine', bg: '#dbeafe', color: '#1e40af' },
    phone: { label: 'Phone', bg: '#f3f4f6', color: '#374151' },
  };
  const modality = modalityMap[apt.modality] || null;

  // Visit reason unconfirmed check
  const visitReasonUnconfirmed = !apt.visit_reason || apt.visit_reason.includes('to be confirmed by staff');

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
  manualItems.push({ ok: apt.id_verified });
  const allItems = [...autoItems, ...manualItems];
  // Block "Ready" if visit reason is unconfirmed
  const allReady = allItems.every(i => i.ok) && !visitReasonUnconfirmed;

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

      {/* Print-only styles — hide everything except briefing when printing */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          .briefing-print-area, .briefing-print-area * { visibility: visible !important; }
          .briefing-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
          .briefing-no-print { display: none !important; }
        }
      `}</style>

      {/* Provider Briefing */}
      <ProviderBriefing
        briefing={briefing}
        appointment={apt}
        onPrint={async () => {
          window.print();
          if (!apt.provider_briefed) {
            try {
              const res = await fetch(`/api/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider_briefed: true }),
              });
              if (res.ok) {
                const data = await res.json();
                setAppointment(data.appointment);
              }
            } catch (err) {
              console.error('Mark briefed error:', err);
            }
          }
        }}
      />

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
          label="Provider briefed (briefing printed)"
          checked={apt.provider_briefed}
          saving={saving.provider_briefed}
          onToggle={() => toggleField('provider_briefed')}
        />
        <CheckItem
          label="ID verified"
          checked={apt.id_verified}
          saving={saving.id_verified}
          onToggle={() => toggleField('id_verified')}
        />
      </div>

      {/* Visit reason — editable */}
      <div style={s.card}>
        <div style={s.notesTitleRow}>
          <h3 style={s.sectionTitle}>Visit Reason</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {visitReasonUnconfirmed && (
              <span style={s.amberBadge}>Visit reason needs updating</span>
            )}
            {visitReasonSaved && <span style={s.savedIndicator}>Saved</span>}
          </div>
        </div>
        <input
          type="text"
          value={visitReasonValue}
          onChange={handleVisitReasonChange}
          placeholder="e.g. Initial lab review, HRT follow-up, first NAD+ IV session"
          style={{
            ...s.textarea,
            minHeight: 'unset',
            height: '40px',
            resize: 'none',
            borderColor: visitReasonUnconfirmed ? '#f59e0b' : '#e5e5e5',
          }}
        />
      </div>

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

// Provider briefing synopsis — condensed talking points for the provider
function ProviderBriefing({ briefing, appointment, onPrint }) {
  if (!briefing) {
    return (
      <div style={s.card}>
        <h3 style={s.sectionTitle}>Provider Briefing</h3>
        <div style={{ fontSize: '13px', color: '#999' }}>Loading synopsis…</div>
      </div>
    );
  }

  const isInPerson = briefing.modality !== 'telemedicine' && briefing.modality !== 'phone';
  const fmtDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return iso; }
  };
  const dobLine = briefing.patient.dob
    ? `${fmtDate(briefing.patient.dob)}${briefing.patient.age != null ? ` (age ${briefing.patient.age})` : ''}`
    : '—';

  const reasonParts = [];
  if (briefing.reason_for_visit) reasonParts.push(briefing.reason_for_visit);
  if (briefing.patient_goals) reasonParts.push(`Goals: ${briefing.patient_goals}`);
  const reasonText = reasonParts.length ? reasonParts.join(' · ') : '—';

  const lastVisitText = briefing.last_visit
    ? `${fmtDate(briefing.last_visit.date)} — ${briefing.last_visit.service || 'Visit'}${briefing.last_visit.provider ? ` (${briefing.last_visit.provider})` : ''}`
    : 'No prior visit on record';

  const diagnosesText = briefing.diagnoses && briefing.diagnoses.length
    ? briefing.diagnoses.join('; ')
    : (briefing.has_intake ? 'None reported on intake' : '—');

  const rows = [
    ['Name', briefing.patient.name || '—'],
    ['DOB', dobLine],
    ['Reason for visit / goals', reasonText],
    ['Last visit', lastVisitText],
    ['Diagnoses', diagnosesText],
    ['Medications', briefing.medications || (briefing.has_intake ? '—' : 'No intake on file')],
    ['Allergies', briefing.allergies || (briefing.has_intake ? '—' : 'No intake on file')],
    ['How heard about us', briefing.how_heard || '—'],
  ];

  if (isInPerson) {
    const v = briefing.latest_vitals;
    let vitalsText = 'No vitals on file';
    if (v) {
      const parts = [];
      if (v.blood_pressure_systolic && v.blood_pressure_diastolic) parts.push(`BP ${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}`);
      if (v.heart_rate) parts.push(`HR ${v.heart_rate}`);
      if (v.weight_lbs || v.weight) parts.push(`Wt ${v.weight_lbs || v.weight} lbs`);
      if (v.temperature) parts.push(`Temp ${v.temperature}`);
      if (v.oxygen_saturation) parts.push(`SpO₂ ${v.oxygen_saturation}%`);
      if (parts.length) {
        vitalsText = `${parts.join(' · ')} (${fmtDate(v.recorded_at)})`;
      }
    }
    rows.push(['Latest vitals', vitalsText]);
    rows.push(['Mood & appearance', 'Assess at check-in']);
    rows.push(['Previous plan', briefing.last_visit?.visit_reason || briefing.last_visit?.service || '—']);
  }

  return (
    <div style={s.card} className="briefing-print-area">
      <div style={s.notesTitleRow}>
        <h3 style={s.sectionTitle}>Provider Briefing</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isInPerson ? 'In-Person' : 'Telemedicine'}
          </span>
          {appointment?.provider_briefed && (
            <span style={{ fontSize: '11px', color: '#166534', background: '#dcfce7', padding: '3px 8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ✓ Printed
            </span>
          )}
          <button
            type="button"
            onClick={onPrint}
            className="briefing-no-print"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: '#111',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Print for Provider
          </button>
        </div>
      </div>
      <div>
        {rows.map(([label, value]) => (
          <div key={label} style={s.briefingRow}>
            <div style={s.briefingLabel}>{label}</div>
            <div style={s.briefingValue}>{value}</div>
          </div>
        ))}
      </div>
      {!briefing.has_intake && (
        <div style={{ ...s.amberBadge, marginTop: '10px' }}>No medical intake on file</div>
      )}
    </div>
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
  amberBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    fontSize: '11px',
    fontWeight: '600',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 0,
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
  briefingRow: {
    display: 'flex',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid #f5f5f5',
    fontSize: '14px',
  },
  briefingLabel: {
    flex: '0 0 180px',
    color: '#888',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: '600',
    paddingTop: '2px',
  },
  briefingValue: {
    flex: 1,
    color: '#111',
    lineHeight: '1.5',
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
