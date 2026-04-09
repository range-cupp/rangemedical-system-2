import Layout from '../components/Layout';
import Head from 'next/head';
import { useState, useMemo } from 'react';
import { Check, ChevronDown, ChevronUp, Phone, Calendar, X } from 'lucide-react';
import fs from 'fs';
import path from 'path';

const MEMBERSHIP_TIERS = [
  { name: 'Baseline', monthly: 299, credits: 450, bonus: 151 },
  { name: 'Protocol', monthly: 599, credits: 950, bonus: 351 },
  { name: 'Performance', monthly: 1299, credits: 2100, bonus: 801 },
];

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
        label: 'Tesamorelin/Ipamorelin',
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
    items: ['hbot-single', 'rlt-single'],
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

function CoverageIndicator({ credits, total }) {
  if (total === 0) return null;
  if (credits >= total) {
    return (
      <div style={styles.coverageFull}>
        <Check size={14} strokeWidth={3} />
        <span>Fully covered</span>
      </div>
    );
  }
  if (credits >= total * 0.5) {
    return (
      <div style={styles.coveragePartial}>
        <span style={styles.coverageDot}>~</span>
        <span>Covers {Math.round((credits / total) * 100)}%</span>
      </div>
    );
  }
  return (
    <div style={styles.coverageNone}>
      <span style={styles.coverageDot}>&mdash;</span>
      <span>Covers {Math.round((credits / total) * 100)}%</span>
    </div>
  );
}

// Renders a single selectable service row
function ServiceRow({ svc, selected, onToggle }) {
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
      <span style={styles.serviceName}>{getDisplayName(svc)}</span>
      <span style={styles.servicePrice}>{formatPrice(svc.price)}</span>
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
  const [labsPaid, setLabsPaid] = useState(false);
  const [labsPaidType, setLabsPaidType] = useState('essential');
  const [showCal, setShowCal] = useState(false);

  const serviceMap = useMemo(() => {
    const map = {};
    services.forEach(s => { map[s.id] = s; });
    return map;
  }, [services]);

  const selectedTotal = useMemo(() => {
    return Object.entries(selected).reduce((sum, [id, checked]) => {
      if (!checked) return sum;
      const svc = serviceMap[id];
      return sum + (svc ? svc.price : 0);
    }, 0);
  }, [selected, serviceMap]);

  const labCreditAmount = labsPaid ? (labsPaidType === 'elite' ? 750 : 350) : 0;

  const toggleService = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategory = (label) => {
    setExpandedCats(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const toggleSubGroup = (key) => {
    setExpandedSubs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Count selected items in a category
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

  // Check if category has any valid items
  const catHasItems = (cat) => {
    if (cat.items) {
      return cat.items.some(id => serviceMap[id] && serviceMap[id].price !== null);
    }
    if (cat.groups) {
      return cat.groups.some(g => g.items.some(id => serviceMap[id] && serviceMap[id].price !== null));
    }
    return false;
  };

  const bestFitIndex = useMemo(() => {
    if (selectedTotal === 0) return -1;
    let best = -1;
    let bestDiff = Infinity;
    MEMBERSHIP_TIERS.forEach((tier, i) => {
      const diff = tier.credits - selectedTotal;
      if (diff >= 0 && diff < bestDiff) {
        best = i;
        bestDiff = diff;
      }
    });
    if (best === -1) best = MEMBERSHIP_TIERS.length - 1;
    return best;
  }, [selectedTotal]);

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
          <div style={styles.kicker}>MEMBERSHIP CALCULATOR</div>
          <h1 style={styles.h1}>See What a Membership Saves You</h1>
          <p style={styles.heroSub}>
            Select the services you're interested in. We'll show you which membership tier
            gives you the most value for how you plan to use Range Medical.
          </p>
        </div>
      </section>

      <section style={styles.mainSection} className="memberships-page">
        <div style={styles.container}>
          <div style={styles.layout} className="layout-flex">

            {/* LEFT: Service Selection */}
            <div style={styles.selectionCol} className="selection-col">
              <div style={styles.stickySubtotal}>
                <span style={styles.subtotalLabel}>Your monthly total</span>
                <span style={styles.subtotalValue}>{formatPrice(selectedTotal)}</span>
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
                        {/* Direct items */}
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
                        {/* Sub-groups */}
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

              {/* Labs Already Paid Toggle */}
              <div style={styles.labsToggleSection}>
                <label style={styles.labsToggleRow}>
                  <div style={styles.checkboxWrap}>
                    <div style={{
                      ...styles.checkbox,
                      ...(labsPaid ? styles.checkboxChecked : {}),
                    }}>
                      {labsPaid && <Check size={12} strokeWidth={3} color="#fff" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={labsPaid}
                      onChange={() => setLabsPaid(!labsPaid)}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <span style={styles.labsToggleText}>I already completed my labs today</span>
                </label>
                {labsPaid && (
                  <div style={styles.labsTypeSelect}>
                    <button
                      style={{
                        ...styles.labsTypeBtn,
                        ...(labsPaidType === 'essential' ? styles.labsTypeBtnActive : {}),
                      }}
                      onClick={() => setLabsPaidType('essential')}
                    >
                      Essential &mdash; $350
                    </button>
                    <button
                      style={{
                        ...styles.labsTypeBtn,
                        ...(labsPaidType === 'elite' ? styles.labsTypeBtnActive : {}),
                      }}
                      onClick={() => setLabsPaidType('elite')}
                    >
                      Elite &mdash; $750
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Membership Comparison */}
            <div style={styles.tiersCol}>
              <div style={styles.tiersHeader}>
                <div style={styles.kicker}>COMPARE TIERS</div>
                <h2 style={styles.h2}>Your Membership Fit</h2>
                {selectedTotal === 0 && (
                  <p style={styles.tiersEmpty}>Select services on the left to see which tier is right for you.</p>
                )}
              </div>

              <div style={styles.tiersGrid} className="tiers-grid">
                {MEMBERSHIP_TIERS.map((tier, i) => {
                  const isBest = i === bestFitIndex && selectedTotal > 0;
                  const month1Net = labCreditAmount > 0
                    ? Math.max(0, tier.monthly - labCreditAmount)
                    : null;
                  const remaining = tier.credits - selectedTotal;

                  return (
                    <div
                      key={tier.name}
                      style={{
                        ...styles.tierCard,
                        ...(isBest ? styles.tierCardBest : {}),
                      }}
                    >
                      {isBest && <div style={styles.bestBadge}>BEST FIT</div>}
                      <div style={styles.tierName}>{tier.name}</div>
                      <div style={styles.tierPrice}>
                        {formatPrice(tier.monthly)}<span style={styles.tierPeriod}>/mo</span>
                      </div>
                      <div style={styles.tierCredits}>
                        {formatPrice(tier.credits)} in monthly credits
                      </div>
                      <div style={styles.tierBonus}>
                        +{formatPrice(tier.bonus)} bonus value per month
                      </div>

                      <div style={styles.tierDivider} />

                      {selectedTotal > 0 && (
                        <CoverageIndicator credits={tier.credits} total={selectedTotal} />
                      )}

                      {selectedTotal > 0 && remaining > 0 && (
                        <div style={styles.remaining}>
                          <span style={styles.remainingValue}>{formatPrice(remaining)}</span>
                          <span style={styles.remainingLabel}>left over for other services</span>
                        </div>
                      )}

                      {month1Net !== null && (
                        <div style={styles.month1}>
                          <span style={styles.month1Label}>Month 1 with lab credit:</span>
                          <span style={styles.month1Value}>
                            {month1Net === 0 ? 'Covered' : formatPrice(month1Net)}
                          </span>
                        </div>
                      )}

                      <div style={styles.tierSavings}>
                        {selectedTotal > 0 && selectedTotal <= tier.credits && (
                          <div style={styles.savingsLine}>
                            You save {formatPrice(tier.credits - tier.monthly)} vs. retail every month
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div style={styles.ctaSection}>
                <p style={styles.ctaText}>Ready to get started? Let's talk through your protocol.</p>
                <div style={styles.ctaBtns}>
                  <button
                    onClick={() => setShowCal(true)}
                    style={styles.ctaPrimary}
                  >
                    <Calendar size={16} />
                    Book a Follow-Up Call
                  </button>
                  <a href="tel:9499973988" style={styles.ctaOutline}>
                    <Phone size={16} />
                    Ask Us Now
                  </a>
                </div>
              </div>

              {/* Embedded Cal.com Modal */}
              {showCal && (
                <div style={styles.calOverlay} onClick={() => setShowCal(false)}>
                  <div style={styles.calModal} onClick={e => e.stopPropagation()}>
                    <button style={styles.calClose} onClick={() => setShowCal(false)}>
                      <X size={20} />
                    </button>
                    <iframe
                      src="https://range-medical.cal.com/range-team?embed=true&layout=month_view&theme=light"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                </div>
              )}
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
          .memberships-page .tiers-grid {
            grid-template-columns: 1fr !important;
            max-width: 400px;
          }
        }
        @media (max-width: 480px) {
          .memberships-page .tiers-grid {
            max-width: 100%;
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
  serviceName: {
    flex: 1,
    fontSize: '0.875rem',
    color: '#171717',
    lineHeight: 1.3,
  },
  servicePrice: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#525252',
    whiteSpace: 'nowrap',
  },
  labsToggleSection: {
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    marginTop: '1rem',
    background: '#fafafa',
  },
  labsToggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
  },
  labsToggleText: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#171717',
  },
  labsTypeSelect: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.875rem',
    paddingLeft: '2.75rem',
  },
  labsTypeBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#e5e5e5',
    borderRadius: '8px',
    background: '#fff',
    color: '#525252',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  labsTypeBtnActive: {
    borderColor: '#171717',
    color: '#171717',
    background: '#fff',
  },
  tiersHeader: {
    marginBottom: '1.5rem',
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#171717',
    margin: 0,
  },
  tiersEmpty: {
    fontSize: '0.9rem',
    color: '#737373',
    marginTop: '0.5rem',
  },
  tiersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  tierCard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e5e5e5',
    borderRadius: '12px',
    padding: '1.5rem',
    background: '#fff',
    position: 'relative',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  tierCardBest: {
    borderColor: '#171717',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  bestBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#171717',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '4px 12px',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
  },
  tierName: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#737373',
    marginBottom: '0.5rem',
  },
  tierPrice: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#171717',
    lineHeight: 1.1,
  },
  tierPeriod: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#737373',
  },
  tierCredits: {
    fontSize: '0.85rem',
    color: '#525252',
    marginTop: '0.5rem',
  },
  tierBonus: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#16a34a',
    marginTop: '0.25rem',
  },
  tierDivider: {
    height: '1px',
    background: '#f0f0f0',
    margin: '1rem 0',
  },
  coverageFull: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#16a34a',
  },
  coveragePartial: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#ca8a04',
  },
  coverageNone: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#a3a3a3',
  },
  coverageDot: {
    fontSize: '1rem',
    lineHeight: 1,
  },
  remaining: {
    marginTop: '0.625rem',
    padding: '0.5rem 0.75rem',
    background: '#f0fdf4',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  remainingValue: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#16a34a',
  },
  remainingLabel: {
    fontSize: '0.7rem',
    fontWeight: 500,
    color: '#525252',
  },
  month1: {
    marginTop: '0.625rem',
    padding: '0.5rem 0.75rem',
    background: '#fafafa',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  month1Label: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#737373',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  month1Value: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#171717',
  },
  tierSavings: {
    marginTop: '0.5rem',
  },
  savingsLine: {
    fontSize: '0.75rem',
    color: '#525252',
    lineHeight: 1.4,
  },
  ctaSection: {
    marginTop: '2.5rem',
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
  calOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  },
  calModal: {
    position: 'relative',
    background: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '680px',
    height: '80vh',
    maxHeight: '700px',
    overflow: 'hidden',
  },
  calClose: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    zIndex: 10,
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#525252',
  },
};
