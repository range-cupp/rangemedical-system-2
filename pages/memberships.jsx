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

// Categories and which service IDs to show in each
const CALCULATOR_CATEGORIES = [
  {
    label: 'Labs',
    ids: ['lab-mens-essential', 'lab-mens-elite', 'lab-womens-essential', 'lab-womens-elite'],
  },
  {
    label: 'Weight Loss',
    filter: s => s.category === 'Weight Loss',
  },
  {
    label: 'Hormone Optimization',
    ids: ['hrt-membership'],
  },
  {
    label: 'Peptides',
    filter: s => s.category === 'Peptides',
  },
  {
    label: 'IV Therapy',
    filter: s => s.category === 'IV Therapy - Standard' || s.category === 'IV Therapy - Specialty',
  },
  {
    label: 'Injection Programs',
    ids: ['inj-standard-10pack', 'inj-premium-10pack', 'inj-nad-50-10pack', 'inj-nad-75-10pack', 'inj-nad-100-10pack', 'inj-nad-125-10pack', 'inj-nad-150-10pack'],
  },
  {
    label: 'Single Injections',
    ids: ['inj-standard', 'inj-premium', 'inj-nad-50', 'inj-nad-75', 'inj-nad-100', 'inj-nad-125', 'inj-nad-150', 'inj-cortisone'],
  },
  {
    label: 'Body Therapies',
    ids: ['hbot-single', 'rlt-single'],
  },
  {
    label: 'PRP Therapy',
    ids: ['prp-single'],
  },
];

function formatPrice(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 });
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

export default function Memberships({ services }) {
  const [selected, setSelected] = useState({});
  const [expandedCats, setExpandedCats] = useState({ Labs: true, 'Weight Loss': true });
  const [labsPaid, setLabsPaid] = useState(false);
  const [labsPaidType, setLabsPaidType] = useState('essential'); // essential or elite
  const [showCal, setShowCal] = useState(false);

  const serviceMap = useMemo(() => {
    const map = {};
    services.forEach(s => { map[s.id] = s; });
    return map;
  }, [services]);

  const categoryGroups = useMemo(() => {
    return CALCULATOR_CATEGORIES.map(cat => {
      let items;
      if (cat.ids) {
        items = cat.ids.map(id => serviceMap[id]).filter(Boolean);
      } else if (cat.filter) {
        items = services.filter(cat.filter);
      }
      // Exclude null-price items
      items = items.filter(s => s.price !== null);
      return { label: cat.label, items };
    }).filter(g => g.items.length > 0);
  }, [services, serviceMap]);

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

  // Best fit = tier whose credits are closest to (but ideally >= ) the selected total
  const bestFitIndex = useMemo(() => {
    if (selectedTotal === 0) return -1;
    let best = -1;
    let bestDiff = Infinity;
    MEMBERSHIP_TIERS.forEach((tier, i) => {
      const diff = tier.credits - selectedTotal;
      // Prefer tiers that cover fully, then closest undershoot
      if (diff >= 0 && diff < bestDiff) {
        best = i;
        bestDiff = diff;
      }
    });
    // If nothing covers fully, pick the largest tier
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

              {categoryGroups.map(group => {
                const isExpanded = expandedCats[group.label] !== false;
                const groupSelectedCount = group.items.filter(s => selected[s.id]).length;
                return (
                  <div key={group.label} style={styles.catGroup}>
                    <button
                      style={styles.catHeader}
                      onClick={() => toggleCategory(group.label)}
                    >
                      <div style={styles.catHeaderLeft}>
                        <span style={styles.catLabel}>{group.label}</span>
                        {groupSelectedCount > 0 && (
                          <span style={styles.catBadge}>{groupSelectedCount}</span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp size={16} color="#737373" /> : <ChevronDown size={16} color="#737373" />}
                    </button>
                    {isExpanded && (
                      <div style={styles.catItems}>
                        {group.items.map(svc => (
                          <label key={svc.id} style={styles.serviceRow}>
                            <div style={styles.checkboxWrap}>
                              <div style={{
                                ...styles.checkbox,
                                ...(selected[svc.id] ? styles.checkboxChecked : {}),
                              }}>
                                {selected[svc.id] && <Check size={12} strokeWidth={3} color="#fff" />}
                              </div>
                              <input
                                type="checkbox"
                                checked={!!selected[svc.id]}
                                onChange={() => toggleService(svc.id)}
                                style={{ display: 'none' }}
                              />
                            </div>
                            <span style={styles.serviceName}>{svc.name}</span>
                            <span style={styles.servicePrice}>{formatPrice(svc.price)}</span>
                          </label>
                        ))}
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
  // Strip JS-style comments from JSON
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
  serviceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.7rem 1.25rem',
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
  month1: {
    marginTop: '0.75rem',
    padding: '0.625rem 0.75rem',
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
