import Layout from '../components/Layout';
import Head from 'next/head';

export default function RefundPolicyPage() {
  return (
    <Layout
      title="Refund Policy | Range Medical | Newport Beach"
      description="Refund policy for Range Medical. Understand our policies on consultations, services, medications, and package credits."
    >
      <Head>
        <link rel="canonical" href="https://www.range-medical.com/refund-policy" />
      </Head>

      <div className="legal-page">
        <div className="legal-container">
          <h1>Refund Policy</h1>
          <p className="legal-effective">Effective Date: February 1, 2025</p>

          <section className="legal-section">
            <p>
              At Range Medical, we are committed to providing high-quality medical services and
              an exceptional patient experience. Please review our refund policy below so you
              understand our policies before purchasing services or products.
            </p>
          </section>

          <section className="legal-section">
            <h2>1. Consultations and Services</h2>
            <p>
              All consultations, medical services, and treatments that have been rendered are
              non-refundable. This includes, but is not limited to, office visits, lab work, IV
              therapy sessions, hyperbaric oxygen sessions, red light therapy sessions, PRP and
              exosome treatments, and any other in-clinic services.
            </p>
            <p>
              Once a service has been performed, it cannot be reversed, and therefore no refund
              will be issued.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Medications and Supplements</h2>
            <p>
              Prescription medications, peptides, supplements, and other products that have been
              dispensed or compounded for you are non-refundable. Due to health and safety
              regulations, we cannot accept returns on any medications or supplements once they
              have left our facility.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Service Packages</h2>
            <p>
              If you have purchased a package of services and have unused sessions remaining, you
              may be eligible for account credit toward future services at the discretion of Range
              Medical. Package credits are non-transferable and have no cash value. Please contact
              our office to discuss your options.
            </p>
            <p>
              Packages and memberships may not be refunded once any portion of the package has
              been used.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Cancellations and No-Shows</h2>
            <p>
              We ask that you provide at least 24 hours' notice if you need to cancel or
              reschedule an appointment. Missed appointments or late cancellations may be subject
              to a cancellation fee. Repeated no-shows may result in a requirement to prepay for
              future appointments.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Billing Disputes</h2>
            <p>
              If you believe there has been a billing error, please contact our office within 30
              days of the charge. We will review your account and work with you to resolve any
              discrepancies promptly.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Contact Us</h2>
            <p>
              If you have any questions about this Refund Policy or would like to discuss your
              account, please contact us:
            </p>
            <p className="legal-contact">
              Range Medical<br />
              1901 Westcliff Dr. Suite 10<br />
              Newport Beach, CA 92660<br />
              Phone: <a href="tel:9499973988">(949) 997-3988</a>
            </p>
          </section>
        </div>
      </div>

      <style jsx>{`
        .legal-page {
          padding: 4rem 1.5rem 5rem;
          background: #ffffff;
        }

        .legal-container {
          max-width: 760px;
          margin: 0 auto;
        }

        .legal-container h1 {
          font-size: 2.25rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 0.5rem;
        }

        .legal-effective {
          font-size: 0.9375rem;
          color: #737373;
          margin: 0 0 2.5rem;
        }

        .legal-section {
          margin-bottom: 2rem;
        }

        .legal-section h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 0.75rem;
        }

        .legal-section p {
          font-size: 1rem;
          color: #404040;
          line-height: 1.75;
          margin: 0 0 1rem;
        }

        .legal-section p:last-child {
          margin-bottom: 0;
        }

        .legal-contact {
          line-height: 2 !important;
        }

        .legal-contact a {
          color: #171717;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .legal-contact a:hover {
          color: #000000;
        }

        @media (max-width: 640px) {
          .legal-page {
            padding: 2.5rem 1.25rem 3.5rem;
          }

          .legal-container h1 {
            font-size: 1.75rem;
          }

          .legal-section h2 {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </Layout>
  );
}
