import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

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

// ─── Personalized symptom guidance ───────────────────────────────────────────
function getSymptomGuidance(weightLbs) {
  // Personalized targets based on current weight
  const proteinMin = Math.round(0.7 * (weightLbs || 180));
  const proteinMax = Math.round(1.0 * (weightLbs || 180));
  const waterOz = Math.round((weightLbs || 180) / 2);
  const waterL = (waterOz * 0.0296).toFixed(1);
  const calorieFloor = Math.round((weightLbs || 180) * 5.5); // rough safe minimum

  return {
    Nausea: {
      general: [
        'Eat small meals every 3\u20134 hours. Never inject on an empty stomach or a full stomach.',
        'Inject at night before bed \u2014 you sleep through the worst of it.',
        'Avoid fatty, greasy, or very spicy foods for 48 hours after injection.',
      ],
      Retatrutide: ['Nausea peaks at Week 2\u20134 during dose escalation. It almost always resolves.'],
      Tirzepatide: ['Splitting meals into 5\u20136 small portions is more effective than 3 large ones.'],
      Semaglutide: [],
    },
    Fatigue: {
      general: [
        'Common in first 2\u20134 weeks as your body adjusts to reduced calorie intake.',
        'Prioritize 7\u20138 hours of sleep \u2014 GLP-1s affect sleep architecture in some patients.',
        `At your weight, aim for ${proteinMin}\u2013${proteinMax}g of protein daily. Fatigue on GLP-1s is often under-eating protein, not the medication.`,
        `Drink at least ${waterOz}oz (${waterL}L) of water per day \u2014 dehydration amplifies fatigue significantly.`,
        `Make sure you\u2019re eating at least ${calorieFloor} calories per day. Under-eating slows your metabolism and worsens fatigue.`,
      ],
    },
    Constipation: {
      general: [
        'Add 25\u201335g of fiber per day: vegetables, chia seeds, psyllium husk.',
        'Magnesium glycinate 200\u2013400mg at night is safe and effective.',
        `Drink at least ${waterOz}oz of water daily \u2014 fiber without water makes constipation worse.`,
        'Walk 20\u201330 minutes daily \u2014 movement is the most underused constipation remedy.',
        'If no bowel movement in 3+ days, call the clinic.',
      ],
    },
    'Indigestion / Heartburn': {
      general: [
        'Avoid lying down within 2 hours of eating.',
        'Elevate the head of your bed slightly.',
        'OTC: Famotidine (Pepcid) 20mg before meals \u2014 safe with GLP-1s.',
        'Avoid coffee, alcohol, and carbonated drinks post-injection.',
      ],
    },
    Headache: {
      general: [
        `Almost always dehydration. Drink 16oz of water immediately. Your daily target is ${waterOz}oz.`,
        'Electrolytes help: add a pinch of salt or use LMNT/Liquid IV.',
        'Usually resolves within 2\u20133 weeks as body adapts.',
        'If persistent or severe, contact the clinic.',
      ],
    },
    Diarrhea: {
      general: [
        'Rare but can occur, especially with dose increases.',
        'BRAT diet for 24\u201348 hours (bananas, rice, applesauce, toast).',
        'Avoid dairy, high-fat foods, and artificial sweeteners temporarily.',
        `Stay hydrated \u2014 diarrhea dehydrates quickly. Aim for ${waterOz}oz+ of water with electrolytes.`,
        'If lasting more than 3 days or severe, contact the clinic.',
      ],
    },
    'Injection Site Pain': {
      general: [
        'Rotate injection sites every week: abdomen, thigh, back of upper arm.',
        'Let medication reach room temperature before injecting (15\u201320 min out of fridge).',
        'Inject slowly \u2014 fast injection increases site pain.',
        'Apply gentle pressure (not rubbing) after injection.',
        'Small lumps or redness at site are normal and resolve within 48 hours.',
      ],
    },
    'Appetite Gone': {
      general: [
        'This is the medication working \u2014 but you still need to eat.',
        'Set a phone alarm for meals if you\u2019re not feeling hunger cues.',
        `At your weight, you need at least ${proteinMin}g of protein per day \u2014 non-negotiable.`,
        'Liquid protein (shakes, Greek yogurt) is easier when appetite is suppressed.',
        `Don\u2019t drop below ${calorieFloor} calories/day. Under-eating accelerates muscle loss \u2014 this is the biggest risk on GLP-1s.`,
      ],
    },
  };
}

const SYMPTOM_CHIPS = [
  'Nausea', 'Fatigue', 'Constipation', 'Indigestion / Heartburn',
  'Headache', 'Diarrhea', 'Injection Site Pain', 'Appetite Gone',
];

// ─── TDEE helpers ────────────────────────────────────────────────────────────
const ACTIVITY_LEVELS = [
  { label: 'Sedentary', value: 1.2 },
  { label: 'Lightly Active', value: 1.375 },
  { label: 'Moderately Active', value: 1.55 },
  { label: 'Very Active', value: 1.725 },
];

function calcTDEE(weightLbs, heightCm, age, activityMultiplier, gender) {
  const weightKg = weightLbs * 0.453592;
  const bmr = gender === 'male'
    ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
    : (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  return Math.round(bmr * activityMultiplier);
}

function heightToCm(ft, inches) {
  return ((ft * 12) + inches) * 2.54;
}

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

// ─── Projected goal date calculation ─────────────────────────────────────────
function calcProjectedGoal(logs, goalWeight) {
  if (!goalWeight) return null;
  const withWeight = logs.filter(l => l.weight);
  if (withWeight.length < 3) return { needMore: true };

  // logs are newest-first, take last 4 with weight
  const recent = withWeight.slice(0, 4);
  if (recent.length < 2) return { needMore: true };

  const oldest = recent[recent.length - 1];
  const newest = recent[0];
  const daysDiff = (new Date(newest.date) - new Date(oldest.date)) / (1000 * 60 * 60 * 24);
  if (daysDiff <= 0) return { needMore: true };

  const weeksDiff = daysDiff / 7;
  const totalLost = oldest.weight - newest.weight;
  const avgWeeklyLoss = totalLost / weeksDiff;

  if (avgWeeklyLoss <= 0) return { gaining: true };
  if (newest.weight <= goalWeight) return { reached: true };

  const weeksToGoal = (newest.weight - goalWeight) / avgWeeklyLoss;
  const goalDate = new Date();
  goalDate.setDate(goalDate.getDate() + Math.round(weeksToGoal * 7));

  return {
    date: goalDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    avgWeeklyLoss: avgWeeklyLoss.toFixed(1),
  };
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function WeightLossPortal() {
  const router = useRouter();
  const { token } = router.query;
  const weightRef = useRef(null);
  const tipsRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkInWeight, setCheckInWeight] = useState('');
  const [checkInSideEffects, setCheckInSideEffects] = useState([]);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedSideEffects, setSubmittedSideEffects] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [savingDay, setSavingDay] = useState(false);
  const [changeDay, setChangeDay] = useState(false);

  // Zone 2: TDEE state
  const [tdeeData, setTdeeData] = useState(null);
  const [tdeeForm, setTdeeForm] = useState({ heightFt: '', heightIn: '', age: '', activity: '' });
  const [showTdeeForm, setShowTdeeForm] = useState(false);

  // Zone 3: Symptom triage
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [expandedSymptoms, setExpandedSymptoms] = useState({});
  const [feelingGood, setFeelingGood] = useState(false);

  useEffect(() => { injectKeyframes(); }, []);

  // Load TDEE data from localStorage
  useEffect(() => {
    if (!token) return;
    try {
      const saved = localStorage.getItem(`range-wl-tdee-${token}`);
      if (saved) setTdeeData(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [token]);

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
    } catch {
      setError('error');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-focus weight input once loaded, or pre-populate symptoms from today's check-in
  useEffect(() => {
    if (!loading && data) {
      const today = todayPacific();
      const todaysLog = data.logs?.find(l => l.date === today);
      if (todaysLog) {
        // Already checked in — pre-populate Zone 3 with today's side effects
        if (todaysLog.sideEffects && todaysLog.sideEffects !== 'None') {
          const effects = todaysLog.sideEffects.split(',').map(s => s.trim()).filter(Boolean);
          // Map back to chip labels
          const matched = effects.filter(e => SYMPTOM_CHIPS.includes(e));
          if (matched.length > 0 && selectedSymptoms.length === 0 && !submitted) {
            setSelectedSymptoms(matched);
            const expanded = {};
            matched.forEach(s => { expanded[s] = true; });
            setExpandedSymptoms(expanded);
          }
        }
      } else if (weightRef.current) {
        setTimeout(() => weightRef.current?.focus(), 400);
      }
    }
  }, [loading, data]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Check-in side effect toggle ─────────────────────────────────────────
  function toggleCheckInSideEffect(effect) {
    setCheckInSideEffects(prev => {
      if (effect === 'None') return prev.includes('None') ? [] : ['None'];
      const without = prev.filter(e => e !== 'None');
      if (without.includes(effect)) return without.filter(e => e !== effect);
      return [...without, effect];
    });
  }

  // ─── Check-in submit ────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!checkInWeight || submitting) return;
    setSubmitting(true);
    try {
      const effects = checkInSideEffects.filter(e => e !== 'None');
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
        setSubmittedSideEffects(effects);
        // Auto-populate Zone 3 with reported side effects
        if (effects.length > 0) {
          setSelectedSymptoms(effects);
          setFeelingGood(false);
          const expanded = {};
          effects.forEach(s => { expanded[s] = true; });
          setExpandedSymptoms(expanded);
          // Scroll to tips after a brief delay
          setTimeout(() => {
            tipsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 600);
        } else {
          setFeelingGood(true);
          setSelectedSymptoms([]);
        }
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

  // ─── Symptom toggle ────────────────────────────────────────────────────
  function toggleSymptom(symptom) {
    setFeelingGood(false);
    setSelectedSymptoms(prev => {
      if (prev.includes(symptom)) return prev.filter(s => s !== symptom);
      return [...prev, symptom];
    });
    // Auto-expand when selecting
    setExpandedSymptoms(prev => ({ ...prev, [symptom]: true }));
  }

  function handleFeelingGood() {
    setSelectedSymptoms([]);
    setFeelingGood(!feelingGood);
  }

  // ─── TDEE form submit ──────────────────────────────────────────────────
  function saveTdee(e) {
    e.preventDefault();
    const { heightFt, heightIn, age, activity } = tdeeForm;
    if (!heightFt || !age || !activity) return;
    const saved = {
      heightFt: parseInt(heightFt),
      heightIn: parseInt(heightIn || 0),
      age: parseInt(age),
      activity: parseFloat(activity),
    };
    localStorage.setItem(`range-wl-tdee-${token}`, JSON.stringify(saved));
    setTdeeData(saved);
    setShowTdeeForm(false);
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
        <Head><title>Range Medical {'\u2014'} Weight Loss</title></Head>
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
  const weightData = (logs || []).filter(l => l.weight).map((l) => ({
    label: fmt(l.date),
    weight: l.weight,
    idx: l.date,
  })).sort((a, b) => a.idx.localeCompare(b.idx));

  const lossNum = parseFloat(stats.totalLoss);
  const isLoss = lossNum > 0;

  // Progress bar calculation
  const startWeight = protocol.startingWeight || stats.startWeight;
  const currentWeight = stats.currentWeight;
  const goalWeight = protocol.goalWeight;
  let progressPct = 0;
  if (startWeight && goalWeight && currentWeight && startWeight !== goalWeight) {
    progressPct = Math.max(0, Math.min(100, ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100));
  }

  // Projected goal
  const projected = goalWeight ? calcProjectedGoal(logs || [], goalWeight) : null;

  // Medication display
  const medParts = [protocol.medication, protocol.dose, protocol.frequency].filter(Boolean);
  const medDisplay = medParts.join(' \u00B7 ');

  // TDEE calculations
  let tdeeNumbers = null;
  if (tdeeData && currentWeight) {
    const heightCm = heightToCm(tdeeData.heightFt, tdeeData.heightIn);
    const gender = data.patient?.gender || protocol?.gender || 'female';
    const maintenance = calcTDEE(currentWeight, heightCm, tdeeData.age, tdeeData.activity, gender);
    const target = maintenance - 500;
    const protein = Math.round(0.7 * currentWeight);
    const onMed = Math.round(maintenance * 0.72);
    tdeeNumbers = { maintenance, target, protein, onMed };
  }

  // Today's logged weight for checked-in confirmation
  const todayLog = logs?.find(l => l.date === today);

  return (
    <>
      <Head>
        <title>Range Medical {'\u2014'} Weight Loss</title>
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

        {/* ─── ZONE 1: Progress Hero ───────────────────────────────────── */}
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

          {/* Total weight lost */}
          {isLoss ? (
            <p style={{
              fontSize: 26, fontWeight: 800, color: '#4ADE80',
              margin: '8px 0 4px', letterSpacing: '-0.02em',
              fontFamily: 'system-ui',
            }}>
              {Math.abs(lossNum)} lbs lost
            </p>
          ) : hasLogs ? (
            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: '8px 0 4px',
              lineHeight: 1.4,
            }}>
              Getting started {'\u2014'} your journey begins here.
            </p>
          ) : (
            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: '8px 0 4px',
              lineHeight: 1.4,
            }}>
              Getting started {'\u2014'} your journey begins here.
            </p>
          )}

          {/* Goal progress bar */}
          {goalWeight && startWeight && currentWeight && (
            <div style={{ margin: '16px 0 8px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6,
              }}>
                <span>{startWeight} lbs</span>
                <span>{goalWeight} lbs</span>
              </div>
              <div style={{
                position: 'relative', height: 8,
                background: 'rgba(255,255,255,0.1)', borderRadius: 0,
              }}>
                <div style={{
                  height: '100%', width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #4ADE80, #2D6A4F)',
                  borderRadius: 0, transition: 'width 0.6s ease',
                }} />
                {/* Current weight marker */}
                <div style={{
                  position: 'absolute', top: -4,
                  left: `${progressPct}%`, transform: 'translateX(-50%)',
                  width: 16, height: 16, background: C.white,
                  borderRadius: '50%', border: '2px solid #4ADE80',
                }} />
              </div>
              {currentWeight && (
                <div style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8,
                  textAlign: 'center',
                }}>
                  Currently {currentWeight} lbs
                </div>
              )}
            </div>
          )}

          {/* Projected goal date */}
          {projected && (
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '12px 0 0',
              lineHeight: 1.4, fontStyle: 'italic',
            }}>
              {projected.needMore
                ? 'Keep logging \u2014 we\u2019ll project your goal date after a few more check-ins.'
                : projected.reached
                  ? 'You\u2019ve reached your goal weight!'
                  : projected.gaining
                    ? 'Keep going \u2014 consistency is key.'
                    : `At your current pace: goal by ${projected.date}`}
            </p>
          )}

          {/* Medication badge */}
          <div style={{
            display: 'inline-block', marginTop: 16,
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
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
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
                        ...(i === 6 ? { gridColumn: '1 / -1' } : {}),
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

          {/* ─── Weekly Check-In (moved to top) ──────────────────────── */}
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
                display: 'flex', alignItems: 'center', gap: 16, padding: '4px 0',
              }}>
                <div style={{
                  width: 48, height: 48, flexShrink: 0,
                  background: C.greenLight, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  animation: submitted ? 'checkPop 0.5s ease' : undefined,
                }}>
                  <span style={{ fontSize: 24, color: C.green }}>{'\u2713'}</span>
                </div>
                <div>
                  <p style={{ ...bodyText, fontWeight: 600, color: C.green, marginBottom: 2 }}>
                    Checked in today {'\u2713'}
                  </p>
                  <p style={{ ...bodyText, color: C.caption, fontSize: 14 }}>
                    {todayLog?.weight
                      ? `${todayLog.weight} lbs on ${fmtFull(today)}`
                      : submitted && checkInWeight
                        ? `${checkInWeight} lbs on ${fmtFull(today)}`
                        : fmtFull(today)}
                  </p>
                </div>
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
                  {['None', ...SYMPTOM_CHIPS].map(effect => {
                    const active = checkInSideEffects.includes(effect);
                    const isNone = effect === 'None';
                    return (
                      <button
                        key={effect}
                        type="button"
                        onClick={() => toggleCheckInSideEffect(effect)}
                        style={{
                          background: active ? (isNone ? C.greenLight : C.redLight) : C.bg,
                          border: `1px solid ${active ? (isNone ? C.green : C.red) : C.border}`,
                          color: active ? (isNone ? C.green : C.red) : C.body,
                          padding: '8px 14px', borderRadius: 0,
                          fontSize: 13, fontWeight: active ? 600 : 400,
                          cursor: 'pointer', transition,
                          transform: active ? 'scale(0.97)' : 'scale(1)',
                        }}
                      >
                        {isNone && active ? '\u2713 ' : ''}{effect}
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

          {/* ─── Progress Dashboard ───────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <StatCard label="Starting" value={startWeight ? `${startWeight}` : '\u2014'} unit="lbs" />
            <StatCard
              label="Current"
              value={currentWeight ? `${currentWeight}` : '\u2014'}
              unit="lbs"
              emphasized
            />
            <StatCard
              label="Lost"
              value={stats.totalLoss ? `${isLoss ? '\u2193' : lossNum < 0 ? '\u2191' : ''}${Math.abs(lossNum)}` : '\u2014'}
              unit={stats.totalLoss ? 'lbs' : ''}
              valueColor={isLoss ? C.green : lossNum < 0 ? C.red : C.body}
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

          {/* ─── ZONE 2: Your Numbers (TDEE) ─────────────────────────── */}
          <div style={{ ...card }}>
            <p style={{ ...label, marginBottom: 4 }}>YOUR NUMBERS</p>
            <h2 style={{ ...heading(20), marginBottom: 16 }}>
              {tdeeNumbers ? 'Daily Targets' : 'Personalize Your Targets'}
            </h2>

            {tdeeNumbers && !showTdeeForm ? (
              <>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                }}>
                  <NumberCard
                    label="MAINTENANCE CALORIES"
                    value={`${tdeeNumbers.maintenance.toLocaleString()}`}
                    unit="cal/day"
                    desc="Your body burns this at rest + activity"
                  />
                  <NumberCard
                    label="TARGET INTAKE"
                    value={`${tdeeNumbers.target.toLocaleString()}`}
                    unit="cal/day"
                    desc="Aim for this range to lose ~1 lb/week"
                  />
                  <NumberCard
                    label="PROTEIN TARGET"
                    value={`${tdeeNumbers.protein}g`}
                    unit="per day"
                    desc="Non-negotiable on GLP-1"
                  />
                  <NumberCard
                    label="ON-MEDICATION ESTIMATE"
                    value={`${tdeeNumbers.onMed.toLocaleString()}`}
                    unit="cal/day"
                    desc={`Estimated actual intake on ${protocol.medication}`}
                  />
                </div>
                <button
                  onClick={() => {
                    setTdeeForm({
                      heightFt: String(tdeeData.heightFt),
                      heightIn: String(tdeeData.heightIn),
                      age: String(tdeeData.age),
                      activity: String(tdeeData.activity),
                    });
                    setShowTdeeForm(true);
                  }}
                  style={{
                    background: 'none', border: 'none', color: C.caption,
                    fontSize: 12, cursor: 'pointer', padding: '12px 0 0',
                    textDecoration: 'underline',
                  }}
                >
                  Recalculate
                </button>
              </>
            ) : (
              <form onSubmit={saveTdee}>
                <p style={{ ...bodyText, fontSize: 14, color: C.caption, marginBottom: 16 }}>
                  Enter a few details so we can calculate your daily targets.
                </p>

                {/* Height */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ ...label, marginBottom: 8, fontSize: 10 }}>HEIGHT</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <select
                      value={tdeeForm.heightFt}
                      onChange={e => setTdeeForm(p => ({ ...p, heightFt: e.target.value }))}
                      style={{
                        flex: 1, padding: '12px 10px', border: `1px solid ${C.border}`,
                        borderRadius: 0, fontSize: 15, color: C.text,
                        background: C.white, fontFamily: 'system-ui',
                      }}
                    >
                      <option value="">ft</option>
                      {[4, 5, 6, 7].map(n => <option key={n} value={n}>{n} ft</option>)}
                    </select>
                    <select
                      value={tdeeForm.heightIn}
                      onChange={e => setTdeeForm(p => ({ ...p, heightIn: e.target.value }))}
                      style={{
                        flex: 1, padding: '12px 10px', border: `1px solid ${C.border}`,
                        borderRadius: 0, fontSize: 15, color: C.text,
                        background: C.white, fontFamily: 'system-ui',
                      }}
                    >
                      <option value="">in</option>
                      {[0,1,2,3,4,5,6,7,8,9,10,11].map(n => <option key={n} value={n}>{n} in</option>)}
                    </select>
                  </div>
                </div>

                {/* Age */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ ...label, marginBottom: 8, fontSize: 10 }}>AGE</p>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Age"
                    value={tdeeForm.age}
                    onChange={e => setTdeeForm(p => ({ ...p, age: e.target.value }))}
                    style={{
                      width: '100%', padding: '12px 10px', border: `1px solid ${C.border}`,
                      borderRadius: 0, fontSize: 15, color: C.text,
                      background: C.white, fontFamily: 'system-ui',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Activity level */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ ...label, marginBottom: 8, fontSize: 10 }}>ACTIVITY LEVEL</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ACTIVITY_LEVELS.map(lev => {
                      const active = tdeeForm.activity === String(lev.value);
                      return (
                        <button
                          key={lev.label}
                          type="button"
                          onClick={() => setTdeeForm(p => ({ ...p, activity: String(lev.value) }))}
                          style={{
                            padding: '12px 16px', textAlign: 'left',
                            border: `1px solid ${active ? C.bronze : C.border}`,
                            background: active ? 'rgba(139,115,85,0.06)' : C.white,
                            color: active ? C.text : C.body,
                            fontWeight: active ? 600 : 400,
                            fontSize: 14, cursor: 'pointer', borderRadius: 0,
                            transition, fontFamily: 'system-ui',
                          }}
                        >
                          {lev.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!tdeeForm.heightFt || !tdeeForm.age || !tdeeForm.activity}
                  style={{
                    width: '100%', padding: '14px 24px',
                    background: (tdeeForm.heightFt && tdeeForm.age && tdeeForm.activity) ? C.black : '#CCCCCC',
                    color: C.white, border: 'none', borderRadius: 0,
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    transition, letterSpacing: '0.01em',
                  }}
                >
                  Calculate My Numbers
                </button>

                {tdeeData && (
                  <button
                    type="button"
                    onClick={() => setShowTdeeForm(false)}
                    style={{
                      background: 'none', border: 'none', color: C.caption,
                      fontSize: 13, cursor: 'pointer', padding: '12px 0 0',
                    }}
                  >
                    Cancel
                  </button>
                )}
              </form>
            )}
          </div>

          {/* ─── ZONE 3: How Are You Feeling? ────────────────────────── */}
          <div id="tips" ref={tipsRef} style={{ ...card }}>
            <p style={{ ...label, marginBottom: 4 }}>
              {submittedSideEffects.length > 0 ? 'TIPS FOR YOU' : 'HOW ARE YOU FEELING?'}
            </p>
            {submittedSideEffects.length > 0 && (
              <p style={{ ...bodyText, fontSize: 14, color: C.caption, marginBottom: 12 }}>
                Based on what you reported, here{'\u2019'}s what can help.
              </p>
            )}
            <p style={{ ...bodyText, fontSize: 14, color: C.caption, marginBottom: 16 }}>
              Tap anything you{'\u2019'}re experiencing right now.
            </p>

            {/* Symptom chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {SYMPTOM_CHIPS.map(symptom => {
                const active = selectedSymptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    style={{
                      background: active ? C.redLight : C.bg,
                      border: `1px solid ${active ? C.red : C.border}`,
                      color: active ? C.red : C.body,
                      padding: '8px 14px', borderRadius: 0,
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', transition,
                    }}
                  >
                    {symptom}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleFeelingGood}
                style={{
                  background: feelingGood ? C.greenLight : C.bg,
                  border: `1px solid ${feelingGood ? C.green : C.border}`,
                  color: feelingGood ? C.green : C.body,
                  padding: '8px 14px', borderRadius: 0,
                  fontSize: 13, fontWeight: feelingGood ? 600 : 400,
                  cursor: 'pointer', transition,
                }}
              >
                {feelingGood ? '\u2713 ' : ''}Feeling Good
              </button>
            </div>

            {/* Feeling good response */}
            {feelingGood && (
              <div style={{
                background: C.greenLight, border: `1px solid ${C.green}`,
                padding: 16, marginTop: 12, animation: 'fadeInUp 0.3s ease',
              }}>
                <p style={{ ...bodyText, fontSize: 14, color: C.green, fontWeight: 600 }}>
                  Great to hear! Keep doing what you{'\u2019'}re doing.
                </p>
              </div>
            )}

            {/* Symptom guidance cards */}
            {selectedSymptoms.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {selectedSymptoms.map(symptom => {
                  const allGuidance = getSymptomGuidance(currentWeight);
                  const guidance = allGuidance[symptom];
                  if (!guidance) return null;
                  const isExpanded = expandedSymptoms[symptom];
                  const medSpecific = guidance[protocol.medication] || [];
                  const tips = [...guidance.general, ...medSpecific];

                  return (
                    <div key={symptom} style={{
                      border: `1px solid ${C.border}`, marginBottom: 8,
                      background: C.white, animation: 'fadeInUp 0.3s ease',
                    }}>
                      <button
                        type="button"
                        onClick={() => setExpandedSymptoms(prev => ({ ...prev, [symptom]: !prev[symptom] }))}
                        style={{
                          width: '100%', display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', padding: '14px 16px',
                          background: 'none', border: 'none', cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                          {symptom}
                        </span>
                        <span style={{
                          fontSize: 16, color: C.caption, transition,
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}>
                          {'\u25BE'}
                        </span>
                      </button>
                      <div style={{
                        maxHeight: isExpanded ? 1000 : 0,
                        overflow: 'hidden', transition: 'max-height 0.4s ease',
                      }}>
                        <div style={{ padding: '0 16px 14px' }}>
                          {tips.map((tip, i) => (
                            <p key={i} style={{
                              ...bodyText, fontSize: 13, margin: '0 0 6px',
                              paddingLeft: 14, textIndent: -14,
                            }}>
                              {'\u2013'}{'  '}{tip}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div style={{
                  background: '#FFF9F0', border: '1px solid #E8D5B8',
                  padding: 14, marginTop: 8, borderRadius: 0,
                }}>
                  <p style={{ fontSize: 13, color: C.bronze, margin: 0 }}>
                    Still struggling? Call or text us:{' '}
                    <a href="tel:9499973988" style={{ color: C.bronze, fontWeight: 700, textDecoration: 'none' }}>
                      (949) 997-3988
                    </a>
                  </p>
                </div>
              </div>
            )}
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

// ─── Number Card for TDEE grid ───────────────────────────────────────────────
function NumberCard({ label: lbl, value, unit, desc }) {
  return (
    <div style={{
      background: C.bg, border: `1px solid ${C.border}`,
      padding: 14, borderRadius: 0,
    }}>
      <p style={{
        fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: C.caption, margin: '0 0 6px',
      }}>
        {lbl}
      </p>
      <p style={{
        fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 2px',
        letterSpacing: '-0.02em', fontFamily: 'system-ui',
      }}>
        {value}
      </p>
      <p style={{
        fontSize: 11, color: C.caption, margin: '0 0 6px',
      }}>
        {unit}
      </p>
      <p style={{
        fontSize: 12, color: C.body, margin: 0, lineHeight: 1.4,
      }}>
        {desc}
      </p>
    </div>
  );
}
