import Head from 'next/head';

export default function ToradolPostInjection() {
  return (
    <>
      <Head>
        <title>After Your Toradol Injection | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root {
          --color-primary: #000000;
          --color-bg: #ffffff;
          --color-bg-alt: #fafafa;
          --color-text: #171717;
          --color-text-body: #525252;
          --color-text-muted: #737373;
          --color-border: #e5e5e5;
          --color-border-light: #f5f5f5;
          --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          --radius-sm: 6px;
          --radius-md: 8px;
          --radius-lg: 12px;
          --radius-full: 100px;
          --shadow-sm: 0 4px 20px rgba(0,0,0,0.06);
          --transition: 0.2s ease;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: var(--font-family);
          font-size: 1rem;
          line-height: 1.6;
          color: var(--color-text-body);
          background: var(--color-bg);
          -webkit-font-smoothing: antialiased;
        }

        .toradol-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Header */
        .toradol-header {
          padding: 1.5rem 0;
          border-bottom: 1px solid var(--color-border);
        }

        .toradol-header .toradol-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .toradol-logo img {
          height: 135px;
          width: auto;
        }

        .toradol-header-contact {
          text-align: right;
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }

        .toradol-header-contact a {
          color: var(--color-text);
          text-decoration: none;
          font-weight: 600;
        }

        /* Hero */
        .toradol-hero {
          padding: 4rem 1.5rem;
          text-align: center;
          background: linear-gradient(180deg, var(--color-bg-alt) 0%, var(--color-bg) 100%);
        }

        .toradol-hero-badge {
          display: inline-block;
          background: var(--color-primary);
          color: var(--color-bg);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .toradol-hero h1 {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: var(--color-text);
          margin-bottom: 1rem;
        }

        .toradol-hero-subtitle {
          font-size: 1.0625rem;
          color: var(--color-text-body);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* Sections */
        .toradol-section {
          padding: 3.5rem 1.5rem;
        }

        .toradol-section-gray {
          background: var(--color-bg-alt);
        }

        .toradol-section-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-muted);
          margin-bottom: 0.75rem;
        }

        .toradol-section-title {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-text);
          margin-bottom: 1rem;
        }

        .toradol-section-subtitle {
          font-size: 1rem;
          color: var(--color-text-body);
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        /* Two Column */
        .toradol-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        /* Info Cards */
        .toradol-info-card {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
        }

        .toradol-info-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 1rem;
        }

        .toradol-info-list {
          list-style: none;
        }

        .toradol-info-list li {
          position: relative;
          padding-left: 1.5rem;
          padding-top: 0.375rem;
          padding-bottom: 0.375rem;
          font-size: 0.9375rem;
        }

        .toradol-info-list li::before {
          content: "•";
          position: absolute;
          left: 0;
          font-weight: 600;
          color: var(--color-primary);
        }

        .toradol-info-list.checks li::before {
          content: "✓";
        }

        /* Warning Box */
        .toradol-warning-box {
          background: var(--color-bg-alt);
          border-left: 4px solid var(--color-primary);
          padding: 1.25rem 1.5rem;
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          margin-top: 2rem;
        }

        .toradol-warning-box h4 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 0.5rem;
        }

        .toradol-warning-box p {
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        /* Explainer */
        .toradol-explainer {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 2rem;
          max-width: 700px;
          margin: 0 auto;
        }

        .toradol-explainer p {
          font-size: 1rem;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .toradol-explainer p:last-child {
          margin-bottom: 0;
        }

        /* Timeline */
        .toradol-timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .toradol-timeline-item {
          display: flex;
          gap: 1.25rem;
          padding: 1.25rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }

        .toradol-timeline-time {
          flex-shrink: 0;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text);
          min-width: 100px;
        }

        .toradol-timeline-content {
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        /* Contact Section */
        .toradol-contact-section {
          text-align: center;
          padding: 3rem 1.5rem;
          background: var(--color-primary);
          color: var(--color-bg);
        }

        .toradol-contact-section h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .toradol-contact-section p {
          font-size: 1rem;
          opacity: 0.8;
          margin-bottom: 1.5rem;
        }

        .toradol-contact-info {
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .toradol-contact-info a {
          color: var(--color-bg);
          text-decoration: underline;
          text-underline-offset: 3px;
          font-weight: 600;
        }

        /* Footer */
        .toradol-footer {
          padding: 2rem 1.5rem;
          border-top: 1px solid var(--color-border);
          text-align: center;
        }

        .toradol-footer img {
          height: 40px;
          width: auto;
          margin-bottom: 1rem;
        }

        .toradol-footer p {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .toradol-two-col {
            grid-template-columns: 1fr;
          }

          .toradol-hero h1 {
            font-size: 1.875rem;
          }

          .toradol-section {
            padding: 2.5rem 1.5rem;
          }

          .toradol-logo img {
            height: 100px;
          }

          .toradol-header-contact {
            display: none;
          }

          .toradol-timeline-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .toradol-contact-info {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>

      {/* Header */}
      <header className="toradol-header">
        <div className="toradol-container">
          <a href="https://range-medical.com" className="toradol-logo">
            <img src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/6933ae9e1d466e9b7dfb6b69.png" alt="Range Medical" />
          </a>
          <div className="toradol-header-contact">
            Questions? <a href="tel:949-997-3988">949-997-3988</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="toradol-hero">
        <div className="toradol-container">
          <span className="toradol-hero-badge">Post-Injection Guide</span>
          <h1>After Your Toradol Injection</h1>
          <p className="toradol-hero-subtitle">What to expect now that you've received your injection, and what to watch for over the next few hours.</p>
        </div>
      </section>

      {/* What Is It */}
      <section className="toradol-section">
        <div className="toradol-container">
          <div className="toradol-section-kicker">About Your Injection</div>
          <h2 className="toradol-section-title">What you received</h2>
          
          <div className="toradol-explainer">
            <p>Toradol (ketorolac) is a strong anti-inflammatory pain reliever. It belongs to a class of drugs called NSAIDs—the same family as ibuprofen, but much more powerful.</p>
            <p>It works by blocking the chemicals in your body that cause pain and inflammation. Most patients feel relief within 30 minutes.</p>
            <p><strong>Good to know:</strong> Toradol is not a narcotic. It won't make you drowsy or impair your ability to drive.</p>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="toradol-section toradol-section-gray">
        <div className="toradol-container">
          <div className="toradol-section-kicker">What to Expect</div>
          <h2 className="toradol-section-title">How it works</h2>
          <p className="toradol-section-subtitle">Here's a general timeline of what most patients experience after their injection.</p>
          
          <div className="toradol-timeline">
            <div className="toradol-timeline-item">
              <div className="toradol-timeline-time">30 minutes</div>
              <div className="toradol-timeline-content">Pain relief begins. You may notice the edge coming off your discomfort.</div>
            </div>
            <div className="toradol-timeline-item">
              <div className="toradol-timeline-time">1–2 hours</div>
              <div className="toradol-timeline-content">Peak effect. This is when you'll feel the most relief.</div>
            </div>
            <div className="toradol-timeline-item">
              <div className="toradol-timeline-time">4–6 hours</div>
              <div className="toradol-timeline-content">Relief continues. Effects typically last 4–6 hours total.</div>
            </div>
            <div className="toradol-timeline-item">
              <div className="toradol-timeline-time">24 hours</div>
              <div className="toradol-timeline-content">The medication has fully cleared your system.</div>
            </div>
          </div>
        </div>
      </section>

      {/* After Your Injection */}
      <section className="toradol-section">
        <div className="toradol-container">
          <div className="toradol-section-kicker">Aftercare</div>
          <h2 className="toradol-section-title">For the next 24 hours</h2>
          <p className="toradol-section-subtitle">A few simple things to keep in mind after your injection.</p>
          
          <div className="toradol-two-col">
            <div className="toradol-info-card">
              <h3>Do</h3>
              <ul className="toradol-info-list checks">
                <li>Stay hydrated—drink plenty of water</li>
                <li>Eat something if you haven't already</li>
                <li>Rest if you need to</li>
                <li>Resume normal activities as you feel able</li>
              </ul>
            </div>
            <div className="toradol-info-card">
              <h3>Avoid</h3>
              <ul className="toradol-info-list">
                <li>Alcohol for 24 hours</li>
                <li>Other NSAIDs (ibuprofen, naproxen, aspirin)</li>
                <li>Strenuous activity if you're still in pain</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Side Effects */}
      <section className="toradol-section toradol-section-gray">
        <div className="toradol-container">
          <div className="toradol-section-kicker">Side Effects</div>
          <h2 className="toradol-section-title">What's normal, what's not</h2>
          <p className="toradol-section-subtitle">Most people tolerate Toradol well. Here's what to watch for.</p>
          
          <div className="toradol-two-col">
            <div className="toradol-info-card">
              <h3>Normal (no concern)</h3>
              <ul className="toradol-info-list checks">
                <li>Soreness at the injection site</li>
                <li>Mild stomach discomfort</li>
                <li>Slight headache</li>
                <li>Mild dizziness</li>
              </ul>
            </div>
            <div className="toradol-info-card">
              <h3>Call us or seek care if you have</h3>
              <ul className="toradol-info-list">
                <li>Black or bloody stools</li>
                <li>Vomiting blood</li>
                <li>Severe stomach pain</li>
                <li>Chest pain or shortness of breath</li>
                <li>Swelling of face, lips, or throat</li>
                <li>Rash or hives</li>
              </ul>
            </div>
          </div>

          <div className="toradol-warning-box">
            <h4>When in doubt, reach out</h4>
            <p>If something doesn't feel right, call us. We'd rather hear from you and put your mind at ease than have you worry.</p>
          </div>
        </div>
      </section>

      {/* If Pain Returns */}
      <section className="toradol-section">
        <div className="toradol-container">
          <div className="toradol-section-kicker">If Pain Returns</div>
          <h2 className="toradol-section-title">Next steps for pain management</h2>
          <p className="toradol-section-subtitle">Toradol provides short-term relief. If your pain continues, here are your options.</p>
          
          <div className="toradol-two-col">
            <div className="toradol-info-card">
              <h3>At home</h3>
              <ul className="toradol-info-list checks">
                <li>Acetaminophen (Tylenol) is safe to take</li>
                <li>Ice or heat as appropriate</li>
                <li>Gentle stretching or movement</li>
                <li>Rest and elevation if needed</li>
              </ul>
            </div>
            <div className="toradol-info-card">
              <h3>Follow up with us</h3>
              <ul className="toradol-info-list checks">
                <li>Additional Toradol injection (if appropriate)</li>
                <li>Other pain management options</li>
                <li>Address the underlying cause</li>
                <li>Referral if needed</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="toradol-contact-section">
        <div className="toradol-container">
          <h2>Questions? We're here to help.</h2>
          <p>If you have any concerns after your injection, don't hesitate to reach out.</p>
          <div className="toradol-contact-info">
            <a href="tel:949-997-3988">949-997-3988</a>
            <span style={{ opacity: 0.5 }}>|</span>
            <span>1901 Westcliff Dr, Suite 10 · Newport Beach, CA</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="toradol-footer">
        <div className="toradol-container">
          <img src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/6933ae9e1d466e9b7dfb6b69.png" alt="Range Medical" />
          <p>© 2025 Range Medical. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
