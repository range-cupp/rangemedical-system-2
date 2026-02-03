import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function HRTMembership() {
  return (
    <Layout
      title="HRT Membership | $250/Month All-Inclusive | Range Medical Newport Beach"
      description="Hormone replacement therapy membership includes all medications, monthly Range IV ($225 value), and member perks. $250/month. Range Medical Newport Beach. Call (949) 997-3988."
    >
      <Head>
        <meta name="keywords" content="HRT membership, hormone therapy membership, testosterone therapy, hormone replacement, TRT membership, Newport Beach HRT, Orange County hormone therapy" />
        <link rel="canonical" href="https://www.range-medical.com/hrt-membership" />
        <meta property="og:title" content="HRT Membership | $250/Month All-Inclusive | Range Medical" />
        <meta property="og:description" content="Hormone replacement therapy membership includes all medications, monthly Range IV, and member perks. $250/month." />
        <meta property="og:url" content="https://www.range-medical.com/hrt-membership" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">⚡ Hormone Optimization</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <p className="hero-kicker">Hormones · Membership · Results</p>
        <h1>HRT Membership: Everything You Need for $250/Month</h1>
        <p className="hero-sub">
          All your hormone medications, a monthly Range IV, and member perks—one simple price, no surprises.
        </p>
        <div className="hero-scroll">
          Scroll to explore
          <span>↓</span>
        </div>
      </section>

      {/* What's Included */}
      <section className="section" id="whats-included">
        <div className="container">
          <p className="section-kicker">What's Included</p>
          <h2 className="section-title">Your $250/Month Membership</h2>
          <p className="section-subtitle">
            No hidden fees. No pharmacy surprises. Everything you need to optimize your hormones in one monthly membership.
          </p>
          <div className="included-grid">
            <div className="included-card main">
              <div className="included-icon">💊</div>
              <h3>All HRT Medications</h3>
              <p>Your personalized hormone protocol—testosterone, estrogen, progesterone, thyroid, or whatever your labs indicate you need. Dispensed from our pharmacy, included in your membership.</p>
            </div>
            <div className="included-card main">
              <div className="included-icon">💉</div>
              <h3>Monthly Range IV</h3>
              <p>A custom IV with 5 vitamins and minerals tailored to support your hormone optimization. A $225 value, included every month.</p>
              <span className="value-tag">$225 Value</span>
            </div>
            <div className="included-card main">
              <div className="included-icon">🔬</div>
              <h3>Follow-Up Labs Included</h3>
              <p>Your first follow-up blood draw at 6-8 weeks to check how you're responding, then every 3 months to keep your levels dialed in. No extra charge.</p>
            </div>
            <div className="included-card">
              <div className="included-icon">🎁</div>
              <h3>Member Giveaways</h3>
              <p>Exclusive access to member-only giveaways, samples, and perks throughout the year.</p>
            </div>
            <div className="included-card">
              <div className="included-icon">📱</div>
              <h3>Direct Access</h3>
              <p>Text or call us when you have questions. No waiting weeks for a callback.</p>
            </div>
            <div className="included-card">
              <div className="included-icon">🔄</div>
              <h3>Protocol Adjustments</h3>
              <p>As your labs and symptoms change, we adjust your protocol—no extra charge.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Math */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">The Value</p>
          <h2 className="section-title">Why Members Love This</h2>
          <p className="section-subtitle">
            Compare what you'd pay elsewhere versus what you get with us.
          </p>
          <div className="comparison-grid">
            <div className="comparison-card elsewhere">
              <h3>Typical HRT Costs</h3>
              <ul>
                <li><span>Hormone medications</span><span>$150-300/mo</span></li>
                <li><span>Monthly IV therapy</span><span>$200-300/mo</span></li>
                <li><span>Follow-up labs</span><span>$150-300/ea</span></li>
                <li><span>Follow-up visits</span><span>$100-200/ea</span></li>
              </ul>
              <div className="comparison-total">
                <span>Typical Monthly Cost</span>
                <span>$500-800+</span>
              </div>
            </div>
            <div className="comparison-card membership">
              <h3>Range HRT Membership</h3>
              <ul>
                <li><span>All hormone medications</span><span>✓</span></li>
                <li><span>Monthly Range IV ($225 value)</span><span>✓</span></li>
                <li><span>Follow-up labs (6-8 wks + quarterly)</span><span>✓</span></li>
                <li><span>Protocol adjustments</span><span>✓</span></li>
                <li><span>Member giveaways</span><span>✓</span></li>
                <li><span>Direct provider access</span><span>✓</span></li>
              </ul>
              <div className="comparison-total">
                <span>Your Monthly Cost</span>
                <span>$250</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Testosterone Actually Does */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">The Science</p>
          <h2 className="section-title">What Optimized Testosterone Does For Men</h2>
          <p className="section-subtitle">
            This isn't about getting jacked. It's about restoring what your body used to do naturally—backed by decades of clinical research.
          </p>
          <div className="benefits-deep">
            <div className="benefit-block">
              <div className="benefit-icon">💪</div>
              <div className="benefit-content">
                <h3>Builds Lean Muscle Mass</h3>
                <p>Testosterone directly stimulates protein synthesis and activates satellite cells that repair and grow muscle tissue. Clinical studies show men on TRT gain an average of <strong>3-6 lbs of lean muscle</strong> in the first 3-6 months—with some studies showing gains up to 8 lbs in men starting with very low levels. Intramuscular testosterone shows a <strong>5.7% increase in fat-free mass</strong> on average.</p>
              </div>
            </div>
            <div className="benefit-block">
              <div className="benefit-icon">🔥</div>
              <div className="benefit-content">
                <h3>Reduces Body Fat</h3>
                <p>Optimized testosterone shifts your body composition—less fat, more muscle. Research shows an average <strong>reduction of 3-6 lbs of fat mass</strong> over 6-12 months, with the biggest losses in stubborn areas like the midsection and love handles. One 56-week study showed men lost <strong>6.4 lbs more fat</strong> than placebo while gaining muscle.</p>
              </div>
            </div>
            <div className="benefit-block">
              <div className="benefit-icon">⚡</div>
              <div className="benefit-content">
                <h3>Restores Energy & Motivation</h3>
                <p>That afternoon crash and constant fatigue? Often tied to low T. Studies show improvements in energy and reduced fatigue within <strong>3-4 weeks</strong> of starting treatment. By week 6, most men report feeling noticeably more energized throughout the day.</p>
              </div>
            </div>
            <div className="benefit-block">
              <div className="benefit-icon">🧠</div>
              <div className="benefit-content">
                <h3>Clears Brain Fog</h3>
                <p>Testosterone affects neurotransmitters like serotonin and dopamine. Clinical research shows cognitive benefits—better focus, clearer thinking, improved memory—begin appearing around <strong>week 3</strong> and continue improving for several months.</p>
              </div>
            </div>
            <div className="benefit-block">
              <div className="benefit-icon">😊</div>
              <div className="benefit-content">
                <h3>Improves Mood & Reduces Depression</h3>
                <p>Low testosterone is linked to irritability, anxiety, and depression. Studies using depression rating scales show measurable improvement in depressive symptoms within <strong>3-6 weeks</strong>, with maximum benefits reached around 18-30 weeks. Many men describe feeling "like themselves again."</p>
              </div>
            </div>
            <div className="benefit-block">
              <div className="benefit-icon">❤️</div>
              <div className="benefit-content">
                <h3>Restores Libido & Sexual Function</h3>
                <p>Sexual interest typically improves within <strong>3 weeks</strong>, plateauing around week 6. Improvements in erections and sexual performance may take longer—up to 6 months for full effect. Many men report morning erections returning within the first 2 weeks.</p>
              </div>
            </div>
            <div className="benefit-block">
              <div className="benefit-icon">🌙</div>
              <div className="benefit-content">
                <h3>Better Sleep Quality</h3>
                <p>Testosterone helps regulate sleep architecture. Many men notice improved sleep quality within the <strong>first 1-2 weeks</strong>—falling asleep easier, staying asleep longer, and waking up feeling more rested.</p>
              </div>
            </div>
            <div className="benefit-block">
              <div className="benefit-icon">🦴</div>
              <div className="benefit-content">
                <h3>Strengthens Bones</h3>
                <p>Testosterone is critical for bone mineral density. Research shows <strong>5% increase in spinal bone density</strong> and up to <strong>14% increase in trabecular bone density</strong> over 18 months—reducing fracture risk as you age.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Results Timeline</p>
          <h2 className="section-title">When You'll Feel The Difference</h2>
          <p className="section-subtitle">
            Everyone responds differently, but here's what clinical research shows most men experience.
          </p>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-period">Week 1-2</div>
              <div className="timeline-content">
                <h3>Early Signs</h3>
                <p>Better sleep quality. Subtle energy improvements, especially in the afternoon. Some men notice morning erections returning. You're laying the foundation.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-period">Week 3-4</div>
              <div className="timeline-content">
                <h3>Mood & Energy Shift</h3>
                <p>Noticeable improvement in energy levels and mood. Brain fog starts to lift. Libido begins to increase. Quality of life improvements become apparent. This is when most men think "okay, something's happening."</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-period">Week 6-8</div>
              <div className="timeline-content">
                <h3>Feeling Like Yourself</h3>
                <p>Sexual function improvements plateau. Depression and anxiety continue to improve. You have more drive and motivation. This is when we do your first follow-up labs to see how your body is responding.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-period">Month 3-4</div>
              <div className="timeline-content">
                <h3>Body Composition Changes</h3>
                <p>Visible changes in muscle tone and fat distribution begin. Clothes fit differently. If you're lifting, you notice strength gains. Metabolic improvements in cholesterol and triglycerides measurable on labs.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-period">Month 6-12</div>
              <div className="timeline-content">
                <h3>Full Optimization</h3>
                <p>Maximum benefits for muscle mass, fat loss, and bone density. Body composition changes are clearly visible. Energy, mood, and cognitive benefits have stabilized. This is your new normal.</p>
              </div>
            </div>
          </div>
          <p className="timeline-note">
            <strong>Important:</strong> Results vary based on your starting testosterone levels, age, lifestyle, and how consistently you follow your protocol. Men who combine TRT with resistance training and good nutrition see the best results.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">How It Works</p>
          <h2 className="section-title">Getting Started Is Simple</h2>
          <p className="section-subtitle">
            From your first visit to feeling like yourself again—here's what to expect.
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Range Assessment</h3>
              <p>$199 consultation where we review your symptoms, health history, and goals. We'll order labs if needed.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Lab Review</h3>
              <p>We go over your results in plain English and explain exactly what's happening with your hormones.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Start Your Protocol</h3>
              <p>If HRT is right for you, we design your personalized protocol and you begin your $250/month membership.</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Feel Better</h3>
              <p>Most patients notice improvements in energy, mood, and sleep within 2-6 weeks as levels optimize.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Treat */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Who It's For</p>
          <h2 className="section-title">Signs Your Hormones May Be Off</h2>
          <p className="section-subtitle">
            If any of these sound familiar, hormone optimization might help.
          </p>
          <div className="symptoms-grid">
            <div className="symptom-card">
              <span className="symptom-icon">😴</span>
              <span>Constant fatigue</span>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">🧠</span>
              <span>Brain fog</span>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">😤</span>
              <span>Mood changes</span>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">⚖️</span>
              <span>Stubborn weight</span>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">💪</span>
              <span>Muscle loss</span>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">🌙</span>
              <span>Poor sleep</span>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">❤️</span>
              <span>Low libido</span>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">🔥</span>
              <span>Hot flashes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Range IV Details */}
      <section className="section">
        <div className="container">
          <div className="intro-grid">
            <div className="intro-text">
              <p className="section-kicker-left">Monthly Benefit</p>
              <h2>Your Range IV: $225 Value Included</h2>
              <p>
                Every month, you get a custom IV infusion designed to support hormone optimization. Your nurse selects 5 vitamins and minerals based on what your body needs.
              </p>
              <p>
                Common additions include B12 for energy, magnesium for sleep and muscle function, vitamin D for mood, and amino acids for recovery.
              </p>
              <p>
                Most infusions take 30-45 minutes. Many members use it as their monthly reset—come in, relax, leave feeling recharged.
              </p>
              <ul className="check-list">
                <li>5 vitamins/minerals tailored to you</li>
                <li>Supports energy, mood, and recovery</li>
                <li>$225 value included in membership</li>
                <li>30-45 minute relaxing infusion</li>
              </ul>
            </div>
            <div className="intro-visual">
              <span className="visual-icon">💉</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Questions</p>
          <h2 className="section-title">Common Questions</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>What medications are included?</h3>
              <p>All hormone medications prescribed as part of your HRT protocol—testosterone, estrogen, progesterone, thyroid, and any necessary support medications. Everything comes from our pharmacy and is included in your $250/month.</p>
            </div>
            <div className="faq-item">
              <h3>Do I have to use my Range IV every month?</h3>
              <p>It's included every month, but we won't force you. Most members love it and schedule it regularly. If you miss a month, it doesn't roll over—use it or lose it.</p>
            </div>
            <div className="faq-item">
              <h3>How do I get started?</h3>
              <p>Book a $199 Range Assessment. We'll review your symptoms, order labs if needed, and determine if HRT is right for you. If it is, you'll start your membership when you begin your protocol.</p>
            </div>
            <div className="faq-item">
              <h3>Is there a contract or commitment?</h3>
              <p>No long-term contracts. Your membership continues month-to-month. If you need to pause or stop, just let us know.</p>
            </div>
            <div className="faq-item">
              <h3>What about follow-up labs?</h3>
              <p>Included. You'll get a follow-up blood draw at 6-8 weeks after starting to see how you're responding, then every 3 months to keep your levels optimized. It's all part of your membership.</p>
            </div>
            <div className="faq-item">
              <h3>Can I add other services?</h3>
              <p>Absolutely. Members can add peptide therapy, weight loss programs, additional IVs, or any of our other services. Your membership covers HRT—everything else is available if you want it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to Feel Like Yourself Again?</h2>
          <p>Start with a $199 Range Assessment. If HRT is right for you, your $250/month membership includes everything you need.</p>
          <div className="cta-buttons">
            <a href="/range-assessment" className="btn-white">Book Assessment — $199</a>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>

      <style jsx>{`
        /* Trust Bar */
        .trust-bar {
          background: #000000;
          color: #ffffff;
          padding: 1rem 1.5rem;
        }
        .trust-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          gap: 2.5rem;
          flex-wrap: wrap;
        }
        .trust-item {
          font-size: 0.8125rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .trust-rating {
          color: #fbbf24;
        }

        /* Hero */
        .hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1.25rem;
        }
        .hero h1 {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
          max-width: 680px;
          margin: 0 0 1.5rem;
        }
        .hero-sub {
          font-size: 1.125rem;
          color: #525252;
          max-width: 620px;
          margin: 0 auto 2.5rem;
          line-height: 1.7;
          text-align: center;
        }
        .hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: bounce 2s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Buttons */
        .btn-primary {
          display: inline-block;
          background: #000000;
          color: #ffffff;
          padding: 0.875rem 2rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          background: #262626;
          transform: translateY(-1px);
        }
        .btn-outline {
          display: inline-block;
          background: transparent;
          color: #000000;
          padding: 0.875rem 2rem;
          border-radius: 8px;
          border: 2px solid #000000;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .btn-outline:hover {
          background: #000000;
          color: #ffffff;
        }
        .btn-white {
          display: inline-block;
          background: #ffffff;
          color: #000000;
          padding: 0.875rem 2rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .btn-white:hover {
          background: #f5f5f5;
          transform: translateY(-1px);
        }

        /* Sections */
        .section {
          padding: 4rem 1.5rem;
        }
        .section-gray {
          background: #fafafa;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .section-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
          text-align: center;
        }
        .section-kicker-left {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
        }
        .section-title {
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
          color: #171717;
        }
        .section-subtitle {
          font-size: 1.0625rem;
          color: #525252;
          text-align: center;
          max-width: 700px;
          margin: 0 auto 2.5rem;
          line-height: 1.7;
        }

        /* Included Grid */
        .included-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .included-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          transition: all 0.2s;
          position: relative;
        }
        .included-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .included-card.main {
          grid-column: span 1;
          background: #fafafa;
          border: 2px solid #000000;
        }
        .included-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .included-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }
        .included-card p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.6;
        }
        .value-tag {
          display: inline-block;
          background: #000000;
          color: #ffffff;
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 1rem;
        }

        /* Comparison Grid */
        .comparison-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }
        .comparison-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
        }
        .comparison-card.membership {
          border: 2px solid #000000;
          background: #fafafa;
        }
        .comparison-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .comparison-card ul {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem;
        }
        .comparison-card ul li {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e5e5e5;
          font-size: 0.9375rem;
          color: #525252;
        }
        .comparison-card ul li:last-child {
          border-bottom: none;
        }
        .comparison-card.membership ul li span:last-child {
          color: #22c55e;
          font-weight: 600;
        }
        .comparison-total {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background: #f5f5f5;
          border-radius: 8px;
          font-weight: 700;
          color: #171717;
        }
        .comparison-card.membership .comparison-total {
          background: #000000;
          color: #ffffff;
        }
        .comparison-card.elsewhere .comparison-total span:last-child {
          color: #dc2626;
        }

        /* Benefits Deep Section */
        .benefits-deep {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .benefit-block {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
          transition: all 0.2s;
        }
        .benefit-block:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .benefit-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }
        .benefit-content h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }
        .benefit-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.6;
        }
        .benefit-content strong {
          color: #171717;
        }

        /* Timeline */
        .timeline {
          max-width: 800px;
          margin: 0 auto;
        }
        .timeline-item {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 2rem;
          padding: 2rem 0;
          border-bottom: 1px solid #e5e5e5;
        }
        .timeline-item:last-child {
          border-bottom: none;
        }
        .timeline-period {
          font-size: 0.875rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .timeline-content h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }
        .timeline-content p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.6;
        }
        .timeline-note {
          text-align: center;
          margin-top: 2rem;
          padding: 1.5rem;
          background: #ffffff;
          border-radius: 12px;
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.6;
        }
        .timeline-note strong {
          color: #171717;
        }

        /* Steps Grid */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        .step-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem 1.5rem;
          position: relative;
          text-align: center;
        }
        .step-number {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 32px;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
        }
        .step-card h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }
        .step-card p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.6;
        }

        /* Symptoms Grid */
        .symptoms-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .symptom-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .symptom-card:hover {
          border-color: #000000;
        }
        .symptom-icon {
          font-size: 1.5rem;
        }
        .symptom-card span:last-child {
          font-size: 0.9375rem;
          color: #525252;
          font-weight: 500;
        }

        /* Intro Grid */
        .intro-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .intro-text h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1.5rem;
        }
        .intro-text p {
          font-size: 1rem;
          line-height: 1.7;
          color: #525252;
          margin-bottom: 1rem;
        }
        .intro-visual {
          background: linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%);
          border-radius: 12px;
          padding: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
        .visual-icon {
          font-size: 8rem;
          opacity: 0.8;
        }

        /* Check List */
        .check-list {
          list-style: none;
          margin-top: 1.5rem;
          padding: 0;
        }
        .check-list li {
          padding: 0.5rem 0 0.5rem 1.75rem;
          position: relative;
          font-size: 0.9375rem;
          color: #525252;
        }
        .check-list li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #000000;
          font-weight: 600;
        }

        /* FAQ */
        .faq-list {
          max-width: 800px;
          margin: 0 auto;
        }
        .faq-item {
          border-bottom: 1px solid #e5e5e5;
          padding: 1.5rem 0;
        }
        .faq-item:last-child {
          border-bottom: none;
        }
        .faq-item h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }
        .faq-item p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
        }

        /* Final CTA */
        .final-cta {
          background: #000000;
          color: #ffffff;
          padding: 5rem 1.5rem;
          text-align: center;
        }
        .final-cta h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        .final-cta p {
          font-size: 1.0625rem;
          color: rgba(255,255,255,0.8);
          max-width: 550px;
          margin: 0 auto 2rem;
        }
        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }
        .cta-location {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.6);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .hero h1 {
            font-size: 2rem;
          }
          .included-grid {
            grid-template-columns: 1fr;
          }
          .included-card.main {
            grid-column: span 1;
          }
          .comparison-grid {
            grid-template-columns: 1fr;
          }
          .benefits-deep {
            grid-template-columns: 1fr;
          }
          .timeline-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
          .steps-grid {
            grid-template-columns: 1fr 1fr;
          }
          .symptoms-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .intro-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .intro-visual {
            order: -1;
            min-height: 250px;
          }
          .section {
            padding: 3rem 1.5rem;
          }
        }

        @media (max-width: 640px) {
          .hero h1 {
            font-size: 1.75rem;
          }
          .section-title {
            font-size: 1.5rem;
          }
          .steps-grid {
            grid-template-columns: 1fr;
          }
          .symptoms-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}
