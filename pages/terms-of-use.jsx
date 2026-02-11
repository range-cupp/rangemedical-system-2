import Layout from '../components/Layout';
import Head from 'next/head';

export default function TermsOfUsePage() {
  return (
    <Layout
      title="Terms of Use | Range Medical | Newport Beach"
      description="Terms of use for Range Medical. Review the terms and conditions governing your use of our website and services."
    >
      <Head>
        <link rel="canonical" href="https://www.range-medical.com/terms-of-use" />
      </Head>

      <div className="legal-page">
        <div className="legal-container">
          <h1>Terms of Use</h1>
          <p className="legal-effective">Effective Date: February 1, 2025</p>

          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Range Medical website (range-medical.com) and any related
              services, you agree to be bound by these Terms of Use. If you do not agree to these
              terms, please do not use our website or services.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Medical Disclaimer</h2>
            <p>
              The information provided on this website is for general informational and educational
              purposes only. It is not intended to be a substitute for professional medical advice,
              diagnosis, or treatment. Always seek the advice of your physician or other qualified
              health provider with any questions you may have regarding a medical condition.
            </p>
            <p>
              Never disregard professional medical advice or delay in seeking it because of something
              you have read on this website. If you think you may have a medical emergency, call your
              doctor, go to the nearest emergency department, or call 911 immediately.
            </p>
            <p>
              Range Medical does not recommend or endorse any specific tests, physicians, products,
              procedures, opinions, or other information that may be mentioned on this website.
              Reliance on any information provided by Range Medical, its employees, or other visitors
              to the website is solely at your own risk.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Use of Website</h2>
            <p>
              You agree to use this website only for lawful purposes and in a manner that does not
              infringe the rights of, or restrict or inhibit the use and enjoyment of, this website
              by any third party. You may not use this website to transmit any harmful, threatening,
              abusive, or otherwise objectionable material.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Intellectual Property</h2>
            <p>
              All content on this website — including text, graphics, logos, images, and software —
              is the property of Range Medical or its content suppliers and is protected by United
              States and international copyright, trademark, and other intellectual property laws.
              You may not reproduce, distribute, modify, or create derivative works from any content
              on this website without our prior written consent.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Online Assessments and Forms</h2>
            <p>
              Our website may offer online health assessments, intake forms, and other interactive
              tools. These tools are designed to help us understand your health goals and are not a
              substitute for an in-person medical evaluation. Submitting an assessment or form does
              not establish a physician–patient relationship. A physician–patient relationship is
              established only when you are formally accepted as a patient and seen by one of our
              licensed providers.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Third-Party Links</h2>
            <p>
              This website may contain links to third-party websites. These links are provided for
              your convenience only. Range Medical does not endorse or assume any responsibility for
              the content, privacy policies, or practices of any third-party websites.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, Range Medical and its officers,
              directors, employees, and agents shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising out of or related to your use of
              or inability to use this website or our services. This includes, without limitation,
              damages for loss of profits, data, or other intangible losses.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Range Medical, its officers,
              directors, employees, and agents from and against any claims, liabilities, damages,
              losses, or expenses arising out of your use of this website or violation of these
              Terms of Use.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Governing Law</h2>
            <p>
              These Terms of Use shall be governed by and construed in accordance with the laws of
              the State of California, without regard to its conflict of law provisions. Any disputes
              arising under these terms shall be subject to the exclusive jurisdiction of the courts
              located in Orange County, California.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Modifications</h2>
            <p>
              Range Medical reserves the right to modify these Terms of Use at any time. Changes
              will be effective immediately upon posting to this website. Your continued use of the
              website after any changes constitutes your acceptance of the revised terms. We
              encourage you to review this page periodically.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Use, please contact us:
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
