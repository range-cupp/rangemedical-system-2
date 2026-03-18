// pages/start/[path].jsx
// Path-specific thank-you / VSL page after /start form submission
// Shows path-specific video placeholder + CTA to book assessment

import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const PATH_CONFIG = {
  injury: {
    title: 'Injury & Recovery',
    headline: "Here's how we support your rehab and speed up recovery.",
    description: "Watch the short video below to see how Range Medical helps patients recover faster from injuries, surgeries, and chronic pain — then book your assessment when you're ready.",
    ctaLink: '/range-assessment',
    ctaText: 'Book Your Range Assessment',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    badgeText: 'Injury & Recovery Path',
  },
  energy: {
    title: 'Energy & Optimization',
    headline: "Here's how we rebuild your energy step by step.",
    description: "Watch the short video below to see how Range Medical uses labs and personalized protocols to help patients feel like themselves again — then book your assessment when you're ready.",
    ctaLink: '/cellular-energy-assessment',
    ctaText: 'Book Your Energy Assessment',
    color: '#16A34A',
    bgColor: '#F0FDF4',
    badgeText: 'Energy & Optimization Path',
  },
  labs: {
    title: 'Labs Review',
    headline: "Here's how we turn your labs into a clear plan.",
    description: "Watch the short video below to see how Range Medical reviews your existing labs and builds a personalized protocol — then book your assessment when you're ready.",
    ctaLink: '/range-assessment',
    ctaText: 'Book Your Range Assessment',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    badgeText: 'Labs Review Path',
  },
};

export default function StartThankYou() {
  const router = useRouter();
  const { path, name } = router.query;
  const config = PATH_CONFIG[path];

  // Invalid path
  if (router.isReady && !config) {
    return (
      <Layout title="Not Found | Range Medical">
        <div style={{ textAlign: 'center', padding: '120px 20px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Page not found</h1>
          <p style={{ color: '#737373', marginTop: 8 }}>
            <Link href="/start" style={{ color: '#171717', fontWeight: 600 }}>Go back to Start</Link>
          </p>
        </div>
      </Layout>
    );
  }

  // Loading state while router hydrates
  if (!config) {
    return (
      <Layout title="Loading... | Range Medical">
        <div style={{ textAlign: 'center', padding: '120px 20px' }}>
          <p style={{ color: '#737373' }}>Loading...</p>
        </div>
      </Layout>
    );
  }

  const firstName = name || 'there';

  return (
    <Layout
      title={`${config.title} — Your Next Step | Range Medical`}
      description={config.description}
    >
      <Head>
        <style>{`
          .ty-page { color: #171717; }
          .ty-hero {
            max-width: 680px;
            margin: 0 auto;
            padding: 80px 20px 60px;
            text-align: center;
          }
          .ty-badge {
            display: inline-block;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 6px 14px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          .ty-hero h1 {
            font-size: 36px;
            font-weight: 700;
            line-height: 1.2;
            margin: 0 0 8px;
            letter-spacing: -0.02em;
          }
          .ty-hero .ty-greeting {
            font-size: 18px;
            color: #737373;
            margin: 0 0 32px;
          }
          .ty-hero p.ty-desc {
            font-size: 16px;
            color: #525252;
            line-height: 1.6;
            margin: 0 0 40px;
          }

          /* Video */
          .ty-video-wrap {
            max-width: 600px;
            margin: 0 auto 48px;
            border-radius: 12px;
            overflow: hidden;
            background: #000;
            aspect-ratio: 16/9;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .ty-video-placeholder {
            text-align: center;
            color: #a3a3a3;
          }
          .ty-video-placeholder .play-icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: rgba(255,255,255,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px;
          }
          .ty-video-placeholder .play-icon svg {
            width: 24px;
            height: 24px;
            fill: white;
            margin-left: 3px;
          }
          .ty-video-placeholder span {
            font-size: 14px;
          }

          /* CTA */
          .ty-cta-section {
            text-align: center;
            padding-bottom: 80px;
          }
          .ty-cta-btn {
            display: inline-block;
            background: #171717;
            color: #fff;
            padding: 16px 40px;
            border-radius: 10px;
            font-size: 17px;
            font-weight: 600;
            text-decoration: none;
            transition: background 0.2s;
          }
          .ty-cta-btn:hover {
            background: #404040;
          }
          .ty-or {
            margin: 20px 0 0;
            font-size: 15px;
            color: #737373;
          }
          .ty-or a {
            color: #171717;
            font-weight: 600;
            text-decoration: none;
          }

          /* What to expect */
          .ty-expect {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px 80px;
          }
          .ty-expect-card {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 32px;
          }
          .ty-expect-card h3 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 20px;
          }
          .ty-expect-item {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            margin-bottom: 16px;
          }
          .ty-expect-item:last-child { margin-bottom: 0; }
          .ty-expect-num {
            width: 28px;
            height: 28px;
            min-width: 28px;
            border-radius: 50%;
            background: #171717;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 700;
          }
          .ty-expect-text h4 {
            font-size: 15px;
            font-weight: 600;
            margin: 0 0 2px;
          }
          .ty-expect-text p {
            font-size: 14px;
            color: #737373;
            margin: 0;
            line-height: 1.5;
          }

          @media (max-width: 768px) {
            .ty-hero { padding: 60px 20px 40px; }
            .ty-hero h1 { font-size: 28px; }
          }
        `}</style>
      </Head>

      <div className="ty-page">
        <section className="ty-hero">
          <div
            className="ty-badge"
            style={{ background: config.bgColor, color: config.color }}
          >
            {config.badgeText}
          </div>

          <p className="ty-greeting">Hey {firstName}, we got your info.</p>
          <h1>{config.headline}</h1>
          <p className="ty-desc">{config.description}</p>

          <div className="ty-video-wrap">
            <div className="ty-video-placeholder">
              <div className="play-icon">
                <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
              </div>
              <span>Video coming soon</span>
            </div>
          </div>

          <div className="ty-cta-section">
            <Link href={config.ctaLink} className="ty-cta-btn">
              {config.ctaText}
            </Link>
            <p className="ty-or">
              Or call/text <a href="tel:9499973988">(949) 997-3988</a>
            </p>
          </div>
        </section>

        <section className="ty-expect">
          <div className="ty-expect-card">
            <h3>What happens next</h3>
            <div className="ty-expect-item">
              <div className="ty-expect-num">1</div>
              <div className="ty-expect-text">
                <h4>Watch the video above</h4>
                <p>It explains exactly how we help people in your situation.</p>
              </div>
            </div>
            <div className="ty-expect-item">
              <div className="ty-expect-num">2</div>
              <div className="ty-expect-text">
                <h4>Book your assessment</h4>
                <p>Click the button above or call us. We'll walk through everything.</p>
              </div>
            </div>
            <div className="ty-expect-item">
              <div className="ty-expect-num">3</div>
              <div className="ty-expect-text">
                <h4>Get your plan</h4>
                <p>After labs and a provider review, you'll have a clear, written plan.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
