// /pages/plan/[token].jsx
// Patient-facing protocol plan view — Range v2 editorial style
// Interactive payment duration toggle so patients can see pricing options

import { useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import {
  BUILDER_ITEMS,
  BUILDER_CATEGORIES,
  getCategoryColor,
  formatPrice,
  getSteppedTotal,
} from '../../lib/protocol-builder-config';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function getServerSideProps({ params }) {
  const { token } = params;

  const { data, error } = await supabase
    .from('shared_plans')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) {
    return { notFound: true };
  }

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { notFound: true };
  }

  return {
    props: {
      plan: {
        patientName: data.patient_name || null,
        planItems: data.plan_data,
        createdAt: data.created_at,
      },
    },
  };
}

// Calculate pricing for a plan item at a given duration
function calcItemPricing(item, planItem, overrideDuration) {
  const duration = overrideDuration || planItem.customDuration || item.duration;

  if (item.billingType === 'flat') {
    return { monthly: null, total: item.priceCents, savings: 0, label: item.durationLabel };
  }

  if (item.billingType === 'monthly' && !item.duration) {
    return { monthly: item.priceCents, total: item.priceCents, savings: 0, label: 'Per month' };
  }

  // Stepped pricing
  if (item.steppedPricing) {
    const { total, monthlyBreakdown } = getSteppedTotal(item.steppedPricing, duration);

    // Calculate months free for upfront
    let freeMonths = 0;
    const upfrontConfig = item.paymentOptions?.upfront;
    if (upfrontConfig?.monthsFree) {
      const tiers = Object.keys(upfrontConfig.monthsFree).map(Number).sort((a, b) => a - b);
      for (const t of tiers) { if (duration >= t) freeMonths = upfrontConfig.monthsFree[t]; }
    }

    const paidMonths = duration - freeMonths;
    const upfrontTotal = monthlyBreakdown.slice(0, paidMonths).reduce((a, b) => a + b, 0);
    const savings = total - upfrontTotal;

    return {
      monthly: Math.round(total / duration),
      total,
      upfrontTotal,
      savings,
      freeMonths,
      duration,
      monthlyBreakdown,
      label: `${duration} months`,
    };
  }

  // Flat-rate program
  const baseCents = item.priceCents;
  const total = baseCents * duration;
  const discount = item.paymentOptions?.upfront?.discount || 0;
  const upfrontTotal = Math.round(total * (1 - discount));

  return {
    monthly: baseCents,
    total,
    upfrontTotal,
    savings: total - upfrontTotal,
    duration,
    label: `${duration} months`,
  };
}

export default function PatientPlanView({ plan }) {
  const [selectedDuration, setSelectedDuration] = useState(null); // null = use plan default
  const [expandedItems, setExpandedItems] = useState({});
  const durations = [3, 6, 9, 12];

  const toggleExpand = (idx) => {
    setExpandedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Build enriched items
  const enrichedItems = plan.planItems.map(planItem => {
    const item = BUILDER_ITEMS.find(i => i.id === planItem.itemId);
    return { planItem, item };
  }).filter(e => e.item);

  // Check if any items support duration toggle (WL items)
  const hasDurationToggle = enrichedItems.some(e => e.item.durationTiers);

  // Calculate totals
  const totals = enrichedItems.reduce((acc, { item, planItem }) => {
    const dur = (item.durationTiers && selectedDuration) ? selectedDuration : null;
    const pricing = calcItemPricing(item, planItem, dur);
    acc.monthlyTotal += pricing.total;
    acc.upfrontTotal += (pricing.upfrontTotal || pricing.total);
    acc.savings += pricing.savings || 0;
    return acc;
  }, { monthlyTotal: 0, upfrontTotal: 0, savings: 0 });

  return (
    <>
      <Head>
        <title>Your Protocol Plan — Range Medical</title>
        <meta name="robots" content="noindex, nofollow" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: '#fff',
        minHeight: '100vh',
        color: '#1a1a1a',
      }}>
        {/* ── Header ── */}
        <header style={{
          padding: '32px 0',
          borderBottom: '1px solid #e0e0e0',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: '12px' }}>
              Range Medical
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.03em', textTransform: 'uppercase', margin: '0 0 8px', lineHeight: 1.1 }}>
              Your Personalized Plan
            </h1>
            {plan.patientName && (
              <p style={{ fontSize: '16px', color: '#737373', margin: '0 0 4px' }}>
                Prepared for <span style={{ fontWeight: '700', color: '#1a1a1a' }}>{plan.patientName}</span>
              </p>
            )}
            <p style={{ fontSize: '14px', color: '#a0a0a0', margin: 0 }}>
              {new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </header>

        {/* ── Duration Toggle ── */}
        {hasDurationToggle && (
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#737373' }}>
                View Pricing By Duration
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0', border: '2px solid #1a1a1a', overflow: 'hidden', maxWidth: '500px', margin: '0 auto' }}>
              {durations.map(d => {
                const active = selectedDuration === d || (!selectedDuration && d === (plan.planItems[0]?.customDuration || 6));
                return (
                  <button key={d} onClick={() => setSelectedDuration(d)} style={{
                    flex: 1, padding: '14px 8px', border: 'none', cursor: 'pointer',
                    background: active ? '#1a1a1a' : '#fff',
                    color: active ? '#fff' : '#737373',
                    fontSize: '15px', fontWeight: '800',
                    textTransform: 'uppercase', letterSpacing: '-0.01em',
                    transition: 'all 0.15s',
                    borderRight: '1px solid #e0e0e0',
                  }}>
                    {d}mo
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Protocol Cards ── */}
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
          {enrichedItems.map(({ item, planItem }, idx) => {
            const color = getCategoryColor(item.category);
            const cat = BUILDER_CATEGORIES.find(c => c.id === item.category);
            const dur = (item.durationTiers && selectedDuration) ? selectedDuration : null;
            const pricing = calcItemPricing(item, planItem, dur);
            const activeDuration = dur || planItem.customDuration || item.duration;
            const expanded = expandedItems[idx] !== false; // default expanded

            return (
              <div key={idx} style={{
                border: '1px solid #e0e0e0',
                marginBottom: '24px',
                overflow: 'hidden',
              }}>
                {/* Card header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '24px 28px',
                  borderLeft: `4px solid ${color}`,
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                }} onClick={() => toggleExpand(idx)}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', background: color + '15', color }}>
                        {cat?.label || item.category}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.02em', margin: '0 0 2px' }}>{item.name}</h2>
                    <p style={{ fontSize: '14px', color: '#737373', margin: 0 }}>{item.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '20px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {pricing.monthly ? formatPrice(pricing.monthly) : formatPrice(pricing.total)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#a0a0a0', fontWeight: '500' }}>
                      {pricing.monthly ? '/mo' : ''}
                      {item.durationTiers ? ` · ${activeDuration} months` : (pricing.label !== 'One-time' ? ` · ${pricing.label}` : '')}
                    </div>
                  </div>
                </div>

                {expanded && (
                  <div style={{ padding: '24px 28px' }}>
                    {/* Best for */}
                    {item.bestFor && (
                      <div style={{
                        fontSize: '14px', color: '#404040', background: '#f8fafc',
                        padding: '12px 16px', marginBottom: '20px',
                        borderLeft: `3px solid ${color}`, lineHeight: '1.6',
                      }}>
                        <span style={{ fontWeight: '700' }}>Best for: </span>{item.bestFor}
                      </div>
                    )}

                    {/* Benefits */}
                    {item.benefits && item.benefits.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a0a0a0', margin: '0 0 12px' }}>
                          Why This Protocol
                        </h3>
                        {item.benefits.map((b, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '5px 0', fontSize: '14px', color: '#404040', lineHeight: '1.6' }}>
                            <span style={{ width: '6px', height: '6px', background: color, flexShrink: 0, marginTop: '8px' }} />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* What's included */}
                    {item.included && item.included.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a0a0a0', margin: '0 0 12px' }}>
                          What's Included
                        </h3>
                        {item.included.map((inc, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '4px 0', fontSize: '14px', color: '#404040', lineHeight: '1.6' }}>
                            <Check size={15} style={{ color: '#2E6B35', flexShrink: 0, marginTop: '4px' }} />
                            <span>{inc}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pricing breakdown for stepped items */}
                    {pricing.monthlyBreakdown && (
                      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a0a0a0', margin: '0 0 12px' }}>
                          Monthly Pricing
                        </h3>
                        <div style={{ display: 'flex', gap: '0', border: '1px solid #e0e0e0', overflow: 'hidden', flexWrap: 'wrap' }}>
                          {pricing.monthlyBreakdown.map((price, i) => (
                            <div key={i} style={{
                              flex: '1 0 auto', minWidth: '70px', padding: '10px 8px', textAlign: 'center',
                              borderRight: '1px solid #f0f0f0',
                              background: i >= (activeDuration - (pricing.freeMonths || 0)) ? '#f0fdf4' : '#fff',
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#a0a0a0', textTransform: 'uppercase' }}>Mo {i + 1}</div>
                              <div style={{ fontSize: '15px', fontWeight: '800', color: i >= (activeDuration - (pricing.freeMonths || 0)) ? '#059669' : '#1a1a1a', marginTop: '2px' }}>
                                {i >= (activeDuration - (pricing.freeMonths || 0)) ? 'FREE' : formatPrice(price)}
                              </div>
                            </div>
                          ))}
                          {/* Render free month slots */}
                          {pricing.freeMonths > 0 && Array.from({ length: pricing.freeMonths }, (_, fi) => (
                            <div key={`free-${fi}`} style={{
                              flex: '1 0 auto', minWidth: '70px', padding: '10px 8px', textAlign: 'center',
                              background: '#f0fdf4', borderRight: '1px solid #dcfce7',
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#059669', textTransform: 'uppercase' }}>Mo {pricing.monthlyBreakdown.length + fi + 1}</div>
                              <div style={{ fontSize: '15px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>FREE</div>
                            </div>
                          ))}
                        </div>

                        {/* Upfront option */}
                        {pricing.savings > 0 && (
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 16px', marginTop: '12px',
                            background: '#f0fdf4', border: '1px solid #dcfce7',
                          }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#059669' }}>
                                Pay upfront — {pricing.freeMonths > 0 ? `${pricing.freeMonths} month${pricing.freeMonths > 1 ? 's' : ''} free` : `save ${formatPrice(pricing.savings)}`}
                              </div>
                              <div style={{ fontSize: '13px', color: '#737373', marginTop: '2px' }}>
                                {formatPrice(Math.round(pricing.upfrontTotal / activeDuration))}/mo average
                              </div>
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669' }}>
                              {formatPrice(pricing.upfrontTotal)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Flat pricing display for non-stepped items */}
                    {!pricing.monthlyBreakdown && pricing.total > 0 && (
                      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#737373' }}>{pricing.label}</span>
                          <span style={{ fontSize: '20px', fontWeight: '800' }}>{formatPrice(pricing.total)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Total ── */}
          <div style={{
            borderTop: '3px solid #1a1a1a',
            padding: '28px 0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#737373', marginBottom: '4px' }}>
                Monthly Total
              </div>
              <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {formatPrice(totals.monthlyTotal)}
              </div>
            </div>
            {totals.savings > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#059669', marginBottom: '4px' }}>
                  Pay Upfront
                </div>
                <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1, color: '#059669' }}>
                  {formatPrice(totals.upfrontTotal)}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#059669', marginTop: '4px' }}>
                  Save {formatPrice(totals.savings)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer style={{
          borderTop: '1px solid #e0e0e0',
          padding: '40px 24px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '8px' }}>
              Range Medical
            </div>
            <div style={{ fontSize: '14px', color: '#737373', lineHeight: '1.8' }}>
              1901 Westcliff Drive, Suite 10, Newport Beach, CA<br />
              (949) 997-3988 · range-medical.com
            </div>
            <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '16px', lineHeight: '1.6' }}>
              This plan is personalized for you based on your consultation. Pricing and protocols may be adjusted
              by your provider. Please contact us with any questions.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
