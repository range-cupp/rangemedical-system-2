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
    a: 'That’s completely fine. You can book those sessions on their own. The assessment helps us figure out which treatments will work best for your goals, but there’s no obligation to do everything at once.',
  },
  {
    q: 'How long does the assessment take?',
    a: 'The lab draw takes about 10 minutes. The provider visit is about 30 minutes. You can do both on the same day or split them up — whatever works for your schedule.',
  },
  {
    q: 'Do I need labs if I already had some done this year?',
    a: 'Bring what you have. Your provider will review your existing labs and let you know if anything additional is needed. You may not need a full panel.',
  },
  {
    q: 'What if I’m busy and don’t have much time?',
    a: 'We get it. Most of our patients are busy professionals. The lab draw takes 10 minutes and the provider visit is about 30 minutes. We’ll work around your schedule.',
  },
  {
    q: 'Is this covered by insurance?',
    a: 'Range Medical is a cash-based clinic, which means we do not bill insurance. This lets us spend more time with you and choose the best options without insurance restrictions. Many patients use HSA or FSA funds.',
  },
  {
    q: 'What happens after the assessment?',
    a: 'You walk out with a written plan specific to you. If you want to move forward with treatment, your $197 is applied as a credit toward whatever you choose. There is no pressure to commit.',
  },
  {
    q: 'Is Range Medical the same as Range Sports Therapy?',
    a: 'We are separate practices in the same building. Range Medical focuses on lab-based health optimization — hormones, metabolism, and energy. Range Sports Therapy handles physical therapy and sports rehab.',
  },
];

export default function EnergyAssessment() {
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
        <title>Range Assessment | Energy, Hormones & Weight | Range Medical</title>
        <meta name="description" content="Tired, foggy, or gaining weight even with normal labs? The $197 Range Assessment combines detailed labs with your symptoms to find what others miss. Every dollar credited toward your treatment. Newport Beach, CA." />
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
            <AssessmentBooking path="energy" onBack={handleBack} />
          ) : (
            <>
              {/* ── Hero ── */}
              <div style={s.heroSection}>
                <div style={s.label}>
                  <span style={s.dot} /> THE RANGE ASSESSMENT
                </div>
                <h1 style={s.headline}>
                  YOUR LABS CAME<br />BACK &ldquo;NORMAL.&rdquo;<br />YOU STILL DON&apos;T<br />FEEL RIGHT.
                </h1>
                <div style={s.rule} />
                <p style={s.headlineSub}>
                  The Range Assessment matches how you feel with what your labs actually show &mdash; so you get a real plan, not another guess.
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
                  You&apos;ve been to the doctor. Your labs came back &ldquo;fine.&rdquo; But something still doesn&apos;t feel right.
                </p>
                <div>
                  {[
                    'You wake up tired even after a full night of sleep',
                    'Afternoon energy crashes that coffee can’t fix',
                    'Brain fog and trouble staying focused',
                    'Weight that won’t budge no matter what you try',
                    'Mood changes, low drive, or restless sleep',
                    'A feeling that something is off — even though no one can tell you what',
                  ].map((item, i) => (
                    <div key={i} style={s.checkItem}>
                      <span style={s.checkDot} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p style={{ ...s.body, marginTop: 20, marginBottom: 0 }}>
                  You&apos;re not imagining it. And you&apos;re not alone.
                </p>
              </div>

              {/* ── What Happens ── */}
              <div style={s.section}>
                <div style={s.label}>
                  <span style={s.dot} /> WHAT HAPPENS IN YOUR RANGE ASSESSMENT
                </div>
                <div style={s.rule} />
                <p style={s.body}>
                  From first call to written plan, most patients finish in about a week.
                </p>
                {[
                  { num: '01', title: 'Schedule and Get Labs Done', desc: 'Book your visit and come in for a quick lab draw. Takes about 10 minutes. We can usually get you in this week.' },
                  { num: '02', title: 'Symptom Questionnaire', desc: 'Fill out a short form about how you’ve been feeling — energy, sleep, mood, focus, weight. Takes about 5 minutes.' },
                  { num: '03', title: '1:1 Provider Review', desc: 'Sit down with your provider. They walk through your labs and symptoms side by side, in plain language. No jargon. No rushing.' },
                  { num: '04', title: 'Your Written Plan + $197 Credit', desc: 'Walk out with a clear plan built for you. Every dollar of your $197 is applied toward whatever treatment you choose.' },
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
                  <span style={s.dot} /> WHY THIS WORKS BETTER THAN GUESSING
                </div>
                <div style={s.rule} />
                <p style={s.body}>
                  Most doctors look at your labs or ask how you feel. We do both &mdash; at the same time.
                </p>
                <p style={s.body}>
                  When we line up your numbers with your symptoms, patterns show up that a standard checkup misses. That&apos;s how we find the real issue &mdash; not just the one that looks &ldquo;normal&rdquo; on paper.
                </p>
                <p style={s.body}>
                  This same approach helped one of our founders, Chris, get his energy back after years of feeling off. Labs plus symptoms, not guessing. Along the way, he lost about 100 pounds.
                </p>
                <div style={{ margin: '20px 0 28px' }}>
                  {[
                    'Labs that go deeper than a standard blood panel',
                    'A side-by-side review of what you feel and what your labs show',
                    'A plan built for your body, your goals, and your schedule',
                    'No pressure — you decide what’s right for you',
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
                  YOU DON&apos;T HAVE TO<br />KEEP GUESSING.
                </h2>
                <p style={s.finalSub}>
                  Get the answers and a real plan to feel like yourself again.
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
