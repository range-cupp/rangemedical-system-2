// pages/hbot-trial.jsx
// Free Hyperbaric Oxygen single-session landing page.
// Flow: contact form (step 1) → scheduler (step 2).
// Range Medical

import Layout from '../components/Layout';
import Head from 'next/head';
import Script from 'next/script';
import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import FreeSessionScheduler from '../components/FreeSessionScheduler';
import { formatPhone } from '../lib/format-utils';
import { readMetaAttribution, newMetaEventId } from '../lib/meta-pixel-client';

const META_PIXEL_ID = '4295373617400545';
const SESSION_VALUE = 185; // HBOT — used as Meta optimization signal

const ACCENT = '#0891b2';
const ACCENT_BG = '#ecfeff';

export default function HBOTTrial() {
  const router = useRouter();
  const formRef = useRef(null);

  const [contact, setContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    consent: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [topError, setTopError] = useState('');
  const [done, setDone] = useState(false);
  const [trialId, setTrialId] = useState(null);
  const [eventTypeId, setEventTypeId] = useState(null);
  const [setupClientSecret, setSetupClientSecret] = useState(null);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(60);

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

    if (Object.keys(next).length > 0) {
      setErrors(next);
      setTopError(`Please fill in the ${Object.keys(next).length} highlighted field${Object.keys(next).length === 1 ? '' : 's'} below.`);
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
      const metaAttr = readMetaAttribution();
      const eventId = newMetaEventId('lead_hbot');

      // Fire browser pixel BEFORE the server call so Meta sees the event quickly
      // even if the API is slow. Server-side CAPI uses the same eventId for dedup.
      if (typeof fbq === 'function') {
        fbq('track', 'Lead', {
          content_name: 'hbot-free-session',
          value: SESSION_VALUE,
          currency: 'USD',
        }, { eventID: eventId });
      }

      const res = await fetch('/api/free-session/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trialType: 'hbot',
          firstName: contact.firstName.trim(),
          lastName: contact.lastName.trim(),
          email: contact.email.trim().toLowerCase(),
          phone: contact.phone.trim(),
          consentMarketing: contact.consent,
          struggleMains: [],
          struggleOther: null,
          badDayDescription: null,
          importance90d: null,
          budgetAnswer: null,
          source,
          meta: {
            eventId,
            fbp: metaAttr.fbp,
            fbc: metaAttr.fbc,
            fbclid: metaAttr.fbclid,
            eventSourceUrl: window.location.href,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      const data = await res.json();
      setTrialId(data.trialId || null);
      setEventTypeId(data.eventTypeId || null);
      setSetupClientSecret(data.setupClientSecret || null);
      if (data.sessionDurationMinutes) setSessionDurationMinutes(data.sessionDurationMinutes);
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Free HBOT session submit error:', err);
      setTopError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Layout
      title="Free Hyperbaric Oxygen Session | Range Medical"
      description="Try a free 60-minute hyperbaric oxygen session at Range Medical in Newport Beach. No payment, no pressure."
      logoOnly
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
            padding: 5rem 2rem 2rem;
            max-width: 680px;
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
            font-size: clamp(2rem, 5vw, 2.75rem);
            font-weight: 800;
            line-height: 1.1;
            margin: 0 0 18px;
            letter-spacing: -0.02em;
          }
          .fs-hero .fs-sub {
            font-size: 17px;
            color: #404040;
            line-height: 1.65;
            margin: 0 0 18px;
          }
          .fs-hero .fs-clarifier {
            font-size: 15px;
            color: #525252;
            line-height: 1.65;
            margin: 0 0 32px;
          }
          .fs-section-title {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #737373;
            margin: 0 0 14px;
          }
          .fs-bullets {
            list-style: none;
            padding: 0;
            margin: 0 0 36px;
          }
          .fs-bullets li {
            position: relative;
            padding-left: 30px;
            font-size: 16px;
            color: #333;
            line-height: 1.55;
            margin-bottom: 14px;
          }
          .fs-bullets li::before {
            content: counter(fs-step);
            counter-increment: fs-step;
            position: absolute;
            left: 0;
            top: 0;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: ${ACCENT};
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .fs-bullets {
            counter-reset: fs-step;
          }

          .fs-form-section {
            max-width: 680px;
            margin: 0 auto;
            padding: 0 2rem 6rem;
          }
          .fs-step {
            background: #fff;
            border: 1px solid #e0e0e0;
            padding: 32px 28px;
          }
          .fs-step h2 {
            font-size: 20px;
            font-weight: 700;
            line-height: 1.3;
            margin: 0 0 8px;
          }
          .fs-step .fs-step-intro {
            font-size: 14px;
            color: #525252;
            line-height: 1.5;
            margin: 0 0 22px;
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
          .fs-field input[type="tel"] {
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
          .fs-field input:focus {
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

          .fs-btn {
            width: 100%;
            padding: 18px;
            background: ${ACCENT};
            color: #fff;
            border: none;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.06em;
            cursor: pointer;
            transition: background 0.2s;
            font-family: inherit;
            margin-top: 20px;
          }
          .fs-btn:hover:not(:disabled) { background: #0e7490; }
          .fs-btn:disabled { opacity: 0.5; cursor: not-allowed; }

          .fs-error {
            background: #FEF2F2;
            color: #DC2626;
            padding: 12px 16px;
            font-size: 14px;
            margin-bottom: 16px;
            border-left: 3px solid #DC2626;
          }
          .fs-field input.fs-has-error {
            border-color: #DC2626;
            background: #FEF2F2;
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

          .fs-location {
            max-width: 680px;
            margin: 0 auto;
            padding: 0 2rem 4rem;
          }
          .fs-location-eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: ${ACCENT};
            margin: 0 0 10px;
          }
          .fs-location h3 {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 6px;
            color: #171717;
          }
          .fs-location-address {
            font-size: 15px;
            color: #404040;
            line-height: 1.55;
            margin: 0 0 16px;
          }
          .fs-location-address a {
            color: #404040;
            text-decoration: none;
            border-bottom: 1px solid #d4d4d4;
          }
          .fs-location-address a:hover { color: ${ACCENT}; border-color: ${ACCENT}; }
          .fs-map-frame {
            width: 100%;
            height: 280px;
            border: 1px solid #e0e0e0;
            display: block;
          }

          .fs-hero-where {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #525252;
            margin: 0 0 20px;
          }
          .fs-hero-where svg { flex-shrink: 0; }
        `}</style>
      </Head>

      <div className="fs-page">
        {!done ? (
          <>
            <section className="fs-hero">
              <p className="fs-eyebrow">Free Session · Newport Beach</p>
              <h1>Free Hyperbaric Oxygen Session For First&#8209;Time Patients</h1>
              <p className="fs-sub">
                Experience a 60-minute hyperbaric oxygen session (normally $185, yours
                free today) to see how HBOT feels for recovery, brain clarity, and
                everyday energy. One session won&apos;t fix everything, but it&apos;s
                the best way to know if it&apos;s right for you.
              </p>

              <p className="fs-section-title">How it works</p>
              <ul className="fs-bullets">
                <li>Fill out the short form below to save your free session.</li>
                <li>On the next step, pick a time that works best for you.</li>
                <li>Come in, try the chamber, and if you&apos;d like, we&apos;ll walk through options for recovery, energy, or brain clarity.</li>
              </ul>
              <p className="fs-hero-where">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                1901 Westcliff Drive, Suite 10, Newport Beach, CA
              </p>
            </section>

            <section className="fs-form-section">
              <form ref={formRef} onSubmit={handleSubmit}>
                <div className="fs-step">
                  <h2>Step 1: Save Your Free Session</h2>
                  <p className="fs-step-intro">
                    Tell us how to reach you so we can confirm your spot and send your visit details.
                  </p>

                  {topError && <div className="fs-error">{topError}</div>}

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
                      onChange={(e) => { setContact({ ...contact, phone: formatPhone(e.target.value) }); clearFieldError('phone'); }}
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

                  <button type="submit" className="fs-btn" disabled={submitting}>
                    {submitting ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                        <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'fs-btn-spin 0.8s linear infinite', display: 'inline-block' }} />
                        Saving your session…
                      </span>
                    ) : 'Continue To Step 2 – Pick My Time'}
                  </button>
                  <style>{`@keyframes fs-btn-spin { to { transform: rotate(360deg); } }`}</style>

                  <p className="fs-fineprint">
                    New patients only. One free $185 session per person. Newport Beach location.
                  </p>
                </div>
              </form>
            </section>

            <section className="fs-location">
              <p className="fs-location-eyebrow">Where to find us</p>
              <h3>Range Medical · Newport Beach</h3>
              <p className="fs-location-address">
                <a href="https://maps.google.com/?q=1901+Westcliff+Drive,+Suite+10,+Newport+Beach,+CA+92660" target="_blank" rel="noopener noreferrer">
                  1901 Westcliff Drive, Suite 10<br />Newport Beach, CA 92660
                </a>
              </p>
              <iframe
                title="Range Medical location map"
                className="fs-map-frame"
                src="https://maps.google.com/maps?q=1901+Westcliff+Drive,+Suite+10,+Newport+Beach,+CA+92660&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </section>
          </>
        ) : (
          <FreeSessionScheduler
            trialId={trialId}
            eventTypeId={eventTypeId}
            setupClientSecret={setupClientSecret}
            sessionDurationMinutes={sessionDurationMinutes}
            trialLabel="Hyperbaric Oxygen"
            accentColor={ACCENT}
            accentBg={ACCENT_BG}
            firstName={contact.firstName}
            scheduleLabel="Step 2"
            scheduleTitle="Choose Your Time"
            scheduleSubtitle="Pick a time that works best for you. This will reserve your free hyperbaric oxygen session at Range Medical in Newport Beach. We'll text you a quick confirmation once you're booked."
            scheduleFootnote={[
              'New patients only. One free session per person.',
              "We'll review your information before your visit to make sure HBOT is a safe fit for you.",
            ]}
          />
        )}
      </div>
    </Layout>
  );
}
