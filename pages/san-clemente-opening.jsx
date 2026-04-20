import { useState, useEffect } from 'react';
import Head from 'next/head';

const STORAGE_KEY = 'san-clemente-checklist-v1';
const CUSTOM_KEY = 'san-clemente-checklist-custom-v1';

const SECTIONS = [
  {
    title: 'Critical Path',
    note: 'Blockers for opening — tackle first.',
    items: [
      { id: 'cp-pt', label: 'Hire Physical Therapist (PT)' },
      { id: 'cp-ptas', label: 'Hire PTAs' },
    ],
  },
  {
    title: 'Facility',
    items: [
      { id: 'fac-gym', label: 'Gym space', defaultChecked: true },
      { id: 'fac-wd', label: 'Washer and dryer sourced', defaultChecked: true },
      { id: 'fac-cabinets', label: 'Cabinets' },
      { id: 'fac-suite', label: 'Meet with building owner — suite numbers for Adi and Range medication suite' },
    ],
  },
  {
    title: 'Personnel',
    items: [
      { id: 'p-reed', label: 'Reed — operating manager conversation', defaultChecked: true },
      { id: 'p-pt-meetings', label: 'PT candidate meetings scheduled', defaultChecked: true },
      { id: 'p-staff-meetings', label: 'Staff intro meetings held', defaultChecked: true },
      { id: 'p-hire-pt', label: 'Hire Physical Therapist' },
      { id: 'p-hire-ptas', label: 'Hire PTAs' },
      { id: 'p-comp-lola', label: 'Lola — compensation finalized', defaultChecked: true },
      { id: 'p-comp', label: 'Finalize compensation structure (remaining staff)' },
    ],
  },
  {
    title: 'Equipment — Treatment',
    items: [
      { id: 'e-magnets', label: 'Magnets (2)' },
      { id: 'e-hbot', label: 'HBOT' },
      { id: 'e-arp', label: 'ARP — 1 Power, 3 Portable' },
      { id: 'e-rlt', label: 'Red light panels (4)' },
      { id: 'e-kaatsu', label: 'KAATSU (2)' },
    ],
  },
  {
    title: 'Equipment — Office & Operations',
    items: [
      { id: 'o-cc', label: 'Credit card machine' },
      { id: 'o-washer', label: 'Washer', defaultChecked: true },
      { id: 'o-dryer', label: 'Dryer', defaultChecked: true },
      { id: 'o-computer', label: 'Office computer' },
      { id: 'o-printer', label: 'Printer' },
      { id: 'o-supplies', label: 'Office supplies' },
      { id: 'o-wifi', label: 'WiFi' },
      { id: 'o-phones', label: 'Phones' },
      { id: 'o-sound', label: 'Sound system' },
    ],
  },
  {
    title: 'Equipment — Treatment Supplies',
    items: [
      { id: 's-towels', label: 'Towels' },
      { id: 's-stools', label: 'Stools' },
      { id: 's-tape', label: 'Tape' },
      { id: 's-kinesio', label: 'Kinesio tape' },
      { id: 's-scissors', label: 'Scissors' },
      { id: 's-velcro', label: 'Velcro blue bands' },
      { id: 's-elastic', label: 'Elastic bands' },
      { id: 's-lotion', label: 'Lotion' },
      { id: 's-face', label: 'Face covers' },
      { id: 's-pillow-boost', label: 'Black pillow boosters' },
      { id: 's-pillow-tattoo', label: 'Black tattoo pillows (small)' },
    ],
  },
];

export default function SanClementeOpening() {
  const [checked, setChecked] = useState({});
  const [customItems, setCustomItems] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [addingSection, setAddingSection] = useState(null);
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setChecked(JSON.parse(stored));
      } else {
        const defaults = {};
        SECTIONS.forEach(s => s.items.forEach(i => {
          if (i.defaultChecked) defaults[i.id] = true;
        }));
        setChecked(defaults);
      }
      const storedCustom = localStorage.getItem(CUSTOM_KEY);
      if (storedCustom) setCustomItems(JSON.parse(storedCustom));
    } catch (err) {
      // ignore malformed storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem(CUSTOM_KEY, JSON.stringify(customItems));
  }, [customItems, loaded]);

  const toggle = (id) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addItem = (sectionTitle) => {
    const label = newLabel.trim();
    if (!label) return;
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setCustomItems(prev => ({
      ...prev,
      [sectionTitle]: [...(prev[sectionTitle] || []), { id, label }],
    }));
    setNewLabel('');
    setAddingSection(null);
  };

  const removeItem = (sectionTitle, id) => {
    setCustomItems(prev => ({
      ...prev,
      [sectionTitle]: (prev[sectionTitle] || []).filter(i => i.id !== id),
    }));
    setChecked(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const getSectionItems = (section) => [
    ...section.items,
    ...((customItems[section.title] || []).map(i => ({ ...i, custom: true }))),
  ];

  const allItems = SECTIONS.flatMap(getSectionItems);
  const totalItems = allItems.length;
  const doneCount = allItems.filter(i => checked[i.id]).length;
  const pct = totalItems === 0 ? 0 : Math.round((doneCount / totalItems) * 100);

  return (
    <>
      <Head>
        <title>San Clemente Opening — Range Medical</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <div style={styles.title}>San Clemente Opening</div>
            <div style={styles.subtitle}>Target open: May 1, 2026 &middot; Operating Manager: Reed</div>
          </div>

          <div style={styles.progress}>
            <div style={styles.progressLabel}>
              {doneCount} of {totalItems} complete ({pct}%)
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${pct}%` }} />
            </div>
          </div>

          {SECTIONS.map(section => {
            const items = getSectionItems(section);
            const isAdding = addingSection === section.title;
            return (
              <div key={section.title} style={styles.section}>
                <div style={styles.sectionTitle}>{section.title}</div>
                {section.note && <div style={styles.sectionNote}>{section.note}</div>}
                <ul style={styles.list}>
                  {items.map(item => {
                    const isChecked = !!checked[item.id];
                    return (
                      <li key={item.id} style={styles.listItem}>
                        <label style={styles.label}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggle(item.id)}
                            style={styles.checkbox}
                          />
                          <span style={{
                            ...styles.itemText,
                            textDecoration: isChecked ? 'line-through' : 'none',
                            color: isChecked ? '#888' : '#111',
                            flex: 1,
                          }}>
                            {item.label}
                          </span>
                          {item.custom && (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); removeItem(section.title, item.id); }}
                              style={styles.removeBtn}
                              aria-label="Remove item"
                            >
                              ×
                            </button>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {isAdding ? (
                  <div style={styles.addRow}>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addItem(section.title); }
                        if (e.key === 'Escape') { setAddingSection(null); setNewLabel(''); }
                      }}
                      placeholder="New task"
                      autoFocus
                      style={styles.addInput}
                    />
                    <button type="button" onClick={() => addItem(section.title)} style={styles.addBtn}>Add</button>
                    <button
                      type="button"
                      onClick={() => { setAddingSection(null); setNewLabel(''); }}
                      style={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAddingSection(section.title); setNewLabel(''); }}
                    style={styles.addLink}
                  >
                    + Add item
                  </button>
                )}
              </div>
            );
          })}

          <div style={styles.footer}>Checkbox state and added items save to this browser only.</div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f7f7f5',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    background: '#fff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  header: { marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: '#666' },
  progress: {
    padding: '16px',
    background: '#f4f4f2',
    borderRadius: '6px',
    marginBottom: '28px',
  },
  progressLabel: { fontSize: '13px', color: '#444', marginBottom: '8px', fontWeight: 500 },
  progressBar: {
    height: '8px',
    background: '#e4e4e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#2E6B35',
    transition: 'width 0.2s',
  },
  section: { marginBottom: '28px' },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#666',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '6px',
    paddingBottom: '6px',
    borderBottom: '1px solid #e4e4e0',
  },
  sectionNote: { fontSize: '13px', color: '#666', fontStyle: 'italic', marginBottom: '8px' },
  list: { listStyle: 'none', padding: 0, margin: '8px 0 0 0' },
  listItem: { padding: '6px 0' },
  label: { display: 'flex', alignItems: 'flex-start', cursor: 'pointer', gap: '10px' },
  checkbox: {
    marginTop: '4px',
    width: '16px',
    height: '16px',
    accentColor: '#2E6B35',
    cursor: 'pointer',
  },
  itemText: { fontSize: '15px', lineHeight: '1.5' },
  removeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#bbb',
    fontSize: '18px',
    lineHeight: '1',
    cursor: 'pointer',
    padding: '0 4px',
    alignSelf: 'center',
  },
  addLink: {
    background: 'transparent',
    border: 'none',
    color: '#2E6B35',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '8px 0 0 26px',
    textAlign: 'left',
  },
  addRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    paddingLeft: '26px',
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    padding: '8px 10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontFamily: 'inherit',
  },
  addBtn: {
    padding: '8px 14px',
    background: '#2E6B35',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '8px 10px',
    background: 'transparent',
    color: '#666',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  footer: {
    marginTop: '32px',
    paddingTop: '16px',
    borderTop: '1px solid #eee',
    fontSize: '12px',
    color: '#888',
    textAlign: 'center',
  },
};
