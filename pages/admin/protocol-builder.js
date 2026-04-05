// /pages/admin/protocol-builder.js
// Protocol Builder — drag-and-drop consultation tool
// Range Medical System V2

import { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  BUILDER_CATEGORIES,
  BUILDER_ITEMS,
  RANGE_IV_FORMULAS,
  getCategoryColor,
  formatPrice,
  calculatePricing,
} from '../../lib/protocol-builder-config';
import { Check, Plus, X, GripVertical, ChevronDown, ChevronUp, User, Search, FileText, Trash2 } from 'lucide-react';

// ── Styles ──────────────────────────────────────────────────────────────────

const s = {
  page: {
    display: 'flex',
    gap: '0',
    height: 'calc(100vh - 64px)',
    margin: '-24px',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  // Left panel — catalog
  catalog: {
    width: '420px',
    minWidth: '420px',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    overflow: 'hidden',
  },
  catalogHeader: {
    padding: '24px 24px 0',
    borderBottom: '1px solid #e0e0e0',
  },
  catalogLabel: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#737373',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  catalogDot: {
    width: '8px',
    height: '8px',
    background: '#808080',
    display: 'inline-block',
  },
  catalogTitle: {
    fontSize: '20px',
    fontWeight: '900',
    letterSpacing: '-0.02em',
    textTransform: 'uppercase',
    color: '#1a1a1a',
    margin: '0 0 16px',
    lineHeight: '1',
  },
  categoryTabs: {
    display: 'flex',
    gap: '0',
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  categoryTab: (active) => ({
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: active ? '#1a1a1a' : '#a0a0a0',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #1a1a1a' : '2px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'color 0.15s',
  }),
  catalogList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  catalogSearch: {
    padding: '10px 14px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '16px',
    background: '#fafafa',
    outline: 'none',
  },

  // Catalog card
  catCard: (color, isDragging) => ({
    border: '1px solid #e0e0e0',
    borderLeft: `3px solid ${color}`,
    padding: '14px 16px',
    marginBottom: '8px',
    cursor: 'grab',
    background: isDragging ? '#f0f0f0' : '#fff',
    transition: 'box-shadow 0.15s, background 0.15s',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    userSelect: 'none',
  }),
  catCardGrip: {
    color: '#ccc',
    marginTop: '2px',
    flexShrink: 0,
  },
  catCardContent: {
    flex: 1,
    minWidth: 0,
  },
  catCardName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 2px',
    lineHeight: '1.3',
  },
  catCardDesc: {
    fontSize: '12px',
    color: '#737373',
    margin: 0,
    lineHeight: '1.4',
  },
  catCardPrice: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  catCardPer: {
    fontSize: '10px',
    fontWeight: '500',
    color: '#a0a0a0',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  catCardAdd: {
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    marginTop: '2px',
  },

  // Right panel — plan
  plan: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#fafafa',
    overflow: 'hidden',
  },
  planHeader: {
    padding: '24px 32px 20px',
    borderBottom: '1px solid #e0e0e0',
    background: '#fff',
  },
  planLabel: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#737373',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  patientSearch: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  patientSearchInput: {
    padding: '10px 14px 10px 36px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    width: '300px',
    background: '#fafafa',
    outline: 'none',
    position: 'relative',
  },
  patientBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
  },

  // Plan content
  planContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 32px',
  },
  planEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#a0a0a0',
  },
  planEmptyIcon: {
    width: '64px',
    height: '64px',
    border: '2px dashed #d0d0d0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  planEmptyText: {
    fontSize: '14px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  planEmptyHint: {
    fontSize: '13px',
    color: '#b0b0b0',
    marginTop: '6px',
  },

  // Plan drop zone
  dropZone: (isOver) => ({
    minHeight: '100%',
    transition: 'background 0.15s',
    background: isOver ? 'rgba(26, 26, 26, 0.03)' : 'transparent',
    border: isOver ? '2px dashed #1a1a1a' : '2px dashed transparent',
    padding: isOver ? '22px 30px' : '24px 32px',
  }),

  // Plan item card
  planCard: (color) => ({
    background: '#fff',
    border: '1px solid #e0e0e0',
    marginBottom: '16px',
    overflow: 'hidden',
  }),
  planCardHeader: (color) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    borderLeft: `4px solid ${color}`,
  }),
  planCardName: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: '-0.01em',
  },
  planCardDuration: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#737373',
    marginLeft: '12px',
  },
  planCardRemove: {
    background: 'none',
    border: 'none',
    color: '#ccc',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    transition: 'color 0.15s',
  },
  planCardBody: {
    padding: '16px 20px',
  },
  planCardIncluded: {
    margin: '0 0 16px',
    padding: 0,
    listStyle: 'none',
  },
  planCardIncludedItem: {
    fontSize: '13px',
    color: '#737373',
    padding: '3px 0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    lineHeight: '1.5',
  },
  planCardCheck: {
    color: '#2E6B35',
    flexShrink: 0,
    marginTop: '2px',
  },

  // Options (dose selector, duration)
  optionRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  optionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  optionLabel: {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#a0a0a0',
  },
  optionSelect: {
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    fontSize: '13px',
    fontWeight: '600',
    background: '#fff',
    cursor: 'pointer',
    minWidth: '140px',
  },
  durationInput: {
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    fontSize: '13px',
    fontWeight: '600',
    width: '80px',
    textAlign: 'center',
  },

  // Payment toggle
  paymentToggle: {
    display: 'flex',
    gap: '0',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  },
  paymentBtn: (active) => ({
    padding: '8px 16px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    border: 'none',
    borderRight: '1px solid #e0e0e0',
    background: active ? '#1a1a1a' : '#fff',
    color: active ? '#fff' : '#737373',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  }),

  // Price display on plan card
  planCardPricing: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '16px 20px',
    borderTop: '1px solid #f0f0f0',
    background: '#fafafa',
  },
  priceMain: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: '-0.02em',
    lineHeight: 1,
  },
  pricePer: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#a0a0a0',
    marginLeft: '4px',
  },
  priceSavings: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#2E6B35',
  },
  priceTotal: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#737373',
    textAlign: 'right',
  },

  // Bottom bar — totals
  totalBar: {
    padding: '20px 32px',
    borderTop: '2px solid #1a1a1a',
    background: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLeft: {
    display: 'flex',
    gap: '32px',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#737373',
  },
  totalAmount: {
    fontSize: '32px',
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  totalMonthly: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#737373',
  },
  totalSavings: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#2E6B35',
  },
  agreeBtn: {
    padding: '14px 32px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },

  // Summary modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    background: '#fff',
    width: '600px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    padding: '24px 28px',
    borderBottom: '1px solid #e0e0e0',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '-0.01em',
    margin: 0,
  },
  modalBody: {
    padding: '24px 28px',
  },
  modalFooter: {
    padding: '20px 28px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },

  // Patient dropdown
  patientDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderTop: 'none',
    maxHeight: '240px',
    overflowY: 'auto',
    zIndex: 100,
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  },
  patientOption: {
    padding: '10px 14px',
    fontSize: '14px',
    cursor: 'pointer',
    borderBottom: '1px solid #f5f5f5',
    display: 'flex',
    justifyContent: 'space-between',
  },
};

// ── Component ───────────────────────────────────────────────────────────────

export default function ProtocolBuilder() {
  // State
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [planItems, setPlanItems] = useState([]);
  const [dragOverPlan, setDragOverPlan] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Patient search
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientSearchRef = useRef(null);
  const patientTimerRef = useRef(null);

  // Patient search with debounce
  useEffect(() => {
    if (!patientQuery || patientQuery.length < 2) {
      setPatientResults([]);
      setShowPatientDropdown(false);
      return;
    }
    if (patientTimerRef.current) clearTimeout(patientTimerRef.current);
    patientTimerRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email, phone')
        .or(`first_name.ilike.%${patientQuery}%,last_name.ilike.%${patientQuery}%,email.ilike.%${patientQuery}%`)
        .limit(8);
      setPatientResults(data || []);
      setShowPatientDropdown(true);
    }, 300);
    return () => clearTimeout(patientTimerRef.current);
  }, [patientQuery]);

  // Close patient dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(e.target)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Filter catalog items ──────────────────────────────────────────────────
  const filteredItems = BUILDER_ITEMS.filter(item => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  // ── Drag and drop handlers ────────────────────────────────────────────────
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverPlan(true);
  };

  const handleDragLeave = () => {
    setDragOverPlan(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOverPlan(false);
    const itemId = e.dataTransfer.getData('text/plain');
    addToPlan(itemId);
  };

  // ── Plan management ───────────────────────────────────────────────────────
  const addToPlan = (itemId) => {
    const item = BUILDER_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const planItem = {
      uid: Date.now() + Math.random(),
      itemId: item.id,
      selectedOption: item.paymentOptions.monthly ? 'monthly' : (item.paymentOptions.upfront ? 'upfront' : null),
      selectedDoseIndex: 0,
      customDuration: item.duration,
      expanded: true,
    };
    setPlanItems(prev => [...prev, planItem]);
  };

  const removePlanItem = (uid) => {
    setPlanItems(prev => prev.filter(p => p.uid !== uid));
  };

  const updatePlanItem = (uid, updates) => {
    setPlanItems(prev => prev.map(p => p.uid === uid ? { ...p, ...updates } : p));
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  const totals = planItems.reduce((acc, planItem) => {
    const item = BUILDER_ITEMS.find(i => i.id === planItem.itemId);
    if (!item) return acc;
    const selectedDose = item.options?.[planItem.selectedDoseIndex] || null;
    const pricing = calculatePricing(item, planItem.selectedOption, selectedDose, planItem.customDuration);

    acc.total += pricing.total;
    acc.savings += pricing.savings;
    if (pricing.monthly) acc.monthlyRecurring += pricing.monthly;
    return acc;
  }, { total: 0, savings: 0, monthlyRecurring: 0 });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Protocol Builder">
      <div style={s.page}>
        {/* ═══ LEFT PANEL — CATALOG ═══ */}
        <div style={s.catalog}>
          <div style={s.catalogHeader}>
            <div style={s.catalogLabel}>
              <span style={s.catalogDot} />
              PROTOCOL CATALOG
            </div>
            <h2 style={s.catalogTitle}>Build a Plan</h2>
            <div style={s.categoryTabs}>
              <button
                style={s.categoryTab(activeCategory === 'all')}
                onClick={() => setActiveCategory('all')}
              >
                All
              </button>
              {BUILDER_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  style={s.categoryTab(activeCategory === cat.id)}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div style={s.catalogList}>
            <input
              type="text"
              placeholder="Search protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={s.catalogSearch}
            />

            {filteredItems.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#a0a0a0', fontSize: '13px' }}>
                No protocols match your search.
              </div>
            )}

            {filteredItems.map(item => {
              const color = getCategoryColor(item.category);
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  style={s.catCard(color, false)}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={s.catCardGrip}>
                    <GripVertical size={14} />
                  </div>
                  <div style={s.catCardContent}>
                    <div style={s.catCardName}>{item.name}</div>
                    <div style={s.catCardDesc}>{item.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={s.catCardPrice}>{formatPrice(item.priceCents)}</div>
                    <div style={s.catCardPer}>
                      {item.billingType === 'flat' ? item.durationLabel : '/mo'}
                    </div>
                  </div>
                  <button
                    style={s.catCardAdd}
                    onClick={(e) => { e.stopPropagation(); addToPlan(item.id); }}
                    title="Add to plan"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ RIGHT PANEL — PATIENT PLAN ═══ */}
        <div style={s.plan}>
          {/* Plan header with patient search */}
          <div style={s.planHeader}>
            <div style={s.planLabel}>
              <span style={s.catalogDot} />
              PATIENT PLAN
            </div>
            <div style={s.patientSearch} ref={patientSearchRef}>
              {selectedPatient ? (
                <div style={s.patientBadge}>
                  <User size={14} />
                  {selectedPatient.first_name} {selectedPatient.last_name}
                  <button
                    onClick={() => { setSelectedPatient(null); setPatientQuery(''); }}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: '#a0a0a0' }} />
                  <input
                    type="text"
                    placeholder="Search patient..."
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    onFocus={() => patientResults.length > 0 && setShowPatientDropdown(true)}
                    style={s.patientSearchInput}
                  />
                  {showPatientDropdown && patientResults.length > 0 && (
                    <div style={s.patientDropdown}>
                      {patientResults.map(p => (
                        <div
                          key={p.id}
                          style={s.patientOption}
                          onClick={() => { setSelectedPatient(p); setShowPatientDropdown(false); setPatientQuery(''); }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                        >
                          <span style={{ fontWeight: '600' }}>{p.first_name} {p.last_name}</span>
                          <span style={{ color: '#a0a0a0', fontSize: '12px' }}>{p.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Plan content area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              ...(planItems.length === 0 ? {} : {}),
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {planItems.length === 0 ? (
              <div style={{ ...s.dropZone(dragOverPlan), display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={s.planEmpty}>
                  <div style={s.planEmptyIcon}>
                    <Plus size={24} color="#d0d0d0" />
                  </div>
                  <div style={s.planEmptyText}>Drag protocols here</div>
                  <div style={s.planEmptyHint}>or click the + button on any protocol</div>
                </div>
              </div>
            ) : (
              <div style={s.dropZone(dragOverPlan)}>
                {planItems.map(planItem => {
                  const item = BUILDER_ITEMS.find(i => i.id === planItem.itemId);
                  if (!item) return null;
                  const color = getCategoryColor(item.category);
                  const selectedDose = item.options?.[planItem.selectedDoseIndex] || null;
                  const pricing = calculatePricing(item, planItem.selectedOption, selectedDose, planItem.customDuration);

                  return (
                    <div key={planItem.uid} style={s.planCard(color)}>
                      {/* Card header */}
                      <div style={s.planCardHeader(color)}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={s.planCardName}>{item.name}</span>
                          <span style={s.planCardDuration}>{item.durationLabel}</span>
                        </div>
                        <button
                          style={s.planCardRemove}
                          onClick={() => removePlanItem(planItem.uid)}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#ccc'; }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Card body */}
                      <div style={s.planCardBody}>
                        {/* Included items */}
                        <ul style={s.planCardIncluded}>
                          {item.included.map((inc, i) => (
                            <li key={i} style={s.planCardIncludedItem}>
                              <Check size={13} style={s.planCardCheck} />
                              <span>{inc}</span>
                            </li>
                          ))}
                          {/* Show Range IV formulas for HRT */}
                          {item.id === 'hrt-membership' && (
                            <li style={{ ...s.planCardIncludedItem, flexDirection: 'column', alignItems: 'flex-start', marginTop: '8px', gap: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a0a0a0', marginBottom: '4px' }}>
                                Signature IV Formulas
                              </span>
                              {RANGE_IV_FORMULAS.map((iv, idx) => (
                                <span key={idx} style={{ fontSize: '12px', color: '#737373', paddingLeft: '4px' }}>
                                  {iv.name} — {iv.nutrients.join(', ')}
                                </span>
                              ))}
                            </li>
                          )}
                        </ul>

                        {/* Options row: dose selector + duration */}
                        <div style={s.optionRow}>
                          {item.options && (
                            <div style={s.optionGroup}>
                              <span style={s.optionLabel}>Dose / Tier</span>
                              <select
                                style={s.optionSelect}
                                value={planItem.selectedDoseIndex}
                                onChange={(e) => updatePlanItem(planItem.uid, { selectedDoseIndex: parseInt(e.target.value) })}
                              >
                                {item.options.map((opt, i) => (
                                  <option key={i} value={i}>
                                    {opt.label} — {formatPrice(opt.priceCents)}/mo
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {item.durationEditable && (
                            <div style={s.optionGroup}>
                              <span style={s.optionLabel}>Duration (months)</span>
                              <input
                                type="number"
                                min={1}
                                max={24}
                                value={planItem.customDuration || item.duration || 6}
                                onChange={(e) => updatePlanItem(planItem.uid, { customDuration: parseInt(e.target.value) || 1 })}
                                style={s.durationInput}
                              />
                            </div>
                          )}

                          {/* Payment option toggle */}
                          {Object.keys(item.paymentOptions).length > 0 && (
                            <div style={s.optionGroup}>
                              <span style={s.optionLabel}>Payment</span>
                              <div style={s.paymentToggle}>
                                {item.paymentOptions.monthly && (
                                  <button
                                    style={s.paymentBtn(planItem.selectedOption === 'monthly')}
                                    onClick={() => updatePlanItem(planItem.uid, { selectedOption: 'monthly' })}
                                  >
                                    Monthly
                                  </button>
                                )}
                                {item.paymentOptions.quarterly && (
                                  <button
                                    style={s.paymentBtn(planItem.selectedOption === 'quarterly')}
                                    onClick={() => updatePlanItem(planItem.uid, { selectedOption: 'quarterly' })}
                                  >
                                    Quarterly
                                    {item.paymentOptions.quarterly.discount > 0 && (
                                      <span style={{ marginLeft: '4px', color: planItem.selectedOption === 'quarterly' ? '#4ade80' : '#2E6B35' }}>
                                        {Math.round(item.paymentOptions.quarterly.discount * 100)}% off
                                      </span>
                                    )}
                                  </button>
                                )}
                                {item.paymentOptions.annual && (
                                  <button
                                    style={s.paymentBtn(planItem.selectedOption === 'annual')}
                                    onClick={() => updatePlanItem(planItem.uid, { selectedOption: 'annual' })}
                                  >
                                    Annual
                                    {item.paymentOptions.annual.discount > 0 && (
                                      <span style={{ marginLeft: '4px', color: planItem.selectedOption === 'annual' ? '#4ade80' : '#2E6B35' }}>
                                        {Math.round(item.paymentOptions.annual.discount * 100)}% off
                                      </span>
                                    )}
                                  </button>
                                )}
                                {item.paymentOptions.upfront && (
                                  <button
                                    style={s.paymentBtn(planItem.selectedOption === 'upfront')}
                                    onClick={() => updatePlanItem(planItem.uid, { selectedOption: 'upfront' })}
                                  >
                                    Upfront
                                    {item.paymentOptions.upfront.discount > 0 && (
                                      <span style={{ marginLeft: '4px', color: planItem.selectedOption === 'upfront' ? '#4ade80' : '#2E6B35' }}>
                                        {Math.round(item.paymentOptions.upfront.discount * 100)}% off
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing footer */}
                      <div style={s.planCardPricing}>
                        <div>
                          <span style={s.priceMain}>
                            {pricing.monthly ? formatPrice(pricing.monthly) : formatPrice(pricing.total)}
                          </span>
                          <span style={s.pricePer}>
                            {pricing.monthly ? '/mo' : ''}
                          </span>
                          {pricing.savings > 0 && (
                            <div style={s.priceSavings}>Save {formatPrice(pricing.savings)}</div>
                          )}
                        </div>
                        <div style={s.priceTotal}>
                          {pricing.monthly && (
                            <>Total: {formatPrice(pricing.total)}<br />{pricing.label}</>
                          )}
                          {!pricing.monthly && pricing.label !== 'One-time' && (
                            <>{pricing.label}</>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom total bar */}
          {planItems.length > 0 && (
            <div style={s.totalBar}>
              <div style={s.totalLeft}>
                <div>
                  <div style={s.totalLabel}>Estimated Total</div>
                  <div style={s.totalAmount}>{formatPrice(totals.total)}</div>
                </div>
                {totals.monthlyRecurring > 0 && (
                  <div style={s.totalMonthly}>
                    {formatPrice(totals.monthlyRecurring)}/mo recurring
                  </div>
                )}
                {totals.savings > 0 && (
                  <div style={s.totalSavings}>
                    Saving {formatPrice(totals.savings)}
                  </div>
                )}
              </div>
              <button
                style={s.agreeBtn}
                onClick={() => setShowSummary(true)}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#404040'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
              >
                Patient Agrees
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ SUMMARY MODAL ═══ */}
      {showSummary && (
        <div style={s.modalOverlay} onClick={() => setShowSummary(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Protocol Summary</h3>
            </div>
            <div style={s.modalBody}>
              {selectedPatient && (
                <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#fafafa', border: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a0a0a0', marginBottom: '4px' }}>Patient</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </div>
                </div>
              )}

              {planItems.map(planItem => {
                const item = BUILDER_ITEMS.find(i => i.id === planItem.itemId);
                if (!item) return null;
                const selectedDose = item.options?.[planItem.selectedDoseIndex] || null;
                const pricing = calculatePricing(item, planItem.selectedOption, selectedDose, planItem.customDuration);

                return (
                  <div key={planItem.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>
                        {item.name}
                        {selectedDose && <span style={{ fontWeight: '500', color: '#737373' }}> — {selectedDose.label}</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#737373' }}>{item.durationLabel}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700' }}>
                        {pricing.monthly ? `${formatPrice(pricing.monthly)}/mo` : formatPrice(pricing.total)}
                      </div>
                      {pricing.monthly && (
                        <div style={{ fontSize: '11px', color: '#a0a0a0' }}>Total: {formatPrice(pricing.total)}</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Grand total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 0', marginTop: '8px', borderTop: '2px solid #1a1a1a' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Estimated Total
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '900', textAlign: 'right' }}>{formatPrice(totals.total)}</div>
                  {totals.savings > 0 && (
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#2E6B35', textAlign: 'right' }}>
                      Saving {formatPrice(totals.savings)}
                    </div>
                  )}
                </div>
              </div>

              {/* Date */}
              <div style={{ marginTop: '20px', fontSize: '12px', color: '#a0a0a0' }}>
                Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div style={s.modalFooter}>
              <button
                style={{ ...s.agreeBtn, background: '#fff', color: '#1a1a1a', border: '1px solid #e0e0e0' }}
                onClick={() => setShowSummary(false)}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
              >
                Back to Builder
              </button>
              <button
                style={s.agreeBtn}
                onClick={() => {
                  // Future: push protocols to patient record
                  alert('Protocol agreement confirmed. Push to patient record coming soon.');
                  setShowSummary(false);
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#404040'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} />
                  Confirm Agreement
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
