// pages/start/[path].jsx
// Energy path thank-you / VSL page after /start form submission
// Energy → Essential vs Elite lab panel selection with pricing
// Note: Injury path has its own dedicated page at /start/injury.jsx

import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const PATH_CONFIG = {
  injury: {
    title: 'Injury & Recovery',
    headline: "We don't replace good rehab. We support and enhance it.",
    description: "Watch the short video below to see how Range Medical adds the right tools to help your body calm down and heal faster — then book your Recovery Visit.",
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

          /* Why labs first */
          .ty-why-labs {
            max-width: 620px;
            margin: 0 auto;
            padding: 0 20px 48px;
          }
          .ty-why-labs-inner {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 32px;
          }
          .ty-why-labs h2 {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 12px;
          }
          .ty-why-labs p {
            font-size: 15px;
            color: #525252;
            line-height: 1.7;
            margin: 0 0 12px;
          }
          .ty-why-labs p:last-child { margin-bottom: 0; }

          /* What's included callout */
          .ty-included-callout {
            max-width: 620px;
            margin: 0 auto;
            padding: 0 20px 48px;
          }
          .ty-included-inner {
            background: #171717;
            border-radius: 12px;
            padding: 32px;
            color: #fff;
          }
          .ty-included-inner h3 {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 24px;
            color: #fff;
          }
          .ty-included-items {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .ty-included-item {
            display: flex;
            gap: 16px;
            align-items: flex-start;
          }
          .ty-included-icon {
            font-size: 24px;
            min-width: 32px;
            text-align: center;
          }
          .ty-included-item strong {
            display: block;
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 2px;
          }
          .ty-included-item p {
            font-size: 14px;
            color: #a3a3a3;
            line-height: 1.5;
            margin: 0;
          }

          /* Panel "who should pick" */
          .ty-panel-who {
            text-align: left;
            margin: 0 0 16px;
            padding: 12px 14px;
            background: #f5f5f5;
            border-radius: 8px;
          }
          .ty-panel-who h4 {
            font-size: 13px;
            font-weight: 600;
            color: #525252;
            margin: 0 0 6px;
          }
          .ty-panel-who ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .ty-panel-who li {
            font-size: 13px;
            color: #525252;
            padding: 2px 0;
          }
          .ty-panel-who li::before {
            content: "\\2192  ";
            color: #a3a3a3;
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
            .ty-fit-grid { grid-template-columns: 1fr !important; }
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

        {/* --- INJURY PATH --- */}
        {isInjury && (
          <>
            {/* What Range does */}
            <section className="ty-why-labs">
              <div className="ty-why-labs-inner">
                <h2>How Range fits into your recovery</h2>
                <p>
                  Most people we see are already working with a chiropractor, physical therapist,
                  or bodyworker — and they feel better, but not as fast as they want. They can't get
                  back to their level of training, sport, or activity. Every time they push again,
                  the pain reminds them they're not fully healed.
                </p>
                <p style={{ fontWeight: 600, color: '#171717' }}>
                  Our job is to look at your injury story, see what you've already tried, and add
                  the right tools to help your body calm down and heal better. You keep your team —
                  we add what's missing.
                </p>
                <p>
                  In Newport Beach, we work alongside the providers you already trust. In San Clemente,
                  you can get body work, physical therapy, chiropractic, and medical support together
                  in the same location.
                </p>
              </div>
            </section>

            {/* What's in the Recovery Visit — prominent callout */}
            <section className="ty-included-callout">
              <div className="ty-included-inner">
                <h3>What happens in your Recovery Visit:</h3>
                <div className="ty-included-items">
                  <div className="ty-included-item">
                    <div className="ty-included-icon">🗣️</div>
                    <div>
                      <strong>We listen to your story</strong>
                      <p>How you got hurt. What makes it better or worse. What treatment you've had so far.</p>
                    </div>
                  </div>
                  <div className="ty-included-item">
                    <div className="ty-included-icon">🔍</div>
                    <div>
                      <strong>We look at how you move</strong>
                      <p>A focused exam to see what your body can and can't do right now — so we're not just guessing.</p>
                    </div>
                  </div>
                  <div className="ty-included-item">
                    <div className="ty-included-icon">📋</div>
                    <div>
                      <strong>We review your current plan</strong>
                      <p>Whether you're already working with a provider or starting fresh, we look at what you're doing and how we can support it.</p>
                    </div>
                  </div>
                  <div className="ty-included-item">
                    <div className="ty-included-icon">✍️</div>
                    <div>
                      <strong>You leave with a written recovery plan</strong>
                      <p>In plain language: what we think is going on, what services at Range might help, and what the next 4–6 weeks should look like.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* No labs note */}
            <div className="ty-both-include">
              <p><strong>A quick note on labs:</strong> For most injury-only cases, we do not start with blood work.
              We can usually get a clear picture from your story, movement exam, and how your body responds to treatment.
              If your provider feels something deeper is slowing healing, they'll explain why labs might make sense.</p>
            </div>

            {/* CTA */}
            <div className="ty-cta-section" style={{ paddingTop: 24 }}>
              <Link href="/range-assessment?path=injury" className="ty-cta-btn">
                Book a Recovery Visit
              </Link>
              <p className="ty-or" style={{ marginTop: 8 }}>
                Newport Beach &amp; San Clemente available
              </p>
              <p className="ty-or">
                Or call/text <a href="tel:9499973988">(949) 997-3988</a>
              </p>
            </div>

            {/* Who this is for */}
            <section className="ty-why-labs" style={{ paddingTop: 0 }}>
              <div className="ty-why-labs-inner ty-fit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>This is right for you if:</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={{ fontSize: 14, color: '#525252', padding: '3px 0' }}>✓ You're tired of guessing and hoping an injury will just "work itself out"</li>
                    <li style={{ fontSize: 14, color: '#525252', padding: '3px 0' }}>✓ You're doing rehab but want everything working in the same direction</li>
                    <li style={{ fontSize: 14, color: '#525252', padding: '3px 0' }}>✓ You want a clear, realistic plan for the next few weeks</li>
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Not for you if:</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={{ fontSize: 14, color: '#525252', padding: '3px 0' }}>✗ You're looking for a quick fix without putting in any work</li>
                    <li style={{ fontSize: 14, color: '#525252', padding: '3px 0' }}>✗ You're not willing to follow through on a plan</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Step by step */}
            <section className="ty-expect">
              <div className="ty-expect-card">
                <h3>How it works from here</h3>
                <div className="ty-expect-item">
                  <div className="ty-expect-num">1</div>
                  <div className="ty-expect-text">
                    <h4>Choose a time that works for you</h4>
                    <p>Click the button above. You'll see available times for Newport Beach or San Clemente.</p>
                  </div>
                </div>
                <div className="ty-expect-item">
                  <div className="ty-expect-num">2</div>
                  <div className="ty-expect-text">
                    <h4>Enter your info and confirm</h4>
                    <p>Quick form so we know who you are. We'll text and email you with appointment details and what to bring (like imaging reports or notes from current providers).</p>
                  </div>
                </div>
                <div className="ty-expect-item">
                  <div className="ty-expect-num">3</div>
                  <div className="ty-expect-text">
                    <h4>Come in for your Recovery Visit</h4>
                    <p>You meet with your provider, we go through your story, exam, and options — and you leave with a clear recovery plan in writing.</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* --- ENERGY PATH: Essential vs Elite lab panel selection --- */}
        {!isInjury && (
          <>
            {/* Why labs first */}
            <section className="ty-why-labs">
              <div className="ty-why-labs-inner">
                <h2>Why we start with labs</h2>
                <p>
                  Most places either treat only the symptoms or glance at a few basic labs and say
                  "you're fine." We do it differently. We match how you feel with what your labs
                  actually show — so we can see what's really going on with your energy, hormones,
                  and metabolism.
                </p>
                <p style={{ fontWeight: 600, color: '#171717' }}>
                  Think of it like this: if your body is a car, right now you're driving with
                  the check engine light on, but nobody's plugged into the engine. These panels
                  are us plugging in.
                </p>
              </div>
            </section>

            {/* What's included callout — prominent */}
            <section className="ty-included-callout">
              <div className="ty-included-inner">
                <h3>Whichever panel you choose, you get:</h3>
                <div className="ty-included-items">
                  <div className="ty-included-item">
                    <div className="ty-included-icon">🩸</div>
                    <div>
                      <strong>Your blood work</strong>
                      <p>Through our lab partners. No surprise bills, no random add-ons.</p>
                    </div>
                  </div>
                  <div className="ty-included-item">
                    <div className="ty-included-icon">👨‍⚕️</div>
                    <div>
                      <strong>A 1:1 visit with your provider</strong>
                      <p>Not a rushed appointment. We review your labs together, connect them to your symptoms, and answer every question.</p>
                    </div>
                  </div>
                  <div className="ty-included-item">
                    <div className="ty-included-icon">📋</div>
                    <div>
                      <strong>A written plan in plain language</strong>
                      <p>You leave knowing exactly what's going on and what to do about it. Hormones, weight loss, energy, sleep — clear next steps and timelines.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Panel selection */}
            <section className="ty-panels">
              <h2>Pick your panel</h2>
              <p>One payment. Labs, provider review, and written plan included.</p>

              <div className="ty-panels-grid">
                {/* Essential Panel */}
                <div className="ty-panel-card">
                  <div className="ty-panel-name">Essential Panel</div>
                  <div className="ty-panel-price">$350</div>
                  <div className="ty-panel-note">Smart starting point for most people</div>
                  <p className="ty-panel-desc">
                    Designed for you if you've been feeling off for a while and want real answers.
                    We look at the key markers that drive energy, hormones, inflammation, and
                    metabolism — enough to see the big picture and build a solid plan.
                  </p>
                  <div className="ty-panel-who">
                    <h4>Choose Essential if:</h4>
                    <ul>
                      <li>You're tired, foggy, or gaining weight</li>
                      <li>You haven't done deeper labs before</li>
                      <li>You want a smart, solid starting point</li>
                    </ul>
                  </div>
                  <div className="ty-panel-includes">
                    <h4>What we test</h4>
                    <ul>
                      <li>Testosterone (total + free)</li>
                      <li>Thyroid panel (TSH, T3, T4)</li>
                      <li>Metabolic markers</li>
                      <li>Inflammation markers</li>
                    </ul>
                  </div>
                  <Link
                    href="/range-assessment?path=energy&panel=essential"
                    className="ty-panel-btn ty-panel-btn-outline"
                  >
                    Choose Essential — $350
                  </Link>
                </div>

                {/* Elite Panel */}
                <div className="ty-panel-card recommended">
                  <div className="ty-panel-badge">Full Deep Dive</div>
                  <div className="ty-panel-name">Elite Panel</div>
                  <div className="ty-panel-price">$750</div>
                  <div className="ty-panel-note">Every stone turned over</div>
                  <p className="ty-panel-desc">
                    For you if you've been struggling for years, tried a bunch of different
                    things, or you're the kind of person who wants the full picture from day one.
                    Goes deeper and wider — more data, more context, more insight.
                  </p>
                  <div className="ty-panel-who">
                    <h4>Choose Elite if:</h4>
                    <ul>
                      <li>You've been chasing this for years</li>
                      <li>You've already done basic labs before</li>
                      <li>You want the full deep dive from day one</li>
                    </ul>
                  </div>
                  <div className="ty-panel-includes">
                    <h4>Everything in Essential, plus</h4>
                    <ul>
                      <li>Estradiol, DHEA-S, SHBG</li>
                      <li>Full nutrient panel (B12, D, iron)</li>
                      <li>Liver and kidney function</li>
                      <li>Advanced lipids</li>
                    </ul>
                  </div>
                  <Link
                    href="/range-assessment?path=energy&panel=elite"
                    className="ty-panel-btn"
                  >
                    Choose Elite — $750
                  </Link>
                </div>
              </div>
            </section>

            <div className="ty-both-include">
              <p><strong>Both panels include</strong> your blood work, a 1:1 provider review, and a personalized written plan.</p>
              <p style={{ marginTop: 8 }}>Not sure which? Start with Essential. If your provider thinks you need more, they'll explain why.</p>
            </div>

            <div className="ty-cta-section" style={{ paddingTop: 20 }}>
              <p className="ty-or">
                Questions? Call/text <a href="tel:9499973988">(949) 997-3988</a>
              </p>
            </div>

            <section className="ty-expect">
              <div className="ty-expect-card">
                <h3>How it works, step by step</h3>
                <div className="ty-expect-item">
                  <div className="ty-expect-num">1</div>
                  <div className="ty-expect-text">
                    <h4>Pick Essential or Elite</h4>
                    <p>Click the one that fits you best above. You'll enter your info and complete your purchase.</p>
                  </div>
                </div>
                <div className="ty-expect-item">
                  <div className="ty-expect-num">2</div>
                  <div className="ty-expect-text">
                    <h4>Get your blood drawn</h4>
                    <p>We'll text you clear instructions. Show up, get the labs done, and that's it for that step.</p>
                  </div>
                </div>
                <div className="ty-expect-item">
                  <div className="ty-expect-num">3</div>
                  <div className="ty-expect-text">
                    <h4>Results visit + your plan</h4>
                    <p>When results are back, you meet with your provider 1:1. We review your labs together, connect them to your symptoms, and give you your written plan. No rushing, no "your labs are normal, good luck."</p>
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
