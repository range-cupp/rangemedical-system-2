import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Plus, Minus } from 'lucide-react';

export default function AssessmentLandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState(null);

  function startAssessment() {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', { content_name: 'Range Assessment' });
    }
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', { event_category: 'assessment' });
    }
    router.push('/assessment?path=energy');
  }

  const whoFor = [
    "You're over 40 and your energy, focus, or drive isn't what it used to be",
    "You've been told your labs are \"normal\" but you still feel off",
    "You're on weight-loss shots, peptides, or hormones with little or no baseline labs",
    "You're tired of guessing and want a clear, data-driven answer",
    "You want a provider who takes time to explain things in plain language",
  ];

  const whatYouGet = [
    {
      title: 'Symptoms review',
      desc: 'A short questionnaire so your provider walks in already knowing your story, history, and goals.',
    },
    {
      title: '30-minute 1-on-1 visit',
      desc: 'Unhurried time with a provider who actually listens — no rushed appointments, no feeling like a number.',
    },
    {
      title: 'Personalized written plan',
      desc: 'You walk out with a real plan built for you — what is going on, what to do next, and which labs or treatments your provider recommends.',
    },
    {
      title: '$197 credited back',
      desc: 'Your full $197 is applied as credit toward your first treatment or lab package — so the assessment is essentially free if you move forward.',
    },
  ];

  const howItWorks = [
    { num: '01', title: 'Book and pay $197', desc: 'Pick a time that works for you and reserve your spot. The $197 is credited back toward your first treatment or lab package.' },
    { num: '02', title: 'Complete a quick intake', desc: 'We text you a short medical intake form — history, meds, allergies, photo ID. Takes about 5 minutes from your phone.' },
    { num: '03', title: 'Come in and get your plan', desc: 'Sit down 1-on-1 with your provider for 30 focused minutes. Walk out the same visit with your personalized written plan.' },
  ];

  const faqs = [
    {
      q: 'How much does the Range Assessment cost?',
      a: 'It is $197, and the full $197 is credited toward your first treatment or lab package. So if you decide to move forward, the assessment is essentially free.',
    },
    {
      q: 'How long does the visit take?',
      a: 'A focused 30 minutes, 1-on-1 with your provider. No rushed appointments, no waiting room shuffle.',
    },
    {
      q: 'What do I actually leave with?',
      a: 'A personalized written plan built for you — not a generic handout. It covers what is going on, what to do next, and which labs or treatments your provider recommends.',
    },
    {
      q: 'Do you take insurance?',
      a: 'No. We are a cash-pay clinic so visits stay simple and focused on you — no referrals, no prior auths, no waiting. The $197 you pay up front is credited back toward your treatment.',
    },
    {
      q: 'Are labs included in the $197?',
      a: 'No. Labs are an optional add-on your provider may recommend during the visit (Essential panel from $350, Elite panel from $750). Your $197 can be applied toward either one.',
    },
    {
      q: 'Do I need to stop my medications?',
      a: 'No. Keep taking everything as normal. We want to see how your body is actually doing right now.',
    },
    {
      q: 'Where are you located?',
      a: '1901 Westcliff Drive, Suite 10, Newport Beach, CA. Easy parking, right off the 55 freeway.',
    },
  ];

  return (
    <>
      <Head>
        <title>Range Assessment — 30 Minutes, 1-on-1 With a Provider | Range Medical Orange County</title>
        <meta name="description" content="A 30-minute 1-on-1 with a Range Medical provider. Symptoms review, recommended labs, and a personalized written plan. $197 — credited toward your first treatment." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Range Assessment — Range Medical" />
        <meta property="og:description" content="Over 40 in Orange County and still don't feel like yourself? 30 minutes, 1-on-1 with a real provider, and a plan you take home." />
        <meta property="og:type" content="website" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={s.page}>
        {/* Header */}
        <header style={s.header}>
          <img
            src="/brand/range_logo_transparent_black.png"
            alt="Range Medical"
            style={s.logo}
          />
        </header>

        <main style={s.container}>
          {/* ─── HERO ─── */}
          <section style={s.heroSection}>
            <div style={s.label}>
              <span style={s.dot} />
              RANGE ASSESSMENT &nbsp;·&nbsp; ORANGE COUNTY
            </div>
            <h1 style={s.headline}>
              Over 40 and still don&apos;t feel like yourself?
            </h1>
            <p style={s.headlineSub}>
              The Range Assessment is a 30-minute 1-on-1 with a Range Medical provider — symptoms review, lab recommendations, and a personalized written plan you take home.
            </p>

            <div style={s.priceBox}>
              <strong style={s.priceStrong}>$197</strong> — applied as credit toward your first treatment or lab package
            </div>

            <button style={s.btn} onClick={startAssessment}>
              Book Your Range Assessment
            </button>

            <div style={s.trustRow}>
              <span style={s.trustItem}>30 minutes, 1-on-1</span>
              <span style={s.trustDivider} />
              <span style={s.trustItem}>Personalized plan</span>
              <span style={s.trustDivider} />
              <span style={s.trustItem}>$197 credited back</span>
            </div>
          </section>

          {/* ─── WHO THIS IS FOR ─── */}
          <section style={s.section}>
            <div style={s.sectionLabel}>
              <span style={s.dot} />
              WHO THIS IS FOR
            </div>
            <div style={s.sectionRule} />
            <div style={s.bulletList}>
              {whoFor.map((text, i) => (
                <div key={i} style={s.bulletItem}>
                  <span style={s.bulletNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={s.bulletText}>{text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ─── WHAT YOU GET ─── */}
          <section style={s.section}>
            <div style={s.sectionLabel}>
              <span style={s.dot} />
              WHAT YOU GET
            </div>
            <div style={s.sectionRule} />
            <div style={s.editorialList}>
              {whatYouGet.map((item, i) => (
                <div key={i} style={s.editorialItem}>
                  <span style={s.editorialNum}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 style={s.editorialTitle}>{item.title}</h3>
                    <p style={s.editorialDesc}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── HOW IT WORKS ─── */}
          <section style={s.section}>
            <div style={s.sectionLabel}>
              <span style={s.dot} />
              HOW IT WORKS
            </div>
            <div style={s.sectionRule} />
            <div style={s.editorialList}>
              {howItWorks.map((step, i) => (
                <div key={i} style={s.editorialItem}>
                  <span style={s.editorialNum}>{step.num}</span>
                  <div>
                    <h3 style={s.editorialTitle}>{step.title}</h3>
                    <p style={s.editorialDesc}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── FAQ ─── */}
          <section style={s.section}>
            <div style={s.sectionLabel}>
              <span style={s.dot} />
              COMMON QUESTIONS
            </div>
            <div style={s.sectionRule} />
            <div>
              {faqs.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} style={s.faqItem}>
                    <button
                      style={s.faqButton}
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                    >
                      <span style={s.faqQ}>{faq.q}</span>
                      <span style={s.faqIcon}>
                        {open ? <Minus size={16} /> : <Plus size={16} />}
                      </span>
                    </button>
                    {open && <p style={s.faqA}>{faq.a}</p>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ─── FINAL CTA ─── */}
          <section style={s.finalSection}>
            <div style={s.sectionLabel}>
              <span style={s.dot} />
              READY?
            </div>
            <div style={s.sectionRule} />
            <h2 style={s.finalTitle}>
              Stop guessing. Get a real plan.
            </h2>
            <p style={s.finalSub}>
              30 minutes, 1-on-1 with a Range Medical provider, and a written plan you take home. $197 — credited back if you move forward.
            </p>
            <div style={s.priceBox}>
              <strong style={s.priceStrong}>$197</strong> — applied as credit toward your first treatment or lab package
            </div>
            <button style={s.btn} onClick={startAssessment}>
              Book Your Range Assessment
            </button>
          </section>
        </main>

        {/* Footer */}
        <footer style={s.footer}>
          <div style={s.footerInner}>
            <div style={s.footerCol}>
              <p style={s.footerLabel}>RANGE MEDICAL</p>
              <p style={s.footerText}>
                1901 Westcliff Drive, Suite 10<br />
                Newport Beach, CA 92660
              </p>
            </div>
            <div style={s.footerCol}>
              <p style={s.footerLabel}>CONTACT</p>
              <p style={s.footerText}>
                (949) 997-3988<br />
                range-medical.com
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// ─── v2 STYLES ────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    WebkitFontSmoothing: 'antialiased',
    color: '#1a1a1a',
  },
  header: {
    borderBottom: '1px solid #e8e8e8',
    padding: '0 2.5rem',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 48,
    display: 'block',
  },
  container: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '0 2rem 80px',
  },

  // ── Hero ──
  heroSection: {
    padding: '5rem 0 3.5rem',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#737373',
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    background: '#808080',
  },
  headline: {
    fontSize: 'clamp(2rem, 5vw, 2.75rem)',
    fontWeight: 900,
    color: '#1a1a1a',
    lineHeight: 0.95,
    letterSpacing: '-0.02em',
    margin: '0 0 20px',
    textTransform: 'none',
  },
  headlineSub: {
    fontSize: 17,
    lineHeight: 1.75,
    color: '#737373',
    margin: '0 0 28px',
    maxWidth: 520,
  },
  priceBox: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: 500,
    marginBottom: 28,
    background: '#fafafa',
    padding: '16px 20px',
    borderLeft: '3px solid #1a1a1a',
    lineHeight: 1.5,
  },
  priceStrong: {
    fontWeight: 800,
  },
  btn: {
    display: 'block',
    width: '100%',
    padding: '18px 32px',
    background: '#1a1a1a',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: 'inherit',
  },
  trustRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px 14px',
    marginTop: 28,
    paddingTop: 24,
    borderTop: '1px solid #e0e0e0',
  },
  trustItem: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: '#737373',
    textTransform: 'uppercase',
  },
  trustDivider: {
    display: 'inline-block',
    width: 4,
    height: 4,
    background: '#d0d0d0',
    borderRadius: 0,
  },

  // ── Section frame ──
  section: {
    paddingTop: '4rem',
    paddingBottom: 0,
  },
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#737373',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionRule: {
    width: '100%',
    height: 1,
    background: '#e0e0e0',
    marginBottom: 28,
  },

  // ── Bullet list (Who this is for) ──
  bulletList: {
    borderTop: '1px solid #e0e0e0',
  },
  bulletItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 20,
    padding: '20px 0',
    borderBottom: '1px solid #e0e0e0',
  },
  bulletNum: {
    fontSize: 12,
    fontWeight: 600,
    color: '#808080',
    letterSpacing: '0.05em',
    flexShrink: 0,
    paddingTop: 2,
    minWidth: 28,
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 1.6,
    color: '#1a1a1a',
  },

  // ── Editorial list (What you get / How it works) ──
  editorialList: {
    borderTop: '1px solid #e0e0e0',
  },
  editorialItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 20,
    padding: '24px 0',
    borderBottom: '1px solid #e0e0e0',
  },
  editorialNum: {
    fontSize: 12,
    fontWeight: 600,
    color: '#808080',
    letterSpacing: '0.05em',
    flexShrink: 0,
    paddingTop: 4,
    minWidth: 28,
  },
  editorialTitle: {
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: '-0.01em',
    color: '#1a1a1a',
    margin: '0 0 8px',
    textTransform: 'none',
  },
  editorialDesc: {
    fontSize: 15,
    lineHeight: 1.7,
    color: '#737373',
    margin: 0,
  },

  // ── FAQ ──
  faqItem: {
    borderBottom: '1px solid #e0e0e0',
  },
  faqButton: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    gap: 16,
  },
  faqQ: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a1a',
    letterSpacing: '-0.005em',
    lineHeight: 1.3,
  },
  faqIcon: {
    color: '#737373',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  faqA: {
    fontSize: 15,
    lineHeight: 1.75,
    color: '#737373',
    margin: '0 0 22px',
    paddingRight: 32,
  },

  // ── Final CTA ──
  finalSection: {
    paddingTop: '4rem',
  },
  finalTitle: {
    fontSize: 'clamp(1.75rem, 4.5vw, 2.25rem)',
    fontWeight: 900,
    color: '#1a1a1a',
    lineHeight: 1,
    letterSpacing: '-0.02em',
    margin: '0 0 18px',
    textTransform: 'none',
  },
  finalSub: {
    fontSize: 16,
    lineHeight: 1.75,
    color: '#737373',
    margin: '0 0 28px',
    maxWidth: 520,
  },

  // ── Footer ──
  footer: {
    borderTop: '1px solid #e0e0e0',
    padding: '40px 2rem',
    background: '#fafafa',
  },
  footerInner: {
    maxWidth: 640,
    margin: '0 auto',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '32px 64px',
    justifyContent: 'space-between',
  },
  footerCol: {
    minWidth: 180,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#737373',
    textTransform: 'uppercase',
    margin: '0 0 10px',
  },
  footerText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#1a1a1a',
    margin: 0,
  },
};
