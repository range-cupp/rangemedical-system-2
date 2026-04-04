import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function CashPay() {
  return (
    <>
      <Head>
        <title>Cash-Pay Model | Range Medical</title>
        <meta name="description" content="Range Medical is a cash-pay clinic — no insurance accepted. Learn why we chose this model and how it benefits your care. HSA and FSA accepted." />
        <link rel="canonical" href="https://www.range-medical.com/cash-pay" />
      </Head>

      <Layout>
        <section className="cp-hero">
          <div className="cp-container">
            <div className="v2-label"><span className="v2-dot" /> How We Work</div>
            <h1>No Insurance.<br />On Purpose.</h1>
            <div className="cp-hero-rule" />
            <p className="cp-hero-sub">
              Range Medical is a cash-pay clinic. We don&apos;t accept insurance &mdash; and that&apos;s a deliberate
              choice that lets us give you better care.
            </p>
          </div>
        </section>

        <section className="cp-content">
          <div className="cp-container cp-narrow">
            <h2>Why Cash-Pay?</h2>
            <p className="cp-intro">
              Insurance-based clinics operate under a system that limits what providers can offer, how much time
              they can spend with you, and which treatments get approved. We built Range Medical outside of that
              system so we could focus on one thing: getting you results.
            </p>
            <p className="cp-intro">
              Here&apos;s what that means for you.
            </p>

            <div className="cp-detail">
              <div className="cp-detail-item">
                <span className="cp-num">01</span>
                <h3>More Time With Your Provider</h3>
                <p>
                  Insurance reimbursement pressures clinics to see as many patients as possible in a day. That
                  means shorter visits and rushed conversations. At Range Medical, your visits are longer, your
                  provider actually listens to the full picture, and your plan is built around you &mdash; not a
                  billing code.
                </p>
              </div>

              <div className="cp-detail-item">
                <span className="cp-num">02</span>
                <h3>Transparent Pricing</h3>
                <p>
                  You know what everything costs before you commit. No surprise bills, no co-pay confusion,
                  no &ldquo;we&apos;ll see what insurance covers.&rdquo; The price we quote is the price you pay.
                  If a treatment doesn&apos;t make sense for your budget, we&apos;ll tell you &mdash; and help you
                  find the best path forward within your means.
                </p>
              </div>

              <div className="cp-detail-item">
                <span className="cp-num">03</span>
                <h3>Better Treatment Options</h3>
                <p>
                  Many of the therapies we offer &mdash; peptides, hyperbaric oxygen, advanced lab panels, NAD+
                  infusions &mdash; aren&apos;t covered by insurance. Going cash-pay means we can offer what
                  actually works for your situation, not just what an insurance company decides to approve.
                  Your provider picks the right tools based on your labs, your symptoms, and your goals.
                </p>
              </div>

              <div className="cp-detail-item">
                <span className="cp-num">04</span>
                <h3>No Referrals, No Prior Auth, No Red Tape</h3>
                <p>
                  You don&apos;t need a referral to come see us. You don&apos;t need to wait for prior authorization.
                  If you and your provider agree on a plan, we start. It&apos;s that simple.
                </p>
              </div>

              <div className="cp-detail-item">
                <span className="cp-num">05</span>
                <h3>HSA & FSA Accepted</h3>
                <p>
                  You can use your Health Savings Account (HSA) or Flexible Spending Account (FSA) for any of our
                  services. Same card, same process &mdash; just swipe it like a credit card. Many of our patients
                  use pre-tax health dollars to cover their care.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="container">
            <h2>Ready to Get<br />Started?</h2>
            <div className="cta-rule" />
            <p>Take the Range Assessment &mdash; it&apos;s free for injury recovery, or starts at $350 for labs.</p>
            <div className="cta-buttons">
              <Link href="/range-assessment?path=injury&from=start" className="btn-white">
                Injury & Recovery
              </Link>
              <Link href="/range-assessment" style={{
                display: 'inline-block', background: 'transparent', color: '#ffffff',
                padding: '0.875rem 2rem', fontWeight: 700,
                fontSize: '11px', textDecoration: 'none', letterSpacing: '0.12em',
                border: '1px solid #404040', textTransform: 'uppercase',
                transition: 'all 0.2s'
              }}>
                Energy, Hormones & Weight Loss
              </Link>
            </div>
            <p className="cta-location">
              Range Medical &bull; 1901 Westcliff Dr, Newport Beach
            </p>
          </div>
        </section>
      </Layout>

      <style jsx>{`
        .cp-hero {
          padding: 5rem 2rem 4rem;
        }

        .cp-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .cp-narrow {
          max-width: 800px;
        }

        .cp-hero h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 1rem 0 0;
          color: #1a1a1a;
        }

        .cp-hero-rule {
          width: 3rem;
          height: 3px;
          background: #1a1a1a;
          margin: 2rem 0;
        }

        .cp-hero-sub {
          font-size: 1.0625rem;
          color: #525252;
          line-height: 1.7;
          max-width: 600px;
          margin: 0;
        }

        .cp-content {
          padding: 0 2rem 5rem;
        }

        .cp-content h2 {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 0 0 1.5rem;
          color: #1a1a1a;
        }

        .cp-intro {
          font-size: 1rem;
          color: #525252;
          line-height: 1.8;
          margin: 0 0 1.25rem;
        }

        .cp-detail {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          margin-top: 3rem;
        }

        .cp-detail-item {
          padding-bottom: 2.5rem;
          border-bottom: 1px solid #e8e8e8;
        }

        .cp-detail-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .cp-num {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: #a0a0a0;
          display: block;
          margin-bottom: 0.75rem;
        }

        .cp-detail-item h3 {
          font-size: 1.25rem;
          font-weight: 800;
          margin: 0 0 0.75rem;
          color: #1a1a1a;
        }

        .cp-detail-item p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.8;
          margin: 0;
        }

        @media (max-width: 640px) {
          .cp-hero {
            padding: 3rem 1.5rem 2.5rem;
          }

          .cp-content {
            padding: 0 1.5rem 3rem;
          }
        }
      `}</style>
    </>
  );
}
