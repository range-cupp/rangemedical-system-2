import Layout from '../components/Layout';
import Link from 'next/link';

export default function IVTherapy() {
  return (
    <Layout 
      title="IV Therapy & Injections Newport Beach | NAD+ | Range Medical"
      description="IV therapy and vitamin injections in Newport Beach. Custom Range IV, NAD+ infusions, methylene blue, B12, glutathione, and more. (949) 997-3988."
    >
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">IV & Injection Therapy</span>
          <h1>Nutrients Delivered Directly Where They're Needed</h1>
          <p className="hero-sub">Skip the gut. IV and injection therapy delivers vitamins, minerals, and compounds directly into your bloodstream—100% absorption, faster results, and higher doses than oral supplements can achieve.</p>
          
          <div className="hero-cta">
            <Link href="/range-assessment" className="btn-primary">Start with a Range Assessment</Link>
            <p className="hero-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a></p>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">✓ Licensed Providers</span>
          <span className="trust-item">✓ Medical-Grade Ingredients</span>
          <span className="trust-item">✓ Custom Formulations</span>
          <span className="trust-item">✓ Comfortable Lounge Setting</span>
        </div>
      </div>

      {/* Why IV */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Science</div>
          <h2 className="section-title">Why Direct Delivery?</h2>
          <p className="section-subtitle">Oral supplements have limits. IV and injection therapy bypasses those limits entirely.</p>
          
          <div className="problem-cards">
            <div className="problem-card">
              <div className="problem-icon">💯</div>
              <h4>100% Absorption</h4>
              <p>Oral vitamins lose 20-80% to digestion. IV delivery puts nutrients directly into your bloodstream—nothing lost.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">⚡</div>
              <h4>Higher Therapeutic Doses</h4>
              <p>Some nutrients can only reach therapeutic levels through IV. You'd need handfuls of pills to match what one infusion delivers.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🚀</div>
              <h4>Faster Results</h4>
              <p>Feel the effects within hours, not weeks. Ideal for acute needs like recovery, immune support, or energy crashes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Range IV */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Our Signature IV</div>
          <h2 className="section-title">The Range IV</h2>
          <p className="section-subtitle">Not a one-size-fits-all drip. Your Range IV is customized based on your symptoms and goals.</p>
          
          <div className="featured-treatment">
            <div className="featured-treatment-content">
              <h3>Tailored to You</h3>
              <p>Before your infusion, our nurses review your symptoms and goals. We then customize a blend of vitamins and minerals specifically for what you need—whether that's immune support, energy, recovery, hydration, or a combination.</p>
              
              <div className="featured-details">
                <div className="featured-detail">
                  <span className="detail-label">Session Length</span>
                  <span className="detail-value">45-90 minutes</span>
                </div>
                <div className="featured-detail">
                  <span className="detail-label">Setting</span>
                  <span className="detail-value">Comfortable lounge</span>
                </div>
                <div className="featured-detail">
                  <span className="detail-label">Customization</span>
                  <span className="detail-value">Based on your needs</span>
                </div>
              </div>
              
              <h4>Common Formulations Include:</h4>
              <ul className="featured-list">
                <li><strong>Immune Boost</strong> — Vitamin C, zinc, B vitamins, glutathione</li>
                <li><strong>Energy & Recovery</strong> — B-complex, amino acids, magnesium</li>
                <li><strong>Hydration Plus</strong> — Electrolytes, B vitamins, minerals</li>
                <li><strong>Performance</strong> — Amino acids, carnitine, B12, magnesium</li>
                <li><strong>Detox Support</strong> — Glutathione, NAC, vitamin C</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* NAD+ */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Cellular Energy</div>
          <h2 className="section-title">NAD+ Therapy</h2>
          <p className="section-subtitle">NAD+ is a coenzyme in every cell of your body. It's essential for energy production, DNA repair, and healthy aging—and it declines as you get older.</p>
          
          <div className="nad-grid">
            <div className="nad-card">
              <h3>💧 NAD+ IV Infusion</h3>
              <p className="nad-description">High-dose NAD+ delivered directly into your bloodstream for maximum cellular impact.</p>
              
              <div className="nad-details">
                <div className="nad-detail">
                  <span className="nad-label">Session Length</span>
                  <span className="nad-value">1-4 hours</span>
                </div>
                <div className="nad-detail">
                  <span className="nad-label">Frequency</span>
                  <span className="nad-value">Weekly to monthly</span>
                </div>
              </div>
              
              <h4>Benefits:</h4>
              <ul>
                <li>Enhanced mental clarity and focus</li>
                <li>Increased energy and reduced fatigue</li>
                <li>Support for healthy aging</li>
                <li>Improved cellular repair</li>
                <li>Better athletic recovery</li>
              </ul>
              
              <p className="nad-note">Session length depends on dosage. Lower doses infuse faster. Your provider will recommend the right protocol.</p>
            </div>
            
            <div className="nad-card">
              <h3>💉 NAD+ Injection</h3>
              <p className="nad-description">A quicker option for maintenance between IV sessions or for those short on time.</p>
              
              <div className="nad-details">
                <div className="nad-detail">
                  <span className="nad-label">Session Length</span>
                  <span className="nad-value">5 minutes</span>
                </div>
                <div className="nad-detail">
                  <span className="nad-label">Frequency</span>
                  <span className="nad-value">1-3x per week</span>
                </div>
              </div>
              
              <h4>Best For:</h4>
              <ul>
                <li>Maintenance between IV sessions</li>
                <li>Busy schedules</li>
                <li>Ongoing NAD+ support</li>
                <li>Building up tolerance</li>
              </ul>
              
              <p className="nad-note">Available in multiple dosages. Many patients combine periodic IV sessions with regular injections.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Methylene Blue */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Mitochondrial Support</div>
          <h2 className="section-title">Methylene Blue</h2>
          <p className="section-subtitle">A powerful mitochondrial enhancer that supports brain function, energy production, and cellular health.</p>
          
          <div className="mb-grid">
            <div className="mb-card">
              <h3>💧 Methylene Blue IV</h3>
              <p>Medical-grade methylene blue delivered intravenously for maximum bioavailability and cellular uptake.</p>
              <ul>
                <li>Enhanced mitochondrial function</li>
                <li>Cognitive clarity and focus</li>
                <li>Neuroprotective properties</li>
                <li>Antioxidant support</li>
              </ul>
            </div>
            
            <div className="mb-card">
              <h3>💊 The Blue (Sublingual)</h3>
              <p>Convenient sublingual formulation for at-home use between IV sessions or as a standalone protocol.</p>
              <ul>
                <li>Easy daily dosing</li>
                <li>Maintenance between IVs</li>
                <li>Brain and energy support</li>
                <li>Travel-friendly</li>
              </ul>
            </div>
          </div>
          
          <p className="mb-note">Methylene blue may cause temporary blue discoloration of urine—this is normal and harmless.</p>
        </div>
      </section>

      {/* Quick Shots */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Quick Shots</div>
          <h2 className="section-title">Vitamin Injections</h2>
          <p className="section-subtitle">In and out in 5 minutes. No IV needed. Great for targeted support or maintenance between infusions.</p>
          
          <div className="shots-grid">
            <div className="shot-category">
              <h3>Energy & Metabolism</h3>
              <div className="shot-list">
                <div className="shot-item">
                  <h4>B12 (Methylcobalamin)</h4>
                  <p>Energy, mood, nerve health</p>
                </div>
                <div className="shot-item">
                  <h4>B-Complex</h4>
                  <p>Energy, metabolism, brain function</p>
                </div>
                <div className="shot-item">
                  <h4>Amino Blend</h4>
                  <p>Energy, muscle support, recovery</p>
                </div>
                <div className="shot-item">
                  <h4>L-Carnitine</h4>
                  <p>Fat metabolism, energy production</p>
                </div>
              </div>
            </div>
            
            <div className="shot-category">
              <h3>Recovery & Wellness</h3>
              <div className="shot-list">
                <div className="shot-item">
                  <h4>Glutathione</h4>
                  <p>Master antioxidant, detox, skin brightening</p>
                </div>
                <div className="shot-item">
                  <h4>NAC</h4>
                  <p>Antioxidant, liver support, immune health</p>
                </div>
                <div className="shot-item">
                  <h4>BCAA</h4>
                  <p>Muscle recovery, athletic performance</p>
                </div>
                <div className="shot-item">
                  <h4>Vitamin D3</h4>
                  <p>Immune support, bone health, mood</p>
                </div>
              </div>
            </div>
            
            <div className="shot-category">
              <h3>Beauty & Hair</h3>
              <div className="shot-list">
                <div className="shot-item">
                  <h4>Biotin</h4>
                  <p>Hair, skin, and nail health</p>
                </div>
                <div className="shot-item">
                  <h4>Glutathione</h4>
                  <p>Skin brightening, anti-aging</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Benefits */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Common Uses</div>
          <h2 className="section-title">Who Benefits from IV & Injection Therapy?</h2>
          <p className="section-subtitle">Direct nutrient delivery supports a wide range of health and performance goals.</p>
          
          <div className="conditions-grid">
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🏃</span>Athletes & Active People</h4>
                <p>Faster recovery, better hydration, enhanced performance, and reduced muscle fatigue.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">😴</span>Low Energy & Fatigue</h4>
                <p>Direct B vitamins and NAD+ can restore energy when oral supplements aren't cutting it.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🤒</span>Immune Support</h4>
                <p>High-dose vitamin C, zinc, and glutathione to support your immune system when you need it most.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🧠</span>Brain Fog & Focus</h4>
                <p>NAD+ and methylene blue support mental clarity, focus, and cognitive performance.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">✨</span>Skin & Anti-Aging</h4>
                <p>Glutathione for skin brightening, NAD+ for cellular health, biotin for hair and nails.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🍹</span>Recovery & Rehydration</h4>
                <p>Bounce back faster from travel, illness, late nights, or dehydration.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Your Visit</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Whether you're here for an IV or a quick shot, we make the process simple and comfortable.</p>
          
          <div className="experience-grid">
            <div className="experience-step">
              <div className="experience-number">1</div>
              <div className="experience-content">
                <h4>Check In</h4>
                <p>Our team reviews your symptoms and goals. For first-time IV patients, we'll do a quick health screening.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">2</div>
              <div className="experience-content">
                <h4>Customize Your Treatment</h4>
                <p>Based on your needs, we'll recommend the right IV formulation or injection. Your nurse explains everything before we start.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">3</div>
              <div className="experience-content">
                <span className="duration">5 min (shot) or 45-90 min (IV)</span>
                <h4>Relax & Receive</h4>
                <p>Injections take just a few minutes. IVs are done in our comfortable lounge—bring a book, work on your laptop, or just relax.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">4</div>
              <div className="experience-content">
                <h4>Resume Your Day</h4>
                <p>No downtime. Most patients feel energized and ready to go. We'll recommend a follow-up schedule based on your goals.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Questions</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          
          <div className="faq-container">
            <div className="faq-item">
              <h4>Is IV therapy safe?</h4>
              <p>Yes. IV therapy has been used safely in medical settings for decades. Our IVs are administered by licensed nurses using medical-grade ingredients. We screen all patients before treatment.</p>
            </div>
            <div className="faq-item">
              <h4>How often should I get an IV?</h4>
              <p>It depends on your goals. Some patients come weekly during periods of high stress or training. Others come monthly for maintenance. Your provider will recommend a schedule based on your situation.</p>
            </div>
            <div className="faq-item">
              <h4>Does it hurt?</h4>
              <p>The IV insertion feels like a small pinch—similar to a blood draw. Once it's in, most patients don't feel anything. Injections are quick and use a small needle.</p>
            </div>
            <div className="faq-item">
              <h4>Can I just walk in for a shot?</h4>
              <p>For established patients, we can often accommodate same-day injection appointments. Call or text us to check availability.</p>
            </div>
            <div className="faq-item">
              <h4>Why not just take oral supplements?</h4>
              <p>Oral supplements are limited by digestion—you only absorb a fraction of what you take. IV delivers 100% directly to your cells, allowing for therapeutic doses that aren't possible orally.</p>
            </div>
            <div className="faq-item">
              <h4>How much does it cost?</h4>
              <p>Pricing varies based on the treatment. We discuss options during your visit or Range Assessment. HSA and FSA funds are accepted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-step">Step 1</div>
          <h2>Get Your Range Assessment</h2>
          <p>We'll review your labs, symptoms, and goals to recommend the right IV and injection protocol for your situation.</p>
          <Link href="/range-assessment" className="btn-white">Book Your Assessment</Link>
          <p className="cta-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a> to schedule.</p>
        </div>
      </section>
    </Layout>
  );
}
