import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Check, ChevronDown, ClipboardList, Clock, UserCheck } from 'lucide-react';

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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={styles.page}>
        {/* Header */}
        <header style={styles.header}>
          <img src="/brand/range_logo_transparent_black.png" alt="Range Medical" style={styles.logo} />
        </header>

        <main style={styles.container}>
          {/* ─── HERO ─── */}
          <section style={styles.hero}>
            <p style={styles.label}>RANGE MEDICAL &middot; ORANGE COUNTY</p>
            <h1 style={styles.headline}>
              Over 40 and still don't feel like yourself?
            </h1>
            <p style={styles.subheadline}>
              The Range Assessment is a 30-minute 1-on-1 with a Range Medical provider — symptoms review, lab recommendations, and a personalized written plan you take home. $197, credited back toward your first treatment.
            </p>
            <button style={styles.ctaBtn} onClick={startAssessment}>
              Book Your Range Assessment
            </button>
            <div style={styles.trustRow}>
              <span style={styles.trustItem}>
                <Check size={16} color="#2E6B35" /> 30 minutes, 1-on-1
              </span>
              <span style={styles.trustItem}>
                <Check size={16} color="#2E6B35" /> Personalized written plan
              </span>
              <span style={styles.trustItem}>
                <Check size={16} color="#2E6B35" /> $197 credited to treatment
              </span>
            </div>
          </section>

          {/* ─── WHO THIS IS FOR ─── */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Who this is for</h2>
            <div style={styles.bulletList}>
              {[
                "You're over 40 and your energy, focus, or drive isn't what it used to be",
                "You've been told your labs are \"normal\" but you still feel off",
                "You're on weight-loss shots, peptides, or hormones with little or no baseline labs",
                "You're tired of guessing and want a clear, data-driven answer",
                "You want a provider who takes time to explain things in plain language",
              ].map((text, i) => (
                <div key={i} style={styles.bulletItem}>
                  <span style={styles.bulletDot} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ─── WHAT YOU GET ─── */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>What you get</h2>
            <div style={styles.cardGrid}>
              {[
                {
                  icon: <UserCheck size={22} />,
                  title: 'Symptoms review',
                  desc: 'A short questionnaire so your provider walks in already knowing your story, history, and goals.',
                },
                {
                  icon: <Clock size={22} />,
                  title: '30-minute 1-on-1 visit',
                  desc: 'Unhurried time with a provider who actually listens — no rushed appointments, no feeling like a number.',
                },
                {
                  icon: <ClipboardList size={22} />,
                  title: 'Personalized written plan',
                  desc: 'You walk out with a real plan built for you — what is going on, what to do next, and which labs or treatments your provider recommends.',
                },
                {
                  icon: <Check size={22} />,
                  title: '$197 credited back',
                  desc: 'Your full $197 is applied as credit toward your first treatment or lab package — so the assessment is essentially free if you move forward.',
                },
              ].map((card, i) => (
                <div key={i} style={styles.card}>
                  <div style={styles.cardIcon}>{card.icon}</div>
                  <h3 style={styles.cardTitle}>{card.title}</h3>
                  <p style={styles.cardDesc}>{card.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ─── HOW IT WORKS ─── */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>How it works</h2>
            <div style={styles.steps}>
              {[
                { num: '1', title: 'Book and pay $197', desc: 'Pick a time that works for you and reserve your spot. The $197 is credited back toward your first treatment or lab package.' },
                { num: '2', title: 'Complete a quick intake', desc: 'We text you a short medical intake form — history, meds, allergies, photo ID. Takes about 5 minutes from your phone.' },
                { num: '3', title: 'Come in and get your plan', desc: 'Sit down 1-on-1 with your provider for 30 focused minutes. Walk out the same visit with your personalized written plan.' },
              ].map((step, i) => (
                <div key={i}>
                  {i > 0 && <div style={styles.stepLine} />}
                  <div style={styles.step}>
                    <div style={styles.stepNum}>{step.num}</div>
                    <div>
                      <h3 style={styles.stepTitle}>{step.title}</h3>
                      <p style={styles.stepDesc}>{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── FAQ ─── */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Common questions</h2>
            <div style={styles.faqList}>
              {faqs.map((faq, i) => (
                <div key={i} style={styles.faqItem}>
                  <button
                    style={styles.faqQuestion}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        color: '#888',
                        transition: 'transform 0.2s',
                        flexShrink: 0,
                        transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)',
                      }}
                    />
                  </button>
                  {openFaq === i && <p style={styles.faqAnswer}>{faq.a}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* ─── FINAL CTA ─── */}
          <section style={styles.finalCta}>
            <h2 style={styles.finalTitle}>Ready to stop guessing?</h2>
            <p style={styles.finalSub}>
              30 minutes, 1-on-1 with a provider, and a written plan you take home. $197 — credited back if you move forward.
            </p>
            <button style={styles.ctaBtn} onClick={startAssessment}>
              Book Your Range Assessment
            </button>
          </section>

          {/* ─── BOTTOM CTA ─── */}
          <section style={styles.bottomCta}>
            <button style={{ ...styles.ctaBtn, width: '100%' }} onClick={startAssessment}>
              Start Your Range Assessment
            </button>
            <p style={styles.formNote}>
              $197 — credited toward your first treatment or lab package.
            </p>
          </section>
        </main>

        {/* Footer */}
        <footer style={styles.footer}>
          <p style={styles.footerText}>
            Range Medical &middot; 1901 Westcliff Dr, Suite 10, Newport Beach, CA &middot; (949) 997-3988
          </p>
        </footer>
      </div>
    </>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    WebkitFontSmoothing: 'antialiased',
    color: '#1a1a1a',
  },
  header: {
    borderBottom: '1px solid #e8e8e8',
    padding: '0 1.5rem',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 40,
    display: 'block',
  },
  container: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '0 1.25rem 4rem',
  },

  // Hero
  hero: {
    paddingTop: '3.5rem',
    paddingBottom: '3rem',
    borderBottom: '1px solid #eaeaea',
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#888',
    textTransform: 'uppercase',
    margin: '0 0 18px',
  },
  headline: {
    fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
    fontWeight: 900,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    color: '#1a1a1a',
    margin: '0 0 18px',
    textTransform: 'none',
  },
  subheadline: {
    fontSize: 16,
    lineHeight: 1.7,
    color: '#555',
    margin: '0 0 32px',
    maxWidth: 520,
  },
  ctaBtn: {
    display: 'inline-block',
    padding: '16px 36px',
    background: '#1a1a1a',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.03em',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    textAlign: 'center',
  },
  trustRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px 24px',
    marginTop: 28,
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#444',
  },

  // Section
  section: {
    paddingTop: '2.75rem',
    paddingBottom: '2.75rem',
    borderBottom: '1px solid #eaeaea',
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: 900,
    letterSpacing: '-0.01em',
    color: '#1a1a1a',
    margin: '0 0 22px',
    textTransform: 'none',
  },

  // Bullet list
  bulletList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  bulletItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    fontSize: 15,
    lineHeight: 1.6,
    color: '#333',
  },
  bulletDot: {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#1a1a1a',
    marginTop: 9,
    flexShrink: 0,
  },

  // Cards
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 16,
  },
  card: {
    padding: '22px 24px',
    border: '1px solid #eaeaea',
    borderRadius: 8,
  },
  cardIcon: {
    marginBottom: 10,
    color: '#1a1a1a',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    margin: '0 0 6px',
    color: '#1a1a1a',
    textTransform: 'none',
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#555',
    margin: 0,
  },

  // Steps
  steps: {
    display: 'flex',
    flexDirection: 'column',
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#1a1a1a',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 4px',
    color: '#1a1a1a',
    textTransform: 'none',
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#555',
    margin: 0,
  },
  stepLine: {
    width: 2,
    height: 20,
    background: '#e0e0e0',
    marginLeft: 17,
  },

  // FAQ
  faqList: {
    display: 'flex',
    flexDirection: 'column',
  },
  faqItem: {
    borderBottom: '1px solid #eaeaea',
  },
  faqQuestion: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    color: '#1a1a1a',
    textAlign: 'left',
    gap: 16,
    fontFamily: 'inherit',
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 1.7,
    color: '#555',
    margin: '0 0 16px',
    paddingRight: 32,
  },

  // Final CTA
  finalCta: {
    paddingTop: '3rem',
    paddingBottom: '3rem',
    textAlign: 'center',
    borderBottom: '1px solid #eaeaea',
  },
  finalTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: '#1a1a1a',
    margin: '0 0 10px',
    textTransform: 'none',
  },
  finalSub: {
    fontSize: 15,
    lineHeight: 1.7,
    color: '#555',
    margin: '0 auto 24px',
    maxWidth: 400,
  },

  // Bottom CTA
  bottomCta: {
    paddingTop: '2.5rem',
    paddingBottom: '2.5rem',
    textAlign: 'center',
  },
  formNote: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    margin: '12px 0 0',
  },
  // Footer
  footer: {
    borderTop: '1px solid #eaeaea',
    padding: '20px 1.5rem',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    margin: 0,
  },
};
