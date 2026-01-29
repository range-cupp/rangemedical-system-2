import ServicePageTemplate from '../components/ServicePageTemplate';
import { servicePages, defaultTestimonials } from '../data/servicePageData';
import Link from 'next/link';

const data = servicePages['lab-panels'];

export default function LabPanels() {
  return (
    <ServicePageTemplate
      seo={data.seo}
      badge={data.badge}
      title={data.title}
      subtitle={data.subtitle}
      ctaText="Book Your Assessment — $199"
      ctaLink="/book"
      ctaSecondary="Or call (949) 997-3988 to schedule labs directly"
      isThisForYou={data.isThisForYou}
      howItWorks={data.howItWorks}
      testimonials={defaultTestimonials}
      faqs={data.faqs}
      finalCta={{
        title: "Ready to See What's Really Going On?",
        subtitle: "Book your Range Assessment or schedule labs directly. We'll review everything together."
      }}
    >
      {/* Men's Panels Section */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Men&apos;s Panels</div>
          <h2 className="section-title">Comprehensive Testing for Men</h2>
          <p className="section-subtitle">
            Choose the panel that matches your goals — from essential health markers to deep optimization.
          </p>

          <div className="panels-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Men&apos;s Essential Panel</h3>
                <div className="panel-price">$350</div>
              </div>
              <p className="panel-desc">Core markers for energy, hormones, and metabolic health.</p>
              <div className="panel-markers">
                <h4>What&apos;s Included:</h4>
                <ul>
                  <li><strong>Hormones:</strong> Total Testosterone, Free Testosterone, Estradiol, SHBG</li>
                  <li><strong>Thyroid:</strong> TSH, Free T4, Free T3</li>
                  <li><strong>Metabolic:</strong> Fasting Glucose, HbA1c, Lipid Panel</li>
                  <li><strong>Inflammation:</strong> hs-CRP</li>
                  <li><strong>Vitamins:</strong> Vitamin D, B12</li>
                  <li><strong>Blood Count:</strong> CBC with Differential</li>
                  <li><strong>Liver/Kidney:</strong> CMP (Complete Metabolic Panel)</li>
                </ul>
              </div>
              <Link href="/book" className="btn-primary panel-cta">Book Essential Panel</Link>
            </div>

            <div className="panel-card featured">
              <div className="panel-badge">Most Comprehensive</div>
              <div className="panel-header">
                <h3>Men&apos;s Elite Panel</h3>
                <div className="panel-price">$750</div>
              </div>
              <p className="panel-desc">Everything in Essential plus advanced longevity and optimization markers.</p>
              <div className="panel-markers">
                <h4>Everything in Essential, Plus:</h4>
                <ul>
                  <li><strong>Advanced Hormones:</strong> DHT, DHEA-S, Prolactin, LH, FSH, IGF-1</li>
                  <li><strong>Advanced Thyroid:</strong> Reverse T3, Thyroid Antibodies (TPO, TG)</li>
                  <li><strong>Cardiovascular:</strong> Lp(a), ApoB, Homocysteine</li>
                  <li><strong>Inflammation:</strong> Ferritin, Fibrinogen</li>
                  <li><strong>Vitamins/Minerals:</strong> Folate, RBC Magnesium, Zinc</li>
                  <li><strong>Metabolic:</strong> Fasting Insulin, HOMA-IR calculation</li>
                  <li><strong>PSA:</strong> Prostate-Specific Antigen</li>
                </ul>
              </div>
              <Link href="/book" className="btn-primary panel-cta">Book Elite Panel</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Women's Panels Section */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Women&apos;s Panels</div>
          <h2 className="section-title">Comprehensive Testing for Women</h2>
          <p className="section-subtitle">
            Hormone-focused panels designed for women at every stage of life.
          </p>

          <div className="panels-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Women&apos;s Essential Panel</h3>
                <div className="panel-price">$350</div>
              </div>
              <p className="panel-desc">Core markers for hormones, metabolism, and overall health.</p>
              <div className="panel-markers">
                <h4>What&apos;s Included:</h4>
                <ul>
                  <li><strong>Hormones:</strong> Estradiol, Progesterone, Total Testosterone, SHBG</li>
                  <li><strong>Thyroid:</strong> TSH, Free T4, Free T3</li>
                  <li><strong>Metabolic:</strong> Fasting Glucose, HbA1c, Lipid Panel</li>
                  <li><strong>Inflammation:</strong> hs-CRP</li>
                  <li><strong>Vitamins:</strong> Vitamin D, B12, Iron Panel</li>
                  <li><strong>Blood Count:</strong> CBC with Differential</li>
                  <li><strong>Liver/Kidney:</strong> CMP (Complete Metabolic Panel)</li>
                </ul>
              </div>
              <Link href="/book" className="btn-primary panel-cta">Book Essential Panel</Link>
            </div>

            <div className="panel-card featured">
              <div className="panel-badge">Most Comprehensive</div>
              <div className="panel-header">
                <h3>Women&apos;s Elite Panel</h3>
                <div className="panel-price">$750</div>
              </div>
              <p className="panel-desc">Everything in Essential plus fertility, longevity, and advanced markers.</p>
              <div className="panel-markers">
                <h4>Everything in Essential, Plus:</h4>
                <ul>
                  <li><strong>Advanced Hormones:</strong> Free Testosterone, DHEA-S, Prolactin, LH, FSH, AMH</li>
                  <li><strong>Advanced Thyroid:</strong> Reverse T3, Thyroid Antibodies (TPO, TG)</li>
                  <li><strong>Cardiovascular:</strong> Lp(a), ApoB, Homocysteine</li>
                  <li><strong>Inflammation:</strong> Ferritin, Fibrinogen</li>
                  <li><strong>Vitamins/Minerals:</strong> Folate, RBC Magnesium, Zinc</li>
                  <li><strong>Metabolic:</strong> Fasting Insulin, HOMA-IR calculation</li>
                  <li><strong>Cortisol:</strong> Morning Cortisol</li>
                </ul>
              </div>
              <Link href="/book" className="btn-primary panel-cta">Book Elite Panel</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Which Panel Section */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Which Panel?</div>
          <h2 className="section-title">Which Panel Is Right For You?</h2>

          <div className="compare-grid">
            <div className="compare-card">
              <h4>Choose Essential If:</h4>
              <ul>
                <li>You want a solid baseline of key health markers</li>
                <li>You&apos;re checking in after lifestyle changes</li>
                <li>You&apos;re new to comprehensive testing</li>
                <li>You want to track hormones and metabolic health</li>
              </ul>
            </div>
            <div className="compare-card">
              <h4>Choose Elite If:</h4>
              <ul>
                <li>You want the full picture of your health</li>
                <li>You&apos;re focused on longevity and optimization</li>
                <li>You have a family history of heart disease</li>
                <li>You want advanced hormone and thyroid markers</li>
                <li>You&apos;re considering or currently on HRT</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .panels-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .panel-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          position: relative;
        }

        .panel-card.featured {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .panel-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #000000;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.375rem 1rem;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .panel-header {
          text-align: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e5e5;
        }

        .panel-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .panel-price {
          font-size: 2rem;
          font-weight: 700;
          color: #000000;
        }

        .panel-desc {
          text-align: center;
          font-size: 0.9375rem;
          color: #525252;
          margin-bottom: 1.5rem;
        }

        .panel-markers h4 {
          font-size: 0.875rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .panel-markers ul {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem 0;
        }

        .panel-markers li {
          font-size: 0.875rem;
          color: #404040;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f5f5f5;
          line-height: 1.5;
        }

        .panel-markers li:last-child {
          border-bottom: none;
        }

        .panel-markers li strong {
          color: #171717;
        }

        .panel-cta {
          display: block;
          text-align: center;
          width: 100%;
        }

        .compare-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .compare-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
        }

        .compare-card h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 1rem;
        }

        .compare-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .compare-card li {
          font-size: 0.9375rem;
          color: #404040;
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          line-height: 1.5;
        }

        .compare-card li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #22c55e;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .panels-grid,
          .compare-grid {
            grid-template-columns: 1fr;
          }

          .panel-card.featured {
            order: -1;
          }
        }
      `}</style>
    </ServicePageTemplate>
  );
}
