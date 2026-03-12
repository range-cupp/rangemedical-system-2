import Head from 'next/head';
import Link from 'next/link';

export default function GiftEssentialPanel() {
  const biomarkers = [
    {
      category: 'Hormones',
      icon: '⚡',
      color: '#7c3aed',
      bg: '#f5f3ff',
      markers: [
        {
          name: 'Estradiol (E2)',
          what: 'Your primary estrogen.',
          why: 'Regulates energy, mood, bone density, and libido. Low or imbalanced estradiol is one of the most common reasons women feel off — anxious, tired, or just not like themselves.',
        },
        {
          name: 'Progesterone',
          what: 'Your calming, balancing hormone.',
          why: 'Works alongside estrogen to regulate your cycle, sleep quality, and mood. Low progesterone often shows up as anxiety, poor sleep, and PMS-type symptoms even outside your cycle.',
        },
        {
          name: 'Total & Free Testosterone',
          what: 'Yes — women need testosterone too.',
          why: 'Drives motivation, confidence, muscle tone, and libido. Many women are surprised to find this is the missing piece behind low drive and energy.',
        },
        {
          name: 'SHBG (Sex Hormone Binding Globulin)',
          what: 'The protein that "ties up" your hormones.',
          why: 'High SHBG means your body has hormones available but can\'t use them — like having money in a locked account. This number puts your other hormone levels in context.',
        },
      ],
    },
    {
      category: 'Thyroid',
      icon: '🦋',
      color: '#0369a1',
      bg: '#f0f9ff',
      markers: [
        {
          name: 'TSH (Thyroid Stimulating Hormone)',
          what: 'Your brain\'s signal to your thyroid.',
          why: 'When TSH is out of range, your metabolism slows down or speeds up unexpectedly. It\'s one of the first places to look when energy, weight, or mood feels off — and it\'s routinely missed at standard checkups.',
        },
        {
          name: 'Free T4',
          what: 'The hormone your thyroid produces.',
          why: 'T4 is the raw material your body converts into active thyroid hormone. Seeing this alongside TSH gives us a much fuller picture of whether your thyroid is actually doing its job.',
        },
      ],
    },
    {
      category: 'Metabolic',
      icon: '🔥',
      color: '#b45309',
      bg: '#fffbeb',
      markers: [
        {
          name: 'Comprehensive Metabolic Panel (CMP)',
          what: '14 markers covering blood sugar, kidney function, liver health, and electrolytes.',
          why: 'This is the foundation. It tells us how your body is processing everything you put into it — and whether organs are under stress you might not feel yet.',
        },
        {
          name: 'Lipid Panel',
          what: 'Cholesterol — total, HDL, LDL, and triglycerides.',
          why: 'Not just a heart health check. Cholesterol is the building block for all your hormones. Imbalances here affect energy, recovery, and how well your body produces the hormones it needs.',
        },
        {
          name: 'HbA1c',
          what: 'Your 3-month blood sugar average.',
          why: 'A single glucose reading is a snapshot. HbA1c shows the trend — whether your blood sugar has been spiking and crashing in ways that explain fatigue, cravings, and mental fog.',
        },
      ],
    },
    {
      category: 'General Health',
      icon: '🩺',
      color: '#065f46',
      bg: '#f0fdf4',
      markers: [
        {
          name: 'CBC with Differential',
          what: 'A complete count of your blood cells.',
          why: 'Tells us about your immune function, whether you\'re anemic, and how your bone marrow is working. Anemia alone explains a massive amount of chronic fatigue that gets overlooked.',
        },
        {
          name: 'Vitamin D',
          what: 'More hormone than vitamin — critical for nearly everything.',
          why: 'Vitamin D deficiency affects immunity, mood, bone health, and even cancer risk. It\'s extremely common in Southern California despite the sunshine — most people don\'t absorb it efficiently from sunlight alone.',
        },
        {
          name: 'Ferritin',
          what: 'Your iron storage marker.',
          why: 'You can have "normal" iron levels on a basic test and still have critically low ferritin — which causes hair loss, exhaustion, and exercise intolerance. This is one of the most underdiagnosed issues in women.',
        },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>A Gift for Michelle Douglas | Range Medical</title>
        <meta name="description" content="You've been gifted an Essential Lab Panel from Range Medical." />
        <meta name="robots" content="noindex" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={styles.page}>

        {/* ── GIFT REVEAL HERO ── */}
        <section style={styles.hero}>
          <div style={styles.heroInner}>
            <div style={styles.giftBadge}>🎁 A Gift For You</div>
            <h1 style={styles.heroName}>Michelle,</h1>
            <p style={styles.heroSubtitle}>
              JP Peray has gifted you a Range Medical <strong>Essential Lab Panel</strong> — a comprehensive look at the hormones, thyroid, metabolism, and health markers that shape how you feel every day.
            </p>
            <div style={styles.giftCard}>
              <div style={styles.giftCardTop}>
                <span style={styles.giftCardFrom}>From</span>
                <span style={styles.giftCardName}>JP Peray</span>
              </div>
              <div style={styles.giftCardDivider} />
              <div style={styles.giftCardBottom}>
                <div style={styles.giftCardItem}>
                  <span style={styles.giftCardLabel}>Gift</span>
                  <span style={styles.giftCardValue}>Essential Lab Panel</span>
                </div>
                <div style={styles.giftCardItem}>
                  <span style={styles.giftCardLabel}>Value</span>
                  <span style={styles.giftCardValue}>$350</span>
                </div>
                <div style={styles.giftCardItem}>
                  <span style={styles.giftCardLabel}>Status</span>
                  <span style={{ ...styles.giftCardValue, color: '#16a34a', fontWeight: 600 }}>✓ Ready to Redeem</span>
                </div>
              </div>
            </div>
            <p style={styles.heroCta}>
              Call or text us at <a href="tel:+19499973988" style={styles.heroLink}>(949) 997-3988</a> to schedule your blood draw — we'll handle the rest.
            </p>
          </div>
        </section>

        {/* ── WHAT THIS IS ── */}
        <section style={styles.section}>
          <div style={styles.container}>
            <div style={styles.sectionKicker}>What You're Getting</div>
            <h2 style={styles.sectionTitle}>More Than a Blood Test</h2>
            <p style={styles.sectionSubtitle}>
              Most annual physicals run a basic metabolic panel and call it done. The Range Essential Panel goes significantly deeper — specifically designed to surface the things that make you feel <em>off</em> but never show up on standard labs.
            </p>

            <div style={styles.processGrid}>
              {[
                { num: '1', title: 'Book Your Draw', desc: 'Call or text (949) 997-3988. We\'ll get you scheduled at our Newport Beach office.' },
                { num: '2', title: 'Quick Blood Draw', desc: 'About 15 minutes on-site. Fasting recommended for 10–12 hours beforehand for the most accurate results.' },
                { num: '3', title: 'Results in 3–5 Days', desc: 'Your provider reviews every marker before your consultation — nothing gets glossed over.' },
                { num: '4', title: 'Provider Review', desc: 'We explain what\'s off, why it matters, and what your options are. No guessing, no confusing lab printouts.' },
              ].map((step) => (
                <div key={step.num} style={styles.processStep}>
                  <div style={styles.stepNum}>{step.num}</div>
                  <h4 style={styles.stepTitle}>{step.title}</h4>
                  <p style={styles.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BIOMARKERS ── */}
        <section style={{ ...styles.section, background: '#fafafa' }}>
          <div style={styles.container}>
            <div style={styles.sectionKicker}>The Panel</div>
            <h2 style={styles.sectionTitle}>What We're Testing — and Why It Matters to You</h2>
            <p style={styles.sectionSubtitle}>
              Every marker below has a reason it's on this panel. Here's what we're looking at, and what it's actually telling us about how you feel.
            </p>

            <div style={styles.categoryGrid}>
              {biomarkers.map((cat) => (
                <div key={cat.category} style={{ ...styles.categoryCard, borderTopColor: cat.color }}>
                  <div style={styles.categoryHeader}>
                    <span style={styles.categoryIcon}>{cat.icon}</span>
                    <h3 style={{ ...styles.categoryTitle, color: cat.color }}>{cat.category}</h3>
                  </div>
                  <div style={styles.markerList}>
                    {cat.markers.map((marker) => (
                      <div key={marker.name} style={styles.markerItem}>
                        <div style={styles.markerName}>{marker.name}</div>
                        <div style={styles.markerWhat}>{marker.what}</div>
                        <div style={styles.markerWhy}>{marker.why}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ABOUT RANGE ── */}
        <section style={styles.section}>
          <div style={styles.container}>
            <div style={styles.aboutGrid}>
              <div>
                <div style={styles.sectionKicker}>About Range Medical</div>
                <h2 style={{ ...styles.sectionTitle, textAlign: 'left' }}>Medicine That Goes Beyond the Checkup</h2>
                <p style={styles.aboutText}>
                  Range Medical is a regenerative medicine clinic in Newport Beach focused on helping people optimize how they feel — not just avoid disease. We specialize in hormone optimization, lab-guided care, IV therapy, peptide protocols, and more.
                </p>
                <p style={styles.aboutText}>
                  When you come in for your lab draw, you'll work with licensed providers who will actually take the time to explain your results and build a plan around them. No 7-minute appointments. No "your labs are normal" when you clearly don't feel normal.
                </p>
              </div>
              <div style={styles.aboutDetails}>
                <div style={styles.detailCard}>
                  <div style={styles.detailIcon}>📍</div>
                  <div>
                    <div style={styles.detailLabel}>Location</div>
                    <div style={styles.detailValue}>Newport Beach, CA</div>
                  </div>
                </div>
                <div style={styles.detailCard}>
                  <div style={styles.detailIcon}>📞</div>
                  <div>
                    <div style={styles.detailLabel}>Call or Text</div>
                    <div style={styles.detailValue}>(949) 997-3988</div>
                  </div>
                </div>
                <div style={styles.detailCard}>
                  <div style={styles.detailIcon}>⏱️</div>
                  <div>
                    <div style={styles.detailLabel}>Blood Draw Time</div>
                    <div style={styles.detailValue}>~15 minutes on-site</div>
                  </div>
                </div>
                <div style={styles.detailCard}>
                  <div style={styles.detailIcon}>📋</div>
                  <div>
                    <div style={styles.detailLabel}>Results</div>
                    <div style={styles.detailValue}>3–5 business days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={styles.finalCta}>
          <div style={styles.container}>
            <h2 style={styles.ctaTitle}>Ready to Get Started, Michelle?</h2>
            <p style={styles.ctaSubtitle}>
              Your Essential Panel is fully covered as a gift from JP. Just give us a call to schedule your blood draw at our Newport Beach location.
            </p>
            <a href="tel:+19499973988" style={styles.ctaButton}>
              📞 Call (949) 997-3988
            </a>
            <p style={styles.ctaNote}>
              Prefer to text? That works too — same number. We typically respond within a few hours during business hours.
            </p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={styles.footer}>
          <div style={styles.container}>
            <div style={styles.footerInner}>
              <span style={styles.footerBrand}>Range Medical</span>
              <span style={styles.footerSep}>·</span>
              <a href="tel:+19499973988" style={styles.footerLink}>(949) 997-3988</a>
              <span style={styles.footerSep}>·</span>
              <a href="https://www.range-medical.com" style={styles.footerLink}>range-medical.com</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

const styles = {
  page: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#171717',
    lineHeight: 1.6,
    margin: 0,
    padding: 0,
    background: '#ffffff',
  },

  // ── Hero
  hero: {
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
    padding: '5rem 1.5rem',
    textAlign: 'center',
  },
  heroInner: {
    maxWidth: 680,
    margin: '0 auto',
  },
  giftBadge: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#ffffff',
    padding: '0.5rem 1.25rem',
    borderRadius: 100,
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '1.5rem',
    backdropFilter: 'blur(4px)',
  },
  heroName: {
    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 1rem',
    letterSpacing: '-0.02em',
  },
  heroSubtitle: {
    fontSize: '1.125rem',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: '2.5rem',
    lineHeight: 1.7,
  },

  // ── Gift Card
  giftCard: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: '2rem',
    marginBottom: '2.5rem',
    backdropFilter: 'blur(8px)',
    textAlign: 'left',
  },
  giftCardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  giftCardFrom: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.45)',
  },
  giftCardName: {
    fontSize: '1.375rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  giftCardDivider: {
    height: 1,
    background: 'rgba(255,255,255,0.1)',
    marginBottom: '1.25rem',
  },
  giftCardBottom: {
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  giftCardItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  giftCardLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.45)',
  },
  giftCardValue: {
    fontSize: '1rem',
    fontWeight: 500,
    color: '#ffffff',
  },

  heroCta: {
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.65)',
  },
  heroLink: {
    color: '#ffffff',
    fontWeight: 700,
    textDecoration: 'none',
  },

  // ── Sections
  section: {
    padding: '5rem 1.5rem',
    background: '#ffffff',
  },
  container: {
    maxWidth: 1040,
    margin: '0 auto',
  },
  sectionKicker: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#a3a3a3',
    marginBottom: '0.75rem',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
    fontWeight: 700,
    letterSpacing: '-0.025em',
    marginBottom: '1rem',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  sectionSubtitle: {
    fontSize: '1.0625rem',
    color: '#525252',
    maxWidth: 620,
    margin: '0 auto 3rem',
    textAlign: 'center',
    lineHeight: 1.7,
  },

  // ── Process Steps
  processGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
  },
  processStep: {
    textAlign: 'center',
  },
  stepNum: {
    width: 48,
    height: 48,
    background: '#171717',
    color: '#ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1.125rem',
    margin: '0 auto 1rem',
  },
  stepTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
  },
  stepDesc: {
    fontSize: '0.875rem',
    color: '#525252',
    lineHeight: 1.6,
    margin: 0,
  },

  // ── Biomarker Categories
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
    gap: '1.5rem',
  },
  categoryCard: {
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    borderTop: '4px solid #171717',
    borderRadius: 16,
    padding: '1.75rem',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    marginBottom: '1.5rem',
  },
  categoryIcon: {
    fontSize: '1.25rem',
  },
  categoryTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },
  markerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  markerItem: {
    borderBottom: '1px solid #f5f5f5',
    paddingBottom: '1.25rem',
  },
  markerName: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    marginBottom: '0.2rem',
    color: '#171717',
  },
  markerWhat: {
    fontSize: '0.875rem',
    color: '#737373',
    fontStyle: 'italic',
    marginBottom: '0.4rem',
  },
  markerWhy: {
    fontSize: '0.875rem',
    color: '#404040',
    lineHeight: 1.6,
    margin: 0,
  },

  // ── About
  aboutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    alignItems: 'start',
  },
  aboutText: {
    fontSize: '1rem',
    color: '#404040',
    lineHeight: 1.75,
    marginBottom: '1rem',
  },
  aboutDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  detailCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: '#fafafa',
    border: '1px solid #e5e5e5',
    borderRadius: 12,
    padding: '1rem 1.25rem',
  },
  detailIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  detailLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#a3a3a3',
    marginBottom: '0.2rem',
  },
  detailValue: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#171717',
  },

  // ── Final CTA
  finalCta: {
    background: '#0a0a0a',
    padding: '5rem 1.5rem',
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.025em',
    marginBottom: '1rem',
    lineHeight: 1.2,
  },
  ctaSubtitle: {
    fontSize: '1.0625rem',
    color: 'rgba(255,255,255,0.65)',
    maxWidth: 560,
    margin: '0 auto 2.5rem',
    lineHeight: 1.7,
  },
  ctaButton: {
    display: 'inline-block',
    background: '#ffffff',
    color: '#0a0a0a',
    padding: '1rem 2.5rem',
    borderRadius: 100,
    fontWeight: 700,
    fontSize: '1.0625rem',
    textDecoration: 'none',
    letterSpacing: '-0.01em',
    transition: 'opacity 0.2s',
  },
  ctaNote: {
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: 'rgba(255,255,255,0.45)',
  },

  // ── Footer
  footer: {
    padding: '1.5rem',
    borderTop: '1px solid #e5e5e5',
  },
  footerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    fontSize: '0.875rem',
  },
  footerBrand: {
    fontWeight: 700,
    color: '#171717',
  },
  footerSep: {
    color: '#d4d4d4',
  },
  footerLink: {
    color: '#525252',
    textDecoration: 'none',
  },
};
