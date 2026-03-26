// pages/rlt-trial/survey.jsx
// Mobile/tablet-friendly survey form for RLT trial
// Pre-survey: energy, brain fog, recovery, sleep, stress (0-10), labs, want_fix
// Post-survey: same 5 scales + "what did you notice?"
// Range Medical

import Layout from '../../components/Layout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const SCALES = [
  { key: 'energy', label: 'Energy Level', description: '0 = exhausted, 10 = fully energized' },
  { key: 'brain_fog', label: 'Brain Fog', description: '0 = crystal clear, 10 = very foggy' },
  { key: 'recovery', label: 'Recovery', description: '0 = poor recovery, 10 = bounce back fast' },
  { key: 'sleep', label: 'Sleep Quality', description: '0 = terrible sleep, 10 = great sleep' },
  { key: 'stress', label: 'Stress Level', description: '0 = very relaxed, 10 = very stressed' },
];

function ScaleInput({ label, description, value, onChange }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ fontSize: 15, fontWeight: 600, color: '#171717' }}>{label}</label>
        <span style={{ fontSize: 24, fontWeight: 700, color: value !== null ? '#dc2626' : '#d4d4d4', minWidth: 32, textAlign: 'right' }}>
          {value !== null ? value : '—'}
        </span>
      </div>
      <p style={{ fontSize: 13, color: '#737373', margin: '0 0 10px' }}>{description}</p>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              flex: 1,
              padding: '12px 0',
              border: value === n ? '2px solid #dc2626' : '1px solid #d4d4d4',
              background: value === n ? '#dc2626' : '#fff',
              color: value === n ? '#fff' : '#171717',
              fontSize: 14,
              fontWeight: value === n ? 700 : 400,
              cursor: 'pointer',
              borderRadius: 0,
              fontFamily: 'inherit',
              minHeight: 44,
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TrialSurvey() {
  const router = useRouter();
  const { trial_id, type } = router.query;
  const surveyType = type === 'post' ? 'post' : 'pre';
  const isPre = surveyType === 'pre';

  const [trialName, setTrialName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [trialId, setTrialId] = useState(null);

  // Scale values
  const [energy, setEnergy] = useState(null);
  const [brainFog, setBrainFog] = useState(null);
  const [recovery, setRecovery] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [stress, setStress] = useState(null);

  // Pre-survey extras
  const [labsPast12Mo, setLabsPast12Mo] = useState(null);
  const [wantFix90d, setWantFix90d] = useState(null);

  // Post-survey extras
  const [noticedNotes, setNoticedNotes] = useState('');

  useEffect(() => {
    if (!trial_id) return;
    setTrialId(trial_id);

    fetch(`/api/trial/get-trial?id=${trial_id}`)
      .then(r => r.json())
      .then(data => {
        if (data.trial?.first_name) {
          setTrialName(data.trial.first_name);
        }
      })
      .catch(() => {});
  }, [trial_id]);

  const allScalesFilled = energy !== null && brainFog !== null && recovery !== null && sleep !== null && stress !== null;
  const preExtrasFilledOrPost = !isPre || (labsPast12Mo !== null && wantFix90d !== null);
  const canSubmit = allScalesFilled && preExtrasFilledOrPost;

  const handleSubmit = async () => {
    if (!canSubmit || !trialId) return;
    setSubmitting(true);
    setError('');

    try {
      const body = {
        trialId,
        surveyType,
        energy,
        brain_fog: brainFog,
        recovery,
        sleep,
        stress,
      };

      if (isPre) {
        body.labs_past_12mo = labsPast12Mo;
        body.want_fix_90d = wantFix90d;
      } else {
        body.noticed_notes = noticedNotes || null;
      }

      const res = await fetch('/api/trial/submit-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!router.isReady) {
    return <Layout title="Loading... | Range Medical"><div style={{ textAlign: 'center', padding: '120px 20px' }}><p style={{ color: '#737373' }}>Loading...</p></div></Layout>;
  }

  return (
    <Layout title={`${isPre ? 'Energy Survey' : 'Post-Trial Check-In'} | Range Medical`}>
      <Head><meta name="robots" content="noindex, nofollow" /></Head>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '72px 20px 80px', color: '#171717' }}>

        {/* SUBMITTED */}
        {submitted && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, background: '#22c55e', borderRadius: '50%', marginBottom: 20 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>

              {isPre ? (
                <>
                  <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>All set{trialName ? `, ${trialName}` : ''}!</h1>
                  <p style={{ fontSize: 16, color: '#525252', margin: '0 0 32px', lineHeight: 1.6 }}>
                    Your energy baseline is recorded. Come in for your first Red Light session anytime this week — walk-ins welcome during clinic hours.
                  </p>
                  <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', padding: 24, marginBottom: 24, textAlign: 'left' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Clinic hours:</p>
                    <p style={{ fontSize: 14, color: '#525252', margin: '0 0 4px' }}>Mon–Fri: 9am – 5pm</p>
                    <p style={{ fontSize: 14, color: '#525252', margin: '0 0 12px' }}>Sat: 9am – 1pm</p>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Location:</p>
                    <p style={{ fontSize: 14, color: '#525252', margin: 0 }}>1901 Westcliff Drive, Suite 10, Newport Beach</p>
                  </div>
                </>
              ) : (
                <>
                  <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Thanks{trialName ? `, ${trialName}` : ''}!</h1>
                  <p style={{ fontSize: 16, color: '#525252', margin: '0 0 32px', lineHeight: 1.6 }}>
                    Your responses are recorded. We'll go over your results at your check-in and talk about the best next step for you.
                  </p>
                </>
              )}
            </div>

            <p style={{ textAlign: 'center', fontSize: 14, color: '#737373' }}>
              Questions? Call/text <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600, textDecoration: 'none' }}>(949) 997-3988</a>
            </p>
          </>
        )}

        {/* SURVEY FORM */}
        {!submitted && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <span style={{ display: 'inline-block', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 14px', borderRadius: 0, marginBottom: 12 }}>
                {isPre ? 'Energy Baseline' : 'Post-Trial Check-In'}
              </span>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
                {isPre ? 'Quick Energy Survey' : 'How are you feeling now?'}
              </h1>
              <p style={{ fontSize: 15, color: '#525252', margin: 0 }}>
                {isPre
                  ? 'Rate each area so we can track your progress. Takes about 60 seconds.'
                  : 'Rate each area again so we can see what changed this week.'}
              </p>
            </div>

            {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{error}</div>}

            {SCALES.map(scale => (
              <ScaleInput
                key={scale.key}
                label={scale.label}
                description={scale.description}
                value={
                  scale.key === 'energy' ? energy :
                  scale.key === 'brain_fog' ? brainFog :
                  scale.key === 'recovery' ? recovery :
                  scale.key === 'sleep' ? sleep :
                  stress
                }
                onChange={val => {
                  if (scale.key === 'energy') setEnergy(val);
                  else if (scale.key === 'brain_fog') setBrainFog(val);
                  else if (scale.key === 'recovery') setRecovery(val);
                  else if (scale.key === 'sleep') setSleep(val);
                  else setStress(val);
                }}
              />
            ))}

            {/* Pre-survey extras */}
            {isPre && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#171717', marginBottom: 10 }}>
                    Have you had blood work done in the past 12 months?
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map(opt => (
                      <button
                        key={String(opt.val)}
                        type="button"
                        onClick={() => setLabsPast12Mo(opt.val)}
                        style={{
                          flex: 1, padding: '14px 0',
                          border: labsPast12Mo === opt.val ? '2px solid #dc2626' : '1px solid #d4d4d4',
                          background: labsPast12Mo === opt.val ? '#dc2626' : '#fff',
                          color: labsPast12Mo === opt.val ? '#fff' : '#171717',
                          fontSize: 15, fontWeight: 600, cursor: 'pointer', borderRadius: 0,
                          fontFamily: 'inherit', minHeight: 48,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#171717', marginBottom: 10 }}>
                    Do you want to fix this in the next 90 days?
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[{ val: true, label: 'Yes' }, { val: false, label: 'Not right now' }].map(opt => (
                      <button
                        key={String(opt.val)}
                        type="button"
                        onClick={() => setWantFix90d(opt.val)}
                        style={{
                          flex: 1, padding: '14px 0',
                          border: wantFix90d === opt.val ? '2px solid #dc2626' : '1px solid #d4d4d4',
                          background: wantFix90d === opt.val ? '#dc2626' : '#fff',
                          color: wantFix90d === opt.val ? '#fff' : '#171717',
                          fontSize: 15, fontWeight: 600, cursor: 'pointer', borderRadius: 0,
                          fontFamily: 'inherit', minHeight: 48,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Post-survey extras */}
            {!isPre && (
              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#171717', marginBottom: 6 }}>
                  What, if anything, did you notice this week?
                </label>
                <p style={{ fontSize: 13, color: '#737373', margin: '0 0 10px' }}>Optional — anything you felt or noticed</p>
                <textarea
                  value={noticedNotes}
                  onChange={e => setNoticedNotes(e.target.value)}
                  placeholder="e.g., better sleep, less soreness, more energy in the afternoon..."
                  rows={4}
                  style={{
                    width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0,
                    fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical',
                  }}
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              style={{
                width: '100%', padding: 16,
                background: canSubmit ? '#dc2626' : '#d4d4d4',
                color: '#fff', border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600,
                cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
                opacity: submitting ? 0.6 : 1, fontFamily: 'inherit',
              }}
            >
              {submitting ? 'Submitting...' : isPre ? 'Submit & Continue' : 'Submit Check-In'}
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
