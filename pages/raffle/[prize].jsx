// pages/raffle/[prize].jsx
// Raffle winner landing page — lands here from the QR code on the printed
// 6x4 card. One page handles both supported prizes: `hbot` and `red-light`.

import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const PRIZES = {
  hbot: {
    label: 'Hyperbaric Oxygen Therapy',
    short: 'HBOT',
    tagline: 'Pressurized oxygen. Real recovery.',
    serviceHref: '/hbot',
    benefits: [
      { n: '01', title: 'Accelerated Recovery', desc: 'Floods tissues with oxygen to speed healing after injury, surgery, or hard training.' },
      { n: '02', title: 'Inflammation Control', desc: 'Helps quiet systemic inflammation that drags down energy, sleep, and performance.' },
      { n: '03', title: 'Cognitive Clarity', desc: 'Higher oxygen delivery to the brain — patients describe sharper focus and clearer thinking.' },
    ],
    how: 'Each session is about 60 minutes inside our pressurized chamber. No prep required — show up comfortable and bring something to read or listen to.',
  },
  'red-light': {
    label: 'Red Light Therapy',
    short: 'RLT',
    tagline: 'Full-body LED. 20 minutes to reset.',
    serviceHref: '/red-light-therapy',
    benefits: [
      { n: '01', title: 'Muscle & Joint Recovery', desc: 'Near-infrared light supports tissue repair and may reduce soreness and stiffness.' },
      { n: '02', title: 'Skin & Collagen', desc: 'Red wavelengths may stimulate collagen production for tone, texture, and elasticity.' },
      { n: '03', title: 'Energy & Sleep', desc: 'Supports mitochondrial function and circadian rhythm — better energy during the day, deeper sleep at night.' },
    ],
    how: 'Each session is about 20 minutes in our full-body INNER Light LED bed. No downtime, no discomfort — just gentle warmth.',
  },
};

export default function RafflePrize({ prize }) {
  const router = useRouter();
  const code = typeof router.query.c === 'string' ? router.query.c : null;

  if (!prize) {
    return (
      <Layout title="Range Medical" description="Range Medical raffle prize.">
        <div style={styles.page}>
          <div style={styles.wrap}>
            <div style={styles.eyebrow}><span style={styles.dot} /> RAFFLE</div>
            <h1 style={styles.h1}>PRIZE NOT FOUND</h1>
            <div style={styles.rule} />
            <p style={styles.lead}>
              This link doesn&apos;t match an active Range Medical raffle prize.
              If you believe this is an error, call or text (949) 997-3988.
            </p>
            <div style={styles.ctaRow}>
              <Link href="/" style={styles.primaryBtn}>Return Home</Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const title = `You Won — ${prize.label} | Range Medical`;

  return (
    <Layout title={title} description={`Raffle prize: 5 free ${prize.label} sessions at Range Medical in Newport Beach.`}>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div style={styles.page}>
        <div style={styles.wrap}>

          {/* Hero */}
          <section style={styles.hero}>
            <div style={styles.eyebrow}>
              <span style={styles.dot} /> RAFFLE PRIZE
            </div>
            <h1 style={styles.h1}>YOU&apos;VE WON</h1>
            <div style={styles.rule} />
            <div style={styles.prizeBlock}>
              <div style={styles.prizeKicker}>Your prize</div>
              <div style={styles.prizeLine}>5 COMPLIMENTARY</div>
              <div style={styles.prizeLineMain}>{prize.label.toUpperCase()}</div>
              <div style={styles.prizeLineMain}>SESSIONS</div>
              <div style={styles.prizeTagline}>{prize.tagline}</div>
            </div>

            {code && (
              <div style={styles.codeBox}>
                <div style={styles.codeLabel}>RAFFLE CODE ON YOUR CARD</div>
                <div style={styles.codeValue}>{code}</div>
                <div style={styles.codeHint}>Present the physical card at redemption.</div>
              </div>
            )}
          </section>

          {/* How to redeem */}
          <section style={styles.sectionAlt}>
            <div style={styles.sectionInner}>
              <div style={styles.eyebrow}><span style={styles.dot} /> HOW TO REDEEM</div>
              <h2 style={styles.h2}>THREE STEPS</h2>
              <div style={styles.rule} />

              <div style={styles.steps}>
                <div style={styles.step}>
                  <div style={styles.stepNum}>01</div>
                  <h3 style={styles.h3}>Call or text us</h3>
                  <p style={styles.body}>
                    Reach the clinic at <b>(949) 997-3988</b> to schedule your first session.
                    Mention your raffle code.
                  </p>
                </div>
                <div style={styles.step}>
                  <div style={styles.stepNum}>02</div>
                  <h3 style={styles.h3}>Bring your card</h3>
                  <p style={styles.body}>
                    Bring the physical raffle card to your first visit so our team can verify
                    and log your sessions.
                  </p>
                </div>
                <div style={styles.step}>
                  <div style={styles.stepNum}>03</div>
                  <h3 style={styles.h3}>Use your 5 sessions</h3>
                  <p style={styles.body}>
                    Sessions are yours to use within 12 months of the raffle. Schedule at
                    your pace — one session or back-to-back.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* What to expect */}
          <section style={styles.section}>
            <div style={styles.sectionInner}>
              <div style={styles.eyebrow}><span style={styles.dot} /> WHAT TO EXPECT</div>
              <h2 style={styles.h2}>ABOUT {prize.short}</h2>
              <div style={styles.rule} />
              <p style={styles.lead}>{prize.how}</p>

              <div style={styles.benefits}>
                {prize.benefits.map(b => (
                  <div key={b.n} style={styles.benefit}>
                    <div style={styles.benefitNum}>{b.n}</div>
                    <h3 style={styles.h3}>{b.title}</h3>
                    <p style={styles.body}>{b.desc}</p>
                  </div>
                ))}
              </div>

              <div style={styles.ctaRow}>
                <a href="tel:+19499973988" style={styles.primaryBtn}>Call (949) 997-3988</a>
                <a href="sms:+19499973988" style={styles.secondaryBtn}>Text to Schedule</a>
                <Link href={prize.serviceHref} style={styles.secondaryBtn}>Learn More</Link>
              </div>
            </div>
          </section>

          {/* Fine print */}
          <section style={styles.finePrintSection}>
            <div style={styles.sectionInner}>
              <div style={styles.finePrint}>
                Prize includes 5 complimentary {prize.label} sessions at Range Medical, Newport Beach.
                Non-transferable. No cash value. Cannot be combined with other offers or memberships.
                Sessions expire 12 months from the raffle date. Subject to scheduling availability and
                a brief pre-visit screening.
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ params }) {
  const slug = params?.prize;
  const prize = PRIZES[slug] || null;
  return { props: { prize } };
}

// ---- Styles (v2 editorial: black/white, hairline rules, uppercase headers) ----
const styles = {
  page: {
    background: '#ffffff',
    color: '#1a1a1a',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  wrap: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  hero: {
    padding: '5rem 2.5rem 4rem',
    borderBottom: '1px solid #e8e8e8',
  },
  section: {
    padding: '5rem 0',
    borderBottom: '1px solid #e8e8e8',
  },
  sectionAlt: {
    padding: '5rem 0',
    background: '#fafafa',
    borderBottom: '1px solid #e8e8e8',
  },
  sectionInner: {
    padding: '0 2.5rem',
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: '#737373',
    textTransform: 'uppercase',
    marginBottom: '1.25rem',
  },
  dot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    background: '#1a1a1a',
    borderRadius: 0,
  },
  h1: {
    fontSize: 'clamp(2.75rem, 7vw, 5rem)',
    fontWeight: 900,
    lineHeight: 0.95,
    letterSpacing: '-0.03em',
    color: '#1a1a1a',
    textTransform: 'uppercase',
    margin: 0,
  },
  h2: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 900,
    lineHeight: 0.95,
    letterSpacing: '-0.02em',
    color: '#1a1a1a',
    textTransform: 'uppercase',
    margin: 0,
  },
  h3: {
    fontSize: '1.125rem',
    fontWeight: 800,
    color: '#1a1a1a',
    letterSpacing: '-0.01em',
    margin: '0 0 0.5rem 0',
    textTransform: 'uppercase',
  },
  rule: {
    width: '48px',
    height: '1px',
    background: '#1a1a1a',
    margin: '1.5rem 0',
  },
  lead: {
    fontSize: '1.125rem',
    lineHeight: 1.7,
    color: '#404040',
    maxWidth: '48rem',
    margin: '0 0 2rem 0',
  },
  body: {
    fontSize: '0.9375rem',
    lineHeight: 1.7,
    color: '#737373',
    margin: 0,
  },

  prizeBlock: {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '1px solid #e0e0e0',
  },
  prizeKicker: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: '#737373',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
  },
  prizeLine: {
    fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
    fontWeight: 800,
    letterSpacing: '-0.01em',
    color: '#1a1a1a',
    lineHeight: 1.05,
    textTransform: 'uppercase',
  },
  prizeLineMain: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: '#1a1a1a',
    lineHeight: 1.0,
    textTransform: 'uppercase',
  },
  prizeTagline: {
    marginTop: '1rem',
    fontSize: '1rem',
    color: '#737373',
    fontStyle: 'italic',
  },

  codeBox: {
    marginTop: '2.5rem',
    padding: '1.25rem 1.5rem',
    border: '1px solid #1a1a1a',
    display: 'inline-block',
    minWidth: '260px',
  },
  codeLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: '#737373',
    textTransform: 'uppercase',
  },
  codeValue: {
    fontFamily: "'Courier New', monospace",
    fontSize: '1.375rem',
    fontWeight: 700,
    color: '#1a1a1a',
    letterSpacing: '0.04em',
    margin: '0.5rem 0 0.25rem',
  },
  codeHint: {
    fontSize: '0.75rem',
    color: '#737373',
  },

  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '2rem',
    marginTop: '2rem',
  },
  step: {
    padding: '2rem',
    background: '#ffffff',
    border: '1px solid #e0e0e0',
  },
  stepNum: {
    fontSize: '2rem',
    fontWeight: 900,
    color: '#1a1a1a',
    lineHeight: 1,
    marginBottom: '1rem',
    letterSpacing: '-0.02em',
  },

  benefits: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '2rem',
    marginTop: '2rem',
  },
  benefit: {
    padding: '2rem 0',
    borderTop: '1px solid #e0e0e0',
  },
  benefitNum: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: '#737373',
    marginBottom: '0.75rem',
  },

  ctaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginTop: '2.5rem',
  },
  primaryBtn: {
    display: 'inline-block',
    padding: '1rem 2rem',
    background: '#1a1a1a',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.875rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    border: '1px solid #1a1a1a',
  },
  secondaryBtn: {
    display: 'inline-block',
    padding: '1rem 2rem',
    background: '#ffffff',
    color: '#1a1a1a',
    fontWeight: 700,
    fontSize: '0.875rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    border: '1px solid #1a1a1a',
  },

  finePrintSection: {
    padding: '3rem 0',
    background: '#fafafa',
  },
  finePrint: {
    fontSize: '0.8125rem',
    lineHeight: 1.7,
    color: '#737373',
    maxWidth: '48rem',
  },
};
