import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const FALLBACK_REVIEWS = [
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

function formatReviewDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' , timeZone: 'America/Los_Angeles' });
}

function extractHighlight(text) {
  if (!text || text.length < 40) return null;
  // Find the most impactful sentence (longest sentence with positive words)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const positive = ['amazing', 'great', 'best', 'love', 'excellent', 'recommend',
    'professional', 'knowledgeable', 'trust', 'personalized', 'incredible',
    'beautiful', 'friendly', 'care', 'helpful', 'wonderful', 'fantastic',
    'quality', 'results', 'improvement', 'seamless', 'thorough'];

  let bestSentence = sentences[0];
  let bestScore = 0;

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    let score = positive.filter(w => lower.includes(w)).length;
    if (sentence.length > 30 && sentence.length < 120) score += 1;
    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
    }
  }

  return bestSentence.trim();
}

export async function getServerSideProps() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch cached Google reviews
    const { data: googleReviews } = await supabase
      .from('google_reviews')
      .select('*')
      .order('review_time', { ascending: false });

    // Fetch aggregate metadata
    const { data: metaRows } = await supabase
      .from('google_reviews_meta')
      .select('key, value')
      .in('key', ['aggregate_rating', 'total_review_count', 'last_sync']);

    const meta = {};
    (metaRows || []).forEach(r => { meta[r.key] = r.value; });

    if (googleReviews && googleReviews.length > 0) {
      // Format Google reviews for display
      const reviews = googleReviews.map(r => ({
        name: r.author_name,
        date: formatReviewDate(r.review_time),
        rating: r.rating,
        text: r.text,
        highlight: extractHighlight(r.text),
        photoUrl: r.profile_photo_url
      }));

      return {
        props: {
          reviews,
          aggregateRating: parseFloat(meta.aggregate_rating || '5.0'),
          totalReviewCount: parseInt(meta.total_review_count || reviews.length, 10),
          lastSync: meta.last_sync || null,
          source: 'google'
        }
      };
    }
  } catch (err) {
    console.error('Failed to fetch Google reviews:', err);
  }

  // Fallback to hardcoded reviews
  return {
    props: {
      reviews: FALLBACK_REVIEWS,
      aggregateRating: 5.0,
      totalReviewCount: FALLBACK_REVIEWS.length,
      lastSync: null,
      source: 'fallback'
    }
  };
}

export default function ReviewsPage({ reviews, aggregateRating, totalReviewCount, source }) {
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
                "ratingValue": aggregateRating,
                "reviewCount": totalReviewCount,
                "bestRating": 5
              }
            })
          }}
        />
      </Head>

      {/* Hero Section */}
      <section className="rv-hero">
        <div className="rv-hero-inner">
          <div className="v2-label"><span className="v2-dot" /> PATIENT REVIEWS</div>
          <h1>WHAT OUR<br />PATIENTS SAY</h1>
          <div className="rv-hero-rule" />
          <p className="rv-hero-body">
            Real experiences from real patients. See why Newport Beach trusts Range Medical
            for health optimization, hormone therapy, and recovery.
          </p>

          <div className="rv-rating-box">
            <div className="rv-rating-score">{aggregateRating.toFixed(1)}</div>
            <div className="rv-rating-info">
              <div className="rv-stars">{renderStars(aggregateRating)}</div>
              <p>Based on {totalReviewCount} Google Review{totalReviewCount !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <a
            href="https://g.page/r/CR-a12vKevOkEAI/review"
            target="_blank"
            rel="noopener noreferrer"
            className="rv-btn"
          >
            LEAVE US A REVIEW
          </a>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="rv-section">
        <div className="rv-container">
          <div className="reviews-list">
            {reviews.map((review, index) => (
              <div key={index} className="review-card">
                <div className="review-header">
                  <div className="review-avatar">
                    {review.photoUrl ? (
                      <img
                        src={review.photoUrl}
                        alt={review.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      review.name.charAt(0)
                    )}
                  </div>
                  <div className="review-meta">
                    <h3 className="review-name">
                      {review.name}
                      {review.badge && <span className="review-badge">{review.badge}</span>}
                    </h3>
                    <div className="review-date-stars">
                      <span className="review-date">{review.date}</span>
                      <span className="review-stars">{renderStars(review.rating)}</span>
                    </div>
                  </div>
                </div>

                {review.highlight && (
                  <blockquote className="review-highlight">
                    &ldquo;{review.highlight}&rdquo;
                  </blockquote>
                )}

                <p className="review-text">{review.text}</p>
              </div>
            ))}
          </div>

          <div className="google-cta">
            <p>Want to share your experience?</p>
            <a
              href="https://g.page/r/CR-a12vKevOkEAI/review"
              target="_blank"
              rel="noopener noreferrer"
              className="rv-btn-outline"
            >
              WRITE A GOOGLE REVIEW
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="rv-section rv-section-alt">
        <div className="rv-container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{aggregateRating.toFixed(1)}</div>
              <div className="stat-label">Average Rating</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{totalReviewCount}</div>
              <div className="stat-label">Google Reviews</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Patients Treated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="rv-cta">
        <div className="rv-container">
          <div className="v2-label" style={{ justifyContent: 'center' }}><span className="v2-dot" style={{ background: '#808080' }} /> NEXT STEP</div>
          <h2>READY TO FEEL<br />LIKE YOURSELF AGAIN?</h2>
          <p className="rv-cta-body">Join our patients who have transformed their health with Range Medical.</p>
          <Link href="/range-assessment" className="rv-btn-white">
            Book Your Range Assessment
          </Link>
          <p className="rv-cta-location">
            1901 Westcliff Dr. Suite 10, Newport Beach
          </p>
        </div>
      </section>

      <style jsx>{`
        /* Hero */
        .rv-hero {
          padding: 6rem 2rem 4rem;
          text-align: left;
        }

        .rv-hero-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        .rv-hero h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          color: #1a1a1a;
          line-height: 0.95;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          margin: 0 0 1.5rem;
        }

        .rv-hero-rule {
          width: 60px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .rv-hero-body {
          font-size: 1.0625rem;
          color: #737373;
          line-height: 1.7;
          max-width: 540px;
          margin: 0 0 2.5rem;
        }

        .rv-rating-box {
          display: inline-flex;
          align-items: center;
          gap: 1.25rem;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 1.25rem 2rem;
          margin-bottom: 2rem;
        }

        .rv-rating-score {
          font-size: 3rem;
          font-weight: 900;
          color: #808080;
          line-height: 1;
        }

        .rv-rating-info {
          text-align: left;
        }

        .rv-stars {
          color: #1a1a1a;
          font-size: 1.25rem;
          letter-spacing: 2px;
          margin-bottom: 0.25rem;
        }

        .rv-rating-info p {
          font-size: 0.875rem;
          color: #737373;
          margin: 0;
        }

        /* Buttons */
        .rv-btn {
          display: inline-block;
          background: #1a1a1a;
          color: #ffffff;
          padding: 0.875rem 2rem;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .rv-btn:hover {
          background: #333333;
        }

        .rv-btn-outline {
          display: inline-block;
          background: transparent;
          color: #1a1a1a;
          padding: 0.875rem 2rem;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1px solid #e0e0e0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rv-btn-outline:hover {
          border-color: #1a1a1a;
        }

        .rv-btn-white {
          display: inline-block;
          background: #ffffff;
          color: #1a1a1a;
          padding: 0.875rem 2rem;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .rv-btn-white:hover {
          background: #f0f0f0;
        }

        /* Sections */
        .rv-section {
          padding: 6rem 2rem;
        }

        .rv-section-alt {
          background: #fafafa;
        }

        .rv-container {
          max-width: 1100px;
          margin: 0 auto;
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
          border: 1px solid #e0e0e0;
          padding: 1.75rem;
          transition: border-color 0.2s;
        }

        .review-card:hover {
          border-color: #1a1a1a;
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
          background: #1a1a1a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
          flex-shrink: 0;
          border-radius: 50%;
          overflow: hidden;
        }

        .review-meta {
          flex: 1;
        }

        .review-name {
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 0.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .review-badge {
          font-size: 0.6875rem;
          background: #f5f5f5;
          color: #737373;
          padding: 0.125rem 0.5rem;
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
          color: #808080;
          font-size: 0.875rem;
          letter-spacing: 1px;
        }

        .review-highlight {
          background: #fafafa;
          border-left: 2px solid #808080;
          padding: 1rem 1.25rem;
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-style: italic;
          color: #1a1a1a;
          line-height: 1.6;
        }

        .review-text {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.7;
          margin: 0;
        }

        .google-cta {
          text-align: center;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #e0e0e0;
        }

        .google-cta p {
          font-size: 0.9375rem;
          color: #737373;
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
          font-weight: 900;
          color: #808080;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #737373;
        }

        /* Final CTA */
        .rv-cta {
          background: #1a1a1a;
          padding: 6rem 2rem;
          text-align: center;
        }

        .rv-cta h2 {
          font-size: 2.5rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 0.95;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          margin: 0 0 1.5rem;
        }

        .rv-cta-body {
          color: rgba(255,255,255,0.6);
          margin-bottom: 2rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.7;
        }

        .rv-cta-location {
          margin-top: 1.5rem;
          color: rgba(255,255,255,0.4);
          font-size: 0.875rem;
          letter-spacing: 0.05em;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .rv-hero {
            padding: 4rem 1.5rem 3rem;
          }

          .rv-hero h1 {
            font-size: 2.25rem;
          }

          .rv-rating-box {
            flex-direction: column;
            text-align: center;
            padding: 1.5rem;
          }

          .rv-rating-info {
            text-align: center;
          }

          .rv-section {
            padding: 4rem 1.5rem;
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

          .rv-cta {
            padding: 4rem 1.5rem;
          }

          .rv-cta h2 {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </Layout>
  );
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '\u2605'.repeat(full);
  if (half) stars += '\u2606';
  stars += '\u2606'.repeat(5 - full - (half ? 1 : 0));
  return stars;
}
