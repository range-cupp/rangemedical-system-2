// /pages/admin/protocol-builder.js
// Protocol Builder — drag-and-drop consultation tool with patient context
// Range Medical System V2

import { useState, useRef, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  BUILDER_CATEGORIES,
  BUILDER_ITEMS,
  PEPTIDE_SUBCATEGORIES,
  RANGE_IV_FORMULAS,
  getCategoryColor,
  formatPrice,
  calculatePricing,
  getSteppedTotal,
} from '../../lib/protocol-builder-config';
import { Check, Plus, X, GripVertical, ChevronDown, ChevronUp, User, Search, FileText, Trash2, Sparkles, ArrowUpRight, Activity, Brain, FlaskConical, Share2, Heart, Printer, Scale, Target } from 'lucide-react';

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
  sectionLabel: {
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
  dot: {
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
  subcategoryHeader: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#059669',
    padding: '12px 0 6px',
    borderBottom: '1px solid #e8e8e8',
    marginBottom: '8px',
    marginTop: '8px',
  },
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

  // Right panel
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
  patientSearchInput: {
    padding: '10px 14px 10px 36px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    width: '300px',
    background: '#fafafa',
    outline: 'none',
  },
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

  // AI Recommendations panel
  aiPanel: {
    margin: '0 0 20px',
    border: '1px solid #e0e0e0',
    background: '#fff',
    overflow: 'hidden',
  },
  aiHeader: {
    padding: '14px 20px',
    background: '#1a1a1a',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
  },
  aiTitle: {
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  aiBody: {
    padding: '16px 20px',
    fontSize: '13px',
    color: '#404040',
    lineHeight: '1.7',
    maxHeight: '300px',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
  },
  aiEmpty: {
    padding: '16px 20px',
    fontSize: '13px',
    color: '#a0a0a0',
    fontStyle: 'italic',
  },

  // Current protocols section
  currentProtoSection: {
    margin: '0 0 20px',
  },
  currentProtoHeader: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#737373',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  currentProtoCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#fff',
    border: '1px solid #e0e0e0',
    marginBottom: '6px',
  },
  currentProtoBadge: (color) => ({
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '3px 8px',
    background: color + '18',
    color: color,
    marginRight: '10px',
  }),
  upgradeBtn: {
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    background: '#fff',
    color: '#059669',
    border: '1px solid #059669',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s',
  },

  // Plan cards
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
  planCardBody: { padding: '16px 20px' },
  planCardIncluded: { margin: '0 0 16px', padding: 0, listStyle: 'none' },
  planCardIncludedItem: {
    fontSize: '13px',
    color: '#737373',
    padding: '3px 0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    lineHeight: '1.5',
  },

  optionRow: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  optionGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  optionLabel: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a0a0a0' },
  optionSelect: { padding: '8px 12px', border: '1px solid #e0e0e0', fontSize: '13px', fontWeight: '600', background: '#fff', cursor: 'pointer', minWidth: '140px' },
  durationInput: { padding: '8px 12px', border: '1px solid #e0e0e0', fontSize: '13px', fontWeight: '600', width: '80px', textAlign: 'center' },

  paymentToggle: { display: 'flex', gap: '0', border: '1px solid #e0e0e0', overflow: 'hidden' },
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

  planCardPricing: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '16px 20px',
    borderTop: '1px solid #f0f0f0',
    background: '#fafafa',
  },

  // Bottom bar
  totalBar: {
    padding: '20px 32px',
    borderTop: '2px solid #1a1a1a',
    background: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  // Benefits section on plan cards
  benefitsSection: {
    padding: '16px 20px 0',
    borderTop: '1px solid #f0f0f0',
  },
  benefitsToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0 0 12px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#059669',
  },
  bestFor: {
    fontSize: '12px',
    color: '#404040',
    background: '#f0fdf4',
    border: '1px solid #dcfce7',
    padding: '8px 12px',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  benefitItem: {
    fontSize: '13px',
    color: '#404040',
    padding: '4px 0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    lineHeight: '1.5',
  },
  benefitBullet: {
    width: '5px',
    height: '5px',
    background: '#059669',
    flexShrink: 0,
    marginTop: '7px',
  },

  // Share / Patient-facing view
  shareBtn: {
    padding: '14px 24px',
    background: '#fff',
    color: '#1a1a1a',
    border: '1px solid #e0e0e0',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s',
  },
  patientView: {
    background: '#fff',
    width: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
  },
  pvHeader: {
    padding: '40px 48px 32px',
    borderBottom: '1px solid #e0e0e0',
    textAlign: 'center',
  },
  pvCard: {
    padding: '28px 0',
    borderBottom: '1px solid #f0f0f0',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
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
};

// Category color map for current protocols
const PROTO_COLORS = {
  hrt: '#7c3aed', weight_loss: '#2563eb', peptide: '#059669',
  iv: '#f59e0b', hbot: '#6366f1', rlt: '#ef4444', injection: '#eab308',
  labs: '#ec4899', other: '#808080',
};

// ── Component ───────────────────────────────────────────────────────────────

export default function ProtocolBuilder() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [planItems, setPlanItems] = useState([]);
  const [dragOverPlan, setDragOverPlan] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showPatientView, setShowPatientView] = useState(false);
  const [expandedBenefits, setExpandedBenefits] = useState({});

  // Patient
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientSearchRef = useRef(null);
  const patientTimerRef = useRef(null);

  // Patient context data
  const [currentProtocols, setCurrentProtocols] = useState([]);
  const [labSynopsis, setLabSynopsis] = useState(null);
  const [assessmentSynopsis, setAssessmentSynopsis] = useState(null);
  const [aiExpanded, setAiExpanded] = useState({ labs: true, assessment: true });
  const [loadingContext, setLoadingContext] = useState(false);
  const [patientWeight, setPatientWeight] = useState(null); // latest weight from vitals/service logs

  // Patient search
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(e.target)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch patient context when patient selected
  const fetchPatientContext = useCallback(async (patientId) => {
    setLoadingContext(true);
    try {
      // Fetch protocols
      const { data: protocols } = await supabase
        .from('protocols')
        .select('*')
        .eq('patient_id', patientId)
        .in('status', ['active', 'paused'])
        .order('created_at', { ascending: false });
      setCurrentProtocols(protocols || []);

      // Fetch latest weight from service logs or vitals
      const { data: weightLogs } = await supabase
        .from('service_logs')
        .select('weight')
        .eq('patient_id', patientId)
        .not('weight', 'is', null)
        .order('service_date', { ascending: false })
        .limit(1);
      if (weightLogs?.[0]?.weight) {
        setPatientWeight(parseFloat(weightLogs[0].weight));
      } else {
        // Try patient_vitals as fallback
        const { data: vitals } = await supabase
          .from('patient_vitals')
          .select('weight_lbs')
          .eq('patient_id', patientId)
          .not('weight_lbs', 'is', null)
          .order('recorded_at', { ascending: false })
          .limit(1);
        setPatientWeight(vitals?.[0]?.weight_lbs ? parseFloat(vitals[0].weight_lbs) : null);
      }

      // Fetch latest lab with AI synopsis
      const { data: labs } = await supabase
        .from('labs')
        .select('id, lab_date, panel_type, ai_synopsis')
        .eq('patient_id', patientId)
        .not('ai_synopsis', 'is', null)
        .order('lab_date', { ascending: false })
        .limit(1);
      setLabSynopsis(labs?.[0] || null);

      // Fetch latest assessment with AI synopsis
      const { data: assessments } = await supabase
        .from('baseline_questionnaires')
        .select('id, questionnaire_type, ai_synopsis, submitted_at')
        .eq('patient_id', patientId)
        .not('ai_synopsis', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(1);
      setAssessmentSynopsis(assessments?.[0] || null);
    } catch (err) {
      console.error('Failed to fetch patient context:', err);
    }
    setLoadingContext(false);
  }, []);

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setShowPatientDropdown(false);
    setPatientQuery('');
    fetchPatientContext(patient.id);
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setPatientQuery('');
    setCurrentProtocols([]);
    setLabSynopsis(null);
    setAssessmentSynopsis(null);
    setPatientWeight(null);
  };

  // Filter catalog
  const filteredItems = BUILDER_ITEMS.filter(item => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Group peptides by subcategory
  const groupedItems = activeCategory === 'peptide'
    ? PEPTIDE_SUBCATEGORIES.map(sub => ({
        ...sub,
        items: filteredItems.filter(i => i.subcategory === sub.id),
      })).filter(g => g.items.length > 0)
    : null;

  // Drag and drop
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'copy';
  };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOverPlan(true); };
  const handleDragLeave = () => setDragOverPlan(false);
  const handleDrop = (e) => { e.preventDefault(); setDragOverPlan(false); addToPlan(e.dataTransfer.getData('text/plain')); };

  // Plan management
  // Recommend a duration tier based on lbs to lose
  const getRecommendedTier = (item, lbsToLose) => {
    if (!item.durationTiers || !lbsToLose || lbsToLose <= 0) return null;
    // Find the tier where lbsToLose falls within the range
    for (const tier of item.durationTiers) {
      if (lbsToLose >= tier.lbsMin && lbsToLose <= tier.lbsMax) return tier.months;
    }
    // If above all tiers, recommend the longest
    if (lbsToLose > item.durationTiers[item.durationTiers.length - 1].lbsMax) {
      return item.durationTiers[item.durationTiers.length - 1].months;
    }
    // If below all tiers, recommend the shortest
    return item.durationTiers[0].months;
  };

  const addToPlan = (itemId) => {
    const item = BUILDER_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    setPlanItems(prev => [...prev, {
      uid: Date.now() + Math.random(),
      itemId: item.id,
      selectedOption: item.paymentOptions.monthly ? 'monthly' : (item.paymentOptions.upfront ? 'upfront' : null),
      selectedDoseIndex: 0,
      customDuration: item.duration,
      currentWeight: patientWeight || null,
      goalWeight: null,
      expanded: true,
    }]);
  };
  const removePlanItem = (uid) => setPlanItems(prev => prev.filter(p => p.uid !== uid));
  const updatePlanItem = (uid, updates) => setPlanItems(prev => prev.map(p => p.uid === uid ? { ...p, ...updates } : p));

  // Totals
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

  // Get protocol category for color
  const getProtoCategory = (p) => {
    if (p.program_type === 'hrt') return 'hrt';
    if (p.program_type === 'weight_loss') return 'weight_loss';
    if (p.program_type === 'peptide') return 'peptide';
    if (p.program_type === 'iv') return 'iv';
    if (p.program_type === 'hbot') return 'hbot';
    if (p.program_type === 'rlt') return 'rlt';
    return 'other';
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderCatalogCard = (item) => {
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
        <div style={{ color: '#ccc', marginTop: '2px', flexShrink: 0 }}><GripVertical size={14} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px', lineHeight: '1.3' }}>{item.name}</div>
          <div style={{ fontSize: '12px', color: '#737373', margin: 0, lineHeight: '1.4' }}>{item.description}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{formatPrice(item.priceCents)}</div>
          <div style={{ fontSize: '10px', fontWeight: '500', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {item.billingType === 'flat' ? item.durationLabel : '/mo'}
          </div>
        </div>
        <button style={s.catCardAdd} onClick={(e) => { e.stopPropagation(); addToPlan(item.id); }} title="Add to plan">
          <Plus size={14} />
        </button>
      </div>
    );
  };

  const renderPlanCard = (planItem) => {
    const item = BUILDER_ITEMS.find(i => i.id === planItem.itemId);
    if (!item) return null;
    const color = getCategoryColor(item.category);
    const selectedDose = item.options?.[planItem.selectedDoseIndex] || null;
    const pricing = calculatePricing(item, planItem.selectedOption, selectedDose, planItem.customDuration);

    return (
      <div key={planItem.uid} style={s.planCard(color)}>
        <div style={s.planCardHeader(color)}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.01em' }}>{item.name}</span>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737373', marginLeft: '12px' }}>
              {item.durationTiers
                ? (item.durationTiers.find(t => t.months === (planItem.customDuration || item.duration))?.label || `${planItem.customDuration || item.duration} months`)
                : item.durationLabel}
            </span>
          </div>
          <button
            style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '4px', display: 'flex', transition: 'color 0.15s' }}
            onClick={() => removePlanItem(planItem.uid)}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#ccc'; }}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div style={s.planCardBody}>
          <ul style={s.planCardIncluded}>
            {item.included.map((inc, i) => (
              <li key={i} style={s.planCardIncludedItem}>
                <Check size={13} style={{ color: '#2E6B35', flexShrink: 0, marginTop: '2px' }} />
                <span>{inc}</span>
              </li>
            ))}
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

          {/* Benefits & Best For */}
          {item.benefits && item.benefits.length > 0 && (
            <div style={s.benefitsSection}>
              <button
                style={s.benefitsToggle}
                onClick={() => setExpandedBenefits(prev => ({ ...prev, [planItem.uid]: !prev[planItem.uid] }))}
              >
                <Heart size={12} />
                Why This Protocol
                {expandedBenefits[planItem.uid] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {expandedBenefits[planItem.uid] && (
                <>
                  {item.bestFor && (
                    <div style={s.bestFor}>
                      <span style={{ fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669' }}>Best for: </span>
                      {item.bestFor}
                    </div>
                  )}
                  <div style={{ paddingBottom: '16px' }}>
                    {item.benefits.map((b, i) => (
                      <div key={i} style={s.benefitItem}>
                        <span style={s.benefitBullet} />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Weight Loss Goal Calculator ── */}
          {item.durationTiers && (() => {
            const cw = planItem.currentWeight;
            const gw = planItem.goalWeight;
            const lbsToLose = (cw && gw && cw > gw) ? Math.round(cw - gw) : null;
            const recommended = lbsToLose ? getRecommendedTier(item, lbsToLose) : null;
            const currentDuration = planItem.customDuration || item.duration;

            return (
              <div style={{ borderTop: '1px solid #f0f0f0', padding: '20px 20px 0' }}>
                {/* Weight inputs */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                      <Scale size={12} /> Current Weight
                    </span>
                    <input
                      type="number" min={80} max={600} placeholder="lbs"
                      value={planItem.currentWeight || ''}
                      onChange={(e) => {
                        const w = parseFloat(e.target.value) || null;
                        const updates = { currentWeight: w };
                        if (w && gw && w > gw) {
                          const rec = getRecommendedTier(item, Math.round(w - gw));
                          if (rec) updates.customDuration = rec;
                        }
                        updatePlanItem(planItem.uid, updates);
                      }}
                      style={{ padding: '12px 14px', border: '1px solid #e0e0e0', fontSize: '18px', fontWeight: '800', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                    />
                  </div>
                  <div style={{ fontSize: '24px', color: '#d0d0d0', paddingBottom: '12px' }}>→</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                      <Target size={12} /> Goal Weight
                    </span>
                    <input
                      type="number" min={80} max={600} placeholder="lbs"
                      value={planItem.goalWeight || ''}
                      onChange={(e) => {
                        const g = parseFloat(e.target.value) || null;
                        const updates = { goalWeight: g };
                        if (cw && g && cw > g) {
                          const rec = getRecommendedTier(item, Math.round(cw - g));
                          if (rec) updates.customDuration = rec;
                        }
                        updatePlanItem(planItem.uid, updates);
                      }}
                      style={{ padding: '12px 14px', border: '1px solid #e0e0e0', fontSize: '18px', fontWeight: '800', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                    />
                  </div>
                  {lbsToLose && (
                    <div style={{ flex: 1, textAlign: 'center', paddingBottom: '4px' }}>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: '#2563eb', letterSpacing: '-0.03em', lineHeight: 1 }}>{lbsToLose}</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737373', marginTop: '4px' }}>lbs to lose</div>
                    </div>
                  )}
                </div>

                {/* Duration tier buttons */}
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', display: 'block', marginBottom: '10px' }}>
                    Program Duration {recommended ? '· Recommended based on goal' : ''}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.durationTiers.map(tier => {
                      const active = currentDuration === tier.months;
                      const isRecommended = recommended === tier.months;
                      return (
                        <button key={tier.months} style={{
                          flex: 1, padding: '14px 8px 12px', fontSize: '13px', fontWeight: '800', border: active ? '2px solid #1a1a1a' : (isRecommended ? '2px solid #2563eb' : '1px solid #e0e0e0'),
                          cursor: 'pointer', transition: 'all 0.15s',
                          background: active ? '#1a1a1a' : (isRecommended ? '#eff6ff' : '#fff'),
                          color: active ? '#fff' : (isRecommended ? '#2563eb' : '#737373'),
                          textAlign: 'center', lineHeight: '1.3', position: 'relative',
                        }} onClick={() => updatePlanItem(planItem.uid, { customDuration: tier.months })}>
                          {isRecommended && !active && (
                            <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: '800', background: '#2563eb', color: '#fff', padding: '2px 10px', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Recommended</div>
                          )}
                          <div style={{ fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{tier.months}mo</div>
                          <div style={{ fontSize: '11px', fontWeight: '600', opacity: 0.6, marginTop: '3px' }}>{tier.lbsMin}–{tier.lbsMax} lbs</div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Selected tier description */}
                  {item.durationTiers.map(tier => {
                    if (currentDuration !== tier.months) return null;
                    return (
                      <div key={tier.months} style={{ fontSize: '13px', color: '#404040', padding: '10px 14px', background: '#f8fafc', borderLeft: '3px solid #2563eb', marginTop: '10px', lineHeight: '1.6' }}>
                        <span style={{ fontWeight: '700' }}>{tier.label}:</span> {tier.description}
                      </div>
                    );
                  })}
                </div>

                {/* Personalized projections when weight goal is set */}
                {lbsToLose && item.clinicalData && (
                  <div style={{ margin: '14px 0 0', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e0e0e0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={14} /> Projected Timeline for {cw} → {gw} lbs
                    </div>
                    <div>
                      <div style={{ display: 'flex', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ flex: 1, padding: '8px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#a0a0a0' }}>Month</div>
                        <div style={{ flex: 1, padding: '8px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#a0a0a0' }}>Est. Weight</div>
                        <div style={{ flex: 1, padding: '8px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#a0a0a0' }}>Lbs Lost</div>
                        <div style={{ flex: 2, padding: '8px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#a0a0a0' }}>Note</div>
                      </div>
                      {item.clinicalData.weightLossTimeline.map((row, i) => {
                        const projectedLoss = Math.round(cw * (row.pctLoss / 100));
                        const projectedWeight = Math.round(cw - projectedLoss);
                        const isInProgram = row.months <= currentDuration;
                        const hitGoal = projectedWeight <= gw;
                        return (
                          <div key={i} style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', background: hitGoal ? '#f0fdf4' : (isInProgram ? '#fff' : '#fafafa'), opacity: isInProgram ? 1 : 0.5 }}>
                            <div style={{ flex: 1, padding: '10px 12px', fontSize: '14px', fontWeight: '800', color: '#1a1a1a' }}>{row.months}</div>
                            <div style={{ flex: 1, padding: '10px 12px', fontSize: '14px', fontWeight: '800', color: hitGoal ? '#059669' : '#1a1a1a' }}>
                              {projectedWeight} lbs {hitGoal && '✓'}
                            </div>
                            <div style={{ flex: 1, padding: '10px 12px', fontSize: '14px', fontWeight: '700', color: '#2563eb' }}>-{projectedLoss}</div>
                            <div style={{ flex: 2, padding: '10px 12px', fontSize: '13px', color: '#737373' }}>{row.note}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ padding: '10px 14px', fontSize: '12px', color: '#737373', background: '#fafafa' }}>
                      {item.clinicalData.source} · Avg: {item.clinicalData.avgMonthlyLoss} · Plateau: {item.clinicalData.plateau}
                    </div>
                  </div>
                )}

                {/* Titration steps (always visible for WL) */}
                {item.titration && (
                  <div style={{ margin: '14px 0 4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737373', marginBottom: '8px' }}>
                      Dose Titration ({item.titration.frequency}) — maintenance at wk {item.titration.weeksToMaintenance}
                    </div>
                    <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
                      {item.titration.steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{
                            padding: '6px 10px', fontSize: '11px', fontWeight: '600',
                            background: i === item.titration.steps.length - 1 ? '#2563eb' : '#f0f0f0',
                            color: i === item.titration.steps.length - 1 ? '#fff' : '#404040',
                          }}>
                            {step}
                          </div>
                          {i < item.titration.steps.length - 1 && (
                            <div style={{ padding: '0 3px', color: '#ccc', fontSize: '10px' }}>→</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div style={s.optionRow}>
            {item.options && (
              <div style={s.optionGroup}>
                <span style={s.optionLabel}>Dose / Tier</span>
                <select style={s.optionSelect} value={planItem.selectedDoseIndex} onChange={(e) => updatePlanItem(planItem.uid, { selectedDoseIndex: parseInt(e.target.value) })}>
                  {item.options.map((opt, i) => (
                    <option key={i} value={i}>{opt.label} — {formatPrice(opt.priceCents)}/mo</option>
                  ))}
                </select>
              </div>
            )}
            {item.durationEditable && !item.durationTiers && (
              <div style={s.optionGroup}>
                <span style={s.optionLabel}>Duration (months)</span>
                <input type="number" min={1} max={24} value={planItem.customDuration || item.duration || 6}
                  onChange={(e) => updatePlanItem(planItem.uid, { customDuration: parseInt(e.target.value) || 1 })} style={s.durationInput} />
              </div>
            )}
            {Object.keys(item.paymentOptions).length > 0 && (
              <div style={s.optionGroup}>
                <span style={s.optionLabel}>Payment</span>
                <div style={s.paymentToggle}>
                  {['monthly', 'quarterly', 'annual', 'upfront'].filter(k => item.paymentOptions[k]).map(key => (
                    <button key={key} style={s.paymentBtn(planItem.selectedOption === key)}
                      onClick={() => updatePlanItem(planItem.uid, { selectedOption: key })}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                      {item.paymentOptions[key]?.discount > 0 && (
                        <span style={{ marginLeft: '4px', color: planItem.selectedOption === key ? '#4ade80' : '#2E6B35' }}>
                          {Math.round(item.paymentOptions[key].discount * 100)}% off
                        </span>
                      )}
                      {key === 'upfront' && item.paymentOptions[key]?.monthsFree && (() => {
                        const dur = planItem.customDuration || item.duration;
                        const tiers = Object.keys(item.paymentOptions[key].monthsFree).map(Number).sort((a, b) => a - b);
                        let free = 0;
                        for (const t of tiers) { if (dur >= t) free = item.paymentOptions[key].monthsFree[t]; }
                        if (free <= 0) return null;
                        return (
                          <span style={{ marginLeft: '4px', color: planItem.selectedOption === key ? '#4ade80' : '#2E6B35' }}>
                            {free}mo free
                          </span>
                        );
                      })()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Month-by-month cost breakdown for stepped pricing */}
        {item.steppedPricing && pricing.monthlyBreakdown && (
          <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 20px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a0a0a0', marginBottom: '8px' }}>
              Monthly Cost Breakdown
            </div>
            <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
              {pricing.monthlyBreakdown.map((price, i) => {
                const isFree = planItem.selectedOption === 'upfront' && i >= pricing.monthlyBreakdown.length;
                const currentDuration = planItem.customDuration || item.duration;
                const upfrontConfig = item.paymentOptions.upfront;
                let freeMonths = 0;
                if (planItem.selectedOption === 'upfront' && upfrontConfig?.monthsFree) {
                  const tiers = Object.keys(upfrontConfig.monthsFree).map(Number).sort((a, b) => a - b);
                  for (const t of tiers) { if (currentDuration >= t) freeMonths = upfrontConfig.monthsFree[t]; }
                }
                const paidMonths = currentDuration - freeMonths;
                const isFreed = i >= paidMonths && planItem.selectedOption === 'upfront';

                return (
                  <div key={i} style={{
                    flex: '1 0 auto', minWidth: '60px', padding: '6px 8px', textAlign: 'center',
                    borderRight: i < pricing.monthlyBreakdown.length - 1 ? '1px solid #f0f0f0' : 'none',
                    background: isFreed ? '#f0fdf4' : 'transparent',
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#a0a0a0', textTransform: 'uppercase' }}>Mo {i + 1}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: isFreed ? '#059669' : '#1a1a1a' }}>
                      {isFreed ? 'FREE' : formatPrice(price)}
                    </div>
                    {item.titration && item.titration.steps[i] && (
                      <div style={{ fontSize: '9px', color: '#a0a0a0', marginTop: '2px' }}>
                        {item.titration.steps[i].split(' (')[0]}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Show free months for upfront */}
              {planItem.selectedOption === 'upfront' && (() => {
                const currentDuration = planItem.customDuration || item.duration;
                const upfrontConfig = item.paymentOptions.upfront;
                let freeMonths = 0;
                if (upfrontConfig?.monthsFree) {
                  const tiers = Object.keys(upfrontConfig.monthsFree).map(Number).sort((a, b) => a - b);
                  for (const t of tiers) { if (currentDuration >= t) freeMonths = upfrontConfig.monthsFree[t]; }
                }
                if (freeMonths <= 0) return null;
                const freeStartMonth = currentDuration - freeMonths;
                return Array.from({ length: freeMonths }, (_, fi) => (
                  <div key={`free-${fi}`} style={{
                    flex: '1 0 auto', minWidth: '60px', padding: '6px 8px', textAlign: 'center',
                    background: '#f0fdf4', borderRight: fi < freeMonths - 1 ? '1px solid #dcfce7' : 'none',
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#059669', textTransform: 'uppercase' }}>Mo {freeStartMonth + fi + 1}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#059669' }}>FREE</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        <div style={s.planCardPricing}>
          <div>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {pricing.monthly ? formatPrice(pricing.monthly) : formatPrice(pricing.total)}
            </span>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#a0a0a0', marginLeft: '4px' }}>
              {pricing.monthly ? '/mo avg' : ''}
            </span>
            {pricing.savings > 0 && (
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#2E6B35' }}>Save {formatPrice(pricing.savings)}</div>
            )}
            {/* Show avg monthly when paying upfront */}
            {!pricing.monthly && planItem.selectedOption === 'upfront' && (planItem.customDuration || item.duration) > 1 && (
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#737373', marginTop: '4px' }}>
                {formatPrice(Math.round(pricing.total / (planItem.customDuration || item.duration)))}/mo avg
              </div>
            )}
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#737373', textAlign: 'right' }}>
            {pricing.monthly && <>Total: {formatPrice(pricing.total)}<br />{pricing.label}</>}
            {!pricing.monthly && pricing.label !== 'One-time' && <>{pricing.label}</>}
          </div>
        </div>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Protocol Builder">
      <div style={s.page}>
        {/* ═══ LEFT PANEL — CATALOG ═══ */}
        <div style={s.catalog}>
          <div style={s.catalogHeader}>
            <div style={s.sectionLabel}><span style={s.dot} /> PROTOCOL CATALOG</div>
            <h2 style={s.catalogTitle}>Build a Plan</h2>
            <div style={s.categoryTabs}>
              <button style={s.categoryTab(activeCategory === 'all')} onClick={() => setActiveCategory('all')}>All</button>
              {BUILDER_CATEGORIES.map(cat => (
                <button key={cat.id} style={s.categoryTab(activeCategory === cat.id)} onClick={() => setActiveCategory(cat.id)}>{cat.label}</button>
              ))}
            </div>
          </div>
          <div style={s.catalogList}>
            <input type="text" placeholder="Search protocols..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={s.catalogSearch} />

            {filteredItems.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#a0a0a0', fontSize: '13px' }}>No protocols match your search.</div>
            )}

            {/* Peptides grouped by subcategory */}
            {groupedItems ? (
              groupedItems.map(group => (
                <div key={group.id}>
                  <div style={s.subcategoryHeader}>{group.label}</div>
                  {group.items.map(renderCatalogCard)}
                </div>
              ))
            ) : (
              filteredItems.map(renderCatalogCard)
            )}
          </div>
        </div>

        {/* ═══ RIGHT PANEL — PATIENT PLAN ═══ */}
        <div style={s.plan}>
          <div style={s.planHeader}>
            <div style={s.sectionLabel}><span style={s.dot} /> PATIENT PLAN</div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} ref={patientSearchRef}>
              {selectedPatient ? (
                <div style={s.patientBadge}>
                  <User size={14} />
                  {selectedPatient.first_name} {selectedPatient.last_name}
                  <button onClick={clearPatient} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: '#a0a0a0' }} />
                  <input type="text" placeholder="Search patient..." value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    onFocus={() => patientResults.length > 0 && setShowPatientDropdown(true)}
                    style={s.patientSearchInput} />
                  {showPatientDropdown && patientResults.length > 0 && (
                    <div style={s.patientDropdown}>
                      {patientResults.map(p => (
                        <div key={p.id}
                          style={{ padding: '10px 14px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between' }}
                          onClick={() => selectPatient(p)}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}>
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

          {/* Plan content */}
          <div style={{ flex: 1, overflowY: 'auto' }} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div style={{
              padding: '24px 32px',
              minHeight: '100%',
              transition: 'background 0.15s',
              background: dragOverPlan ? 'rgba(26,26,26,0.03)' : 'transparent',
              border: dragOverPlan ? '2px dashed #1a1a1a' : '2px dashed transparent',
            }}>

              {/* ── AI Recommendations ── */}
              {selectedPatient && (labSynopsis || assessmentSynopsis) && (
                <>
                  {labSynopsis && (
                    <div style={s.aiPanel}>
                      <div style={s.aiHeader} onClick={() => setAiExpanded(prev => ({ ...prev, labs: !prev.labs }))}>
                        <div style={s.aiTitle}><FlaskConical size={14} /> Lab Analysis — {labSynopsis.panel_type || 'Latest'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', opacity: 0.6 }}>{labSynopsis.lab_date}</span>
                          {aiExpanded.labs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>
                      {aiExpanded.labs && (
                        <div style={s.aiBody}>{labSynopsis.ai_synopsis}</div>
                      )}
                    </div>
                  )}
                  {assessmentSynopsis && (
                    <div style={s.aiPanel}>
                      <div style={s.aiHeader} onClick={() => setAiExpanded(prev => ({ ...prev, assessment: !prev.assessment }))}>
                        <div style={s.aiTitle}><Brain size={14} /> Assessment Analysis</div>
                        {aiExpanded.assessment ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                      {aiExpanded.assessment && (
                        <div style={s.aiBody}>{assessmentSynopsis.ai_synopsis}</div>
                      )}
                    </div>
                  )}
                </>
              )}

              {selectedPatient && !loadingContext && !labSynopsis && !assessmentSynopsis && (
                <div style={{ ...s.aiPanel, border: '1px dashed #e0e0e0' }}>
                  <div style={s.aiEmpty}>No lab or assessment data available for this patient. AI recommendations will appear here when data is available.</div>
                </div>
              )}

              {loadingContext && selectedPatient && (
                <div style={{ ...s.aiPanel, border: '1px dashed #e0e0e0' }}>
                  <div style={s.aiEmpty}>Loading patient data...</div>
                </div>
              )}

              {/* ── Current Protocols ── */}
              {selectedPatient && currentProtocols.length > 0 && (
                <div style={s.currentProtoSection}>
                  <div style={s.currentProtoHeader}>
                    <Activity size={13} /> Current Active Protocols
                  </div>
                  {currentProtocols.map(proto => {
                    const cat = getProtoCategory(proto);
                    const color = PROTO_COLORS[cat] || '#808080';
                    const startDate = proto.start_date ? new Date(proto.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                    const isUpgradable = proto.program_type === 'hrt' || proto.program_type === 'weight_loss';

                    return (
                      <div key={proto.id} style={s.currentProtoCard}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <span style={s.currentProtoBadge(color)}>{cat.replace('_', ' ')}</span>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>
                              {proto.program_name || proto.medication || 'Protocol'}
                              {proto.selected_dose && <span style={{ fontWeight: '400', color: '#737373' }}> — {proto.selected_dose}</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: '#a0a0a0' }}>
                              {startDate && <>Started {startDate}</>}
                              {proto.frequency && <> · {proto.frequency}</>}
                            </div>
                          </div>
                        </div>
                        {isUpgradable && (
                          <button
                            style={s.upgradeBtn}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#059669'; }}
                            onClick={() => {
                              // Map to builder item for upgrade
                              if (proto.program_type === 'hrt') addToPlan('hrt-membership');
                              else if (proto.medication?.toLowerCase().includes('sema')) addToPlan('wl-semaglutide');
                              else if (proto.medication?.toLowerCase().includes('tirz')) addToPlan('wl-tirzepatide');
                              else if (proto.medication?.toLowerCase().includes('reta')) addToPlan('wl-retatrutide');
                            }}
                          >
                            <ArrowUpRight size={12} /> Upgrade Billing
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── New Additions (dragged items) ── */}
              {planItems.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={s.currentProtoHeader}><Plus size={13} /> New Additions</div>
                </div>
              )}

              {planItems.length === 0 && !selectedPatient && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#a0a0a0' }}>
                  <div style={{ width: '64px', height: '64px', border: '2px dashed #d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Plus size={24} color="#d0d0d0" />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Drag protocols here</div>
                  <div style={{ fontSize: '13px', color: '#b0b0b0', marginTop: '6px' }}>or click + on any protocol · search a patient to see their current plan</div>
                </div>
              )}

              {planItems.map(renderPlanCard)}
            </div>
          </div>

          {/* Bottom total bar */}
          {planItems.length > 0 && (
            <div style={s.totalBar}>
              <div style={{ display: 'flex', gap: '32px', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373' }}>Estimated Total</div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1 }}>{formatPrice(totals.total)}</div>
                </div>
                {totals.monthlyRecurring > 0 && (
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#737373' }}>{formatPrice(totals.monthlyRecurring)}/mo recurring</div>
                )}
                {totals.savings > 0 && (
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#2E6B35' }}>Saving {formatPrice(totals.savings)}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={s.shareBtn} onClick={() => setShowPatientView(true)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}>
                  <Share2 size={14} /> Share with Patient
                </button>
                <button style={s.agreeBtn} onClick={() => setShowSummary(true)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#404040'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}>
                  Patient Agrees
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ SUMMARY MODAL ═══ */}
      {showSummary && (
        <div style={s.modalOverlay} onClick={() => setShowSummary(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0 }}>Protocol Summary</h3>
            </div>
            <div style={{ padding: '24px 28px' }}>
              {selectedPatient && (
                <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#fafafa', border: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a0a0a0', marginBottom: '4px' }}>Patient</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>{selectedPatient.first_name} {selectedPatient.last_name}</div>
                </div>
              )}

              {/* Existing protocols */}
              {currentProtocols.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a0a0a0', marginBottom: '8px' }}>Current Protocols</div>
                  {currentProtocols.map(proto => (
                    <div key={proto.id} style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: '13px', color: '#737373' }}>
                      {proto.program_name || proto.medication} {proto.selected_dose && `— ${proto.selected_dose}`}
                    </div>
                  ))}
                </div>
              )}

              {planItems.length > 0 && (
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a0a0a0', marginBottom: '8px' }}>New Additions</div>
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
                        {item.name}{selectedDose && <span style={{ fontWeight: '500', color: '#737373' }}> — {selectedDose.label}</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#737373' }}>{item.durationLabel}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700' }}>{pricing.monthly ? `${formatPrice(pricing.monthly)}/mo` : formatPrice(pricing.total)}</div>
                      {pricing.monthly && <div style={{ fontSize: '11px', color: '#a0a0a0' }}>Total: {formatPrice(pricing.total)}</div>}
                    </div>
                  </div>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 0', marginTop: '8px', borderTop: '2px solid #1a1a1a' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estimated Total</div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '900', textAlign: 'right' }}>{formatPrice(totals.total)}</div>
                  {totals.savings > 0 && <div style={{ fontSize: '12px', fontWeight: '700', color: '#2E6B35', textAlign: 'right' }}>Saving {formatPrice(totals.savings)}</div>}
                </div>
              </div>

              <div style={{ marginTop: '20px', fontSize: '12px', color: '#a0a0a0' }}>
                Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div style={{ padding: '20px 28px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button style={{ ...s.agreeBtn, background: '#fff', color: '#1a1a1a', border: '1px solid #e0e0e0' }}
                onClick={() => setShowSummary(false)}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}>
                Back to Builder
              </button>
              <button style={s.agreeBtn}
                onClick={() => { alert('Protocol agreement confirmed. Push to patient record coming soon.'); setShowSummary(false); }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#404040'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> Confirm Agreement</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ═══ PATIENT-FACING VIEW MODAL ═══ */}
      {showPatientView && (
        <div style={s.modalOverlay} onClick={() => setShowPatientView(false)}>
          <div style={s.patientView} onClick={(e) => e.stopPropagation()}>
            {/* Clean header */}
            <div style={s.pvHeader}>
              <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: '8px' }}>Range Medical</div>
              <h2 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em', textTransform: 'uppercase', margin: '0 0 6px', color: '#1a1a1a' }}>Your Personalized Plan</h2>
              {selectedPatient && (
                <div style={{ fontSize: '15px', color: '#737373' }}>
                  Prepared for {selectedPatient.first_name} {selectedPatient.last_name} — {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </div>

            {/* Protocol cards */}
            <div style={{ padding: '8px 48px 32px' }}>
              {planItems.map((planItem, idx) => {
                const item = BUILDER_ITEMS.find(i => i.id === planItem.itemId);
                if (!item) return null;
                const color = getCategoryColor(item.category);
                const selectedDose = item.options?.[planItem.selectedDoseIndex] || null;
                const pricing = calculatePricing(item, planItem.selectedOption, selectedDose, planItem.customDuration);

                return (
                  <div key={planItem.uid} style={s.pvCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <span style={{ width: '10px', height: '10px', background: color, display: 'inline-block' }} />
                          <span style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.01em' }}>{item.name}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#737373', marginLeft: '20px' }}>{item.description} — {item.durationLabel}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#1a1a1a' }}>
                          {pricing.monthly ? formatPrice(pricing.monthly) : formatPrice(pricing.total)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#a0a0a0', fontWeight: '500' }}>
                          {pricing.monthly ? '/mo' : ''} {pricing.label !== 'One-time' && !pricing.monthly ? pricing.label : ''}
                        </div>
                      </div>
                    </div>

                    {/* Best for */}
                    {item.bestFor && (
                      <div style={{ fontSize: '13px', color: '#404040', background: '#f8fafc', padding: '10px 14px', marginBottom: '14px', borderLeft: `3px solid ${color}`, lineHeight: '1.5' }}>
                        <span style={{ fontWeight: '700' }}>Best for: </span>{item.bestFor}
                      </div>
                    )}

                    {/* Benefits */}
                    {item.benefits && item.benefits.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a0a0a0', marginBottom: '8px' }}>Why This Protocol</div>
                        {item.benefits.map((b, i) => (
                          <div key={i} style={{ fontSize: '13px', color: '#404040', padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.5' }}>
                            <span style={{ width: '5px', height: '5px', background: color, flexShrink: 0, marginTop: '7px' }} />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* What's included */}
                    {item.included && item.included.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a0a0a0', marginBottom: '8px' }}>What's Included</div>
                        {item.included.map((inc, i) => (
                          <div key={i} style={{ fontSize: '13px', color: '#404040', padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.5' }}>
                            <Check size={13} style={{ color: '#2E6B35', flexShrink: 0, marginTop: '3px' }} />
                            <span>{inc}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedDose && (
                      <div style={{ fontSize: '12px', color: '#737373', marginTop: '10px' }}>Selected: {selectedDose.label}</div>
                    )}
                    {pricing.savings > 0 && (
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#2E6B35', marginTop: '8px' }}>Saving {formatPrice(pricing.savings)} with {planItem.selectedOption} billing</div>
                    )}
                  </div>
                );
              })}

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0 0', marginTop: '8px', borderTop: '2px solid #1a1a1a' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373' }}>Estimated Investment</div>
                  {totals.monthlyRecurring > 0 && (
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#737373', marginTop: '2px' }}>{formatPrice(totals.monthlyRecurring)}/mo recurring</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#1a1a1a', letterSpacing: '-0.02em' }}>{formatPrice(totals.total)}</div>
                  {totals.savings > 0 && <div style={{ fontSize: '13px', fontWeight: '700', color: '#2E6B35' }}>Saving {formatPrice(totals.savings)}</div>}
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '32px', padding: '20px 0', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#a0a0a0', lineHeight: '1.6' }}>
                  Range Medical — 1901 Westcliff Drive, Suite 10, Newport Beach, CA<br />
                  (949) 997-3988 — range-medical.com
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '20px 48px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '12px', justifyContent: 'flex-end', background: '#fafafa' }}>
              <button
                style={{ ...s.shareBtn }}
                onClick={() => {
                  window.print();
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
              >
                <Printer size={14} /> Print / Save PDF
              </button>
              <button
                style={{ ...s.agreeBtn, background: '#fff', color: '#1a1a1a', border: '1px solid #e0e0e0' }}
                onClick={() => setShowPatientView(false)}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
