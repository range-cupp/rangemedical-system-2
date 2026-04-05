import Layout from '../components/Layout';
import Head from 'next/head';

export default function RetatrutideSkinGuide() {
  return (
    <Layout
      title="Retatrutide Skin Sensitivity Guide | Range Medical"
      description="How to manage skin sensitivity, tingling, and discomfort while on retatrutide. Step-by-step guide from Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Retatrutide Skin Sensitivity Guide",
              "description": "Patient guide for managing skin sensitivity side effects during retatrutide therapy including tingling, burning, and touch sensitivity.",
              "url": "https://www.range-medical.com/retatrutide-skin-guide",
              "provider": {
                "@type": "MedicalBusiness",
                "name": "Range Medical",
                "telephone": "+1-949-997-3988",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "1901 Westcliff Dr. Suite 10",
                  "addressLocality": "Newport Beach",
                  "addressRegion": "CA",
                  "postalCode": "92660",
                  "addressCountry": "US"
                }
              }
            })
          }}
        />
      </Head>

      {/* Hero */}
      <section className="guide-hero">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> SIDE EFFECT MANAGEMENT GUIDE</div>
          <h1>SKIN SENSITIVITY<br/>ON RETATRUTIDE</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Some people notice their skin feels different on this medication. Tingling, burning, or extra sensitivity to touch. This guide explains what is happening, why it happens, and exactly what to do about it.</p>
        </div>
      </section>

      {/* What's Happening */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> WHAT YOU MIGHT FEEL</div>
          <h2 className="section-title">Your Skin Might Feel Different</h2>
          <p className="section-subtitle">These feelings are not dangerous. They are a known side effect of retatrutide. Here are the three types of skin changes people notice.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>Tingling or Burning</h3>
              <p className="card-term">Medical term: Dysesthesia</p>
              <p>Your skin might tingle, burn, feel numb, or feel like something is crawling on it. Some people feel like their skin is wet or cold when it is not. This is the most common type.</p>
              <div className="stat-badge">About 1 in 5 people at higher doses</div>
            </div>
            <div className="info-card">
              <h3>Extra Sensitive Skin</h3>
              <p className="card-term">Medical term: Hyperesthesia</p>
              <p>Normal touch feels stronger than it should. A light touch might feel like a hard press. Warm water might feel too hot. Your skin is overreacting to things that normally feel fine.</p>
              <div className="stat-badge">About 1 in 14 people</div>
            </div>
            <div className="info-card full-width">
              <h3>Pain From Normal Touch</h3>
              <p className="card-term">Medical term: Allodynia</p>
              <p>This is the most intense version. Things that should not hurt actually do hurt. Clothes can feel like sandpaper. Running water can sting. A bed sheet touching your skin can feel painful. Your nervous system is misreading normal signals as pain signals.</p>
            </div>
          </div>

          <div className="tip-box" style={{ marginTop: '1.5rem' }}>
            <strong>The Good News</strong>
            <p>Based on the clinical trials, these skin feelings are not harmful to your health. They do not mean something is wrong with your skin or nerves long-term. For most people, they go away on their own or with simple changes.</p>
          </div>
        </div>
      </section>

      {/* Why It Happens */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> WHY THIS HAPPENS</div>
          <h2 className="section-title">What Is Causing This?</h2>
          <p className="section-subtitle">Retatrutide works on receptors throughout your body. Some of these receptors are near the nerves that control how your skin feels.</p>

          <div className="explain-list">
            <div className="explain-item">
              <div className="explain-icon">1</div>
              <div className="explain-content">
                <h4>The medication affects nerve signals</h4>
                <p>Retatrutide talks to receptors that sit near the nerves in your skin. This can change how those nerves send signals to your brain. Your brain gets confused and feels things that are not really there — like tingling or burning.</p>
              </div>
            </div>
            <div className="explain-item">
              <div className="explain-icon">2</div>
              <div className="explain-content">
                <h4>Higher doses = more likely</h4>
                <p>In clinical trials, skin sensitivity happened more often at higher doses. At 12mg, about 1 in 5 people noticed it. At 9mg, about 1 in 11. At lower doses, it was much less common.</p>
              </div>
            </div>
            <div className="explain-item">
              <div className="explain-icon">3</div>
              <div className="explain-content">
                <h4>Your nutrition matters</h4>
                <p>Because retatrutide reduces your appetite, you may not be eating enough of certain nutrients. Low vitamin B12, magnesium, and omega-3 fats can all make nerve sensitivity worse. Eating less means you need to be more careful about what you do eat.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tier 1 */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> STEP 1 — TRY FIRST</div>
          <h2 className="section-title">Simple Things That Help</h2>
          <p className="section-subtitle">Start here. These are easy changes you can make at home right away. Try these for up to 4 weeks before moving to the next step.</p>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Use a Cool Compress</h4>
                <p>When your skin flares up, put a cool (not ice cold) damp cloth on the area for 10-15 minutes. This calms the nerve signals down quickly. You can do this as many times as you need.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Wear Soft, Loose Clothes</h4>
                <p>Tight clothes and rough seams make skin sensitivity much worse. Switch to soft, loose-fitting fabrics. Cotton and bamboo are good choices. Avoid anything scratchy or tight against your skin.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Take an Over-the-Counter Antihistamine</h4>
                <p>Loratadine (brand name: Claritin) is the best first choice because it will not make you drowsy. Take one tablet daily. Most people notice improvement within 1 week. Cetirizine (Zyrtec) also works but may cause some drowsiness.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Fill Your Nutrition Gaps</h4>
                <p>Because you are eating less, make sure you are getting enough of these key nutrients that protect your nerves:</p>
                <ul className="nutrient-list">
                  <li><strong>Vitamin B12</strong> — take a supplement or eat eggs, fish, and meat</li>
                  <li><strong>Magnesium</strong> — take a supplement (magnesium glycinate is easiest on your stomach) or eat nuts, seeds, and leafy greens</li>
                  <li><strong>Omega-3 fats</strong> — take a fish oil supplement or eat fatty fish like salmon 2-3 times per week</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="tip-box" style={{ marginTop: '1.5rem' }}>
            <strong>Give It Time</strong>
            <p>These simple steps fix the problem for many people. Try them for 4 weeks before moving on. If your symptoms are getting better but not gone, keep going — they may fully resolve with more time.</p>
          </div>
        </div>
      </section>

      {/* Tier 2 */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> STEP 2 — IF SYMPTOMS CONTINUE</div>
          <h2 className="section-title">Change How You Take Your Dose</h2>
          <p className="section-subtitle">If the simple steps did not fix things after 4 weeks, the next move is to change your dosing. This is the single most effective thing you can do. Contact us before making these changes.</p>

          <div className="dose-strategy-grid">
            <div className="dose-strategy-card">
              <div className="strategy-number">A</div>
              <div className="strategy-content">
                <h4>Split Your Weekly Dose</h4>
                <p>Instead of one injection per week, split the same total amount into two smaller injections. For example, if you take 8mg once a week, take 4mg twice a week instead. This gives your body a lower peak amount at any one time, which reduces side effects while keeping the weight loss benefits.</p>
              </div>
            </div>
            <div className="dose-strategy-card">
              <div className="strategy-number">B</div>
              <div className="strategy-content">
                <h4>Temporarily Lower Your Dose</h4>
                <p>If splitting is not enough, we may reduce your total weekly dose by 25-50% for a few weeks. For example, going from 8mg to 6mg or 4mg. Once your skin calms down, we slowly bring the dose back up.</p>
              </div>
            </div>
            <div className="dose-strategy-card">
              <div className="strategy-number">C</div>
              <div className="strategy-content">
                <h4>Pause Your Dose Increase</h4>
                <p>If you are still in the process of increasing your dose (titrating up), we will hold at your current dose for an extra 2-4 weeks. This gives your body more time to adjust before going higher.</p>
              </div>
            </div>
          </div>

          <div className="data-box">
            <h4>Why This Works — The Data</h4>
            <p>In the TRIUMPH-4 clinical trial, skin sensitivity was directly tied to dose. At 9mg, patients lost 26.4% of their body weight with only 8.8% experiencing skin issues. At 12mg, weight loss was 28.7% but skin issues jumped to 20.9%. A slightly lower dose gives you almost the same results with much less skin sensitivity.</p>
          </div>
        </div>
      </section>

      {/* Tier 3 */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> STEP 3 — FOR STRONGER SYMPTOMS</div>
          <h2 className="section-title">Prescription Options</h2>
          <p className="section-subtitle">If changing your dose is not enough, your provider can prescribe medication that specifically calms down nerve sensitivity. These require a prescription from your Range Medical provider.</p>

          <div className="rx-grid">
            <div className="rx-card">
              <h4>Gabapentin or Pregabalin</h4>
              <p className="rx-type">Oral medication — taken daily</p>
              <p>These are the go-to prescriptions for nerve-related skin sensitivity. They calm down overactive nerve signals. Your provider will start you on a low dose and adjust as needed.</p>
              <p className="rx-best-for">Best for: moderate to severe symptoms that did not respond to dose changes</p>
            </div>
            <div className="rx-card">
              <h4>Lidocaine Cream</h4>
              <p className="rx-type">Topical — applied to skin</p>
              <p>A numbing cream you apply directly to the areas that bother you most. Works quickly and only affects the area where you put it. Good for symptoms that show up in specific spots rather than all over.</p>
              <p className="rx-best-for">Best for: symptoms in specific areas (arms, legs, torso)</p>
            </div>
            <div className="rx-card">
              <h4>Capsaicin Cream (OTC)</h4>
              <p className="rx-type">Topical — over-the-counter</p>
              <p>Made from hot peppers. It feels warm at first, then it actually reduces pain signals from the nerves in that area. Use the low-dose version you can buy at any pharmacy. Apply a thin layer to the affected area 3-4 times daily.</p>
              <p className="rx-best-for">Best for: localized burning or tingling sensations</p>
            </div>
            <div className="rx-card">
              <h4>Low-Dose Naltrexone</h4>
              <p className="rx-type">Oral medication — taken daily</p>
              <p>A newer option being explored for nerve side effects from weight loss medications. Limited data so far, but the science behind why it should work makes sense. Your provider can discuss if this is a good fit for you.</p>
              <p className="rx-best-for">Best for: cases where other options have not worked or are not well tolerated</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tier 4 */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> STEP 4 — LAST RESORT</div>
          <h2 className="section-title">Stopping the Medication</h2>
          <p className="section-subtitle">This is only for cases where symptoms are seriously affecting your daily life and nothing else has worked.</p>

          <div className="info-card full-width">
            <h3>What to Know About Stopping</h3>
            <p>Skin sensitivity goes away when you stop taking retatrutide. In many cases, it also goes away on its own after several weeks — even without stopping. We only recommend stopping if your quality of life is significantly affected and we have tried everything else first.</p>
            <p style={{ marginTop: '0.75rem' }}>Before stopping, your provider will make sure we have exhausted all other options: dose splitting, dose reduction, antihistamines, and prescription management. Most patients never need to reach this step.</p>
          </div>
        </div>
      </section>

      {/* Quick Reference */}
      <section className="section section-dark">
        <div className="container">
          <div className="v2-label" style={{ color: 'rgba(255,255,255,0.6)' }}><span className="v2-dot" style={{ background: 'rgba(255,255,255,0.6)' }} /> QUICK REFERENCE</div>
          <h2 className="section-title" style={{ color: '#fff' }}>What to Do Right Now</h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>Follow these steps in order. Most people only need Step 1.</p>

          <div className="quick-ref-grid">
            <div className="quick-ref-card">
              <div className="quick-ref-step">1</div>
              <h4>Mild symptoms?</h4>
              <p>Cool compress + loose clothes + daily Claritin + B12, magnesium, and fish oil supplements. Try for 4 weeks.</p>
            </div>
            <div className="quick-ref-card">
              <div className="quick-ref-step">2</div>
              <h4>Still there after 4 weeks?</h4>
              <p>Contact us. We will split your dose into two injections per week or temporarily lower it.</p>
            </div>
            <div className="quick-ref-card">
              <div className="quick-ref-step">3</div>
              <h4>Moderate to severe?</h4>
              <p>Your provider prescribes gabapentin, lidocaine cream, or another option based on your symptoms.</p>
            </div>
            <div className="quick-ref-card">
              <div className="quick-ref-step">4</div>
              <h4>Nothing is working?</h4>
              <p>We pause or stop the medication. Symptoms resolve after stopping. This is rare.</p>
            </div>
          </div>
        </div>
      </section>

      {/* When to Call */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> IMPORTANT</div>
          <h2 className="section-title">When to Contact Us</h2>

          <div className="safety-grid">
            <div className="safety-card warning">
              <h4>Call Us Right Away If:</h4>
              <ul>
                <li>Symptoms are severe and affecting your daily life</li>
                <li>You notice numbness that does not go away</li>
                <li>You have pain that keeps you from sleeping</li>
                <li>You notice muscle weakness along with skin changes</li>
                <li>Symptoms appeared suddenly after a dose increase</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Schedule a Check-In If:</h4>
              <ul>
                <li>Mild tingling or burning that has lasted more than 2 weeks</li>
                <li>You want to try splitting your dose</li>
                <li>Over-the-counter options are not helping</li>
                <li>You have questions about supplements</li>
                <li>You are unsure which step to try next</li>
              </ul>
            </div>
          </div>

          <div className="disclaimer">
            <p><strong>Important:</strong> This guide is for Range Medical patients on retatrutide therapy. It is not a substitute for personalized medical advice. Do not change your dose without talking to your provider first. If you are experiencing severe symptoms, contact us immediately.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We Are Here.</h2>
          <p>Whether you need a dose adjustment, a prescription for symptom management, or just want to talk through what you are feeling — our team can help.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">Call (949) 997-3988</a>
            <a href="sms:+19499973988" className="btn-outline-white">Text Us</a>
          </div>
          <p className="cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>

      <style jsx>{`
        .guide-hero {
          background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
          padding: 3.5rem 1.5rem 3rem;
          text-align: center;
        }
        .guide-hero h1 {
          font-size: clamp(2.2rem, 6vw, 3.5rem);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .v2-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #737373;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }
        .guide-hero .v2-label {
          justify-content: center;
        }
        .v2-dot {
          width: 6px;
          height: 6px;
          background: #737373;
          border-radius: 50%;
          display: inline-block;
        }
        .hero-rule {
          width: 60px;
          height: 3px;
          background: #000;
          margin: 0 auto 1.25rem;
        }
        .hero-sub {
          font-size: 1.0625rem;
          color: #525252;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.7;
        }
        .hero-dose {
          display: inline-flex;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding: 1rem 1.5rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          font-size: 0.9rem;
          color: #525252;
        }
        .hero-dose span {
          font-weight: 600;
          color: #171717;
        }
        .section {
          padding: 3.5rem 1.5rem;
        }
        .section-gray {
          background: #fafafa;
        }
        .section-dark {
          background: #000000;
          color: #ffffff;
        }
        .section-title {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 0.75rem;
        }
        .section-subtitle {
          font-size: 1rem;
          color: #525252;
          max-width: 600px;
          line-height: 1.7;
          margin-bottom: 2rem;
        }
        .body-text {
          font-size: 0.95rem;
          color: #525252;
          line-height: 1.7;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .info-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          padding: 1.75rem;
        }
        .info-card.full-width {
          grid-column: 1 / -1;
        }
        .info-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .card-term {
          font-size: 0.75rem;
          color: #737373;
          font-style: italic;
          margin-bottom: 0.75rem;
        }
        .info-card p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.7;
        }
        .stat-badge {
          display: inline-block;
          margin-top: 0.75rem;
          padding: 0.375rem 0.75rem;
          background: #f5f5f5;
          border: 1px solid #e5e5e5;
          font-size: 0.8rem;
          font-weight: 600;
          color: #525252;
        }
        .tip-box {
          background: #ffffff;
          border-left: 4px solid #000000;
          padding: 1.25rem 1.5rem;
          margin-top: 1.5rem;
        }
        .tip-box strong {
          display: block;
          margin-bottom: 0.25rem;
        }
        .tip-box p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.6;
          margin: 0;
        }
        .explain-list {
          margin-top: 1.5rem;
        }
        .explain-item {
          display: flex;
          gap: 1rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e5e5e5;
        }
        .explain-item:last-child {
          border-bottom: none;
        }
        .explain-icon {
          width: 2rem;
          height: 2rem;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        .explain-content h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .explain-content p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.7;
        }
        .steps-list {
          margin-top: 1.5rem;
        }
        .step-item {
          display: flex;
          gap: 1rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e5e5e5;
        }
        .step-item:last-child {
          border-bottom: none;
        }
        .step-number {
          width: 2rem;
          height: 2rem;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        .step-content h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .step-content p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.6;
        }
        .nutrient-list {
          list-style: none;
          padding: 0;
          margin: 0.75rem 0 0;
        }
        .nutrient-list li {
          font-size: 0.9rem;
          color: #525252;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.6;
        }
        .nutrient-list li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #2E6B35;
          font-weight: 700;
        }
        .dose-strategy-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .dose-strategy-card {
          display: flex;
          gap: 1.25rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          padding: 1.5rem;
        }
        .strategy-number {
          width: 2.5rem;
          height: 2.5rem;
          background: #000000;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .strategy-content h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.375rem;
        }
        .strategy-content p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.7;
        }
        .data-box {
          background: #ffffff;
          border: 2px solid #000000;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }
        .data-box h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .data-box p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.7;
        }
        .rx-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .rx-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          padding: 1.5rem;
        }
        .rx-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .rx-type {
          font-size: 0.75rem;
          color: #737373;
          font-style: italic;
          margin-bottom: 0.75rem;
        }
        .rx-card p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.7;
        }
        .rx-best-for {
          margin-top: 0.75rem;
          font-size: 0.8rem !important;
          font-weight: 600;
          color: #171717 !important;
          padding: 0.5rem 0.75rem;
          background: #f5f5f5;
          border: 1px solid #e5e5e5;
        }
        .quick-ref-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .quick-ref-card {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 1.5rem;
        }
        .quick-ref-step {
          width: 2rem;
          height: 2rem;
          background: #ffffff;
          color: #000000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }
        .quick-ref-card h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }
        .quick-ref-card p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
        }
        .safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .safety-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          padding: 1.5rem;
        }
        .safety-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #171717;
        }
        .safety-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .safety-card li {
          font-size: 0.875rem;
          color: #525252;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.5;
        }
        .safety-card.warning li::before {
          content: "!";
          position: absolute;
          left: 0;
          color: #d32f2f;
          font-weight: 700;
        }
        .safety-card.effects li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #2E6B35;
          font-weight: 700;
        }
        .disclaimer {
          background: #fafafa;
          border: 1px solid #e5e5e5;
          padding: 1.25rem;
          margin-top: 1.5rem;
        }
        .disclaimer p {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }
        .final-cta {
          background: #000000;
          color: #ffffff;
          padding: 3.5rem 1.5rem;
          text-align: center;
        }
        .final-cta h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }
        .final-cta p {
          font-size: 1rem;
          color: rgba(255,255,255,0.8);
          margin-bottom: 1.5rem;
        }
        .cta-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .btn-white {
          display: inline-block;
          background: #ffffff;
          color: #000000;
          padding: 0.875rem 1.75rem;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .btn-white:hover {
          background: #f5f5f5;
          transform: translateY(-1px);
        }
        .btn-outline-white {
          display: inline-block;
          background: transparent;
          color: #ffffff;
          padding: 0.875rem 1.75rem;
          border: 2px solid #ffffff;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .btn-outline-white:hover {
          background: #ffffff;
          color: #000000;
        }
        .cta-location {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
        }
        @media (max-width: 768px) {
          .guide-hero h1 {
            font-size: 2rem;
          }
          .hero-dose {
            flex-direction: column;
            gap: 0.5rem;
          }
          .info-grid,
          .safety-grid,
          .rx-grid,
          .quick-ref-grid {
            grid-template-columns: 1fr;
          }
          .section-title {
            font-size: 1.5rem;
          }
          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </Layout>
  );
}
