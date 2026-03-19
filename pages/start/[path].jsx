// pages/start/[path].jsx
// Path-specific thank-you / VSL pages after /start form submission
// Injury → focused recovery visit (no labs up front)
// Energy → Essential vs Elite lab panel selection with pricing

import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const PATH_CONFIG = {
  injury: {
    title: 'Injury & Recovery',
    headline: "Here's how we support your rehab and speed up recovery.",
    description: "Watch the short video below to see how Range Medical helps patients recover faster from injuries, surgeries, and chronic pain — then request your focused recovery visit.",
    color: '#DC2626',
    bgColor: '#FEF2F2',
    badgeText: 'Injury & Recovery Path',
  },
  energy: {
    title: 'Energy & Optimization',
    headline: "Here's how we rebuild your energy step by step.",
    description: "Watch the short video below to see how Range Medical uses labs and personalized protocols to help you feel like yourself again — then pick your lab panel to get started.",
    color: '#16A34A',
    bgColor: '#F0FDF4',
    badgeText: 'Energy, Hormones & Weight Loss',
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
  const isInjury = path === 'injury';

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

          /* CTA section */
          .ty-cta-section {
            text-align: center;
            padding-bottom: 60px;
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

          /* Lab panels */
          .ty-panels {
            max-width: 700px;
            margin: 0 auto;
            padding: 0 20px 60px;
          }
          .ty-panels h2 {
            text-align: center;
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px;
          }
          .ty-panels > p {
            text-align: center;
            font-size: 15px;
            color: #737373;
            margin: 0 0 32px;
          }
          .ty-panels-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .ty-panel-card {
            border: 2px solid #e5e5e5;
            border-radius: 16px;
            padding: 32px 24px;
            text-align: center;
            position: relative;
            background: #fff;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          .ty-panel-card:hover {
            border-color: #a3a3a3;
            box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          }
          .ty-panel-card.recommended {
            border-color: #171717;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .ty-panel-badge {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: #171717;
            color: #fff;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 4px 14px;
            border-radius: 20px;
            white-space: nowrap;
          }
          .ty-panel-name {
            font-size: 20px;
            font-weight: 700;
            margin: 8px 0 4px;
          }
          .ty-panel-price {
            font-size: 32px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          .ty-panel-note {
            font-size: 13px;
            color: #737373;
            margin: 0 0 16px;
          }
          .ty-panel-desc {
            font-size: 14px;
            color: #525252;
            line-height: 1.6;
            margin: 0 0 20px;
            text-align: left;
          }
          .ty-panel-includes {
            text-align: left;
            margin: 0 0 24px;
          }
          .ty-panel-includes h4 {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #737373;
            margin: 0 0 8px;
          }
          .ty-panel-includes li {
            font-size: 13px;
            color: #525252;
            padding: 3px 0;
            list-style: none;
          }
          .ty-panel-includes li::before {
            content: "\\2713  ";
            color: #16a34a;
            font-weight: 700;
          }
          .ty-panel-btn {
            display: block;
            width: 100%;
            padding: 14px;
            background: #171717;
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
            text-decoration: none;
            text-align: center;
            transition: background 0.2s;
          }
          .ty-panel-btn:hover {
            background: #404040;
            color: #fff;
          }
          .ty-panel-btn-outline {
            background: #fff;
            color: #171717;
            border: 2px solid #171717;
          }
          .ty-panel-btn-outline:hover {
            background: #f5f5f5;
            color: #171717;
          }

          /* Both include */
          .ty-both-include {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px 20px;
            text-align: center;
          }
          .ty-both-include p {
            font-size: 14px;
            color: #737373;
            margin: 0;
          }
          .ty-both-include strong {
            color: #171717;
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
            .ty-panels-grid { grid-template-columns: 1fr; }
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
        </section>

        {/* --- INJURY PATH: Simple CTA to book recovery visit --- */}
        {isInjury && (
          <>
            <div className="ty-cta-section">
              <Link href="/range-assessment" className="ty-cta-btn">
                Request a Recovery Visit
              </Link>
              <p className="ty-or">
                Or call/text <a href="tel:9499973988">(949) 997-3988</a>
              </p>
            </div>

            <section className="ty-expect">
              <div className="ty-expect-card">
                <h3>What happens next</h3>
                <div className="ty-expect-item">
                  <div className="ty-expect-num">1</div>
                  <div className="ty-expect-text">
                    <h4>Watch the video above</h4>
                    <p>It explains how we help people recover from injuries faster.</p>
                  </div>
                </div>
                <div className="ty-expect-item">
                  <div className="ty-expect-num">2</div>
                  <div className="ty-expect-text">
                    <h4>Book your recovery visit</h4>
                    <p>We go through your story, do an exam, and build a recovery plan. No labs needed up front.</p>
                  </div>
                </div>
                <div className="ty-expect-item">
                  <div className="ty-expect-num">3</div>
                  <div className="ty-expect-text">
                    <h4>Get your plan</h4>
                    <p>A clear, written recovery protocol your provider walks you through.</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* --- ENERGY PATH: Essential vs Elite lab panel selection --- */}
        {!isInjury && (
          <>
            <section className="ty-panels">
              <h2>Choose your lab panel</h2>
              <p>Both include a 1:1 provider review and a written plan.</p>

              <div className="ty-panels-grid">
                {/* Essential Panel */}
                <div className="ty-panel-card">
                  <div className="ty-panel-name">Essential Panel</div>
                  <div className="ty-panel-price">$350</div>
                  <div className="ty-panel-note">Great starting point for most people</div>
                  <p className="ty-panel-desc">
                    Covers the core hormones, thyroid, metabolic markers, and inflammation
                    levels that explain most fatigue, weight, and mood issues.
                  </p>
                  <div className="ty-panel-includes">
                    <h4>Includes</h4>
                    <ul>
                      <li>Testosterone (total + free)</li>
                      <li>Thyroid panel (TSH, T3, T4)</li>
                      <li>Metabolic markers</li>
                      <li>Inflammation markers</li>
                      <li>1:1 provider review</li>
                      <li>Written treatment plan</li>
                    </ul>
                  </div>
                  <Link
                    href="https://link.range-medical.com/payment-link/698365fcc80eaf78e79b8ef7"
                    className="ty-panel-btn ty-panel-btn-outline"
                  >
                    Choose Essential
                  </Link>
                </div>

                {/* Elite Panel */}
                <div className="ty-panel-card recommended">
                  <div className="ty-panel-badge">Most Comprehensive</div>
                  <div className="ty-panel-name">Elite Panel</div>
                  <div className="ty-panel-price">$750</div>
                  <div className="ty-panel-note">Full deep dive for complex cases</div>
                  <p className="ty-panel-desc">
                    Everything in Essential plus advanced hormones, nutrient levels,
                    organ function, and longevity markers. For high performers or anyone
                    who wants every stone turned.
                  </p>
                  <div className="ty-panel-includes">
                    <h4>Includes everything in Essential, plus</h4>
                    <ul>
                      <li>Estradiol, DHEA-S, SHBG</li>
                      <li>Full nutrient panel (B12, D, iron)</li>
                      <li>Liver and kidney function</li>
                      <li>Advanced lipids</li>
                      <li>1:1 provider review</li>
                      <li>Written treatment plan</li>
                    </ul>
                  </div>
                  <Link
                    href="https://link.range-medical.com/payment-link/698365ba6503ca98c6834212"
                    className="ty-panel-btn"
                  >
                    Choose Elite
                  </Link>
                </div>
              </div>
            </section>

            <div className="ty-both-include">
              <p><strong>Both panels include</strong> your lab draw, a 1:1 review with your provider, and a personalized written plan.</p>
            </div>

            <div className="ty-cta-section" style={{ paddingTop: 20 }}>
              <p className="ty-or">
                Not sure which panel? Call/text <a href="tel:9499973988">(949) 997-3988</a> and we'll help you decide.
              </p>
            </div>

            <section className="ty-expect">
              <div className="ty-expect-card">
                <h3>What happens next</h3>
                <div className="ty-expect-item">
                  <div className="ty-expect-num">1</div>
                  <div className="ty-expect-text">
                    <h4>Watch the video above</h4>
                    <p>It explains our two lab panels and how we use them to build your plan.</p>
                  </div>
                </div>
                <div className="ty-expect-item">
                  <div className="ty-expect-num">2</div>
                  <div className="ty-expect-text">
                    <h4>Pick your panel and schedule your lab draw</h4>
                    <p>Choose Essential or Elite above. We'll get your blood drawn at a local lab.</p>
                  </div>
                </div>
                <div className="ty-expect-item">
                  <div className="ty-expect-num">3</div>
                  <div className="ty-expect-text">
                    <h4>Review results + get your plan</h4>
                    <p>Your provider reviews your labs 1:1 and gives you a clear, written plan.</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
