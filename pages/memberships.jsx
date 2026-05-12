import Layout from '../components/Layout';
import Head from 'next/head';
import { useState, useMemo } from 'react';
import { Check, ChevronDown, ChevronUp, Phone, Calendar } from 'lucide-react';
import fs from 'fs';
import path from 'path';

const HBOT_SESSION_RETAIL = 185;
const RLT_SESSION_RETAIL = 85;

const MEMBERSHIP_PRICE = 299;
const INCLUDED_VALUE = HBOT_SESSION_RETAIL + RLT_SESSION_RETAIL; // $270
const FOLLOWUP_LAB_RETAIL = 350;
const FOLLOWUP_LAB_MONTHLY = Math.round(FOLLOWUP_LAB_RETAIL / 3); // ~$117 amortized
const MONTHLY_VALUE = INCLUDED_VALUE + FOLLOWUP_LAB_MONTHLY; // ongoing avg

const PROGRAM_PREFIXES = ['hrt-', 'wl-', 'pep-'];
const LAB_ESSENTIAL_IDS = new Set(['lab-mens-essential', 'lab-womens-essential']);
const LAB_ELITE_IDS = new Set(['lab-mens-elite', 'lab-womens-elite']);

function getMemberPrice(id, retailPrice) {
  if (LAB_ESSENTIAL_IDS.has(id)) return 0;
  if (LAB_ELITE_IDS.has(id)) return 400;
  if (PROGRAM_PREFIXES.some(p => id.startsWith(p))) return Math.round(retailPrice * 0.9);
  return Math.round(retailPrice * 0.8);
}

function getDiscountLabel(id) {
  if (LAB_ESSENTIAL_IDS.has(id)) return 'Included';
  if (LAB_ELITE_IDS.has(id)) return '$400 with membership';
  if (PROGRAM_PREFIXES.some(p => id.startsWith(p))) return '10% off';
  return '20% off';
}

// Display name overrides (UI only — services.json stays unchanged)
const DISPLAY_NAMES = {
  'wl-tirz-d1': 'Weight Loss Program T-2.5',
  'wl-tirz-d2': 'Weight Loss Program T-5',
  'wl-tirz-d3': 'Weight Loss Program T-7.5',
  'wl-tirz-d4': 'Weight Loss Program T-10',
  'wl-tirz-d5': 'Weight Loss Program T-12.5',
  'wl-reta-d1': 'Weight Loss Program R-2',
  'wl-reta-d2': 'Weight Loss Program R-4',
  'wl-reta-d3': 'Weight Loss Program R-6',
  'wl-reta-d4': 'Weight Loss Program R-8',
  'wl-reta-d5': 'Weight Loss Program R-10',
  'wl-reta-d6': 'Weight Loss Program R-12',
  'pep-2xblend-p1': 'Tesamorelin/Ipamorelin — Phase 1',
  'pep-2xblend-p2': 'Tesamorelin/Ipamorelin — Phase 2',
  'pep-2xblend-p3': 'Tesamorelin/Ipamorelin — Phase 3',
  'iv-range': 'Range IV',
  'iv-immune-defense': 'Immune Defense',
  'iv-energy-vitality': 'Energy & Vitality',
  'iv-muscle-recovery': 'Muscle Recovery',
  'iv-detox-cellular': 'Detox & Cellular Repair',
  'iv-nad-225': '225mg',
  'iv-nad-500': '500mg',
  'iv-nad-750': '750mg',
  'iv-nad-1000': '1000mg',
  'iv-vitc-25': '25g',
  'iv-vitc-50': '50g',
  'iv-vitc-75': '75g',
  'iv-glutathione-1g': '1g',
  'iv-glutathione-2g': '2g',
  'iv-glutathione-3g': '3g',
  'inj-standard': 'B12, B-Complex, D3, Biotin, Amino Blend, NAC, BCAA',
  'inj-premium': 'L-Carnitine, Glutathione, MIC-B12/Skinny Shot',
  'hbot-1x': '1x/Week (4 sessions/mo)',
  'hbot-2x': '2x/Week (8 sessions/mo)',
  'hbot-3x': '3x/Week (12 sessions/mo)',
  'rlt-1x': '1x/Week (4 sessions/mo)',
  'rlt-2x': '2x/Week (8 sessions/mo)',
  'rlt-3x': '3x/Week (12 sessions/mo)',
  'combo-1x': '1x/Week — HBOT + RLT each session',
  'combo-2x': '2x/Week — HBOT + RLT each session',
  'combo-3x': '3x/Week — HBOT + RLT each session',
};


// Categories with nested collapsible sub-groups
// items = flat selectable list, groups = collapsible sub-sections
const CALCULATOR_CATEGORIES = [
  {
    label: 'Labs',
    items: ['lab-mens-essential', 'lab-mens-elite', 'lab-womens-essential', 'lab-womens-elite'],
  },
  {
    label: 'Weight Loss',
    groups: [
      {
        label: 'Tirzepatide',
        items: ['wl-tirz-d1', 'wl-tirz-d2', 'wl-tirz-d3', 'wl-tirz-d4', 'wl-tirz-d5'],
      },
      {
        label: 'Retatrutide',
        items: ['wl-reta-d1', 'wl-reta-d2', 'wl-reta-d3', 'wl-reta-d4', 'wl-reta-d5', 'wl-reta-d6'],
      },
    ],
  },
  {
    label: 'Hormone Optimization',
    items: ['hrt-membership'],
  },
  {
    label: 'Peptides',
    groups: [
      {
        label: 'BPC-157 / TB-4',
        items: ['pep-bpc-tb4-10', 'pep-bpc-tb4-20', 'pep-bpc-tb4-30'],
      },
      {
        label: 'Recovery 4-Blend',
        items: ['pep-recovery-4blend-10', 'pep-recovery-4blend-20', 'pep-recovery-4blend-30'],
      },
      {
        label: 'GHK-Cu',
        items: ['pep-ghkcu-30', 'pep-ghkcu-cream'],
      },
      {
        label: 'GLOW',
        items: ['pep-glow-30'],
      },
      {
        label: 'MOTS-C',
        items: ['pep-motsc-p1', 'pep-motsc-p2'],
      },
      {
        label: '2X Blend — Tesamorelin/Ipamorelin',
        items: ['pep-2xblend-p1', 'pep-2xblend-p2', 'pep-2xblend-p3'],
      },
      {
        label: '3X Blend',
        items: ['pep-3xblend-p1', 'pep-3xblend-p2', 'pep-3xblend-p3'],
      },
      {
        label: '4X Blend',
        items: ['pep-4xblend-p1', 'pep-4xblend-p2', 'pep-4xblend-p3'],
      },
    ],
  },
  {
    label: 'IV Therapy',
    groups: [
      {
        label: 'Range IV',
        items: ['iv-immune-defense', 'iv-energy-vitality', 'iv-muscle-recovery', 'iv-detox-cellular'],
      },
      {
        label: 'NAD+ IV',
        items: ['iv-nad-225', 'iv-nad-500', 'iv-nad-750', 'iv-nad-1000'],
      },
      {
        label: 'Vitamin C IV',
        items: ['iv-vitc-25', 'iv-vitc-50', 'iv-vitc-75'],
      },
      {
        label: 'Glutathione IV',
        items: ['iv-glutathione-1g', 'iv-glutathione-2g', 'iv-glutathione-3g'],
      },
      {
        label: 'Specialty IV',
        items: ['iv-methylene-blue', 'iv-mb-vitc-mag-combo'],
      },
      {
        label: 'IV Add-Ons',
        items: ['iv-addon'],
      },
    ],
  },
  {
    label: 'Injection Programs',
    items: ['inj-standard-10pack', 'inj-premium-10pack', 'inj-nad-50-10pack', 'inj-nad-75-10pack', 'inj-nad-100-10pack', 'inj-nad-125-10pack', 'inj-nad-150-10pack'],
  },
  {
    label: 'Single Injections',
    groups: [
      {
        label: 'Standard Injection',
        items: ['inj-standard'],
      },
      {
        label: 'Premium Injection',
        items: ['inj-premium'],
      },
      {
        label: 'NAD+ Injection',
        items: ['inj-nad-50', 'inj-nad-75', 'inj-nad-100', 'inj-nad-125', 'inj-nad-150'],
      },
      {
        label: 'Cortisone',
        items: ['inj-cortisone'],
      },
    ],
  },
  {
    label: 'Body Therapies',
    groups: [
      {
        label: 'HBOT',
        items: ['hbot-1x', 'hbot-2x', 'hbot-3x'],
      },
      {
        label: 'Red Light Therapy',
        items: ['rlt-1x', 'rlt-2x', 'rlt-3x'],
      },
      {
        label: 'HBOT + RLT Combo',
        items: ['combo-1x', 'combo-2x', 'combo-3x'],
      },
    ],
  },
  {
    label: 'PRP Therapy',
    items: ['prp-single'],
  },
];

function formatPrice(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getDisplayName(svc) {
  return DISPLAY_NAMES[svc.id] || svc.name;
}

function ServiceRow({ svc, selected, onToggle }) {
  const memberPrice = getMemberPrice(svc.id, svc.price);
  const discountLabel = getDiscountLabel(svc.id);
  return (
    <label style={styles.serviceRow}>
      <div style={styles.checkboxWrap}>
        <div style={{
          ...styles.checkbox,
          ...(selected ? styles.checkboxChecked : {}),
        }}>
          {selected && <Check size={12} strokeWidth={3} color="#fff" />}
        </div>
        <input
          type="checkbox"
          checked={!!selected}
          onChange={onToggle}
          style={{ display: 'none' }}
        />
      </div>
      <div style={styles.serviceNameCol}>
        <span style={styles.serviceName}>{getDisplayName(svc)}</span>
        <span style={styles.memberNote}>
          Member: {memberPrice === 0 ? 'Included' : `${formatPrice(memberPrice)} (${discountLabel})`}
        </span>
      </div>
      <div style={styles.servicePriceCol}>
        <span style={styles.servicePrice}>{formatPrice(svc.price)}</span>
        <span style={styles.servicePriceLabel}>retail</span>
      </div>
    </label>
  );
}

// Collapsible sub-group within a category
function SubGroup({ label, items, serviceMap, selected, onToggle, expanded, onToggleExpand }) {
  const resolvedItems = items.map(id => serviceMap[id]).filter(Boolean).filter(s => s.price !== null);
  if (resolvedItems.length === 0) return null;
  const selectedCount = resolvedItems.filter(s => selected[s.id]).length;

  return (
    <div style={styles.subGroup}>
      <button style={styles.subGroupHeader} onClick={onToggleExpand}>
        <div style={styles.subGroupLeft}>
          <span style={styles.subGroupLabel}>{label}</span>
          {selectedCount > 0 && <span style={styles.subGroupBadge}>{selectedCount}</span>}
        </div>
        {expanded ? <ChevronUp size={14} color="#a3a3a3" /> : <ChevronDown size={14} color="#a3a3a3" />}
      </button>
      {expanded && (
        <div style={styles.subGroupItems}>
          {resolvedItems.map(svc => (
            <ServiceRow
              key={svc.id}
              svc={svc}
              selected={selected[svc.id]}
              onToggle={() => onToggle(svc.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Memberships({ services }) {
  const [selected, setSelected] = useState({});
  const [expandedCats, setExpandedCats] = useState({ Labs: true, 'Weight Loss': true });
  const [expandedSubs, setExpandedSubs] = useState({});

  const serviceMap = useMemo(() => {
    const map = {};
    services.forEach(s => { map[s.id] = s; });
    return map;
  }, [services]);

  const selectedServices = useMemo(() => {
    return Object.entries(selected)
      .filter(([, checked]) => checked)
      .map(([id]) => serviceMap[id])
      .filter(Boolean);
  }, [selected, serviceMap]);

  const retailTotal = useMemo(() => {
    return selectedServices.reduce((sum, svc) => sum + svc.price, 0);
  }, [selectedServices]);

  const memberTotal = useMemo(() => {
    return selectedServices.reduce((sum, svc) => sum + getMemberPrice(svc.id, svc.price), 0);
  }, [selectedServices]);

  const totalSavings = retailTotal - memberTotal;

  const toggleService = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategory = (label) => {
    setExpandedCats(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const toggleSubGroup = (key) => {
    setExpandedSubs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const countSelected = (cat) => {
    let count = 0;
    if (cat.items) {
      cat.items.forEach(id => { if (selected[id]) count++; });
    }
    if (cat.groups) {
      cat.groups.forEach(g => {
        g.items.forEach(id => { if (selected[id]) count++; });
      });
    }
    return count;
  };

  const catHasItems = (cat) => {
    if (cat.items) {
      return cat.items.some(id => serviceMap[id] && serviceMap[id].price !== null);
    }
    if (cat.groups) {
      return cat.groups.some(g => g.items.some(id => serviceMap[id] && serviceMap[id].price !== null));
    }
    return false;
  };

  return (
    <Layout
      title="Membership Calculator | Range Medical"
      description="See how a Range Medical membership pays for itself. Compare tiers based on the services you actually use. Newport Beach. (949) 997-3988"
    >
      <Head>
        <link rel="canonical" href="https://www.range-medical.com/memberships" />
      </Head>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.container}>
          <div style={styles.kicker}>RANGE MEMBERSHIP</div>
          <h1 style={styles.h1}>One Membership. Everything You Need.</h1>
          <p style={styles.heroSub}>
            Labs on a schedule, body therapy sessions every month, and discounts on
            everything else. Select services below to see your savings.
          </p>
        </div>
      </section>

      <section style={styles.mainSection} className="memberships-page">
        <div style={styles.container}>
          <div style={styles.layout} className="layout-flex">

            {/* LEFT: Service Selection */}
            <div style={styles.selectionCol} className="selection-col">
              <div style={styles.stickySubtotal}>
                <span style={styles.subtotalLabel}>Retail total</span>
                <span style={styles.subtotalValue}>{formatPrice(retailTotal)}</span>
              </div>

              {CALCULATOR_CATEGORIES.filter(cat => catHasItems(cat)).map(cat => {
                const isExpanded = expandedCats[cat.label] !== false;
                const selectedCount = countSelected(cat);
                return (
                  <div key={cat.label} style={styles.catGroup}>
                    <button
                      style={styles.catHeader}
                      onClick={() => toggleCategory(cat.label)}
                    >
                      <div style={styles.catHeaderLeft}>
                        <span style={styles.catLabel}>{cat.label}</span>
                        {selectedCount > 0 && (
                          <span style={styles.catBadge}>{selectedCount}</span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp size={16} color="#737373" /> : <ChevronDown size={16} color="#737373" />}
                    </button>
                    {isExpanded && (
                      <div style={styles.catItems}>
                        {cat.items && cat.items.map(id => {
                          const svc = serviceMap[id];
                          if (!svc || svc.price === null) return null;
                          return (
                            <ServiceRow
                              key={id}
                              svc={svc}
                              selected={selected[id]}
                              onToggle={() => toggleService(id)}
                            />
                          );
                        })}
                        {cat.groups && cat.groups.map(group => {
                          const subKey = `${cat.label}::${group.label}`;
                          return (
                            <SubGroup
                              key={subKey}
                              label={group.label}
                              items={group.items}
                              serviceMap={serviceMap}
                              selected={selected}
                              onToggle={toggleService}
                              expanded={!!expandedSubs[subKey]}
                              onToggleExpand={() => toggleSubGroup(subKey)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* RIGHT: Membership Card + Savings */}
            <div style={styles.tiersCol}>
              <div style={styles.membershipCard}>
                <div style={styles.mcPrice}>
                  <span style={styles.mcAmount}>{formatPrice(MEMBERSHIP_PRICE)}</span>
                  <span style={styles.mcPeriod}>/mo</span>
                </div>
                <div style={styles.mcCommit}>3-month minimum, then month-to-month</div>

                <div style={styles.mcDivider} />

                <div style={styles.mcSection}>
                  <div style={styles.mcSectionLabel}>Labs</div>
                  <div style={styles.mcItem}>
                    <Check size={14} strokeWidth={3} color="#16a34a" />
                    <span>Free Essential panel at signup ({formatPrice(350)} value)</span>
                  </div>
                  <div style={styles.mcItem}>
                    <Check size={14} strokeWidth={3} color="#16a34a" />
                    <span>Upgrade to Elite for {formatPrice(400)} (normally {formatPrice(750)})</span>
                  </div>
                  <div style={styles.mcItem}>
                    <Check size={14} strokeWidth={3} color="#16a34a" />
                    <span>Follow-up Essential panel every 12 weeks ({formatPrice(FOLLOWUP_LAB_RETAIL)} value)</span>
                  </div>
                </div>

                <div style={styles.mcSection}>
                  <div style={styles.mcSectionLabel}>Monthly Sessions</div>
                  <div style={styles.mcItem}>
                    <Check size={14} strokeWidth={3} color="#16a34a" />
                    <span>1 Hyperbaric session ({formatPrice(HBOT_SESSION_RETAIL)} value)</span>
                  </div>
                  <div style={styles.mcItem}>
                    <Check size={14} strokeWidth={3} color="#16a34a" />
                    <span>1 Red Light session ({formatPrice(RLT_SESSION_RETAIL)} value)</span>
                  </div>
                </div>

                <div style={styles.mcSection}>
                  <div style={styles.mcSectionLabel}>Member Discounts</div>
                  <div style={styles.mcItem}>
                    <Check size={14} strokeWidth={3} color="#16a34a" />
                    <span>10% off HRT, weight loss &amp; peptide programs</span>
                  </div>
                  <div style={styles.mcItem}>
                    <Check size={14} strokeWidth={3} color="#16a34a" />
                    <span>20% off IVs, injections &amp; extra body therapy sessions</span>
                  </div>
                </div>

                <div style={styles.mcDivider} />

                <div style={styles.mcValueLine}>
                  {formatPrice(MONTHLY_VALUE)}/mo in value &mdash; you pay {formatPrice(MEMBERSHIP_PRICE)}
                </div>
              </div>

              {/* Savings breakdown when services are selected */}
              {selectedServices.length > 0 && (
                <div style={styles.savingsCard}>
                  <div style={styles.savingsHeader}>YOUR MEMBER SAVINGS</div>

                  <div style={styles.savingsTableHeader}>
                    <span style={styles.savingsThName}>Service</span>
                    <span style={styles.savingsTh}>Retail</span>
                    <span style={styles.savingsTh}>Member</span>
                  </div>

                  {selectedServices.map(svc => {
                    const mp = getMemberPrice(svc.id, svc.price);
                    return (
                      <div key={svc.id} style={styles.savingsRow}>
                        <span style={styles.savingsName}>{getDisplayName(svc)}</span>
                        <span style={styles.savingsRetail}>{formatPrice(svc.price)}</span>
                        <span style={styles.savingsMember}>{mp === 0 ? 'Included' : formatPrice(mp)}</span>
                      </div>
                    );
                  })}

                  <div style={styles.savingsTotalRow}>
                    <span style={styles.savingsTotalLabel}>Total</span>
                    <span style={styles.savingsTotalVal}>{formatPrice(retailTotal)}</span>
                    <span style={styles.savingsTotalMember}>{formatPrice(memberTotal)}</span>
                  </div>

                  {totalSavings > 0 && (
                    <div style={styles.savingsHighlight}>
                      You save {formatPrice(totalSavings)} on these services as a member
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              <div style={styles.ctaSection}>
                <p style={styles.ctaText}>Ready to get started? Let&rsquo;s talk through your protocol.</p>
                <div style={styles.ctaBtns}>
                  <a href="/book-assessment" style={styles.ctaPrimary}>
                    <Calendar size={16} />
                    Book Assessment
                  </a>
                  <a href="tel:9499973988" style={styles.ctaOutline}>
                    <Phone size={16} />
                    Ask Us Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @media (max-width: 960px) {
          .memberships-page .layout-flex {
            flex-direction: column !important;
          }
          .memberships-page .selection-col {
            max-width: 100% !important;
            flex: 1 !important;
          }
        }
      `}</style>
    </Layout>
  );
}

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'data', 'services.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const cleaned = raw.replace(/\/\/[^\n]*/g, '');
  const data = JSON.parse(cleaned);
  return {
    props: {
      services: data.services.filter(s => s.price !== null),
    },
  };
}

const styles = {
  hero: {
    padding: '4rem 0 2.5rem',
    textAlign: 'center',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem',
  },
  kicker: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#737373',
    marginBottom: '0.75rem',
  },
  h1: {
    fontSize: '2.25rem',
    fontWeight: 800,
    color: '#171717',
    margin: '0 0 1rem',
    lineHeight: 1.15,
  },
  heroSub: {
    fontSize: '1.05rem',
    color: '#525252',
    maxWidth: '560px',
    margin: '0 auto',
    lineHeight: 1.6,
  },
  mainSection: {
    padding: '0 0 5rem',
  },
  layout: {
    display: 'flex',
    gap: '2.5rem',
    alignItems: 'flex-start',
  },
  selectionCol: {
    flex: '0 0 420px',
    maxWidth: '420px',
  },
  tiersCol: {
    flex: 1,
    minWidth: 0,
  },
  stickySubtotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    background: '#fafafa',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    marginBottom: '1.25rem',
  },
  subtotalLabel: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#525252',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  subtotalValue: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#171717',
  },
  catGroup: {
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    marginBottom: '0.75rem',
    overflow: 'hidden',
  },
  catHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '0.875rem 1.25rem',
    background: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  catHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  catLabel: {
    fontSize: '0.8rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#171717',
  },
  catBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    background: '#171717',
    color: '#fff',
    borderRadius: '10px',
    padding: '2px 7px',
    lineHeight: 1.4,
  },
  catItems: {
    borderTop: '1px solid #f0f0f0',
  },
  // Sub-group styles
  subGroup: {
    borderBottom: '1px solid #f0f0f0',
  },
  subGroupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '0.65rem 1.25rem',
    background: '#fafafa',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  subGroupLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  subGroupLabel: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#525252',
  },
  subGroupBadge: {
    fontSize: '0.6rem',
    fontWeight: 700,
    background: '#525252',
    color: '#fff',
    borderRadius: '8px',
    padding: '1px 6px',
    lineHeight: 1.4,
  },
  subGroupItems: {
    // items render inside
  },
  serviceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.7rem 1.25rem 0.7rem 1.75rem',
    cursor: 'pointer',
    transition: 'background 0.15s',
    borderBottom: '1px solid #f5f5f5',
  },
  checkboxWrap: {
    flexShrink: 0,
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#d4d4d4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    background: '#fff',
  },
  checkboxChecked: {
    background: '#171717',
    borderColor: '#171717',
  },
  serviceNameCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    minWidth: 0,
  },
  serviceName: {
    fontSize: '0.875rem',
    color: '#171717',
    lineHeight: 1.3,
  },
  servicePriceCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.1rem',
    flexShrink: 0,
  },
  servicePrice: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#525252',
    whiteSpace: 'nowrap',
  },
  servicePriceLabel: {
    fontSize: '0.6rem',
    fontWeight: 500,
    color: '#a3a3a3',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  memberNote: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#16a34a',
    lineHeight: 1.3,
  },
  membershipCard: {
    border: '2px solid #171717',
    borderRadius: '12px',
    padding: '2rem',
    background: '#fff',
    boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
  },
  mcPrice: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.125rem',
  },
  mcAmount: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#171717',
    lineHeight: 1,
  },
  mcPeriod: {
    fontSize: '1rem',
    fontWeight: 500,
    color: '#737373',
  },
  mcCommit: {
    fontSize: '0.85rem',
    color: '#737373',
    marginTop: '0.375rem',
  },
  mcDivider: {
    height: '1px',
    background: '#f0f0f0',
    margin: '1.25rem 0',
  },
  mcSection: {
    marginBottom: '1.25rem',
  },
  mcSectionLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#a3a3a3',
    marginBottom: '0.625rem',
  },
  mcItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: '#404040',
    lineHeight: 1.4,
    marginBottom: '0.5rem',
  },
  mcValueLine: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#16a34a',
    textAlign: 'center',
  },
  savingsCard: {
    marginTop: '1.25rem',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '1.5rem',
    background: '#fff',
  },
  savingsHeader: {
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#737373',
    marginBottom: '1rem',
  },
  savingsTableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 80px 80px',
    gap: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #e5e5e5',
    marginBottom: '0.25rem',
  },
  savingsThName: {
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#a3a3a3',
  },
  savingsTh: {
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#a3a3a3',
    textAlign: 'right',
  },
  savingsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 80px 80px',
    gap: '0.5rem',
    padding: '0.5rem 0',
    borderBottom: '1px solid #f5f5f5',
  },
  savingsName: {
    fontSize: '0.8rem',
    color: '#404040',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  savingsRetail: {
    fontSize: '0.8rem',
    color: '#a3a3a3',
    textAlign: 'right',
    textDecoration: 'line-through',
  },
  savingsMember: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#171717',
    textAlign: 'right',
  },
  savingsTotalRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 80px 80px',
    gap: '0.5rem',
    padding: '0.75rem 0 0.5rem',
    borderTop: '2px solid #171717',
    marginTop: '0.25rem',
  },
  savingsTotalLabel: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#171717',
  },
  savingsTotalVal: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#a3a3a3',
    textAlign: 'right',
    textDecoration: 'line-through',
  },
  savingsTotalMember: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#171717',
    textAlign: 'right',
  },
  savingsHighlight: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: '#f0fdf4',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#16a34a',
    textAlign: 'center',
  },
  ctaSection: {
    marginTop: '1.5rem',
    textAlign: 'center',
    padding: '2rem',
    background: '#fafafa',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
  },
  ctaText: {
    fontSize: '1.05rem',
    fontWeight: 500,
    color: '#171717',
    margin: '0 0 1.25rem',
  },
  ctaBtns: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  ctaPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#171717',
    color: '#fff',
    padding: '0.875rem 1.5rem',
    fontSize: '0.85rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  ctaOutline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'transparent',
    color: '#171717',
    padding: '0.875rem 1.5rem',
    fontSize: '0.85rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textDecoration: 'none',
    borderRadius: '8px',
    border: '2px solid #171717',
    transition: 'all 0.2s',
  },
};
