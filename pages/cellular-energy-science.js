// /pages/cellular-energy-science.js
// Educational Landing Page: Red Light Therapy + HBOT Science
// Range Medical - Black & White Design System

import Layout from '../components/Layout';
import Link from 'next/link';

export default function CellularEnergyScience() {
  return (
    <Layout 
      title="The Science of Red Light Therapy & Hyperbaric Oxygen | Range Medical"
      description="Discover how red light therapy and hyperbaric oxygen therapy work together to support cellular energy, reduce fatigue, and boost mitochondrial function. Learn the science."
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
          <span className="hero-badge">The Science</span>
          <h1>How Red Light & Oxygen Therapies Support Cellular Energy</h1>
          <p className="hero-sub">Persistent fatigue often starts at the cellular level. Learn how two therapies — Red Light Therapy and Hyperbaric Oxygen — may work together to support your body's natural energy production.</p>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="section section-disclaimer">
        <div className="container">
          <div className="disclaimer-box">
            <p><strong>Disclaimer:</strong> This information is for educational purposes only and is not intended as medical advice. The therapies discussed are not designed to diagnose, treat, cure, or prevent any disease. Please consult with a qualified healthcare professional before starting any new therapy.</p>
          </div>
        </div>
      </section>

      {/* Understanding Fatigue */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Understanding Fatigue</div>
          <h2 className="section-title">Why You Feel Tired</h2>
          <p className="section-subtitle">Persistent fatigue may have roots deep within your cells. The primary energy currency for your body is a molecule called adenosine triphosphate (ATP), produced by cellular components known as mitochondria.</p>
          
          <div className="content-block">
            <p>When mitochondrial function is suboptimal, ATP production can decrease — potentially contributing to feelings of fatigue. Factors that may influence this process include inflammation and the availability of sufficient oxygen.</p>
            <p>Two innovative modalities, Red Light Therapy (Photobiomodulation) and Hyperbaric Oxygen Therapy (HBOT), are being studied for their potential to address these factors at the cellular level.</p>
          </div>
        </div>
      </section>

      {/* Red Light Therapy Section */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Modality 1</div>
          <h2 className="section-title">Red Light Therapy</h2>
          <p className="section-subtitle">Photobiomodulation (PBM) uses specific wavelengths of red and near-infrared light that penetrate the skin and interact with mitochondria to support their natural functions.</p>
          
          <div className="science-card">
            <h3>The Proposed Mechanism</h3>
            <p>One of the primary proposed mechanisms involves an enzyme within the mitochondria called <strong>Cytochrome C Oxidase (CCO)</strong>. This enzyme is a crucial part of the process that produces ATP.</p>
            <p>Under conditions of cellular stress, a molecule called nitric oxide (NO) can bind to CCO, which may inhibit the pathway and reduce ATP production.</p>
          </div>

          <div className="science-card highlight">
            <h3>How Red Light May Help</h3>
            <p>It is suggested that red light photons may be absorbed by CCO, potentially helping it break its bond with nitric oxide. This action, known as <strong>photodissociation</strong>, may help clear this pathway — allowing oxygen to bind more effectively and supporting the energy production process.</p>
            <p>Because stressed or damaged cells may have more of this nitric oxide binding, Red Light Therapy could have a more noticeable effect on individuals experiencing fatigue.</p>
          </div>

          <div className="mechanism-table">
            <div className="mechanism-row">
              <div className="mechanism-label">Target</div>
              <div className="mechanism-content">
                <strong>Mitochondria (Cytochrome C Oxidase)</strong>
                <span>Aims to interact with cellular energy production centers</span>
              </div>
            </div>
            <div className="mechanism-row">
              <div className="mechanism-label">Action</div>
              <div className="mechanism-content">
                <strong>May help displace inhibitory Nitric Oxide (NO)</strong>
                <span>May support a clearer pathway for ATP production</span>
              </div>
            </div>
            <div className="mechanism-row">
              <div className="mechanism-label">Result</div>
              <div className="mechanism-content">
                <strong>May support ATP synthesis</strong>
                <span>Could contribute to better cellular energy and help reduce feelings of fatigue</span>
              </div>
            </div>
          </div>

          <div className="research-note">
            <p>Some studies on muscle tissue, which is rich in mitochondria, have suggested that Red Light Therapy may help reduce fatigue, decrease markers of muscle damage, and support overall energy metabolism.</p>
          </div>
        </div>
      </section>

      {/* HBOT Section */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Modality 2</div>
          <h2 className="section-title">Hyperbaric Oxygen Therapy</h2>
          <p className="section-subtitle">HBOT involves breathing 100% pure oxygen in a pressurized environment. This change may have a profound effect on the body.</p>
          
          <div className="science-card">
            <h3>How It Works</h3>
            <p>Under normal conditions, oxygen is transported by red blood cells. With HBOT, the increased pressure allows oxygen to dissolve directly into the blood plasma and other body fluids.</p>
            <p className="stat-highlight">This process can increase the amount of oxygen delivered to tissues by up to <strong>20-fold</strong>.</p>
          </div>

          <div className="science-card highlight">
            <h3>The Proposed Mechanism</h3>
            <p>This increased availability of oxygen may help fuel the mitochondria. Oxygen is an essential ingredient required by Cytochrome C Oxidase to produce ATP.</p>
            <p>By providing an abundance of oxygen, HBOT may help ensure that the mitochondrial machinery has more of the fuel it needs to run efficiently — potentially supporting ATP synthesis.</p>
          </div>

          <div className="mechanism-table">
            <div className="mechanism-row">
              <div className="mechanism-label">Action</div>
              <div className="mechanism-content">
                <strong>Breathing 100% O₂ under pressure</strong>
                <span>Can increase dissolved oxygen in body fluids</span>
              </div>
            </div>
            <div className="mechanism-row">
              <div className="mechanism-label">Target</div>
              <div className="mechanism-content">
                <strong>All Tissues and Mitochondria</strong>
                <span>Aims to deliver more oxygen fuel to every cell</span>
              </div>
            </div>
            <div className="mechanism-row">
              <div className="mechanism-label">Result</div>
              <div className="mechanism-content">
                <strong>May support ATP production</strong>
                <span>Could help the mitochondrial energy-making process</span>
              </div>
            </div>
          </div>

          <div className="research-note">
            <p>A clinical trial focused on patients with Chronic Fatigue Syndrome (CFS) explored the efficacy of HBOT. After 15 sessions, patients reported statistically significant improvements in fatigue scores and overall quality of life, with no reported complications.</p>
          </div>
        </div>
      </section>

      {/* Synergy Section */}
      <section className="section section-dark">
        <div className="container">
          <div className="section-kicker light">The Combined Approach</div>
          <h2 className="section-title light">Potential Synergy</h2>
          <p className="section-subtitle light">The interest in combining these therapies lies in a potential synergistic effect — where the combined action may be greater than the sum of its parts.</p>
          
          <div className="synergy-box">
            <div className="synergy-challenge">
              <h4>The Challenge</h4>
              <p>In a fatigued state, cellular energy production may be inhibited by factors like nitric oxide binding and insufficient oxygen availability.</p>
            </div>
            
            <div className="synergy-solution">
              <h4>A Potential Solution</h4>
              <div className="synergy-steps">
                <div className="synergy-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>Red Light Therapy</strong>
                    <p>Is theorized to help clear nitric oxide from the mitochondrial pathway</p>
                  </div>
                </div>
                <div className="synergy-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>Hyperbaric Oxygen Therapy</strong>
                    <p>Then increases the supply of oxygen available to the cells</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="synergy-summary">
            <div className="synergy-card">
              <h4>Red Light Therapy</h4>
              <p className="role"><strong>May clear the pathway:</strong> Could help displace nitric oxide from mitochondria</p>
              <p className="result">May prepare the cell for more efficient energy production</p>
            </div>
            <div className="synergy-card">
              <h4>Hyperbaric Oxygen</h4>
              <p className="role"><strong>May provide the fuel:</strong> Delivers a surplus of oxygen to the cells</p>
              <p className="result">May support higher ATP output from the prepared pathway</p>
            </div>
          </div>

          <p className="synergy-conclusion">This combination may first address a potential inhibitor (NO) and then provide an abundance of an essential substrate (O₂), which could lead to improved mitochondrial efficiency and ATP production beyond what either therapy might achieve alone.</p>
        </div>
      </section>

      {/* References */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Research</div>
          <h2 className="section-title">References</h2>
          
          <div className="references-list">
            <div className="reference-item">
              <span className="ref-number">[1]</span>
              <p>Hamblin, M. R. (2018). Mechanisms and Mitochondrial Redox Signaling in Photobiomodulation. <em>Photochemistry and Photobiology</em>, 94(2), 199–212.</p>
            </div>
            <div className="reference-item">
              <span className="ref-number">[2]</span>
              <p>Ferraresi, C., Hamblin, M. R., & Parizotto, N. A. (2012). Low-level laser (light) therapy (LLLT) on muscle tissue: performance, fatigue and repair benefited by the power of light. <em>Photonics & Lasers in Medicine</em>, 1(4), 267–286.</p>
            </div>
            <div className="reference-item">
              <span className="ref-number">[3]</span>
              <p>Schottlender, N., Gottfried, I., & Ashery, U. (2021). Hyperbaric Oxygen Treatment: Effects on Mitochondrial Function and Oxidative Stress. <em>Biomolecules</em>, 11(12), 1827.</p>
            </div>
            <div className="reference-item">
              <span className="ref-number">[4]</span>
              <p>Akarsu, S., Tekin, L., Ay, H., Carli, A. B., Tok, F., Simşek, K., & Kiralp, M. Z. (2013). The efficacy of hyperbaric oxygen therapy in the management of chronic fatigue syndrome. <em>Undersea & Hyperbaric Medicine</em>, 40(2), 197–200.</p>
            </div>
            <div className="reference-item">
              <span className="ref-number">[5]</span>
              <p>Oxycell. (n.d.). Synergy of Near Infrared & Red Light Therapy With HBOT.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to Experience It?</h2>
          <p>At Range Medical, we offer both Red Light Therapy and Hyperbaric Oxygen Therapy — and they work even better together. See our Cellular Energy Reset package.</p>
          <Link href="/cellular-energy-reset" className="btn-white">View Cellular Energy Reset</Link>
          <p className="cta-secondary">Questions? <a href="tel:+19499973988">Call or text (949) 997-3988</a></p>
        </div>
      </section>

      <style jsx>{`
        /* Trust Bar */
        .trust-bar {
          background: #fafafa;
          border-bottom: 1px solid #e5e5e5;
          padding: 0.75rem 0;
        }
        .trust-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .trust-item {
          font-size: 0.875rem;
          color: #525252;
        }
        .trust-rating {
          color: #000;
          margin-right: 0.25rem;
        }

        /* Hero */
        .hero {
          padding: 5rem 0 4rem;
          text-align: center;
          background: linear-gradient(180deg, #fafafa 0%, #fff 100%);
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .hero-badge {
          display: inline-block;
          background: #000;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          margin-bottom: 1.5rem;
        }
        .hero h1 {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 700;
          color: #171717;
          line-height: 1.15;
          margin-bottom: 1.5rem;
        }
        .hero-sub {
          font-size: 1.125rem;
          color: #525252;
          line-height: 1.7;
          max-width: 650px;
          margin: 0 auto;
        }

        /* Sections */
        .section {
          padding: 4rem 0;
        }
        .section-gray {
          background: #fafafa;
        }
        .section-dark {
          background: #000;
          color: #fff;
        }
        .section-disclaimer {
          padding: 2rem 0;
        }
        .section-kicker {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
        }
        .section-kicker.light {
          color: rgba(255,255,255,0.6);
        }
        .section-title {
          font-size: clamp(1.75rem, 4vw, 2.25rem);
          font-weight: 700;
          color: #171717;
          margin-bottom: 1rem;
        }
        .section-title.light {
          color: #fff;
        }
        .section-subtitle {
          font-size: 1.125rem;
          color: #525252;
          line-height: 1.7;
          max-width: 650px;
          margin-bottom: 2.5rem;
        }
        .section-subtitle.light {
          color: rgba(255,255,255,0.8);
        }

        /* Disclaimer */
        .disclaimer-box {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 1.25rem 1.5rem;
        }
        .disclaimer-box p {
          font-size: 0.875rem;
          color: #92400e;
          margin: 0;
          line-height: 1.6;
        }

        /* Content Block */
        .content-block {
          max-width: 650px;
        }
        .content-block p {
          font-size: 1rem;
          color: #525252;
          line-height: 1.8;
          margin-bottom: 1.25rem;
        }
        .content-block p:last-child {
          margin-bottom: 0;
        }

        /* Science Cards */
        .science-card {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 1.5rem;
        }
        .section-gray .science-card {
          background: #fff;
        }
        .science-card.highlight {
          border-color: #000;
          border-width: 2px;
        }
        .science-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #171717;
          margin-bottom: 1rem;
        }
        .science-card p {
          font-size: 1rem;
          color: #525252;
          line-height: 1.7;
          margin-bottom: 1rem;
        }
        .science-card p:last-child {
          margin-bottom: 0;
        }
        .stat-highlight {
          font-size: 1.125rem !important;
          background: #fafafa;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          margin-top: 1rem !important;
        }
        .stat-highlight strong {
          color: #000;
        }

        /* Mechanism Table */
        .mechanism-table {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
          margin: 2rem 0;
        }
        .mechanism-row {
          display: flex;
          border-bottom: 1px solid #e5e5e5;
        }
        .mechanism-row:last-child {
          border-bottom: none;
        }
        .mechanism-label {
          width: 100px;
          flex-shrink: 0;
          background: #fafafa;
          padding: 1.25rem 1rem;
          font-weight: 600;
          font-size: 0.875rem;
          color: #171717;
        }
        .mechanism-content {
          flex: 1;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .mechanism-content strong {
          color: #171717;
          font-weight: 600;
        }
        .mechanism-content span {
          font-size: 0.875rem;
          color: #737373;
        }

        /* Research Note */
        .research-note {
          background: #f5f5f5;
          border-left: 3px solid #000;
          padding: 1.25rem 1.5rem;
          margin-top: 2rem;
        }
        .research-note p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
          line-height: 1.7;
          font-style: italic;
        }

        /* Synergy Section */
        .synergy-box {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2.5rem;
        }
        .synergy-challenge {
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.15);
          margin-bottom: 1.5rem;
        }
        .synergy-challenge h4,
        .synergy-solution h4 {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.75rem;
        }
        .synergy-challenge p {
          color: rgba(255,255,255,0.9);
          line-height: 1.7;
          margin: 0;
        }
        .synergy-steps {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .synergy-step {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .step-number {
          width: 32px;
          height: 32px;
          background: #fff;
          color: #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        .step-content strong {
          display: block;
          color: #fff;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .step-content p {
          color: rgba(255,255,255,0.7);
          font-size: 0.9375rem;
          margin: 0;
          line-height: 1.5;
        }

        .synergy-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .synergy-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          padding: 1.5rem;
        }
        .synergy-card h4 {
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .synergy-card .role {
          color: rgba(255,255,255,0.9);
          font-size: 0.9375rem;
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }
        .synergy-card .result {
          color: rgba(255,255,255,0.6);
          font-size: 0.875rem;
          margin: 0;
        }

        .synergy-conclusion {
          color: rgba(255,255,255,0.8);
          font-size: 1rem;
          line-height: 1.7;
          text-align: center;
          max-width: 650px;
          margin: 0 auto;
        }

        /* References */
        .references-list {
          max-width: 700px;
        }
        .reference-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.25rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid #e5e5e5;
        }
        .reference-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .ref-number {
          font-weight: 600;
          color: #171717;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        .reference-item p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
          line-height: 1.6;
        }
        .reference-item em {
          font-style: italic;
        }

        /* Final CTA */
        .final-cta {
          background: #000;
          color: #fff;
          padding: 4rem 0;
          text-align: center;
        }
        .final-cta h2 {
          font-size: clamp(1.75rem, 4vw, 2.25rem);
          font-weight: 700;
          margin-bottom: 1rem;
        }
        .final-cta p {
          color: rgba(255,255,255,0.8);
          font-size: 1.0625rem;
          line-height: 1.7;
          max-width: 550px;
          margin: 0 auto 2rem;
        }
        .btn-white {
          display: inline-block;
          background: #fff;
          color: #000;
          font-weight: 600;
          padding: 1rem 2rem;
          border-radius: 8px;
          text-decoration: none;
          font-size: 1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-white:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255,255,255,0.15);
        }
        .cta-secondary {
          margin-top: 1.5rem !important;
          font-size: 0.9375rem !important;
        }
        .cta-secondary a {
          color: #fff;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .trust-inner {
            gap: 1rem;
          }
          .hero {
            padding: 3rem 0;
          }
          .section {
            padding: 3rem 0;
          }
          .mechanism-row {
            flex-direction: column;
          }
          .mechanism-label {
            width: 100%;
            padding: 0.75rem 1rem;
          }
          .synergy-summary {
            grid-template-columns: 1fr;
          }
          .science-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
