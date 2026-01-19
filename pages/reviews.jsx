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

function StarRating({ rating }) {
  return (
    <div className="star-rating">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < rating ? 'star filled' : 'star'}>★</span>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="review-card">
      <div className="review-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {review.name.charAt(0)}
          </div>
          <div>
            <h3 className="reviewer-name">
              {review.name}
              {review.badge && <span className="badge">{review.badge}</span>}
            </h3>
            <p className="review-date">{review.date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>
      {review.highlight && (
        <blockquote className="review-highlight">
          "{review.highlight}"
        </blockquote>
      )}
      <p className="review-text">{review.text}</p>
    </div>
  );
}

export default function ReviewsPage() {
  const averageRating = 5.0;
  const totalReviews = reviews.length;

  return (
    <Layout 
      title="Patient Reviews | Range Medical | Newport Beach"
      description="Read what our patients say about Range Medical. 5-star rated health optimization clinic in Newport Beach. Real reviews from real patients."
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
                "ratingValue": averageRating,
                "reviewCount": totalReviews,
                "bestRating": 5
              }
            })
          }}
        />
      </Head>

      <section className="reviews-hero">
        <div className="container">
          <h1>What Our Patients Say</h1>
          <div className="rating-summary">
            <div className="rating-number">{averageRating}</div>
            <div className="rating-details">
              <StarRating rating={5} />
              <p>Based on {totalReviews} Google Reviews</p>
            </div>
          </div>
          <a 
            href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK/review" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Leave a Review
          </a>
        </div>
      </section>

      <section className="reviews-grid">
        <div className="container">
          {reviews.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))}
        </div>
      </section>

      <section className="reviews-cta">
        <div className="container">
          <h2>Ready to Feel Like Yourself Again?</h2>
          <p>Join our patients who have transformed their health with Range Medical.</p>
          <div className="cta-buttons">
            <Link href="/quiz" className="btn btn-primary">Take the Quiz</Link>
            <Link href="/contact" className="btn btn-secondary">Book Consultation</Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .reviews-hero {
          background: #000;
          color: #fff;
          padding: 80px 20px;
          text-align: center;
        }

        .reviews-hero h1 {
          font-size: 2.5rem;
          margin-bottom: 30px;
        }

        .rating-summary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .rating-number {
          font-size: 4rem;
          font-weight: 700;
        }

        .rating-details {
          text-align: left;
        }

        .rating-details p {
          margin-top: 5px;
          opacity: 0.8;
        }

        .reviews-grid {
          padding: 60px 20px;
          background: #f9f9f9;
        }

        .reviews-grid .container {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .review-card {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 30px;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .reviewer-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .reviewer-avatar {
          width: 50px;
          height: 50px;
          background: #000;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.2rem;
        }

        .reviewer-name {
          font-size: 1.1rem;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .badge {
          font-size: 0.7rem;
          background: #e8f0fe;
          color: #1a73e8;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        .review-date {
          margin: 5px 0 0;
          color: #666;
          font-size: 0.9rem;
        }

        .review-highlight {
          background: #f5f5f5;
          border-left: 3px solid #000;
          padding: 15px 20px;
          margin: 0 0 20px;
          font-style: italic;
          font-size: 1.1rem;
        }

        .review-text {
          line-height: 1.7;
          color: #333;
          margin: 0;
        }

        .reviews-cta {
          background: #000;
          color: #fff;
          padding: 80px 20px;
          text-align: center;
        }

        .reviews-cta h2 {
          font-size: 2rem;
          margin-bottom: 15px;
        }

        .reviews-cta p {
          opacity: 0.8;
          margin-bottom: 30px;
        }

        .cta-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          padding: 15px 30px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #fff;
          color: #000;
        }

        .btn-primary:hover {
          background: #f0f0f0;
        }

        .btn-secondary {
          background: transparent;
          color: #fff;
          border: 1px solid #fff;
        }

        .btn-secondary:hover {
          background: #fff;
          color: #000;
        }

        @media (max-width: 600px) {
          .reviews-hero h1 {
            font-size: 2rem;
          }

          .rating-summary {
            flex-direction: column;
          }

          .rating-details {
            text-align: center;
          }

          .review-header {
            flex-direction: column;
            gap: 15px;
          }

          .review-card {
            padding: 20px;
          }
        }
      `}</style>

      <style jsx global>{`
        .star-rating {
          display: flex;
          gap: 2px;
        }

        .star {
          color: #ddd;
          font-size: 1.2rem;
        }

        .star.filled {
          color: #fbbc04;
        }
      `}</style>
    </Layout>
  );
}
