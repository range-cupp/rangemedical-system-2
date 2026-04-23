// pages/rlt-trial.jsx
// Free Red Light single-session opt-in with BANT qualification.
// Flow: 4-step form (contact → struggle → importance → budget) → confirmation.
// Range Medical

import Layout from '../components/Layout';
import Head from 'next/head';
import Script from 'next/script';
import { useState, useRef } from 'react';
import { useRouter } from 'next/router';

const META_PIXEL_ID = '4295373617400545';

const ACCENT = '#dc2626';
const ACCENT_BG = '#fef2f2';

const STRUGGLE_OPTIONS = [
  { value: 'skin',        label: 'Skin / inflammation / scars' },
  { value: 'recovery',    label: 'Slow recovery / soreness' },
  { value: 'pain',        label: 'Joint or muscle pain' },
  { value: 'sleep',       label: 'Sleep' },
  { value: 'mood',        label: 'Mood / stress' },
  { value: 'energy',      label: 'Low energy' },
  { value: 'other',       label: 'Other' },
];

const BUDGET_OPTIONS = [
  { value: 'single',     label: 'Single sessions — one at a time' },
  { value: 'pack',       label: 'A pack (5 or 10 sessions)' },
  { value: 'membership', label: 'Monthly membership' },
  { value: 'exploring',  label: 'Just exploring for now' },
];

const RLT_PLANS = [
  { name: 'Single Session',              price: '$85',     discounted: '$63.75' },
  { name: '5-Pack',                      price: '$375',    discounted: '$281.25',   per: '$75/session' },
  { name: '10-Pack',                     price: '$600',    discounted: '$450',      per: '$60/session' },
  { name: 'Membership — 4 sessions/mo',  price: '$399/mo', discounted: '$299.25/mo', per: '$100/session', note: '3-month commitment' },
  { name: 'Membership — 8 sessions/mo',  price: '$399/mo', discounted: '$299.25/mo', per: '$50/session',  note: '3-month commitment' },
  { name: 'Membership — 12 sessions/mo', price: '$399/mo', discounted: '$299.25/mo', per: '$33/session',  note: '3-month commitment' },
];

export default function RLTTrial() {
  const router = useRouter();
  const formRef = useRef(null);

  const [contact, setContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    consent: false,
  });
  const [story, setStory] = useState({
    struggle_main: '',
    struggle_other: '',
    bad_day_description: '',
  });
  const [importance, setImportance] = useState(7);
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [topError, setTopError] = useState('');
  const [done, setDone] = useState(false);
  const [leadTier, setLeadTier] = useState(null);

  const source = router.query.src || router.query.source || 'direct';

  const clearFieldError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const next = {};
    if (!contact.firstName.trim()) next.firstName = 'Please enter your first name.';
    if (!contact.lastName.trim())  next.lastName  = 'Please enter your last name.';
    if (!contact.phone.trim())     next.phone     = 'Please enter your mobile phone.';
    if (!contact.email.trim())     next.email     = 'Please enter your email.';
    if (!contact.consent)          next.consent   = 'You’ll need to check this box to continue.';
    if (!story.struggle_main)      next.struggle_main = 'Please pick one.';
    if (story.struggle_main === 'other' && !story.struggle_other.trim()) {
      next.struggle_other = 'Tell us a bit more.';
    }
    if (!story.bad_day_description.trim()) next.bad_day_description = 'Please answer this one.';
    if (!budget) next.budget = 'Please pick one.';

    if (Object.keys(next).length > 0) {
      setErrors(next);
      setTopError(`Please answer the ${Object.keys(next).length} highlighted question${Object.keys(next).length === 1 ? '' : 's'} below.`);
      setTimeout(() => {
        const first = document.querySelector('.fs-has-error, [data-field-error="true"]');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setErrors({});
    setTopError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/free-session/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trialType: 'rlt',
          firstName: contact.firstName.trim(),
          lastName: contact.lastName.trim(),
          email: contact.email.trim().toLowerCase(),
          phone: contact.phone.trim(),
          consentMarketing: contact.consent,
          struggleMain: story.struggle_main,
          struggleOther: story.struggle_main === 'other' ? story.struggle_other.trim() : null,
          badDayDescription: story.bad_day_description.trim(),
          importance90d: Number(importance),
          budgetAnswer: budget,
          source,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      const data = await res.json();
      if (typeof fbq === 'function') {
        fbq('track', 'Lead', { content_name: 'rlt-free-session' });
      }
      setLeadTier(data.leadTier || null);
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Free RLT session submit error:', err);
      setTopError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Layout
      title="Free Red Light Therapy Session | Range Medical"
      description="Come try a free red light therapy session at Range Medical in Newport Beach. One session on us so you can feel what RLT is actually like."
    >
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        <style>{`
          .fs-page { color: #171717; }

          .fs-hero {
            padding: 6rem 2rem 2rem;
            max-width: 720px;
            margin: 0 auto;
          }
          .fs-eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: ${ACCENT};
            margin: 0 0 14px;
          }
          .fs-hero h1 {
            font-size: clamp(2.25rem, 5.5vw, 3.5rem);
            font-weight: 900;
            line-height: 0.98;
            margin: 0 0 20px;
            letter-spacing: -0.02em;
            text-transform: uppercase;
          }
          .fs-hero-rule {
            width: 100%;
            height: 1px;
            background: #e0e0e0;
            margin: 20px 0;
          }
          .fs-hero p {
            font-size: 17px;
            color: #404040;
            line-height: 1.6;
            margin: 0 0 14px;
          }
          .fs-highlight-box {
            background: ${ACCENT_BG};
            border-left: 3px solid ${ACCENT};
            padding: 20px 24px;
            margin: 24px 0 0;
          }
          .fs-highlight-box strong {
            display: block;
            font-size: 13px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-bottom: 6px;
            color: ${ACCENT};
          }
          .fs-highlight-box p {
            font-size: 15px;
            margin: 0;
            color: #404040;
            line-height: 1.55;
          }

          .fs-form-section {
            max-width: 680px;
            margin: 0 auto;
            padding: 32px 2rem 6rem;
          }
          .fs-step {
            background: #fff;
            border: 1px solid #e0e0e0;
            padding: 32px 28px;
            margin-bottom: 16px;
          }
          .fs-step-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #a3a3a3;
            margin: 0 0 4px;
          }
          .fs-step h2 {
            font-size: 22px;
            font-weight: 700;
            line-height: 1.3;
            margin: 0 0 20px;
          }
          .fs-field { margin-bottom: 18px; }
          .fs-field label.fs-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #525252;
            margin-bottom: 6px;
          }
          .fs-field input[type="text"],
          .fs-field input[type="email"],
          .fs-field input[type="tel"],
          .fs-field textarea {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid #e0e0e0;
            font-size: 15px;
            font-family: inherit;
            background: #fff;
            transition: border-color 0.2s;
            box-sizing: border-box;
            color: #171717;
          }
          .fs-field textarea {
            min-height: 96px;
            resize: vertical;
            line-height: 1.5;
          }
          .fs-field input:focus,
          .fs-field textarea:focus {
            outline: none;
            border-color: ${ACCENT};
          }

          .fs-two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          @media (max-width: 480px) {
            .fs-two-col { grid-template-columns: 1fr; }
          }

          .fs-consent {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin: 20px 0 4px;
          }
          .fs-consent input[type="checkbox"] {
            margin-top: 0;
            width: 22px;
            height: 22px;
            min-width: 22px;
            min-height: 22px;
            accent-color: ${ACCENT};
            flex-shrink: 0;
          }
          .fs-consent label {
            font-size: 13px;
            color: #525252;
            line-height: 1.5;
          }

          .fs-option {
            display: block;
            width: 100%;
            padding: 14px 16px;
            border: 1px solid #e0e0e0;
            background: #fff;
            font-size: 15px;
            font-weight: 500;
            color: #171717;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 8px;
            font-family: inherit;
          }
          .fs-option:hover {
            border-color: ${ACCENT};
            background: #fafafa;
          }
          .fs-option.selected {
            border-color: ${ACCENT};
            background: ${ACCENT_BG};
          }

          .fs-slider-wrap { padding: 8px 0 4px; }
          .fs-slider-value {
            font-size: 48px;
            font-weight: 900;
            text-align: center;
            margin: 4px 0 12px;
            letter-spacing: -0.02em;
            color: ${ACCENT};
          }
          .fs-slider-labels {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #737373;
            margin-bottom: 10px;
          }
          .fs-slider {
            width: 100%;
            accent-color: ${ACCENT};
          }

          .fs-btn {
            width: 100%;
            padding: 18px;
            background: ${ACCENT};
            color: #fff;
            border: none;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.2s;
            font-family: inherit;
          }
          .fs-btn:hover:not(:disabled) { background: #b91c1c; }
          .fs-btn:disabled { opacity: 0.5; cursor: not-allowed; }

          .fs-error {
            background: #FEF2F2;
            color: #DC2626;
            padding: 12px 16px;
            font-size: 14px;
            margin-bottom: 16px;
            border-left: 3px solid #DC2626;
          }
          .fs-field input.fs-has-error,
          .fs-field textarea.fs-has-error {
            border-color: #DC2626;
            background: #FEF2F2;
          }
          .fs-options-error {
            border-left: 3px solid #DC2626;
            background: #FEF2F2;
            padding: 10px 10px 2px;
            margin: 0 0 4px;
          }
          .fs-consent.fs-has-error {
            border-left: 3px solid #DC2626;
            background: #FEF2F2;
            padding: 10px 12px;
            margin: 20px 0 4px;
          }
          .fs-field-errmsg {
            color: #DC2626;
            font-size: 13px;
            font-weight: 600;
            margin-top: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .fs-field-errmsg::before {
            content: "!";
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            background: #DC2626;
            color: #fff;
            border-radius: 50%;
            font-size: 11px;
            font-weight: 700;
            flex-shrink: 0;
          }
          .fs-fineprint {
            font-size: 12px;
            color: #737373;
            line-height: 1.5;
            margin: 16px 0 0;
            text-align: center;
          }

          .fs-done {
            max-width: 560px;
            margin: 0 auto;
            padding: 6rem 2rem 4rem;
            text-align: center;
          }
          .fs-done-check {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 72px;
            height: 72px;
            background: ${ACCENT};
            border-radius: 50%;
            margin-bottom: 20px;
          }
          .fs-done h1 {
            font-size: clamp(1.75rem, 4.5vw, 2.25rem);
            font-weight: 900;
            margin: 0 0 12px;
            letter-spacing: -0.02em;
          }
          .fs-done p {
            font-size: 16px;
            color: #525252;
            line-height: 1.6;
            margin: 0 0 12px;
          }
          .fs-next {
            text-align: left;
            background: #fafafa;
            border: 1px solid #e5e5e5;
            padding: 24px;
            margin-top: 28px;
          }
          .fs-next h3 {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #737373;
            margin: 0 0 14px;
          }
          .fs-next ol {
            margin: 0;
            padding-left: 20px;
            color: #404040;
            font-size: 15px;
            line-height: 1.7;
          }
        `}</style>
      </Head>

      <div className="fs-page">
        {!done ? (
          <>
            <section className="fs-hero">
              <p className="fs-eyebrow">Free Session · Newport Beach</p>
              <h1>Try a Red Light Session On Us</h1>
              <div className="fs-hero-rule" />
              <p>
                We’ll give you a free 20-minute full-body red light session so you
                can feel what it’s actually like — no payment, no pressure.
              </p>
              <p>
                <strong>One session isn’t going to be life-changing on its own.</strong>{' '}
                Real change with red light comes from consistency over a few weeks. But one
                session will give you a real feel for it, and from there we can talk about
                whether continuing makes sense for what you’re working on.
              </p>

              <div className="fs-highlight-box">
                <strong>Bonus: 25% off your first plan</strong>
                <p>
                  If red light turns out to be a fit, we’ll take 25% off any plan
                  you purchase within 7 days of completing your free session. No
                  pressure — the offer’s there if it’s right for you.
                </p>
              </div>

              <div className="fs-highlight-box">
                <strong>How this works</strong>
                <p>
                  Fill out the short form below (about 2 minutes). We’ll text you
                  within a business day to pick a time that works for your schedule.
                </p>
              </div>
            </section>

            <section className="fs-form-section">
              <form ref={formRef} onSubmit={handleSubmit}>
                {/* Step 1 — contact */}
                <div className="fs-step">
                  <p className="fs-step-label">Step 1 of 4</p>
                  <h2>Tell us who you are</h2>

                  <div className="fs-two-col" style={{ marginBottom: 18 }}>
                    <div className="fs-field" style={{ margin: 0 }}>
                      <label className="fs-label" htmlFor="fs-first">First name</label>
                      <input
                        id="fs-first"
                        type="text"
                        autoComplete="given-name"
                        className={errors.firstName ? 'fs-has-error' : ''}
                        value={contact.firstName}
                        onChange={(e) => { setContact({ ...contact, firstName: e.target.value }); clearFieldError('firstName'); }}
                      />
                      {errors.firstName && <div className="fs-field-errmsg">{errors.firstName}</div>}
                    </div>
                    <div className="fs-field" style={{ margin: 0 }}>
                      <label className="fs-label" htmlFor="fs-last">Last name</label>
                      <input
                        id="fs-last"
                        type="text"
                        autoComplete="family-name"
                        className={errors.lastName ? 'fs-has-error' : ''}
                        value={contact.lastName}
                        onChange={(e) => { setContact({ ...contact, lastName: e.target.value }); clearFieldError('lastName'); }}
                      />
                      {errors.lastName && <div className="fs-field-errmsg">{errors.lastName}</div>}
                    </div>
                  </div>

                  <div className="fs-field">
                    <label className="fs-label" htmlFor="fs-phone">Mobile phone</label>
                    <input
                      id="fs-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(949) 555-0123"
                      className={errors.phone ? 'fs-has-error' : ''}
                      value={contact.phone}
                      onChange={(e) => { setContact({ ...contact, phone: e.target.value }); clearFieldError('phone'); }}
                    />
                    {errors.phone && <div className="fs-field-errmsg">{errors.phone}</div>}
                  </div>

                  <div className="fs-field">
                    <label className="fs-label" htmlFor="fs-email">Email</label>
                    <input
                      id="fs-email"
                      type="email"
                      autoComplete="email"
                      className={errors.email ? 'fs-has-error' : ''}
                      value={contact.email}
                      onChange={(e) => { setContact({ ...contact, email: e.target.value }); clearFieldError('email'); }}
                    />
                    {errors.email && <div className="fs-field-errmsg">{errors.email}</div>}
                  </div>

                  <div className={`fs-consent${errors.consent ? ' fs-has-error' : ''}`} data-field-error={errors.consent ? 'true' : 'false'}>
                    <input
                      id="fs-consent"
                      type="checkbox"
                      checked={contact.consent}
                      onChange={(e) => { setContact({ ...contact, consent: e.target.checked }); clearFieldError('consent'); }}
                    />
                    <label htmlFor="fs-consent">
                      I agree to receive text and email from Range Medical about
                      scheduling my session and related health offers. Msg &amp; data
                      rates may apply. Reply STOP to opt out.
                    </label>
                  </div>
                  {errors.consent && <div className="fs-field-errmsg">{errors.consent}</div>}
                </div>

                {/* Step 2 — struggle */}
                <div className="fs-step">
                  <p className="fs-step-label">Step 2 of 4</p>
                  <h2>What are you hoping this helps with?</h2>

                  <div className="fs-field" data-field-error={errors.struggle_main ? 'true' : 'false'}>
                    <div className={errors.struggle_main ? 'fs-options-error' : ''}>
                      {STRUGGLE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`fs-option${story.struggle_main === opt.value ? ' selected' : ''}`}
                          onClick={() => { setStory({ ...story, struggle_main: opt.value }); clearFieldError('struggle_main'); }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {errors.struggle_main && <div className="fs-field-errmsg">{errors.struggle_main}</div>}
                  </div>

                  {story.struggle_main === 'other' && (
                    <div className="fs-field">
                      <label className="fs-label" htmlFor="fs-other">Tell us more</label>
                      <input
                        id="fs-other"
                        type="text"
                        className={errors.struggle_other ? 'fs-has-error' : ''}
                        value={story.struggle_other}
                        onChange={(e) => { setStory({ ...story, struggle_other: e.target.value }); clearFieldError('struggle_other'); }}
                      />
                      {errors.struggle_other && <div className="fs-field-errmsg">{errors.struggle_other}</div>}
                    </div>
                  )}

                  <div className="fs-field">
                    <label className="fs-label" htmlFor="fs-badday">
                      In your own words, what does a bad day look like for you?
                    </label>
                    <textarea
                      id="fs-badday"
                      className={errors.bad_day_description ? 'fs-has-error' : ''}
                      value={story.bad_day_description}
                      onChange={(e) => { setStory({ ...story, bad_day_description: e.target.value }); clearFieldError('bad_day_description'); }}
                      placeholder="Be specific — the more we know, the better we can tailor your session and follow-up."
                    />
                    {errors.bad_day_description && <div className="fs-field-errmsg">{errors.bad_day_description}</div>}
                  </div>
                </div>

                {/* Step 3 — importance */}
                <div className="fs-step">
                  <p className="fs-step-label">Step 3 of 4</p>
                  <h2>How important is fixing this in the next 90 days?</h2>

                  <div className="fs-slider-wrap">
                    <div className="fs-slider-value">{importance}</div>
                    <div className="fs-slider-labels">
                      <span>Not urgent</span>
                      <span>Top priority</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={importance}
                      onChange={(e) => setImportance(e.target.value)}
                      className="fs-slider"
                    />
                  </div>
                </div>

                {/* Step 4 — budget */}
                <div className="fs-step">
                  <p className="fs-step-label">Step 4 of 4</p>
                  <h2>If red light turns out to be a fit, what feels most realistic?</h2>
                  <p style={{ fontSize: 14, color: '#737373', margin: '0 0 16px', lineHeight: 1.5 }}>
                    Here are our red light plans so you can see the range. No right
                    answer — we just want to know where you’re at so we don’t offer
                    you something that doesn’t fit.
                  </p>

                  <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', padding: '16px 20px', marginBottom: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#737373', margin: '0 0 12px' }}>
                      Our Red Light plans
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, paddingBottom: 8, borderBottom: '1px solid #e0e0e0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a3a3a3' }}>
                      <span>Plan</span>
                      <span style={{ textAlign: 'right' }}>Regular</span>
                      <span style={{ textAlign: 'right', color: ACCENT }}>25% off*</span>
                    </div>

                    {RLT_PLANS.map((plan, i) => (
                      <div key={plan.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, padding: '10px 0', borderBottom: i < RLT_PLANS.length - 1 ? '1px solid #ececec' : 'none', fontSize: 14, alignItems: 'baseline' }}>
                        <span style={{ color: '#404040' }}>
                          {plan.name}
                          {plan.per && <span style={{ display: 'block', fontSize: 12, color: '#a3a3a3', fontWeight: 400, marginTop: 2 }}>{plan.per}</span>}
                          {plan.note && <span style={{ display: 'block', fontSize: 11, color: '#a3a3a3', fontWeight: 400, fontStyle: 'italic', marginTop: 2 }}>{plan.note}</span>}
                        </span>
                        <span style={{ fontWeight: 600, color: '#171717', whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {plan.price}
                        </span>
                        <span style={{ fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {plan.discounted}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: '#737373', margin: '0 0 20px', lineHeight: 1.5 }}>
                    *25% off applies to any plan purchased within 7 days of completing your free session. Memberships require a 3-month commitment.
                  </p>

                  <div className="fs-field" data-field-error={errors.budget ? 'true' : 'false'}>
                    <div className={errors.budget ? 'fs-options-error' : ''}>
                      {BUDGET_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`fs-option${budget === opt.value ? ' selected' : ''}`}
                          onClick={() => { setBudget(opt.value); clearFieldError('budget'); }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {errors.budget && <div className="fs-field-errmsg">{errors.budget}</div>}
                  </div>

                  {topError && <div className="fs-error">{topError}</div>}

                  <button type="submit" className="fs-btn" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Claim My Free Session'}
                  </button>

                  <p className="fs-fineprint">
                    Newport Beach only. One free session per person.
                  </p>
                </div>
              </form>
            </section>
          </>
        ) : (
          <section className="fs-done">
            <div className="fs-done-check">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1>You’re in, {contact.firstName}!</h1>
            <p>
              Your free red light therapy session is reserved. We’ll text you within
              a business day to pick a time that works.
            </p>
            <p style={{ fontSize: 14, color: '#737373' }}>
              Watch for a text from <strong>(949) 997-3988</strong> so your carrier
              doesn’t filter us.
            </p>

            <div className="fs-next">
              <h3>What happens next</h3>
              <ol>
                <li>We text you to schedule your 20-minute session.</li>
                <li>You come in, we get you set up in the light bed, and you relax.</li>
                <li>Afterward, we check in on how you feel and talk about what a real plan might look like — only if it’s a fit.</li>
                <li><strong>Bonus:</strong> 25% off any plan you purchase within 7 days of completing your session.</li>
              </ol>
            </div>

            <p style={{ marginTop: 24, fontSize: 14, color: '#737373' }}>
              Questions? Call/text{' '}
              <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600, textDecoration: 'none' }}>
                (949) 997-3988
              </a>
            </p>
          </section>
        )}
      </div>
    </Layout>
  );
}
