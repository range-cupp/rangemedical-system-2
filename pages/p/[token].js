// /pages/p/[token].js
// Range Medical - Complete Patient Portal
// Merges tracker + accountability + progress into one unified experience

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function PatientPortal() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInData, setCheckInData] = useState({
    energy: 5, sleep: 5, mood: 5, brain_fog: 5, pain: 5, libido: 5
  });
  const [savingCheckIn, setSavingCheckIn] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = window.location.pathname.split('/').pop();
    setToken(t);
    if (t) fetchPatientData(t);
  }, []);

  const fetchPatientData = async (t) => {
    try {
      const res = await fetch(`/api/portal/${t}`);
      if (!res.ok) throw new Error('Unable to load your information');
      const data = await res.json();
      setPatient(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setSavingCheckIn(true);
    try {
      const res = await fetch(`/api/portal/${token}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkInData)
      });
      if (res.ok) {
        setShowCheckIn(false);
        fetchPatientData(token);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCheckIn(false);
    }
  };

  const toggleInjection = async (blockId, dayNumber, currentlyComplete) => {
    try {
      await fetch(`/api/portal/${token}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          block_id: blockId, 
          day_number: dayNumber,
          completed: !currentlyComplete 
        })
      });
      fetchPatientData(token);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingDot} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠</div>
        <h1 style={styles.errorTitle}>Something went wrong</h1>
        <p style={styles.errorText}>{error}</p>
        <p style={styles.errorText}>Please contact Range Medical</p>
      </div>
    );
  }

  const firstName = patient?.first_name || 'there';

  return (
    <>
      <Head>
        <title>Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <style>{`
          * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          body { margin: 0; background: #fafafa; }
          input[type="range"] { -webkit-appearance: none; width: 100%; height: 8px; border-radius: 4px; background: #e5e5e5; }
          input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 28px; height: 28px; border-radius: 50%; background: #000; cursor: pointer; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        `}</style>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logo}>RANGE</div>
          <div style={styles.greeting}>Hi, {firstName}</div>
        </header>

        {/* Tab Navigation */}
        <nav style={styles.tabs}>
          <button 
            onClick={() => setActiveTab('home')} 
            style={activeTab === 'home' ? styles.tabActive : styles.tab}
          >
            Home
          </button>
          <button 
            onClick={() => setActiveTab('track')} 
            style={activeTab === 'track' ? styles.tabActive : styles.tab}
          >
            Track
          </button>
          <button 
            onClick={() => setActiveTab('progress')} 
            style={activeTab === 'progress' ? styles.tabActive : styles.tab}
          >
            Progress
          </button>
        </nav>

        <main style={styles.main}>
          {activeTab === 'home' && (
            <HomeTab 
              patient={patient} 
              onCheckIn={() => setShowCheckIn(true)}
              onSwitchToTrack={() => setActiveTab('track')}
            />
          )}
          {activeTab === 'track' && (
            <TrackTab 
              patient={patient} 
              onToggle={toggleInjection}
              token={token}
              onRefresh={() => fetchPatientData(token)}
            />
          )}
          {activeTab === 'progress' && (
            <ProgressTab patient={patient} />
          )}
        </main>

        {/* Footer */}
        <footer style={styles.footer}>
          <a href="sms:9499973988" style={styles.footerLink}>💬 Message Us</a>
          <span style={styles.footerDivider}>•</span>
          <a href="tel:9499973988" style={styles.footerLink}>📞 Call</a>
        </footer>

        {/* Check-in Modal */}
        {showCheckIn && (
          <CheckInModal 
            data={checkInData}
            onChange={setCheckInData}
            onSave={handleCheckIn}
            onClose={() => setShowCheckIn(false)}
            saving={savingCheckIn}
          />
        )}
      </div>
    </>
  );
}

// ============================================
// HOME TAB
// ============================================
function HomeTab({ patient, onCheckIn, onSwitchToTrack }) {
  const goals = patient?.primary_goals || [];
  const whyNow = patient?.why_now;
  const importance = patient?.importance_score;
  const accountability = patient?.accountability || {};
  const streak = patient?.streak || 0;
  const nextActions = patient?.next_actions || [];
  const needsOnboarding = !whyNow && goals.length === 0;

  return (
    <>
      {/* Onboarding Prompt */}
      {needsOnboarding && (
        <section style={styles.card}>
          <div style={styles.onboardPrompt}>
            <div style={styles.onboardIcon}>👋</div>
            <h2 style={styles.onboardTitle}>Welcome to Range</h2>
            <p style={styles.onboardText}>Take 2 minutes to set your goals and help us personalize your experience.</p>
            <a 
              href={`/onboard/${window.location.pathname.split('/').pop()}`}
              style={styles.onboardButton}
            >
              Get Started
            </a>
          </div>
        </section>
      )}

      {/* Your Big Why */}
      {(whyNow || goals.length > 0) && (
        <section style={styles.card}>
          <div style={styles.cardLabel}>YOUR BIG WHY</div>
          {goals.length > 0 && (
            <div style={styles.goalTags}>
              {goals.map((goal, i) => (
                <span key={i} style={styles.goalTag}>{goal}</span>
              ))}
            </div>
          )}
          {whyNow && <p style={styles.whyText}>"{whyNow}"</p>}
          {importance && (
            <div style={styles.importanceRow}>
              <span style={styles.importanceLabel}>Priority</span>
              <div style={styles.importanceBar}>
                <div style={{ ...styles.importanceFill, width: `${importance * 10}%` }} />
              </div>
              <span style={styles.importanceValue}>{importance}/10</span>
            </div>
          )}
        </section>
      )}

      {/* Accountability Score */}
      <section style={styles.card}>
        <div style={styles.cardLabel}>ACCOUNTABILITY</div>
        <div style={styles.accountabilityMain}>
          <div style={styles.scoreCircle}>
            <span style={styles.scoreNumber}>{accountability.score || 0}</span>
            <span style={styles.scorePercent}>%</span>
          </div>
          <div style={styles.scoreInfo}>
            <div style={styles.scoreTitle}>Plan Completion</div>
            <div style={styles.scoreSubtitle}>Last 30 days</div>
          </div>
        </div>
        {streak > 0 && (
          <div style={styles.streakBadge}>
            <span>🔥</span>
            <span style={styles.streakText}>{streak} day streak</span>
          </div>
        )}
        <div style={styles.accountabilityBar}>
          <div style={{ ...styles.accountabilityFill, width: `${accountability.score || 0}%` }} />
        </div>
      </section>

      {/* Next Actions */}
      <section style={styles.card}>
        <div style={styles.cardLabel}>NEXT UP</div>
        {nextActions.length === 0 ? (
          <p style={styles.emptyText}>You're all caught up!</p>
        ) : (
          <div style={styles.actionsList}>
            {nextActions.slice(0, 4).map((action, i) => (
              <div key={i} style={styles.actionItem}>
                <div style={styles.actionDot} />
                <div style={styles.actionContent}>
                  <div style={styles.actionTitle}>{action.title}</div>
                  <div style={styles.actionWhen}>{action.when}</div>
                </div>
                {action.type === 'check_in' && (
                  <button style={styles.actionButton} onClick={onCheckIn}>Start</button>
                )}
                {action.type === 'log' && (
                  <button style={styles.actionButton} onClick={onSwitchToTrack}>Log</button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Weekly Check-in CTA */}
      {patient?.needs_check_in && (
        <button style={styles.checkInCta} onClick={onCheckIn}>
          <span>📋</span>
          <span>Complete Weekly Check-in</span>
          <span style={styles.checkInCtaTime}>2 min</span>
        </button>
      )}
    </>
  );
}

// ============================================
// TRACK TAB - Injection Calendar
// ============================================
function TrackTab({ patient, onToggle, token, onRefresh }) {
  const blocks = patient?.plan_blocks || [];
  const [selectedBlock, setSelectedBlock] = useState(null);

  useEffect(() => {
    if (blocks.length > 0 && !selectedBlock) {
      setSelectedBlock(blocks[0]);
    }
  }, [blocks]);

  if (blocks.length === 0) {
    return (
      <section style={styles.card}>
        <div style={styles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>No Active Plan</h3>
          <p style={{ margin: 0, color: '#666' }}>Your care team is setting up your treatment plan.</p>
        </div>
      </section>
    );
  }

  const currentBlock = selectedBlock || blocks[0];
  const injectionDays = generateInjectionDays(currentBlock);

  return (
    <>
      {/* Block Selector */}
      {blocks.length > 1 && (
        <div style={styles.blockSelector}>
          {blocks.map(block => (
            <button
              key={block.id}
              onClick={() => setSelectedBlock(block)}
              style={currentBlock?.id === block.id ? styles.blockTabActive : styles.blockTab}
            >
              {block.name}
            </button>
          ))}
        </div>
      )}

      {/* Current Block Info */}
      <section style={styles.card}>
        <div style={styles.blockInfo}>
          <div>
            <div style={styles.blockName}>{currentBlock.name}</div>
            {currentBlock.dose && <div style={styles.blockDose}>{currentBlock.dose}</div>}
            <div style={styles.blockFreq}>{formatFrequency(currentBlock.frequency)}</div>
          </div>
          <div style={styles.blockStats}>
            <div style={styles.blockStatValue}>
              {currentBlock.sessions_completed || 0}/{currentBlock.total_sessions || currentBlock.total_days || '?'}
            </div>
            <div style={styles.blockStatLabel}>Completed</div>
          </div>
        </div>
      </section>

      {/* Injection Calendar */}
      <section style={styles.card}>
        <div style={styles.cardLabel}>YOUR CALENDAR</div>
        <div style={styles.calendar}>
          {injectionDays.map((day, i) => (
            <button
              key={i}
              onClick={() => {
                if (!day.future) {
                  onToggle(currentBlock.id, day.dayNumber, day.completed);
                }
              }}
              disabled={day.future}
              style={{
                ...styles.calendarDay,
                background: day.completed ? '#000' : day.future ? '#fafafa' : '#fff',
                color: day.completed ? '#fff' : day.future ? '#ccc' : '#000',
                borderColor: day.today ? '#000' : day.completed ? '#000' : '#e5e5e5',
                borderWidth: day.today ? '2px' : '1px',
                cursor: day.future ? 'default' : 'pointer',
                opacity: day.future ? 0.5 : 1
              }}
            >
              <span style={styles.calendarDayLabel}>{day.label}</span>
              {day.completed && <span style={styles.calendarCheck}>✓</span>}
            </button>
          ))}
        </div>
        <p style={styles.calendarHint}>Tap to mark complete</p>
      </section>

      {/* Peptide Info */}
      {currentBlock.description && (
        <section style={styles.card}>
          <div style={styles.cardLabel}>ABOUT {currentBlock.name?.toUpperCase()}</div>
          <p style={styles.peptideInfo}>{currentBlock.description}</p>
        </section>
      )}
    </>
  );
}

// ============================================
// PROGRESS TAB
// ============================================
function ProgressTab({ patient }) {
  const progress = patient?.progress || {};
  const hasProgress = Object.keys(progress).length > 0;

  if (!hasProgress) {
    return (
      <section style={styles.card}>
        <div style={styles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Track Your Progress</h3>
          <p style={{ margin: 0, color: '#666' }}>Complete weekly check-ins to see your improvement over time.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Symptom Progress */}
      {progress.symptoms && Object.keys(progress.symptoms).length > 0 && (
        <section style={styles.card}>
          <div style={styles.cardLabel}>HOW YOU FEEL</div>
          <div style={styles.progressList}>
            {Object.entries(progress.symptoms).map(([key, data]) => (
              <ProgressRow
                key={key}
                label={formatSymptomLabel(key)}
                start={data.baseline}
                current={data.current}
                max={10}
              />
            ))}
          </div>
        </section>
      )}

      {/* Weight Progress */}
      {progress.weight && (
        <section style={styles.card}>
          <div style={styles.cardLabel}>WEIGHT</div>
          <div style={styles.weightProgress}>
            <div style={styles.weightMain}>
              <span style={styles.weightLost}>
                {Math.abs(progress.weight.current - progress.weight.start).toFixed(1)}
              </span>
              <span style={styles.weightUnit}>lbs {progress.weight.current < progress.weight.start ? 'lost' : 'gained'}</span>
            </div>
            <div style={styles.weightDetails}>
              <div>Started: {progress.weight.start} lbs</div>
              <div>Current: {progress.weight.current} lbs</div>
            </div>
          </div>
        </section>
      )}

      {/* Lab Progress */}
      {progress.labs && progress.labs.length > 0 && (
        <section style={styles.card}>
          <div style={styles.cardLabel}>LAB RESULTS</div>
          <div style={styles.progressList}>
            {progress.labs.map((lab, i) => (
              <ProgressRow
                key={i}
                label={lab.name}
                start={lab.baseline}
                current={lab.current}
                unit={lab.unit}
                higherIsBetter={lab.higher_is_better}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// ============================================
// COMPONENTS
// ============================================

function ProgressRow({ label, start, current, max, unit, higherIsBetter = true }) {
  const diff = current - start;
  const isGood = higherIsBetter ? diff > 0 : diff < 0;
  const pctChange = start !== 0 ? Math.round((Math.abs(diff) / start) * 100) : 0;

  return (
    <div style={styles.progressRow}>
      <div style={styles.progressLabel}>{label}</div>
      <div style={styles.progressValues}>
        <span style={styles.progressStart}>{start}{unit ? ` ${unit}` : ''}</span>
        <span style={styles.progressArrow}>→</span>
        <span style={{
          ...styles.progressCurrent,
          color: diff === 0 ? '#666' : isGood ? '#16a34a' : '#dc2626'
        }}>
          {current}{unit ? ` ${unit}` : ''}
        </span>
        {pctChange > 0 && (
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '600',
            color: isGood ? '#16a34a' : '#dc2626',
            marginLeft: '8px'
          }}>
            {isGood ? '↑' : '↓'}{pctChange}%
          </span>
        )}
      </div>
    </div>
  );
}

function CheckInModal({ data, onChange, onSave, onClose, saving }) {
  const symptoms = [
    { key: 'energy', label: 'Energy', low: 'Exhausted', high: 'Energized' },
    { key: 'sleep', label: 'Sleep', low: 'Poor', high: 'Great' },
    { key: 'mood', label: 'Mood', low: 'Low', high: 'Excellent' },
    { key: 'brain_fog', label: 'Mental Clarity', low: 'Foggy', high: 'Sharp' },
    { key: 'pain', label: 'Pain', low: 'Severe', high: 'None' },
    { key: 'libido', label: 'Libido', low: 'Low', high: 'High' }
  ];

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Weekly Check-in</h2>
          <p style={styles.modalSubtitle}>How are you feeling?</p>
        </div>
        <div style={styles.modalContent}>
          {symptoms.map(s => (
            <div key={s.key} style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span>{s.label}</span>
                <span style={{ fontWeight: '700' }}>{data[s.key]}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={data[s.key]}
                onChange={e => onChange({ ...data, [s.key]: parseInt(e.target.value) })}
              />
              <div style={styles.sliderLabels}>
                <span>{s.low}</span>
                <span>{s.high}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.modalCancel} onClick={onClose}>Cancel</button>
          <button style={styles.modalSave} onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function generateInjectionDays(block) {
  const days = [];
  const totalDays = block.total_sessions || block.total_days || 10;
  const startDate = block.start_date ? new Date(block.start_date) : new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedDays = new Set(block.completed_days || []);

  for (let i = 1; i <= totalDays; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i - 1);
    dayDate.setHours(0, 0, 0, 0);

    days.push({
      dayNumber: i,
      label: `Day ${i}`,
      completed: completedDays.has(i) || (block.injection_logs || []).some(l => l.day_number === i && l.completed),
      today: dayDate.getTime() === today.getTime(),
      future: dayDate > today
    });
  }

  return days;
}

function formatFrequency(freq) {
  const map = {
    daily: 'Once daily',
    twice_daily: 'Twice daily',
    weekly: 'Once weekly',
    '2x_weekly': '2x per week',
    '3x_weekly': '3x per week',
    '5_on_2_off': '5 days on, 2 off',
    as_needed: 'As needed'
  };
  return map[freq] || freq || '';
}

function formatSymptomLabel(key) {
  const map = {
    energy: 'Energy', energy_score: 'Energy',
    sleep: 'Sleep', sleep_score: 'Sleep',
    mood: 'Mood', mood_score: 'Mood',
    brain_fog: 'Mental Clarity', brain_fog_score: 'Mental Clarity',
    pain: 'Pain', pain_score: 'Pain',
    libido: 'Libido', libido_score: 'Libido'
  };
  return map[key] || key;
}

// ============================================
// STYLES
// ============================================

const styles = {
  container: { minHeight: '100vh', background: '#fafafa', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: '80px' },
  
  loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingDot: { width: '12px', height: '12px', background: '#000', borderRadius: '50%' },
  
  errorContainer: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' },
  errorIcon: { fontSize: '48px', marginBottom: '16px' },
  errorTitle: { fontSize: '20px', fontWeight: '600', margin: '0 0 8px' },
  errorText: { fontSize: '15px', color: '#666', margin: '4px 0' },
  
  header: { background: '#000', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: '18px', fontWeight: '700', letterSpacing: '2px' },
  greeting: { fontSize: '15px', opacity: 0.9 },
  
  tabs: { display: 'flex', background: '#fff', borderBottom: '1px solid #e5e5e5' },
  tab: { flex: 1, padding: '14px', background: 'none', border: 'none', fontSize: '14px', fontWeight: '500', color: '#666', cursor: 'pointer' },
  tabActive: { flex: 1, padding: '14px', background: 'none', border: 'none', borderBottom: '2px solid #000', fontSize: '14px', fontWeight: '600', color: '#000', cursor: 'pointer' },
  
  main: { padding: '16px', maxWidth: '600px', margin: '0 auto' },
  
  card: { background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  cardLabel: { fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', color: '#999', marginBottom: '16px' },
  
  // Onboarding prompt
  onboardPrompt: { textAlign: 'center', padding: '16px 0' },
  onboardIcon: { fontSize: '40px', marginBottom: '12px' },
  onboardTitle: { fontSize: '20px', fontWeight: '700', margin: '0 0 8px' },
  onboardText: { fontSize: '15px', color: '#666', margin: '0 0 20px', lineHeight: 1.5 },
  onboardButton: { display: 'inline-block', padding: '14px 32px', background: '#000', color: '#fff', textDecoration: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600' },
  
  // Goals
  goalTags: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' },
  goalTag: { background: '#f0f0f0', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '500' },
  whyText: { fontSize: '17px', fontWeight: '500', fontStyle: 'italic', color: '#333', margin: '0 0 16px', lineHeight: 1.5 },
  importanceRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  importanceLabel: { fontSize: '13px', color: '#666' },
  importanceBar: { flex: 1, height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' },
  importanceFill: { height: '100%', background: '#000', borderRadius: '3px' },
  importanceValue: { fontSize: '13px', fontWeight: '600' },
  
  // Accountability
  accountabilityMain: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' },
  scoreCircle: { width: '80px', height: '80px', borderRadius: '50%', background: '#000', color: '#fff', display: 'flex', alignItems: 'baseline', justifyContent: 'center' },
  scoreNumber: { fontSize: '32px', fontWeight: '700' },
  scorePercent: { fontSize: '14px', opacity: 0.7 },
  scoreInfo: { flex: 1 },
  scoreTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '4px' },
  scoreSubtitle: { fontSize: '13px', color: '#666' },
  streakBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', padding: '8px 14px', borderRadius: '20px', marginBottom: '16px' },
  streakText: { fontSize: '13px', fontWeight: '600', color: '#b45309' },
  accountabilityBar: { height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' },
  accountabilityFill: { height: '100%', background: '#000', borderRadius: '4px' },
  
  // Actions
  actionsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  actionItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#fafafa', borderRadius: '10px' },
  actionDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#000' },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: '14px', fontWeight: '500' },
  actionWhen: { fontSize: '12px', color: '#666' },
  actionButton: { padding: '8px 14px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  
  checkInCta: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px', background: '#000', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  checkInCtaTime: { fontSize: '12px', opacity: 0.7 },
  
  emptyText: { fontSize: '14px', color: '#999', fontStyle: 'italic', margin: 0 },
  emptyState: { textAlign: 'center', padding: '24px 0' },
  
  // Track tab
  blockSelector: { display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' },
  blockTab: { padding: '10px 16px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' },
  blockTabActive: { padding: '10px 16px', background: '#000', color: '#fff', border: '1px solid #000', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  
  blockInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  blockName: { fontSize: '18px', fontWeight: '700', marginBottom: '4px' },
  blockDose: { fontSize: '14px', color: '#666', marginBottom: '2px' },
  blockFreq: { fontSize: '13px', color: '#999' },
  blockStats: { textAlign: 'right' },
  blockStatValue: { fontSize: '24px', fontWeight: '700' },
  blockStatLabel: { fontSize: '12px', color: '#666' },
  
  calendar: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' },
  calendarDay: { aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid', fontSize: '12px', fontWeight: '600' },
  calendarDayLabel: { fontSize: '11px' },
  calendarCheck: { fontSize: '14px', marginTop: '2px' },
  calendarHint: { fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '12px' },
  
  peptideInfo: { fontSize: '14px', color: '#666', lineHeight: 1.6, margin: 0 },
  
  // Progress
  progressList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  progressRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: '14px', fontWeight: '500' },
  progressValues: { display: 'flex', alignItems: 'center', gap: '6px' },
  progressStart: { fontSize: '14px', color: '#999' },
  progressArrow: { fontSize: '12px', color: '#ccc' },
  progressCurrent: { fontSize: '16px', fontWeight: '600' },
  
  weightProgress: { textAlign: 'center' },
  weightMain: { marginBottom: '12px' },
  weightLost: { fontSize: '48px', fontWeight: '700' },
  weightUnit: { fontSize: '16px', color: '#666', marginLeft: '8px' },
  weightDetails: { fontSize: '14px', color: '#666', display: 'flex', justifyContent: 'center', gap: '24px' },
  
  // Footer
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0' },
  footerLink: { color: '#666', textDecoration: 'none', fontSize: '14px' },
  footerDivider: { margin: '0 16px', color: '#ddd' },
  
  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { padding: '24px 24px 16px', borderBottom: '1px solid #f0f0f0' },
  modalTitle: { fontSize: '20px', fontWeight: '700', margin: '0 0 4px' },
  modalSubtitle: { fontSize: '14px', color: '#666', margin: 0 },
  modalContent: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  sliderGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sliderHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '15px' },
  sliderLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#999' },
  modalFooter: { padding: '16px 24px 32px', display: 'flex', gap: '12px', borderTop: '1px solid #f0f0f0' },
  modalCancel: { flex: 1, padding: '14px', background: '#f5f5f5', color: '#333', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  modalSave: { flex: 2, padding: '14px', background: '#000', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }
};
