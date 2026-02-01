import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function RangeAssessmentPage() {
  return (
    <Layout
      title="Range Assessment | Energy & Optimization | Range Medical Newport Beach"
      description="The Range Assessment is a 20-30 minute visit to understand your symptoms and build a clear plan. $199, credited toward any program. Newport Beach."
    >
      <Head>
        <meta name="keywords" content="Range Assessment, wellness consultation, energy optimization, hormone testing, fatigue treatment, brain fog help, Newport Beach, Costa Mesa" />
        <link rel="canonical" href="https://www.range-medical.com/range-assessment" />
        <meta property="og:title" content="Range Assessment | Energy & Optimization | Range Medical" />
        <meta property="og:description" content="The Range Assessment is a 20-30 minute visit to understand your symptoms and build a clear plan. $199, credited toward any program." />
        <meta property="og:url" content="https://www.range-medical.com/range-assessment" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Range Medical - Range Assessment",
              "description": "Energy and optimization assessment at Range Medical",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "1901 Westcliff Dr. Suite 10",
                "addressLocality": "Newport Beach",
                "addressRegion": "CA",
                "postalCode": "92660"
              },
              "telephone": "(949) 997-3988"
            })
          }}
        />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">✓ $199 Credited Toward Treatment</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Energy & Optimization</span>
          <h1>The Range Assessment</h1>
          <p className="hero-sub">
            A real conversation with a provider who listens. Understand what's going on, 
            connect your symptoms to a plan, and leave with clear next steps.
          </p>
          <div className="hero-cta">
            <Link href="/book" className="btn-primary">Book Your Assessment — $199</Link>
            <p className="hero-secondary">
              20–30 minutes · Credited toward any program
            </p>
          </div>
        </div>
      </section>

      {/* Is This You? */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Is This You?</div>
          <h2 className="section-title">Who This Is For</h2>
          <p className="section-subtitle">
            If any of these sound familiar, the Range Assessment is a good place to start.
          </p>
          
          <div className="symptoms-cards">
            <div className="symptom-card">
              <span className="symptom-icon">😴</span>
              <h4>Tired Despite "Normal" Labs</h4>
              <p>You feel exhausted even though your regular doctor said everything looks fine.</p>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">☕</span>
              <h4>Running on Caffeine</h4>
              <p>You rely on coffee or energy drinks just to get through your day.</p>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">🧠</span>
              <h4>Brain Fog & Focus Issues</h4>
              <p>Your sleep, mood, or focus is off and you can't figure out why.</p>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">📋</span>
              <h4>Want a Real Plan</h4>
              <p>You want a long-term approach to hormones, weight, or longevity — not guesswork.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What Happens */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Your Visit</div>
          <h2 className="section-title">What Happens During Your Assessment</h2>
          <p className="section-subtitle">
            A real conversation with a provider who listens, not a rushed 10-minute appointment.
          </p>
          
          <div className="visit-steps">
            <div className="visit-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Review Your History</h4>
                <p>We go through your symptoms, health history, and what you've already tried. Bring any recent labs if you have them.</p>
              </div>
            </div>
            <div className="visit-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Discuss Your Goals</h4>
                <p>What does "feeling better" actually mean for you? Energy? Sleep? Focus? Weight? We want to understand the full picture.</p>
              </div>
            </div>
            <div className="visit-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Explain Your Options</h4>
                <p>Based on what we learn, we'll explain what might help and why. Labs if they'd be useful. Programs tailored to your situation.</p>
              </div>
            </div>
            <div className="visit-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Build Your Plan</h4>
                <p>You'll leave with clear next steps — not a "wait and see" answer. Your $199 is credited toward any program you choose.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">What's Included</div>
          <h2 className="section-title">Your Assessment Includes</h2>
          
          <div className="included-box">
            <div className="included-price-section">
              <div className="included-price">$199</div>
              <div className="included-duration">20–30 minute visit</div>
              <div className="included-credit">✓ Credited toward any program</div>
            </div>
            <div className="included-list-section">
              <ul className="included-list">
                <li>One-on-one consultation with a provider</li>
                <li>Full review of symptoms and history</li>
                <li>Discussion of your health goals</li>
                <li>Personalized recommendations</li>
                <li>Clear next steps before you leave</li>
                <li>Lab recommendations when helpful (labs separate)</li>
              </ul>
            </div>
          </div>
          
          <p className="included-note">
            <strong>Note:</strong> This is a consultation to understand your situation and build a plan. 
            Labs and treatments are separate if recommended — but the $199 is always credited.
          </p>
        </div>
      </section>

      {/* Tools Section */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">What Might Come Next</div>
          <h2 className="section-title">Tools We May Recommend</h2>
          <p className="section-subtitle">
            Depending on what we find, your provider may recommend one or more of these. 
            You don't have to figure it out yourself.
          </p>
          
          <div className="tools-grid">
            <Link href="/hormone-optimization" className="tool-card">
              <h4>Hormone Optimization</h4>
              <p>Balanced hormones for energy, mood, and how you feel every day.</p>
            </Link>
            <Link href="/weight-loss" className="tool-card">
              <h4>Medical Weight Loss</h4>
              <p>Medical support for weight, appetite, and metabolism.</p>
            </Link>
            <Link href="/peptide-therapy" className="tool-card">
              <h4>Peptide Therapy</h4>
              <p>Targeted peptides for recovery, energy, and longevity.</p>
            </Link>
            <Link href="/iv-therapy" className="tool-card">
              <h4>IV Therapy</h4>
              <p>Vitamins and nutrients delivered directly to your bloodstream.</p>
            </Link>
            <Link href="/hyperbaric-oxygen-therapy" className="tool-card">
              <h4>Hyperbaric Oxygen</h4>
              <p>More oxygen to your cells to support healing and clarity.</p>
            </Link>
            <Link href="/lab-panels" className="tool-card">
              <h4>Labs & Testing</h4>
              <p>Comprehensive panels that go beyond standard bloodwork.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Results</div>
          <h2 className="section-title">What Our Patients Say</h2>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <blockquote>
                "I was skeptical, but after the Assessment I finally understood why I'd been so tired. 
                Six weeks later I feel like myself again."
              </blockquote>
              <cite>— Sarah M., Newport Beach</cite>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <blockquote>
                "No pushy sales, just real conversation. They helped me connect the dots between my 
                symptoms and gave me a clear plan."
              </blockquote>
              <cite>— Michael R., Costa Mesa</cite>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <blockquote>
                "The team takes time to actually listen. This is what healthcare should feel like."
              </blockquote>
              <cite>— Jennifer K., Irvine</cite>
            </div>
          </div>
          
          <div className="testimonials-cta">
            <Link href="/reviews">Read More Reviews →</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Questions</div>
          <h2 className="section-title">Common Questions</h2>
          
          <div className="faq-container">
            <div className="faq-item">
              <h4>Do I need labs before my Assessment?</h4>
              <p>No. Bring them if you have recent ones, but we can discuss whether labs would help during your visit.</p>
            </div>
            <div className="faq-item">
              <h4>What's the difference between this and Injury Recovery?</h4>
              <p>Injury Recovery focuses on healing a specific injury faster. This Assessment is for energy, hormones, weight, and overall optimization.</p>
            </div>
            <div className="faq-item">
              <h4>How does the $199 credit work?</h4>
              <p>Your Assessment fee is credited toward any program you start within 30 days — labs, peptides, hormones, whatever makes sense for you.</p>
            </div>
            <div className="faq-item">
              <h4>What if I'm not sure which Assessment I need?</h4>
              <p>Book whichever feels closest to your main concern. Your provider can always adjust the conversation based on what you share.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">Next Step</span>
          <h2>Ready to Understand What's Going On?</h2>
          <p>Book your Range Assessment. One visit to connect your symptoms to a plan.</p>
          <Link href="/book" className="btn-white">Book Your Assessment — $199</Link>
          <p className="cta-location">
            Range Medical • 1901 Westcliff Dr, Newport Beach<br />
            <a href="tel:9499973988">(949) 997-3988</a>
          </p>
        </div>
      </section>

      <style jsx>{`
        /* Symptoms Cards */
        .symptoms-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .symptom-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
          transition: all 0.2s;
        }

        .symptom-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .symptom-icon {
          font-size: 1.75rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        .symptom-card h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .symptom-card p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
          line-height: 1.6;
        }

        /* Visit Steps */
        .visit-steps {
          max-width: 700px;
          margin: 0 auto;
        }

        .visit-step {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem 0;
          border-bottom: 1px solid #e5e5e5;
        }

        .visit-step:last-child {
          border-bottom: none;
        }

        .step-number {
          width: 48px;
          height: 48px;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
          flex-shrink: 0;
        }

        .step-content h4 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .step-content p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
          line-height: 1.6;
        }

        /* Included Box */
        .included-box {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          background: #ffffff;
          border: 2px solid #000000;
          border-radius: 16px;
          padding: 2.5rem;
          max-width: 800px;
          margin: 0 auto 1.5rem;
        }

        .included-price-section {
          text-align: center;
          padding-right: 2rem;
          border-right: 1px solid #e5e5e5;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .included-price {
          font-size: 3rem;
          font-weight: 700;
          color: #171717;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .included-duration {
          font-size: 1rem;
          color: #737373;
          margin-bottom: 1rem;
        }

        .included-credit {
          display: inline-block;
          background: #ecfdf5;
          border: 1px solid #6ee7b7;
          color: #065f46;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .included-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .included-list li {
          position: relative;
          padding-left: 1.5rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          font-size: 0.9375rem;
          color: #404040;
          border-bottom: 1px solid #f5f5f5;
        }

        .included-list li:last-child {
          border-bottom: none;
        }

        .included-list li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #000000;
          font-weight: 700;
        }

        .included-note {
          text-align: center;
          font-size: 0.875rem;
          color: #737373;
          max-width: 600px;
          margin: 0 auto;
        }

        .included-note strong {
          color: #525252;
        }

        /* Tools Grid */
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .tool-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-decoration: none;
          transition: all 0.2s;
        }

        .tool-card:hover {
          border-color: #000000;
          transform: translateY(-2px);
        }

        .tool-card h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .tool-card p {
          font-size: 0.875rem;
          color: #525252;
          margin: 0;
          line-height: 1.6;
        }

        /* Testimonials Grid */
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          max-width: 1000px;
          margin: 0 auto 2rem;
        }

        .testimonial-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
        }

        .testimonial-stars {
          color: #000000;
          font-size: 1rem;
          letter-spacing: 2px;
          margin-bottom: 0.75rem;
        }

        .testimonial-card blockquote {
          font-size: 0.9375rem;
          color: #404040;
          line-height: 1.7;
          margin: 0 0 1rem 0;
          font-style: normal;
        }

        .testimonial-card cite {
          font-size: 0.875rem;
          font-weight: 600;
          color: #171717;
          font-style: normal;
        }

        .testimonials-cta {
          text-align: center;
        }

        .testimonials-cta a {
          color: #171717;
          font-weight: 600;
          text-decoration: none;
        }

        .testimonials-cta a:hover {
          text-decoration: underline;
        }

        /* FAQ */
        .faq-container {
          max-width: 700px;
          margin: 0 auto;
        }

        .faq-item {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .faq-item h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .faq-item p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
          line-height: 1.6;
        }

        /* CTA Location Link */
        .cta-location a {
          color: #ffffff;
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .symptoms-cards {
            grid-template-columns: 1fr;
          }

          .tools-grid {
            grid-template-columns: 1fr;
          }

          .testimonials-grid {
            grid-template-columns: 1fr;
          }

          .included-box {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .included-price-section {
            padding-right: 0;
            border-right: none;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid #e5e5e5;
          }
        }

        @media (max-width: 640px) {
          .visit-step {
            flex-direction: column;
            text-align: center;
          }

          .step-number {
            margin: 0 auto 1rem;
          }

          .included-box {
            padding: 1.5rem;
          }

          .included-price {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
