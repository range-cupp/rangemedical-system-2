import Layout from '../components/Layout';
import Link from 'next/link';

export default function PeptideTherapy() {
  return (
    <Layout 
      title="Peptide Therapy Newport Beach | BPC-157, Thymosin | Range Medical"
      description="Peptide therapy in Newport Beach. BPC-157, Thymosin Beta-4, growth hormone peptides, and more. Labs-first approach with licensed providers. (949) 997-3988."
    >
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Peptide Therapy</span>
          <h1>Targeted Healing at the Cellular Level</h1>
          <p className="hero-sub">Peptides are short chains of amino acids that signal your body to heal, recover, and optimize. We use them to accelerate injury repair, support hormone function, and enhance performance—guided by your goals.</p>
          
          <div className="hero-cta">
            <Link href="/range-assessment" className="btn-primary">Start with a Range Assessment</Link>
            <p className="hero-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a></p>
          </div>
        </div>
      </section>

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

      {/* What Are Peptides */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Science</div>
          <h2 className="section-title">What Are Peptides?</h2>
          <p className="section-subtitle">Peptides are naturally occurring molecules that tell your cells what to do. Therapeutic peptides amplify your body's own healing and optimization signals.</p>
          
          <div className="problem-cards">
            <div className="problem-card">
              <div className="problem-icon">🧬</div>
              <h4>Cellular Messengers</h4>
              <p>Peptides are short amino acid chains—smaller than proteins—that act as signaling molecules. They tell specific cells to activate repair, growth, or other functions.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🎯</div>
              <h4>Targeted Action</h4>
              <p>Unlike broad medications, peptides target specific pathways. BPC-157 promotes gut and tissue healing. Ipamorelin stimulates growth hormone. Each peptide has a focused job.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">⚡</div>
              <h4>Works With Your Body</h4>
              <p>Peptides enhance your body's natural processes rather than overriding them. This means fewer side effects and more sustainable results.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Peptide Categories */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Our Peptide Toolkit</div>
          <h2 className="section-title">Peptides We Use</h2>
          <p className="section-subtitle">We source all peptides from US-licensed compounding pharmacies. Your protocol is selected based on your goals and situation.</p>
          
          <div className="peptide-categories">
            <div className="peptide-category">
              <h3>🩹 Healing & Recovery</h3>
              <div className="peptide-list">
                <div className="peptide-item">
                  <h4>BPC-157</h4>
                  <p>Accelerates healing of tendons, ligaments, muscles, and gut lining. One of the most versatile recovery peptides.</p>
                </div>
                <div className="peptide-item">
                  <h4>Thymosin Beta-4 (TB-500)</h4>
                  <p>Promotes tissue repair, reduces inflammation, and supports recovery from injuries and surgeries.</p>
                </div>
                <div className="peptide-item">
                  <h4>BPC-157 / TB-4 Combination</h4>
                  <p>Synergistic blend for comprehensive healing—often used for stubborn injuries or post-surgical recovery.</p>
                </div>
              </div>
            </div>
            
            <div className="peptide-category">
              <h3>💪 Growth Hormone Support</h3>
              <div className="peptide-list">
                <div className="peptide-item">
                  <h4>CJC-1295 / Ipamorelin</h4>
                  <p>Stimulates natural growth hormone release for improved body composition, recovery, sleep, and anti-aging benefits.</p>
                </div>
                <div className="peptide-item">
                  <h4>Tesamorelin</h4>
                  <p>FDA-approved peptide that reduces visceral fat and supports metabolic health. Often used for body composition goals.</p>
                </div>
                <div className="peptide-item">
                  <h4>Sermorelin</h4>
                  <p>Growth hormone releasing hormone (GHRH) analog that supports natural GH production with a strong safety profile.</p>
                </div>
              </div>
            </div>
            
            <div className="peptide-category">
              <h3>⚡ Performance & Wellness</h3>
              <div className="peptide-list">
                <div className="peptide-item">
                  <h4>MOTS-c</h4>
                  <p>Mitochondrial peptide that enhances metabolic function, exercise capacity, and cellular energy production.</p>
                </div>
                <div className="peptide-item">
                  <h4>PT-141 (Bremelanotide)</h4>
                  <p>Supports sexual health and libido in both men and women by acting on the central nervous system.</p>
                </div>
                <div className="peptide-item">
                  <h4>Thymosin Alpha-1</h4>
                  <p>Immune-modulating peptide that supports immune function and may help with chronic infections or immune deficiencies.</p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="peptide-note">This is not a complete list. Your provider may recommend other peptides based on your specific situation and goals.</p>
        </div>
      </section>

      {/* Who It Helps */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Common Uses</div>
          <h2 className="section-title">Who Benefits from Peptide Therapy?</h2>
          <p className="section-subtitle">Peptides support a wide range of recovery, performance, and optimization goals.</p>
          
          <div className="conditions-grid">
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🏃</span>Athletes & Active People</h4>
                <p>Faster recovery from training and competition, injury prevention, and enhanced performance.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🩹</span>Injury Recovery</h4>
                <p>Accelerate healing of tendons, ligaments, muscles, and joints—whether from sports, accidents, or surgery.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🫃</span>Gut Health Issues</h4>
                <p>BPC-157 supports gut lining repair for conditions like leaky gut, IBS, and inflammatory bowel issues.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">😴</span>Poor Sleep & Low Energy</h4>
                <p>Growth hormone peptides can improve sleep quality, energy levels, and overall recovery.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">⚖️</span>Body Composition Goals</h4>
                <p>Support fat loss and muscle preservation with peptides that optimize growth hormone and metabolism.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">✨</span>Anti-Aging & Longevity</h4>
                <p>Optimize cellular function, support tissue repair, and maintain vitality as you age.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Your Protocol</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Peptide therapy is personalized to your symptoms and goals. Here's how we approach it.</p>
          
          <div className="experience-grid">
            <div className="experience-step">
              <div className="experience-number">1</div>
              <div className="experience-content">
                <h4>Range Assessment</h4>
                <p>Meet with a provider to discuss your goals, symptoms, and situation. We'll determine if peptides are right for you—and which ones make sense.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">2</div>
              <div className="experience-content">
                <h4>Protocol Design</h4>
                <p>Your provider selects the appropriate peptide(s), dosing schedule, and duration based on your specific needs. Most protocols run 4-12 weeks.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">3</div>
              <div className="experience-content">
                <h4>Pharmacy Fulfillment</h4>
                <p>We order your peptides from US-licensed compounding pharmacies. They're shipped directly to you with clear instructions.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">4</div>
              <div className="experience-content">
                <span className="duration">Daily or as prescribed</span>
                <h4>Self-Administration</h4>
                <p>Most peptides are subcutaneous injections (tiny needle, minimal discomfort). We teach you exactly how to do it—it's easier than you think.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">5</div>
              <div className="experience-content">
                <h4>Monitoring & Adjustments</h4>
                <p>We check in regularly to track progress. Protocols are adjusted based on your response.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Timeline */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Timeline</div>
          <h2 className="section-title">When Will I See Results?</h2>
          <p className="section-subtitle">Results vary by peptide and individual, but here's a general timeline.</p>
          
          <div className="protocol-grid">
            <div className="protocol-card">
              <h4>Healing Peptides</h4>
              <p>2-4 weeks</p>
              <span className="protocol-note">BPC-157 and TB-500 often show noticeable improvement within weeks</span>
            </div>
            <div className="protocol-card">
              <h4>GH Peptides</h4>
              <p>4-8 weeks</p>
              <span className="protocol-note">Sleep and recovery improve first; body composition changes take longer</span>
            </div>
            <div className="protocol-card">
              <h4>Full Protocol</h4>
              <p>8-12 weeks</p>
              <span className="protocol-note">Most patients complete a full cycle before assessing overall results</span>
            </div>
          </div>
          
          <p className="protocol-disclaimer">Individual results vary. Your provider will set realistic expectations based on your specific situation.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Questions</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          
          <div className="faq-container">
            <div className="faq-item">
              <h4>Are peptides safe?</h4>
              <p>When prescribed by a licensed provider and sourced from US-licensed pharmacies, peptides have a strong safety profile. We review your health history before recommending any peptide, and we monitor you throughout treatment.</p>
            </div>
            <div className="faq-item">
              <h4>Are peptides legal?</h4>
              <p>Yes. Peptides prescribed by a licensed provider and obtained from a licensed pharmacy are legal. We do not use research-grade or gray-market peptides.</p>
            </div>
            <div className="faq-item">
              <h4>Do I have to inject myself?</h4>
              <p>Most peptides are subcutaneous injections using a tiny insulin needle. It's much easier than it sounds—most patients are comfortable after one or two tries. Some peptides are available as oral or nasal formulations.</p>
            </div>
            <div className="faq-item">
              <h4>Can I combine peptides with other treatments?</h4>
              <p>Absolutely. Peptides often work synergistically with HBOT, red light therapy, hormone optimization, and IV therapy. Your provider will design a protocol that combines the right tools for your goals.</p>
            </div>
            <div className="faq-item">
              <h4>How long do I need to take peptides?</h4>
              <p>Most protocols run 4-12 weeks depending on the peptide and your goals. Some patients do periodic cycles; others use certain peptides ongoing. Your provider will recommend the right approach.</p>
            </div>
            <div className="faq-item">
              <h4>How much does peptide therapy cost?</h4>
              <p>Cost varies based on which peptides you need and the length of your protocol. We discuss pricing after your Range Assessment, when we can recommend the right plan. HSA and FSA funds are accepted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-step">Step 1</div>
          <h2>Get Your Range Assessment</h2>
          <p>Meet with a provider to discuss your goals and situation—then determine if peptide therapy is right for you and which peptides make sense.</p>
          <Link href="/range-assessment" className="btn-white">Book Your Assessment</Link>
          <p className="cta-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a> to discuss peptide options.</p>
        </div>
      </section>
    </Layout>
  );
}
