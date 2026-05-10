import Head from 'next/head';
import Link from 'next/link';
import { styles as s } from '../../components/AssessmentBooking';

// Backward compat: deep links with ?path=injury|energy|both redirect to the
// dedicated landing page server-side (faster than client-side, no flash).
export async function getServerSideProps({ query }) {
  const path = query.path;
  if (path === 'injury' || path === 'both') {
    return { redirect: { destination: '/assessment/injury', permanent: false } };
  }
  if (path === 'energy') {
    return { redirect: { destination: '/assessment/energy', permanent: false } };
  }
  return { props: {} };
}

const selectorStyles = {
  hero: {
    padding: '5rem 0 3rem',
  },
  pathGrid: {
    borderTop: '1px solid #e0e0e0',
  },
  pathCard: {
    padding: '2.5rem 0',
    borderBottom: '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'padding-left 0.2s',
    display: 'block',
    textDecoration: 'none',
    color: 'inherit',
  },
  pathNumber: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#808080',
    letterSpacing: '0.05em',
    marginBottom: 12,
  },
  pathTitle: {
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    color: '#1a1a1a',
    margin: '0 0 10px',
  },
  pathSub: {
    fontSize: 15,
    lineHeight: 1.7,
    color: '#737373',
    margin: 0,
  },
  pathArrow: {
    display: 'inline-block',
    marginTop: 20,
    padding: '14px 28px',
    background: '#2E5D3A',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: 0,
    textTransform: 'none',
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

export default function AssessmentSelector() {
  const paths = [
    {
      num: '01',
      href: '/assessment/injury',
      title: 'INJURY & RECOVERY',
      sub: 'Pain, surgery recovery, or an old injury that won’t heal. We build a recovery plan around your body and your timeline.',
    },
    {
      num: '02',
      href: '/assessment/energy',
      title: 'ENERGY, HORMONES & WEIGHT',
      sub: 'Tired, foggy, or struggling with weight even though your labs say “normal.” We use labs and symptoms together to find the real issue.',
    },
  ];

  return (
    <>
      <Head>
        <title>Range Assessment | Range Medical</title>
        <meta name="description" content="The Range Assessment ($197, credited toward treatment) finds what standard checkups miss. Pick your path: injury & recovery, or energy, hormones & weight." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={s.page}>
        <div style={s.header}>
          <a href="/">
            <img
              src="https://www.range-medical.com/brand/range_logo_transparent_black.png"
              alt="Range Medical"
              style={s.logo}
            />
          </a>
        </div>

        <div style={s.container}>
          <div style={selectorStyles.hero}>
            <div style={s.label}>
              <span style={s.dot} /> THE RANGE ASSESSMENT
            </div>
            <h1 style={s.headline}>
              WHAT BRINGS<br />YOU IN?
            </h1>
            <div style={s.rule} />
            <p style={s.headlineSub}>
              Pick the path that fits your situation. Both start with a $197 assessment &mdash; every dollar credited toward your treatment plan.
            </p>
          </div>

          <div style={selectorStyles.pathGrid}>
            {paths.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                style={selectorStyles.pathCard}
                onMouseEnter={e => { e.currentTarget.style.paddingLeft = '1rem'; }}
                onMouseLeave={e => { e.currentTarget.style.paddingLeft = '0'; }}
              >
                <span style={selectorStyles.pathNumber}>{p.num}</span>
                <div style={selectorStyles.pathTitle}>{p.title}</div>
                <p style={selectorStyles.pathSub}>{p.sub}</p>
                <span style={selectorStyles.pathArrow}>
                  SELECT THIS PATH &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
