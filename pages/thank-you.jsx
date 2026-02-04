import Layout from '../components/Layout';
import Head from 'next/head';
import Link from 'next/link';

export default function ThankYou() {
  return (
    <Layout>
      <Head>
        <title>Thank You | Range Medical</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <section className="ty-hero">
        <div className="ty-container">
          <div className="ty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h1>You're All Set!</h1>
          <p className="ty-subtitle">
            Your payment was successful. We're excited to help you feel like yourself again.
          </p>
        </div>
      </section>

      <section className="ty-content">
        <div className="ty-container">
          <div className="ty-card">
            <h2>What Happens Next</h2>
            <div className="ty-steps">
              <div className="ty-step">
                <div className="ty-step-num">1</div>
                <div>
                  <h3>We'll Call You</h3>
                  <p>Our team will reach out within 1 business day to schedule your appointment.</p>
                </div>
              </div>
              <div className="ty-step">
                <div className="ty-step-num">2</div>
                <div>
                  <h3>Come In For Your Blood Draw</h3>
                  <p>Visit our Newport Beach office. We recommend fasting 10-12 hours before your visit.</p>
                </div>
              </div>
              <div className="ty-step">
                <div className="ty-step-num">3</div>
                <div>
                  <h3>Get Your Results</h3>
                  <p>Your provider will go over everything with you and create a plan just for you.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="ty-info">
            <div className="ty-info-card">
              <h3>Questions?</h3>
              <p>Give us a call anytime</p>
              <a href="tel:9499973988" className="ty-phone">(949) 997-3988</a>
            </div>
            <div className="ty-info-card">
              <h3>Our Location</h3>
              <p>
                Range Medical<br />
                1901 Westcliff Dr, Suite 10<br />
                Newport Beach, CA 92660
              </p>
              <a
                href="https://maps.google.com/?q=1901+Westcliff+Dr+Suite+10+Newport+Beach+CA+92660"
                target="_blank"
                rel="noopener noreferrer"
                className="ty-directions"
              >
                Get Directions
              </a>
            </div>
          </div>

          <div className="ty-cta">
            <Link href="/" className="ty-home-btn">
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .ty-hero {
          background: #fafafa;
          padding: 5rem 1.5rem;
          text-align: center;
        }

        .ty-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .ty-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          background: #22c55e;
          border-radius: 50%;
          margin-bottom: 1.5rem;
        }

        .ty-icon svg {
          stroke: #ffffff;
        }

        .ty-hero h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 1rem;
          color: #171717;
        }

        .ty-subtitle {
          font-size: 1.25rem;
          color: #525252;
          margin: 0;
          max-width: 500px;
          margin: 0 auto;
        }

        .ty-content {
          padding: 4rem 1.5rem;
          background: #ffffff;
        }

        .ty-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          margin-bottom: 2rem;
        }

        .ty-card h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 2rem;
          color: #171717;
        }

        .ty-steps {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .ty-step {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
        }

        .ty-step-num {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
        }

        .ty-step h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.25rem;
          color: #171717;
        }

        .ty-step p {
          font-size: 0.95rem;
          color: #525252;
          margin: 0;
          line-height: 1.5;
        }

        .ty-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .ty-info-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }

        .ty-info-card h3 {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #737373;
          margin: 0 0 0.5rem;
        }

        .ty-info-card p {
          font-size: 0.95rem;
          color: #171717;
          margin: 0 0 0.75rem;
          line-height: 1.5;
        }

        .ty-phone {
          font-size: 1.25rem;
          font-weight: 700;
          color: #000000;
          text-decoration: none;
        }

        .ty-phone:hover {
          text-decoration: underline;
        }

        .ty-directions {
          display: inline-block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #000000;
          text-decoration: underline;
        }

        .ty-cta {
          text-align: center;
        }

        .ty-home-btn {
          display: inline-block;
          background: #000000;
          color: #ffffff;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.2s;
        }

        .ty-home-btn:hover {
          background: #333333;
        }

        @media (max-width: 640px) {
          .ty-hero {
            padding: 3rem 1.5rem;
          }

          .ty-hero h1 {
            font-size: 2rem;
          }

          .ty-subtitle {
            font-size: 1.1rem;
          }

          .ty-card {
            padding: 1.5rem;
          }

          .ty-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}
