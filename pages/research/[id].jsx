import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getStudyById, researchStudies } from '../../data/researchStudies';

const SERVICE_LABELS = {
  'red-light-therapy': 'Red Light Therapy',
  'hormone-optimization': 'Hormone Optimization',
  'hyperbaric-oxygen-therapy': 'Hyperbaric Oxygen Therapy',
  'peptide-therapy': 'Peptide Therapy',
  'iv-therapy': 'IV Therapy',
  'nad-therapy': 'NAD+ Therapy',
  'weight-loss': 'Weight Loss',
  'prp-therapy': 'PRP Therapy',
  'exosome-therapy': 'Exosome Therapy',
  'injury-recovery': 'Injury Recovery',
  'energy-optimization': 'Energy Optimization'
};

export async function getServerSideProps({ params }) {
  const study = getStudyById(params.id);
  if (!study) return { notFound: true };
  return { props: { study: JSON.parse(JSON.stringify(study)) } };
}

export default function ResearchStudy({ study }) {
  const router = useRouter();

  if (!study) return null;

  const serviceLabel = SERVICE_LABELS[study.service] || study.service;
  const serviceHref = `/${study.service}`;

  return (
    <Layout
      title={`${study.headline} | Range Medical Research`}
      description={study.summary}
    >
      <Head>
        <meta property="og:title" content={`${study.headline} | Range Medical`} />
        <meta property="og:description" content={study.summary} />
        <meta property="og:type" content="article" />
      </Head>

      <div className="research-page">
        <div className="research-container">

          <div className="research-back">
            <Link href={serviceHref}>
              <span className="research-back-arrow">&larr;</span> Back to {serviceLabel}
            </Link>
          </div>

          <div className="research-badge">{study.category}</div>

          <h1 className="research-title">{study.headline}</h1>

          <p className="research-source">
            {study.sourceJournal}, {study.sourceYear}
          </p>

          <div className="research-divider" />

          <div className="research-body">
            {study.fullSummary.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className="research-findings">
            <h2>Key Findings</h2>
            <ul>
              {study.keyFindings.map((finding, i) => (
                <li key={i}>
                  <span className="research-check">&#10003;</span>
                  {finding}
                </li>
              ))}
            </ul>
          </div>

          <div className="research-means">
            <h2>What This Means for You</h2>
            <p>{study.whatThisMeans}</p>
          </div>

          <div className="research-cta">
            <p>Interested in how this could help you?</p>
            <Link href="/assessment" className="research-cta-btn">
              Book Your Range Assessment
            </Link>
            <a href="tel:9499973988" className="research-cta-phone">(949) 997-3988</a>
          </div>

          <div className="research-disclaimer">
            These studies reflect clinical research findings. Individual results may vary. All treatments at Range Medical are provided under medical supervision.
          </div>

        </div>
      </div>

      <style jsx>{`
        .research-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          padding: 3rem 1.5rem 4rem;
          background: #fff;
          min-height: 60vh;
        }

        .research-container {
          max-width: 720px;
          margin: 0 auto;
        }

        .research-back {
          margin-bottom: 2rem;
        }

        .research-back a,
        .research-back :global(a) {
          font-size: 0.875rem;
          color: #737373;
          text-decoration: none;
          transition: color 0.2s;
        }

        .research-back a:hover,
        .research-back :global(a:hover) {
          color: #171717;
        }

        .research-back-arrow {
          margin-right: 0.25rem;
        }

        .research-badge {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #fff;
          background: #171717;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .research-title {
          font-size: 2rem;
          font-weight: 800;
          color: #171717;
          line-height: 1.2;
          margin: 0 0 0.75rem;
        }

        .research-source {
          font-size: 0.9375rem;
          color: #737373;
          font-style: italic;
          margin: 0 0 1.5rem;
        }

        .research-divider {
          height: 1px;
          background: #e5e5e5;
          margin-bottom: 2rem;
        }

        .research-body p {
          font-size: 1.0625rem;
          color: #404040;
          line-height: 1.75;
          margin: 0 0 1.25rem;
        }

        .research-findings {
          background: #fafafa;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          margin: 2.5rem 0;
        }

        .research-findings h2 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 1.25rem;
        }

        .research-findings ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .research-findings li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 1rem;
          color: #404040;
          line-height: 1.6;
          margin-bottom: 0.75rem;
        }

        .research-findings li:last-child {
          margin-bottom: 0;
        }

        .research-check {
          color: #22c55e;
          font-weight: 700;
          font-size: 1.125rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .research-means {
          margin: 2.5rem 0;
        }

        .research-means h2 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 0.75rem;
        }

        .research-means p {
          font-size: 1.0625rem;
          color: #404040;
          line-height: 1.75;
          margin: 0;
        }

        .research-cta {
          text-align: center;
          padding: 2.5rem 2rem;
          background: #171717;
          border-radius: 12px;
          margin: 2.5rem 0;
        }

        .research-cta p {
          font-size: 1.0625rem;
          color: #a3a3a3;
          margin: 0 0 1.25rem;
        }

        .research-cta-btn,
        .research-cta :global(.research-cta-btn) {
          display: inline-block;
          padding: 0.875rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          background: #fff;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .research-cta-btn:hover,
        .research-cta :global(.research-cta-btn:hover) {
          background: #f5f5f5;
          transform: translateY(-1px);
        }

        .research-cta-phone {
          display: block;
          margin-top: 1rem;
          font-size: 0.9375rem;
          color: #737373;
          text-decoration: none;
        }

        .research-cta-phone:hover {
          color: #a3a3a3;
        }

        .research-disclaimer {
          font-size: 0.8125rem;
          color: #a3a3a3;
          line-height: 1.6;
          text-align: center;
          padding-top: 1rem;
        }

        @media (max-width: 640px) {
          .research-page {
            padding: 2rem 1rem 3rem;
          }

          .research-title {
            font-size: 1.5rem;
          }

          .research-findings {
            padding: 1.5rem;
          }

          .research-cta {
            padding: 2rem 1.25rem;
          }
        }
      `}</style>
    </Layout>
  );
}
