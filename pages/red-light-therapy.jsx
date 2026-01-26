import Layout from '../components/Layout';
import Link from 'next/link';

export default function RedLightTherapy() {
  return (
    <Layout 
      title="Red Light Therapy Newport Beach | Photobiomodulation | Range Medical"
      description="Red light therapy (photobiomodulation) in Newport Beach. Boost cellular energy, reduce inflammation, and accelerate healing. Start with a Range Assessment. (949) 997-3988."
    >
      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">✓ Licensed Providers</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Red Light Therapy</span>
          <h1>Energize Your Cells. Accelerate Healing.</h1>
          <p className="hero-sub">Red and near-infrared light penetrate deep into your tissues, boosting cellular energy production, reducing inflammation, and supporting everything from skin health to muscle recovery.</p>
          
          <div className="hero-cta">
            <Link href="/range-assessment" className="btn-primary">Start with a Range Assessment</Link>
            <p className="hero-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a></p>
          </div>
        </div>
      </section>

      {/* What Is Red Light */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Science</div>
          <h2 className="section-title">What Is Red Light Therapy?</h2>
          <p className="section-subtitle">Also called photobiomodulation (PBM), red light therapy uses specific wavelengths of light to stimulate your mitochondria—the powerhouses inside every cell.</p>
          
          <div className="problem-cards">
            <div className="problem-card">
              <div className="problem-icon">⚡</div>
              <h4>Cellular Energy Boost</h4>
              <p>Red and near-infrared light (630-850nm) penetrate skin and tissue, stimulating mitochondria to produce more ATP—the energy currency your cells need to repair and function.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🔥</div>
              <h4>Reduced Inflammation</h4>
              <p>Light therapy calms inflammatory pathways, helping with joint pain, muscle soreness, and chronic inflammatory conditions.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🧬</div>
              <h4>Enhanced Recovery</h4>
              <p>Increased blood flow and cellular energy accelerate tissue repair—whether you're recovering from a workout, injury, or surgery.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Benefits</div>
          <h2 className="section-title">What Red Light Therapy Does</h2>
          <p className="section-subtitle">Thousands of studies support red light therapy for a wide range of applications.</p>
          
          <div className="benefits-grid">
            <div className="benefit-card">
              <h4><span>💪</span> Muscle Recovery</h4>
              <p>Reduce delayed onset muscle soreness (DOMS), speed recovery between training sessions, and support muscle repair after injury.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🦴</span> Joint & Pain Relief</h4>
              <p>Decrease inflammation in joints, tendons, and connective tissue. Helpful for arthritis, tendinitis, and chronic pain conditions.</p>
            </div>
            <div className="benefit-card">
              <h4><span>✨</span> Skin Health</h4>
              <p>Stimulate collagen production, reduce fine lines, improve skin tone, and accelerate wound healing.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🧠</span> Brain & Mood</h4>
              <p>Near-infrared light penetrates the skull, potentially supporting cognitive function, mood, and recovery from brain injuries.</p>
            </div>
            <div className="benefit-card">
              <h4><span>😴</span> Sleep & Circadian Rhythm</h4>
              <p>Red light exposure (especially in evening) can support healthy melatonin production and improve sleep quality.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🔋</span> Energy & Vitality</h4>
              <p>By boosting mitochondrial function throughout your body, many patients report improved overall energy and reduced fatigue.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It Helps */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Common Uses</div>
          <h2 className="section-title">Who Benefits from Red Light Therapy?</h2>
          <p className="section-subtitle">Red light therapy supports a wide range of health and performance goals.</p>
          
          <div className="conditions-grid">
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🏃</span>Athletes</h4>
                <p>Faster recovery, reduced soreness, improved performance, and injury prevention.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🩹</span>Post-Surgery Patients</h4>
                <p>Accelerate healing, reduce scarring, and support tissue repair after procedures.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">😓</span>Chronic Pain Sufferers</h4>
                <p>Natural inflammation reduction for arthritis, fibromyalgia, and persistent pain conditions.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">✨</span>Skin & Anti-Aging</h4>
                <p>Boost collagen, improve skin texture, reduce wrinkles, and heal acne or scars.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🧠</span>Brain Health</h4>
                <p>Support cognitive function, mood regulation, and recovery from concussion or TBI.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">⚡</span>Optimization Seekers</h4>
                <p>General wellness, energy enhancement, and longevity-focused protocols.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Your Session</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Red light therapy sessions are simple, relaxing, and fit easily into your routine.</p>
          
          <div className="experience-grid">
            <div className="experience-step">
              <div className="experience-number">1</div>
              <div className="experience-content">
                <h4>Prepare</h4>
                <p>Remove clothing from the areas you want to treat. For full-body benefits, most patients wear minimal clothing. Eye protection is provided.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">2</div>
              <div className="experience-content">
                <h4>Position</h4>
                <p>Stand or sit in front of our medical-grade panel array. The lights should be 6-12 inches from your skin for optimal penetration.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">3</div>
              <div className="experience-content">
                <span className="duration">10-20 minutes</span>
                <h4>Relax & Absorb</h4>
                <p>The session is completely painless—you'll feel gentle warmth. Many patients find it meditative. Treat front and back for full coverage.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">4</div>
              <div className="experience-content">
                <h4>Resume Your Day</h4>
                <p>No downtime required. You can work out, shower, or continue your normal activities immediately after.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Info */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Your Protocol</div>
          <h2 className="section-title">How Often Should I Do Red Light?</h2>
          <p className="section-subtitle">Consistency matters more than duration. Your provider will recommend a protocol based on your goals.</p>
          
          <div className="protocol-grid">
            <div className="protocol-card">
              <h4>Recovery & Healing</h4>
              <p>Daily or every other day</p>
              <span className="protocol-note">3-5x per week during acute injury or post-surgery</span>
            </div>
            <div className="protocol-card">
              <h4>Skin & Anti-Aging</h4>
              <p>3-5 sessions per week</p>
              <span className="protocol-note">Consistent exposure for collagen stimulation</span>
            </div>
            <div className="protocol-card">
              <h4>Maintenance / Wellness</h4>
              <p>2-3 sessions per week</p>
              <span className="protocol-note">Ongoing support for energy and general health</span>
            </div>
          </div>
          
          <p className="protocol-disclaimer">Red light therapy pairs well with HBOT, peptides, and IV therapy. Your protocol is personalized based on your Range Assessment.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Questions</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          
          <div className="faq-container">
            <div className="faq-item">
              <h4>Is red light therapy safe?</h4>
              <p>Yes. Red light therapy is non-invasive, painless, and has no known serious side effects when used as directed. It doesn't damage skin or cause burns like UV light. Eye protection is provided during sessions.</p>
            </div>
            <div className="faq-item">
              <h4>How is this different from a tanning bed?</h4>
              <p>Completely different. Tanning beds use UV light, which damages skin and increases cancer risk. Red light therapy uses visible red and near-infrared wavelengths that heal and energize cells without UV exposure.</p>
            </div>
            <div className="faq-item">
              <h4>How soon will I see results?</h4>
              <p>Some benefits (like reduced soreness) can be felt after one session. Skin improvements typically emerge after 4-8 weeks of consistent use. Chronic conditions may take longer.</p>
            </div>
            <div className="faq-item">
              <h4>Can I do red light therapy at home?</h4>
              <p>Consumer devices exist, but most lack the power density (irradiance) of medical-grade panels. Our equipment delivers therapeutic doses in less time with better coverage.</p>
            </div>
            <div className="faq-item">
              <h4>Can I combine it with other treatments?</h4>
              <p>Absolutely. Red light therapy enhances the effects of HBOT, peptide therapy, and other recovery tools. Many patients stack treatments in a single visit.</p>
            </div>
            <div className="faq-item">
              <h4>How much does it cost?</h4>
              <p>Pricing depends on your protocol and whether you're combining with other therapies. We discuss options after your Range Assessment. HSA and FSA funds are accepted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-step">Step 1</div>
          <h2>Get Your Range Assessment</h2>
          <p>Meet with a provider to discuss your goals and build a personalized protocol—including whether red light therapy is right for you.</p>
          <Link href="/range-assessment" className="btn-white">Book Your Assessment</Link>
          <p className="cta-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a> to schedule your next session.</p>
        </div>
      </section>
    </Layout>
  );
}
