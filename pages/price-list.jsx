import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function PriceList() {
  const [visible, setVisible] = useState({});

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
    document.querySelectorAll('.pl-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Price List | Range Medical | Newport Beach</title>
        <meta name="description" content="Complete price list for all Range Medical services. IV therapy, injections, HBOT, red light therapy, hormone optimization, weight loss, peptides, labs, and more." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div>
        {/* HEADER */}
        <header className="pl-header">
          <div className="pl-header-inner">
            <img
              src="https://www.range-medical.com/brand/range_logo_transparent_black.png"
              alt="Range Medical"
              className="pl-logo"
            />
            <a href="tel:9499973988" className="pl-header-phone">(949) 997-3988</a>
          </div>
        </header>

        {/* HERO */}
        <section className="pl-hero">
          <div className="pl-hero-inner">
            <div className="pl-label"><span className="pl-dot" /> PRICE LIST</div>
            <h1>Our prices. <em>No surprises.</em></h1>
            <div className="pl-hero-rule" />
            <p className="pl-hero-body">
              Every service, every price. Questions? Call or text us at{' '}
              <a href="tel:9499973988" className="pl-phone-link">(949) 997-3988</a>.
            </p>
          </div>
        </section>

        {/* JUMP NAV */}
        <div className="pl-jump-bar">
          <div className="pl-jump-inner">
            <a href="#iv" className="pl-jump-link">IV THERAPY</a>
            <a href="#injections" className="pl-jump-link">INJECTIONS</a>
            <a href="#hbot" className="pl-jump-link">HBOT</a>
            <a href="#rlt" className="pl-jump-link">RED LIGHT</a>
            <a href="#memberships" className="pl-jump-link">MEMBERSHIPS</a>
            <a href="#packages" className="pl-jump-link">PACKAGES</a>
            <a href="#programs" className="pl-jump-link">PROGRAMS</a>
            <a href="#labs" className="pl-jump-link">LABS</a>
          </div>
        </div>

        {/* IV THERAPY */}
        <section id="iv" className={`pl-section pl-reveal ${visible['iv'] ? 'pl-visible' : ''}`}>
          <div className="pl-container">
            <div className="pl-label"><span className="pl-dot" /> IV THERAPY</div>
            <h2 className="pl-section-title">The Range IV</h2>
            <p className="pl-section-sub">Choose your formula. 5 vitamins &amp; minerals included. Add-ons +$35 each.</p>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">Immune Defense</span>
                <span className="pl-dots" />
                <span className="pl-price">$225</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">Energy &amp; Vitality</span>
                <span className="pl-dots" />
                <span className="pl-price">$225</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">Recovery &amp; Performance</span>
                <span className="pl-dots" />
                <span className="pl-price">$225</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">Detox &amp; Cellular Repair</span>
                <span className="pl-dots" />
                <span className="pl-price">$225</span>
              </div>
              <div className="pl-row pl-row-addon">
                <span className="pl-name">IV Add-on (per nutrient)</span>
                <span className="pl-dots" />
                <span className="pl-price">+$35</span>
              </div>
            </div>

            <h2 className="pl-section-title pl-mt">NAD+ IV</h2>
            <p className="pl-section-sub">Cellular energy, brain function, and longevity.</p>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">NAD+ 225mg <span className="pl-note">60 min</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$375</span>
              </div>
              <div className="pl-row pl-row-popular">
                <span className="pl-name">NAD+ 500mg <span className="pl-note">90 min</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$525</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">NAD+ 750mg <span className="pl-note">2 hrs</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$650</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">NAD+ 1000mg <span className="pl-note">3 hrs</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$775</span>
              </div>
            </div>

            <h2 className="pl-section-title pl-mt">Glutathione IV</h2>
            <p className="pl-section-sub">Master antioxidant. Detox, immune support, skin health.</p>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">Glutathione 1g</span>
                <span className="pl-dots" />
                <span className="pl-price">$170</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">Glutathione 2g</span>
                <span className="pl-dots" />
                <span className="pl-price">$190</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">Glutathione 3g</span>
                <span className="pl-dots" />
                <span className="pl-price">$215</span>
              </div>
            </div>

            <h2 className="pl-section-title pl-mt">High-Dose Vitamin C IV</h2>
            <p className="pl-section-sub">Therapeutic doses for immune support. Requires G6PD blood work.</p>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">Vitamin C 25g <span className="pl-note">90 min</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$215</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">Vitamin C 50g <span className="pl-note">90 min</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$255</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">Vitamin C 75g <span className="pl-note">2 hrs</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$330</span>
              </div>
            </div>

            <h2 className="pl-section-title pl-mt">Methylene Blue IV</h2>
            <p className="pl-section-sub">Mitochondrial support and cognitive enhancement. Requires baseline labs.</p>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">Methylene Blue IV <span className="pl-note">60 min</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$450</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">MB + Vitamin C + Magnesium Combo <span className="pl-note">2 hrs</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$750</span>
              </div>
            </div>
          </div>
        </section>

        {/* INJECTIONS */}
        <section id="injections" className={`pl-section pl-bg-light pl-reveal ${visible['injections'] ? 'pl-visible' : ''}`}>
          <div className="pl-container">
            <div className="pl-label"><span className="pl-dot" /> INJECTIONS</div>

            <h2 className="pl-section-title">Standard Injections</h2>
            <p className="pl-section-sub">In and out in 5 minutes. No IV needed.</p>
            <div className="pl-table">
              {['B12 (Methylcobalamin)', 'B-Complex', 'Vitamin D3', 'Biotin', 'Amino Blend', 'NAC', 'BCAA'].map((name) => (
                <div key={name} className="pl-row">
                  <span className="pl-name">{name}</span>
                  <span className="pl-dots" />
                  <span className="pl-price">$35</span>
                </div>
              ))}
            </div>

            <h2 className="pl-section-title pl-mt">Premium Injections</h2>
            <div className="pl-table">
              {[
                { name: 'L-Carnitine', desc: 'Fat metabolism & energy' },
                { name: 'Glutathione (200mg)', desc: 'Master antioxidant' },
                { name: 'MIC-B12 (Skinny Shot)', desc: 'Metabolism & fat breakdown' },
              ].map((inj) => (
                <div key={inj.name} className="pl-row">
                  <span className="pl-name">{inj.name} <span className="pl-note">{inj.desc}</span></span>
                  <span className="pl-dots" />
                  <span className="pl-price">$50</span>
                </div>
              ))}
            </div>

            <h2 className="pl-section-title pl-mt">NAD+ Injections</h2>
            <p className="pl-section-sub">Subcutaneous injection. $0.50/mg.</p>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">NAD+ 50mg</span>
                <span className="pl-dots" />
                <span className="pl-price">$25</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">NAD+ 100mg</span>
                <span className="pl-dots" />
                <span className="pl-price">$50</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">NAD+ 150mg</span>
                <span className="pl-dots" />
                <span className="pl-price">$75</span>
              </div>
            </div>

            <h2 className="pl-section-title pl-mt">Injection Packages</h2>
            <p className="pl-section-sub">Buy 10, get 12. Take home for self-administration.</p>
            <div className="pl-table">
              <div className="pl-row pl-row-popular">
                <span className="pl-name">Standard Package <span className="pl-note">12 injections &mdash; save $70</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$350</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">NAD+ / Premium Package <span className="pl-note">12 injections &mdash; save $100</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$500</span>
              </div>
            </div>

            <h2 className="pl-section-title pl-mt">Specialty Injections</h2>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">Cortisone Injection + Consult</span>
                <span className="pl-dots" />
                <span className="pl-price">$250</span>
              </div>
            </div>
          </div>
        </section>

        {/* HBOT */}
        <section id="hbot" className={`pl-section pl-reveal ${visible['hbot'] ? 'pl-visible' : ''}`}>
          <div className="pl-container">
            <div className="pl-label"><span className="pl-dot" /> HYPERBARIC OXYGEN THERAPY</div>
            <h2 className="pl-section-title">HBOT Sessions</h2>
            <p className="pl-section-sub">60 minutes at 2.0 ATA. Pressurized oxygen for healing and recovery.</p>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">Single Session</span>
                <span className="pl-dots" />
                <span className="pl-price">$185</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">5-Session Pack <span className="pl-note">$170/session &mdash; save 8%</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$850</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">10-Session Pack <span className="pl-note">$160/session &mdash; save 14%</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$1,600</span>
              </div>
              <div className="pl-row pl-row-addon">
                <span className="pl-name">Additional Member Session</span>
                <span className="pl-dots" />
                <span className="pl-price">$150</span>
              </div>
            </div>
          </div>
        </section>

        {/* RED LIGHT THERAPY */}
        <section id="rlt" className={`pl-section pl-bg-light pl-reveal ${visible['rlt'] ? 'pl-visible' : ''}`}>
          <div className="pl-container">
            <div className="pl-label"><span className="pl-dot" /> RED LIGHT THERAPY</div>
            <h2 className="pl-section-title">Red Light Therapy Sessions</h2>
            <p className="pl-section-sub">Full-body 660&ndash;850nm wavelengths for cellular recovery and tissue repair.</p>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">Single Session</span>
                <span className="pl-dots" />
                <span className="pl-price">$85</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">5-Session Pack <span className="pl-note">$75/session</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$375</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">10-Session Pack <span className="pl-note">$60/session</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$600</span>
              </div>
              <div className="pl-row pl-row-addon">
                <span className="pl-name">Additional Member Session</span>
                <span className="pl-dots" />
                <span className="pl-price">$50</span>
              </div>
            </div>
          </div>
        </section>

        {/* MEMBERSHIPS */}
        <section id="memberships" className={`pl-section pl-reveal ${visible['memberships'] ? 'pl-visible' : ''}`}>
          <div className="pl-container">
            <div className="pl-label"><span className="pl-dot" /> MEMBERSHIPS</div>
            <p className="pl-section-sub">3-month minimum, then month-to-month. Billed every 4 weeks.</p>

            <h2 className="pl-section-title">HBOT Memberships</h2>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">1x/Week <span className="pl-note">4 sessions &mdash; $137/session</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$549</span>
              </div>
              <div className="pl-row pl-row-popular">
                <span className="pl-name">2x/Week <span className="pl-note">8 sessions &mdash; $125/session</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$999</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">3x/Week <span className="pl-note">12 sessions &mdash; $117/session</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$1,399</span>
              </div>
            </div>

            <h2 className="pl-section-title pl-mt">Red Light Therapy Membership</h2>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">RLT Reset <span className="pl-note">Up to 12 sessions per cycle</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$399</span>
              </div>
            </div>

            <h2 className="pl-section-title pl-mt">HBOT + Red Light Combo</h2>
            <p className="pl-section-sub">Back-to-back HBOT and red light sessions.</p>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">Combo 1x/Week <span className="pl-note">4 HBOT + 4 RLT</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$899</span>
              </div>
              <div className="pl-row pl-row-popular">
                <span className="pl-name">Combo 2x/Week <span className="pl-note">8 HBOT + 8 RLT</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$1,499</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">Combo 3x/Week <span className="pl-note">12 HBOT + 12 RLT</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$1,999</span>
              </div>
            </div>

            <h2 className="pl-section-title pl-mt">HRT Membership</h2>
            <p className="pl-section-sub">All-inclusive hormone optimization. Requires baseline lab panel.</p>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">HRT Membership</span>
                <span className="pl-dots" />
                <span className="pl-price">$250/mo</span>
              </div>
            </div>
            <div className="pl-includes">
              <span className="pl-includes-label">Includes:</span> All hormone medications, ongoing lab monitoring, provider check-ins, one Range IV per month ($225 value)
            </div>
          </div>
        </section>

        {/* PACKAGES */}
        <section id="packages" className={`pl-section pl-bg-light pl-reveal ${visible['packages'] ? 'pl-visible' : ''}`}>
          <div className="pl-container">
            <div className="pl-label"><span className="pl-dot" /> PACKAGES</div>

            <h2 className="pl-section-title">Cellular Energy Reset</h2>
            <div className="pl-table">
              <div className="pl-row pl-row-popular">
                <span className="pl-name">6-Week Cellular Energy Reset <span className="pl-note">18 HBOT + 18 RLT &mdash; save $1,000</span></span>
                <span className="pl-dots" />
                <span className="pl-price"><span className="pl-original">$3,999</span> $2,999</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">4-Week Maintenance <span className="pl-note">Continuation program</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$599</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">4-Week Maintenance Premium</span>
                <span className="pl-dots" />
                <span className="pl-price">$799</span>
              </div>
            </div>

            <h2 className="pl-section-title pl-mt">PRP Therapy</h2>
            <p className="pl-section-sub">Platelet-Rich Plasma from your own blood. Joints, tendons, hair, and skin.</p>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">Single Injection</span>
                <span className="pl-dots" />
                <span className="pl-price">$750</span>
              </div>
              <div className="pl-row pl-row-popular">
                <span className="pl-name">3-Injection Pack <span className="pl-note">$600/injection &mdash; save $450</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$1,800</span>
              </div>
            </div>

            <h2 className="pl-section-title pl-mt">Exosome Therapy</h2>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">Exosome IV <span className="pl-note">Systemic regeneration</span></span>
                <span className="pl-dots" />
                <span className="pl-price">By consultation</span>
              </div>
            </div>
          </div>
        </section>

        {/* PROGRAMS */}
        <section id="programs" className={`pl-section pl-reveal ${visible['programs'] ? 'pl-visible' : ''}`}>
          <div className="pl-container">
            <div className="pl-label"><span className="pl-dot" /> PROGRAMS</div>

            <h2 className="pl-section-title">Medical Weight Loss</h2>
            <p className="pl-section-sub">Provider-managed GLP-1 medication program. Medication included. Requires baseline labs.</p>

            <h3 className="pl-subsection">Tirzepatide</h3>
            <div className="pl-table">
              {[
                { name: 'Dose 1', price: '$399/mo' },
                { name: 'Dose 2', price: '$549/mo' },
                { name: 'Dose 3', price: '$599/mo' },
                { name: 'Dose 4', price: '$649/mo' },
                { name: 'Dose 5', price: '$699/mo' },
              ].map((d) => (
                <div key={d.name} className="pl-row">
                  <span className="pl-name">{d.name}</span>
                  <span className="pl-dots" />
                  <span className="pl-price">{d.price}</span>
                </div>
              ))}
            </div>

            <h3 className="pl-subsection pl-mt-sm">Semaglutide</h3>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">Semaglutide</span>
                <span className="pl-dots" />
                <span className="pl-price">$350/mo</span>
              </div>
            </div>

            <h3 className="pl-subsection pl-mt-sm">Retatrutide</h3>
            <div className="pl-table">
              {[
                { name: 'Dose 1', price: '$499/mo' },
                { name: 'Dose 2', price: '$599/mo' },
                { name: 'Dose 3', price: '$699/mo' },
                { name: 'Dose 4', price: '$749/mo' },
                { name: 'Dose 5', price: '$799/mo' },
                { name: 'Dose 6', price: '$859/mo' },
              ].map((d) => (
                <div key={d.name} className="pl-row">
                  <span className="pl-name">{d.name}</span>
                  <span className="pl-dots" />
                  <span className="pl-price">{d.price}</span>
                </div>
              ))}
            </div>

            <h2 className="pl-section-title pl-mt">Peptide Therapy</h2>
            <p className="pl-section-sub">Targeted protocols for recovery, performance, immune function, and longevity.</p>

            <h3 className="pl-subsection">Recovery</h3>
            <div className="pl-table">
              {[
                { name: 'BPC-157 / TB-4 — 10-Day', price: '$250' },
                { name: 'BPC-157 / TB-4 — 20-Day', price: '$450' },
                { name: 'BPC-157 / TB-4 — 30-Day', price: '$675' },
                { name: 'Recovery 4-Blend — 10-Day', price: '$275' },
                { name: 'Recovery 4-Blend — 20-Day', price: '$500' },
                { name: 'Recovery 4-Blend — 30-Day', price: '$725' },
              ].map((p) => (
                <div key={p.name} className="pl-row">
                  <span className="pl-name">{p.name}</span>
                  <span className="pl-dots" />
                  <span className="pl-price">{p.price}</span>
                </div>
              ))}
            </div>

            <h3 className="pl-subsection pl-mt-sm">Skin &amp; Anti-Aging</h3>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">GHK-Cu &mdash; 30-Day</span>
                <span className="pl-dots" />
                <span className="pl-price">$250</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">GHK-Cu Cream</span>
                <span className="pl-dots" />
                <span className="pl-price">$299</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">GLOW &mdash; 30-Day</span>
                <span className="pl-dots" />
                <span className="pl-price">$400</span>
              </div>
            </div>

            <h3 className="pl-subsection pl-mt-sm">Performance &amp; Longevity</h3>
            <div className="pl-table">
              {[
                { name: 'MOTS-C Phase 1', price: '$400' },
                { name: 'MOTS-C Phase 2', price: '$700' },
                { name: '2X Blend — Phase 1', price: '$400' },
                { name: '2X Blend — Phase 2', price: '$450' },
                { name: '2X Blend — Phase 3', price: '$500' },
                { name: '3X Blend — Phase 1', price: '$425' },
                { name: '3X Blend — Phase 2', price: '$475' },
                { name: '3X Blend — Phase 3', price: '$525' },
                { name: '4X Blend — Phase 1', price: '$450' },
                { name: '4X Blend — Phase 2', price: '$500' },
                { name: '4X Blend — Phase 3', price: '$550' },
              ].map((p) => (
                <div key={p.name} className="pl-row">
                  <span className="pl-name">{p.name}</span>
                  <span className="pl-dots" />
                  <span className="pl-price">{p.price}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LABS */}
        <section id="labs" className={`pl-section pl-bg-light pl-reveal ${visible['labs'] ? 'pl-visible' : ''}`}>
          <div className="pl-container">
            <div className="pl-label"><span className="pl-dot" /> LABS &amp; TESTING</div>
            <h2 className="pl-section-title">Blood Panels</h2>
            <p className="pl-section-sub">Provider visit to review results included with every panel.</p>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">Essential Blood Panel <span className="pl-note">CMP, Lipid, CBC, Hormones, Thyroid, Insulin, HgbA1c, Vitamin D</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$350</span>
              </div>
              <div className="pl-row pl-row-popular">
                <span className="pl-name">Elite Blood Panel <span className="pl-note">Everything in Essential + ApoA-1, ApoB, Lp(a), CRP-HS, DHEA-S, IGF-1, and more</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$750</span>
              </div>
              <div className="pl-row">
                <span className="pl-name">MB Pre-Screening Panel <span className="pl-note">G6PD, CMP, CBC</span></span>
                <span className="pl-dots" />
                <span className="pl-price">$125</span>
              </div>
            </div>

            <h2 className="pl-section-title pl-mt">Specialty Testing</h2>
            <div className="pl-table">
              <div className="pl-row">
                <span className="pl-name">GI Effects Stool Test</span>
                <span className="pl-dots" />
                <span className="pl-price">$999</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pl-cta-section">
          <div className="pl-container pl-cta-inner">
            <h2>Ready to <em>start?</em></h2>
            <div className="pl-cta-rule" />
            <p>Call or text us to schedule your first visit.</p>
            <div className="pl-cta-buttons">
              <a href="tel:9499973988" className="pl-btn-white">(949) 997-3988</a>
            </div>
            <div className="pl-cta-location">
              Range Medical &bull; 1901 Westcliff Dr, Suite 10, Newport Beach &bull; Walk-ins welcome
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        :global(body) { margin: 0; font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; background: #ffffff; color: #1a1a1a; }

        /* HEADER */
        .pl-header { border-bottom: 1px solid #e0e0e0; background: #ffffff; position: sticky; top: 0; z-index: 100; }
        .pl-header-inner { max-width: 1200px; margin: 0 auto; padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; }
        .pl-logo { height: 28px; width: auto; }
        .pl-header-phone { font-size: 0.8125rem; font-weight: 700; color: #1a1a1a; text-decoration: none; letter-spacing: 0.02em; }
        .pl-header-phone:hover { opacity: 0.7; }

        /* HERO */
        .pl-hero { padding: 5rem 2rem 4rem; max-width: 1200px; margin: 0 auto; }
        .pl-hero-inner { max-width: 800px; }
        .pl-label { display: flex; align-items: center; gap: 0.625rem; font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.14em; color: #737373; text-transform: uppercase; margin-bottom: 2rem; }
        .pl-dot { display: inline-block; width: 8px; height: 8px; background: #808080; }
        .pl-hero h1 { font-size: clamp(3rem, 8vw, 5.5rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.03em; color: #1a1a1a; margin: 0 0 2.5rem; }
        .pl-hero-rule { width: 100%; max-width: 700px; height: 1px; background: #e0e0e0; margin-bottom: 2rem; }
        .pl-hero-body { font-size: 1.0625rem; line-height: 1.75; color: #737373; max-width: 520px; margin: 0; }
        .pl-phone-link { color: #1a1a1a; text-decoration: none; font-weight: 600; border-bottom: 1px solid #d0d0d0; transition: border-color 0.2s; }
        .pl-phone-link:hover { border-color: #1a1a1a; }

        /* JUMP NAV */
        .pl-jump-bar { position: sticky; top: 53px; z-index: 90; background: #ffffff; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; }
        .pl-jump-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; gap: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .pl-jump-inner::-webkit-scrollbar { display: none; }
        .pl-jump-link { flex-shrink: 0; font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.1em; color: #737373; text-decoration: none; padding: 1rem 1.25rem; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; }
        .pl-jump-link:hover { color: #1a1a1a; border-bottom-color: #1a1a1a; }

        /* SECTIONS */
        .pl-section { padding: 5rem 2rem; }
        .pl-bg-light { background: #fafafa; }
        .pl-container { max-width: 800px; margin: 0 auto; }

        /* SECTION TITLES */
        .pl-section-title { font-size: 1.375rem; font-weight: 900; letter-spacing: -0.02em; color: #1a1a1a; margin: 0 0 0.5rem; text-transform: uppercase; }
        .pl-section-sub { font-size: 0.9375rem; line-height: 1.6; color: #737373; margin: 0 0 1.5rem; }
        .pl-subsection { font-size: 0.8125rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #737373; margin: 0 0 0.75rem; }
        .pl-mt { margin-top: 3.5rem; }
        .pl-mt-sm { margin-top: 2rem; }

        /* PRICE TABLE */
        .pl-table { margin-bottom: 0.5rem; }
        .pl-row { display: flex; align-items: baseline; padding: 0.875rem 0; border-bottom: 1px solid #ebebeb; gap: 0.75rem; }
        .pl-row:last-child { border-bottom: none; }
        .pl-name { font-size: 0.9375rem; font-weight: 600; color: #1a1a1a; white-space: nowrap; flex-shrink: 0; }
        .pl-note { font-size: 0.8125rem; font-weight: 400; color: #808080; white-space: normal; }
        .pl-dots { flex: 1; border-bottom: 1px dotted #d0d0d0; min-width: 2rem; margin-bottom: 0.25em; }
        .pl-price { font-size: 0.9375rem; font-weight: 800; color: #1a1a1a; white-space: nowrap; flex-shrink: 0; text-align: right; }
        .pl-original { text-decoration: line-through; color: #a0a0a0; font-weight: 400; margin-right: 0.375rem; font-size: 0.8125rem; }

        /* ROW VARIANTS */
        .pl-row-popular { background: #f7f7f7; margin: 0 -1rem; padding: 0.875rem 1rem; border-radius: 0; position: relative; }
        .pl-row-popular::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #1a1a1a; }
        .pl-row-addon { opacity: 0.7; }

        /* INCLUDES */
        .pl-includes { font-size: 0.8125rem; color: #737373; line-height: 1.7; padding: 0.75rem 1rem; background: #f5f5f5; border-left: 3px solid #e0e0e0; margin-top: 0.75rem; }
        .pl-includes-label { font-weight: 700; color: #525252; }

        /* CTA */
        .pl-cta-section { background: #1a1a1a; text-align: center; padding: 5rem 2rem; }
        .pl-cta-inner h2 { font-size: clamp(2.25rem, 5vw, 3.5rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.02em; color: #ffffff; margin: 0 0 1.5rem; }
        .pl-cta-rule { width: 60px; height: 1px; background: #404040; margin: 0 auto 2rem; }
        .pl-cta-inner p { font-size: 1rem; color: #737373; margin: 0 0 2.5rem; }
        .pl-cta-buttons { display: flex; justify-content: center; gap: 1rem; margin-bottom: 3rem; flex-wrap: wrap; }
        :global(.pl-btn-white) { display: inline-block; background: #ffffff; color: #1a1a1a; padding: 0.875rem 2.5rem; font-size: 0.8125rem; font-weight: 800; letter-spacing: 0.08em; text-decoration: none; transition: all 0.2s; }
        :global(.pl-btn-white:hover) { background: #f0f0f0; }
        .pl-cta-location { font-size: 0.8125rem; color: #525252; letter-spacing: 0.03em; }

        /* ANIMATIONS */
        .pl-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .pl-visible { opacity: 1; transform: translateY(0); }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .pl-hero { padding: 4rem 1.5rem 3rem; }
          .pl-hero h1 { font-size: clamp(2.25rem, 10vw, 3.5rem); }
          .pl-section { padding: 3.5rem 1.5rem; }
          .pl-jump-link { padding: 0.875rem 0.875rem; font-size: 0.625rem; }
          .pl-cta-inner h2 { font-size: clamp(2rem, 8vw, 3rem); }
        }

        @media (max-width: 600px) {
          .pl-row { flex-wrap: wrap; gap: 0.25rem; }
          .pl-name { white-space: normal; flex-basis: 100%; }
          .pl-dots { display: none; }
          .pl-price { margin-left: auto; }
          .pl-row-popular { margin: 0 -0.75rem; padding: 0.875rem 0.75rem; }
        }
      `}</style>
    </>
  );
}
