// /pages/admin/patient/[id].js
// Patient Profile Page - Clean Protocol/Purchase Framework
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// ============================================
// PROTOCOL TEMPLATES
// ============================================
const PROTOCOL_TEMPLATES = {
  'peptide_jumpstart': {
    name: 'Peptide Recovery Jumpstart (10-Day)',
    program_type: 'jumpstart_10day',
    duration_days: 10,
    injection_location: 'take_home',
    dose_frequency: 'Daily',
    tracking: 'daily_injection',
    category: 'Peptide'
  },
  'peptide_month': {
    name: 'Peptide Month Program (30-Day)',
    program_type: 'month_30day',
    duration_days: 30,
    injection_location: 'take_home',
    dose_frequency: 'Daily',
    tracking: 'daily_injection',
    category: 'Peptide'
  },
  'peptide_maintenance': {
    name: 'Peptide Maintenance (4-Week)',
    program_type: 'recovery_10day',
    duration_days: 28,
    injection_location: 'take_home',
    dose_frequency: 'Daily',
    tracking: 'daily_injection',
    category: 'Peptide'
  },
  'peptide_injection': {
    name: 'Peptide Injection (In-Clinic)',
    program_type: 'injection_clinic',
    duration_days: 1,
    injection_location: 'in_clinic',
    dose_frequency: 'Single',
    tracking: 'single_visit',
    category: 'Peptide'
  },
  'weight_loss': {
    name: 'Weight Loss Program',
    program_type: 'weight_loss',
    duration_days: 28,
    injection_location: 'in_clinic',
    dose_frequency: 'Weekly',
    tracking: 'weekly_weigh_in',
    category: 'Weight Loss'
  },
  'hrt': {
    name: 'HRT Membership',
    program_type: 'hrt_membership',
    duration_days: null, // Ongoing
    injection_location: 'take_home',
    dose_frequency: 'As prescribed',
    tracking: 'quarterly_labs',
    category: 'HRT'
  },
  'hbot': {
    name: 'Hyperbaric Oxygen Therapy',
    program_type: 'hbot_sessions',
    duration_days: null,
    injection_location: 'in_clinic',
    dose_frequency: 'Per session',
    tracking: 'session_count',
    category: 'HBOT'
  },
  'red_light': {
    name: 'Red Light Therapy',
    program_type: 'red_light_sessions',
    duration_days: null,
    injection_location: 'in_clinic',
    dose_frequency: 'Per session',
    tracking: 'session_count',
    category: 'Red Light'
  },
  'iv_therapy': {
    name: 'IV Therapy',
    program_type: 'iv_therapy',
    duration_days: null,
    injection_location: 'in_clinic',
    dose_frequency: 'Per session',
    tracking: 'session_count',
    category: 'IV Therapy'
  }
};

// Map purchase categories to template keys
const CATEGORY_TO_TEMPLATE = {
  'Peptide': 'peptide_jumpstart',
  'Weight Loss': 'weight_loss',
  'HRT': 'hrt',
  'Hyperbaric': 'hbot',
  'Red Light': 'red_light',
  'IV Therapy': 'iv_therapy',
  'Injection': 'peptide_injection',
  'Labs': null // No protocol needed
};

// ============================================
// ALL CONSENTS CONFIGURATION
// ============================================
const ALL_CONSENTS = [
  { id: 'intake', name: 'Medical Intake Form', url: 'https://app.range-medical.com/intake.html', type: 'intake' },
  { id: 'peptide', name: 'Peptide Therapy Consent', url: 'https://range-medical.com/peptide-therapy-consent-page', type: 'consent' },
  { id: 'iv-injection', name: 'IV & Injection Consent', url: 'https://range-medical.com/iv--injection-therapy-consent-page', type: 'consent' },
  { id: 'blood_draw', name: 'Blood Draw Consent', url: 'https://range-medical.com/blood-draw-consent-page', type: 'consent' },
  { id: 'exosome-iv', name: 'Exosome IV Consent', url: 'https://range-medical.com/exosome-iv-therapy-consent-page', type: 'consent' },
  { id: 'hrt', name: 'HRT Consent', url: 'https://range-medical.com/hrt-consent-page', type: 'consent' },
  { id: 'hbot', name: 'Hyperbaric Oxygen Consent', url: 'https://range-medical.com/hyperbaric-oxygen-therapy-consent-page', type: 'consent' },
  { id: 'red-light', name: 'Red Light Therapy Consent', url: 'https://range-medical.com/red-light-therapy-consent-page', type: 'consent' },
  { id: 'weight-loss', name: 'Weight Loss Consent', url: 'https://range-medical.com/weight-loss-consent-page', type: 'consent' },
  { id: 'prp', name: 'PRP Consent', url: 'https://range-medical.com/prp-consent-page', type: 'consent' },
  { id: 'testosterone-pellet', name: 'Testosterone Pellet Consent', url: 'https://range-medical.com/testosterone-pellet-consent-page', type: 'consent' },
  { id: 'trt-fertility', name: 'TRT Fertility Waiver', url: 'https://range-medical.com/trt-fertility-waiver-page', type: 'consent' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ============================================
// TAB BUTTON COMPONENT
// ============================================
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 20px',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid black' : '2px solid transparent',
        color: active ? 'black' : '#666',
        fontWeight: active ? '500' : '400',
        fontSize: '14px',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}

// ============================================
// OVERVIEW TAB - Enhanced Dashboard
// ============================================
function OverviewTab({ patient, weightLogs }) {
  const activeProtocols = patient.protocols?.filter(p => p.status === 'active') || [];
  const completedProtocols = patient.protocols?.filter(p => p.status === 'completed') || [];
  const unassignedPurchases = patient.purchases?.filter(p => !p.protocol_id) || [];
  const totalSpent = patient.purchases?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

  // Check if patient has weight loss protocols
  const hasWeightLossProtocol = patient.protocols?.some(p => 
    p.program_type?.includes('weight_loss') || 
    p.program_name?.toLowerCase().includes('weight loss')
  );

  // Calculate progress for active protocols
  const getProgress = (protocol) => {
    const total = protocol.total_sessions || protocol.duration_days || 0;
    const completed = protocol.injections_completed || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Weight Loss Stats
  const logs = weightLogs?.logs || [];
  const stats = weightLogs?.stats || {};
  const startWeight = stats.startWeight || (logs[0]?.weight);
  const currentWeight = stats.currentWeight || (logs[logs.length - 1]?.weight);
  const totalLost = startWeight && currentWeight ? (startWeight - currentWeight) : 0;
  
  // Milestones
  const milestones = [
    { lbs: 5, emoji: '🌟' },
    { lbs: 10, emoji: '⭐' },
    { lbs: 15, emoji: '🔥' },
    { lbs: 20, emoji: '💪' },
    { lbs: 25, emoji: '🏆' },
    { lbs: 30, emoji: '👑' },
    { lbs: 40, emoji: '🚀' },
    { lbs: 50, emoji: '💎' }
  ];
  const achievedMilestones = milestones.filter(m => totalLost >= m.lbs);

  return (
    <div>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e5e5', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#000' }}>{patient.protocols?.length || 0}</div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Total Protocols</div>
        </div>
        <div style={{ background: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#16a34a' }}>{activeProtocols.length}</div>
          <div style={{ fontSize: '13px', color: '#166534', marginTop: '4px' }}>Active</div>
        </div>
        <div style={{ 
          background: unassignedPurchases.length > 0 ? '#fffbeb' : 'white', 
          borderRadius: '12px', 
          border: unassignedPurchases.length > 0 ? '2px solid #f59e0b' : '1px solid #e5e5e5', 
          padding: '20px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: unassignedPurchases.length > 0 ? '#f59e0b' : '#666' }}>
            {unassignedPurchases.length}
          </div>
          <div style={{ fontSize: '13px', color: unassignedPurchases.length > 0 ? '#92400e' : '#666', marginTop: '4px' }}>
            Needs Action
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e5e5', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#000' }}>{formatCurrency(totalSpent)}</div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Total Value</div>
        </div>
      </div>

      {/* Needs Action Alert */}
      {unassignedPurchases.length > 0 && (
        <div style={{ 
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '24px',
          border: '1px solid #f59e0b'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#92400e', fontSize: '16px', marginBottom: '4px' }}>
                ⚠️ {unassignedPurchases.length} Purchase{unassignedPurchases.length > 1 ? 's' : ''} Need{unassignedPurchases.length === 1 ? 's' : ''} Protocol Assignment
              </div>
              <div style={{ fontSize: '14px', color: '#92400e' }}>
                {unassignedPurchases.map(p => p.item_name).join(', ')}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#92400e' }}>
              Go to Purchases tab →
            </div>
          </div>
        </div>
      )}

      {/* Weight Loss Journey Dashboard */}
      {hasWeightLossProtocol && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
            ⚖️ Weight Loss Journey
          </h3>
          
          {logs.length === 0 ? (
            <div style={{ 
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', 
              borderRadius: '12px', 
              border: '1px solid #fed7aa',
              padding: '24px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚖️</div>
              <div style={{ fontWeight: '600', color: '#9a3412', marginBottom: '4px' }}>No Weight Logs Yet</div>
              <div style={{ fontSize: '13px', color: '#c2410c' }}>
                Patient hasn't logged any weigh-ins. They can track via their patient portal.
              </div>
            </div>
          ) : (
            <div style={{ 
              background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', 
              borderRadius: '16px', 
              padding: '24px',
              color: 'white'
            }}>
              {/* Main Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Start</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{startWeight}</div>
                  <div style={{ fontSize: '11px', opacity: 0.5 }}>lbs</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Current</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{currentWeight}</div>
                  <div style={{ fontSize: '11px', opacity: 0.5 }}>lbs</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Lost</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: totalLost > 0 ? '#4ade80' : '#fff' }}>
                    {totalLost > 0 ? '-' : ''}{Math.abs(totalLost).toFixed(1)}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.5 }}>lbs</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Weigh-ins</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{logs.length}</div>
                  <div style={{ fontSize: '11px', opacity: 0.5 }}>logged</div>
                </div>
              </div>

              {/* Weight Chart */}
              {logs.length >= 2 && (
                <div style={{ marginBottom: '20px' }}>
                  <svg width="100%" height="80" viewBox="0 0 300 80" style={{ overflow: 'visible' }}>
                    {(() => {
                      const weights = logs.map(l => parseFloat(l.weight));
                      const max = Math.max(...weights);
                      const min = Math.min(...weights);
                      const range = max - min || 1;
                      const points = weights.map((w, i) => {
                        const x = 10 + (i / (weights.length - 1)) * 280;
                        const y = 10 + ((max - w) / range) * 60;
                        return `${x},${y}`;
                      }).join(' ');
                      const areaPoints = `10,70 ${points} 290,70`;
                      return (
                        <>
                          <defs>
                            <linearGradient id="staffWeightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#ff9800" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#ff9800" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <polygon points={areaPoints} fill="url(#staffWeightGrad)" />
                          <polyline points={points} fill="none" stroke="#ff9800" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          {weights.map((w, i) => {
                            const x = 10 + (i / (weights.length - 1)) * 280;
                            const y = 10 + ((max - w) / range) * 60;
                            return <circle key={i} cx={x} cy={y} r="4" fill="#ff9800" />;
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}

              {/* Milestones */}
              {achievedMilestones.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {achievedMilestones.map((m, i) => (
                    <span key={i} style={{
                      background: 'rgba(255,255,255,0.15)',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px'
                    }}>
                      {m.emoji} {m.lbs} lbs
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Weigh-ins Table */}
          {logs.length > 0 && (
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              border: '1px solid #e5e5e5',
              marginTop: '16px',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e5e5', fontWeight: '600', fontSize: '13px' }}>
                Recent Weigh-ins
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', color: '#666' }}>Date</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', color: '#666' }}>Weight</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', color: '#666' }}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(-10).reverse().map((log, i, arr) => {
                    const prevLog = arr[i + 1];
                    const change = prevLog ? (parseFloat(log.weight) - parseFloat(prevLog.weight)).toFixed(1) : null;
                    return (
                      <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '10px 16px', fontSize: '13px' }}>
                          {new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>
                          {log.weight} lbs
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px' }}>
                          {change !== null && (
                            <span style={{
                              color: change < 0 ? '#16a34a' : change > 0 ? '#dc2626' : '#666',
                              fontWeight: '500'
                            }}>
                              {change > 0 ? '+' : ''}{change}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Active Protocols with Progress */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
          Active Protocols
        </h3>
        {activeProtocols.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e5e5', padding: '40px', textAlign: 'center', color: '#666' }}>
            No active protocols. Create one from the Purchases tab.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {activeProtocols.map(p => {
              const progress = getProgress(p);
              const daysLeft = getDaysRemaining(p.end_date);
              const isEnding = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
              const isExpired = daysLeft !== null && daysLeft <= 0;
              
              return (
                <div key={p.id} style={{ 
                  background: 'white', 
                  borderRadius: '12px', 
                  border: isExpired ? '2px solid #ef4444' : isEnding ? '2px solid #f59e0b' : '1px solid #e5e5e5', 
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  {/* Progress Circle */}
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    background: `conic-gradient(#000 ${progress * 3.6}deg, #f0f0f0 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '50%', 
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>
                      {progress}%
                    </div>
                  </div>
                  
                  {/* Protocol Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                      {p.program_name || p.program_type}
                    </div>
                    {p.primary_peptide && (
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                        {p.primary_peptide}{p.secondary_peptide ? ` + ${p.secondary_peptide}` : ''}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#888' }}>
                      <span>📅 Started: {formatDate(p.start_date)}</span>
                      {p.end_date && <span>🏁 Ends: {formatDate(p.end_date)}</span>}
                      {p.dose_frequency && <span>💉 {p.dose_frequency}</span>}
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div style={{ textAlign: 'right' }}>
                    {isExpired ? (
                      <span style={{ 
                        background: '#fef2f2', 
                        color: '#dc2626', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: '600' 
                      }}>
                        Expired
                      </span>
                    ) : isEnding ? (
                      <span style={{ 
                        background: '#fffbeb', 
                        color: '#f59e0b', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: '600' 
                      }}>
                        {daysLeft} days left
                      </span>
                    ) : daysLeft !== null ? (
                      <span style={{ 
                        background: '#f0fdf4', 
                        color: '#16a34a', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: '600' 
                      }}>
                        {daysLeft} days left
                      </span>
                    ) : (
                      <span style={{ 
                        background: '#f0f0f0', 
                        color: '#666', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: '600' 
                      }}>
                        Ongoing
                      </span>
                    )}
                    {p.access_token && (
                      <div style={{ marginTop: '8px' }}>
                        <a 
                          href={`/track/${p.access_token}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}
                        >
                          View Tracker →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Purchase-Protocol Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Purchases */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e5e5', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
            Recent Purchases
          </h3>
          {!patient.purchases?.length ? (
            <p style={{ color: '#666', fontSize: '14px' }}>No purchases</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {patient.purchases.slice(0, 6).map(p => (
                <div key={p.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px',
                  background: p.protocol_id ? '#f8f8f8' : '#fffbeb',
                  borderRadius: '8px',
                  borderLeft: p.protocol_id ? '3px solid #16a34a' : '3px solid #f59e0b'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px', color: '#333' }}>{p.item_name}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                      {formatDate(p.purchase_date)}
                      {p.quantity > 1 && ` • Qty: ${p.quantity}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{formatCurrency(p.amount)}</div>
                    <div style={{ 
                      fontSize: '10px', 
                      marginTop: '4px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: p.protocol_id ? '#dcfce7' : '#fef3c7',
                      color: p.protocol_id ? '#166534' : '#92400e',
                      fontWeight: '500'
                    }}>
                      {p.protocol_id ? '✓ Assigned' : 'Needs Protocol'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Protocols */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e5e5', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
            Completed Protocols
          </h3>
          {completedProtocols.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>No completed protocols yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {completedProtocols.slice(0, 5).map(p => (
                <div key={p.id} style={{ 
                  padding: '12px', 
                  background: '#f8f8f8', 
                  borderRadius: '8px',
                  borderLeft: '3px solid #16a34a'
                }}>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>{p.program_name || p.program_type}</div>
                  {p.primary_peptide && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{p.primary_peptide}</div>}
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    {formatDate(p.start_date)} - {formatDate(p.end_date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PURCHASES TAB - Main workflow hub
// ============================================
function PurchasesTab({ patient, onCreateProtocol, onRefresh }) {
  const purchases = patient.purchases || [];
  const unassigned = purchases.filter(p => !p.protocol_id);
  const assigned = purchases.filter(p => p.protocol_id);

  return (
    <div>
      {/* Unassigned Purchases */}
      {unassigned.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', color: '#92400e' }}>
            ⚠️ Unassigned Purchases ({unassigned.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {unassigned.map(purchase => (
              <div key={purchase.id} style={{
                background: '#fffbeb',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '15px' }}>
                    {purchase.item_name}
                    {purchase.quantity > 1 && <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: '600', color: '#000' }}>×{purchase.quantity}</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    {formatDate(purchase.purchase_date)} • {purchase.category} • {formatCurrency(purchase.amount)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onCreateProtocol(purchase)}
                    style={{
                      padding: '8px 16px',
                      background: '#000',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Create Protocol
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Purchases */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
          All Purchases ({purchases.length})
        </h3>
        {purchases.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
            No purchases found
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Item</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Qty</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Category</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Amount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{formatDate(p.purchase_date)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.item_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', fontWeight: p.quantity > 1 ? '600' : '400' }}>
                      {p.quantity || 1}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: '#f5f5f5',
                        color: '#333'
                      }}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: '500' }}>{formatCurrency(p.amount)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {p.protocol_id ? (
                        <span style={{ fontSize: '12px', color: '#16a34a' }}>✓ Assigned</span>
                      ) : (
                        <button
                          onClick={() => onCreateProtocol(p)}
                          style={{
                            padding: '4px 12px',
                            background: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Create Protocol
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PROTOCOLS TAB
// ============================================
function ProtocolsTab({ protocols = [], onEditProtocol, onViewNotes }) {
  const active = protocols.filter(p => p.status === 'active');
  const completed = protocols.filter(p => p.status === 'completed');
  const other = protocols.filter(p => !['active', 'completed'].includes(p.status));

  const ProtocolCard = ({ protocol }) => {
    const isActive = protocol.status === 'active';
    const today = new Date();
    const endDate = protocol.end_date ? new Date(protocol.end_date) : null;
    const daysLeft = endDate ? Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))) : null;
    const isInClinic = protocol.injection_location === 'in_clinic';

    return (
      <div style={{
        padding: '16px',
        background: 'white',
        borderRadius: '8px',
        border: isActive ? '2px solid black' : '1px solid #e5e5e5'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px' }}>{protocol.program_name || protocol.program_type}</div>
            {protocol.primary_peptide && (
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{protocol.primary_peptide}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {protocol.injection_location && (
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                textTransform: 'uppercase',
                background: isInClinic ? '#e0e7ff' : '#fef3c7',
                color: isInClinic ? '#3730a3' : '#92400e'
              }}>
                {isInClinic ? 'In-Clinic' : 'Take Home'}
              </span>
            )}
            <span style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              background: isActive ? '#000' : '#e5e5e5',
              color: isActive ? '#fff' : '#666'
            }}>
              {protocol.status}
            </span>
          </div>
        </div>

        {/* Stats */}
        {isActive && (
          <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
            {daysLeft !== null && (
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>{daysLeft}</div>
                <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Days Left</div>
              </div>
            )}
            {protocol.total_sessions ? (
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>
                  {protocol.injections_completed || 0}
                  <span style={{ fontSize: '14px', fontWeight: '400', color: '#666' }}> / {protocol.total_sessions}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Sessions</div>
              </div>
            ) : protocol.injections_completed !== undefined && protocol.injections_completed !== null ? (
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>{protocol.injections_completed || 0}</div>
                <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Logged</div>
              </div>
            ) : null}
          </div>
        )}

        {/* Dates */}
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
          {protocol.start_date && <span>Started: {formatDate(protocol.start_date)}</span>}
          {protocol.end_date && <span style={{ marginLeft: '16px' }}>Ends: {formatDate(protocol.end_date)}</span>}
          {!protocol.end_date && protocol.start_date && <span style={{ marginLeft: '16px' }}>Ongoing</span>}
        </div>

        {/* Dosing Info */}
        {(protocol.dose_amount || protocol.dose_frequency) && (
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            {protocol.dose_amount && <span>Dose: {protocol.dose_amount}</span>}
            {protocol.dose_frequency && <span style={{ marginLeft: '16px' }}>Frequency: {protocol.dose_frequency}</span>}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
          <button
            onClick={() => onEditProtocol(protocol)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Edit
          </button>
          <button
            onClick={() => onViewNotes(protocol)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#f5f5f5',
              color: '#333',
              border: '1px solid #e5e5e5',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Notes {protocol.notes ? '•' : ''}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {active.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
            Active ({active.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {active.map(p => <ProtocolCard key={p.id} protocol={p} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', color: '#666' }}>
            Completed ({completed.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {completed.map(p => <ProtocolCard key={p.id} protocol={p} />)}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', color: '#666' }}>
            Other ({other.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {other.map(p => <ProtocolCard key={p.id} protocol={p} />)}
          </div>
        </div>
      )}

      {protocols.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
          No protocols found. Create one from the Purchases tab.
        </div>
      )}
    </div>
  );
}

// ============================================
// CONSENT CENTER
// ============================================
function ConsentCenter({ patient }) {
  const [sendingId, setSendingId] = useState(null);
  const [sentIds, setSentIds] = useState(new Set());
  const [error, setError] = useState(null);

  const completedConsents = patient.consents || [];
  const completedIntakes = patient.intakes || [];

  const getCompletedRecord = (consentId) => {
    if (consentId === 'intake') {
      return completedIntakes.length > 0 ? completedIntakes[0] : null;
    }
    return completedConsents.find(c => c.consent_type === consentId);
  };

  const sendConsent = async (consent) => {
    if (!patient.ghl_contact_id) {
      setError('No GHL contact ID - cannot send SMS');
      return;
    }

    setSendingId(consent.id);
    setError(null);

    try {
      const response = await fetch('/api/admin/send-form-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghlContactId: patient.ghl_contact_id,
          patientName: patient.name?.split(' ')[0] || 'there',
          formType: consent.name,
          formUrl: consent.url
        })
      });

      if (!response.ok) throw new Error('Failed to send');
      setSentIds(prev => new Set([...prev, consent.id]));
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingId(null);
    }
  };

  const completedCount = ALL_CONSENTS.filter(c => getCompletedRecord(c.id)).length;

  return (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Consent Center</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>{completedCount} of {ALL_CONSENTS.length} completed</p>
        </div>
        <div style={{
          background: completedCount === ALL_CONSENTS.length ? '#000' : '#f5f5f5',
          color: completedCount === ALL_CONSENTS.length ? '#fff' : '#666',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {completedCount === ALL_CONSENTS.length ? '✓ All Complete' : `${ALL_CONSENTS.length - completedCount} pending`}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 20px', background: '#fef2f2', color: '#991b1b', fontSize: '13px', borderBottom: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {ALL_CONSENTS.map((consent, index) => {
          const completed = getCompletedRecord(consent.id);
          const isSending = sendingId === consent.id;
          const wasSent = sentIds.has(consent.id);

          return (
            <div key={consent.id} style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: index < ALL_CONSENTS.length - 1 ? '1px solid #f0f0f0' : 'none',
              background: completed ? '#fafafa' : 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: completed ? '#000' : '#fff',
                  border: completed ? 'none' : '2px solid #e5e5e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {completed ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e5e5e5' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: completed ? '#666' : '#000' }}>{consent.name}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                    {completed ? `Completed ${formatDate(completed.submitted_at)}` : 'Not completed'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {completed && completed.pdf_url && (
                  <a href={completed.pdf_url} target="_blank" rel="noopener noreferrer" style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#000',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    textDecoration: 'none'
                  }}>
                    View PDF
                  </a>
                )}
                <button
                  onClick={() => sendConsent(consent)}
                  disabled={isSending || !patient.ghl_contact_id}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: wasSent ? '#16a34a' : (completed ? '#666' : '#fff'),
                    background: wasSent ? '#f0fdf4' : (completed ? '#fff' : '#000'),
                    border: wasSent ? '1px solid #bbf7d0' : (completed ? '1px solid #e5e5e5' : 'none'),
                    borderRadius: '4px',
                    cursor: isSending || !patient.ghl_contact_id ? 'not-allowed' : 'pointer',
                    opacity: isSending ? 0.6 : 1
                  }}
                >
                  {isSending ? 'Sending...' : wasSent ? '✓ Sent' : 'Send'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// INTAKE TAB
// ============================================
function IntakeTab({ intakes = [] }) {
  if (intakes.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
        No medical intake form on file
      </div>
    );
  }

  const intake = intakes[0];

  const getMedicalConditions = () => {
    if (!intake.medical_conditions) return 'None reported';
    if (typeof intake.medical_conditions === 'string') return intake.medical_conditions;
    if (typeof intake.medical_conditions === 'object') {
      const conditions = Object.entries(intake.medical_conditions)
        .filter(([key, val]) => val?.response === 'Yes')
        .map(([key, val]) => val?.label || key);
      return conditions.length > 0 ? conditions.join(', ') : 'None reported';
    }
    return 'None reported';
  };

  return (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Medical Intake Form</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Submitted {formatDate(intake.submitted_at)}</p>
        </div>
        {intake.pdf_url && (
          <a href={intake.pdf_url} target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 16px',
            background: '#000',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '500',
            textDecoration: 'none'
          }}>
            View Full PDF
          </a>
        )}
      </div>

      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Basic Info</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <div><span style={{ color: '#666' }}>Name:</span> {intake.first_name} {intake.last_name}</div>
            <div><span style={{ color: '#666' }}>DOB:</span> {intake.date_of_birth || '-'}</div>
            <div><span style={{ color: '#666' }}>Gender:</span> {intake.gender || '-'}</div>
            <div><span style={{ color: '#666' }}>Phone:</span> {intake.phone || '-'}</div>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Address</h4>
          <div style={{ fontSize: '14px' }}>
            {intake.street_address && <div>{intake.street_address}</div>}
            {(intake.city || intake.state) && <div>{[intake.city, intake.state, intake.postal_code].filter(Boolean).join(', ')}</div>}
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Medical Conditions</h4>
          <div style={{ fontSize: '14px' }}>{getMedicalConditions()}</div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Current Medications</h4>
          <div style={{ fontSize: '14px' }}>{intake.current_medications || 'None reported'}</div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Allergies</h4>
          <div style={{ fontSize: '14px' }}>{intake.allergies || 'No known allergies'}</div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Reason for Visit</h4>
          <div style={{ fontSize: '14px' }}>{intake.what_brings_you_in || intake.what_brings_you || '-'}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CREATE PROTOCOL MODAL
// ============================================
function CreateProtocolModal({ purchase, patient, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Determine template based on purchase category
  const templateKey = CATEGORY_TO_TEMPLATE[purchase?.category] || 'peptide_jumpstart';
  const template = PROTOCOL_TEMPLATES[templateKey] || PROTOCOL_TEMPLATES['peptide_jumpstart'];

  const [formData, setFormData] = useState({
    template: templateKey,
    program_name: template.name,
    program_type: template.program_type,
    injection_location: template.injection_location,
    duration_days: template.duration_days || 10,
    total_sessions: purchase?.quantity > 1 ? purchase.quantity : null,
    primary_peptide: '',
    secondary_peptide: '',
    dose_amount: '',
    dose_frequency: template.dose_frequency,
    start_date: new Date().toISOString().split('T')[0],
    special_instructions: '',
    reminders_enabled: template.injection_location === 'take_home'
  });

  // Update form when template changes
  const handleTemplateChange = (newTemplateKey) => {
    const newTemplate = PROTOCOL_TEMPLATES[newTemplateKey];
    if (newTemplate) {
      setFormData(prev => ({
        ...prev,
        template: newTemplateKey,
        program_name: newTemplate.name,
        program_type: newTemplate.program_type,
        injection_location: newTemplate.injection_location,
        duration_days: newTemplate.duration_days || prev.duration_days,
        dose_frequency: newTemplate.dose_frequency,
        reminders_enabled: newTemplate.injection_location === 'take_home'
      }));
    }
  };

  const calculateEndDate = () => {
    if (!formData.start_date || !formData.duration_days) return null;
    const start = new Date(formData.start_date);
    start.setDate(start.getDate() + parseInt(formData.duration_days));
    return start.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          ghl_contact_id: patient.ghl_contact_id,
          patient_name: patient.name,
          patient_email: patient.email,
          patient_phone: patient.phone,
          purchase_id: purchase.id,
          program_name: formData.program_name,
          program_type: formData.program_type,
          injection_location: formData.injection_location,
          duration_days: formData.duration_days,
          total_sessions: formData.total_sessions,
          primary_peptide: formData.primary_peptide,
          secondary_peptide: formData.secondary_peptide,
          dose_amount: formData.dose_amount,
          dose_frequency: formData.dose_frequency,
          start_date: formData.start_date,
          end_date: calculateEndDate(),
          special_instructions: formData.special_instructions,
          reminders_enabled: formData.reminders_enabled,
          status: 'active',
          amount: purchase.amount
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create protocol');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!purchase) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        margin: '20px'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e5e5' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Create Protocol</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
            From: {purchase.item_name}{purchase.quantity > 1 && ` ×${purchase.quantity}`} ({formatCurrency(purchase.amount)})
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ padding: '12px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Template Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Protocol Type</label>
            <select
              value={formData.template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px' }}
            >
              <optgroup label="Peptide">
                <option value="peptide_jumpstart">Peptide Recovery Jumpstart (10-Day)</option>
                <option value="peptide_month">Peptide Month Program (30-Day)</option>
                <option value="peptide_maintenance">Peptide Maintenance (4-Week)</option>
                <option value="peptide_injection">Peptide Injection (In-Clinic)</option>
              </optgroup>
              <optgroup label="Other Services">
                <option value="weight_loss">Weight Loss Program</option>
                <option value="hrt">HRT Membership</option>
                <option value="hbot">Hyperbaric Oxygen Therapy</option>
                <option value="red_light">Red Light Therapy</option>
                <option value="iv_therapy">IV Therapy</option>
              </optgroup>
            </select>
          </div>

          {/* Injection Location */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Location</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, injection_location: 'take_home', reminders_enabled: true })}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: formData.injection_location === 'take_home' ? '2px solid black' : '1px solid #e5e5e5',
                  borderRadius: '8px',
                  background: formData.injection_location === 'take_home' ? '#fef3c7' : 'white',
                  fontWeight: formData.injection_location === 'take_home' ? '600' : '400',
                  cursor: 'pointer'
                }}
              >
                🏠 Take Home
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, injection_location: 'in_clinic', reminders_enabled: false })}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: formData.injection_location === 'in_clinic' ? '2px solid black' : '1px solid #e5e5e5',
                  borderRadius: '8px',
                  background: formData.injection_location === 'in_clinic' ? '#e0e7ff' : 'white',
                  fontWeight: formData.injection_location === 'in_clinic' ? '600' : '400',
                  cursor: 'pointer'
                }}
              >
                🏥 In-Clinic
              </button>
            </div>
          </div>

          {/* Peptide Names (for peptide protocols) */}
          {formData.template.startsWith('peptide') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Primary Peptide</label>
                <input
                  type="text"
                  value={formData.primary_peptide}
                  onChange={(e) => setFormData({ ...formData, primary_peptide: e.target.value })}
                  placeholder="e.g., BPC-157"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Secondary Peptide</label>
                <input
                  type="text"
                  value={formData.secondary_peptide}
                  onChange={(e) => setFormData({ ...formData, secondary_peptide: e.target.value })}
                  placeholder="e.g., TB-500"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Dosing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Dose Amount</label>
              <input
                type="text"
                value={formData.dose_amount}
                onChange={(e) => setFormData({ ...formData, dose_amount: e.target.value })}
                placeholder="e.g., 500mcg"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Frequency</label>
              <input
                type="text"
                value={formData.dose_frequency}
                onChange={(e) => setFormData({ ...formData, dose_frequency: e.target.value })}
                placeholder="e.g., Daily"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Duration (days)</label>
              <input
                type="number"
                value={formData.duration_days || ''}
                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || null })}
                placeholder="Ongoing"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>End Date</label>
              <input
                type="date"
                value={calculateEndDate() || ''}
                disabled
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', background: '#f9f9f9' }}
              />
            </div>
          </div>

          {/* Total Sessions - for session-based protocols */}
          {['peptide_injection', 'hbot', 'red_light', 'iv_therapy'].includes(formData.template) || purchase?.quantity > 1 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Total Sessions
                  {purchase?.quantity > 1 && <span style={{ fontWeight: '400', color: '#666' }}> (from purchase qty)</span>}
                </label>
                <input
                  type="number"
                  value={formData.total_sessions || ''}
                  onChange={(e) => setFormData({ ...formData, total_sessions: parseInt(e.target.value) || null })}
                  placeholder="e.g., 10"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>
                  Track completion as sessions (e.g., 5 of {formData.total_sessions || '?'} completed)
                </span>
              </div>
            </div>
          ) : null}

          {/* Special Instructions */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Special Instructions</label>
            <textarea
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              placeholder="Any special instructions..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* Reminders Toggle */}
          {formData.injection_location === 'take_home' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f9f9f9', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Daily Reminders</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Send 6:30pm text if no injection logged</div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, reminders_enabled: !formData.reminders_enabled })}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: formData.reminders_enabled ? '#000' : '#e5e5e5',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: formData.reminders_enabled ? '25px' : '3px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid #e5e5e5', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', border: '1px solid #e5e5e5', borderRadius: '6px', background: 'white', fontSize: '14px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '6px',
              background: '#000',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Creating...' : 'Create Protocol'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EDIT PROTOCOL MODAL
// ============================================
// Medications/Peptides list for dropdowns
const MEDICATIONS = [
  // Peptides - Recovery
  { value: 'BPC-157', label: 'BPC-157', category: 'Peptide' },
  { value: 'TB-500', label: 'TB-500', category: 'Peptide' },
  { value: 'BPC-157 / TB-500', label: 'BPC-157 / TB-500 (Combo)', category: 'Peptide' },
  { value: 'KPV', label: 'KPV', category: 'Peptide' },
  { value: 'Thymosin Alpha-1', label: 'Thymosin Alpha-1', category: 'Peptide' },
  // Peptides - Growth Hormone
  { value: 'CJC-1295 / Ipamorelin', label: 'CJC-1295 / Ipamorelin', category: 'Peptide' },
  { value: 'Sermorelin', label: 'Sermorelin', category: 'Peptide' },
  { value: 'Tesamorelin', label: 'Tesamorelin', category: 'Peptide' },
  { value: 'MK-677', label: 'MK-677', category: 'Peptide' },
  // Peptides - Other
  { value: 'PT-141', label: 'PT-141', category: 'Peptide' },
  { value: 'Melanotan II', label: 'Melanotan II', category: 'Peptide' },
  { value: 'DSIP', label: 'DSIP', category: 'Peptide' },
  { value: 'Epithalon', label: 'Epithalon', category: 'Peptide' },
  { value: 'Selank', label: 'Selank', category: 'Peptide' },
  { value: 'Semax', label: 'Semax', category: 'Peptide' },
  { value: 'GHK-Cu', label: 'GHK-Cu', category: 'Peptide' },
  // Weight Loss
  { value: 'Semaglutide', label: 'Semaglutide', category: 'Weight Loss' },
  { value: 'Tirzepatide', label: 'Tirzepatide', category: 'Weight Loss' },
  { value: 'Liraglutide', label: 'Liraglutide', category: 'Weight Loss' },
  // HRT / Testosterone
  { value: 'Testosterone Cypionate', label: 'Testosterone Cypionate', category: 'HRT' },
  { value: 'Testosterone Enanthate', label: 'Testosterone Enanthate', category: 'HRT' },
  { value: 'HCG', label: 'HCG', category: 'HRT' },
  { value: 'Anastrozole', label: 'Anastrozole', category: 'HRT' },
  { value: 'Clomiphene', label: 'Clomiphene', category: 'HRT' },
  { value: 'DHEA', label: 'DHEA', category: 'HRT' },
  { value: 'Pregnenolone', label: 'Pregnenolone', category: 'HRT' },
  // NAD+
  { value: 'NAD+ Injection', label: 'NAD+ Injection', category: 'NAD+' },
  { value: 'NAD+ IV', label: 'NAD+ IV', category: 'NAD+' },
  // Vitamins / Nutrients
  { value: 'B12 Injection', label: 'B12 Injection', category: 'Vitamin' },
  { value: 'Vitamin D Injection', label: 'Vitamin D Injection', category: 'Vitamin' },
  { value: 'Glutathione', label: 'Glutathione', category: 'Vitamin' },
  { value: 'MIC B12 (Lipo)', label: 'MIC B12 (Lipo)', category: 'Vitamin' },
  { value: 'Biotin Injection', label: 'Biotin Injection', category: 'Vitamin' },
  // IV Therapy
  { value: 'Myers Cocktail', label: 'Myers Cocktail', category: 'IV Therapy' },
  { value: 'Immune Boost IV', label: 'Immune Boost IV', category: 'IV Therapy' },
  { value: 'Hydration IV', label: 'Hydration IV', category: 'IV Therapy' },
  { value: 'Recovery IV', label: 'Recovery IV', category: 'IV Therapy' },
  { value: 'NAD+ IV Drip', label: 'NAD+ IV Drip', category: 'IV Therapy' },
  // Other
  { value: 'Other', label: 'Other (specify in notes)', category: 'Other' }
];

// Group medications by category
const MEDICATIONS_BY_CATEGORY = MEDICATIONS.reduce((acc, med) => {
  if (!acc[med.category]) acc[med.category] = [];
  acc[med.category].push(med);
  return acc;
}, {});

function EditProtocolModal({ protocol, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    injection_location: protocol?.injection_location || 'take_home',
    status: protocol?.status || 'active',
    primary_peptide: protocol?.primary_peptide || '',
    secondary_peptide: protocol?.secondary_peptide || '',
    dose_amount: protocol?.dose_amount || '',
    dose_frequency: protocol?.dose_frequency || '',
    start_date: protocol?.start_date?.split('T')[0] || '',
    end_date: protocol?.end_date?.split('T')[0] || '',
    special_instructions: protocol?.special_instructions || '',
    reminders_enabled: protocol?.reminders_enabled !== false
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/protocol/${protocol.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert('Failed to save');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Check if current value exists in dropdown, if not show text input
  const isPrimaryInList = MEDICATIONS.some(m => m.value === formData.primary_peptide) || !formData.primary_peptide;
  const isSecondaryInList = MEDICATIONS.some(m => m.value === formData.secondary_peptide) || !formData.secondary_peptide;

  if (!protocol) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        margin: '20px'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e5e5' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Edit Protocol</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>{protocol.program_name}</p>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Location */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Location</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, injection_location: 'take_home' })}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: formData.injection_location === 'take_home' ? '2px solid black' : '1px solid #e5e5e5',
                  borderRadius: '8px',
                  background: formData.injection_location === 'take_home' ? '#fef3c7' : 'white',
                  cursor: 'pointer'
                }}
              >
                🏠 Take Home
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, injection_location: 'in_clinic' })}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: formData.injection_location === 'in_clinic' ? '2px solid black' : '1px solid #e5e5e5',
                  borderRadius: '8px',
                  background: formData.injection_location === 'in_clinic' ? '#e0e7ff' : 'white',
                  cursor: 'pointer'
                }}
              >
                🏥 In-Clinic
              </button>
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px' }}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Medications */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Primary Medication</label>
              {isPrimaryInList ? (
                <select
                  value={formData.primary_peptide}
                  onChange={(e) => setFormData({ ...formData, primary_peptide: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                >
                  <option value="">-- Select --</option>
                  {Object.entries(MEDICATIONS_BY_CATEGORY).map(([category, meds]) => (
                    <optgroup key={category} label={category}>
                      {meds.map(med => (
                        <option key={med.value} value={med.value}>{med.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.primary_peptide}
                  onChange={(e) => setFormData({ ...formData, primary_peptide: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Secondary</label>
              {isSecondaryInList ? (
                <select
                  value={formData.secondary_peptide}
                  onChange={(e) => setFormData({ ...formData, secondary_peptide: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                >
                  <option value="">-- None --</option>
                  {Object.entries(MEDICATIONS_BY_CATEGORY).map(([category, meds]) => (
                    <optgroup key={category} label={category}>
                      {meds.map(med => (
                        <option key={med.value} value={med.value}>{med.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.secondary_peptide}
                  onChange={(e) => setFormData({ ...formData, secondary_peptide: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              )}
            </div>
          </div>

          {/* Dosing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Dose</label>
              <input
                type="text"
                value={formData.dose_amount}
                onChange={(e) => setFormData({ ...formData, dose_amount: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Frequency</label>
              <select
                value={formData.dose_frequency}
                onChange={(e) => setFormData({ ...formData, dose_frequency: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', background: 'white' }}
              >
                <option value="">-- Select --</option>
                <option value="2x_daily">2x Daily (AM & PM)</option>
                <option value="daily">Daily</option>
                <option value="5_on_2_off">5 Days On / 2 Days Off</option>
                <option value="every_other_day">Every Other Day</option>
                <option value="3x_weekly">3x Weekly (Mon, Wed, Fri)</option>
                <option value="2x_weekly">2x Weekly (Mon & Thu)</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Special Instructions</label>
            <textarea
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* Reminders */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f9f9f9', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Daily Reminders</div>
              <div style={{ fontSize: '12px', color: '#666' }}>6:30pm text if no injection logged</div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, reminders_enabled: !formData.reminders_enabled })}
              style={{
                width: '50px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                background: formData.reminders_enabled ? '#000' : '#e5e5e5',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '3px',
                left: formData.reminders_enabled ? '25px' : '3px',
                transition: 'left 0.2s'
              }} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid #e5e5e5', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #e5e5e5', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '10px 24px', border: 'none', borderRadius: '6px', background: '#000', color: '#fff', fontWeight: '500', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// NOTES MODAL
// ============================================
function NotesModal({ protocol, onClose, onSuccess }) {
  const [notes, setNotes] = useState(protocol?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/protocol/${protocol.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      alert('Error saving notes');
    } finally {
      setSaving(false);
    }
  };

  if (!protocol) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        margin: '20px'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e5e5' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Protocol Notes</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>{protocol.program_name}</p>
        </div>

        <div style={{ padding: '20px' }}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this protocol..."
            rows={8}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e5e5e5',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid #e5e5e5', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #e5e5e5', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '10px 24px', border: 'none', borderRadius: '6px', background: '#000', color: '#fff', fontWeight: '500', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function PatientProfilePage() {
  const router = useRouter();
  const { id } = router.query;

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [weightLogs, setWeightLogs] = useState({ logs: [], stats: {} });

  // Modal states
  const [createProtocolPurchase, setCreateProtocolPurchase] = useState(null);
  const [editingProtocol, setEditingProtocol] = useState(null);
  const [notesProtocol, setNotesProtocol] = useState(null);

  useEffect(() => {
    if (id) fetchPatient();
  }, [id]);

  // Fetch weight logs when patient has weight loss protocols
  useEffect(() => {
    if (patient?.protocols) {
      const weightLossProtocol = patient.protocols.find(p => 
        p.program_type?.includes('weight_loss') || 
        p.program_name?.toLowerCase().includes('weight loss')
      );
      if (weightLossProtocol?.access_token) {
        fetchWeightLogs(weightLossProtocol.access_token);
      }
    }
  }, [patient]);

  const fetchWeightLogs = async (token) => {
    try {
      const res = await fetch(`/api/patient/weight?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setWeightLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch weight logs:', err);
    }
  };

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/patient/${id}`);
      if (!res.ok) throw new Error('Patient not found');
      const data = await res.json();
      setPatient(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProtocolCreated = () => {
    setCreateProtocolPurchase(null);
    fetchPatient();
  };

  const handleProtocolUpdated = () => {
    setEditingProtocol(null);
    setNotesProtocol(null);
    fetchPatient();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#991b1b', marginBottom: '16px' }}>{error || 'Patient not found'}</div>
          <Link href="/admin/patients" style={{ color: '#000' }}>← Back to Patients</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{patient.name} - Range Medical</title>
      </Head>

      {/* Modals */}
      {createProtocolPurchase && (
        <CreateProtocolModal
          purchase={createProtocolPurchase}
          patient={patient}
          onClose={() => setCreateProtocolPurchase(null)}
          onSuccess={handleProtocolCreated}
        />
      )}
      {editingProtocol && (
        <EditProtocolModal
          protocol={editingProtocol}
          onClose={() => setEditingProtocol(null)}
          onSuccess={handleProtocolUpdated}
        />
      )}
      {notesProtocol && (
        <NotesModal
          protocol={notesProtocol}
          onClose={() => setNotesProtocol(null)}
          onSuccess={handleProtocolUpdated}
        />
      )}

      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        {/* Header */}
        <header style={{ background: 'white', borderBottom: '1px solid #e5e5e5', padding: '16px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/admin/patients" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
              ← Back to Patients
            </Link>
            <div style={{ display: 'flex', gap: '12px' }}>
              {patient.ghl_contact_id && (
                <a
                  href={`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${patient.ghl_contact_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '8px 16px', background: '#000', color: '#fff', borderRadius: '4px', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}
                >
                  Open in GHL
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Patient Info */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e5e5', padding: '24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '600' }}>{patient.name}</h1>
            <div style={{ display: 'flex', gap: '24px', color: '#666', fontSize: '14px' }}>
              {patient.email && <span>📧 {patient.email}</span>}
              {patient.phone && <span>📱 {patient.phone}</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex' }}>
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
            <TabButton active={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')}>
              Purchases {patient.purchases?.filter(p => !p.protocol_id).length > 0 && `(${patient.purchases.filter(p => !p.protocol_id).length} new)`}
            </TabButton>
            <TabButton active={activeTab === 'protocols'} onClick={() => setActiveTab('protocols')}>
              Protocols {patient.protocols?.length > 0 && `(${patient.protocols.length})`}
            </TabButton>
            <TabButton active={activeTab === 'consents'} onClick={() => setActiveTab('consents')}>
              Consents {patient.consents?.length > 0 && `(${patient.consents.length})`}
            </TabButton>
            <TabButton active={activeTab === 'intake'} onClick={() => setActiveTab('intake')}>
              Medical Intake {patient.intakes?.length > 0 && '✓'}
            </TabButton>
          </div>
        </div>

        {/* Content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          {activeTab === 'overview' && <OverviewTab patient={patient} weightLogs={weightLogs} />}
          {activeTab === 'purchases' && (
            <PurchasesTab
              patient={patient}
              onCreateProtocol={(purchase) => setCreateProtocolPurchase(purchase)}
              onRefresh={fetchPatient}
            />
          )}
          {activeTab === 'protocols' && (
            <ProtocolsTab
              protocols={patient.protocols}
              onEditProtocol={(p) => setEditingProtocol(p)}
              onViewNotes={(p) => setNotesProtocol(p)}
            />
          )}
          {activeTab === 'consents' && <ConsentCenter patient={patient} />}
          {activeTab === 'intake' && <IntakeTab intakes={patient.intakes} />}
        </main>
      </div>
    </>
  );
}
