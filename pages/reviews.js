import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

const reviews = [
  {
    name: "Mark Taylor",
    date: "January 2026",
    rating: 5,
    text: "I recently experienced a shoulder injury and scheduled a few PT appointments with Aaron Berger at Range. When I asked about peptides to help fast-track my recovery, he personally walked me upstairs and introduced me to the team at Range Medical. After having a great experience with BPC, I returned for a full panel of blood work. The process was far more enjoyable than going to Quest, and well worth the small additional cost. My labs were thoroughly reviewed, clearly explained, and a thoughtful health plan was put in place. From start to finish, the entire experience was professional, efficient, and genuinely personalized.",
    highlight: "Labs thoroughly reviewed, clearly explained, and a thoughtful health plan was put in place."
  },
  {
    name: "Jessica Ryan",
    date: "October 2025",
    badge: "Local Guide",
    rating: 5,
    text: "Another incredible offering by Dr G! Range Medical has been an integral part of my healing journey. I noticed significant improvement shortly after starting recovery peptides. I also tried peptides from other facilities and the quality was just not the same — at Range, my results are consistent and I trust the quality and providers. The facility is absolutely beautiful and I'm excited to try more modalities they offer, especially NAD, hyperbaric oxygen chamber and red light. All of the providers are friendly, incredibly knowledgeable and go above and beyond to make the experience seamless. Thank you for everything you do!",
    highlight: "My results are consistent and I trust the quality and providers."
  },
  {
    name: "Pierre Rogers",
    date: "October 2025",
    badge: "Local Guide",
    rating: 5,
    text: "Personally my favorite reason to go here is that the people are generous with their time and information. They take the time to speak with you regarding all the treatment options so you can make an informed decision. No pushy sales people, real face time with people who understand all the options. I hadn't made my personal wellness seriously for a long time and they helped me get back on track.",
    highlight: "No pushy sales people, real face time with people who understand all the options."
  },
  {
    name: "Christopher Barton",
    date: "September 2025",
    badge: "Local Guide",
    rating: 5,
    text: "Range Medical is fantastic! Nurse Lilly was kind, professional, and made me feel so comfortable. Chris was extremely knowledgeable and thorough, making the whole process smooth and stress-free. Highly recommend this team!",
    highlight: "The whole process was smooth and stress-free."
  },
  {
    name: "Josh",
    date: "September 2025",
    rating: 5,
    text: "Range Medical offers outstanding care and treatment's, the whole team is doing an incredible job. Thank You!!",
    highlight: "Outstanding care and treatments."
  },
  {
    name: "Funnybuddy_kawaii",
    date: "September 2025",
    rating: 5,
    text: "Range medical is just the absolute best. I was interested in peptides but didn't know much about it and Dr. Burgess went over everything with me and recommended exactly what I needed. Lilly is amazing and chris is so great knowledgeable. I feel the best I ever have I would 10 out of 10 recommend!",
    highlight: "I feel the best I ever have."
  },
  {
    name: "Willie McNeal",
    date: "September 2025",
    rating: 5,
    text: "Honest, patient and funny staff. Super professional, I never real rushed or pressured to do or try anything I'm not sure about. It's been almost two months and I feel amazing already, and I'm packing on more muscle, and noticing an improvement in my recovery. These guys (and gals) are legit.",
    highlight: "I never feel rushed or pressured."
  },
  {
    name: "Gabriel Odisho",
    date: "September 2025",
    rating: 5,
    text: "The team at Range medical are amazing and helped guide me on recommendations after my knee surgeries. It's been a game changer on my knee recover, and I always enjoy going in.",
    highlight: "A game changer on my knee recovery."
  },
  {
    name: "Riley Robertson",
    date: "September 2025",
    rating: 5,
    text: "Can't say enough good things about the people, the experience and overall how effective the team is. They helped me recover 2 months ahead of schedule from a heel/ankle injury. Thank you guys again so much, you're the best!",
    highlight: "Recovered 2 months ahead of schedule."
  }
];

export default function ReviewsPage() {
  return (
    <Layout 
      title="Patient Reviews | Range Medical | Newport Beach"
      description="Read what our patients say about Range Medical. 5-star reviews for hormone optimization, peptide therapy, weight loss, and wellness treatments in Newport Beach, CA."
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Range Medical",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "9",
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
        />
      </Head>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Patient Reviews</span>
          <h1>What Our Patients Say</h1>
          <p className="hero-sub">Real results from real people. Here's what our patients have to say about their experience at Range Medical.</p>
          
          <div className="rating-summary">
            <div className="stars">★★★★★</div>
            <div className="rating-text">5.0 rating · 9 reviews on Google</div>
          </div>
        </div>
      </section>

      {/* Featured Quote */}
      <section className="section section-dark">
        <div className="container">
          <div className="featured-quote">
            <blockquote>
              "From start to finish, the entire experience was professional, efficient, and genuinely personalized."
            </blockquote>
            <cite>— Mark Taylor</cite>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Real Patient Experiences</div>
          <h2 className="section-title">Reviews from Google</h2>
          <p className="section-subtitle">Every review is from a verified patient on our Google Business Profile.</p>
          
          <div className="reviews-grid">
            {reviews.map((review, index) => (
              <article key={index} className="review-card">
                <div className="review-header">
                  <div className="review-avatar">
                    {review.name.charAt(0)}
                  </div>
                  <div className="review-meta">
                    <h3 className="review-name">{review.name}</h3>
                    <div className="review-info">
                      {review.badge && <span className="review-badge">{review.badge}</span>}
                      <span className="review-date">{review.date}</span>
                    </div>
                  </div>
                </div>
                <div className="review-stars">★★★★★</div>
                <p className="review-text">{review.text}</p>
                {review.highlight && (
                  <div className="review-highlight">
                    "{review.highlight}"
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="google-link">
            <a 
              href="https://www.google.com/search?q=Range+Medical+Newport+Beach" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-outline"
            >
              See All Reviews on Google →
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section section-gray">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">5.0</div>
              <div className="stat-label">Google Rating</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">5-Star Reviews</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">834</div>
              <div className="stat-label">Customer Interactions</div>
            </div>
          </div>
        </div>
      </section>

      {/* What Patients Love */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Common Themes</div>
          <h2 className="section-title">What Patients Love About Range</h2>
          
          <div className="themes-grid">
            <div className="theme-card">
              <div className="theme-icon">🧬</div>
              <h4>Quality Results</h4>
              <p>"My results are consistent and I trust the quality and providers."</p>
            </div>
            <div className="theme-card">
              <div className="theme-icon">💬</div>
              <h4>No Pressure</h4>
              <p>"No pushy sales people, real face time with people who understand all the options."</p>
            </div>
            <div className="theme-card">
              <div className="theme-icon">📋</div>
              <h4>Thorough Explanations</h4>
              <p>"Labs were thoroughly reviewed, clearly explained, and a thoughtful health plan was put in place."</p>
            </div>
            <div className="theme-card">
              <div className="theme-icon">⚡</div>
              <h4>Faster Recovery</h4>
              <p>"They helped me recover 2 months ahead of schedule from a heel/ankle injury."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to Experience the Difference?</h2>
          <p>Start with a Range Assessment — labs, symptoms review, and a written plan in under a week.</p>
          <div className="hero-buttons">
            <Link href="/range-assessment" className="btn-primary">
              Start with a Range Assessment
            </Link>
          </div>
          <p className="hero-secondary">
            Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a>
          </p>
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
          background: #000;
          color: #fff;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .hero h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          color: #171717;
        }

        .hero-sub {
          font-size: 1.125rem;
          color: #525252;
          max-width: 600px;
          margin: 0 auto 2rem;
          line-height: 1.6;
        }

        .rating-summary {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .stars {
          font-size: 2rem;
          color: #000;
          letter-spacing: 0.1em;
        }

        .rating-text {
          font-size: 1rem;
          color: #525252;
          font-weight: 500;
        }

        .section {
          padding: 4rem 1.5rem;
        }

        .section-gray {
          background: #fafafa;
        }

        .section-dark {
          background: #000;
          color: #fff;
          padding: 4rem 1.5rem;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          text-align: center;
          margin-bottom: 0.75rem;
          color: #171717;
        }

        .section-subtitle {
          font-size: 1.0625rem;
          color: #525252;
          text-align: center;
          max-width: 600px;
          margin: 0 auto 2.5rem;
          line-height: 1.6;
        }

        .featured-quote {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .featured-quote blockquote {
          font-size: 1.75rem;
          font-weight: 500;
          line-height: 1.4;
          margin-bottom: 1.5rem;
          color: #fff;
        }

        .featured-quote cite {
          font-size: 1rem;
          color: rgba(255,255,255,0.7);
          font-style: normal;
        }

        .reviews-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .review-card {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
          transition: all 0.2s;
        }

        .review-card:hover {
          border-color: #000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .review-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .review-avatar {
          width: 48px;
          height: 48px;
          background: #000;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .review-meta {
          flex: 1;
        }

        .review-name {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: #171717;
        }

        .review-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: #737373;
        }

        .review-badge {
          background: #f5f5f5;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .review-stars {
          color: #000;
          font-size: 1rem;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .review-text {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .review-highlight {
          font-size: 0.875rem;
          font-weight: 600;
          color: #171717;
          padding: 0.75rem 1rem;
          background: #fafafa;
          border-radius: 8px;
          border-left: 3px solid #000;
        }

        .google-link {
          text-align: center;
        }

        .btn-outline {
          display: inline-block;
          background: transparent;
          border: 2px solid #000;
          color: #000;
          padding: 0.875rem 2rem;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          background: #000;
          color: #fff;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          color: #171717;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.9375rem;
          color: #737373;
          font-weight: 500;
        }

        .themes-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .theme-card {
          background: #fafafa;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }

        .theme-icon {
          font-size: 2rem;
          margin-bottom: 0.75rem;
        }

        .theme-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #171717;
        }

        .theme-card p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.6;
          font-style: italic;
        }

        .final-cta {
          background: #fafafa;
          padding: 4rem 1.5rem;
          text-align: center;
          border-top: 1px solid #e5e5e5;
        }

        .final-cta h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #171717;
        }

        .final-cta p {
          font-size: 1.0625rem;
          color: #525252;
          margin-bottom: 2rem;
        }

        .hero-buttons {
          margin-bottom: 1rem;
        }

        .btn-primary {
          display: inline-block;
          background: #000;
          color: #fff;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #262626;
          transform: translateY(-1px);
        }

        .hero-secondary {
          font-size: 0.9375rem;
          color: #737373;
        }

        .hero-secondary a {
          color: #171717;
          font-weight: 600;
          text-decoration: none;
        }

        .hero-secondary a:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .hero h1 {
            font-size: 2rem;
          }

          .reviews-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
          }

          .stat-number {
            font-size: 2rem;
          }

          .themes-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .featured-quote blockquote {
            font-size: 1.25rem;
          }
        }

        @media (max-width: 640px) {
          .themes-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
