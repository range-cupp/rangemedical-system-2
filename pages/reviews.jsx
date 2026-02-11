import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

const reviews = [
  {
    name: "Mark T.",
    date: "January 2026",
    rating: 5,
    text: "I recently experienced a shoulder injury and scheduled a few PT appointments with Aaron Berger at Range. When I asked about peptides to help fast-track my recovery, he personally walked me upstairs and introduced me to the team at Range Medical. After having a great experience with BPC, I returned for a full panel of blood work. The process was far more enjoyable than going to Quest, and well worth the small additional cost. My labs were thoroughly reviewed, clearly explained, and a thoughtful health plan was put in place. From start to finish, the entire experience was professional, efficient, and genuinely personalized.",
    highlight: "Labs thoroughly reviewed, clearly explained, and a thoughtful health plan was put in place."
  },
  {
    name: "Jessica R.",
    date: "October 2025",
    badge: "Local Guide",
    rating: 5,
    text: "Range Medical has been an integral part of my healing journey. I noticed significant improvement shortly after starting recovery peptides. I also tried peptides from other facilities and the quality was just not the same — at Range, my results are consistent and I trust the quality and providers. The facility is absolutely beautiful and I'm excited to try more modalities they offer, especially NAD, hyperbaric oxygen chamber and red light. All of the providers are friendly, incredibly knowledgeable and go above and beyond to make the experience seamless.",
    highlight: "My results are consistent and I trust the quality and providers."
  },
  {
    name: "Pierre R.",
    date: "October 2025",
    badge: "Local Guide",
    rating: 5,
    text: "Personally my favorite reason to go here is that the people are generous with their time and information. They take the time to speak with you regarding all the treatment options so you can make an informed decision. No pushy sales people, real face time with people who understand all the options.",
    highlight: "No pushy sales people, real face time with people who understand all the options."
  },
  {
    name: "Patrick C.",
    date: "October 2025",
    rating: 5,
    text: "Love the team and love the facility. Amazing people that take the time to explain everything, answer questions and help you make decisions that best suit your health goals. Range Medical and Range Sports Therapy are the perfect complements to one another - highly recommend.",
    highlight: "Amazing people that take the time to explain everything."
  },
  {
    name: "Jennafer C.",
    date: "October 2025",
    rating: 5,
    text: "Range Medical has been a game changer for me! It's so nice to have a team of experts who actually listen and work with you to create a personalized plan. I've been doing recovery peptides and have already noticed such a difference in how I feel. Highly recommend checking them out!",
    highlight: "A team of experts who actually listen and work with you."
  },
  {
    name: "Danny R.",
    date: "September 2025",
    rating: 5,
    text: "The team at Range Medical is awesome. They're knowledgeable about health optimization and make the process easy. Got my labs done there and had a great experience overall. Definitely recommend.",
    highlight: "Knowledgeable about health optimization and make the process easy."
  },
  {
    name: "Sarah M.",
    date: "September 2025",
    rating: 5,
    text: "Such a great experience from start to finish. The staff is incredibly welcoming and the facility is beautiful. I came in for labs and consultation and felt like I was really heard. They took the time to go through everything with me.",
    highlight: "I felt like I was really heard."
  },
  {
    name: "Michael B.",
    date: "August 2025",
    rating: 5,
    text: "Best medical experience I've had. No rushed appointments, no feeling like just another number. They genuinely care about helping you optimize your health. The peptide protocols have been excellent for my recovery.",
    highlight: "No rushed appointments, no feeling like just another number."
  },
  {
    name: "Chris L.",
    date: "August 2025",
    rating: 5,
    text: "Five stars all around. Professional team, clean modern facility, and they really know their stuff when it comes to hormones and peptides. Glad I found Range Medical.",
    highlight: "They really know their stuff when it comes to hormones and peptides."
  }
];

export default function ReviewsPage() {
  const averageRating = 5.0;
  const totalReviews = reviews.length;

  return (
    <Layout 
      title="Patient Reviews | Range Medical | Newport Beach"
      description="Read what our patients say about Range Medical. 5-star rated health optimization clinic in Newport Beach. Real reviews from real patients."
    >
      <Head>
        <meta name="keywords" content="Range Medical reviews, Newport Beach doctor reviews, hormone therapy reviews, peptide therapy reviews, patient testimonials" />
        <link rel="canonical" href="https://www.range-medical.com/reviews" />
        <meta property="og:title" content="Patient Reviews | Range Medical" />
        <meta property="og:description" content="Read what our patients say about Range Medical. 5-star rated health optimization clinic in Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/reviews" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Range Medical",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": averageRating,
                "reviewCount": totalReviews,
                "bestRating": 5
              }
            })
          }}
        />
      </Head>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="section-kicker">Patient Reviews</div>
          <h1>What Our Patients Say</h1>
          <p className="hero-sub">
            Real experiences from real patients. See why Newport Beach trusts Range Medical 
            for health optimization, hormone therapy, and recovery.
          </p>
          
          <div className="rating-box">
            <div className="rating-score">{averageRating}</div>
            <div className="rating-info">
              <div className="stars">★★★★★</div>
              <p>Based on {totalReviews} Google Reviews</p>
            </div>
          </div>

          <a 
            href="https://www.google.com/maps/place/Range+Medical/@33.6234,-117.9298,17z" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Leave Us a Review
          </a>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="section">
        <div className="container">
          <div className="reviews-list">
            {reviews.map((review, index) => (
              <div key={index} className="review-card">
                <div className="review-header">
                  <div className="review-avatar">
                    {review.name.charAt(0)}
                  </div>
                  <div className="review-meta">
                    <h3 className="review-name">
                      {review.name}
                      {review.badge && <span className="review-badge">{review.badge}</span>}
                    </h3>
                    <div className="review-date-stars">
                      <span className="review-date">{review.date}</span>
                      <span className="review-stars">★★★★★</span>
                    </div>
                  </div>
                </div>
                
                {review.highlight && (
                  <blockquote className="review-highlight">
                    "{review.highlight}"
                  </blockquote>
                )}
                
                <p className="review-text">{review.text}</p>
              </div>
            ))}
          </div>

          <div className="google-cta">
            <p>Want to share your experience?</p>
            <a 
              href="https://www.google.com/maps/place/Range+Medical/@33.6234,-117.9298,17z" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Write a Google Review
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
              <div className="stat-label">Average Rating</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">5-Star Reviews</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Patients Treated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">Next Step</span>
          <h2>Ready to Feel Like Yourself Again?</h2>
          <p>Join our patients who have transformed their health with Range Medical.</p>
          <Link href="/range-assessment" className="btn-white">
            Take Your Assessment
          </Link>
          <p className="cta-location">
            1901 Westcliff Dr. Suite 10, Newport Beach
          </p>
        </div>
      </section>

      <style jsx>{`
        .hero {
          padding: 4rem 1.5rem 3rem;
          text-align: center;
          background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
        }

        .hero h1 {
          color: #171717;
          margin-bottom: 1rem;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-sub {
          font-size: 1.125rem;
          color: #525252;
          max-width: 600px;
          margin: 0 auto 2rem;
          line-height: 1.7;
        }

        .rating-box {
          display: inline-flex;
          align-items: center;
          gap: 1.25rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.25rem 2rem;
          margin-bottom: 2rem;
        }

        .rating-score {
          font-size: 3rem;
          font-weight: 700;
          color: #171717;
          line-height: 1;
        }

        .rating-info {
          text-align: left;
        }

        .stars {
          color: #000000;
          font-size: 1.25rem;
          letter-spacing: 2px;
          margin-bottom: 0.25rem;
        }

        .rating-info p {
          font-size: 0.875rem;
          color: #737373;
          margin: 0;
        }

        /* Reviews List */
        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .review-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
          transition: all 0.2s;
        }

        .review-card:hover {
          border-color: #000000;
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
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
          flex-shrink: 0;
        }

        .review-meta {
          flex: 1;
        }

        .review-name {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 0.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .review-badge {
          font-size: 0.6875rem;
          background: #f5f5f5;
          color: #525252;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .review-date-stars {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .review-date {
          font-size: 0.8125rem;
          color: #737373;
        }

        .review-stars {
          color: #000000;
          font-size: 0.875rem;
          letter-spacing: 1px;
        }

        .review-highlight {
          background: #fafafa;
          border-left: 3px solid #000000;
          padding: 1rem 1.25rem;
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-style: italic;
          color: #171717;
          line-height: 1.6;
        }

        .review-text {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        .google-cta {
          text-align: center;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e5e5;
        }

        .google-cta p {
          font-size: 0.9375rem;
          color: #525252;
          margin-bottom: 1rem;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }

        .stat-item {
          padding: 1.5rem;
        }

        .stat-number {
          font-size: 2.5rem;
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

        /* Final CTA - Override global colors */
        .final-cta {
          background: #000000;
          padding: 4rem 1.5rem;
          text-align: center;
        }

        .final-cta h2 {
          color: #ffffff;
          margin-bottom: 0.75rem;
        }

        .final-cta .container > p {
          color: rgba(255,255,255,0.8);
          margin-bottom: 2rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
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

        .cta-location {
          margin-top: 1.5rem;
          color: rgba(255,255,255,0.6) !important;
          font-size: 0.9375rem;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .rating-box {
            flex-direction: column;
            text-align: center;
            padding: 1.5rem;
          }

          .rating-info {
            text-align: center;
          }

          .review-card {
            padding: 1.25rem;
          }

          .review-header {
            flex-direction: column;
            text-align: center;
          }

          .review-meta {
            text-align: center;
          }

          .review-name {
            justify-content: center;
          }

          .review-date-stars {
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .stat-number {
            font-size: 2rem;
          }
        }
      `}</style>
    </Layout>
  );
}
