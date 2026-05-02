// components/InteractiveEncounterForm.js
// Structured, form-based encounter note builder
// Nurses fill in fields (dropdowns, checkboxes, selectors) instead of typing free text
// The form generates a formatted clinical note on save

import { useState, useEffect, useRef, useMemo } from 'react';
import { ENCOUNTER_FORMS, getFlatPeptideList, generateNoteMarkdown } from '../lib/encounter-form-config';
import { WEIGHT_LOSS_DOSAGES, TESTOSTERONE_DOSES } from '../lib/protocol-config';
import BodyAvatar from './BodyAvatar';

// Parse dose string like "250mcg" or "1.5mg" into { num, unit }
function parseDose(doseStr) {
  if (!doseStr) return null;
  // Handle compound doses like "500mcg/500mcg"
  if (doseStr.includes('/')) return null;
  const match = doseStr.match(/^([\d.]+)\s*(mcg|mg|ml|mL|IU|units?)$/i);
  if (!match) return null;
  return { num: parseFloat(match[1]), unit: match[2].toLowerCase() };
}

// Generate dose options between startingDose and maxDose
function generateDoseOptions(startingDose, maxDose) {
  const start = parseDose(startingDose);
  const max = parseDose(maxDose);
  if (!start || !max || start.unit !== max.unit) {
    // Can't generate steps — return the raw values
    const opts = [startingDose];
    if (maxDose && maxDose !== startingDose) opts.push(maxDose);
    return opts;
  }
  const unit = start.unit;
  const range = max.num - start.num;
  if (range <= 0) return [`${start.num}${unit}`];

  // Pick a sensible step size
  let step;
  if (unit === 'mcg') {
    if (range <= 100) step = 25;
    else if (range <= 500) step = 50;
    else if (range <= 1000) step = 100;
    else step = 250;
  } else if (unit === 'mg') {
    if (range <= 1) step = 0.25;
    else if (range <= 5) step = 0.5;
    else if (range <= 10) step = 1;
    else step = 2;
  } else {
    step = range / 4;
  }

  const options = [];
  for (let d = start.num; d <= max.num + 0.001; d += step) {
    const rounded = Math.round(d * 1000) / 1000;
    // Format: remove trailing zeros (0.250 → 0.25, 1.000 → 1)
    const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toString();
    options.push(`${formatted}${unit}`);
  }
  // Ensure max dose is included
  const maxStr = `${max.num}${unit}`;
  if (!options.includes(maxStr)) options.push(maxStr);
  return options;
}

// Peptide search component with autocomplete
function PeptideSearch({ value, onChange, onSelectMedication }) {
  const [search, setSearch] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const allPeptides = useMemo(() => getFlatPeptideList(), []);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return allPeptides;
    const q = search.toLowerCase();
    return allPeptides.filter(p => p.value.toLowerCase().includes(q) || p.group.toLowerCase().includes(q));
  }, [search, allPeptides]);

  // Group filtered results
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(p => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });
    return groups;
  }, [filtered]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowDropdown(true);
          setSelectedInfo(null);
          if (!e.target.value.trim()) {
            onChange('');
            onSelectMedication(null);
          }
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder="Search medications..."
        style={styles.input}
      />
      {showDropdown && (
        <div ref={dropdownRef} style={styles.searchDropdown}>
          {Object.keys(grouped).length === 0 ? (
            <div style={styles.searchEmpty}>No medications found</div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div style={styles.searchGroup}>{group}</div>
                {items.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setSearch(item.value);
                      setSelectedInfo(item);
                      setShowDropdown(false);
                      onChange(item.value);
                      onSelectMedication(item);
                    }}
                    style={{
                      ...styles.searchItem,
                      ...(search === item.value ? styles.searchItemActive : {}),
                    }}
                  >
                    <span style={styles.searchItemName}>{item.value}</span>
                    <span style={styles.searchItemDose}>{item.startingDose} – {item.maxDose}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
      {selectedInfo && (
        <div style={styles.medInfoBar}>
          <span style={styles.medInfoChip}>📋 {selectedInfo.frequency}</span>
          {selectedInfo.notes && <span style={styles.medInfoChip}>{selectedInfo.notes}</span>}
        </div>
      )}
    </div>
  );
}

// Main interactive form component.
//
// `currentProtocol` (optional) is the patient's active WL/HRT protocol. When
// present, the dose field locks to `currentProtocol.selected_dose` — staff
// cannot pick a different dose from the encounter form. Dose changes for
// gated categories (WL, HRT) must go through the Meds tab → Change Dose flow,
// which sends a Burgess SMS approval request. This closes the hole that let
// a nurse bump Claudia Rangel from 6mg → 8mg via a charting note on
// 2026-04-28.
export default function InteractiveEncounterForm({ formType, vitals, currentProtocol, currentUser, onSave, onCancel }) {
  const formDef = ENCOUNTER_FORMS[formType];
  if (!formDef) return null;

  // Lock the dose for WL/HRT encounter forms when the patient has an active
  // gated protocol. We compare the form type — only the categories whose
  // protocols are gated by the dose-change approval flow get locked.
  const lockedDose =
    currentProtocol?.selected_dose &&
    (formType === 'weight_loss' || formType === 'hrt_followup')
      ? currentProtocol.selected_dose
      : null;
  const lockedMedication =
    currentProtocol?.medication && formType === 'weight_loss'
      ? currentProtocol.medication
      : null;

  // Build default field values for a section
  const buildSectionDefaults = (section) => {
    const obj = {};
    section.fields.forEach(field => {
      if (field.type === 'vitamin_dose') {
        obj[field.key] = [];
        obj.vitamin_doses = {};
      } else if (field.type === 'multi_check') {
        obj[field.key] = (field.defaultChecked || []).map(i => field.options[i]);
      } else if (field.type === 'toggle') {
        obj[field.key] = field.defaultValue || field.options[0];
      } else {
        obj[field.key] = field.defaultValue || '';
      }
    });
    return obj;
  };

  // Build initial form state from section definitions
  const buildInitialState = () => {
    const state = {};
    formDef.sections.forEach(section => {
      if (section.type === 'checklist') {
        state[section.key] = {};
        section.items.forEach(item => {
          state[section.key][item.key] = item.defaultChecked || false;
        });
      } else if (section.type === 'fields') {
        if (section.repeatable) {
          // Repeatable sections: start with one instance keyed as section.key + '_0'
          state[`${section.key}_0`] = buildSectionDefaults(section);
          state[`_repeat_count_${section.key}`] = 1;
        } else {
          state[section.key] = buildSectionDefaults(section);
        }
      }
    });
    return state;
  };

  const [formData, setFormData] = useState(buildInitialState);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [selectedMedInfo, setSelectedMedInfo] = useState(null);
  const [customDose, setCustomDose] = useState(false);
  const [selectedWLMed, setSelectedWLMed] = useState('');

  // When the dose is locked to the active protocol, seed the medication and
  // dose fields so the generated note reflects the prescribed regimen. We
  // run this once when currentProtocol becomes available — staff can still
  // edit other fields on the form (route, site, weight, plan, etc.).
  useEffect(() => {
    if (!lockedDose && !lockedMedication) return;
    setFormData(prev => {
      if (!prev.medication) return prev;
      const next = { ...prev, medication: { ...prev.medication } };
      if (lockedMedication && !next.medication.medication_name) {
        next.medication.medication_name = lockedMedication;
        if (lockedMedication !== 'Other') setSelectedWLMed(lockedMedication);
      }
      if (lockedDose && next.medication.dose !== lockedDose) {
        next.medication.dose = lockedDose;
      }
      return next;
    });
  }, [lockedDose, lockedMedication]);

  // Rich text editor state for Provider Notes
  const notesEditorRef = useRef(null);
  const notesUndoStack = useRef([]);
  const [aiFormatting, setAiFormatting] = useState(false);

  const saveNotesUndoSnapshot = () => {
    if (notesEditorRef.current) {
      notesUndoStack.current.push(notesEditorRef.current.innerHTML);
      if (notesUndoStack.current.length > 30) notesUndoStack.current.shift();
    }
  };
  const handleNotesUndo = () => {
    if (!notesEditorRef.current) return;
    if (notesUndoStack.current.length > 0) {
      notesEditorRef.current.innerHTML = notesUndoStack.current.pop();
    } else {
      notesEditorRef.current.focus();
      document.execCommand('undo', false, null);
    }
    syncNotesEditorToForm();
  };
  const execNotesFormat = (command, value = null) => {
    if (!notesEditorRef.current) return;
    notesEditorRef.current.focus();
    document.execCommand(command, false, value);
  };
  const htmlToMarkdown = (html) => {
    let text = html;
    // Convert bold tags to markdown
    text = text.replace(/<(b|strong)>(.*?)<\/\1>/gi, '**$2**');
    // Convert italic tags to markdown
    text = text.replace(/<(i|em)>(.*?)<\/\1>/gi, '*$2*');
    // Convert <br> and block-level elements to newlines
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/?(div|p|li|ul|ol)[^>]*>/gi, '\n');
    // Strip any remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');
    // Clean up excessive newlines
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
  };
  const syncNotesEditorToForm = () => {
    const html = notesEditorRef.current?.innerHTML || '';
    const text = htmlToMarkdown(html);
    updateField('additional', 'notes', text);
  };
  const handleNotesAIFormat = async () => {
    const text = notesEditorRef.current?.innerText || '';
    if (!text.trim()) return;
    setAiFormatting(true);
    try {
      const res = await fetch('/api/notes/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text, note_type: 'additional_notes' }),
      });
      const data = await res.json();
      if (data.formatted && notesEditorRef.current) {
        saveNotesUndoSnapshot();
        // Convert markdown bold to HTML so it renders in the editor
        const htmlContent = data.formatted
          .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
          .replace(/\n/g, '<br>');
        notesEditorRef.current.innerHTML = htmlContent;
        syncNotesEditorToForm();
      }
    } catch (err) {
      console.error('AI format error:', err);
    } finally {
      setAiFormatting(false);
    }
  };

  // Staff display names imported from centralized config
  const { STAFF_DISPLAY_NAMES } = require('../lib/staff-config');

  // Auto-fill performed_by from currentUser
  useEffect(() => {
    if (currentUser && formData.additional && !formData.additional.performed_by) {
      const displayName = STAFF_DISPLAY_NAMES[currentUser.toLowerCase()]
        || (currentUser.split('@')[0].charAt(0).toUpperCase() + currentUser.split('@')[0].slice(1));
      updateField('additional', 'performed_by', displayName);
    }
  }, [currentUser]);

  // Signature IV formula → vitamin presets (matches range-medical.com/iv-therapy)
  const IV_FORMULA_PRESETS = {
    'Immune Defense IV': [
      'Vitamin C (Ascorbic Acid)', 'Zinc Sulfate', 'Glutathione', 'B-Complex (B1, B2, B3, B5, B6)', 'Magnesium Chloride',
    ],
    'Energy & Vitality IV': [
      'Vitamin B12 (Methylcobalamin)', 'B-Complex (B1, B2, B3, B5, B6)', 'L-Carnitine', 'Magnesium Chloride', 'Vitamin C (Ascorbic Acid)',
    ],
    'Muscle Recovery & Performance IV': [
      'Taurine', 'Magnesium Chloride', 'B-Complex (B1, B2, B3, B5, B6)', 'Vitamin C (Ascorbic Acid)', 'Glutathione',
    ],
    'Detox & Cellular Repair IV': [
      'Glutathione', 'Vitamin C (Ascorbic Acid)', 'Alpha Lipoic Acid (ALA)', 'Zinc Sulfate', 'Magnesium Chloride',
    ],
  };

  const updateField = (sectionKey, fieldKey, value) => {
    setFormData(prev => {
      const next = {
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          [fieldKey]: value,
        },
      };
      // Auto-check vitamins when a signature IV formula is selected
      if (sectionKey === 'infusion' && fieldKey === 'infusion_type' && IV_FORMULA_PRESETS[value]) {
        const presetNames = IV_FORMULA_PRESETS[value];
        next.infusion = { ...next.infusion, vitamins: [...presetNames] };
        // Also set default 1 mL doses for each preset vitamin
        const vitField = ENCOUNTER_FORMS.iv_therapy?.sections?.find(s => s.key === 'infusion')?.fields?.find(f => f.key === 'vitamins');
        if (vitField?.items) {
          const doses = {};
          presetNames.forEach(name => {
            const item = vitField.items.find(it => it.name === name);
            if (item) doses[name] = { cc: 1, mg: item.mgPerMl || null, mcg: item.mcgPerMl || null, iu: item.iuPerMl || null };
          });
          next.infusion.vitamin_doses = doses;
        }
      }
      if (sectionKey === 'infusion' && fieldKey === 'infusion_type') {
        const HYDRATION_IV_TYPES = [
          'High-Dose Vitamin C 25g', 'High-Dose Vitamin C 50g', 'High-Dose Vitamin C 75g',
          'NAD+ IV 225mg', 'NAD+ IV 500mg', 'NAD+ IV 750mg', 'NAD+ IV 1000mg',
          'Methylene Blue IV', 'MB + Vit C + Mag Combo',
        ];
        const hydrationText = 'Patient instructed to maintain hydration.';
        const current = next.outcome?.post_care || [];
        if (HYDRATION_IV_TYPES.includes(value)) {
          if (!current.includes(hydrationText)) {
            next.outcome = { ...next.outcome, post_care: [...current, hydrationText] };
          }
        } else {
          next.outcome = { ...next.outcome, post_care: current.filter(o => o !== hydrationText) };
        }
      }
      return next;
    });
  };

  const toggleChecklistItem = (sectionKey, itemKey) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [itemKey]: !prev[sectionKey][itemKey],
      },
    }));
  };

  const toggleMultiCheck = (sectionKey, fieldKey, option) => {
    setFormData(prev => {
      const current = prev[sectionKey][fieldKey] || [];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      return {
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          [fieldKey]: updated,
        },
      };
    });
  };

  // Add another instance of a repeatable section
  const addRepeatableInstance = (section) => {
    setFormData(prev => {
      const count = prev[`_repeat_count_${section.key}`] || 1;
      return {
        ...prev,
        [`${section.key}_${count}`]: buildSectionDefaults(section),
        [`_repeat_count_${section.key}`]: count + 1,
      };
    });
  };

  // Remove an instance of a repeatable section
  const removeRepeatableInstance = (section, idx) => {
    setFormData(prev => {
      const count = prev[`_repeat_count_${section.key}`] || 1;
      if (count <= 1) return prev; // Always keep at least one
      const next = { ...prev };
      // Shift entries down to fill the gap
      for (let i = idx; i < count - 1; i++) {
        next[`${section.key}_${i}`] = prev[`${section.key}_${i + 1}`];
      }
      delete next[`${section.key}_${count - 1}`];
      next[`_repeat_count_${section.key}`] = count - 1;
      return next;
    });
  };

  // Check required fields
  const getMissingFields = () => {
    const missing = [];
    formDef.sections.forEach(section => {
      if (section.type === 'fields') {
        if (section.repeatable) {
          // Validate all instances of repeatable sections
          const count = formData[`_repeat_count_${section.key}`] || 1;
          for (let i = 0; i < count; i++) {
            const sKey = `${section.key}_${i}`;
            section.fields.forEach(field => {
              if (field.required) {
                if (field.conditionalOn) {
                  const parentVal = formData[sKey]?.[field.conditionalOn.field];
                  if (!conditionalMatch(parentVal, field.conditionalOn.value)) return;
                }
                if (field.conditionalOnNot) {
                  const parentVal = formData[sKey]?.[field.conditionalOnNot.field];
                  if (conditionalMatch(parentVal, field.conditionalOnNot.value)) return;
                }
                const val = formData[sKey]?.[field.key];
                if (!val || (typeof val === 'string' && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
                  const label = count > 1 ? `${field.label} (Injection ${i + 1})` : field.label;
                  missing.push(label);
                }
              }
            });
          }
        } else {
          section.fields.forEach(field => {
            if (field.required) {
              // Skip validation for conditionally hidden fields
              if (field.conditionalOn) {
                const parentVal = formData[section.key]?.[field.conditionalOn.field];
                if (!conditionalMatch(parentVal, field.conditionalOn.value)) return;
              }
              if (field.conditionalOnNot) {
                const parentVal = formData[section.key]?.[field.conditionalOnNot.field];
                if (conditionalMatch(parentVal, field.conditionalOnNot.value)) return;
              }
              const val = formData[section.key]?.[field.key];
              if (!val || (typeof val === 'string' && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
                missing.push(field.label);
              }
            }
          });
        }
      }
    });
    return missing;
  };

  // Check if a conditional field should be visible (handles both scalar and array parent values)
  const conditionalMatch = (parentVal, targetVal) => {
    if (Array.isArray(parentVal)) return parentVal.includes(targetVal);
    return parentVal === targetVal;
  };

  const generatedNote = generateNoteMarkdown(formType, formData, vitals);
  const missingFields = getMissingFields();

  const handleSave = async () => {
    if (missingFields.length > 0) return;
    setSaving(true);
    try {
      await onSave({
        markdown: generatedNote,
        structured_data: formData,
        note_type: formDef.noteType,
        form_type: formType,
      });
    } finally {
      setSaving(false);
    }
  };

  // Render a single field
  const renderField = (field, sectionKey) => {
    const value = formData[sectionKey]?.[field.key] ?? '';

    switch (field.type) {
      case 'peptide_search':
        return (
          <PeptideSearch
            value={value}
            onChange={(val) => updateField(sectionKey, field.key, val)}
            onSelectMedication={(medInfo) => {
              setSelectedMedInfo(medInfo);
              setCustomDose(false);
              // Auto-set dose to starting dose
              if (medInfo) {
                updateField('medication', 'dose', medInfo.startingDose);
              } else {
                updateField('medication', 'dose', '');
              }
            }}
          />
        );

      case 'dose_select': {
        const doseOptions = selectedMedInfo
          ? (selectedMedInfo.doseOptions || generateDoseOptions(selectedMedInfo.startingDose, selectedMedInfo.maxDose))
          : [];

        if (!selectedMedInfo) {
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => updateField(sectionKey, field.key, e.target.value)}
              placeholder="Select a medication first"
              style={{ ...styles.input, background: '#f9fafb', color: '#9ca3af' }}
              disabled
            />
          );
        }

        if (customDose) {
          return (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={value}
                onChange={(e) => updateField(sectionKey, field.key, e.target.value)}
                placeholder={`e.g. ${selectedMedInfo.startingDose}`}
                style={{ ...styles.input, flex: 1 }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setCustomDose(false);
                  updateField(sectionKey, field.key, selectedMedInfo.startingDose);
                }}
                style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 0, background: '#fff', color: '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                ← Presets
              </button>
            </div>
          );
        }

        return (
          <div>
            <div style={styles.doseGrid}>
              {doseOptions.map((dose) => (
                <button
                  key={dose}
                  type="button"
                  onClick={() => updateField(sectionKey, field.key, dose)}
                  style={{
                    ...styles.doseBtn,
                    ...(value === dose ? styles.doseBtnActive : {}),
                  }}
                >
                  {value === dose && <span style={{ marginRight: 4 }}>✓</span>}
                  {dose}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomDose(true)}
                style={{
                  ...styles.doseBtn,
                  ...styles.doseBtnCustom,
                  ...(value && !doseOptions.includes(value) ? styles.doseBtnActive : {}),
                }}
              >
                Custom
              </button>
            </div>
            {selectedMedInfo.startingDose !== selectedMedInfo.maxDose && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: 0, fontWeight: 600, fontSize: 10 }}>RANGE</span>
                {selectedMedInfo.startingDose} → {selectedMedInfo.maxDose}
              </div>
            )}
          </div>
        );
      }

      case 'wl_dose_select': {
        const wlMed = formData.medication?.medication_name || selectedWLMed;
        const wlDoses = wlMed ? (WEIGHT_LOSS_DOSAGES[wlMed] || []) : [];

        // When a WL protocol is active, the dose is locked to the protocol's
        // current dose. Dose changes for WL must go through the Meds tab →
        // Change Dose flow (Burgess SMS approval). Render a read-only display
        // with a clear notice instead of the dose-picker buttons.
        if (lockedDose) {
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{lockedDose}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Locked to active protocol</div>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                To change the dose, open the patient's <strong>Meds</strong> tab and click <strong>Change Dose</strong> — that sends an approval request to Dr. Burgess (or Brendyn Reed NP). The encounter form documents the dose given, not changes to it.
              </div>
            </div>
          );
        }

        if (!wlMed) {
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => updateField(sectionKey, field.key, e.target.value)}
              placeholder="Select a medication first"
              style={{ ...styles.input, background: '#f9fafb', color: '#9ca3af' }}
              disabled
            />
          );
        }

        if (customDose) {
          return (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={value}
                onChange={(e) => updateField(sectionKey, field.key, e.target.value)}
                placeholder="e.g. 2.5mg"
                style={{ ...styles.input, flex: 1 }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setCustomDose(false)}
                style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 0, background: '#fff', color: '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                ← Presets
              </button>
            </div>
          );
        }

        return (
          <div>
            <div style={styles.doseGrid}>
              {wlDoses.map((dose) => (
                <button
                  key={dose}
                  type="button"
                  onClick={() => updateField(sectionKey, field.key, dose)}
                  style={{
                    ...styles.doseBtn,
                    ...(value === dose ? styles.doseBtnActive : {}),
                  }}
                >
                  {value === dose && <span style={{ marginRight: 4 }}>✓</span>}
                  {dose}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomDose(true)}
                style={{
                  ...styles.doseBtn,
                  ...styles.doseBtnCustom,
                  ...(value && !wlDoses.includes(value) ? styles.doseBtnActive : {}),
                }}
              >
                Custom
              </button>
            </div>
          </div>
        );
      }

      case 'trt_dose_select': {
        const patientSex = formData.medication?.patient_sex || '';
        const sexKey = patientSex === 'Male' ? 'male' : patientSex === 'Female' ? 'female' : '';
        const trtDoses = sexKey ? (TESTOSTERONE_DOSES[sexKey] || []) : [];

        // HRT dose changes are gated by the same approval flow as WL.
        if (lockedDose) {
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{lockedDose}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Locked to active protocol</div>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                To change the dose, open the patient's <strong>Meds</strong> tab and click <strong>Change Dose</strong> — that sends an approval request to Dr. Burgess (or Brendyn Reed NP). The encounter form documents the dose given, not changes to it.
              </div>
            </div>
          );
        }

        if (!patientSex) {
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => updateField(sectionKey, field.key, e.target.value)}
              placeholder="Select patient sex first"
              style={{ ...styles.input, background: '#f9fafb', color: '#9ca3af' }}
              disabled
            />
          );
        }

        if (customDose) {
          return (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={value}
                onChange={(e) => updateField(sectionKey, field.key, e.target.value)}
                placeholder="e.g. 0.5ml/100mg"
                style={{ ...styles.input, flex: 1 }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setCustomDose(false)}
                style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 0, background: '#fff', color: '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                ← Presets
              </button>
            </div>
          );
        }

        return (
          <div>
            <div style={styles.doseGrid}>
              {trtDoses.map((dose) => (
                <button
                  key={dose.value}
                  type="button"
                  onClick={() => updateField(sectionKey, field.key, dose.label)}
                  style={{
                    ...styles.doseBtn,
                    ...(value === dose.label ? styles.doseBtnActive : {}),
                  }}
                >
                  {value === dose.label && <span style={{ marginRight: 4 }}>✓</span>}
                  {dose.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomDose(true)}
                style={{
                  ...styles.doseBtn,
                  ...styles.doseBtnCustom,
                  ...(value && !trtDoses.find(d => d.label === value) ? styles.doseBtnActive : {}),
                }}
              >
                Custom
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 0, fontWeight: 600, fontSize: 10 }}>{patientSex.toUpperCase()}</span>
              {trtDoses.length > 0 && `${trtDoses[0].label} → ${trtDoses[trtDoses.length - 1].label}`}
            </div>
          </div>
        );
      }

      case 'body_avatar':
        return (
          <BodyAvatar
            selectedZone={value || null}
            onSelectZone={(zoneInfo) => {
              updateField(sectionKey, field.key, zoneInfo.zoneId);
              // Auto-fill location and orientation from avatar click
              if (zoneInfo.location) {
                updateField('iv_access', 'location', zoneInfo.location);
              }
              if (zoneInfo.side || zoneInfo.orientation) {
                const currentOrientation = formData.iv_access?.orientation || [];
                const newOrientation = [...currentOrientation];
                if (zoneInfo.side && !newOrientation.includes(zoneInfo.side)) {
                  // Remove existing Left/Right before adding new one
                  const filtered = newOrientation.filter(o => o !== 'Left' && o !== 'Right');
                  filtered.push(zoneInfo.side);
                  if (zoneInfo.orientation && !filtered.includes(zoneInfo.orientation)) {
                    // Remove existing Anterior/Posterior
                    const filtered2 = filtered.filter(o => o !== 'Anterior' && o !== 'Posterior');
                    filtered2.push(zoneInfo.orientation);
                    updateField('iv_access', 'orientation', filtered2);
                  } else {
                    updateField('iv_access', 'orientation', filtered);
                  }
                } else if (zoneInfo.orientation && !newOrientation.includes(zoneInfo.orientation)) {
                  const filtered = newOrientation.filter(o => o !== 'Anterior' && o !== 'Posterior');
                  filtered.push(zoneInfo.orientation);
                  updateField('iv_access', 'orientation', filtered);
                }
              }
            }}
          />
        );

      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateField(sectionKey, field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            style={styles.input}
          />
        );

      case 'textarea': {
        // Only the main "Provider Notes" field uses the rich contentEditable editor
        // (which is bound to a single shared ref → additional.notes). Every other
        // textarea — e.g. "Side Effect Management" — must be a plain controlled
        // textarea so its content saves to its own section/field key.
        const isMainNotes = sectionKey === 'additional' && field.key === 'notes';
        if (!isMainNotes) {
          return (
            <textarea
              value={value}
              onChange={(e) => updateField(sectionKey, field.key, e.target.value)}
              placeholder={field.placeholder || ''}
              rows={3}
              style={{ ...styles.input, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
            />
          );
        }
        return (
          <div>
            {/* Formatting toolbar */}
            <div style={styles.richToolbar}>
              <button type="button" onClick={handleNotesUndo} title="Undo" style={styles.toolbarBtn}>↩</button>
              <div style={styles.toolbarDivider} />
              <button type="button" onClick={() => execNotesFormat('bold')} title="Bold" style={{ ...styles.toolbarBtn, fontWeight: 800, fontFamily: 'serif' }}>B</button>
              <button type="button" onClick={() => execNotesFormat('italic')} title="Italic" style={{ ...styles.toolbarBtn, fontStyle: 'italic', fontFamily: 'serif' }}>I</button>
              <button type="button" onClick={() => execNotesFormat('underline')} title="Underline" style={{ ...styles.toolbarBtn, textDecoration: 'underline', fontFamily: 'serif' }}>U</button>
              <div style={styles.toolbarDivider} />
              <button type="button" onClick={() => execNotesFormat('insertUnorderedList')} title="Bullet List" style={styles.toolbarBtn}>•≡</button>
              <button type="button" onClick={() => execNotesFormat('insertOrderedList')} title="Numbered List" style={styles.toolbarBtn}>1.≡</button>
              <div style={styles.toolbarDivider} />
              <button type="button" onClick={() => execNotesFormat('removeFormat')} title="Clear Formatting" style={{ ...styles.toolbarBtn, color: '#9ca3af' }}>T̸</button>
            </div>
            {/* Editable area */}
            <div
              ref={notesEditorRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder={field.placeholder || ''}
              onInput={syncNotesEditorToForm}
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);
              }}
              style={styles.richEditor}
            />
            {/* AI format button */}
            <div style={{ display: 'flex', marginTop: 6 }}>
              <button
                type="button"
                onClick={handleNotesAIFormat}
                disabled={aiFormatting}
                style={styles.aiFormatBtn}
              >
                {aiFormatting ? 'Formatting...' : '✨ Format with AI'}
              </button>
            </div>
          </div>
        );
      }

      case 'select':
        // Lock the WL medication picker to the active protocol's medication
        // so the locked dose can't drift from a mismatched med.
        if (field.key === 'medication_name' && lockedMedication) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{lockedMedication}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>From active protocol</div>
            </div>
          );
        }
        return (
          <select
            value={value}
            onChange={(e) => {
              updateField(sectionKey, field.key, e.target.value);
              // If this is the WL medication selector, update dose options
              if (field.key === 'medication_name' && WEIGHT_LOSS_DOSAGES[e.target.value]) {
                setSelectedWLMed(e.target.value);
                setCustomDose(false);
                updateField(sectionKey, 'dose', '');
              }
            }}
            style={styles.select}
          >
            <option value="">Select...</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'button_group': {
        const predefinedOpts = field.options.filter(o => o !== 'Other');
        const hasOther = field.options.includes('Other');
        const isOtherSelected = hasOther && value && !predefinedOpts.includes(value);
        return (
          <div>
            <div style={styles.buttonGroup}>
              {field.options.map((opt) => {
                const isActive = opt === 'Other' ? isOtherSelected : value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      if (opt === 'Other') {
                        updateField(sectionKey, field.key, 'Other');
                      } else {
                        updateField(sectionKey, field.key, opt);
                      }
                      // Reset dose when patient sex changes (TRT forms)
                      if (field.key === 'patient_sex') {
                        updateField(sectionKey, 'dose', '');
                        setCustomDose(false);
                      }
                    }}
                    style={{
                      ...styles.groupBtn,
                      ...(isActive ? styles.groupBtnActive : {}),
                    }}
                  >
                    {isActive && <span style={{ marginRight: 4 }}>✓</span>}
                    {opt}
                  </button>
                );
              })}
            </div>
            {isOtherSelected && (
              <input
                type="text"
                value={value === 'Other' ? '' : value}
                onChange={(e) => updateField(sectionKey, field.key, e.target.value || 'Other')}
                placeholder="Type location..."
                autoFocus
                style={{ ...styles.input, marginTop: 8, width: '100%' }}
              />
            )}
          </div>
        );
      }

      case 'toggle':
        return (
          <div style={styles.toggleRow}>
            {field.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => updateField(sectionKey, field.key, opt)}
                style={{
                  ...styles.toggleBtn,
                  ...(value === opt ? styles.toggleBtnActive : {}),
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        );

      case 'vitamin_dose': {
        const selectedVitamins = formData[sectionKey]?.[field.key] || [];
        const vitaminDoses = formData[sectionKey]?.vitamin_doses || {};
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {field.items.map((item, i) => {
              const checked = selectedVitamins.includes(item.name);
              const doseInfo = vitaminDoses[item.name] || {};
              const ccOptions = [];
              for (let c = 0.5; c <= item.maxCc; c += 0.5) ccOptions.push(c);
              return (
                <div key={i}>
                  <label style={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const updated = checked
                          ? selectedVitamins.filter(v => v !== item.name)
                          : [...selectedVitamins, item.name];
                        const updatedDoses = { ...vitaminDoses };
                        if (checked) {
                          delete updatedDoses[item.name];
                        } else {
                          const mg = item.mgPerMl ? item.mgPerMl : null;
                          const mcg = item.mcgPerMl ? item.mcgPerMl : null;
                          const iu = item.iuPerMl ? item.iuPerMl : null;
                          updatedDoses[item.name] = { cc: 1, mg, mcg, iu };
                        }
                        setFormData(prev => ({
                          ...prev,
                          [sectionKey]: { ...prev[sectionKey], [field.key]: updated, vitamin_doses: updatedDoses },
                        }));
                      }}
                      style={{ marginRight: 10, width: 18, height: 18, accentColor: '#111' }}
                    />
                    <span style={{ fontSize: 14, color: checked ? '#111' : '#6b7280' }}>{item.name}</span>
                    {item.strengthLabel && <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}>{item.strengthLabel}</span>}
                  </label>
                  {checked && (
                    <div style={{ marginLeft: 28, marginTop: 4, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {ccOptions.map(cc => {
                        const isSelected = doseInfo.cc === cc;
                        return (
                          <button
                            key={cc}
                            type="button"
                            onClick={() => {
                              const mg = item.mgPerMl ? Math.round(cc * item.mgPerMl * 100) / 100 : null;
                              const mcg = item.mcgPerMl ? Math.round(cc * item.mcgPerMl) : null;
                              const iu = item.iuPerMl ? Math.round(cc * item.iuPerMl) : null;
                              setFormData(prev => ({
                                ...prev,
                                [sectionKey]: {
                                  ...prev[sectionKey],
                                  vitamin_doses: { ...prev[sectionKey].vitamin_doses, [item.name]: { cc, mg, mcg, iu } },
                                },
                              }));
                            }}
                            style={{
                              padding: '4px 10px', fontSize: 12, fontWeight: isSelected ? 700 : 400,
                              border: isSelected ? '2px solid #111' : '1px solid #d1d5db',
                              background: isSelected ? '#f0fdf4' : '#fff', color: '#111',
                              borderRadius: 0, cursor: 'pointer', minWidth: 44, textAlign: 'center',
                            }}
                          >
                            {cc} mL
                          </button>
                        );
                      })}
                      {item.mgPerMl && !item.mcgPerMl && !item.iuPerMl && <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginLeft: 4 }}>
                        = {doseInfo.mg || item.mgPerMl} mg
                      </span>}
                      {item.mcgPerMl && <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginLeft: 4 }}>
                        = {doseInfo.mcg || item.mcgPerMl} mcg
                      </span>}
                      {item.iuPerMl && <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginLeft: 4 }}>
                        = {(doseInfo.iu || item.iuPerMl).toLocaleString()} IU
                      </span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      }

      case 'multi_check':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {field.options.map((opt, i) => {
              const checked = (formData[sectionKey]?.[field.key] || []).includes(opt);
              return (
                <label key={i} style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMultiCheck(sectionKey, field.key, opt)}
                    style={{ marginRight: 10, width: 18, height: 18, accentColor: '#111' }}
                  />
                  <span style={{ fontSize: 14, color: checked ? '#111' : '#6b7280' }}>{opt}</span>
                </label>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.formWrapper}>
      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #c5c5c5;
          pointer-events: none;
        }
      `}</style>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 22 }}>{formDef.icon}</span>
          <span style={styles.headerTitle}>{formDef.label}</span>
          <span style={styles.headerBadge}>Interactive Form</span>
        </div>
        <button onClick={onCancel} style={styles.closeBtn}>×</button>
      </div>

      {/* Sections */}
      {formDef.sections.flatMap((section) => {
        // Repeatable sections (e.g., multiple injections)
        if (section.repeatable && section.type === 'fields') {
          const count = formData[`_repeat_count_${section.key}`] || 1;
          return Array.from({ length: count }, (_, idx) => {
            const sKey = `${section.key}_${idx}`;
            return (
              <div key={sKey} style={styles.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={styles.sectionTitle}>
                    {section.title}{count > 1 ? ` #${idx + 1}` : ''}
                  </div>
                  {count > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRepeatableInstance(section, idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '4px 8px' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div style={styles.fieldGrid}>
                  {section.fields.map((field) => {
                    if (field.conditionalOn) {
                      const parentVal = formData[sKey]?.[field.conditionalOn.field];
                      if (!conditionalMatch(parentVal, field.conditionalOn.value)) return null;
                    }
                    if (field.conditionalOnNot) {
                      const parentVal = formData[sKey]?.[field.conditionalOnNot.field];
                      if (conditionalMatch(parentVal, field.conditionalOnNot.value)) return null;
                    }
                    return (
                      <div key={field.key} style={{
                        ...(field.type === 'button_group' || field.type === 'textarea' || field.type === 'multi_check' || field.type === 'vitamin_dose' || field.type === 'peptide_search' || field.type === 'dose_select' || field.type === 'wl_dose_select' || field.type === 'trt_dose_select' || field.type === 'body_avatar'
                          ? styles.fieldFull : styles.fieldHalf),
                      }}>
                        <label style={styles.fieldLabel}>
                          {field.label}
                          {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
                        </label>
                        {renderField(field, sKey)}
                      </div>
                    );
                  })}
                </div>
                {idx === count - 1 && (
                  <button
                    type="button"
                    onClick={() => addRepeatableInstance(section)}
                    style={{
                      marginTop: 12, padding: '8px 16px', background: '#f9fafb', border: '1.5px dashed #d1d5db',
                      borderRadius: 8, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%',
                    }}
                  >
                    + {section.repeatLabel || 'Add Another'}
                  </button>
                )}
              </div>
            );
          });
        }

        return (
          <div key={section.key} style={styles.section}>
            <div style={styles.sectionTitle}>{section.title}</div>

            {section.type === 'checklist' && (
              <div style={styles.checklist}>
                {section.items.map((item) => {
                  const checked = formData[section.key]?.[item.key] || false;
                  return (
                    <label key={item.key} style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChecklistItem(section.key, item.key)}
                        style={{ marginRight: 10, width: 18, height: 18, accentColor: '#059669' }}
                      />
                      <span style={{
                        fontSize: 14,
                        color: checked ? '#111' : '#9ca3af',
                        textDecoration: checked ? 'none' : 'none',
                      }}>
                        {checked && <span style={{ color: '#059669', marginRight: 4 }}>✓</span>}
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {section.type === 'fields' && (
              <div style={styles.fieldGrid}>
                {section.fields.map((field) => {
                  // Conditional field: only show when parent field matches value
                  if (field.conditionalOn) {
                    const parentVal = formData[section.key]?.[field.conditionalOn.field];
                    if (!conditionalMatch(parentVal, field.conditionalOn.value)) return null;
                  }
                  if (field.conditionalOnNot) {
                    const parentVal = formData[section.key]?.[field.conditionalOnNot.field];
                    if (conditionalMatch(parentVal, field.conditionalOnNot.value)) return null;
                  }
                  return (
                    <div key={field.key} style={{
                      ...(field.type === 'button_group' || field.type === 'textarea' || field.type === 'multi_check' || field.type === 'vitamin_dose' || field.type === 'peptide_search' || field.type === 'dose_select' || field.type === 'wl_dose_select' || field.type === 'trt_dose_select' || field.type === 'body_avatar'
                        ? styles.fieldFull : styles.fieldHalf),
                    }}>
                      <label style={styles.fieldLabel}>
                        {field.label}
                        {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
                      </label>
                      {renderField(field, section.key)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Preview toggle */}
      <div style={styles.previewToggle}>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          style={styles.previewBtn}
        >
          {preview ? '✕ Hide Preview' : '👁 Preview Generated Note'}
        </button>
      </div>

      {preview && (
        <div style={styles.previewBox}>
          <div style={styles.previewLabel}>This is the note that will be saved to the patient chart:</div>
          <div style={styles.previewContent}>
            {generatedNote.split('\n').map((line, i) => {
              if (!line.trim()) return <br key={i} />;
              // Render **bold** markdown
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return (
                <div key={i} style={{ marginBottom: 2 }}>
                  {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div style={styles.actionBar}>
        {missingFields.length > 0 && (
          <div style={styles.missingWarning}>
            Missing: {missingFields.join(', ')}
          </div>
        )}
        <div style={styles.actionBtns}>
          <button onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={missingFields.length > 0 || saving}
            style={{
              ...styles.saveBtn,
              ...(missingFields.length > 0 ? styles.saveBtnDisabled : {}),
            }}
          >
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = {
  formWrapper: {
    background: '#fff',
    borderRadius: 0,
    border: '1.5px solid #e5e7eb',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    background: '#fafafa',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#111',
  },
  headerBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6d28d9',
    background: '#f3e8ff',
    padding: '3px 10px',
    borderRadius: 0,
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 0,
    border: 'none',
    background: 'transparent',
    fontSize: 20,
    color: '#9ca3af',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: '18px 20px',
    borderBottom: '1px solid #f3f4f6',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '4px 0',
  },
  fieldGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
  },
  fieldHalf: {
    flex: '1 1 calc(50% - 8px)',
    minWidth: 200,
  },
  fieldFull: {
    flex: '1 1 100%',
  },
  fieldLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    border: '1.5px solid #e5e7eb',
    borderRadius: 0,
    background: '#fff',
    color: '#111',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    border: '1.5px solid #e5e7eb',
    borderRadius: 0,
    background: '#fff',
    color: '#111',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.6,
    boxSizing: 'border-box',
  },
  richToolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 2,
    padding: '6px 8px',
    background: '#f9fafb',
    border: '1.5px solid #e5e7eb',
    borderBottom: 'none',
    alignItems: 'center',
  },
  toolbarBtn: {
    padding: '5px 8px',
    fontSize: 13,
    fontWeight: 600,
    border: '1px solid #d1d5db',
    borderRadius: 0,
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
    lineHeight: 1,
  },
  toolbarDivider: {
    width: 1,
    height: 22,
    background: '#d1d5db',
    margin: '0 4px',
  },
  richEditor: {
    width: '100%',
    minHeight: 80,
    padding: '10px 14px',
    fontSize: 14,
    border: '1.5px solid #e5e7eb',
    background: '#fff',
    color: '#111',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.6,
    boxSizing: 'border-box',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  aiFormatBtn: {
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    border: '1px solid #d1d5db',
    borderRadius: 0,
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    border: '1.5px solid #e5e7eb',
    borderRadius: 0,
    background: '#fff',
    color: '#111',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236b7280\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: 36,
    boxSizing: 'border-box',
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupBtn: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    border: '1.5px solid #e5e7eb',
    borderRadius: 0,
    background: '#fff',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  groupBtnActive: {
    background: '#111',
    color: '#fff',
    borderColor: '#111',
  },
  toggleRow: {
    display: 'flex',
    gap: 0,
    borderRadius: 0,
    overflow: 'hidden',
    border: '1.5px solid #e5e7eb',
    width: 'fit-content',
  },
  toggleBtn: {
    padding: '8px 24px',
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    background: '#fff',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  toggleBtnActive: {
    background: '#111',
    color: '#fff',
  },
  previewToggle: {
    padding: '12px 20px',
    borderBottom: '1px solid #f3f4f6',
  },
  previewBtn: {
    fontSize: 13,
    fontWeight: 600,
    color: '#6d28d9',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  previewBox: {
    padding: '16px 20px',
    background: '#faf8ff',
    borderBottom: '1px solid #f3f4f6',
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6d28d9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  previewContent: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#111',
    fontFamily: 'inherit',
    whiteSpace: 'pre-wrap',
  },
  actionBar: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    background: '#fafafa',
  },
  missingWarning: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: 500,
  },
  actionBtns: {
    display: 'flex',
    gap: 10,
    marginLeft: 'auto',
  },
  cancelBtn: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    border: '1.5px solid #e5e7eb',
    borderRadius: 0,
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 700,
    border: 'none',
    borderRadius: 0,
    background: '#111',
    color: '#fff',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  saveBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  // Peptide search styles
  searchDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 280,
    overflowY: 'auto',
    background: '#fff',
    border: '1.5px solid #e5e7eb',
    borderRadius: 0,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 100,
    marginTop: 4,
  },
  searchEmpty: {
    padding: '16px 14px',
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  searchGroup: {
    padding: '8px 14px 4px',
    fontSize: 11,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderTop: '1px solid #f3f4f6',
  },
  searchItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '9px 14px',
    fontSize: 14,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.1s',
    color: '#111',
  },
  searchItemActive: {
    background: '#f3e8ff',
  },
  searchItemName: {
    fontWeight: 500,
  },
  searchItemDose: {
    fontSize: 12,
    color: '#9ca3af',
  },
  medInfoBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  medInfoChip: {
    fontSize: 12,
    fontWeight: 500,
    color: '#059669',
    background: '#ecfdf5',
    padding: '4px 10px',
    borderRadius: 0,
  },
  // Dose selector styles
  doseGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  doseBtn: {
    padding: '9px 18px',
    fontSize: 14,
    fontWeight: 600,
    border: '1.5px solid #e5e7eb',
    borderRadius: 0,
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  doseBtnActive: {
    background: '#111',
    color: '#fff',
    borderColor: '#111',
  },
  doseBtnCustom: {
    color: '#6d28d9',
    borderColor: '#e9d5ff',
    background: '#faf8ff',
    fontSize: 13,
  },
};
