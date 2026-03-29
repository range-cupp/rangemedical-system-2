import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#FAFAF9',
  white: '#FFFFFF',
  black: '#1A1A1A',
  bronze: '#8B7355',
  bronzeLight: '#B8A088',
  green: '#2D6A4F',
  greenLight: '#D4EDDA',
  red: '#C1121F',
  redLight: '#F8D7DA',
  text: '#1A1A1A',
  body: '#4A4A4A',
  caption: '#8A8A8A',
  border: '#E8E4DF',
  divider: '#E8E4DF',
  cardShadow: '0 1px 3px rgba(0,0,0,0.04)',
  heroGrad: 'linear-gradient(160deg, #1A1A1A 0%, #2C2C2C 100%)',
};

// ─── Shared style helpers ────────────────────────────────────────────────────
const label = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: C.caption,
  margin: 0,
};

const heading = (size = 20) => ({
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: size,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: C.text,
  margin: 0,
  lineHeight: 1.2,
});

const bodyText = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 16,
  lineHeight: 1.6,
  color: C.body,
  margin: 0,
};

const card = {
  background: C.white,
  border: `1px solid ${C.border}`,
  boxShadow: C.cardShadow,
  borderRadius: 0,
  padding: 24,
  marginBottom: 16,
};

const transition = 'all 0.2s ease';

// ─── Side effect options ─────────────────────────────────────────────────────
const SIDE_EFFECTS = [
  'None', 'Nausea', 'Fatigue', 'Constipation', 'Indigestion',
  'Injection Site Pain', 'Headache', 'Diarrhea',
];

// ─── Guide content ───────────────────────────────────────────────────────────
const GUIDE_SECTIONS = [
  {
    key: 'how',
    title: 'How Your Medication Works',
    icon: '\u2696\uFE0F',
    content: 'mechanism',
  },
  {
    key: 'nutrition',
    title: 'Nutrition Essentials',
    icon: '\uD83E\uDD57',
    content: 'nutrition',
  },
  {
    key: 'sideeffects',
    title: 'Managing Side Effects',
    icon: '\uD83D\uDEE1\uFE0F',
    content: 'sideeffects',
  },
  {
    key: 'exercise',
    title: 'Exercise & Movement',
    icon: '\uD83C\uDFCB\uFE0F',
    content: 'exercise',
  },
  {
    key: 'supplements',
    title: 'Supplements',
    icon: '\uD83D\uDC8A',
    content: 'supplements',
  },
];

// ─── Skeleton shimmer keyframes (injected once) ──────────────────────────────
function injectKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('range-wl-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'range-wl-keyframes';
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes checkPop {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes confettiFade {
      0% { opacity: 1; transform: translateY(0) scale(1); }
      100% { opacity: 0; transform: translateY(-20px) scale(0.5); }
    }
  `;
  document.head.appendChild(style);
}

// ─── Skeleton block ──────────────────────────────────────────────────────────
function Skeleton({ width = '100%', height = 20, style: extra }) {
  return (
    <div style={{
      width, height, borderRadius: 0,
      background: 'linear-gradient(90deg, #EEECEB 25%, #F5F3F2 50%, #EEECEB 75%)',
      backgroundSize: '800px 100%',
      animation: 'shimmer 1.5s infinite linear',
      ...extra,
    }} />
  );
}

// ─── Custom tooltip for chart ────────────────────────────────────────────────
function ChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: C.black, color: C.white, padding: '8px 14px',
      borderRadius: 0, fontSize: 13, fontFamily: 'system-ui',
    }}>
      <div style={{ fontWeight: 700 }}>{d.weight} lbs</div>
      <div style={{ color: C.bronzeLight, fontSize: 11, marginTop: 2 }}>{d.label}</div>
      {d.dose && <div style={{ color: C.caption, fontSize: 11, marginTop: 2 }}>{d.dose}</div>}
    </div>
  );
}

// ─── Format date helper ──────────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Get today in Pacific ────────────────────────────────────────────────────
function todayPacific() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function WeightLossPortal() {
  const router = useRouter();
  const { token } = router.query;
  const weightRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkInWeight, setCheckInWeight] = useState('');
  const [checkInSideEffects, setCheckInSideEffects] = useState([]);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [showNotes, setShowNotes] = useState(false);
  const [savingDay, setSavingDay] = useState(false);
  const [changeDay, setChangeDay] = useState(false);

  useEffect(() => { injectKeyframes(); }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/wl/${token}`);
      if (!res.ok) {
        if (res.status === 404) setError('notfound');
        else setError('error');
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);

      // Auto-expand guide if first visit (no logs)
      if (!json.logs || json.logs.length === 0) {
        const all = {};
        GUIDE_SECTIONS.forEach(s => { all[s.key] = true; });
        setExpandedSections(all);
      }
    } catch {
      setError('error');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-focus weight input once loaded
  useEffect(() => {
    if (!loading && data && weightRef.current) {
      const today = todayPacific();
      const alreadyCheckedIn = data.logs?.some(l => l.date === today);
      if (!alreadyCheckedIn) {
        setTimeout(() => weightRef.current?.focus(), 400);
      }
    }
  }, [loading, data]);

  // ─── Check-in submit ────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!checkInWeight || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/wl/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: parseFloat(checkInWeight),
          side_effects: checkInSideEffects,
          notes: checkInNotes,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        // Refetch to update chart
        setTimeout(() => fetchData(), 800);
      }
    } catch {
      // silent
    }
    setSubmitting(false);
  }

  // ─── Save injection day ─────────────────────────────────────────────────
  async function saveInjectionDay(day) {
    setSavingDay(true);
    try {
      const res = await fetch(`/api/wl/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ injection_day: day }),
      });
      if (res.ok) {
        setData(prev => ({
          ...prev,
          protocol: { ...prev.protocol, injectionDay: day }
        }));
        setChangeDay(false);
      }
    } catch {
      // silent
    }
    setSavingDay(false);
  }

  // ─── Side effect toggle ─────────────────────────────────────────────────
  function toggleSideEffect(effect) {
    setCheckInSideEffects(prev => {
      if (effect === 'None') return prev.includes('None') ? [] : ['None'];
      const without = prev.filter(e => e !== 'None');
      if (without.includes(effect)) return without.filter(e => e !== effect);
      return [...without, effect];
    });
  }

  // ─── Accordion toggle ──────────────────────────────────────────────────
  function toggleSection(key) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // ─── Error / Not Found ─────────────────────────────────────────────────
  if (error) {
    return (
      <>
        <Head><title>Range Medical</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...label, marginBottom: 12 }}>RANGE MEDICAL</p>
            <h1 style={{ ...heading(24), marginBottom: 8 }}>
              {error === 'notfound' ? 'Link Not Found' : 'Something went wrong'}
            </h1>
            <p style={{ ...bodyText, color: C.caption }}>
              {error === 'notfound'
                ? 'This link may have expired. Please contact us for a new one.'
                : 'Please try again or contact us.'}
            </p>
            <p style={{ ...bodyText, color: C.bronze, marginTop: 24, fontSize: 14 }}>
              (949) 997-3988
            </p>
          </div>
        </div>
      </>
    );
  }

  // ─── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Head><title>Range Medical \u2014 Weight Loss</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg }}>
          <div style={{ background: C.black, padding: '32px 24px 28px' }}>
            <Skeleton width={120} height={10} style={{ opacity: 0.3, marginBottom: 16 }} />
            <Skeleton width={200} height={28} style={{ opacity: 0.3, marginBottom: 8 }} />
            <Skeleton width={260} height={16} style={{ opacity: 0.3 }} />
          </div>
          <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 24px' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ flex: 1, ...card, padding: 16 }}>
                  <Skeleton width={60} height={10} style={{ marginBottom: 8 }} />
                  <Skeleton width={80} height={24} />
                </div>
              ))}
            </div>
            <div style={{ ...card }}><Skeleton height={180} /></div>
            <div style={{ ...card }}><Skeleton height={120} /></div>
          </div>
        </div>
      </>
    );
  }

  const { patient, protocol, logs, stats } = data;
  const today = todayPacific();
  const checkedInToday = logs?.some(l => l.date === today);
  const hasLogs = logs && logs.length > 0;
  const weightData = logs?.filter(l => l.weight).map((l, i) => ({
    label: fmt(l.date),
    weight: l.weight,
    dose: l.dose,
    idx: i,
  })) || [];

  const lossNum = parseFloat(stats.totalLoss);
  const isLoss = lossNum > 0;
  const lossColor = isLoss ? C.green : lossNum < 0 ? C.red : C.body;
  const lossArrow = isLoss ? '\u2193' : lossNum < 0 ? '\u2191' : '';

  // Medication display
  const medParts = [protocol.medication, protocol.dose, protocol.frequency].filter(Boolean);
  const medDisplay = medParts.join(' \u00B7 ');

  return (
    <>
      <Head>
        <title>Range Medical \u2014 Weight Loss</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="theme-color" content="#1A1A1A" />
      </Head>

      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* ─── Sticky name bar ──────────────────────────────────────────── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: C.black, padding: '10px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ ...label, color: '#FFFFFF', fontSize: 10, margin: 0 }}>RANGE MEDICAL</span>
          <span style={{ color: '#FFFFFF', fontSize: 12 }}>{protocol.medication}</span>
        </div>

        {/* ─── Hero Section ─────────────────────────────────────────────── */}
        <div style={{
          background: C.heroGrad, padding: '28px 24px 32px',
          animation: 'fadeInUp 0.5s ease',
        }}>
          <h1 style={{
            fontFamily: 'system-ui', fontSize: 28, fontWeight: 700,
            letterSpacing: '-0.02em', color: C.white, margin: '0 0 6px',
          }}>
            Hey {patient.firstName}
          </h1>
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: '0 0 20px',
            lineHeight: 1.4,
          }}>
            Week {stats.weekNumber} of your weight loss program
          </p>
          <div style={{
            display: 'inline-block',
            background: 'rgba(139,115,85,0.2)', border: '1px solid rgba(139,115,85,0.3)',
            padding: '8px 16px', borderRadius: 0, fontSize: 13,
            color: C.bronzeLight, letterSpacing: '0.02em',
          }}>
            {medDisplay}
          </div>
        </div>

        {/* ─── Content container ────────────────────────────────────────── */}
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 24px 60px' }}>

          {/* ─── Injection Day Picker ─────────────────────────────────── */}
          {(!protocol.injectionDay || changeDay) && (() => {
            const isInClinic = protocol.deliveryMethod === 'in_clinic';
            const dayLabel = isInClinic ? 'Clinic Visit Day' : 'Injection Day';
            const dayDesc = isInClinic
              ? 'Pick the day you\'d like to come in for your weekly injection. We\'ll send you a reminder each week.'
              : 'Pick the day you\'ll do your weekly injection. We\'ll send you a reminder each week.';
            return (
            <div style={{
              ...card,
              borderLeft: `4px solid ${C.bronze}`,
              padding: 24,
              marginBottom: 16,
              animation: 'fadeInUp 0.4s ease',
            }}>
              <p style={{ ...label, marginBottom: 4 }}>SET UP YOUR SCHEDULE</p>
              <h2 style={{ ...heading(20), marginBottom: 8 }}>
                {changeDay ? `Change ${dayLabel}` : `Choose Your ${dayLabel}`}
              </h2>
              <p style={{ ...bodyText, color: C.caption, fontSize: 14, marginBottom: 20 }}>
                {dayDesc}
              </p>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8, marginBottom: changeDay ? 12 : 0,
              }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((short, i) => {
                  const full = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i];
                  return (
                    <button
                      key={full}
                      onClick={() => saveInjectionDay(full)}
                      disabled={savingDay}
                      style={{
                        padding: '14px 0', border: `1px solid ${C.border}`,
                        background: savingDay ? '#f5f5f5' : C.white,
                        cursor: savingDay ? 'default' : 'pointer',
                        fontSize: 14, fontWeight: 600, color: C.text,
                        transition, borderRadius: 0,
                        ...(i === 6 ? { gridColumn: '2 / 4' } : {}),
                      }}
                    >
                      {short}
                    </button>
                  );
                })}
              </div>
              {changeDay && (
                <button
                  onClick={() => setChangeDay(false)}
                  style={{
                    background: 'none', border: 'none', color: C.caption,
                    fontSize: 13, cursor: 'pointer', padding: 0,
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
            );
          })()}

          {protocol.injectionDay && !changeDay && (
            <div style={{
              ...card, padding: '14px 20px', marginBottom: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ ...label, marginBottom: 2, fontSize: 10 }}>{protocol.deliveryMethod === 'in_clinic' ? 'CLINIC VISIT DAY' : 'INJECTION DAY'}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                  {protocol.injectionDay}s
                </p>
              </div>
              <button
                onClick={() => setChangeDay(true)}
                style={{
                  background: 'none', border: `1px solid ${C.border}`,
                  padding: '6px 14px', fontSize: 12, color: C.caption,
                  cursor: 'pointer', borderRadius: 0, transition,
                }}
              >
                Change
              </button>
            </div>
          )}

          {/* ─── Progress Dashboard ───────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <StatCard label="Starting" value={stats.startWeight ? `${stats.startWeight}` : '\u2014'} unit="lbs" />
            <StatCard
              label="Current"
              value={stats.currentWeight ? `${stats.currentWeight}` : '\u2014'}
              unit="lbs"
              emphasized
            />
            <StatCard
              label="Lost"
              value={stats.totalLoss ? `${lossArrow}${Math.abs(lossNum)}` : '\u2014'}
              unit={stats.totalLoss ? 'lbs' : ''}
              valueColor={lossColor}
            />
          </div>

          {/* ─── Weight Chart ─────────────────────────────────────────── */}
          <div style={{ ...card, padding: '20px 16px 12px' }}>
            <p style={{ ...label, marginBottom: 16 }}>WEIGHT TREND</p>
            {weightData.length > 1 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weightData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.bronze} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={C.bronze} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label" tick={{ fontSize: 11, fill: C.caption }}
                    axisLine={{ stroke: C.border }} tickLine={false}
                  />
                  <YAxis
                    domain={['dataMin - 3', 'dataMax + 3']}
                    tick={{ fontSize: 11, fill: C.caption }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone" dataKey="weight" stroke={C.bronze}
                    strokeWidth={2.5} fill="url(#weightGrad)"
                    dot={{ r: 4, fill: C.white, stroke: C.bronze, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: C.bronze, stroke: C.white, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8,
              }}>
                <span style={{ fontSize: 28 }}>{'\uD83D\uDCC8'}</span>
                <p style={{ ...bodyText, color: C.caption, fontSize: 14, textAlign: 'center' }}>
                  {weightData.length === 1
                    ? 'Your trend line starts next week!'
                    : 'Check in to start tracking your progress'}
                </p>
              </div>
            )}
          </div>

          {/* ─── Weekly Check-In ──────────────────────────────────────── */}
          <div style={{
            ...card,
            borderLeft: `4px solid ${C.bronze}`,
            padding: 24,
          }}>
            <p style={{ ...label, marginBottom: 4 }}>THIS WEEK</p>
            <h2 style={{ ...heading(20), marginBottom: 16 }}>
              {checkedInToday || submitted ? 'Checked In' : 'Weekly Check-In'}
            </h2>

            {checkedInToday || submitted ? (
              <div style={{
                animation: submitted ? 'fadeInUp 0.4s ease' : undefined,
                textAlign: 'center', padding: '12px 0',
              }}>
                <div style={{
                  width: 56, height: 56, margin: '0 auto 16px',
                  background: C.greenLight, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  animation: submitted ? 'checkPop 0.5s ease' : undefined,
                }}>
                  <span style={{ fontSize: 28, color: C.green }}>{'\u2713'}</span>
                </div>
                <p style={{ ...bodyText, fontWeight: 600, color: C.green, marginBottom: 4 }}>
                  You're all set this week
                </p>
                <p style={{ ...bodyText, color: C.caption, fontSize: 14 }}>
                  {submitted && checkInWeight
                    ? `Logged ${checkInWeight} lbs on ${fmtFull(today)}`
                    : `Checked in ${fmtFull(today)}`}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Weight input */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'baseline', gap: 8,
                    borderBottom: `2px solid ${C.border}`, paddingBottom: 4,
                  }}>
                    <input
                      ref={weightRef}
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      placeholder="000.0"
                      value={checkInWeight}
                      onChange={e => setCheckInWeight(e.target.value)}
                      style={{
                        border: 'none', outline: 'none', background: 'transparent',
                        fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em',
                        width: 160, textAlign: 'center', color: C.text,
                        fontFamily: 'system-ui',
                      }}
                    />
                    <span style={{ fontSize: 16, color: C.caption, fontWeight: 500 }}>lbs</span>
                  </div>
                </div>

                {/* Side effects */}
                <p style={{ ...label, marginBottom: 10 }}>ANY SIDE EFFECTS?</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {SIDE_EFFECTS.map(effect => {
                    const active = checkInSideEffects.includes(effect);
                    return (
                      <button
                        key={effect}
                        type="button"
                        onClick={() => toggleSideEffect(effect)}
                        style={{
                          background: active ? (effect === 'None' ? C.greenLight : C.redLight) : C.bg,
                          border: `1px solid ${active ? (effect === 'None' ? C.green : C.red) : C.border}`,
                          color: active ? (effect === 'None' ? C.green : C.red) : C.body,
                          padding: '8px 14px', borderRadius: 0,
                          fontSize: 13, fontWeight: active ? 600 : 400,
                          cursor: 'pointer', transition,
                          transform: active ? 'scale(0.97)' : 'scale(1)',
                        }}
                      >
                        {effect === 'None' && active ? '\u2713 ' : ''}{effect}
                      </button>
                    );
                  })}
                </div>

                {/* Notes toggle */}
                {!showNotes ? (
                  <button
                    type="button"
                    onClick={() => setShowNotes(true)}
                    style={{
                      background: 'none', border: 'none', color: C.caption,
                      fontSize: 13, cursor: 'pointer', padding: '4px 0',
                      marginBottom: 20, textDecoration: 'underline',
                    }}
                  >
                    + Add a note (optional)
                  </button>
                ) : (
                  <div style={{ marginBottom: 20 }}>
                    <textarea
                      placeholder="How are you feeling this week?"
                      value={checkInNotes}
                      onChange={e => setCheckInNotes(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%', border: `1px solid ${C.border}`,
                        borderRadius: 0, padding: 12, fontSize: 14,
                        fontFamily: 'system-ui', color: C.body,
                        resize: 'vertical', outline: 'none',
                        background: C.bg, boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!checkInWeight || submitting}
                  style={{
                    width: '100%', padding: '16px 24px',
                    background: checkInWeight ? C.black : '#CCCCCC',
                    color: C.white, border: 'none', borderRadius: 0,
                    fontSize: 16, fontWeight: 600, cursor: checkInWeight ? 'pointer' : 'default',
                    transition, letterSpacing: '0.01em',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Logging...' : 'Log This Week \u2192'}
                </button>
              </form>
            )}
          </div>

          {/* ─── Injection History ────────────────────────────────────── */}
          {hasLogs && (
            <div style={{ ...card }}>
              <p style={{ ...label, marginBottom: 16 }}>INJECTION HISTORY</p>
              <div>
                {[...logs].reverse().map((log, i) => {
                  const weekNum = logs.length - i;
                  const hasWeight = log.weight !== null;
                  return (
                    <div key={i} style={{
                      display: 'flex', gap: 14, paddingBottom: 16, marginBottom: 16,
                      borderBottom: i < logs.length - 1 ? `1px solid ${C.divider}` : 'none',
                    }}>
                      {/* Timeline dot */}
                      <div style={{
                        width: 10, height: 10, marginTop: 5, flexShrink: 0,
                        background: hasWeight ? C.green : '#D0D0D0',
                        borderRadius: 0,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                            Week {weekNum}
                          </span>
                          <span style={{ fontSize: 12, color: C.caption }}>{fmt(log.date)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                          {hasWeight && (
                            <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                              {log.weight} lbs
                            </span>
                          )}
                          {log.dose && (
                            <span style={{ fontSize: 12, color: C.caption }}>{log.dose}</span>
                          )}
                          {!hasWeight && !log.dose && (
                            <span style={{ fontSize: 14, color: '#D0D0D0' }}>\u2014</span>
                          )}
                        </div>
                        {log.sideEffects && log.sideEffects !== 'None' && (
                          <p style={{ fontSize: 12, color: C.caption, marginTop: 4, margin: '4px 0 0' }}>
                            {log.sideEffects}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Your Guide (Accordion) ──────────────────────────────── */}
          <div style={{ marginTop: 8 }}>
            <p style={{ ...label, marginBottom: 12 }}>YOUR GUIDE</p>
            {GUIDE_SECTIONS.map(section => (
              <div key={section.key} style={{
                ...card, padding: 0, marginBottom: 8,
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => toggleSection(section.key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '16px 20px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{section.icon}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                      {section.title}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 18, color: C.caption, transition,
                    transform: expandedSections[section.key] ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    {'\u25BE'}
                  </span>
                </button>
                <div style={{
                  maxHeight: expandedSections[section.key] ? 2000 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.4s ease',
                }}>
                  <div style={{ padding: '0 20px 20px' }}>
                    <GuideContent section={section.content} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Footer ──────────────────────────────────────────────── */}
          <div style={{
            textAlign: 'center', padding: '32px 0 16px',
            borderTop: `1px solid ${C.divider}`, marginTop: 24,
          }}>
            <p style={{ ...label, marginBottom: 12 }}>RANGE MEDICAL</p>
            <p style={{ ...bodyText, fontSize: 14, marginBottom: 4 }}>
              Questions? Call or text{' '}
              <a href="tel:9499973988" style={{ color: C.bronze, textDecoration: 'none', fontWeight: 600 }}>
                (949) 997-3988
              </a>
            </p>
            <p style={{ fontSize: 12, color: C.caption, margin: 0 }}>range-medical.com</p>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Stat Card component ─────────────────────────────────────────────────────
function StatCard({ label: lbl, value, unit, emphasized, valueColor }) {
  return (
    <div style={{
      flex: 1, ...card, padding: '14px 12px', textAlign: 'center',
      marginBottom: 0,
    }}>
      <p style={{ ...label, fontSize: 10, marginBottom: 6 }}>{lbl}</p>
      <p style={{
        margin: 0, fontWeight: 700, letterSpacing: '-0.02em',
        fontSize: emphasized ? 24 : 20,
        color: valueColor || (emphasized ? C.text : C.body),
        fontFamily: 'system-ui',
      }}>
        {value}
      </p>
      {unit && <p style={{ margin: '2px 0 0', fontSize: 11, color: C.caption }}>{unit}</p>}
    </div>
  );
}

// ─── Guide Content renderer ──────────────────────────────────────────────────
function GuideContent({ section }) {
  const h3 = { fontSize: 14, fontWeight: 700, color: C.text, margin: '16px 0 8px' };
  const p = { ...bodyText, fontSize: 14, marginBottom: 8 };
  const bullet = (text) => (
    <p key={text} style={{ ...p, paddingLeft: 14, textIndent: -14, margin: '4px 0' }}>
      {'\u2013'}{'  '}{text}
    </p>
  );
  const miniCard = (title, desc) => (
    <div key={title} style={{
      background: C.bg, border: `1px solid ${C.border}`,
      padding: '12px 14px', marginBottom: 8, borderRadius: 0,
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{title}</p>
      <p style={{ fontSize: 13, color: C.body, margin: 0, lineHeight: 1.5 }}>{desc}</p>
    </div>
  );

  switch (section) {
    case 'mechanism':
      return (
        <>
          <p style={p}>Your medication helps you lose weight in four key ways:</p>
          {miniCard('Feel Full Faster', 'Slows stomach emptying so you feel satisfied sooner during meals.')}
          {miniCard('Stay Full Longer', 'Signals your brain that you\'ve had enough, reducing the urge to snack between meals.')}
          {miniCard('Fewer Cravings', 'Targets reward pathways in the brain, quieting food noise and reducing cravings for high-calorie foods.')}
          {miniCard('Eat Less Without Trying', 'These combined effects naturally lower your calorie intake without restrictive dieting.')}
        </>
      );

    case 'nutrition':
      return (
        <>
          <p style={p}>When you eat less, every bite matters more. Focus on nutrient-dense foods.</p>
          <div style={h3}>Key Nutrients</div>
          {bullet('Fiber \u2014 Vegetables, fruits, whole grains, legumes')}
          {bullet('Protein \u2014 Lean meats, fish, eggs, Greek yogurt, tofu')}
          {bullet('Calcium \u2014 Dairy, fortified plant milks, leafy greens')}
          {bullet('Vitamin D \u2014 Fatty fish, fortified foods, sunlight')}
          <div style={h3}>Protein Spotlight</div>
          <p style={p}>Aim for 60\u2013100g of protein per day to preserve lean muscle during weight loss.</p>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 14, marginBottom: 8 }}>
            {[
              ['Chicken breast (4oz)', '35g'],
              ['Greek yogurt (1 cup)', '20g'],
              ['Eggs (2 large)', '12g'],
              ['Salmon (4oz)', '25g'],
              ['Whey protein shake', '25\u201330g'],
              ['Cottage cheese (1 cup)', '28g'],
            ].map(([food, grams]) => (
              <div key={food} style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                borderBottom: `1px solid ${C.divider}`, fontSize: 13,
              }}>
                <span style={{ color: C.body }}>{food}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{grams}</span>
              </div>
            ))}
          </div>
          <p style={{ ...p, fontStyle: 'italic', color: C.caption, fontSize: 13 }}>
            Pro tip: A daily protein shake is one of the easiest ways to hit your target.
          </p>
        </>
      );

    case 'sideeffects':
      return (
        <>
          <div style={h3}>General Tips</div>
          {bullet('Eat slowly and chew thoroughly')}
          {bullet('Eat smaller, more frequent meals')}
          {bullet('Stop eating when you feel full \u2014 don\'t push it')}
          {bullet('Avoid lying down for 2 hours after eating')}

          <div style={h3}>Nausea</div>
          {bullet('Don\'t skip breakfast \u2014 even something small helps')}
          {bullet('Limit high-fat and high-fiber foods initially')}
          {bullet('Try ginger tea or ginger chews')}
          {bullet('Avoid greasy, spicy, or fried foods')}

          <div style={h3}>Constipation</div>
          {bullet('Aim for 25\u201338g of fiber per day')}
          {bullet('Drink 1.5\u20132L of water daily')}
          {bullet('Include probiotic-rich foods (yogurt, kimchi)')}

          <div style={h3}>Diarrhea</div>
          {bullet('Reduce fiber intake temporarily')}
          {bullet('Avoid coffee and alcohol until it resolves')}
          {bullet('Stay hydrated with electrolytes')}

          <div style={h3}>Bloating</div>
          {bullet('Avoid greasy and fried foods')}
          {bullet('Try herbal teas (peppermint, chamomile)')}
          {bullet('Skip carbonated drinks')}

          <div style={{
            background: '#FFF9F0', border: '1px solid #E8D5B8',
            padding: 14, marginTop: 16, borderRadius: 0,
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#8B5E00', margin: '0 0 6px' }}>
              When to Contact Us
            </p>
            {bullet('Strong or persistent stomach pain')}
            {bullet('Yellowing of skin or eyes')}
            {bullet('Uncontrolled vomiting lasting more than 24 hours')}
            <p style={{ fontSize: 13, color: C.bronze, fontWeight: 600, margin: '8px 0 0' }}>
              Call or text: (949) 997-3988
            </p>
          </div>
        </>
      );

    case 'exercise':
      return (
        <>
          <div style={h3}>Aerobic Activity</div>
          <p style={p}>Aim for 150 minutes per week, spread across 5 or more days.</p>
          {bullet('Walking, brisk walking, jogging')}
          {bullet('Biking or cycling')}
          {bullet('Swimming')}
          {bullet('Hiking')}

          <div style={h3}>Resistance Training</div>
          <p style={p}>3 sessions per week to preserve lean muscle mass.</p>
          {bullet('8\u201310 exercises per session')}
          {bullet('8\u201312 reps per exercise')}
          {bullet('Focus on major muscle groups')}

          <p style={{ ...p, fontStyle: 'italic', color: C.caption, fontSize: 13, marginTop: 12 }}>
            Note: You may feel more tired than usual while your body adjusts. Listen to your body and scale intensity as needed.
          </p>
        </>
      );

    case 'supplements':
      return (
        <>
          <div style={h3}>Included With Your Program</div>
          {miniCard('Multivitamin', 'Covers baseline micronutrient needs while eating less.')}
          {miniCard('Vitamin D', 'Supports immune function, bone health, and mood.')}

          <div style={h3}>Consider Adding</div>
          {miniCard('Calcium', 'Supports bone density, especially important during weight loss.')}
          {miniCard('Whey Protein', 'Helps hit your daily protein target and preserve muscle.')}
          {miniCard('Probiotics', 'Supports gut health, which can be affected by dietary changes.')}
          {miniCard('Ginger', 'Can help manage nausea naturally.')}
          {miniCard('Creatine', 'Supports muscle maintenance and exercise performance.')}
        </>
      );

    default:
      return null;
  }
}
