// pages/services.jsx
// Services & Treatments - Full menu of Range Medical services
// Filterable card grid with sticky category navigation

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All Services' },
  { id: 'recovery', label: 'Recovery & Healing' },
  { id: 'optimization', label: 'Optimization' },
  { id: 'labs', label: 'Labs & Testing' },
  { id: 'iv-injections', label: 'IV & Injections' },
];

const SERVICES = [
  {
    id: 'cellular-reset',
    name: 'Six-Week Cellular Energy Reset',
    price: '$3,999',
    priceNote: 'Money-back guarantee',
    description: '18 Hyperbaric Oxygen + 18 Red Light Therapy sessions over 6 weeks (3x/week each). The most powerful recovery and energy protocol we offer.',
    highlights: ['Structured 6-week protocol', 'Weekly provider check-ins', 'Money-back guarantee', 'Most powerful recovery + energy option'],
    categories: ['recovery'],
    link: '/cellular-energy-reset',
    featured: true,
  },
  {
    id: 'combo-membership',
    name: 'Hyperbaric + Red Light Combo Membership',
    price: 'From $899/mo',
    priceNote: '3-month minimum, then month-to-month',
    description: 'Back-to-back HBOT and Red Light sessions at a flexible weekly frequency. Ideal after completing the 6-Week Reset or as a standalone recovery membership.',
    highlights: ['1x/week: $899/mo (4 HBOT + 4 RLT)', '2x/week: $1,499/mo (8 HBOT + 8 RLT) — Most Popular', '3x/week: $1,999/mo (12 HBOT + 12 RLT)', 'Back-to-back sessions, flexible frequency'],
    categories: ['recovery'],
    link: '/hyperbaric-oxygen-therapy',
  },
  {
    id: 'hbot',
    name: 'Hyperbaric Oxygen Therapy',
    price: 'From $185/session',
    priceNote: 'Packs and memberships available',
    description: '60 minutes at 2.0 ATA. Pressurized oxygen supports healing, reduces inflammation, and boosts cellular energy production.',
    highlights: ['Single: $185 · 5-pack: $850 · 10-pack: $1,600', 'Membership: $549/mo (4 sessions, 3-month min)', 'Additional sessions at $150 each', '60 min at 2.0 ATA'],
    categories: ['recovery'],
    link: '/hyperbaric-oxygen-therapy',
  },
  {
    id: 'rlt',
    name: 'Red Light Therapy',
    price: 'From $85/session',
    priceNote: 'Packs and memberships available',
    description: 'Full-body 660–850nm wavelengths that support cellular recovery, reduce pain, and promote tissue repair.',
    highlights: ['Single: $85 · 5-pack: $375 · 10-pack: $600', 'Membership: $399/mo (up to 12 sessions, 3-month min)', 'Additional sessions at $50 each', 'Full-body red + near-infrared wavelengths'],
    categories: ['recovery'],
    link: '/red-light-therapy',
  },
  {
    id: 'hrt',
    name: 'Hormone Optimization',
    price: '$250/month',
    priceNote: 'All-inclusive HRT membership',
    description: 'Testosterone, estrogen, and progesterone optimization as needed. Feel better in 4–8 weeks with a fully managed membership that includes everything.',
    highlights: ['All hormone medications included', 'Quarterly lab monitoring included', 'Direct messaging with your provider', 'Bonus: 1 Range IV/month ($225 value)'],
    categories: ['optimization'],
    link: '/hormone-optimization',
    note: 'Requires baseline lab panel (Essential $350 / Elite $750)',
  },
  {
    id: 'weight-loss',
    name: 'Medical Weight Loss',
    price: 'Starting at $399/month',
    priceNote: 'All-inclusive — medication included',
    description: 'A provider-managed weight loss program with medication included, monthly check-ins, dose adjustments, and nutrition guidance. 15–25% average body weight loss over 6–12 months.',
    highlights: ['Medication included', 'Monthly provider check-ins + dose adjustments', 'Direct messaging with your provider', 'Nutrition guidance included'],
    categories: ['optimization'],
    link: '/weight-loss',
    note: 'Requires baseline lab panel (Essential $350 / Elite $750)',
  },
  {
    id: 'peptides',
    name: 'Peptide Therapy',
    price: '$150–400/month',
    priceNote: 'Varies by protocol — discussed at assessment',
    description: 'Targeted peptide protocols for recovery, growth hormone support, immune function, sexual wellness, mitochondrial health, and gut health. Pre-filled syringes, prescription required.',
    highlights: ['Recovery & Healing protocols', 'Growth Hormone Support (labs required)', 'Immune, Sexual Wellness, Gut Health', 'Can combine with other therapies'],
    categories: ['recovery', 'optimization'],
    link: '/peptide-therapy',
  },
  {
    id: 'bpc-tb4',
    name: 'BPC-157 + Thymosin Beta-4',
    price: 'From $250',
    priceNote: 'Recovery peptide protocol',
    description: 'BPC-157 for tissue repair paired with TB-4 for new blood vessel growth. Pre-filled syringes, one injection per day. First injection done together at the clinic.',
    highlights: ['10-Day Protocol: $250', '20-Day Protocol: $450', '30-Day Protocol: $675', 'Extended protocols available up to 90 days'],
    categories: ['recovery'],
    link: '/peptide-therapy',
  },
  {
    id: 'nad',
    name: 'NAD+ Therapy',
    price: 'From $25',
    priceNote: 'IV infusions and injections available',
    description: 'NAD+ declines ~50% by age 50. Restore levels to support cellular energy, DNA repair, brain function, and healthy aging via IV infusion or quick injection.',
    highlights: ['IV: 225mg $375 / 500mg $525 / 750mg $650 / 1000mg $775', 'Injections: $0.50/mg (50mg $25 – 150mg $75)', 'Supports cellular energy and DNA repair', 'Brain function and healthy aging'],
    categories: ['optimization'],
    link: '/nad-therapy',
  },
  {
    id: 'iv',
    name: 'IV Therapy — The Range IV',
    price: '$225/session',
    priceNote: 'Choose 5 vitamins/minerals, +$35 per add-on',
    description: 'Choose 5 vitamins and minerals tailored to your symptoms and goals, delivered directly to your bloodstream for 100% absorption. Walk-ins welcome for established patients.',
    highlights: ['Vitamin C, B-Complex, B12, Magnesium, Zinc, Glutathione & more', '100% absorption — bypasses the gut', '45–90 minutes, customized every visit', 'Walk-ins welcome for established patients'],
    categories: ['iv-injections'],
    link: '/iv-therapy',
  },
  {
    id: 'injections',
    name: 'Vitamin & Nutrient Injections',
    price: 'From $35',
    priceNote: 'In and out in 5 minutes',
    description: 'Quick nutrient injections — no IV needed. B12, B-Complex, Vitamin D3, Biotin, Amino Blend, Glutathione, L-Carnitine, MIC-B12 (Skinny Shot), and NAD+.',
    highlights: ['Standard ($35): B12, B-Complex, D3, Biotin, Aminos, NAC, BCAA', 'Premium ($50): L-Carnitine, Glutathione, MIC-B12', 'NAD+ Injections: $0.50/mg (50mg–150mg)', 'Packages available'],
    categories: ['iv-injections'],
    link: '/iv-therapy',
  },
  {
    id: 'prp',
    name: 'PRP Therapy',
    price: 'Consultation-based',
    priceNote: 'Pricing discussed at assessment',
    description: 'Platelet-Rich Plasma concentrated 3–5x from your own blood, injected into the treatment area. Common for knee pain, rotator cuff, tennis elbow, sports injuries, hair restoration, and facial rejuvenation.',
    highlights: ['Uses your own blood — no synthetic materials', 'Minimally invasive, no downtime', 'Sports injuries, joint pain, hair, skin', 'Consultation required'],
    categories: ['recovery'],
    link: '/prp-therapy',
  },
  {
    id: 'exosome',
    name: 'Exosome Therapy',
    price: 'Consultation-based',
    priceNote: 'Pricing discussed at assessment',
    description: 'Tiny cellular messengers (30–150nm) delivered via 30–60 minute IV infusion. Anti-inflammatory with systemic regenerative effects.',
    highlights: ['IV delivery for systemic effects', 'Anti-inflammatory properties', 'Supports tissue regeneration', 'Consultation required'],
    categories: ['recovery'],
    link: '/exosome-therapy',
  },
  {
    id: 'essential-panel',
    name: 'Essential Blood Panel',
    price: '$350',
    priceNote: 'Includes provider visit to review results',
    description: 'Comprehensive baseline blood work covering basic health, hormones, thyroid, metabolism, and vitamins. Available in Male and Female versions. The starting point for optimization.',
    highlights: ['CMP, Lipid Panel, CBC', 'Hormones (gender-specific) + Thyroid panel', 'Fasting Insulin, HgbA1c, Vitamin D', 'Best for first-time labs or general health check'],
    categories: ['labs'],
    link: '/lab-panels',
  },
  {
    id: 'elite-panel',
    name: 'Elite Blood Panel',
    price: '$750',
    priceNote: 'Includes provider visit to review results',
    description: 'Everything in the Essential panel plus advanced heart health markers, inflammation, expanded hormones, and a full vitamin and mineral profile. The complete picture.',
    highlights: ['Everything in Essential PLUS:', 'Heart: ApoA-1, ApoB, Lp(a), Homocysteine', 'Inflammation: CRP-HS, Sed Rate · Hormones: DHEA-S, FSH, LH, IGF-1, Cortisol', 'Best for full health picture or unexplained symptoms'],
    categories: ['labs'],
    link: '/lab-panels',
    featured: true,
  },
];

export default function Services() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSticky, setIsSticky] = useState(false);
  const filterBarRef = useRef(null);
  const filterBarTopRef = useRef(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const elements = document.querySelectorAll('.svc-page .svc-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Sticky filter bar
  useEffect(() => {
    if (!filterBarRef.current) return;
    // Get header height for sticky offset
    const header = document.querySelector('.rm-header');
    const headerHeight = header ? header.offsetHeight : 0;

    const handleScroll = () => {
      if (!filterBarRef.current) return;
      const rect = filterBarRef.current.getBoundingClientRect();
      setIsSticky(rect.top <= headerHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredServices = activeFilter === 'all'
    ? SERVICES
    : SERVICES.filter(s => s.categories.includes(activeFilter));

  return (
    <Layout
      title="Services & Treatments | Range Medical | Newport Beach"
      description="Explore all regenerative medicine services at Range Medical in Newport Beach. Hormone optimization, weight loss, HBOT, red light therapy, peptides, IV therapy, PRP, exosomes, and lab panels."
    >
      <Head>
        <meta name="keywords" content="regenerative medicine Newport Beach, HRT Orange County, weight loss clinic, HBOT, red light therapy, peptide therapy, IV therapy, PRP, exosome therapy, lab panels, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/services" />

        <meta property="og:title" content="Services & Treatments | Range Medical | Newport Beach" />
        <meta property="og:description" content="Explore all regenerative medicine services at Range Medical. Hormone optimization, weight loss, HBOT, red light, peptides, IV therapy, and more." />
        <meta property="og:url" content="https://www.range-medical.com/services" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Services & Treatments | Range Medical | Newport Beach" />
        <meta name="twitter:description" content="Explore all regenerative medicine services at Range Medical in Newport Beach." />
        <meta name="twitter:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />

        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
        <meta name="geo.position" content="33.6189;-117.9298" />
        <meta name="ICBM" content="33.6189, -117.9298" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Range Medical",
              "url": "https://www.range-medical.com",
              "telephone": "(949) 997-3988",
              "image": "https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "1901 Westcliff Dr. Suite 10",
                "addressLocality": "Newport Beach",
                "addressRegion": "CA",
                "postalCode": "92660",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 33.6189,
                "longitude": -117.9298
              },
              "areaServed": [
                { "@type": "City", "name": "Newport Beach" },
                { "@type": "City", "name": "Costa Mesa" },
                { "@type": "City", "name": "Irvine" },
                { "@type": "City", "name": "Huntington Beach" },
                { "@type": "City", "name": "Laguna Beach" },
                { "@type": "City", "name": "Corona del Mar" },
                { "@type": "AdministrativeArea", "name": "Orange County" }
              ],
              "priceRange": "$–$$$$",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "90",
                "bestRating": "5"
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "17:00"
              }
            })
          }}
        />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">✓ Walk-ins Welcome</span>
        </div>
      </div>

      <div className="svc-page">
        {/* Hero */}
        <section className="svc-hero">
          <div className="svc-kicker">Newport Beach Regenerative Medicine</div>
          <h1>Services & Treatments</h1>
          <p className="svc-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
            Every patient starts with a Range Assessment — a conversation with your provider about your symptoms and goals. From there, your provider recommends the right plan.
          </p>
          <Link href="/range-assessment" className="svc-btn-primary svc-btn-dark">
            Take Your Range Assessment
          </Link>
          <div className="svc-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* Assessment Feature Card */}
        <section className="svc-section svc-section-alt">
          <div className="svc-container">
            <div className="svc-animate">
              <div className="svc-kicker">Where to Start</div>
              <h2>The Range Assessment</h2>
              <div className="svc-divider"></div>
              <p className="svc-body-text">
                Your journey starts with a free assessment — a quick conversation about your symptoms, goals, and medical history. Your provider then recommends the right path for you.
              </p>

              <div className="svc-doors-grid">
                <div className="svc-door-card">
                  <div className="svc-door-number">Door 1</div>
                  <h3>Injury & Recovery</h3>
                  <p className="svc-door-desc">No labs required. Peptide therapy, PRP, exosomes, IV therapy, HBOT, and red light therapy.</p>
                </div>
                <div className="svc-door-card">
                  <div className="svc-door-number">Door 2</div>
                  <h3>Optimization & Wellness</h3>
                  <p className="svc-door-desc">Labs required. Hormone optimization, weight loss, NAD+, cellular energy reset, IV therapy, and peptide protocols.</p>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <Link href="/range-assessment" className="svc-btn-primary svc-btn-dark">
                  Start Your Assessment
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky Filter Bar */}
        <div className={`svc-filter-bar ${isSticky ? 'svc-filter-sticky' : ''}`} ref={filterBarRef}>
          <div className="svc-filter-inner">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`svc-filter-pill ${activeFilter === cat.id ? 'svc-filter-active' : ''}`}
                onClick={() => setActiveFilter(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Service Cards Grid */}
        <section className="svc-section">
          <div className="svc-container">
            <div className="svc-cards-grid">
              {filteredServices.map(service => (
                <div key={service.id} className={`svc-card ${service.featured ? 'svc-card-featured' : ''}`}>
                  {service.featured && (
                    <div className="svc-card-badge">Featured</div>
                  )}
                  <div className="svc-card-categories">
                    {service.categories.map(cat => {
                      const catObj = CATEGORIES.find(c => c.id === cat);
                      return catObj ? (
                        <span key={cat} className="svc-card-tag">{catObj.label}</span>
                      ) : null;
                    })}
                  </div>
                  <h3 className="svc-card-name">{service.name}</h3>
                  <div className="svc-card-price">{service.price}</div>
                  {service.priceNote && (
                    <div className="svc-card-price-note">{service.priceNote}</div>
                  )}
                  <p className="svc-card-desc">{service.description}</p>
                  {service.note && (
                    <p className="svc-card-note">{service.note}</p>
                  )}
                  <ul className="svc-card-highlights">
                    {service.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                  <Link href={service.link} className="svc-card-cta">
                    Learn More →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="svc-section svc-section-inverted">
          <div className="svc-cta-section">
            <div className="svc-animate">
              <div className="svc-kicker">Ready to Get Started?</div>
              <h2 className="svc-cta-title">Every journey starts with<br />a conversation.</h2>
              <p className="svc-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Take the Range Assessment to connect with a provider and find the right plan for your goals.
              </p>
              <div className="svc-cta-buttons">
                <Link href="/range-assessment" className="svc-btn-primary">
                  Take Your Range Assessment
                </Link>
                <span className="svc-cta-or">or</span>
                <a href="tel:9499973988" className="svc-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* Page Wrapper */
        .svc-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #171717;
        }

        /* Animations */
        .svc-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.svc-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Kicker */
        .svc-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .svc-section-inverted .svc-kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Headlines */
        .svc-page h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #171717;
          margin-bottom: 1.5rem;
        }

        .svc-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .svc-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .svc-section-inverted h1,
        .svc-section-inverted h2,
        .svc-section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text */
        .svc-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 600px;
        }

        .svc-section-inverted .svc-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .svc-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        /* Buttons */
        .svc-btn-primary {
          display: inline-block;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.875rem 2rem;
          background: #ffffff;
          color: #000000;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .svc-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        .svc-btn-dark {
          background: #000000;
          color: #ffffff;
        }

        .svc-btn-dark:hover {
          background: #1a1a1a;
        }

        /* Container */
        .svc-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        /* Sections */
        .svc-section {
          padding: 4rem 1.5rem;
        }

        .svc-section-alt {
          background: #fafafa;
          padding: 5rem 1.5rem;
        }

        .svc-section-inverted {
          background: #000000;
          color: #ffffff;
          padding: 5rem 1.5rem;
        }

        /* Hero */
        .svc-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .svc-hero h1 {
          max-width: 680px;
        }

        .svc-hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }

        .svc-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: svc-bounce 2s ease-in-out infinite;
        }

        @keyframes svc-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Two-Door Cards */
        .svc-doors-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .svc-door-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .svc-door-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .svc-door-number {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 0.75rem;
        }

        .svc-door-card h3 {
          margin-bottom: 0.75rem;
        }

        .svc-door-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
          margin: 0;
        }

        /* Sticky Filter Bar */
        .svc-filter-bar {
          position: sticky;
          top: 0;
          z-index: 90;
          background: #ffffff;
          border-bottom: 1px solid #e5e5e5;
          padding: 1rem 1.5rem;
          transition: box-shadow 0.2s ease;
        }

        .svc-filter-sticky {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        }

        .svc-filter-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .svc-filter-inner::-webkit-scrollbar {
          display: none;
        }

        .svc-filter-pill {
          flex-shrink: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.5rem 1.25rem;
          border-radius: 100px;
          border: 1.5px solid #e5e5e5;
          background: #ffffff;
          color: #525252;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .svc-filter-pill:hover {
          border-color: #171717;
          color: #171717;
        }

        .svc-filter-active {
          background: #000000;
          color: #ffffff;
          border-color: #000000;
        }

        .svc-filter-active:hover {
          background: #1a1a1a;
          border-color: #1a1a1a;
          color: #ffffff;
        }

        /* Cards Grid */
        .svc-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .svc-card {
          position: relative;
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .svc-card:hover {
          border-color: #c0c0c0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .svc-card-featured {
          border: 2px solid #000000;
        }

        .svc-card-featured:hover {
          border-color: #000000;
        }

        .svc-card-badge {
          position: absolute;
          top: -10px;
          left: 1.5rem;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.25rem 0.75rem;
          background: #000000;
          color: #ffffff;
          border-radius: 100px;
        }

        .svc-card-categories {
          display: flex;
          gap: 0.375rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .svc-card-tag {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: #737373;
          padding: 0.25rem 0.625rem;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .svc-card-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.625rem;
          line-height: 1.3;
        }

        .svc-card-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.25rem;
        }

        .svc-card-price-note {
          font-size: 0.8125rem;
          color: #737373;
          margin-bottom: 1rem;
        }

        .svc-card-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
          margin: 0 0 1rem;
        }

        .svc-card-note {
          font-size: 0.8125rem;
          color: #737373;
          font-style: italic;
          margin: 0 0 1rem;
          padding: 0.625rem 0.875rem;
          background: #fafafa;
          border-radius: 6px;
          border-left: 3px solid #e5e5e5;
        }

        .svc-card-highlights {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem;
          flex: 1;
        }

        .svc-card-highlights li {
          font-size: 0.8125rem;
          color: #525252;
          line-height: 1.6;
          padding: 0.25rem 0 0.25rem 1.25rem;
          position: relative;
        }

        .svc-card-highlights li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #171717;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .svc-card-cta {
          font-size: 0.875rem;
          font-weight: 600;
          color: #171717;
          text-decoration: none;
          padding-top: 1rem;
          border-top: 1px solid #e5e5e5;
          transition: color 0.15s ease;
          margin-top: auto;
        }

        .svc-card-cta:hover {
          color: #525252;
        }

        /* CTA Section */
        .svc-cta-section {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }

        .svc-cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .svc-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .svc-cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .svc-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .svc-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .svc-page h1 {
            font-size: 2rem;
          }

          .svc-page h2 {
            font-size: 1.5rem;
          }

          .svc-hero {
            padding: 3rem 1.5rem;
          }

          .svc-section {
            padding: 3rem 1.5rem;
          }

          .svc-section-alt {
            padding: 3rem 1.5rem;
          }

          .svc-section-inverted {
            padding: 3rem 1.5rem;
          }

          .svc-doors-grid {
            grid-template-columns: 1fr;
          }

          .svc-cards-grid {
            grid-template-columns: 1fr;
          }

          .svc-cta-title {
            font-size: 2rem;
          }

          .svc-cta-buttons {
            flex-direction: column;
          }

          .svc-filter-bar {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </Layout>
  );
}
