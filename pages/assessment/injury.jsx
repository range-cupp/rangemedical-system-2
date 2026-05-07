import Head from 'next/head';
import { useState, useEffect } from 'react';
import { ChevronDown, Phone } from 'lucide-react';
import AssessmentBooking, { styles as s } from '../../components/AssessmentBooking';

const FAQS = [
  {
    q: 'Can I try a few sessions before committing to a full program?',
    a: 'Yes. After your assessment, you can start with individual sessions to see how your body responds. There is no pressure to commit to a full program right away.',
  },
  {
    q: 'What if I just want red light therapy or hyperbaric oxygen and not the full protocol?',
    a: 'That’s completely fine. You can book those sessions on their own. The assessment helps us figure out which combination of treatments will work best for your recovery, but there’s no obligation to do everything at once.',
  },
  {
    q: 'How long does the assessment take?',
    a: 'About 30 minutes. No labs, no lengthy paperwork. Just a focused conversation about your injury, what you’ve already tried, and what’s slowing you down.',
  },
  {
    q: 'Do I need imaging or PT records to bring?',
    a: 'Bring what you have, but it’s not required. If you have recent MRI or X-ray reports, your provider will review them. If not, we’ll work with what you can tell us about your injury.',
  },
  {
    q: 'What if I’m in pain right now?',
    a: 'We can usually see you this week. Call or text (949) 997-3988 if you need a faster appointment than the times shown online.',
  },
  {
    q: 'Do you work with my physical therapist?',
    a: 'Yes. If you’re already in PT, we coordinate with your PT so the recovery work and the medical side support each other instead of conflicting.',
  },
  {
    q: 'Is this covered by insurance?',
    a: 'Range Medical is a cash-based clinic, which means we do not bill insurance. This lets us spend more time with you and choose the best options without insurance restrictions. Many patients use HSA or FSA funds.',
  },
  {
    q: 'Is Range Medical the same as Range Sports Therapy?',
    a: 'We are separate practices in the same building. Range Medical handles the medical side — recovery peptides, IV therapy, red light, hyperbaric oxygen. Range Sports Therapy handles physical therapy and sports rehab. Many of our patients use both.',
  },
];

export default function InjuryAssessment() {
  const [showBooking, setShowBooking] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); }, [showBooking]);

  const handleCTA = () => setShowBooking(true);
  const handleBack = () => setShowBooking(false);
  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  const ctaButton = (extra = {}) => (
    <button
      style={{ ...s.btn, ...extra }}
      onClick={handleCTA}
      onMouseEnter={e => { e.currentTarget.style.background = '#404040'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; }}
    >
      Schedule My Range Assessment
    </button>
  );

  return (
    <>
      <Head>
        <title>Range Assessment | Injury & Recovery | Range Medical</title>
        <meta name="description" content="Stuck in pain or recovering slower than you should? The $197 Range Assessment gives you a recovery plan built for your injury — peptides, red light, hyperbaric oxygen, IV therapy. Every dollar credited toward your treatment. Newport Beach, CA." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={s.page}>
        <div style={s.header}>
          {showBooking ? (
            <img src="https://www.range-medical.com/brand/range_logo_transparent_black.png" alt="Range Medical" style={s.logo} />
          ) : (
            <a href="/"><img src="https://www.range-medical.com/brand/range_logo_transparent_black.png" alt="Range Medical" style={s.logo} /></a>
          )}
        </div>

        <div style={s.container}>
          {showBooking ? (
            <AssessmentBooking path="injury" onBack={handleBack} />
          ) : (
            <>
              {/* ── Hero ── */}
              <div style={s.heroSection}>
                <div style={s.label}>
                  <span style={s.dot} /> THE RANGE ASSESSMENT
                </div>
                <h1 style={s.headline}>
                  STILL HURTING.<br />STILL NOT BACK<br />TO YOURSELF.
                </h1>
                <div style={s.rule} />
                <p style={s.headlineSub}>
                  The Range Assessment gives you a recovery plan built around your injury, your timeline, and your goals &mdash; not a generic protocol.
                </p>
                <div style={s.offerBox}>
                  The Range Assessment is <strong>$197</strong> today, and every dollar is credited toward any treatment plan you start with us.
                </div>
                {ctaButton()}
              </div>

              {/* ── Is This You? ── */}
              <div style={s.section}>
                <div style={s.label}>
                  <span style={s.dot} /> IS THIS YOU?
                </div>
                <div style={s.rule} />
                <p style={s.body}>
                  You&apos;ve done the rest. Maybe the PT. Maybe the surgery. You&apos;re still not back to where you want to be.
                </p>
                <div>
                  {[
                    'Pain that hasn’t gone away after weeks of rest or PT',
                    'Recovery that’s taking longer than you were told it would',
                    'Trying to bounce back from surgery faster',
                    'An old injury that flares up every time you push hard',
                    'Stiffness, weakness, or limited range of motion',
                    'A sense that your body just isn’t healing the way it used to',
                  ].map((item, i) => (
                    <div key={i} style={s.checkItem}>
                      <span style={s.checkDot} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p style={{ ...s.body, marginTop: 20, marginBottom: 0 }}>
                  There&apos;s a way to recover faster. It starts with a real plan.
                </p>
              </div>

              {/* ── What Happens ── */}
              <div style={s.section}>
                <div style={s.label}>
                  <span style={s.dot} /> WHAT HAPPENS IN YOUR RANGE ASSESSMENT
                </div>
                <div style={s.rule} />
                <p style={s.body}>
                  Simple, focused, and built around your injury &mdash; no labs, no extra steps.
                </p>
                {[
                  { num: '01', title: 'Schedule Your Visit', desc: 'Book your visit and come in. We can usually get you in this week — even if you’re in pain right now.' },
                  { num: '02', title: 'Tell Us About Your Injury', desc: 'Short questionnaire about your injury, your timeline, what you’ve tried, and what’s slowing you down. Takes about 5 minutes.' },
                  { num: '03', title: '1:1 Provider Review', desc: 'Sit down with your provider. They look at your injury, your history, and what hasn’t worked yet. Plain language, no rushing.' },
                  { num: '04', title: 'Custom Recovery Plan + $197 Credit', desc: 'Walk out with a clear recovery plan built for your body. Every dollar of your $197 is applied toward whatever treatment you choose.' },
                ].map((step, i) => (
                  <div key={i} style={i < 3 ? s.step : s.stepLast}>
                    <div style={s.stepNum}>{step.num}</div>
                    <div>
                      <div style={s.stepTitle}>{step.title}</div>
                      <p style={s.stepDesc}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Why This Works ── */}
              <div style={s.section}>
                <div style={s.label}>
                  <span style={s.dot} /> WHY THIS WORKS BETTER THAN A STANDARD PROTOCOL
                </div>
                <div style={s.rule} />
                <p style={s.body}>
                  Most clinics use the same recovery protocol for everyone. We build yours around your specific injury and where you actually are in your healing.
                </p>
                <p style={s.body}>
                  We also have tools that go beyond standard PT &mdash; recovery peptides, red light therapy, hyperbaric oxygen, and IV therapy. The right combination can speed up healing, cut down inflammation, and help your body do what it&apos;s already trying to do.
                </p>
                <p style={s.body}>
                  Range Sports Therapy is in the same building, so if you need physical therapy alongside your medical recovery, we coordinate the whole picture in one place.
                </p>
                <div style={{ margin: '20px 0 28px' }}>
                  {[
                    'Recovery tools that go beyond standard PT',
                    'A plan built around your injury, not a template',
                    'Faster healing — peptides, red light, hyperbaric oxygen, IVs',
                    'Coordination with physical therapy in the same building',
                  ].map((item, i) => (
                    <div key={i} style={s.checkItem}>
                      <span style={s.checkDot} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                {ctaButton()}
              </div>

              {/* ── Cost ── */}
              <div style={s.section}>
                <div style={s.label}>
                  <span style={s.dot} /> WHAT IT COSTS
                </div>
                <div style={s.rule} />
                <p style={s.body}>
                  The Range Assessment is <strong>$197</strong>. Every dollar is credited toward any treatment plan you start with Range Medical.
                </p>
                <p style={{ ...s.body, marginBottom: 0 }}>
                  That means if you move forward, the assessment is essentially free.
                </p>
              </div>

              {/* ── FAQ ── */}
              <div style={s.section}>
                <div style={s.label}>
                  <span style={s.dot} /> FREQUENTLY ASKED QUESTIONS
                </div>
                <div style={s.rule} />
                {FAQS.map((faq, i) => (
                  <div key={i} style={s.faqItem}>
                    <button style={s.faqQ} onClick={() => toggleFaq(i)}>
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={18}
                        style={{
                          transition: 'transform 0.2s',
                          transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                          flexShrink: 0, color: '#a0a0a0',
                        }}
                      />
                    </button>
                    {openFaq === i && <p style={s.faqA}>{faq.a}</p>}
                  </div>
                ))}
              </div>

              {/* ── Final CTA ── */}
              <div style={s.finalCta}>
                <h2 style={s.finalHeadline}>
                  GET BACK TO<br />FEELING LIKE YOURSELF.
                </h2>
                <p style={s.finalSub}>
                  A real recovery plan, built for your body. Not another protocol that wasn&apos;t made for you.
                </p>
                {ctaButton()}
                <div style={{ marginTop: 24 }}>
                  <a href="tel:9499973988" style={s.contactLink}>
                    <Phone size={14} /> (949) 997-3988
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
