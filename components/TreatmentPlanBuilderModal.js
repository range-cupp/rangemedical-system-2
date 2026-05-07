// components/TreatmentPlanBuilderModal.js
// Structured treatment plan builder — symptoms, goals, categorized plan items,
// lifestyle recommendations, and follow-up. Preview/save/send as PDF.

import { useEffect, useRef, useState } from 'react';

const COMMON_SYMPTOMS = [
  'Fatigue / Low Energy', 'Poor Sleep', 'Brain Fog', 'Hair Loss',
  'Weight Gain', 'Low Libido', 'Mood Changes', 'Joint Pain',
  'Muscle Loss', 'Hot Flashes', 'Anxiety', 'Depression',
  'Erectile Dysfunction', 'Night Sweats', 'Headaches',
];

const COMMON_GOALS = [
  'Increased Energy', 'Better Sleep', 'Weight Loss', 'Build Muscle Mass',
  'Cognitive Function', 'Hormone Balance', 'Pain Relief', 'Improved Mood',
  'Hair Regrowth', 'Anti-Aging', 'Improved Libido', 'Stress Reduction',
];

const PLAN_CATEGORY_OPTIONS = [
  'Hormone Therapy', 'Weight Management', 'Peptide Therapy',
  'IV Therapy', 'Supplements', 'Other',
];

const emptyItem = () => ({ name: '', action: '', rationale: '' });
const emptyCategory = (name = '') => ({ name, items: [emptyItem()] });

export default function TreatmentPlanBuilderModal({
  patientId,
  patientName,
  patientEmail,
  provider,
  onClose,
}) {
  const [step, setStep] = useState('edit');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const objectUrlRef = useRef(null);

  // Form state
  const [symptoms, setSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [goals, setGoals] = useState([]);
  const [customGoal, setCustomGoal] = useState('');
  const [planCategories, setPlanCategories] = useState([emptyCategory('Hormone Therapy')]);
  const [lifestyle, setLifestyle] = useState(['']);
  const [followUp, setFollowUp] = useState(['']);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const toggleItem = (list, setList, item) => {
    setList(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const addCustom = (value, list, setList, setClear) => {
    const v = value.trim();
    if (v && !list.includes(v)) {
      setList(prev => [...prev, v]);
      setClear('');
    }
  };

  // Plan category helpers
  const updateCategory = (catIdx, field, value) => {
    setPlanCategories(prev => prev.map((c, i) => i === catIdx ? { ...c, [field]: value } : c));
  };

  const updateItem = (catIdx, itemIdx, field, value) => {
    setPlanCategories(prev => prev.map((c, ci) =>
      ci === catIdx ? {
        ...c,
        items: c.items.map((item, ii) => ii === itemIdx ? { ...item, [field]: value } : item),
      } : c
    ));
  };

  const addItem = (catIdx) => {
    setPlanCategories(prev => prev.map((c, i) =>
      i === catIdx ? { ...c, items: [...c.items, emptyItem()] } : c
    ));
  };

  const removeItem = (catIdx, itemIdx) => {
    setPlanCategories(prev => prev.map((c, ci) =>
      ci === catIdx ? { ...c, items: c.items.filter((_, ii) => ii !== itemIdx) } : c
    ));
  };

  const addCategory = () => {
    setPlanCategories(prev => [...prev, emptyCategory()]);
  };

  const removeCategory = (catIdx) => {
    setPlanCategories(prev => prev.filter((_, i) => i !== catIdx));
  };

  // Simple list helpers (lifestyle, follow-up)
  const updateListItem = (list, setList, idx, value) => {
    setList(prev => prev.map((v, i) => i === idx ? value : v));
  };

  const addListItem = (setList) => {
    setList(prev => [...prev, '']);
  };

  const removeListItem = (list, setList, idx) => {
    setList(prev => prev.filter((_, i) => i !== idx));
  };

  const buildPayload = (mode) => {
    const cleanCats = planCategories
      .filter(c => c.name.trim() && c.items.some(it => it.name.trim()))
      .map(c => ({
        name: c.name.trim(),
        items: c.items.filter(it => it.name.trim()).map(it => ({
          name: it.name.trim(),
          action: it.action.trim(),
          rationale: it.rationale.trim(),
        })),
      }));

    return {
      patient_id: patientId,
      symptoms: symptoms.filter(Boolean),
      goals: goals.filter(Boolean),
      plan_categories: cleanCats,
      lifestyle: lifestyle.filter(s => s.trim()),
      follow_up: followUp.filter(s => s.trim()),
      provider: provider || null,
      mode,
    };
  };

  const hasContent = symptoms.length > 0 || goals.length > 0 ||
    planCategories.some(c => c.items.some(it => it.name.trim()));

  const requestPreview = async () => {
    if (!hasContent || !patientId) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/treatment-plan-v2/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('preview')),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Preview failed');
      }
      const blob = await res.blob();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      setPdfUrl(url);
      setStep('preview');
    } catch (err) {
      setStatus({ kind: 'err', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const saveOrSend = async (mode) => {
    if (!patientId) return;
    const setFlag = mode === 'send' ? setSending : setSaving;
    setFlag(true);
    setStatus(null);
    try {
      const res = await fetch('/api/treatment-plan-v2/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(mode)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `${mode} failed`);
      setStatus({
        kind: 'ok',
        action: mode,
        msg: mode === 'send'
          ? `Treatment plan emailed to ${patientEmail || 'patient'} and saved to profile.`
          : `Treatment plan saved to ${patientName ? `${patientName}'s` : "the patient's"} profile.`,
      });
    } catch (err) {
      setStatus({ kind: 'err', msg: err.message });
    } finally {
      setFlag(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={overlayStyle} />
      <div role="dialog" aria-modal="true" style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>
              {step === 'edit' ? 'Build Treatment Plan' : 'Preview Treatment Plan'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {patientName || 'Patient'} {patientEmail ? `• ${patientEmail}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={closeBtn} aria-label="Close">×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {step === 'edit' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

              {/* --- Symptoms --- */}
              <SectionHeader title="Presenting Symptoms" subtitle="Select or add the patient's current symptoms" />
              <ChipGrid
                options={COMMON_SYMPTOMS}
                selected={symptoms}
                onToggle={(s) => toggleItem(symptoms, setSymptoms, s)}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom(customSymptom, symptoms, setSymptoms, setCustomSymptom)}
                  placeholder="Add custom symptom..."
                  style={inputStyle}
                />
                <button
                  onClick={() => addCustom(customSymptom, symptoms, setSymptoms, setCustomSymptom)}
                  style={addBtnSmall}
                >+ Add</button>
              </div>

              <Divider />

              {/* --- Goals --- */}
              <SectionHeader title="Patient Goals" subtitle="What the patient wants to achieve" />
              <ChipGrid
                options={COMMON_GOALS}
                selected={goals}
                onToggle={(g) => toggleItem(goals, setGoals, g)}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom(customGoal, goals, setGoals, setCustomGoal)}
                  placeholder="Add custom goal..."
                  style={inputStyle}
                />
                <button
                  onClick={() => addCustom(customGoal, goals, setGoals, setCustomGoal)}
                  style={addBtnSmall}
                >+ Add</button>
              </div>

              <Divider />

              {/* --- Plan of Care --- */}
              <SectionHeader title="Plan of Care" subtitle="Add treatment categories and items with action/rationale" />
              {planCategories.map((cat, catIdx) => (
                <div key={catIdx} style={categoryCard}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <select
                      value={PLAN_CATEGORY_OPTIONS.includes(cat.name) ? cat.name : '__custom__'}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateCategory(catIdx, 'name', v === '__custom__' ? '' : v);
                      }}
                      style={{ ...inputStyle, flex: 'none', width: 180 }}
                    >
                      {PLAN_CATEGORY_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                      <option value="__custom__">Custom...</option>
                    </select>
                    {!PLAN_CATEGORY_OPTIONS.includes(cat.name) && (
                      <input
                        value={cat.name}
                        onChange={(e) => updateCategory(catIdx, 'name', e.target.value)}
                        placeholder="Category name..."
                        style={inputStyle}
                      />
                    )}
                    {planCategories.length > 1 && (
                      <button onClick={() => removeCategory(catIdx)} style={removeBtnStyle}>Remove</button>
                    )}
                  </div>

                  {cat.items.map((item, itemIdx) => (
                    <div key={itemIdx} style={itemCard}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', minWidth: 20 }}>{itemIdx + 1}.</span>
                        <input
                          value={item.name}
                          onChange={(e) => updateItem(catIdx, itemIdx, 'name', e.target.value)}
                          placeholder="Item name (e.g. Testosterone, B-complex)"
                          style={{ ...inputStyle, fontWeight: 600 }}
                        />
                        {cat.items.length > 1 && (
                          <button onClick={() => removeItem(catIdx, itemIdx)} style={removeBtnStyle}>×</button>
                        )}
                      </div>
                      <textarea
                        value={item.action}
                        onChange={(e) => updateItem(catIdx, itemIdx, 'action', e.target.value)}
                        placeholder="Action: What to do (dosage, frequency, instructions)..."
                        rows={2}
                        style={textareaSmall}
                      />
                      <textarea
                        value={item.rationale}
                        onChange={(e) => updateItem(catIdx, itemIdx, 'rationale', e.target.value)}
                        placeholder="Rationale: Why this is recommended..."
                        rows={2}
                        style={textareaSmall}
                      />
                    </div>
                  ))}
                  <button onClick={() => addItem(catIdx)} style={addBtnSmall}>+ Add Item</button>
                </div>
              ))}
              <button onClick={addCategory} style={{ ...addBtnSmall, marginTop: 8 }}>+ Add Category</button>

              <Divider />

              {/* --- Lifestyle --- */}
              <SectionHeader title="Lifestyle Recommendations" subtitle="Optional lifestyle guidance" />
              {lifestyle.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input
                    value={item}
                    onChange={(e) => updateListItem(lifestyle, setLifestyle, idx, e.target.value)}
                    placeholder="e.g. Hydration: Focus on adequate water intake..."
                    style={inputStyle}
                  />
                  {lifestyle.length > 1 && (
                    <button onClick={() => removeListItem(lifestyle, setLifestyle, idx)} style={removeBtnStyle}>×</button>
                  )}
                </div>
              ))}
              <button onClick={() => addListItem(setLifestyle)} style={addBtnSmall}>+ Add</button>

              <Divider />

              {/* --- Follow-up --- */}
              <SectionHeader title="Follow-Up" subtitle="Next steps for the patient" />
              {followUp.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input
                    value={item}
                    onChange={(e) => updateListItem(followUp, setFollowUp, idx, e.target.value)}
                    placeholder="e.g. Repeat blood work in 6 weeks..."
                    style={inputStyle}
                  />
                  {followUp.length > 1 && (
                    <button onClick={() => removeListItem(followUp, setFollowUp, idx)} style={removeBtnStyle}>×</button>
                  )}
                </div>
              ))}
              <button onClick={() => addListItem(setFollowUp)} style={addBtnSmall}>+ Add</button>

            </div>
          ) : (
            <div style={{ flex: 1, background: '#525252' }}>
              {pdfUrl && (
                <iframe
                  src={pdfUrl}
                  title="Treatment plan preview"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          )}

          {/* Status */}
          {status && (
            <div style={{
              padding: '10px 20px', fontSize: 13,
              background: status.kind === 'ok' ? '#ecfdf5' : '#fef2f2',
              color: status.kind === 'ok' ? '#065f46' : '#991b1b',
              borderTop: '1px solid #e5e7eb',
            }}>
              {status.msg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {step === 'edit'
              ? 'Preview generates a PDF. Save archives it to the patient profile.'
              : 'Save archives this PDF. Send also emails it to the patient.'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step === 'preview' && (
              <button onClick={() => { setStep('edit'); setStatus(null); }} disabled={sending || saving} style={btnSecondary}>
                ← Back to Edit
              </button>
            )}
            {step === 'edit' && (
              <button
                onClick={requestPreview}
                disabled={!hasContent || loading || saving}
                style={{ ...btnSecondary, opacity: (!hasContent || loading || saving) ? 0.5 : 1 }}
              >
                {loading ? 'Generating…' : 'Preview'}
              </button>
            )}
            <button
              onClick={() => saveOrSend('save')}
              disabled={!hasContent || saving || sending || (status?.kind === 'ok' && status?.action === 'save')}
              style={{
                ...btnPrimary,
                opacity: (!hasContent || saving || sending || (status?.kind === 'ok' && status?.action === 'save')) ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving…' : (status?.kind === 'ok' && status?.action === 'save') ? 'Saved' : 'Save to Profile'}
            </button>
            {step === 'preview' && (
              <button
                onClick={() => saveOrSend('send')}
                disabled={sending || saving || (status?.kind === 'ok' && status?.action === 'send')}
                style={{
                  ...btnPrimary,
                  opacity: (sending || saving || (status?.kind === 'ok' && status?.action === 'send')) ? 0.5 : 1,
                }}
              >
                {sending ? 'Sending…' : (status?.kind === 'ok' && status?.action === 'send') ? 'Sent' : 'Send to Patient'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function ChipGrid({ options, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              border: `1.5px solid ${active ? '#111' : '#d1d5db'}`,
              background: active ? '#111' : '#fff',
              color: active ? '#fff' : '#374151',
              cursor: 'pointer',
              fontWeight: active ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />;
}

// ── Styles ──────────────────────────────────────────────────────

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 20000,
};

const modalStyle = {
  position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 'min(920px, 95vw)', height: 'min(880px, 94vh)',
  background: '#fff', zIndex: 20001, display: 'flex', flexDirection: 'column',
  boxShadow: '0 10px 40px rgba(0,0,0,0.25)', border: '1px solid #e5e7eb',
};

const headerStyle = {
  padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};

const footerStyle = {
  padding: '12px 20px', borderTop: '1px solid #e5e7eb',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#f9fafb', gap: 10,
};

const closeBtn = {
  background: 'none', border: 'none', fontSize: 22,
  color: '#9ca3af', cursor: 'pointer', lineHeight: 1, padding: 4,
};

const inputStyle = {
  flex: 1, padding: '7px 10px', fontSize: 13, border: '1.5px solid #e5e7eb',
  color: '#111', background: '#fafafa', boxSizing: 'border-box',
};

const textareaSmall = {
  width: '100%', padding: '7px 10px', fontSize: 13, border: '1.5px solid #e5e7eb',
  color: '#111', background: '#fafafa', boxSizing: 'border-box', resize: 'vertical',
  fontFamily: 'inherit', marginTop: 4,
};

const addBtnSmall = {
  padding: '5px 12px', fontSize: 12, fontWeight: 600, border: '1px solid #d1d5db',
  background: '#fff', color: '#374151', cursor: 'pointer',
};

const removeBtnStyle = {
  padding: '4px 10px', fontSize: 12, border: '1px solid #e5e7eb',
  background: '#fff', color: '#9ca3af', cursor: 'pointer', flexShrink: 0,
};

const categoryCard = {
  background: '#f9fafb', border: '1px solid #e5e7eb',
  padding: 14, marginBottom: 10,
};

const itemCard = {
  background: '#fff', border: '1px solid #e5e7eb',
  padding: 10, marginBottom: 8,
};

const btnBase = {
  padding: '8px 16px', fontSize: 13, fontWeight: 600,
  border: '1px solid transparent', cursor: 'pointer', lineHeight: 1.2,
};

const btnPrimary = { ...btnBase, background: '#111', color: '#fff', borderColor: '#111' };
const btnSecondary = { ...btnBase, background: '#fff', color: '#374151', borderColor: '#d1d5db' };
