import Layout from '../components/Layout';
import Link from 'next/link';

export default function InjuryRecovery() {
  return (
    <Layout 
      title="Injury & Recovery Support Newport Beach | Peptides, PRP, IVs | Range Medical"
      description="Recovering from injury or surgery? Range Medical offers peptide therapy, PRP, and IV support to help you heal faster. No labs required to start. Newport Beach, CA. (949) 997-3988."
    >
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">No Labs Required to Start</span>
          <h1>Recover Stronger While You Heal</h1>
          <p className="hero-sub">Already working with a chiropractor, PT, or surgeon? Our medical team can evaluate whether peptide therapies, PRP, IVs, or other tools can help support your recovery.</p>
          
          <div className="hero-cta">
            <Link href="/range-assessment" className="btn-primary">Book Recovery Assessment</Link>
            <p className="hero-secondary">Prefer to call? <a href="tel:+19499973988">(949) 997-3988</a></p>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">✓ Licensed Providers</span>
          <span className="trust-item">✓ No Labs Required</span>
          <span className="trust-item">✓ Works With Your Current Care</span>
          <span className="trust-item">✓ Short Protocols Available</span>
        </div>
      </div>

      {/* Who It's For */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Who This Is For</div>
          <h2 className="section-title">You Might Be a Good Fit If...</h2>
          <p className="section-subtitle">This path is designed for people actively dealing with an injury or recovering from a procedure.</p>
          
          <div className="conditions-grid">
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🏥</span>Post-Surgery</h4>
                <p>You just had a procedure and want to support your body's healing process during the critical recovery window.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🦵</span>Chronic Pain</h4>
                <p>A nagging tendon, joint, or muscle issue that won't fully resolve despite other treatments.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">⚡</span>New Injury</h4>
                <p>Something just happened and you want to get ahead of it fast before it becomes a bigger problem.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🏃</span>Getting Back to Activity</h4>
                <p>You're an athlete or active person who can't afford extended downtime and needs to recover quickly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Our Toolkit</div>
          <h2 className="section-title">Tools to Support Recovery</h2>
          <p className="section-subtitle">We use peptides, PRP, IVs, and other tools to support tissue repair, reduce inflammation, and accelerate healing.</p>
          
          <div className="problem-cards">
            <div className="problem-card">
              <div className="problem-icon">🧬</div>
              <h4>Peptide Protocols</h4>
              <p>Short-term protocols using peptides like BPC-157 and Thymosin Beta-4 to support tissue repair and reduce inflammation.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">💉</div>
              <h4>PRP Therapy</h4>
              <p>Your own concentrated platelets reinjected to support healing in joints, tendons, and soft tissue.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">💧</div>
              <h4>IV Support</h4>
              <p>Vitamins, minerals, and amino acids delivered directly to support recovery and reduce downtime.</p>
            </div>
          </div>
          
          <div className="additional-tools">
            <p>We may also recommend <Link href="/hyperbaric-oxygen-therapy">hyperbaric oxygen therapy</Link>, <Link href="/red-light-therapy">red light therapy</Link>, or other treatments depending on your situation.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">The Process</div>
          <h2 className="section-title">How Recovery Support Works</h2>
          <p className="section-subtitle">A simple path from evaluation to active recovery support.</p>
          
          <div className="experience-grid">
            <div className="experience-step">
              <div className="experience-number">1</div>
              <div className="experience-content">
                <span className="duration">20-30 minutes</span>
                <h4>Recovery Assessment</h4>
                <p>Meet with a provider who reviews your injury history, current treatment, and goals. No labs required. We determine if and how we can help, and explain your options clearly.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">2</div>
              <div className="experience-content">
                <h4>Get Your Protocol</h4>
                <p>Based on your assessment, your provider recommends a recovery protocol—whether that's a short 10-day jumpstart for acute issues or a longer program for chronic problems.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">3</div>
              <div className="experience-content">
                <h4>Start Treatment</h4>
                <p>Most peptide protocols involve simple self-injections at home. We teach you exactly how to do it. PRP and IVs are done at our office.</p>
              </div>
            </div>
            <div className="experience-step">
              <div className="experience-number">4</div>
              <div className="experience-content">
                <h4>Monitor & Adjust</h4>
                <p>We check in regularly to track your progress. If something needs adjustment, we adapt your protocol. The goal is to get you back to full activity as quickly as possible.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Options */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Protocol Options</div>
          <h2 className="section-title">Recovery Programs</h2>
          <p className="section-subtitle">We offer flexible options based on your injury and recovery timeline.</p>
          
          <div className="protocol-options-grid">
            <div className="protocol-option">
              <h3>Recovery Jumpstart</h3>
              <p className="protocol-duration">10-day protocol</p>
              <p className="protocol-desc">For acute flare-ups or post-op support. A short, focused peptide protocol designed to get you through the critical early phase of healing.</p>
              <ul>
                <li>10-day peptide protocol</li>
                <li>All supplies included</li>
                <li>Provider guidance</li>
                <li>Best for: acute injuries, post-surgery</li>
              </ul>
            </div>
            <div className="protocol-option featured">
              <div className="protocol-badge">Most Comprehensive</div>
              <h3>Recovery Month</h3>
              <p className="protocol-duration">30-day program</p>
              <p className="protocol-desc">For longer recoveries or chronic issues. Includes a full month of peptide support, provider check-ins, and adjustments based on your progress.</p>
              <ul>
                <li>Full month of peptide support</li>
                <li>Regular provider check-ins</li>
                <li>Adjustments based on progress</li>
                <li>Best for: chronic issues, complex injuries</li>
              </ul>
            </div>
            <div className="protocol-option">
              <h3>Add-On Therapies</h3>
              <p className="protocol-duration">As needed</p>
              <p className="protocol-desc">Enhance your recovery with complementary treatments that work synergistically with your peptide protocol.</p>
              <ul>
                <li>PRP injections</li>
                <li>Hyperbaric oxygen sessions</li>
                <li>Red light therapy</li>
                <li>IV nutrient support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Works Alongside */}
      <section className="section section-gray">
        <div className="container">
          <div className="works-alongside">
            <div className="works-alongside-content">
              <div className="section-kicker">Important Note</div>
              <h2>We Work Alongside Your Current Care Team</h2>
              <p>Recovery support at Range Medical is designed to complement—not replace—your existing treatment. If you're seeing a chiropractor, physical therapist, orthopedic surgeon, or other provider, we work with them, not instead of them.</p>
              <p>Think of us as an additional tool in your recovery toolkit. We focus on the cellular and systemic support that can help your body heal faster while your other providers handle the structural and rehabilitative work.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Questions</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          
          <div className="faq-container">
            <div className="faq-item">
              <h4>Does this replace my chiropractor or physical therapist?</h4>
              <p>No. We work alongside your existing care team, not instead of them. Think of us as an additional tool to support your recovery—we're not replacing the structural work your chiro or PT does.</p>
            </div>
            <div className="faq-item">
              <h4>Do I need labs for recovery support?</h4>
              <p>Usually no. Most recovery protocols don't require bloodwork. If your provider thinks labs would be helpful for your specific situation, they'll recommend it—but it's not a default requirement.</p>
            </div>
            <div className="faq-item">
              <h4>How soon can I expect to see results?</h4>
              <p>It depends on your injury and protocol. Some patients notice improvement within the first week or two. Others take longer. Your provider will set realistic expectations based on your specific situation.</p>
            </div>
            <div className="faq-item">
              <h4>What if I'm not sure this is right for me?</h4>
              <p>That's exactly what the assessment is for. We'll evaluate your situation and give you an honest answer about whether we think we can help. No pressure to start anything.</p>
            </div>
            <div className="faq-item">
              <h4>Can I combine this with hormone therapy or weight loss?</h4>
              <p>Yes. If you're interested in our optimization services (hormones, weight loss, longevity), we can discuss that too. Those programs require labs. Many patients do both.</p>
            </div>
            <div className="faq-item">
              <h4>Do you accept insurance?</h4>
              <p>We're a cash-pay clinic and don't bill insurance directly. We can provide documentation for you to submit for potential reimbursement. Many patients use HSA or FSA funds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to Support Your Recovery?</h2>
          <p>Book a Recovery Assessment and we'll evaluate whether our tools can help you heal faster.</p>
          <div className="cta-buttons">
            <Link href="/range-assessment" className="btn-white">Book Recovery Assessment</Link>
            <a href="tel:+19499973988" className="btn-outline-white">Call (949) 997-3988</a>
          </div>
          <p className="cta-location">📍 1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>
    </Layout>
  );
}
