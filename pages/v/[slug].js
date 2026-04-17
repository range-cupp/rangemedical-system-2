// /pages/v/[slug].js
// Public patient-facing injection demo video viewer.
// Shared via SMS or email. No login required.
// Range Medical V2

import Layout from '../../components/Layout';
import { INJECTION_VIDEOS, INJECTION_VIDEO_LIST } from '../../lib/injection-videos';

const stepsListStyle = {
  maxWidth: '720px',
  margin: '2.5rem auto 0',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const stepCardStyle = {
  display: 'flex',
  alignItems: 'stretch',
  background: '#ffffff',
  border: '1px solid #e5e5e5',
};

const stepBadgeStyle = {
  flexShrink: 0,
  width: '56px',
  background: '#0a0a0a',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  fontWeight: 800,
  fontFamily: 'Inter, -apple-system, sans-serif',
  letterSpacing: '0.02em',
};

const stepTextWrapStyle = {
  flex: 1,
  padding: '18px 22px',
  display: 'flex',
  alignItems: 'center',
};

const stepTextStyle = {
  margin: 0,
  fontSize: '1rem',
  lineHeight: 1.55,
  color: '#1a1a1a',
};

const videoWrapStyle = {
  width: '100%',
  background: '#000',
  border: '1px solid #1a1a1a',
};

const videoStyle = {
  width: '100%',
  height: 'auto',
  display: 'block',
};

const videoCaptionStyle = {
  marginTop: '1rem',
  fontSize: '0.875rem',
  color: '#737373',
  textAlign: 'center',
};

export default function InjectionVideoPage({ video }) {
  if (!video) {
    return (
      <Layout title="Video not found | Range Medical">
        <section className="section">
          <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <h1>Video not found</h1>
            <p style={{ color: '#737373', marginTop: '1rem' }}>
              This link may be outdated. Call us at (949) 997-3988 and we'll sort it out.
            </p>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${video.title} | Range Medical`}
      description={video.subtitle}
    >
      {/* Hero */}
      <section className="guide-hero">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> INJECTION INSTRUCTIONS</div>
          <h1>{video.title.toUpperCase()}</h1>
          <div className="hero-rule" />
          <p className="hero-sub">{video.subtitle}</p>
        </div>
      </section>

      {/* Video */}
      <section className="section">
        <div className="container" style={{ maxWidth: '780px' }}>
          <div style={videoWrapStyle}>
            <video
              src={video.videoUrl}
              controls
              playsInline
              preload="metadata"
              style={videoStyle}
            />
          </div>
          <p style={videoCaptionStyle}>
            Watch as many times as you need. If anything feels off on injection day, stop and call us.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> STEP BY STEP</div>
          <h2 className="section-title">WHAT TO DO</h2>
          <p className="section-subtitle">Same sequence every time. The red flip-top cap comes off first — it's a stopper that keeps the medication from leaking in shipping. Then thread the needle onto the Luer lock.</p>

          <ol style={stepsListStyle}>
            {video.steps.map((step, i) => (
              <li key={i} style={stepCardStyle}>
                <div style={stepBadgeStyle} aria-hidden="true">{i + 1}</div>
                <div style={stepTextWrapStyle}>
                  <p style={stepTextStyle}>{step}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Contact */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="v2-label" style={{ justifyContent: 'center' }}>
            <span className="v2-dot" /> QUESTIONS
          </div>
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>NEED HELP?</h2>
          <p style={{ color: '#737373', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Call or text us any time and we'll walk you through it.
          </p>
          <a href="tel:+19499973988" className="btn-primary">Call (949) 997-3988</a>
        </div>
      </section>
    </Layout>
  );
}

export async function getStaticPaths() {
  return {
    paths: INJECTION_VIDEO_LIST.map(v => ({ params: { slug: v.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const video = INJECTION_VIDEOS[params.slug] || null;
  return { props: { video } };
}
