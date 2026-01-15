import Layout from '../components/Layout';
import Link from 'next/link';

export default function HyperbaricOxygenTherapy() {
  return (
    <Layout 
      title="Hyperbaric Oxygen Therapy Newport Beach | HBOT | Range Medical"
      description="Hyperbaric oxygen therapy (HBOT) in Newport Beach. Accelerate healing, reduce inflammation, and boost recovery. Start with a Range Assessment. (949) 997-3988."
    >
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Hyperbaric Oxygen Therapy</span>
          <h1>Heal Faster. Recover Stronger.</h1>
          <p className="hero-sub">Hyperbaric oxygen therapy floods your body with pure oxygen under pressure—accelerating healing, reducing inflammation, and helping you recover from injuries, surgery, and chronic conditions.</p>
          
          <div className="hero-cta">
            <Link href="/range-assessment" className="btn-primary">Start with a Range Assessment</Link>
            <p className="hero-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a></p>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">✓ Medical-Grade Chamber</span>
          <span className="trust-item">✓ Licensed Providers</span>
          <span className="trust-item">✓ Personalized Protocols</span>
          <span className="trust-item">✓ Newport Beach Location</span>
        </div>
      </div>

      {/* What Is HBOT */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Science</div>
          <h2 className="section-title">What Is Hyperbaric Oxygen Therapy?</h2>
          <p className="section-subtitle">HBOT delivers 100% oxygen at increased atmospheric pressure, allowing your blood to carry 10-15x more oxygen to tissues throughout your body.</p>
          
          <div className="problem-cards">
            <div className="problem-card">
              <div className="problem-icon">🫁</div>
              <h4>Oxygen Under Pressure</h4>
              <p>You breathe pure oxygen inside a pressurized chamber. The pressure forces oxygen deep into plasma, tissues, and areas with poor circulation.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🩹</div>
              <h4>Accelerated Healing</h4>
              <p>Extra oxygen supercharges your body's natural repair processes—stimulating new blood vessel growth, reducing swelling, and fighting infection.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🔥</div>
              <h4>Reduced Inflammation</h4>
              <p>HBOT calms inflammatory responses at the cellular level, helping with everything from sports injuries to chronic conditions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It Helps */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Common Uses</div>
          <h2 className="section-title">Who Benefits from HBOT?</h2>
          <p className="section-subtitle">Hyperbaric oxygen therapy supports a wide range of recovery and optimization goals.</p>
          
          <div className="conditions-grid">
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🏃</span>Athletes & Active People</h4>
                <p>Faster recovery from training, reduced muscle soreness, quicker return from sprains and strains.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🩹</span>Post-Surgery Recovery</h4>
                <p>Accelerate healing after orthopedic surgery, cosmetic procedures, or any operation requiring tissue repair.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🧠</span>Concussion & TBI</h4>
                <p>Support brain healing and cognitive recovery after head injuries or traumatic brain injury.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">💪</span>Chronic Pain</h4>
                <p>Reduce inflammation and promote healing in conditions like fibromyalgia, arthritis, and chronic fatigue.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🩸</span>Wound Healing</h4>
                <p>Diabetic ulcers, non-healing wounds, and radiation injuries respond well to increased oxygen delivery.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">✨</span>Longevity & Optimization</h4>
                <p>Some patients use HBOT as part of an anti-aging or performance optimization protocol.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Your Session</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Each HBOT session is comfortable, relaxing, and designed to maximize your results.</p>
          
          <div className="experience-grid">
            <div className="experience-step">
              <div className="experience-number">1</div>
              <div className="experience-content">
                <h4>Arrive & Get Comfortable</h4>
                <p>You'll change into comfortable clothing (we provide scrubs). No jewelry, electronics, or lotions allowed in the chamber.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">2</div>
              <div className="experience-content">
                <h4>Enter the Chamber</h4>
                <p>Our medical-grade chamber is spacious enough to sit or recline. You can read, listen to music, or simply relax.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">3</div>
              <div className="experience-content">
                <span className="duration">10-15 minutes</span>
                <h4>Pressurization</h4>
                <p>The chamber slowly pressurizes. You may feel pressure in your ears—like during airplane descent. We'll teach you how to equalize.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">4</div>
              <div className="experience-content">
                <span className="duration">60-90 minutes</span>
                <h4>Treatment</h4>
                <p>Once at pressure, you breathe normally while oxygen saturates your tissues. Most patients find this deeply relaxing.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">5</div>
              <div className="experience-content">
                <span className="duration">10-15 minutes</span>
                <h4>Depressurization & Exit</h4>
                <p>The chamber slowly returns to normal pressure. You can return to normal activities immediately afterward.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Info */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Your Protocol</div>
          <h2 className="section-title">How Many Sessions Do I Need?</h2>
          <p className="section-subtitle">Results depend on your condition and goals. Your provider will recommend a protocol after your assessment.</p>
          
          <div className="protocol-grid">
            <div className="protocol-card">
              <h4>Acute Injury / Surgery</h4>
              <p>10-20 sessions over 2-4 weeks</p>
              <span className="protocol-note">Accelerate healing during critical recovery window</span>
            </div>
            <div className="protocol-card">
              <h4>Chronic Conditions</h4>
              <p>20-40 sessions over 4-8 weeks</p>
              <span className="protocol-note">Longer protocols for deeper, lasting changes</span>
            </div>
            <div className="protocol-card">
              <h4>Maintenance / Optimization</h4>
              <p>1-4 sessions per month</p>
              <span className="protocol-note">Ongoing support for performance and longevity</span>
            </div>
          </div>
          
          <p className="protocol-disclaimer">Your protocol is personalized based on your Range Assessment results. We don't do one-size-fits-all.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Questions</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          
          <div className="faq-container">
            <div className="faq-item">
              <h4>Is HBOT safe?</h4>
              <p>Yes. HBOT has been used safely for decades and is FDA-approved for many conditions. Side effects are rare and typically mild—most commonly temporary ear pressure. Our staff monitors you throughout each session.</p>
            </div>
            <div className="faq-item">
              <h4>Will I feel claustrophobic?</h4>
              <p>Our chamber is larger than many clinical units—you can sit up, move around, and see out. Most patients find it surprisingly comfortable. If you're concerned, let us know and we'll take extra time to help you acclimate.</p>
            </div>
            <div className="faq-item">
              <h4>How soon will I see results?</h4>
              <p>Some patients notice improvements after just a few sessions—reduced swelling, better energy, faster healing. For chronic conditions, meaningful changes typically emerge after 10-20 sessions.</p>
            </div>
            <div className="faq-item">
              <h4>Can I combine HBOT with other treatments?</h4>
              <p>Absolutely. HBOT pairs well with peptide therapy, red light therapy, IV nutrients, and other recovery tools. Your provider will design a protocol that combines the right therapies for your goals.</p>
            </div>
            <div className="faq-item">
              <h4>What should I wear?</h4>
              <p>We provide comfortable scrubs. You'll need to remove jewelry, watches, and electronics. No lotions, perfumes, or hair products before your session.</p>
            </div>
            <div className="faq-item">
              <h4>How much does it cost?</h4>
              <p>Pricing depends on your protocol length and goals. We discuss options after your Range Assessment, when we can recommend the right plan for your situation. HSA and FSA funds are accepted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-step">Step 1</div>
          <h2>Get Your Range Assessment</h2>
          <p>We'll review your labs, symptoms, and goals to build a personalized protocol—including whether hyperbaric oxygen therapy is right for you.</p>
          <Link href="/range-assessment" className="btn-white">Book Your Assessment</Link>
          <p className="cta-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a> to schedule your next session.</p>
        </div>
      </section>
    </Layout>
  );
}
