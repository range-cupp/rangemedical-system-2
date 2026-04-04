// /pages/admin/peptide-guide.js
// Staff Peptide Reference — dosing schedules, reconstitution calculator

import { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { PEPTIDE_OPTIONS } from '../../lib/protocol-config';

// ── Reconstitution math ─────────────────────────────────────────────
// Formula: units = (desired_mg / vial_mg) × total_units
// total_units = bac_water_ml × 100 (1mL = 100 units on insulin syringe)
function calcUnits(vialMg, bacWaterMl, desiredMg) {
  if (!vialMg || !bacWaterMl || !desiredMg) return null;
  const totalUnits = bacWaterMl * 100;
  return (desiredMg / vialMg) * totalUnits;
}

const CATEGORY_COLORS = {
  'GH Secretagogue Blends': { bg: '#dbeafe', text: '#1e40af' },
  'Growth Hormone':         { bg: '#e0e7ff', text: '#3730a3' },
  'Recovery/Healing':       { bg: '#dcfce7', text: '#166534' },
  'Weight Loss':            { bg: '#fef9c3', text: '#854d0e' },
  'GLP-1 Agonists':         { bg: '#fce7f3', text: '#9d174d' },
  'Skin/Hair':              { bg: '#fae8ff', text: '#7e22ce' },
  'Immune':                 { bg: '#ffedd5', text: '#9a3412' },
  'Longevity':              { bg: '#cffafe', text: '#155e75' },
  'Bioregulators':          { bg: '#e0f2fe', text: '#075985' },
  'Cognitive':              { bg: '#f0fdf4', text: '#14532d' },
  'Sleep':                  { bg: '#ede9fe', text: '#5b21b6' },
  'Sexual Health':          { bg: '#fce4ec', text: '#880e4f' },
  'HRT Support':            { bg: '#e8eaf6', text: '#283593' },
  'Mitochondrial':          { bg: '#e0f7fa', text: '#006064' },
  'Specialty':              { bg: '#f3e5f5', text: '#6a1b9a' },
  'Oral Peptides':          { bg: '#fff3e0', text: '#e65100' },
};

export default function PeptideGuidePage() {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [expanded, setExpanded] = useState(null);

  // Reconstitution calculator state
  const [vialMg, setVialMg] = useState('');
  const [bacWater, setBacWater] = useState('');
  const [desiredDose, setDesiredDose] = useState('');
  const [doseUnit, setDoseUnit] = useState('mg'); // 'mg' or 'mcg'

  const reconResult = useMemo(() => {
    const vial = parseFloat(vialMg);
    const water = parseFloat(bacWater);
    let dose = parseFloat(desiredDose);
    if (!vial || !water || !dose) return null;
    // Convert mcg to mg for calculation (vial is always mg)
    if (doseUnit === 'mcg') dose = dose / 1000;
    return calcUnits(vial, water, dose);
  }, [vialMg, bacWater, desiredDose, doseUnit]);

  const groups = PEPTIDE_OPTIONS.map(g => g.group);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return PEPTIDE_OPTIONS.map(group => ({
      ...group,
      options: group.options.filter(opt => {
        if (activeGroup !== 'all' && group.group !== activeGroup) return false;
        if (!q) return true;
        return opt.value.toLowerCase().includes(q) ||
               (opt.notes || '').toLowerCase().includes(q);
      }),
    })).filter(g => g.options.length > 0);
  }, [search, activeGroup]);

  const totalCount = filtered.reduce((sum, g) => sum + g.options.length, 0);

  return (
    <AdminLayout title="Peptide Guide">
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Peptide Dosing Guide</h1>
            <p style={styles.subtitle}>Staff reference — dosing schedules, frequencies, and reconstitution</p>
          </div>
        </div>

        {/* Reconstitution Calculator */}
        <div style={styles.calcCard}>
          <h2 style={styles.calcTitle}>Reconstitution Calculator</h2>
          <p style={styles.calcDesc}>Enter vial size, BAC water added, and desired dose to calculate units to draw.</p>
          <div style={styles.calcRow}>
            <div style={styles.calcField}>
              <label style={styles.calcLabel}>Vial Size (mg)</label>
              <input
                type="number"
                step="any"
                value={vialMg}
                onChange={e => setVialMg(e.target.value)}
                placeholder="e.g. 10"
                style={styles.calcInput}
              />
            </div>
            <div style={styles.calcField}>
              <label style={styles.calcLabel}>BAC Water (mL)</label>
              <input
                type="number"
                step="any"
                value={bacWater}
                onChange={e => setBacWater(e.target.value)}
                placeholder="e.g. 2"
                style={styles.calcInput}
              />
            </div>
            <div style={styles.calcField}>
              <label style={styles.calcLabel}>Desired Dose ({doseUnit})</label>
              <div style={styles.inputWithToggle}>
                <input
                  type="number"
                  step="any"
                  value={desiredDose}
                  onChange={e => setDesiredDose(e.target.value)}
                  placeholder={doseUnit === 'mg' ? 'e.g. 1' : 'e.g. 250'}
                  style={{ ...styles.calcInput, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none' }}
                />
                <div style={styles.unitToggle}>
                  <button
                    onClick={() => setDoseUnit('mg')}
                    style={{
                      ...styles.unitBtn,
                      ...(doseUnit === 'mg' ? styles.unitBtnActive : {}),
                      borderRadius: '0 8px 0 0',
                    }}
                  >mg</button>
                  <button
                    onClick={() => setDoseUnit('mcg')}
                    style={{
                      ...styles.unitBtn,
                      ...(doseUnit === 'mcg' ? styles.unitBtnActive : {}),
                      borderRadius: '0 0 8px 0',
                    }}
                  >mcg</button>
                </div>
              </div>
            </div>
            <div style={styles.calcResultBox}>
              <label style={styles.calcLabel}>Units to Draw</label>
              <div style={styles.calcResultValue}>
                {reconResult !== null
                  ? `${Math.round(reconResult * 10) / 10} units`
                  : '—'}
              </div>
            </div>
          </div>
          {reconResult !== null && (
            <p style={styles.calcExplain}>
              {desiredDose}{doseUnit} out of a {vialMg}mg vial reconstituted with {bacWater}mL BAC water = <strong>{Math.round(reconResult * 10) / 10} units</strong> on an insulin syringe
            </p>
          )}
        </div>

        {/* Search + filter */}
        <div style={styles.filterBar}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search peptides..."
            style={styles.searchInput}
          />
          <span style={styles.countBadge}>{totalCount} peptide{totalCount !== 1 ? 's' : ''}</span>
        </div>

        <div style={styles.categoryBar}>
          <button
            onClick={() => setActiveGroup('all')}
            style={{
              ...styles.catBtn,
              ...(activeGroup === 'all' ? styles.catBtnActive : {}),
            }}
          >
            All
          </button>
          {groups.map(g => (
            <button
              key={g}
              onClick={() => setActiveGroup(activeGroup === g ? 'all' : g)}
              style={{
                ...styles.catBtn,
                ...(activeGroup === g ? {
                  background: (CATEGORY_COLORS[g] || {}).bg || '#e5e7eb',
                  color: (CATEGORY_COLORS[g] || {}).text || '#111',
                  borderColor: (CATEGORY_COLORS[g] || {}).text || '#666',
                } : {}),
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Peptide groups */}
        {filtered.map(group => {
          const colors = CATEGORY_COLORS[group.group] || { bg: '#f3f4f6', text: '#374151' };
          return (
            <div key={group.group} style={styles.groupSection}>
              <div style={{ ...styles.groupHeader, background: colors.bg, color: colors.text }}>
                {group.group}
                <span style={styles.groupCount}>{group.options.length}</span>
              </div>
              <div style={styles.cardGrid}>
                {group.options.map(opt => {
                  const isExpanded = expanded === opt.value;
                  return (
                    <div
                      key={opt.value}
                      style={{
                        ...styles.card,
                        ...(isExpanded ? styles.cardExpanded : {}),
                      }}
                      onClick={() => setExpanded(isExpanded ? null : opt.value)}
                    >
                      <div style={styles.cardTop}>
                        <div style={styles.cardName}>{opt.value}</div>
                        <div style={styles.cardFreq}>{opt.frequency}</div>
                      </div>
                      <div style={styles.cardDoses}>
                        <span style={styles.doseLabel}>Starting:</span> {opt.startingDose}
                        <span style={{ ...styles.doseLabel, marginLeft: 16 }}>Max:</span> {opt.maxDose}
                      </div>
                      {isExpanded && (
                        <div style={styles.cardDetails}>
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>Frequency</span>
                            <span>{opt.frequency}</span>
                          </div>
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>Starting Dose</span>
                            <span>{opt.startingDose}</span>
                          </div>
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>Max Dose</span>
                            <span>{opt.maxDose}</span>
                          </div>
                          {opt.notes && (
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Notes</span>
                              <span>{opt.notes}</span>
                            </div>
                          )}
                          {opt.doses && (
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Dose Steps</span>
                              <span>{opt.doses.join(', ')}</span>
                            </div>
                          )}
                          {opt.doseOptions && (
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Dose Options</span>
                              <span>{opt.doseOptions.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={styles.empty}>No peptides match your search.</div>
        )}
      </div>
    </AdminLayout>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 0 40px',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#111',
    margin: 0,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    margin: '4px 0 0',
  },

  // Calculator
  calcCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 24,
  },
  calcTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111',
    margin: '0 0 4px',
  },
  calcDesc: {
    fontSize: 14,
    color: '#666',
    margin: '0 0 16px',
  },
  calcRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  calcField: {
    flex: '1 1 140px',
    minWidth: 140,
  },
  calcLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#555',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  calcInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 16,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputWithToggle: {
    display: 'flex',
    alignItems: 'stretch',
  },
  unitToggle: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  unitBtn: {
    padding: '0 10px',
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#888',
    cursor: 'pointer',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 42,
  },
  unitBtnActive: {
    background: '#111',
    color: '#fff',
    borderColor: '#111',
  },
  calcResultBox: {
    flex: '1 1 160px',
    minWidth: 160,
  },
  calcResultValue: {
    padding: '10px 12px',
    fontSize: 20,
    fontWeight: 700,
    color: '#166534',
    background: '#dcfce7',
    borderRadius: 8,
    textAlign: 'center',
    border: '1px solid #bbf7d0',
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcExplain: {
    fontSize: 13,
    color: '#555',
    marginTop: 12,
    marginBottom: 0,
  },

  // Filter bar
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    padding: '10px 14px',
    fontSize: 15,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    outline: 'none',
  },
  countBadge: {
    fontSize: 13,
    color: '#666',
    whiteSpace: 'nowrap',
  },
  categoryBar: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  catBtn: {
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid #d1d5db',
    borderRadius: 20,
    background: '#fff',
    color: '#555',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  catBtnActive: {
    background: '#111',
    color: '#fff',
    borderColor: '#111',
  },

  // Groups
  groupSection: {
    marginBottom: 28,
  },
  groupHeader: {
    fontSize: 15,
    fontWeight: 700,
    padding: '8px 16px',
    borderRadius: 8,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  groupCount: {
    fontSize: 12,
    fontWeight: 600,
    opacity: 0.7,
  },

  // Cards
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 12,
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '14px 18px',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, border-color 0.15s',
  },
  cardExpanded: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 2px rgba(59,130,246,0.15)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#111',
    lineHeight: 1.3,
    flex: 1,
  },
  cardFreq: {
    fontSize: 12,
    fontWeight: 600,
    color: '#3b82f6',
    background: '#eff6ff',
    padding: '2px 10px',
    borderRadius: 12,
    whiteSpace: 'nowrap',
    marginLeft: 8,
  },
  cardDoses: {
    fontSize: 13,
    color: '#555',
  },
  doseLabel: {
    fontWeight: 600,
    color: '#888',
    fontSize: 12,
  },

  // Expanded detail
  cardDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #f0f0f0',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    fontSize: 14,
    color: '#333',
  },
  detailLabel: {
    fontWeight: 600,
    color: '#888',
    fontSize: 13,
    minWidth: 110,
  },

  empty: {
    textAlign: 'center',
    padding: 40,
    color: '#999',
    fontSize: 15,
  },
};
