// components/InteractiveEncounterForm.js
// Structured, form-based encounter note builder
// Nurses fill in fields (dropdowns, checkboxes, selectors) instead of typing free text
// The form generates a formatted clinical note on save

import { useState, useEffect, useRef, useMemo } from 'react';
import { ENCOUNTER_FORMS, getFlatPeptideList, generateNoteMarkdown } from '../lib/encounter-form-config';
import { WEIGHT_LOSS_DOSAGES, TESTOSTERONE_DOSES } from '../lib/protocol-config';

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

// Main interactive form component
export default function InteractiveEncounterForm({ formType, vitals, currentUser, onSave, onCancel }) {
  const formDef = ENCOUNTER_FORMS[formType];
  if (!formDef) return null;

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
        state[section.key] = {};
        section.fields.forEach(field => {
          if (field.type === 'multi_check') {
            state[section.key][field.key] = (field.defaultChecked || []).map(i => field.options[i]);
          } else if (field.type === 'toggle') {
            state[section.key][field.key] = field.defaultValue || field.options[0];
          } else {
            state[section.key][field.key] = field.defaultValue || '';
          }
        });
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

  // Auto-fill performed_by from currentUser
  useEffect(() => {
    if (currentUser && formData.additional && !formData.additional.performed_by) {
      const name = currentUser.split('@')[0];
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      updateField('additional', 'performed_by', displayName);
    }
  }, [currentUser]);

  const updateField = (sectionKey, fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [fieldKey]: value,
      },
    }));
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

  // Check required fields
  const getMissingFields = () => {
    const missing = [];
    formDef.sections.forEach(section => {
      if (section.type === 'fields') {
        section.fields.forEach(field => {
          if (field.required) {
            const val = formData[section.key]?.[field.key];
            if (!val || (typeof val === 'string' && !val.trim())) {
              missing.push(field.label);
            }
          }
        });
      }
    });
    return missing;
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
          ? generateDoseOptions(selectedMedInfo.startingDose, selectedMedInfo.maxDose)
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
                style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap' }}
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
                <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: 10 }}>RANGE</span>
                {selectedMedInfo.startingDose} → {selectedMedInfo.maxDose}
              </div>
            )}
          </div>
        );
      }

      case 'wl_dose_select': {
        const wlMed = formData.medication?.medication_name || selectedWLMed;
        const wlDoses = wlMed ? (WEIGHT_LOSS_DOSAGES[wlMed] || []) : [];

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
                style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap' }}
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
                style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap' }}
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
              <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: 10 }}>{patientSex.toUpperCase()}</span>
              {trtDoses.length > 0 && `${trtDoses[0].label} → ${trtDoses[trtDoses.length - 1].label}`}
            </div>
          </div>
        );
      }

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

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => updateField(sectionKey, field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={3}
            style={styles.textarea}
          />
        );

      case 'select':
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

      case 'button_group':
        return (
          <div style={styles.buttonGroup}>
            {field.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  updateField(sectionKey, field.key, opt);
                  // Reset dose when patient sex changes (TRT forms)
                  if (field.key === 'patient_sex') {
                    updateField(sectionKey, 'dose', '');
                    setCustomDose(false);
                  }
                }}
                style={{
                  ...styles.groupBtn,
                  ...(value === opt ? styles.groupBtnActive : {}),
                }}
              >
                {value === opt && <span style={{ marginRight: 4 }}>✓</span>}
                {opt}
              </button>
            ))}
          </div>
        );

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
      {formDef.sections.map((section) => (
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
              {section.fields.map((field) => (
                <div key={field.key} style={{
                  ...(field.type === 'button_group' || field.type === 'textarea' || field.type === 'multi_check' || field.type === 'peptide_search' || field.type === 'dose_select' || field.type === 'wl_dose_select' || field.type === 'trt_dose_select'
                    ? styles.fieldFull : styles.fieldHalf),
                }}>
                  <label style={styles.fieldLabel}>
                    {field.label}
                    {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
                  </label>
                  {renderField(field, section.key)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

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
    borderRadius: 14,
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
    borderRadius: 20,
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
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
    borderRadius: 10,
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
    borderRadius: 10,
    background: '#fff',
    color: '#111',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.6,
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    border: '1.5px solid #e5e7eb',
    borderRadius: 10,
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
    borderRadius: 10,
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
    borderRadius: 10,
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
    borderRadius: 10,
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 700,
    border: 'none',
    borderRadius: 10,
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
    borderRadius: 12,
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
    borderRadius: 20,
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
    borderRadius: 10,
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
