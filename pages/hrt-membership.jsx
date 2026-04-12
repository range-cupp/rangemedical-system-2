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
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Hormone Optimization</span>
        </div>
      </div>

      <div className="hrt-page">
        {/* Hero */}
        <section className="hrt-hero">
          <div className="v2-label"><span className="v2-dot" /> HORMONES · MEMBERSHIP · RESULTS</div>
          <h1>HRT MEMBERSHIP: EVERYTHING YOU NEED FOR $250/MONTH</h1>
          <div className="hrt-hero-rule"></div>
          <p className="hrt-body-text">
            All your hormone medications, a monthly Range IV, and member perks—one simple price, no surprises.
          </p>
          <div className="hrt-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What's Included */}
        <section className="hrt-section hrt-section-alt" id="whats-included">
          <div className="hrt-container">
            <div className="v2-label"><span className="v2-dot" /> WHAT'S INCLUDED</div>
            <h2>YOUR $250/MONTH MEMBERSHIP</h2>
            <div className="hrt-divider"></div>
            <p className="hrt-body-text">
              No hidden fees. No pharmacy surprises. Everything you need to optimize your hormones in one monthly membership.
            </p>
            <div className="included-grid">
              <div className="included-card main">
                <h3>All HRT Medications</h3>
                <p>Your personalized hormone protocol—testosterone, estrogen, progesterone, thyroid, or whatever your labs indicate you need. Dispensed from our pharmacy, included in your membership.</p>
              </div>
              <div className="included-card main">
                <h3>Monthly Range IV</h3>
                <p>A custom IV with 5 vitamins and minerals tailored to support your hormone optimization. A $225 value, included every month.</p>
                <span className="value-tag">$225 VALUE</span>
              </div>
              <div className="included-card main">
                <h3>Follow-Up Labs Included</h3>
                <p>Your first follow-up blood draw at 6-8 weeks to check how you're responding, then every 3 months to keep your levels dialed in. No extra charge.</p>
              </div>
              <div className="included-card">
                <h3>Member Giveaways</h3>
                <p>Exclusive access to member-only giveaways, samples, and perks throughout the year.</p>
              </div>
              <div className="included-card">
                <h3>Direct Access</h3>
                <p>Text or call us when you have questions. No waiting weeks for a callback.</p>
              </div>
              <div className="included-card">
                <h3>Protocol Adjustments</h3>
                <p>As your labs and symptoms change, we adjust your protocol—no extra charge.</p>
              </div>
            </div>
          </div>
        </section>

        {/* The Math */}
        <section className="hrt-section">
          <div className="hrt-container">
            <div className="v2-label"><span className="v2-dot" /> THE VALUE</div>
            <h2>WHY MEMBERS LOVE THIS</h2>
            <div className="hrt-divider"></div>
            <p className="hrt-body-text">
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
                  <li><span>All hormone medications</span><span className="check-mark">✓</span></li>
                  <li><span>Monthly Range IV ($225 value)</span><span className="check-mark">✓</span></li>
                  <li><span>Follow-up labs (6-8 wks + quarterly)</span><span className="check-mark">✓</span></li>
                  <li><span>Protocol adjustments</span><span className="check-mark">✓</span></li>
                  <li><span>Member giveaways</span><span className="check-mark">✓</span></li>
                  <li><span>Direct provider access</span><span className="check-mark">✓</span></li>
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
        <section className="hrt-section hrt-section-alt">
          <div className="hrt-container">
            <div className="v2-label"><span className="v2-dot" /> THE SCIENCE</div>
            <h2>WHAT OPTIMIZED TESTOSTERONE DOES FOR MEN</h2>
            <div className="hrt-divider"></div>
            <p className="hrt-body-text">
              This isn't about getting jacked. It's about restoring what your body used to do naturally—backed by decades of clinical research.
            </p>
            <div className="benefits-deep">
              <div className="benefit-block">
                <div className="benefit-number">01</div>
                <div className="benefit-content">
                  <h3>Builds Lean Muscle Mass</h3>
                  <p>Testosterone directly stimulates protein synthesis and activates satellite cells that repair and grow muscle tissue. Clinical studies show men on TRT gain an average of <strong>3-6 lbs of lean muscle</strong> in the first 3-6 months—with some studies showing gains up to 8 lbs in men starting with very low levels. Intramuscular testosterone shows a <strong>5.7% increase in fat-free mass</strong> on average.</p>
                </div>
              </div>
              <div className="benefit-block">
                <div className="benefit-number">02</div>
                <div className="benefit-content">
                  <h3>Reduces Body Fat</h3>
                  <p>Optimized testosterone shifts your body composition—less fat, more muscle. Research shows an average <strong>reduction of 3-6 lbs of fat mass</strong> over 6-12 months, with the biggest losses in stubborn areas like the midsection and love handles. One 56-week study showed men lost <strong>6.4 lbs more fat</strong> than placebo while gaining muscle.</p>
                </div>
              </div>
              <div className="benefit-block">
                <div className="benefit-number">03</div>
                <div className="benefit-content">
                  <h3>Restores Energy & Motivation</h3>
                  <p>That afternoon crash and constant fatigue? Often tied to low T. Studies show improvements in energy and reduced fatigue within <strong>3-4 weeks</strong> of starting treatment. By week 6, most men report feeling noticeably more energized throughout the day.</p>
                </div>
              </div>
              <div className="benefit-block">
                <div className="benefit-number">04</div>
                <div className="benefit-content">
                  <h3>Clears Brain Fog</h3>
                  <p>Testosterone affects neurotransmitters like serotonin and dopamine. Clinical research shows cognitive benefits—better focus, clearer thinking, improved memory—begin appearing around <strong>week 3</strong> and continue improving for several months.</p>
                </div>
              </div>
              <div className="benefit-block">
                <div className="benefit-number">05</div>
                <div className="benefit-content">
                  <h3>Improves Mood & Reduces Depression</h3>
                  <p>Low testosterone is linked to irritability, anxiety, and depression. Studies using depression rating scales show measurable improvement in depressive symptoms within <strong>3-6 weeks</strong>, with maximum benefits reached around 18-30 weeks. Many men describe feeling "like themselves again."</p>
                </div>
              </div>
              <div className="benefit-block">
                <div className="benefit-number">06</div>
                <div className="benefit-content">
                  <h3>Restores Libido & Sexual Function</h3>
                  <p>Sexual interest typically improves within <strong>3 weeks</strong>, plateauing around week 6. Improvements in erections and sexual performance may take longer—up to 6 months for full effect. Many men report morning erections returning within the first 2 weeks.</p>
                </div>
              </div>
              <div className="benefit-block">
                <div className="benefit-number">07</div>
                <div className="benefit-content">
                  <h3>Better Sleep Quality</h3>
                  <p>Testosterone helps regulate sleep architecture. Many men notice improved sleep quality within the <strong>first 1-2 weeks</strong>—falling asleep easier, staying asleep longer, and waking up feeling more rested.</p>
                </div>
              </div>
              <div className="benefit-block">
                <div className="benefit-number">08</div>
                <div className="benefit-content">
                  <h3>Strengthens Bones</h3>
                  <p>Testosterone is critical for bone mineral density. Research shows <strong>5% increase in spinal bone density</strong> and up to <strong>14% increase in trabecular bone density</strong> over 18 months—reducing fracture risk as you age.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="hrt-section">
          <div className="hrt-container">
            <div className="v2-label"><span className="v2-dot" /> RESULTS TIMELINE</div>
            <h2>WHEN YOU'LL FEEL THE DIFFERENCE</h2>
            <div className="hrt-divider"></div>
            <p className="hrt-body-text">
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
            <div className="timeline-note">
              <strong>Important:</strong> Results vary based on your starting testosterone levels, age, lifestyle, and how consistently you follow your protocol. Men who combine TRT with resistance training and good nutrition see the best results.
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="hrt-section hrt-section-alt">
          <div className="hrt-container">
            <div className="v2-label"><span className="v2-dot" /> HOW IT WORKS</div>
            <h2>GETTING STARTED IS SIMPLE</h2>
            <div className="hrt-divider"></div>
            <p className="hrt-body-text">
              From your first visit to feeling like yourself again—here's what to expect.
            </p>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Range Assessment</h3>
                <p>free consultation where we review your symptoms, health history, and goals. We'll order labs if needed.</p>
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
        <section className="hrt-section">
          <div className="hrt-container">
            <div className="v2-label"><span className="v2-dot" /> WHO IT'S FOR</div>
            <h2>SIGNS YOUR HORMONES MAY BE OFF</h2>
            <div className="hrt-divider"></div>
            <p className="hrt-body-text">
              If any of these sound familiar, hormone optimization might help.
            </p>
            <div className="symptoms-grid">
              <div className="symptom-card"><span>Constant fatigue</span></div>
              <div className="symptom-card"><span>Brain fog</span></div>
              <div className="symptom-card"><span>Mood changes</span></div>
              <div className="symptom-card"><span>Stubborn weight</span></div>
              <div className="symptom-card"><span>Muscle loss</span></div>
              <div className="symptom-card"><span>Poor sleep</span></div>
              <div className="symptom-card"><span>Low libido</span></div>
              <div className="symptom-card"><span>Hot flashes</span></div>
            </div>
          </div>
        </section>

        {/* Range IV Details */}
        <section className="hrt-section hrt-section-alt">
          <div className="hrt-container">
            <div className="intro-grid">
              <div className="intro-text">
                <div className="v2-label"><span className="v2-dot" /> MONTHLY BENEFIT</div>
                <h2>YOUR RANGE IV: $225 VALUE INCLUDED</h2>
                <div className="hrt-divider"></div>
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
                <div className="visual-stat">
                  <div className="visual-stat-number">$225</div>
                  <div className="visual-stat-label">Value included<br />every month</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="hrt-section">
          <div className="hrt-container">
            <div className="v2-label"><span className="v2-dot" /> QUESTIONS</div>
            <h2>COMMON QUESTIONS</h2>
            <div className="hrt-divider"></div>
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
                <p>Start with a $197 Range Assessment (credited toward treatment). We'll review your symptoms, order labs if needed, and determine if HRT is right for you. If it is, you'll start your membership when you begin your protocol.</p>
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
          <div className="hrt-container">
            <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}><span className="v2-dot" /> NEXT STEPS</div>
            <h2>READY TO FEEL LIKE YOURSELF AGAIN?</h2>
            <div className="hrt-divider-light"></div>
            <p>Start with a $197 Range Assessment. If HRT is right for you, your $250/month membership includes everything you need.</p>
            <div className="cta-buttons">
              <a href="/assessment" className="btn-white">Book Your Range Assessment</a>
            </div>
            <p className="cta-location">Range Medical · 1901 Westcliff Dr, Newport Beach</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        .hrt-page {
          overflow-x: hidden;
        }

        /* Trust Bar */
        .trust-bar {
          background: #1a1a1a;
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
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .trust-rating {
          color: #808080;
        }

        /* Hero */
        .hrt-hero {
          padding: 6rem 2rem 5rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 1200px;
          margin: 0 auto;
        }
        .hrt-hero h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #171717;
          max-width: 680px;
          margin-bottom: 1.5rem;
        }
        .hrt-hero-rule {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.5rem;
        }
        .hrt-hero .hrt-body-text {
          text-align: left;
          margin: 0 0 2.5rem 0;
        }
        .hrt-hero-scroll {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }
        .hrt-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: hrt-bounce 2s ease-in-out infinite;
        }
        @keyframes hrt-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Container */
        .hrt-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Sections */
        .hrt-section {
          padding: 6rem 2rem;
        }
        .hrt-section-alt {
          background: #fafafa;
        }

        /* Headlines */
        .hrt-page h2 {
          font-size: 2.25rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 0.95;
          text-transform: uppercase;
          color: #171717;
          margin-bottom: 1rem;
        }
        .hrt-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        /* Body Text */
        .hrt-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #737373;
          max-width: 600px;
        }

        /* Divider */
        .hrt-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }
        .hrt-divider-light {
          width: 48px;
          height: 1px;
          background: rgba(255, 255, 255, 0.12);
          margin: 1.25rem 0;
        }

        /* Buttons */
        .btn-white {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.875rem 2rem;
          background: #ffffff;
          color: #1a1a1a;
          border: none;
          border-radius: 0;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .btn-white:hover {
          background: #e0e0e0;
          transform: translateY(-1px);
        }

        /* Included Grid */
        .included-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-top: 2rem;
        }
        .included-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 0;
          padding: 2rem;
          transition: border-color 0.2s;
          position: relative;
        }
        .included-card:hover {
          border-color: #1a1a1a;
        }
        .included-card.main {
          grid-column: span 1;
          background: #ffffff;
          border: 2px solid #1a1a1a;
        }
        .included-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }
        .included-card p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.6;
        }
        .value-tag {
          display: inline-block;
          background: #1a1a1a;
          color: #ffffff;
          padding: 0.25rem 0.75rem;
          border-radius: 0;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          margin-top: 1rem;
        }

        /* Comparison Grid */
        .comparison-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          max-width: 900px;
          margin-top: 2rem;
        }
        .comparison-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 0;
          padding: 2rem;
        }
        .comparison-card.membership {
          border: 2px solid #1a1a1a;
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
          border-bottom: 1px solid #e0e0e0;
          font-size: 0.9375rem;
          color: #737373;
        }
        .comparison-card ul li:last-child {
          border-bottom: none;
        }
        .check-mark {
          color: #808080 !important;
          font-weight: 700 !important;
        }
        .comparison-total {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background: #fafafa;
          border-radius: 0;
          font-weight: 700;
          color: #171717;
        }
        .comparison-card.membership .comparison-total {
          background: #1a1a1a;
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
          margin-top: 2rem;
        }
        .benefit-block {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 0;
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
          transition: border-color 0.2s;
        }
        .benefit-block:hover {
          border-color: #1a1a1a;
        }
        .benefit-number {
          font-size: 1.5rem;
          font-weight: 900;
          color: #808080;
          flex-shrink: 0;
          line-height: 1;
        }
        .benefit-content h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }
        .benefit-content p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.6;
        }
        .benefit-content strong {
          color: #171717;
        }

        /* Timeline */
        .timeline {
          max-width: 800px;
          margin-top: 2rem;
        }
        .timeline-item {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 2rem;
          padding: 2rem 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .timeline-item:last-child {
          border-bottom: none;
        }
        .timeline-period {
          font-size: 11px;
          font-weight: 700;
          color: #808080;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .timeline-content h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }
        .timeline-content p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.6;
        }
        .timeline-note {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #fafafa;
          border: 1px solid #e0e0e0;
          border-radius: 0;
          font-size: 0.875rem;
          color: #737373;
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
          margin-top: 2rem;
        }
        .step-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 0;
          padding: 2rem 1.5rem;
          position: relative;
          text-align: center;
        }
        .step-number {
          font-size: 2rem;
          font-weight: 900;
          color: #808080;
          margin-bottom: 0.75rem;
          line-height: 1;
        }
        .step-card h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }
        .step-card p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.6;
        }

        /* Symptoms Grid */
        .symptoms-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-top: 2rem;
        }
        .symptom-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 0;
          padding: 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          transition: border-color 0.2s;
        }
        .symptom-card:hover {
          border-color: #1a1a1a;
        }
        .symptom-card span {
          font-size: 0.9375rem;
          color: #737373;
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
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 0.95;
          text-transform: uppercase;
          color: #171717;
          margin-bottom: 1rem;
        }
        .intro-text p {
          font-size: 1rem;
          line-height: 1.7;
          color: #737373;
          margin-bottom: 1rem;
        }
        .intro-visual {
          background: #1a1a1a;
          border-radius: 0;
          padding: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
        .visual-stat {
          text-align: center;
        }
        .visual-stat-number {
          font-size: 4rem;
          font-weight: 900;
          color: #808080;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 1rem;
        }
        .visual-stat-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.5;
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
          color: #737373;
        }
        .check-list li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 700;
        }

        /* FAQ */
        .faq-list {
          max-width: 800px;
          margin-top: 1rem;
        }
        .faq-item {
          border-bottom: 1px solid #e0e0e0;
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
          color: #737373;
          line-height: 1.7;
        }

        /* Final CTA */
        .final-cta {
          background: #1a1a1a;
          color: #ffffff;
          padding: 6rem 2rem;
        }
        .final-cta h2 {
          font-size: 2.25rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 0.95;
          text-transform: uppercase;
          margin-bottom: 1rem;
          color: #ffffff;
        }
        .final-cta p {
          font-size: 1.0625rem;
          color: rgba(255,255,255,0.55);
          max-width: 550px;
          margin: 0 0 2rem;
          line-height: 1.7;
        }
        .cta-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }
        .cta-location {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3) !important;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .hrt-hero h1 {
            font-size: 2.25rem;
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
          .hrt-section {
            padding: 4rem 1.5rem;
          }
        }

        @media (max-width: 640px) {
          .hrt-hero {
            padding: 4rem 1.5rem 3rem;
          }
          .hrt-hero h1 {
            font-size: 2rem;
          }
          .hrt-page h2 {
            font-size: 1.75rem;
          }
          .steps-grid {
            grid-template-columns: 1fr;
          }
          .symptoms-grid {
            grid-template-columns: 1fr 1fr;
          }
          .final-cta {
            padding: 4rem 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
