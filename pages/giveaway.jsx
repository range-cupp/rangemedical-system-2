// pages/giveaway.jsx
// "6-Week Cellular Energy Reset" giveaway + scholarship application
// Flow: Landing → 4-step application → /giveaway/thanks
// One winner gets the $2,999 program free. Non-winners get offered a $1,000 scholarship.

import Layout from '../components/Layout';
import Head from 'next/head';
import Script from 'next/script';
import { useState, useRef } from 'react';
import { useRouter } from 'next/router';

const META_PIXEL_ID = '4295373617400545';

const STRUGGLE_OPTIONS = [
  { value: 'energy',       label: 'Low energy / afternoon crashes' },
  { value: 'brain_fog',    label: 'Brain fog / focus' },
  { value: 'recovery',     label: 'Slow recovery from injury or workouts' },
  { value: 'weight_loss',  label: 'Trouble losing weight' },
  { value: 'other',        label: 'Other' },
];

const BUDGET_OPTIONS = [
  { value: 'yes',               label: 'Yes, I could do that' },
  { value: 'yes_with_payments', label: 'Yes, if there was a payment plan' },
  { value: 'no',                label: 'Probably not right now' },
];

export default function GiveawayPage() {
  const router = useRouter();
  const formRef = useRef(null);

  const [contact, setContact] = useState({
    name: '',
    phone: '',
    email: '',
    instagram: '',
    consent: false,
  });
  const [story, setStory] = useState({
    struggle_main: '',
    struggle_other: '',
    bad_day_description: '',
    desired_change: '',
  });
  const [importance, setImportance] = useState(7);
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const source = router.query.src || router.query.source || 'direct';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!contact.name.trim() || !contact.phone.trim() || !contact.email.trim()) {
      setError('Please fill in your name, phone, and email.');
      return;
    }
    if (!contact.consent) {
      setError('Please check the consent box to enter.');
      return;
    }
    if (!story.struggle_main) {
      setError('Please tell us what you\'re struggling with most.');
      return;
    }
    if (story.struggle_main === 'other' && !story.struggle_other.trim()) {
      setError('Please describe what you\'re struggling with.');
      return;
    }
    if (!story.bad_day_description.trim() || !story.desired_change.trim()) {
      setError('Please answer all the story questions.');
      return;
    }
    if (!budget) {
      setError('Please answer the budget question.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/giveaway/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contact.name.trim(),
          phone: contact.phone.trim(),
          email: contact.email.trim().toLowerCase(),
          instagramHandle: contact.instagram.trim() || null,
          consentMarketing: contact.consent,
          struggleMain: story.struggle_main,
          struggleOther: story.struggle_main === 'other' ? story.struggle_other.trim() : null,
          badDayDescription: story.bad_day_description.trim(),
          desiredChange: story.desired_change.trim(),
          importance90d: Number(importance),
          budgetAnswer: budget,
          source,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      if (typeof fbq === 'function') {
        fbq('track', 'Lead', { content_name: 'giveaway-entry' });
      }

      router.push('/giveaway/thanks');
    } catch (err) {
      console.error('Giveaway submit error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Layout
      title="Win a 6-Week Cellular Energy Reset | Range Medical"
      description="Enter to win a free 6-Week Cellular Energy Reset at Range Medical in Newport Beach. 18 HBOT sessions + 18 Red Light sessions. Everyone else may qualify for a $1,000 scholarship."
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
        <style>{`
          .gv-page { color: #171717; }

          .gv-hero {
            padding: 6rem 2rem 2rem;
            max-width: 720px;
            margin: 0 auto;
          }
          .gv-eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #737373;
            margin: 0 0 14px;
          }
          .gv-hero h1 {
            font-size: clamp(2.5rem, 6vw, 4rem);
            font-weight: 900;
            line-height: 0.95;
            margin: 0 0 20px;
            letter-spacing: -0.02em;
            text-transform: uppercase;
          }
          .gv-hero-rule {
            width: 100%;
            height: 1px;
            background: #e0e0e0;
            margin: 20px 0;
          }
          .gv-hero p {
            font-size: 18px;
            color: #404040;
            line-height: 1.6;
            margin: 0 0 16px;
          }
          .gv-highlight-box {
            background: #fafafa;
            border-left: 3px solid #171717;
            padding: 20px 24px;
            margin: 24px 0 0;
          }
          .gv-highlight-box strong {
            display: block;
            font-size: 13px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .gv-highlight-box p {
            font-size: 15px;
            margin: 0;
            color: #404040;
            line-height: 1.55;
          }

          /* Form */
          .gv-form-section {
            max-width: 680px;
            margin: 0 auto;
            padding: 32px 2rem 6rem;
          }
          .gv-step {
            background: #fff;
            border: 1px solid #e0e0e0;
            padding: 32px 28px;
            margin-bottom: 16px;
          }
          .gv-step-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #a3a3a3;
            margin: 0 0 4px;
          }
          .gv-step h2 {
            font-size: 22px;
            font-weight: 700;
            line-height: 1.3;
            margin: 0 0 20px;
          }
          .gv-field { margin-bottom: 18px; }
          .gv-field label.gv-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #525252;
            margin-bottom: 6px;
          }
          .gv-field input[type="text"],
          .gv-field input[type="email"],
          .gv-field input[type="tel"],
          .gv-field textarea {
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
          .gv-field textarea {
            min-height: 96px;
            resize: vertical;
            line-height: 1.5;
          }
          .gv-field input:focus,
          .gv-field textarea:focus {
            outline: none;
            border-color: #171717;
          }

          /* Consent */
          .gv-consent {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin: 20px 0 4px;
          }
          .gv-consent input[type="checkbox"] {
            margin-top: 0;
            width: 22px;
            height: 22px;
            min-width: 22px;
            min-height: 22px;
            accent-color: #171717;
            flex-shrink: 0;
          }
          .gv-consent label {
            font-size: 13px;
            color: #525252;
            line-height: 1.5;
          }

          /* Radio options */
          .gv-option {
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
          .gv-option:hover {
            border-color: #a3a3a3;
            background: #fafafa;
          }
          .gv-option.selected {
            border-color: #171717;
            background: #f5f5f5;
          }

          /* Slider */
          .gv-slider-wrap { padding: 8px 0 4px; }
          .gv-slider-value {
            font-size: 48px;
            font-weight: 900;
            text-align: center;
            margin: 4px 0 12px;
            letter-spacing: -0.02em;
          }
          .gv-slider-labels {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #737373;
            margin-bottom: 10px;
            letter-spacing: 0.02em;
          }
          .gv-slider {
            width: 100%;
            accent-color: #171717;
          }

          /* Buttons */
          .gv-btn {
            width: 100%;
            padding: 18px;
            background: #171717;
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
          .gv-btn:hover:not(:disabled) { background: #404040; }
          .gv-btn:disabled { opacity: 0.5; cursor: not-allowed; }

          .gv-error {
            background: #FEF2F2;
            color: #DC2626;
            padding: 12px 16px;
            font-size: 14px;
            margin-bottom: 16px;
            border-left: 3px solid #DC2626;
          }
          .gv-fineprint {
            font-size: 12px;
            color: #737373;
            line-height: 1.5;
            margin: 16px 0 0;
            text-align: center;
          }
        `}</style>
      </Head>

      <div className="gv-page">
        <section className="gv-hero">
          <p className="gv-eyebrow">Giveaway · Newport Beach</p>
          <h1>Win a 6-Week Cellular Energy Reset</h1>
          <div className="gv-hero-rule" />
          <p>
            One person wins the full 6-Week Cellular Energy Reset at Range Medical —
            18 Hyperbaric Oxygen sessions + 18 Red Light Therapy sessions over 6 weeks
            ($2,999 value). Completely free.
          </p>
          <p>
            Everyone else who qualifies gets a <strong>$1,000 scholarship</strong> on the
            same program — $2,999 down to $1,999 — good for 7 days after the winner is picked.
          </p>

          <div className="gv-highlight-box">
            <strong>How to enter</strong>
            <p>
              Fill out the short application below. We&apos;ll pick one winner at random and
              text everyone else their scholarship offer. It takes about 3 minutes.
            </p>
          </div>
        </section>

        <section className="gv-form-section">
          <form ref={formRef} onSubmit={handleSubmit}>
            {/* Step 1 — basics */}
            <div className="gv-step">
              <p className="gv-step-label">Step 1 of 4</p>
              <h2>Tell us who you are</h2>

              <div className="gv-field">
                <label className="gv-label" htmlFor="gv-name">Full name</label>
                <input
                  id="gv-name"
                  type="text"
                  autoComplete="name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  required
                />
              </div>

              <div className="gv-field">
                <label className="gv-label" htmlFor="gv-phone">Mobile phone</label>
                <input
                  id="gv-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(949) 555-0123"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  required
                />
              </div>

              <div className="gv-field">
                <label className="gv-label" htmlFor="gv-email">Email</label>
                <input
                  id="gv-email"
                  type="email"
                  autoComplete="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  required
                />
              </div>

              <div className="gv-field">
                <label className="gv-label" htmlFor="gv-ig">Instagram handle (optional)</label>
                <input
                  id="gv-ig"
                  type="text"
                  placeholder="@yourhandle"
                  value={contact.instagram}
                  onChange={(e) => setContact({ ...contact, instagram: e.target.value })}
                />
              </div>

              <div className="gv-consent">
                <input
                  id="gv-consent"
                  type="checkbox"
                  checked={contact.consent}
                  onChange={(e) => setContact({ ...contact, consent: e.target.checked })}
                />
                <label htmlFor="gv-consent">
                  I agree to receive text and email about this giveaway and related
                  health offers from Range Medical. Msg &amp; data rates may apply.
                  Reply STOP to opt out.
                </label>
              </div>
            </div>

            {/* Step 2 — story */}
            <div className="gv-step">
              <p className="gv-step-label">Step 2 of 4</p>
              <h2>What are you struggling with most right now?</h2>

              <div className="gv-field">
                {STRUGGLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`gv-option${story.struggle_main === opt.value ? ' selected' : ''}`}
                    onClick={() => setStory({ ...story, struggle_main: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {story.struggle_main === 'other' && (
                <div className="gv-field">
                  <label className="gv-label" htmlFor="gv-other">Tell us more</label>
                  <input
                    id="gv-other"
                    type="text"
                    value={story.struggle_other}
                    onChange={(e) => setStory({ ...story, struggle_other: e.target.value })}
                  />
                </div>
              )}

              <div className="gv-field">
                <label className="gv-label" htmlFor="gv-badday">
                  In your own words, what does a bad day look like for you?
                </label>
                <textarea
                  id="gv-badday"
                  value={story.bad_day_description}
                  onChange={(e) => setStory({ ...story, bad_day_description: e.target.value })}
                  placeholder="The more specific, the better. This helps us know if we can actually help."
                />
              </div>

              <div className="gv-field">
                <label className="gv-label" htmlFor="gv-change">
                  If we could meaningfully improve this in the next 6 weeks,
                  what would that change for you?
                </label>
                <textarea
                  id="gv-change"
                  value={story.desired_change}
                  onChange={(e) => setStory({ ...story, desired_change: e.target.value })}
                  placeholder="Work, family, training, travel — whatever you'd get back."
                />
              </div>
            </div>

            {/* Step 3 — urgency */}
            <div className="gv-step">
              <p className="gv-step-label">Step 3 of 4</p>
              <h2>How important is it to fix this in the next 90 days?</h2>

              <div className="gv-slider-wrap">
                <div className="gv-slider-value">{importance}</div>
                <div className="gv-slider-labels">
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
                  className="gv-slider"
                />
              </div>
            </div>

            {/* Step 4 — budget */}
            <div className="gv-step">
              <p className="gv-step-label">Step 4 of 4</p>
              <h2>
                If you were given a $1,000 scholarship on the 6-Week Reset —
                could you invest around $2,000 in your health over those 6 weeks?
              </h2>

              <div className="gv-field">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`gv-option${budget === opt.value ? ' selected' : ''}`}
                    onClick={() => setBudget(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {error && <div className="gv-error">{error}</div>}

              <button type="submit" className="gv-btn" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Enter the Giveaway'}
              </button>

              <p className="gv-fineprint">
                No purchase necessary. Must be 18+ and able to travel to Newport Beach, CA
                for sessions. One entry per person.
              </p>
            </div>
          </form>
        </section>
      </div>
    </Layout>
  );
}
