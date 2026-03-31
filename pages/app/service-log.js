// /pages/app/service-log.js
// Mobile service log entry — Range Medical Employee App

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../../components/AppLayout';

const CATEGORIES = [
  { id: 'iv',          label: 'IV Therapy',       icon: '💉' },
  { id: 'hbot',        label: 'Hyperbaric (HBOT)', icon: '🫧' },
  { id: 'rlt',         label: 'Red Light (RLT)',   icon: '🔴' },
  { id: 'injection',   label: 'Range Injection',   icon: '💊' },
  { id: 'hrt',         label: 'HRT Pickup',        icon: '🧬' },
  { id: 'weight_loss', label: 'Weight Loss Pickup', icon: '⚖️' },
  { id: 'peptide',     label: 'Peptide Pickup',    icon: '🔬' },
];

export default function AppServiceLog() {
  const router = useRouter();
  const [step, setStep] = useState('category'); // category → patient → confirm
  const [category, setCategory] = useState(null);
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medication, setMedication] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [todayCount, setTodayCount] = useState(null);
  const [staff, setStaff] = useState(null);
  const debounceRef = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('staff_session');
    if (session) try { setStaff(JSON.parse(session)); } catch {}
    fetchTodayCount();
  }, []);

  const fetchTodayCount = async () => {
    try {
      const res = await fetch('/api/app/today');
      if (res.ok) {
        const data = await res.json();
        setTodayCount(data.service_log?.count || 0);
      }
    } catch {}
  };

  const searchPatients = async (q) => {
    clearTimeout(debounceRef[0]);
    setPatientQuery(q);
    if (q.trim().length < 2) { setPatientResults([]); return; }
    debounceRef[0] = setTimeout(async () => {
      const res = await fetch(`/api/app/patients-search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setPatientResults(data.patients || []);
      }
    }, 300);
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !category) return;
    setSaving(true);
    try {
      const body = {
        patient_id: selectedPatient.id,
        entry_date: new Date().toISOString().split('T')[0],
        category: category.id,
        entry_type: ['hrt', 'weight_loss', 'peptide'].includes(category.id) ? 'pickup' : 'session',
        medication: medication || null,
        notes: notes || null,
        logged_by: staff?.name || 'Staff App',
      };
      const res = await fetch('/api/service-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        // Duplicate warning — show confirm
        const data = await res.json();
        if (!window.confirm(data.message + '\n\nLog it anyway?')) {
          setSaving(false);
          return;
        }
        // Force submit
        await fetch('/api/service-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, force: true }),
        });
      } else if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to log session');
      }
      setSaved(true);
      setTodayCount(c => (c || 0) + 1);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep('category');
    setCategory(null);
    setSelectedPatient(null);
    setPatientQuery('');
    setPatientResults([]);
    setMedication('');
    setNotes('');
    setSaved(false);
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (saved) {
    return (
      <AppLayout title="Service Log">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Session Logged</div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>
            {category?.label} for {selectedPatient?.first_name} {selectedPatient?.last_name}
          </div>
          {todayCount !== null && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, padding: '10px 20px', color: '#166534', fontSize: 14, fontWeight: 600, marginBottom: 32 }}>
              {todayCount} session{todayCount !== 1 ? 's' : ''} logged today
            </div>
          )}
          <button
            onClick={reset}
            style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 0, padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 12, width: '100%', maxWidth: 280 }}
          >
            Log Another
          </button>
          <button
            onClick={() => router.push('/app')}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}
          >
            Back to Today
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Service Log — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <AppLayout title="Log Session">
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, padding: '14px 16px 4px' }}>
          {['category', 'patient', 'confirm'].map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 0, background: ['category', 'patient', 'confirm'].indexOf(step) >= i ? '#0f172a' : '#e2e8f0', transition: 'background 0.2s' }} />
          ))}
        </div>

        {/* Step 1: Category */}
        {step === 'category' && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>What type of session?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat); setStep('patient'); }}
                  style={{
                    background: '#fff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 0,
                    padding: '16px 12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{cat.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Patient selection */}
        {step === 'patient' && (
          <div style={{ padding: '16px 16px 0' }}>
            <button onClick={() => setStep('category')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 14 }}>
              ← {category?.icon} {category?.label}
            </button>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Which patient?</div>
            <input
              className="app-input"
              placeholder="Search by name or phone…"
              value={patientQuery}
              onChange={e => searchPatients(e.target.value)}
              autoFocus
              type="search"
              autoComplete="off"
              style={{ marginBottom: 12, WebkitAppearance: 'none' }}
            />
            {patientResults.map(p => (
              <div
                key={p.id}
                onClick={() => { setSelectedPatient(p); setStep('confirm'); }}
                style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 0, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{p.first_name} {p.last_name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{p.phone || p.email || '—'}</div>
              </div>
            ))}
            {patientQuery.trim().length >= 2 && patientResults.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>No patients found</div>
            )}
          </div>
        )}

        {/* Step 3: Confirm + optional fields */}
        {step === 'confirm' && selectedPatient && (
          <div style={{ padding: '16px 16px 0' }}>
            <button onClick={() => setStep('patient')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 14 }}>
              ← Change patient
            </button>

            {/* Summary card */}
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 0, padding: '14px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 6 }}>Logging</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                {category?.icon} {category?.label}
              </div>
              <div style={{ fontSize: 14, color: '#64748b' }}>
                {selectedPatient.first_name} {selectedPatient.last_name}
              </div>
            </div>

            {/* Optional: medication */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>Medication / item (optional)</label>
              <input
                className="app-input"
                placeholder="e.g. Semaglutide 0.5mg"
                value={medication}
                onChange={e => setMedication(e.target.value)}
                style={{ WebkitAppearance: 'none' }}
              />
            </div>

            {/* Optional: notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>Notes (optional)</label>
              <textarea
                className="app-input"
                placeholder="Any notes…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                style={{ resize: 'none', WebkitAppearance: 'none' }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: 0,
                border: 'none',
                background: saving ? '#94a3b8' : '#0f172a',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {saving ? 'Saving…' : 'Log Session'}
            </button>
          </div>
        )}
      </AppLayout>
    </>
  );
}
