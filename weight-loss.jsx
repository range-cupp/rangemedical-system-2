import Layout from '../components/Layout';
import Link from 'next/link';

export default function WeightLoss() {
  return (
    <Layout 
      title="Medical Weight Loss Newport Beach | Tirzepatide & Semaglutide | Range Medical"
      description="Medical weight loss with tirzepatide and semaglutide in Newport Beach. Labs first, licensed providers, ongoing monitoring. GLP-1 therapy done right. (949) 997-3988."
    >
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Medical Weight Loss</span>
          <h1>Stuck at the Same Weight No Matter What You Try?</h1>
          <p className="hero-sub">We start with labs and a real medical plan—not random shots. Tirzepatide and retatrutide work better when your provider knows what's actually going on inside.</p>
          
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
          <span className="trust-item">✓ Labs Required First</span>
          <span className="trust-item">✓ US Pharmacies Only</span>
          <span className="trust-item">✓ Ongoing Monitoring</span>
        </div>
      </div>

      {/* Pain Points */}
      <section className="section">
        <div className="container">
          <div className="pain-points">
            <h3>Sound familiar?</h3>
            <ul>
              <li>You eat well and exercise—but the scale won't budge.</li>
              <li>You've tried every diet. Lose 10 lbs, regain 15. Repeat.</li>
              <li>Your clothes are getting tighter even when the number barely moves.</li>
              <li>Cravings take over no matter how hard you try to resist.</li>
              <li>You're exhausted and frustrated—wondering if something deeper is off.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">The Problem</div>
          <h2 className="section-title">Why Normal Diets Stop Working</h2>
          <p className="section-subtitle">It's not about willpower. Your body is fighting you—and there's a reason.</p>
          
          <div className="problem-cards">
            <div className="problem-card">
              <div className="problem-icon">🔥</div>
              <h4>Metabolism Slows Down</h4>
              <p>Years of dieting tell your body to hold onto fat. It thinks you're starving—so it burns less and stores more.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">⚖️</div>
              <h4>Hormones Get in the Way</h4>
              <p>Insulin, cortisol, thyroid, and hunger hormones can all block weight loss—even when you're doing everything "right."</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🧠</div>
              <h4>Cravings Aren't Your Fault</h4>
              <p>Your brain sends hunger signals that feel impossible to ignore. It's biology, not a lack of discipline.</p>
            </div>
          </div>
          
          <div className="comparison">
            <div className="comparison-col">
              <h4>Generic Weight Loss Clinics</h4>
              <ul>
                <li>Quick scripts with no lab work</li>
                <li>Same dose for everyone</li>
                <li>"Here's your shot, good luck"</li>
                <li>No follow-up or monitoring</li>
                <li>No idea if hormones are part of the problem</li>
              </ul>
            </div>
            <div className="comparison-col range">
              <h4>Range Medical</h4>
              <ul>
                <li>Labs first to see the full picture</li>
                <li>Dosing based on YOUR body</li>
                <li>1:1 provider review before you start</li>
                <li>Ongoing check-ins and adjustments</li>
                <li>Hormones, thyroid, and metabolism all checked</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Approach</div>
          <h2 className="section-title">Why GLP-1s Work Better with Labs</h2>
          <p className="section-subtitle">The medication helps. But knowing what's going on inside makes it safer and more effective.</p>
          
          <div className="benefits-grid">
            <div className="benefit-card">
              <h4><span>🎯</span> Right Dose for Your Body</h4>
              <p>Your metabolism isn't the same as everyone else's. We adjust dosing based on your labs, not a one-size-fits-all protocol.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🔬</span> Catch What Else Is Off</h4>
              <p>Thyroid issues? Insulin resistance? Hormone imbalance? We check for factors that could slow your progress—or explain why past attempts failed.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🛡️</span> Safer with Monitoring</h4>
              <p>GLP-1s are powerful. We track your labs over time to make sure everything stays in a healthy range as your body changes.</p>
            </div>
            <div className="benefit-card">
              <h4><span>📈</span> Better Long-Term Results</h4>
              <p>When we address the root causes—not just suppress appetite—you're more likely to keep the weight off after you stop.</p>
            </div>
          </div>
          
          <p className="meds-note"><strong>We use tirzepatide and retatrutide</strong>—the most effective GLP-1 medications available—sourced from US-licensed pharmacies only.</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Results</div>
          <h2 className="section-title">Real Patients, Real Results</h2>
          <p className="section-subtitle">Here's what our weight loss patients are saying.</p>
          
          <div className="testimonials-grid">
            <div className="testimonial">
              <div className="testimonial-stars">★★★★★</div>
              <p>"Down 22 lbs in 8 weeks. But the biggest change is that I'm not thinking about food all day. The cravings just... stopped. I finally feel in control."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">LM</div>
                <div className="testimonial-info">
                  <strong>L.M.</strong>
                  <span>Weight Loss Patient</span>
                </div>
              </div>
            </div>
            <div className="testimonial">
              <div className="testimonial-stars">★★★★★</div>
              <p>"I've tried every diet since my 30s. This is the first thing that actually worked. My provider found my thyroid was off too—no one else caught that."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">KT</div>
                <div className="testimonial-info">
                  <strong>K.T.</strong>
                  <span>Weight Loss Patient</span>
                </div>
              </div>
            </div>
            <div className="testimonial">
              <div className="testimonial-stars">★★★★★</div>
              <p>"Lost 30 lbs and kept it off. They didn't just give me a shot—they checked my hormones, adjusted my dose, and actually followed up."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">RJ</div>
                <div className="testimonial-info">
                  <strong>R.J.</strong>
                  <span>Weight Loss Patient</span>
                </div>
              </div>
            </div>
            <div className="testimonial">
              <div className="testimonial-stars">★★★★★</div>
              <p>"My energy is back. I'm sleeping better. And I've dropped 3 pant sizes. I was skeptical at first, but the labs showed exactly what was going on."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">SM</div>
                <div className="testimonial-info">
                  <strong>S.M.</strong>
                  <span>Weight Loss Patient</span>
                </div>
              </div>
            </div>
          </div>
          
          <p className="results-note">Individual results vary based on starting point, adherence to protocol, and how your body responds.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Questions</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          
          <div className="faq-container">
            <div className="faq-item">
              <h4>Is GLP-1 medication right for me?</h4>
              <p>GLP-1s like tirzepatide and retatrutide work best for people with stubborn weight who haven't had success with diet and exercise alone. Your provider will review your labs and health history to make sure it's safe and appropriate for you. If it's not the right fit, we'll tell you—and explore other options.</p>
            </div>
            <div className="faq-item">
              <h4>How fast will I lose weight?</h4>
              <p>Most patients start noticing changes in 4–8 weeks once their dose is dialed in. Typical results range from 1–2 lbs per week, though some lose more. We don't promise overnight miracles—but the results are real and sustainable when done right.</p>
            </div>
            <div className="faq-item">
              <h4>Do I have to stay on the medication forever?</h4>
              <p>No. Many patients use GLP-1s for 6–12 months to reach their goal, then taper off while maintaining with healthy habits. Your provider will help you plan for the long term—including what happens after you stop.</p>
            </div>
            <div className="faq-item">
              <h4>Can this work if I've failed other programs?</h4>
              <p>Yes—and that's actually who we help most. If you've tried diets, challenges, other clinics, or even GLP-1s without success, there's usually a reason. Our labs often uncover thyroid issues, hormone imbalances, or metabolic problems that were never addressed.</p>
            </div>
            <div className="faq-item">
              <h4>What are the side effects?</h4>
              <p>The most common side effects are mild nausea, especially in the first few weeks. This usually improves as your body adjusts. We start with low doses and increase gradually. Your provider monitors you throughout and can adjust if needed.</p>
            </div>
            <div className="faq-item">
              <h4>Do you accept insurance?</h4>
              <p>We're a cash-pay clinic and don't bill insurance directly. Many patients use HSA or FSA funds. We can provide documentation if you want to submit for potential reimbursement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-step">Step 1</div>
          <h2>Get Your Range Assessment</h2>
          <p>We'll review your labs, symptoms, and goals to build a personalized protocol—including whether GLP-1 medication is right for you.</p>
          <Link href="/range-assessment" className="btn-white">Book Your Assessment</Link>
          <p className="cta-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a></p>
        </div>
      </section>

      <style jsx>{`
        .hero {
          padding: 4rem 1.5rem 3rem;
          text-align: center;
          background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
        }
        
        .hero-badge {
          display: inline-block;
          background: #000000;
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        
        .hero h1 {
          margin-bottom: 1rem;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .hero-sub {
          font-size: 1.125rem;
          color: #525252;
          max-width: 650px;
          margin: 0 auto 2rem;
        }
        
        .hero-cta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .hero-secondary {
          font-size: 0.9375rem;
          color: #737373;
        }
        
        .hero-secondary a {
          color: #171717;
          font-weight: 600;
        }
        
        .pain-points {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          max-width: 550px;
          margin: 0 auto;
        }
        
        .pain-points h3 {
          font-size: 1.125rem;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .pain-points ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .pain-points ul li {
          padding: 0.625rem 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 0.9375rem;
          color: #525252;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        
        .pain-points ul li:last-child {
          border-bottom: none;
        }
        
        .pain-points ul li::before {
          content: "→";
          color: #9ca3af;
          flex-shrink: 0;
        }
        
        .problem-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          max-width: 1000px;
          margin: 0 auto 2.5rem;
        }
        
        .problem-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }
        
        .problem-icon {
          font-size: 1.75rem;
          margin-bottom: 0.75rem;
        }
        
        .problem-card h4 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .problem-card p {
          font-size: 0.875rem;
          color: #525252;
          margin: 0;
        }
        
        .comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .comparison-col {
          background: #ffffff;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e5e5e5;
        }
        
        .comparison-col.range {
          border: 2px solid #000000;
        }
        
        .comparison-col h4 {
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        
        .comparison-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .comparison-col ul li {
          padding: 0.5rem 0;
          font-size: 0.9375rem;
          color: #525252;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .comparison-col ul li::before {
          content: "✕";
          color: #dc2626;
          font-weight: 600;
          flex-shrink: 0;
        }
        
        .comparison-col.range ul li::before {
          content: "✓";
          color: #000000;
        }
        
        .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto 2rem;
        }
        
        .benefit-card {
          background: #fafafa;
          border-radius: 12px;
          padding: 1.75rem;
        }
        
        .benefit-card h4 {
          font-size: 1.0625rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .benefit-card h4 span {
          font-size: 1.25rem;
        }
        
        .benefit-card p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
        }
        
        .meds-note {
          text-align: center;
          font-size: 1rem;
          color: #404040;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .testimonials-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .testimonial {
          background: #ffffff;
          border-radius: 12px;
          padding: 1.75rem;
          border: 1px solid #e5e5e5;
        }
        
        .testimonial-stars {
          color: #000000;
          font-size: 1rem;
          letter-spacing: 2px;
          margin-bottom: 0.75rem;
        }
        
        .testimonial p {
          font-size: 0.9375rem;
          color: #404040;
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .testimonial-avatar {
          width: 40px;
          height: 40px;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.75rem;
        }
        
        .testimonial-info {
          font-size: 0.875rem;
        }
        
        .testimonial-info strong {
          color: #171717;
          display: block;
        }
        
        .testimonial-info span {
          color: #737373;
        }
        
        .results-note {
          text-align: center;
          margin-top: 2rem;
          font-size: 0.8125rem;
          color: #737373;
        }
        
        .faq-container {
          max-width: 700px;
          margin: 0 auto;
        }
        
        .faq-item {
          background: #fafafa;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .faq-item h4 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .faq-item p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
        }
        
        .final-cta {
          background: #000000;
          padding: 4rem 1.5rem;
          text-align: center;
        }
        
        .cta-step {
          display: inline-block;
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
          padding: 0.375rem 1rem;
          border-radius: 100px;
          font-size: 0.8125rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }
        
        .final-cta h2 {
          color: #ffffff;
          margin-bottom: 0.75rem;
        }
        
        .final-cta > .container > p {
          color: rgba(255,255,255,0.8);
          margin-bottom: 2rem;
        }
        
        .cta-secondary {
          margin-top: 1.5rem;
          color: rgba(255,255,255,0.6) !important;
          font-size: 0.9375rem;
        }
        
        .cta-secondary a {
          color: #ffffff;
          font-weight: 600;
        }
        
        @media (max-width: 900px) {
          .problem-cards {
            grid-template-columns: 1fr;
          }
          
          .comparison,
          .benefits-grid,
          .testimonials-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 640px) {
          .hero {
            padding: 3rem 1.5rem 2rem;
          }
          
          .pain-points {
            padding: 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
