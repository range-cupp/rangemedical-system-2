// pages/weight-loss-medication-guide-page.jsx
// Weight Loss Medication Guide - Consolidated reference of all drip email content
// Public-facing page linked from Email 4's "View Full Guide" button

import Layout from '../components/Layout';
import Head from 'next/head';
import { useEffect } from 'react';

export default function WeightLossMedicationGuide() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const elements = document.querySelectorAll('.wlg-page .wlg-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const proteinSources = [
    { name: 'Lean Turkey', amount: '26g per 3 oz' },
    { name: 'Chicken Breast', amount: '25g per 3 oz' },
    { name: 'Fish', amount: '22g per 3 oz' },
    { name: 'Eggs', amount: '6g per egg' },
    { name: 'Lentils', amount: '18g per cup cooked' },
    { name: 'Greek Yogurt', amount: '15g per cup' },
  ];

  const nutrients = [
    { name: 'Fiber', sources: 'Oats, vegetables, fruits, nuts' },
    { name: 'Protein', sources: 'Chicken, fish, eggs, beans' },
    { name: 'Calcium', sources: 'Dairy, sardines, leafy greens' },
    { name: 'Vitamin D', sources: 'Fatty fish, eggs, mushrooms' },
  ];

  const recommendedSupplements = [
    { name: 'Calcium', desc: 'Supports bone health during weight loss' },
    { name: 'Whey Protein', desc: 'Helps meet protein goals, protects muscle' },
    { name: 'Probiotics', desc: 'Supports digestive health, may reduce GI symptoms' },
    { name: 'Ginger', desc: 'Natural nausea relief' },
    { name: 'Creatine', desc: 'Helps preserve muscle strength' },
  ];

  return (
    <Layout
      title="Weight Loss Medication Guide | Range Medical"
      description="Your complete guide to weight loss medication — how it works, nutrition, managing side effects, exercise, and supplements. Range Medical, Newport Beach."
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://www.range-medical.com/weight-loss-medication-guide-page" />
      </Head>

      <div className="wlg-page">
        {/* Hero */}
        <section className="wlg-hero">
          <div className="wlg-kicker">Weight Loss Program</div>
          <h1>Your Weight Loss Medication Guide</h1>
          <p className="wlg-body-text">
            Everything from your email series in one place — how your medication works, what to eat,
            managing side effects, exercise tips, and supplement support.
          </p>
          <div className="wlg-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* Section 1: How Your Medication Works */}
        <section className="wlg-section wlg-section-alt">
          <div className="wlg-container">
            <div className="wlg-animate">
              <div className="wlg-kicker">How It Works</div>
              <h2>How your medication helps.</h2>
              <div className="wlg-divider"></div>
              <p className="wlg-body-text">
                These medications work by changing how your body handles hunger and digestion.
                They target hormones that control appetite, satiety, and metabolism — helping
                your body naturally want less food.
              </p>
            </div>

            <div className="wlg-benefits-grid">
              {[
                { title: 'Feel Full Faster', desc: 'Your medication slows stomach emptying, so you feel satisfied sooner during meals.' },
                { title: 'Stay Full Longer', desc: 'Satiety hormones stay active longer, keeping you comfortable between meals without constant snacking.' },
                { title: 'Fewer Cravings', desc: 'The constant mental chatter about food quiets down, making healthy choices feel natural — not forced.' },
                { title: 'Eat Less Without Trying', desc: 'You\'ll naturally eat smaller portions without the willpower battle. It\'s biology, not discipline.' },
              ].map((item, i) => (
                <div key={i} className="wlg-benefit-card wlg-animate">
                  <div className="wlg-benefit-number">{String(i + 1).padStart(2, '0')}</div>
                  <div className="wlg-benefit-title">{item.title}</div>
                  <div className="wlg-benefit-desc">{item.desc}</div>
                </div>
              ))}
            </div>

            <div className="wlg-animate" style={{ marginTop: '2.5rem' }}>
              <p className="wlg-body-text">
                Every person is different — some lose more weight, some less. You'll get the
                best results when you combine your medication with healthy eating and regular movement.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Nutrition & Protein */}
        <section className="wlg-section">
          <div className="wlg-container">
            <div className="wlg-animate">
              <div className="wlg-kicker">Nutrition</div>
              <h2>Make every bite count.</h2>
              <div className="wlg-divider"></div>
              <p className="wlg-body-text">
                Since you're eating less while on your medication, it's important to focus on
                nutrient-dense foods. Here are the essentials your body needs.
              </p>
            </div>

            <div className="wlg-nutrients-grid wlg-animate">
              {nutrients.map((n, i) => (
                <div key={i} className="wlg-nutrient-card">
                  <div className="wlg-nutrient-name">{n.name}</div>
                  <div className="wlg-nutrient-sources">{n.sources}</div>
                </div>
              ))}
            </div>

            <div className="wlg-animate" style={{ marginTop: '3rem' }}>
              <h3>Protein is key.</h3>
              <div className="wlg-divider"></div>
              <p className="wlg-body-text">
                Protein helps you maintain muscle while losing fat, stay full longer, and
                support your metabolism. Try to include protein with every meal.
              </p>
            </div>

            <div className="wlg-protein-list wlg-animate">
              {proteinSources.map((source, i) => (
                <div key={i} className="wlg-protein-item">
                  <span className="wlg-protein-name">{source.name}</span>
                  <span className="wlg-protein-amount">{source.amount}</span>
                </div>
              ))}
            </div>

            <div className="wlg-tip wlg-animate">
              <strong>Pro Tip:</strong> If it's hard to eat enough protein, a protein shake
              can help fill the gap. Talk to us about recommendations.
            </div>
          </div>
        </section>

        {/* Section 3: Managing Side Effects */}
        <section className="wlg-section wlg-section-alt">
          <div className="wlg-container">
            <div className="wlg-animate">
              <div className="wlg-kicker">Side Effects</div>
              <h2>Managing common side effects.</h2>
              <div className="wlg-divider"></div>
              <p className="wlg-body-text">
                Side effects are common when starting your medication — but they don't have to
                slow you down. They usually improve as your body adjusts.
              </p>
            </div>

            {/* General Eating Tips */}
            <div className="wlg-animate" style={{ marginTop: '2.5rem' }}>
              <h3>General Eating Tips</h3>
              <div className="wlg-divider"></div>
              <div className="wlg-tip-list">
                <div className="wlg-tip-item">Eat slowly and chew each bite thoroughly</div>
                <div className="wlg-tip-item">Eat smaller, more frequent meals (every 3-4 hours)</div>
                <div className="wlg-tip-item">Stop eating when you feel full — don't push it</div>
                <div className="wlg-tip-item">Avoid lying down for 2 hours after eating</div>
                <div className="wlg-tip-item">Eat your last meal at least 2 hours before bed</div>
              </div>
            </div>

            {/* Side Effect Cards */}
            <div className="wlg-side-effects-grid">
              <div className="wlg-se-card wlg-animate">
                <h4>Nausea</h4>
                <ul>
                  <li>Don't skip breakfast</li>
                  <li>Limit high-fat and high-fiber foods in the first few days</li>
                  <li>Drink beverages 30-60 min before or after meals (not during)</li>
                  <li>Try apple slices, plain crackers, or ginger/mint tea</li>
                  <li>Avoid greasy and fried foods</li>
                </ul>
              </div>
              <div className="wlg-se-card wlg-animate">
                <h4>Constipation</h4>
                <ul>
                  <li>Gradually add more high-fiber foods (25-38g/day)</li>
                  <li>Drink 1.5-2 liters (51-68 oz) of water daily</li>
                </ul>
              </div>
              <div className="wlg-se-card wlg-animate">
                <h4>Diarrhea</h4>
                <ul>
                  <li>Temporarily reduce fiber — eat easy-to-digest foods (rice, chicken broth, cooked carrots)</li>
                  <li>Avoid coffee and alcohol</li>
                  <li>Reduce sugar alcohols (sorbitol, mannitol, xylitol)</li>
                </ul>
              </div>
              <div className="wlg-se-card wlg-animate">
                <h4>Bloating & Gas</h4>
                <ul>
                  <li>Avoid greasy and fried foods</li>
                  <li>Try herbal teas (chamomile, ginger, peppermint)</li>
                  <li>Avoid carbonated drinks</li>
                  <li>Limit gas-causing foods (beans, broccoli, cabbage, onions)</li>
                </ul>
              </div>
            </div>

            {/* When to Contact Us */}
            <div className="wlg-warning wlg-animate">
              <h4>When to Contact Us</h4>
              <p>Call us or get medical help right away if you have:</p>
              <ul>
                <li>Strong stomach pain that doesn't go away</li>
                <li>Yellow skin or eyes, dark urine</li>
                <li>Vomiting or diarrhea that won't stop</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Exercise */}
        <section className="wlg-section">
          <div className="wlg-container">
            <div className="wlg-animate">
              <div className="wlg-kicker">Exercise</div>
              <h2>Move your body, preserve your muscle.</h2>
              <div className="wlg-divider"></div>
              <p className="wlg-body-text">
                Exercise helps preserve muscle mass while you lose fat, and supports healthy digestion.
              </p>
            </div>

            <div className="wlg-exercise-grid">
              <div className="wlg-exercise-card wlg-animate">
                <div className="wlg-exercise-badge">Cardio</div>
                <h3>Aerobic Exercise</h3>
                <p><strong>Goal:</strong> 150 minutes per week, split across 5+ days</p>
                <p><strong>Examples:</strong> Brisk walking, biking, swimming, dancing, hiking</p>
              </div>
              <div className="wlg-exercise-card wlg-animate">
                <div className="wlg-exercise-badge">Strength</div>
                <h3>Resistance Training</h3>
                <p><strong>Goal:</strong> 3 sessions per week (with rest days between)</p>
                <p><strong>Format:</strong> 8-10 exercises, 8-12 reps, 2+ sets each</p>
              </div>
            </div>

            <div className="wlg-tip wlg-animate" style={{ marginTop: '2rem' }}>
              <strong>Important:</strong> You may feel more tired than usual on your medication.
              Listen to your body and adjust as needed — it's okay to start slow and build up.
            </div>
          </div>
        </section>

        {/* Section 5: Supplements */}
        <section className="wlg-section wlg-section-alt">
          <div className="wlg-container">
            <div className="wlg-animate">
              <div className="wlg-kicker">Supplements</div>
              <h2>Fill the nutritional gaps.</h2>
              <div className="wlg-divider"></div>
              <p className="wlg-body-text">
                Since you're eating less, supplements help fill nutritional gaps and keep your
                body healthy during weight loss.
              </p>
            </div>

            <div className="wlg-supplements-grid">
              <div className="wlg-supp-card wlg-supp-included wlg-animate">
                <div className="wlg-supp-badge">Included in Your Program</div>
                <div className="wlg-supp-item">
                  <strong>Multivitamin</strong>
                  <span>Covers essential vitamins and minerals your body needs when eating less</span>
                </div>
                <div className="wlg-supp-item">
                  <strong>Vitamin D</strong>
                  <span>Supports bone health, immune function, and energy levels</span>
                </div>
              </div>

              <div className="wlg-supp-card wlg-animate">
                <div className="wlg-supp-badge-alt">Recommended to Consider</div>
                {recommendedSupplements.map((supp, i) => (
                  <div key={i} className="wlg-supp-item">
                    <strong>{supp.name}</strong>
                    <span>{supp.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="wlg-section wlg-section-inverted wlg-cta-section">
          <div className="wlg-container">
            <div className="wlg-animate">
              <div className="wlg-kicker" style={{ marginBottom: '1.5rem' }}>You're Not Alone</div>
              <h2 className="wlg-cta-title">We're here to help you succeed.</h2>
              <p className="wlg-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                With the right support — medication, nutrition, exercise, and supplements — you
                can feel your best as you work toward your goals. Questions? Need a personalized plan?
                Reach out anytime.
              </p>
              <div className="wlg-cta-buttons">
                <a href="https://www.range-medical.com" className="wlg-btn-primary">Visit Range Medical</a>
                <div className="wlg-cta-or">or</div>
                <a href="tel:9499973988" className="wlg-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>

        <div className="wlg-disclaimer">
          This guide is for education only and does not replace medical advice.
        </div>
      </div>

      <style jsx>{`
        .wlg-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Animations */
        .wlg-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.wlg-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .wlg-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections */
        .wlg-section {
          padding: 4rem 1.5rem;
        }

        .wlg-section-alt {
          background: #fafafa;
          padding: 5rem 1.5rem;
        }

        .wlg-section-inverted {
          background: #000000;
          color: #ffffff;
        }

        /* Kicker */
        .wlg-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .wlg-section-inverted .wlg-kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Headlines */
        .wlg-page h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
        }

        .wlg-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .wlg-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .wlg-section-inverted h2 {
          color: #ffffff;
        }

        /* Body Text */
        .wlg-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 600px;
        }

        .wlg-section-inverted .wlg-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .wlg-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        /* Hero */
        .wlg-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .wlg-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .wlg-hero .wlg-body-text {
          text-align: center;
          margin: 0 auto 2.5rem;
        }

        .wlg-hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }

        .wlg-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: wlg-bounce 2s ease-in-out infinite;
        }

        @keyframes wlg-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Benefits Grid (How It Works) */
        .wlg-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .wlg-benefit-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .wlg-benefit-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .wlg-benefit-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .wlg-benefit-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .wlg-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
        }

        /* Nutrients Grid */
        .wlg-nutrients-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 2.5rem;
        }

        .wlg-nutrient-card {
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #fafafa;
          text-align: center;
        }

        .wlg-nutrient-name {
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .wlg-nutrient-sources {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.5;
        }

        /* Protein List */
        .wlg-protein-list {
          margin-top: 1.5rem;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
        }

        .wlg-protein-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e5e5;
          font-size: 0.9375rem;
        }

        .wlg-protein-item:last-child {
          border-bottom: none;
        }

        .wlg-protein-item:nth-child(even) {
          background: #fafafa;
        }

        .wlg-protein-name {
          font-weight: 600;
          color: #171717;
        }

        .wlg-protein-amount {
          color: #737373;
          font-size: 0.875rem;
        }

        /* Tip Box */
        .wlg-tip {
          margin-top: 2.5rem;
          padding: 1.25rem 1.5rem;
          background: #000000;
          color: #ffffff;
          font-size: 0.875rem;
          line-height: 1.7;
          border-radius: 8px;
        }

        /* General Tips List */
        .wlg-tip-list {
          margin-top: 1.5rem;
        }

        .wlg-tip-item {
          padding: 0.875rem 1.25rem;
          background: #ffffff;
          border-left: 3px solid #000000;
          margin-bottom: 0.5rem;
          font-size: 0.9375rem;
          color: #404040;
          line-height: 1.6;
        }

        /* Side Effects Grid */
        .wlg-side-effects-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .wlg-se-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
        }

        .wlg-se-card h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 1rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          font-size: 0.875rem;
        }

        .wlg-se-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .wlg-se-card li {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
        }

        .wlg-se-card li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.85rem;
          width: 5px;
          height: 5px;
          background: #a3a3a3;
          border-radius: 50%;
        }

        /* Warning Box */
        .wlg-warning {
          margin-top: 2.5rem;
          padding: 2rem;
          background: #000000;
          color: #ffffff;
          border-radius: 12px;
        }

        .wlg-warning h4 {
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 1rem;
        }

        .wlg-warning p {
          font-size: 0.875rem;
          color: #e5e5e5;
          line-height: 1.7;
          margin: 0 0 0.75rem;
        }

        .wlg-warning ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .wlg-warning li {
          font-size: 0.875rem;
          color: #e5e5e5;
          line-height: 1.8;
          padding-left: 1.25rem;
          position: relative;
        }

        .wlg-warning li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.7rem;
          width: 5px;
          height: 5px;
          background: #ffffff;
          border-radius: 50%;
        }

        /* Exercise Grid */
        .wlg-exercise-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .wlg-exercise-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #fafafa;
          position: relative;
        }

        .wlg-exercise-badge {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #ffffff;
          background: #000000;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .wlg-exercise-card h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 1rem;
        }

        .wlg-exercise-card p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
          margin: 0 0 0.5rem;
        }

        /* Supplements Grid */
        .wlg-supplements-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .wlg-supp-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
        }

        .wlg-supp-included {
          background: #000000;
          color: #ffffff;
          border-color: #000000;
        }

        .wlg-supp-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #ffffff;
          margin-bottom: 1.5rem;
        }

        .wlg-supp-badge-alt {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #737373;
          margin-bottom: 1.5rem;
        }

        .wlg-supp-item {
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .wlg-supp-card:not(.wlg-supp-included) .wlg-supp-item {
          border-bottom-color: #e5e5e5;
        }

        .wlg-supp-item:last-child {
          border-bottom: none;
        }

        .wlg-supp-item strong {
          font-size: 0.9375rem;
          font-weight: 700;
        }

        .wlg-supp-included .wlg-supp-item strong {
          color: #ffffff;
        }

        .wlg-supp-item span {
          font-size: 0.8125rem;
          line-height: 1.6;
        }

        .wlg-supp-included .wlg-supp-item span {
          color: rgba(255, 255, 255, 0.6);
        }

        .wlg-supp-card:not(.wlg-supp-included) .wlg-supp-item span {
          color: #737373;
        }

        /* CTA Section */
        .wlg-cta-section {
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .wlg-cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .wlg-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .wlg-btn-primary {
          display: inline-block;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.875rem 2rem;
          background: #ffffff;
          color: #000000;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .wlg-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        .wlg-cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .wlg-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .wlg-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Disclaimer */
        .wlg-disclaimer {
          text-align: center;
          padding: 1.5rem;
          font-size: 0.75rem;
          color: #a3a3a3;
          background: #fafafa;
          border-top: 1px solid #e5e5e5;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .wlg-section {
            padding: 3rem 1.5rem;
          }

          .wlg-section-alt {
            padding: 3rem 1.5rem;
          }

          .wlg-page h1 {
            font-size: 2rem;
          }

          .wlg-page h2 {
            font-size: 1.5rem;
          }

          .wlg-hero {
            padding: 3rem 1.5rem;
          }

          .wlg-benefits-grid {
            grid-template-columns: 1fr;
          }

          .wlg-nutrients-grid {
            grid-template-columns: 1fr 1fr;
          }

          .wlg-side-effects-grid {
            grid-template-columns: 1fr;
          }

          .wlg-exercise-grid {
            grid-template-columns: 1fr;
          }

          .wlg-supplements-grid {
            grid-template-columns: 1fr;
          }

          .wlg-cta-title {
            font-size: 2rem;
          }

          .wlg-cta-buttons {
            flex-direction: column;
          }

          .wlg-cta-section {
            padding: 4rem 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
