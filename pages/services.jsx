// pages/services.jsx
// Services & Treatments — V2 design, full pricing menu with embedded checkout

import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import CheckoutModal from '../components/CheckoutModal';
import Layout from '../components/Layout';

export default function Services() {
  const [visible, setVisible] = useState({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState(null);

  const openCheckout = (product) => {
    setCheckoutProduct(product);
    setCheckoutOpen(true);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.v2-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <Layout
      title="Services & Pricing | Range Medical | Newport Beach"
      description="Full pricing menu for Range Medical in Newport Beach. IV therapy, injections, HBOT, red light, hormone optimization, weight loss, peptides, NAD+, PRP, exosomes, and lab panels."
    >
      <Head>
        <meta name="keywords" content="regenerative medicine Newport Beach, IV therapy pricing, HBOT pricing, red light therapy cost, hormone optimization, weight loss clinic, NAD+ IV, glutathione IV, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/services" />

        <meta property="og:title" content="Services & Pricing | Range Medical | Newport Beach" />
        <meta property="og:description" content="Full pricing for all regenerative medicine services at Range Medical. Book and pay online." />
        <meta property="og:url" content="https://www.range-medical.com/services" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Range Medical",
              "url": "https://www.range-medical.com",
              "telephone": "(949) 997-3988",
              "address": { "@type": "PostalAddress", "streetAddress": "1901 Westcliff Dr. Suite 10", "addressLocality": "Newport Beach", "addressRegion": "CA", "postalCode": "92660", "addressCountry": "US" },
              "geo": { "@type": "GeoCoordinates", "latitude": 33.6189, "longitude": -117.9298 },
              "priceRange": "$\u2013$$$$"
            })
          }}
        />
      </Head>

      <div>
        {/* ── HERO ── */}
        <section className="v2-hero">
          <div className="v2-hero-inner">
            <div className="v2-label"><span className="v2-dot" /> SERVICES & PRICING</div>
            <h1>EVERYTHING<br />WE OFFER.<br />ONE PAGE.</h1>
            <div className="v2-hero-rule" />
            <p className="v2-hero-body">
              Full pricing for every service. Book and pay online, or call us at{' '}
              <a href="tel:9499973988" className="svc-phone-link">(949) 997-3988</a>.
            </p>
          </div>
        </section>

        {/* ── JUMP NAV ── */}
        <div className="svc-jump-bar">
          <div className="svc-jump-inner">
            <a href="#iv-therapy" className="svc-jump-link">IV THERAPY</a>
            <a href="#injections" className="svc-jump-link">INJECTIONS</a>
            <a href="#recovery" className="svc-jump-link">RECOVERY</a>
            <a href="#optimization" className="svc-jump-link">OPTIMIZATION</a>
            <a href="#labs" className="svc-jump-link">LABS</a>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════
            IV THERAPY
        ════════════════════════════════════════════════════════════════════════ */}
        <section id="iv-therapy" className={`v2-section v2-reveal ${visible['iv-therapy'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> IV THERAPY</div>

            {/* Range IVs */}
            <h2 className="svc-section-title">THE RANGE IV</h2>
            <p className="svc-section-sub">Choose your formula. 5 vitamins & minerals included. Add-ons +$35 each.</p>

            <div className="svc-price-grid svc-price-grid-4">
              {[
                { name: 'Immune Defense', icon: '\u{1F6E1}\u{FE0F}', items: ['Vitamin C', 'Zinc', 'Glutathione', 'B-Complex', 'Magnesium'], cents: 22500 },
                { name: 'Energy & Vitality', icon: '\u26A1', items: ['B12', 'B-Complex', 'L-Carnitine', 'Magnesium', 'Vitamin C'], cents: 22500 },
                { name: 'Recovery & Performance', icon: '\u{1F4AA}', items: ['Amino Acids', 'Magnesium', 'B-Complex', 'Vitamin C', 'Glutathione'], cents: 22500 },
                { name: 'Detox & Cellular Repair', icon: '\u{1F9EC}', items: ['Glutathione', 'Vitamin C', 'NAC', 'Zinc', 'Magnesium'], cents: 22500 },
              ].map((iv, i) => (
                <div key={i} className="svc-price-card">
                  <div className="svc-card-icon">{iv.icon}</div>
                  <h3>{iv.name}</h3>
                  <div className="svc-card-price">$225</div>
                  <div className="svc-card-detail">60 min infusion</div>
                  <ul className="svc-card-list">
                    {iv.items.map((item, j) => <li key={j}>{item}</li>)}
                  </ul>
                  <button className="svc-btn-book" onClick={() => openCheckout({ name: `${iv.name} IV`, amountCents: iv.cents, amountLabel: '$225', serviceCategory: 'iv', serviceName: `Range IV \u2014 ${iv.name}` })}>
                    Book &amp; Pay &mdash; $225
                  </button>
                </div>
              ))}
            </div>

            {/* NAD+ IVs */}
            <h2 className="svc-section-title svc-mt">NAD+ IV</h2>
            <p className="svc-section-sub">Cellular energy, brain function, and longevity. Duration varies by dose.</p>

            <div className="svc-price-grid svc-price-grid-4">
              {[
                { dose: '225mg', price: '$375', cents: 37500, time: '60 min' },
                { dose: '500mg', price: '$525', cents: 52500, time: '90 min', popular: true },
                { dose: '750mg', price: '$650', cents: 65000, time: '2 hrs' },
                { dose: '1000mg', price: '$775', cents: 77500, time: '3 hrs' },
              ].map((nad, i) => (
                <div key={i} className={`svc-price-card ${nad.popular ? 'svc-price-card-featured' : ''}`}>
                  {nad.popular && <div className="svc-card-badge">MOST POPULAR</div>}
                  <h3>NAD+ {nad.dose}</h3>
                  <div className="svc-card-price">{nad.price}</div>
                  <div className="svc-card-detail">{nad.time} infusion</div>
                  <button className="svc-btn-book" onClick={() => openCheckout({ name: `NAD+ IV ${nad.dose}`, amountCents: nad.cents, amountLabel: nad.price, serviceCategory: 'iv', serviceName: `NAD+ IV \u2014 ${nad.dose}` })}>
                    Book &amp; Pay &mdash; {nad.price}
                  </button>
                </div>
              ))}
            </div>

            {/* Glutathione IVs */}
            <h2 className="svc-section-title svc-mt">GLUTATHIONE IV</h2>
            <p className="svc-section-sub">The body&apos;s master antioxidant. Detox, immune support, and skin health.</p>

            <div className="svc-price-grid svc-price-grid-3">
              {[
                { dose: '1g', price: '$170', cents: 17000 },
                { dose: '2g', price: '$190', cents: 19000 },
                { dose: '3g', price: '$215', cents: 21500 },
              ].map((g, i) => (
                <div key={i} className="svc-price-card">
                  <h3>Glutathione {g.dose}</h3>
                  <div className="svc-card-price">{g.price}</div>
                  <div className="svc-card-detail">60 min IV push</div>
                  <button className="svc-btn-book" onClick={() => openCheckout({ name: `Glutathione IV ${g.dose}`, amountCents: g.cents, amountLabel: g.price, serviceCategory: 'iv', serviceName: `Glutathione IV \u2014 ${g.dose}` })}>
                    Book &amp; Pay &mdash; {g.price}
                  </button>
                </div>
              ))}
            </div>

            {/* High-Dose Vitamin C */}
            <h2 className="svc-section-title svc-mt">HIGH-DOSE VITAMIN C IV</h2>
            <p className="svc-section-sub">Therapeutic doses for immune support and antioxidant defense. Requires G6PD blood work.</p>

            <div className="svc-price-grid svc-price-grid-3">
              {[
                { dose: '25g', price: '$215', cents: 21500, time: '90 min' },
                { dose: '50g', price: '$255', cents: 25500, time: '90 min' },
                { dose: '75g', price: '$330', cents: 33000, time: '2 hrs' },
              ].map((vc, i) => (
                <div key={i} className="svc-price-card">
                  <h3>Vitamin C {vc.dose}</h3>
                  <div className="svc-card-price">{vc.price}</div>
                  <div className="svc-card-detail">{vc.time} infusion</div>
                  <button className="svc-btn-book" onClick={() => openCheckout({ name: `Vitamin C IV ${vc.dose}`, amountCents: vc.cents, amountLabel: vc.price, serviceCategory: 'iv', serviceName: `High-Dose Vitamin C IV \u2014 ${vc.dose}` })}>
                    Book &amp; Pay &mdash; {vc.price}
                  </button>
                </div>
              ))}
            </div>

            {/* Methylene Blue IVs */}
            <h2 className="svc-section-title svc-mt">METHYLENE BLUE IV</h2>
            <p className="svc-section-sub">Mitochondrial support and cognitive enhancement. Requires baseline labs.</p>

            <div className="svc-price-grid svc-price-grid-2">
              {[
                { name: 'Methylene Blue IV', price: '$450', cents: 45000, time: '60 min' },
                { name: 'MB + Vitamin C + Magnesium Combo', price: '$750', cents: 75000, time: '2 hrs' },
              ].map((mb, i) => (
                <div key={i} className="svc-price-card">
                  <h3>{mb.name}</h3>
                  <div className="svc-card-price">{mb.price}</div>
                  <div className="svc-card-detail">{mb.time} infusion</div>
                  <button className="svc-btn-book" onClick={() => openCheckout({ name: mb.name, amountCents: mb.cents, amountLabel: mb.price, serviceCategory: 'iv', serviceName: mb.name })}>
                    Book &amp; Pay &mdash; {mb.price}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            INJECTIONS
        ════════════════════════════════════════════════════════════════════════ */}
        <section id="injections" className={`v2-section v2-bg-light v2-reveal ${visible['injections'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> INJECTIONS</div>

            {/* Standard */}
            <h2 className="svc-section-title">STANDARD INJECTIONS &mdash; $35</h2>
            <p className="svc-section-sub">In and out in 5 minutes. No IV needed.</p>

            <div className="svc-price-grid svc-price-grid-4">
              {['B12 (Methylcobalamin)', 'B-Complex', 'Vitamin D3', 'Biotin', 'Amino Blend', 'NAC', 'BCAA'].map((inj, i) => (
                <div key={i} className="svc-price-card svc-price-card-compact">
                  <h3>{inj}</h3>
                  <div className="svc-card-price">$35</div>
                  <button className="svc-btn-book" onClick={() => openCheckout({ name: `${inj} Injection`, amountCents: 3500, amountLabel: '$35', serviceCategory: 'injection', serviceName: `${inj} Injection` })}>
                    Book &amp; Pay
                  </button>
                </div>
              ))}
            </div>

            {/* Premium */}
            <h2 className="svc-section-title svc-mt">PREMIUM INJECTIONS &mdash; $50</h2>

            <div className="svc-price-grid svc-price-grid-3">
              {[
                { name: 'L-Carnitine', desc: 'Fat metabolism & energy' },
                { name: 'Glutathione (200mg)', desc: 'Master antioxidant' },
                { name: 'MIC-B12 (Skinny Shot)', desc: 'Metabolism & fat breakdown' },
              ].map((inj, i) => (
                <div key={i} className="svc-price-card">
                  <h3>{inj.name}</h3>
                  <div className="svc-card-price">$50</div>
                  <div className="svc-card-detail">{inj.desc}</div>
                  <button className="svc-btn-book" onClick={() => openCheckout({ name: `${inj.name} Injection`, amountCents: 5000, amountLabel: '$50', serviceCategory: 'injection', serviceName: `${inj.name} Injection` })}>
                    Book &amp; Pay
                  </button>
                </div>
              ))}
            </div>

            {/* NAD+ Injections */}
            <h2 className="svc-section-title svc-mt">NAD+ INJECTIONS &mdash; $0.50/mg</h2>
            <p className="svc-section-sub">Subcutaneous injection. Quick dose for cellular energy and focus.</p>

            <div className="svc-price-grid svc-price-grid-3">
              {[
                { dose: '50mg', price: '$25', cents: 2500 },
                { dose: '100mg', price: '$50', cents: 5000 },
                { dose: '150mg', price: '$75', cents: 7500 },
              ].map((nad, i) => (
                <div key={i} className="svc-price-card svc-price-card-compact">
                  <h3>NAD+ {nad.dose}</h3>
                  <div className="svc-card-price">{nad.price}</div>
                  <button className="svc-btn-book" onClick={() => openCheckout({ name: `NAD+ Injection ${nad.dose}`, amountCents: nad.cents, amountLabel: nad.price, serviceCategory: 'injection', serviceName: `NAD+ Injection \u2014 ${nad.dose}` })}>
                    Book &amp; Pay
                  </button>
                </div>
              ))}
            </div>

            {/* Injection Packages */}
            <h2 className="svc-section-title svc-mt">INJECTION PACKAGES</h2>
            <p className="svc-section-sub">12 injections for the price of 10. Take home for self-administration.</p>

            <div className="svc-price-grid svc-price-grid-2">
              <div className="svc-price-card svc-price-card-featured">
                <div className="svc-card-badge">MOST POPULAR</div>
                <h3>Standard Package</h3>
                <div className="svc-card-price">$350</div>
                <div className="svc-card-detail">12 standard injections &mdash; save $70</div>
                <ul className="svc-card-list">
                  <li>Any standard injection ($35 each)</li>
                  <li>Take home for self-administration</li>
                  <li>MWF protocol recommended</li>
                </ul>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'Standard Injection Package', amountCents: 35000, amountLabel: '$350', serviceCategory: 'injection', serviceName: 'Standard Injection Package (12 for 10)' })}>
                  Buy Package &mdash; $350
                </button>
              </div>
              <div className="svc-price-card svc-price-card-featured">
                <div className="svc-card-badge">SPECIALTY</div>
                <h3>NAD+ / Premium Package</h3>
                <div className="svc-card-price">$500</div>
                <div className="svc-card-detail">12 premium or NAD+ 100mg injections &mdash; save $100</div>
                <ul className="svc-card-list">
                  <li>NAD+ (100mg) or any premium injection</li>
                  <li>Take home for self-administration</li>
                  <li>MWF protocol recommended</li>
                </ul>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'NAD+ / Premium Injection Package', amountCents: 50000, amountLabel: '$500', serviceCategory: 'injection', serviceName: 'NAD+ / Premium Injection Package (12 for 10)' })}>
                  Buy Package &mdash; $500
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            RECOVERY & HEALING
        ════════════════════════════════════════════════════════════════════════ */}
        <section id="recovery" className={`v2-section v2-reveal ${visible['recovery'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> RECOVERY & HEALING</div>

            {/* Cellular Energy Reset */}
            <h2 className="svc-section-title">SIX-WEEK CELLULAR ENERGY RESET</h2>
            <p className="svc-section-sub">18 HBOT + 18 Red Light sessions over 6 weeks. Money-back guarantee.</p>

            <div className="svc-price-grid svc-price-grid-1">
              <div className="svc-price-card svc-price-card-featured svc-price-card-wide">
                <div className="svc-card-badge">SAVE $1,000</div>
                <h3>6-Week Cellular Energy Reset</h3>
                <div className="svc-card-price"><span className="svc-card-original">$3,999</span> $2,999</div>
                <ul className="svc-card-list">
                  <li>18 Hyperbaric Oxygen sessions (60 min at 2.0 ATA)</li>
                  <li>18 Red Light Therapy sessions (660&ndash;850nm)</li>
                  <li>Structured 6-week schedule &mdash; 3x/week</li>
                  <li>Weekly check-ins to track progress</li>
                  <li>Money-back guarantee</li>
                </ul>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: '6-Week Cellular Energy Reset', amountCents: 299900, amountLabel: '$2,999', serviceCategory: 'hbot', serviceName: 'Six-Week Cellular Energy Reset' })}>
                  Book &amp; Pay &mdash; $2,999
                </button>
              </div>
            </div>

            {/* HBOT */}
            <h2 className="svc-section-title svc-mt">HYPERBARIC OXYGEN THERAPY</h2>
            <p className="svc-section-sub">60 minutes at 2.0 ATA. Pressurized oxygen for healing and inflammation.</p>

            <div className="svc-price-grid svc-price-grid-3">
              <div className="svc-price-card">
                <h3>Single Session</h3>
                <div className="svc-card-price">$185</div>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'HBOT Single Session', amountCents: 18500, amountLabel: '$185', serviceCategory: 'hbot', serviceName: 'HBOT \u2014 Single Session' })}>
                  Book &amp; Pay
                </button>
              </div>
              <div className="svc-price-card">
                <h3>5-Session Pack</h3>
                <div className="svc-card-price">$850</div>
                <div className="svc-card-detail">$170/session &mdash; save 8%</div>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'HBOT 5-Session Pack', amountCents: 85000, amountLabel: '$850', serviceCategory: 'hbot', serviceName: 'HBOT \u2014 5-Session Pack' })}>
                  Buy Pack &mdash; $850
                </button>
              </div>
              <div className="svc-price-card">
                <h3>10-Session Pack</h3>
                <div className="svc-card-price">$1,600</div>
                <div className="svc-card-detail">$160/session &mdash; save 14%</div>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'HBOT 10-Session Pack', amountCents: 160000, amountLabel: '$1,600', serviceCategory: 'hbot', serviceName: 'HBOT \u2014 10-Session Pack' })}>
                  Buy Pack &mdash; $1,600
                </button>
              </div>
            </div>

            <h3 className="svc-subsection-title svc-mt-sm">HBOT MEMBERSHIPS</h3>
            <p className="svc-section-sub">3-month minimum, then month-to-month. Best per-session value.</p>

            <div className="svc-price-grid svc-price-grid-3">
              {[
                { freq: '1x/Week', price: '$549/mo', cents: 54900, detail: '4 sessions &mdash; $137/session' },
                { freq: '2x/Week', price: '$999/mo', cents: 99900, detail: '8 sessions &mdash; $125/session', popular: true },
                { freq: '3x/Week', price: '$1,399/mo', cents: 139900, detail: '12 sessions &mdash; $117/session' },
              ].map((m, i) => (
                <div key={i} className={`svc-price-card ${m.popular ? 'svc-price-card-featured' : ''}`}>
                  {m.popular && <div className="svc-card-badge">BEST VALUE</div>}
                  <h3>HBOT {m.freq}</h3>
                  <div className="svc-card-price">{m.price}</div>
                  <div className="svc-card-detail" dangerouslySetInnerHTML={{ __html: m.detail }} />
                  <button className="svc-btn-book" onClick={() => openCheckout({ name: `HBOT Membership \u2014 ${m.freq}`, amountCents: m.cents, amountLabel: m.price, serviceCategory: 'hbot', serviceName: `HBOT Membership \u2014 ${m.freq}` })}>
                    Start Membership
                  </button>
                </div>
              ))}
            </div>

            {/* RLT */}
            <h2 className="svc-section-title svc-mt">RED LIGHT THERAPY</h2>
            <p className="svc-section-sub">Full-body 660&ndash;850nm wavelengths for cellular recovery and tissue repair.</p>

            <div className="svc-price-grid svc-price-grid-4">
              <div className="svc-price-card">
                <h3>Single Session</h3>
                <div className="svc-card-price">$85</div>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'RLT Single Session', amountCents: 8500, amountLabel: '$85', serviceCategory: 'rlt', serviceName: 'Red Light Therapy \u2014 Single Session' })}>
                  Book &amp; Pay
                </button>
              </div>
              <div className="svc-price-card">
                <h3>5-Session Pack</h3>
                <div className="svc-card-price">$375</div>
                <div className="svc-card-detail">$75/session</div>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'RLT 5-Session Pack', amountCents: 37500, amountLabel: '$375', serviceCategory: 'rlt', serviceName: 'Red Light Therapy \u2014 5-Session Pack' })}>
                  Buy Pack &mdash; $375
                </button>
              </div>
              <div className="svc-price-card">
                <h3>10-Session Pack</h3>
                <div className="svc-card-price">$600</div>
                <div className="svc-card-detail">$60/session</div>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'RLT 10-Session Pack', amountCents: 60000, amountLabel: '$600', serviceCategory: 'rlt', serviceName: 'Red Light Therapy \u2014 10-Session Pack' })}>
                  Buy Pack &mdash; $600
                </button>
              </div>
              <div className="svc-price-card svc-price-card-featured">
                <div className="svc-card-badge">MEMBERSHIP</div>
                <h3>RLT Reset</h3>
                <div className="svc-card-price">$399/mo</div>
                <div className="svc-card-detail">Up to 12 sessions/month</div>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'RLT Reset Membership', amountCents: 39900, amountLabel: '$399/mo', serviceCategory: 'rlt', serviceName: 'Red Light Reset Membership' })}>
                  Start Membership
                </button>
              </div>
            </div>

            {/* Combo Memberships */}
            <h2 className="svc-section-title svc-mt">HBOT + RED LIGHT COMBO</h2>
            <p className="svc-section-sub">Back-to-back sessions. 3-month minimum, then month-to-month.</p>

            <div className="svc-price-grid svc-price-grid-3">
              {[
                { freq: '1x/Week', price: '$899/mo', cents: 89900, detail: '4 HBOT + 4 RLT' },
                { freq: '2x/Week', price: '$1,499/mo', cents: 149900, detail: '8 HBOT + 8 RLT', popular: true },
                { freq: '3x/Week', price: '$1,999/mo', cents: 199900, detail: '12 HBOT + 12 RLT' },
              ].map((m, i) => (
                <div key={i} className={`svc-price-card ${m.popular ? 'svc-price-card-featured' : ''}`}>
                  {m.popular && <div className="svc-card-badge">MOST POPULAR</div>}
                  <h3>Combo {m.freq}</h3>
                  <div className="svc-card-price">{m.price}</div>
                  <div className="svc-card-detail">{m.detail}</div>
                  <button className="svc-btn-book" onClick={() => openCheckout({ name: `HBOT + RLT Combo \u2014 ${m.freq}`, amountCents: m.cents, amountLabel: m.price, serviceCategory: 'hbot', serviceName: `HBOT + RLT Combo Membership \u2014 ${m.freq}` })}>
                    Start Membership
                  </button>
                </div>
              ))}
            </div>

            {/* PRP */}
            <h2 className="svc-section-title svc-mt">PRP THERAPY</h2>
            <p className="svc-section-sub">Platelet-Rich Plasma from your own blood. Joints, tendons, hair, and skin.</p>

            <div className="svc-price-grid svc-price-grid-2">
              <div className="svc-price-card">
                <h3>Single Injection</h3>
                <div className="svc-card-price">$750</div>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'PRP Injection', amountCents: 75000, amountLabel: '$750', serviceCategory: 'injection', serviceName: 'PRP Therapy \u2014 Single Injection' })}>
                  Book &amp; Pay &mdash; $750
                </button>
              </div>
              <div className="svc-price-card svc-price-card-featured">
                <div className="svc-card-badge">SAVE $450</div>
                <h3>3-Injection Pack</h3>
                <div className="svc-card-price">$1,800</div>
                <div className="svc-card-detail">$600/injection</div>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'PRP 3-Injection Pack', amountCents: 180000, amountLabel: '$1,800', serviceCategory: 'injection', serviceName: 'PRP Therapy \u2014 3-Injection Pack' })}>
                  Buy Pack &mdash; $1,800
                </button>
              </div>
            </div>

            {/* Exosome */}
            <h2 className="svc-section-title svc-mt">EXOSOME THERAPY</h2>
            <p className="svc-section-sub">Cellular messengers delivered via IV for systemic regeneration. Consultation required.</p>

            <div className="svc-price-grid svc-price-grid-1">
              <div className="svc-price-card svc-price-card-wide">
                <h3>Exosome Therapy</h3>
                <div className="svc-card-price">Consultation-based</div>
                <div className="svc-card-detail">Pricing discussed at your assessment</div>
                <Link href="/range-assessment" className="svc-btn-start">Book Your Range Assessment &rarr;</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            OPTIMIZATION & WELLNESS
        ════════════════════════════════════════════════════════════════════════ */}
        <section id="optimization" className={`v2-section v2-bg-light v2-reveal ${visible['optimization'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> OPTIMIZATION & WELLNESS</div>

            {/* HRT */}
            <h2 className="svc-section-title">HORMONE OPTIMIZATION</h2>
            <p className="svc-section-sub">All-inclusive HRT membership. Requires baseline labs.</p>

            <div className="svc-price-grid svc-price-grid-1">
              <div className="svc-price-card svc-price-card-wide">
                <h3>HRT Membership</h3>
                <div className="svc-card-price">$250/month</div>
                <ul className="svc-card-list">
                  <li>All hormone medications included</li>
                  <li>Ongoing lab monitoring included</li>
                  <li>Provider check-ins &amp; dose adjustments</li>
                  <li>One Range IV per month ($225 value)</li>
                </ul>
                <div className="svc-card-note">Requires baseline lab panel (Essential $350 / Elite $750)</div>
                <Link href="/range-assessment" className="svc-btn-start">Book Your Range Assessment &rarr;</Link>
              </div>
            </div>

            {/* Weight Loss */}
            <h2 className="svc-section-title svc-mt">MEDICAL WEIGHT LOSS</h2>
            <p className="svc-section-sub">Provider-managed GLP-1 medication program. Requires baseline labs.</p>

            <div className="svc-price-grid svc-price-grid-1">
              <div className="svc-price-card svc-price-card-wide">
                <h3>Weight Loss Program</h3>
                <div className="svc-card-price">From $399/month</div>
                <ul className="svc-card-list">
                  <li>Medication included (Tirzepatide, Semaglutide, or Retatrutide)</li>
                  <li>Monthly provider check-ins &amp; dose adjustments</li>
                  <li>Direct messaging with your provider</li>
                  <li>Nutrition guidance included</li>
                </ul>
                <div className="svc-card-note">Requires baseline lab panel (Essential $350 / Elite $750)</div>
                <Link href="/range-assessment" className="svc-btn-start">Book Your Range Assessment &rarr;</Link>
              </div>
            </div>

            {/* Peptide Therapy */}
            <h2 className="svc-section-title svc-mt">PEPTIDE THERAPY</h2>
            <p className="svc-section-sub">Targeted protocols for recovery, growth hormone support, immune function, and more.</p>

            <div className="svc-price-grid svc-price-grid-1">
              <div className="svc-price-card svc-price-card-wide">
                <h3>Peptide Protocols</h3>
                <div className="svc-card-price">$150&ndash;400/month</div>
                <div className="svc-card-detail">Varies by peptide and protocol &mdash; discussed at your assessment</div>
                <ul className="svc-card-list">
                  <li>BPC-157 + TB-4 for recovery &amp; healing</li>
                  <li>Growth hormone secretagogues (CJC/Ipamorelin, Tesamorelin)</li>
                  <li>Immune, sleep, cognitive, and longevity peptides</li>
                  <li>Pre-filled syringes, prescription required</li>
                </ul>
                <Link href="/range-assessment" className="svc-btn-start">Book Your Range Assessment &rarr;</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            LABS & TESTING
        ════════════════════════════════════════════════════════════════════════ */}
        <section id="labs" className={`v2-section v2-reveal ${visible['labs'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> LABS & TESTING</div>

            <div className="svc-price-grid svc-price-grid-2">
              <div className="svc-price-card">
                <h3>Essential Blood Panel</h3>
                <div className="svc-card-price">$350</div>
                <div className="svc-card-detail">Includes provider visit to review results</div>
                <ul className="svc-card-list">
                  <li>CMP, Lipid Panel, CBC</li>
                  <li>Hormones (gender-specific) + Thyroid panel</li>
                  <li>Fasting Insulin, HgbA1c, Vitamin D</li>
                  <li>Best for first-time labs or general health check</li>
                </ul>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'Essential Blood Panel', amountCents: 35000, amountLabel: '$350', serviceCategory: 'lab_panel', serviceName: 'Lab Panel \u2014 Essential' })}>
                  Book &amp; Pay &mdash; $350
                </button>
              </div>
              <div className="svc-price-card svc-price-card-featured">
                <div className="svc-card-badge">MOST COMPLETE</div>
                <h3>Elite Blood Panel</h3>
                <div className="svc-card-price">$750</div>
                <div className="svc-card-detail">Includes provider visit to review results</div>
                <ul className="svc-card-list">
                  <li>Everything in Essential PLUS:</li>
                  <li>Heart: ApoA-1, ApoB, Lp(a), Homocysteine</li>
                  <li>Inflammation: CRP-HS, Sed Rate</li>
                  <li>Hormones: DHEA-S, FSH, LH, IGF-1, Cortisol</li>
                  <li>Best for full health picture</li>
                </ul>
                <button className="svc-btn-book" onClick={() => openCheckout({ name: 'Elite Blood Panel', amountCents: 75000, amountLabel: '$750', serviceCategory: 'lab_panel', serviceName: 'Lab Panel \u2014 Elite' })}>
                  Book &amp; Pay &mdash; $750
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="v2-section v2-cta-section">
          <div className="v2-container v2-cta-inner">
            <h2>NOT SURE<br />WHERE TO<br />START?</h2>
            <div className="v2-cta-rule" />
            <p>Book your $197 Range Assessment &mdash; it goes directly toward treatment.</p>
            <div className="v2-cta-buttons">
              <Link href="/range-assessment" className="v2-btn-white">Book Your Range Assessment</Link>
              <a href="tel:9499973988" className="v2-btn-outline">(949) 997-3988</a>
            </div>
            <div className="v2-cta-location">
              Range Medical &bull; 1901 Westcliff Dr, Newport Beach &bull; Walk-ins welcome
            </div>
          </div>
        </section>
      </div>

      {/* ── CHECKOUT MODAL ── */}
      {checkoutProduct && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          productName={checkoutProduct.name}
          amountCents={checkoutProduct.amountCents}
          amountLabel={checkoutProduct.amountLabel}
          description={checkoutProduct.serviceName}
          serviceCategory={checkoutProduct.serviceCategory}
          serviceName={checkoutProduct.serviceName}
        />
      )}

      <style jsx>{`
        /* ── RESET ── */
        :global(body) { margin: 0; font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; background: #ffffff; color: #1a1a1a; }

        /* ── HERO ── */
        .v2-hero { padding: 6rem 2rem 5rem; max-width: 1200px; margin: 0 auto; }
        .v2-hero-inner { max-width: 800px; }
        .v2-label { display: flex; align-items: center; gap: 0.625rem; font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.14em; color: #737373; text-transform: uppercase; margin-bottom: 2rem; }
        .v2-dot { display: inline-block; width: 8px; height: 8px; background: #808080; }
        .v2-hero h1 { font-size: clamp(3rem, 8vw, 5.5rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.03em; color: #1a1a1a; margin: 0 0 2.5rem; }
        .v2-hero-rule { width: 100%; max-width: 700px; height: 1px; background: #e0e0e0; margin-bottom: 2rem; }
        .v2-hero-body { font-size: 1.0625rem; line-height: 1.75; color: #737373; max-width: 520px; margin: 0; }
        .svc-phone-link { color: #1a1a1a; text-decoration: none; font-weight: 600; border-bottom: 1px solid #d0d0d0; transition: border-color 0.2s; }
        .svc-phone-link:hover { border-color: #1a1a1a; }

        /* ── JUMP NAV ── */
        .svc-jump-bar { position: sticky; top: 64px; z-index: 90; background: #ffffff; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; }
        .svc-jump-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; gap: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .svc-jump-inner::-webkit-scrollbar { display: none; }
        .svc-jump-link { flex-shrink: 0; font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.1em; color: #737373; text-decoration: none; padding: 1rem 1.5rem; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; }
        .svc-jump-link:hover { color: #1a1a1a; border-bottom-color: #1a1a1a; }

        /* ── SECTIONS ── */
        .v2-section { padding: 5rem 2rem; }
        .v2-bg-light { background: #fafafa; }
        .v2-container { max-width: 1200px; margin: 0 auto; }

        /* ── SECTION TITLES ── */
        .svc-section-title { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.02em; color: #1a1a1a; margin: 0 0 0.5rem; text-transform: uppercase; }
        .svc-subsection-title { font-size: 1.125rem; font-weight: 800; letter-spacing: -0.01em; color: #1a1a1a; margin: 0 0 0.5rem; text-transform: uppercase; }
        .svc-section-sub { font-size: 0.9375rem; line-height: 1.6; color: #737373; margin: 0 0 2rem; max-width: 600px; }
        .svc-mt { margin-top: 4rem; }
        .svc-mt-sm { margin-top: 2.5rem; }

        /* ── PRICE GRID ── */
        .svc-price-grid { display: grid; gap: 1.25rem; }
        .svc-price-grid-1 { grid-template-columns: 1fr; max-width: 600px; }
        .svc-price-grid-2 { grid-template-columns: 1fr 1fr; }
        .svc-price-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .svc-price-grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }

        /* ── PRICE CARD ── */
        .svc-price-card { position: relative; padding: 1.75rem; border: 1px solid #e0e0e0; background: #ffffff; display: flex; flex-direction: column; transition: border-color 0.2s, box-shadow 0.2s; }
        .svc-price-card:hover { border-color: #c0c0c0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .svc-price-card-featured { border: 2px solid #1a1a1a; }
        .svc-price-card-featured:hover { border-color: #1a1a1a; }
        .svc-price-card-compact { padding: 1.25rem; }
        .svc-price-card-wide { max-width: 600px; }

        .svc-card-badge { position: absolute; top: -10px; left: 1.25rem; font-size: 0.5625rem; font-weight: 800; letter-spacing: 0.14em; color: #ffffff; background: #1a1a1a; padding: 0.25rem 0.625rem; }
        .svc-card-icon { font-size: 1.5rem; margin-bottom: 0.75rem; }
        .svc-price-card h3 { font-size: 1rem; font-weight: 800; color: #1a1a1a; margin: 0 0 0.5rem; letter-spacing: -0.01em; }
        .svc-card-price { font-size: 1.5rem; font-weight: 900; color: #1a1a1a; margin-bottom: 0.25rem; }
        .svc-card-original { text-decoration: line-through; color: #a0a0a0; font-size: 1rem; font-weight: 500; margin-right: 0.375rem; }
        .svc-card-detail { font-size: 0.8125rem; color: #737373; margin-bottom: 0.75rem; }
        .svc-card-note { font-size: 0.8125rem; color: #737373; font-style: italic; padding: 0.625rem 0.875rem; background: #f5f5f5; border-left: 3px solid #e0e0e0; margin-bottom: 1rem; }
        .svc-card-list { list-style: none; padding: 0; margin: 0 0 1.25rem; flex: 1; }
        .svc-card-list li { font-size: 0.8125rem; color: #525252; line-height: 1.6; padding: 0.1875rem 0 0.1875rem 1.125rem; position: relative; }
        .svc-card-list li::before { content: '–'; position: absolute; left: 0; color: #808080; font-weight: 600; }

        /* ── BUTTONS ── */
        .svc-btn-book { display: block; width: 100%; padding: 0.75rem 1rem; background: #1a1a1a; color: #ffffff; font-family: 'Inter', -apple-system, sans-serif; font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; border: none; cursor: pointer; transition: background 0.2s; margin-top: auto; }
        .svc-btn-book:hover { background: #404040; }

        :global(.svc-btn-start) { display: block; width: 100%; padding: 0.75rem 1rem; background: transparent; color: #1a1a1a; font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; border: 1.5px solid #1a1a1a; text-decoration: none; text-align: center; transition: all 0.2s; margin-top: auto; }
        :global(.svc-btn-start:hover) { background: #1a1a1a; color: #ffffff; }

        /* ── CTA ── */
        .v2-cta-section { background: #1a1a1a; text-align: center; }
        .v2-cta-inner h2 { font-size: clamp(2.25rem, 5vw, 3.5rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.02em; color: #ffffff; margin: 0 0 1.5rem; }
        .v2-cta-rule { width: 60px; height: 1px; background: #404040; margin: 0 auto 2rem; }
        .v2-cta-inner p { font-size: 1rem; color: #737373; margin: 0 0 2.5rem; }
        .v2-cta-buttons { display: flex; justify-content: center; gap: 1rem; margin-bottom: 3rem; flex-wrap: wrap; }
        :global(.v2-btn-white) { display: inline-block; background: #ffffff; color: #1a1a1a; padding: 0.875rem 2rem; font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.12em; text-decoration: none; transition: all 0.2s; }
        :global(.v2-btn-white:hover) { background: #f0f0f0; }
        :global(.v2-btn-outline) { display: inline-block; background: transparent; color: #ffffff; padding: 0.875rem 2rem; font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.12em; text-decoration: none; border: 1px solid #404040; transition: all 0.2s; }
        :global(.v2-btn-outline:hover) { border-color: #ffffff; }
        .v2-cta-location { font-size: 0.8125rem; color: #525252; letter-spacing: 0.03em; }

        /* ── ANIMATIONS ── */
        .v2-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .v2-visible { opacity: 1; transform: translateY(0); }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .v2-hero { padding: 4rem 1.5rem 3rem; }
          .v2-hero h1 { font-size: clamp(2.25rem, 10vw, 3.5rem); }
          .v2-section { padding: 3.5rem 1.5rem; }
          .svc-jump-link { padding: 0.875rem 1rem; font-size: 0.625rem; }
          .svc-price-grid-2, .svc-price-grid-3, .svc-price-grid-4 { grid-template-columns: 1fr 1fr; }
          .svc-mt { margin-top: 3rem; }
          .v2-cta-inner h2 { font-size: clamp(2rem, 8vw, 3rem); }
        }

        @media (max-width: 600px) {
          .svc-price-grid-2, .svc-price-grid-3, .svc-price-grid-4 { grid-template-columns: 1fr; }
        }
      `}</style>
    </Layout>
  );
}
