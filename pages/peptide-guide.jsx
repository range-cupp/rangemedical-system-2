import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Head from 'next/head';
import { VIAL_CATALOG } from '../lib/vial-catalog';

export default function PeptideGuide() {
  const router = useRouter();
  const { vials: vialParam } = router.query;

  const vialIds = vialParam ? vialParam.split(',').map(v => v.trim()) : [];
  const selectedVials = vialIds
    .map(id => VIAL_CATALOG.find(v => v.id === id))
    .filter(Boolean);

  if (!router.isReady) return null;

  if (selectedVials.length === 0) {
    return (
      <Layout title="Peptide Guide | Range Medical" description="Your personalized peptide reconstitution and injection guide from Range Medical.">
        <div className="pg-page">
          <section className="pg-hero">
            <div className="pg-container">
              <div className="v2-label"><span className="v2-dot" /> PEPTIDE GUIDE</div>
              <h1>NO PEPTIDES SELECTED</h1>
              <div className="pg-hero-rule"></div>
              <p className="pg-body-text">This link doesn&apos;t include any peptide information. If you received this from Range Medical, please contact us so we can send you the correct link.</p>
              <div style={{ marginTop: '2rem' }}>
                <a href="tel:+19499973988" className="pg-btn-dark">CALL (949) 997-3988</a>
              </div>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </Layout>
    );
  }

  const vialNames = selectedVials.map(v => v.name).join(' + ');
  const hasMultiple = selectedVials.length > 1;
  const needsReconstitution = selectedVials.filter(v => v.reconstitution !== 'Pre-reconstituted');
  const preReconstituted = selectedVials.filter(v => v.reconstitution === 'Pre-reconstituted');

  return (
    <Layout
      title={`${vialNames} — Peptide Guide | Range Medical`}
      description={`Your personalized reconstitution and injection guide for ${vialNames}. Range Medical, Newport Beach. (949) 997-3988`}
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": `${vialNames} — Peptide Injection Guide`,
              "description": `Patient guide for reconstituting and injecting ${vialNames}.`,
              "url": "https://www.range-medical.com/peptide-guide",
              "provider": {
                "@type": "MedicalBusiness",
                "name": "Range Medical",
                "telephone": "+1-949-997-3988",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "1901 Westcliff Dr. Suite 10",
                  "addressLocality": "Newport Beach",
                  "addressRegion": "CA",
                  "postalCode": "92660",
                  "addressCountry": "US"
                }
              }
            })
          }}
        />
      </Head>

      <div className="pg-page">
        {/* Hero */}
        <section className="pg-hero">
          <div className="pg-container">
            <div className="v2-label"><span className="v2-dot" /> YOUR PEPTIDE GUIDE</div>
            <h1>RECONSTITUTION &amp; INJECTION INSTRUCTIONS</h1>
            <div className="pg-hero-rule"></div>
            <p className="pg-body-text">Everything you need to prepare and inject your peptide{hasMultiple ? 's' : ''} safely and correctly at home.</p>
            <div className="pg-hero-vials">
              {selectedVials.map(v => (
                <div key={v.id} className="pg-hero-vial-tag">
                  <span className="pg-vial-name">{v.name}</span>
                  <span className="pg-vial-detail">{v.reconstitution === 'Pre-reconstituted' ? 'Pre-reconstituted' : v.reconstitution}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Your Peptides */}
        <section className="pg-section pg-section-alt">
          <div className="pg-container">
            <div className="v2-label"><span className="v2-dot" /> YOUR PEPTIDE{hasMultiple ? 'S' : ''}</div>
            <h2>WHAT YOU RECEIVED</h2>
            <div className="pg-divider"></div>
            <p className="pg-body-text">Here{hasMultiple ? ' are the peptides' : ' is the peptide'} in your order with dosing details from your provider.</p>

            <div className="pg-vial-cards">
              {selectedVials.map(v => (
                <div key={v.id} className="pg-vial-card">
                  <div className="pg-vial-card-header">
                    <h3>{v.name}</h3>
                    {v.subtitle && <span className="pg-vial-subtitle">{v.subtitle}</span>}
                  </div>
                  <div className="pg-vial-card-body">
                    <div className="pg-vial-row"><span>Vial Size</span><span>{v.vialSize}</span></div>
                    <div className="pg-vial-row"><span>Dose</span><span>{v.dosage}</span></div>
                    <div className="pg-vial-row"><span>Frequency</span><span>{v.frequency}</span></div>
                    <div className="pg-vial-row"><span>Injections Per Vial</span><span>{v.injectionsPerVial}</span></div>
                    <div className="pg-vial-row pg-vial-row-highlight">
                      <span>Reconstitution</span>
                      <span>{v.reconstitution === 'Pre-reconstituted' ? 'Pre-reconstituted (ready to use)' : v.reconstitution}</span>
                    </div>
                  </div>
                  <p className="pg-vial-card-desc">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supplies */}
        <section className="pg-section">
          <div className="pg-container">
            <div className="v2-label"><span className="v2-dot" /> BEFORE YOU START</div>
            <h2>SUPPLIES YOU&apos;LL NEED</h2>
            <div className="pg-divider"></div>
            <p className="pg-body-text">Gather everything before you begin. All supplies were included with your order or are available at the clinic.</p>

            <div className="pg-info-grid">
              <div className="pg-info-card">
                <h3>Alcohol Swabs</h3>
                <p>For sterilizing the vial top and your injection site before each use.</p>
              </div>
              {needsReconstitution.length > 0 && (
                <div className="pg-info-card">
                  <h3>Bacteriostatic Water</h3>
                  <p>Sterile water with 0.9% benzyl alcohol for reconstituting your lyophilized (freeze-dried) peptide.</p>
                </div>
              )}
              <div className="pg-info-card">
                <h3>Insulin Syringes</h3>
                <p>1mL insulin syringes with 29–31 gauge needles. Small gauge = less discomfort.</p>
              </div>
              {needsReconstitution.length > 0 && (
                <div className="pg-info-card">
                  <h3>Mixing Syringe</h3>
                  <p>A separate 3mL syringe with an 18–21 gauge needle for drawing bacteriostatic water during reconstitution.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Reconstitution */}
        {needsReconstitution.length > 0 && (
          <section className="pg-section pg-section-inverted">
            <div className="pg-container">
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> RECONSTITUTION</div>
              <h2>MIXING YOUR PEPTIDE{needsReconstitution.length > 1 ? 'S' : ''}</h2>
              <div className="pg-divider"></div>
              <p className="pg-body-text">Reconstitution means adding bacteriostatic water to the freeze-dried peptide powder in the vial. You only do this once per vial.</p>

              {needsReconstitution.length > 1 && (
                <div className="pg-recon-volumes">
                  <h4>YOUR RECONSTITUTION VOLUMES</h4>
                  {needsReconstitution.map(v => (
                    <div key={v.id} className="pg-recon-row">
                      <span>{v.name}</span>
                      <span>{v.reconstitution}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pg-steps-list">
                <div className="pg-step-item">
                  <div className="pg-step-number">1</div>
                  <div className="pg-step-content">
                    <h4>Clean the Vial Tops</h4>
                    <p>Wipe the top of both the peptide vial and the bacteriostatic water vial with an alcohol swab. Let dry for a few seconds.</p>
                  </div>
                </div>
                <div className="pg-step-item">
                  <div className="pg-step-number">2</div>
                  <div className="pg-step-content">
                    <h4>Draw the Bacteriostatic Water</h4>
                    <p>
                      Using your mixing syringe (3mL), draw{' '}
                      {needsReconstitution.length === 1
                        ? <strong>{needsReconstitution[0].reconstitution.replace(' BAC water', '')}</strong>
                        : <>the correct amount (see volumes above)</>
                      }
                      {' '}of bacteriostatic water from the BAC water vial.
                    </p>
                  </div>
                </div>
                <div className="pg-step-item">
                  <div className="pg-step-number">3</div>
                  <div className="pg-step-content">
                    <h4>Add Water to the Peptide Vial</h4>
                    <p>Insert the needle into the peptide vial at an angle and slowly dispense the water down the inside wall of the vial. <strong>Do not spray directly onto the powder</strong> — the peptide is delicate.</p>
                  </div>
                </div>
                <div className="pg-step-item">
                  <div className="pg-step-number">4</div>
                  <div className="pg-step-content">
                    <h4>Let It Dissolve</h4>
                    <p>Gently swirl the vial until the powder is fully dissolved. <strong>Never shake the vial</strong> — shaking can damage the peptide. It may take 1–2 minutes to fully dissolve. A completely clear solution means it&apos;s ready.</p>
                  </div>
                </div>
                <div className="pg-step-item">
                  <div className="pg-step-number">5</div>
                  <div className="pg-step-content">
                    <h4>Store in the Refrigerator</h4>
                    <p>Once reconstituted, store the vial upright in the refrigerator (36–46°F). The peptide is now active and must stay refrigerated. Most reconstituted peptides are good for 4–6 weeks.</p>
                  </div>
                </div>
              </div>

              {needsReconstitution.length > 1 && (
                <div className="pg-recon-note">
                  <strong>Multiple vials?</strong> Repeat the reconstitution process for each vial with the correct amount of bacteriostatic water.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Injection Instructions */}
        <section className={`pg-section ${needsReconstitution.length === 0 ? 'pg-section-inverted' : ''}`}>
          <div className="pg-container">
            <div className="v2-label" style={needsReconstitution.length === 0 ? { color: 'rgba(255,255,255,0.4)' } : undefined}><span className="v2-dot" /> INJECTION</div>
            <h2>HOW TO INJECT</h2>
            <div className="pg-divider"></div>
            <p className="pg-body-text">Subcutaneous injection — just under the skin. This is the same type of injection used for insulin.</p>

            <div className="pg-steps-list">
              <div className="pg-step-item">
                <div className="pg-step-number" style={needsReconstitution.length === 0 ? { background: '#ffffff', color: '#1a1a1a' } : undefined}>1</div>
                <div className="pg-step-content">
                  <h4>Wash Your Hands</h4>
                  <p>Thoroughly wash your hands with soap and water before handling any supplies.</p>
                </div>
              </div>
              <div className="pg-step-item">
                <div className="pg-step-number" style={needsReconstitution.length === 0 ? { background: '#ffffff', color: '#1a1a1a' } : undefined}>2</div>
                <div className="pg-step-content">
                  <h4>Clean the Vial Top</h4>
                  <p>Wipe the top of the peptide vial with a fresh alcohol swab.</p>
                </div>
              </div>
              <div className="pg-step-item">
                <div className="pg-step-number" style={needsReconstitution.length === 0 ? { background: '#ffffff', color: '#1a1a1a' } : undefined}>3</div>
                <div className="pg-step-content">
                  <h4>Draw Your Dose</h4>
                  <p>Using an insulin syringe, insert the needle into the vial and slowly draw your prescribed dose. Pull back slightly past your dose line, then push forward to remove any air bubbles.</p>
                  {selectedVials.length === 1 && (
                    <div className="pg-dose-callout">
                      <strong>Your dose:</strong> {selectedVials[0].dosage}
                    </div>
                  )}
                  {selectedVials.length > 1 && (
                    <div className="pg-dose-callout">
                      {selectedVials.map(v => (
                        <div key={v.id}><strong>{v.name}:</strong> {v.dosage}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="pg-step-item">
                <div className="pg-step-number" style={needsReconstitution.length === 0 ? { background: '#ffffff', color: '#1a1a1a' } : undefined}>4</div>
                <div className="pg-step-content">
                  <h4>Choose Your Injection Site</h4>
                  <p>Best sites for subcutaneous injection: the belly (2 inches away from the navel), the front of the thigh, or the back of the upper arm. Rotate sites to prevent irritation.</p>
                </div>
              </div>
              <div className="pg-step-item">
                <div className="pg-step-number" style={needsReconstitution.length === 0 ? { background: '#ffffff', color: '#1a1a1a' } : undefined}>5</div>
                <div className="pg-step-content">
                  <h4>Clean the Injection Site</h4>
                  <p>Wipe the area with an alcohol swab and let it air dry completely.</p>
                </div>
              </div>
              <div className="pg-step-item">
                <div className="pg-step-number" style={needsReconstitution.length === 0 ? { background: '#ffffff', color: '#1a1a1a' } : undefined}>6</div>
                <div className="pg-step-content">
                  <h4>Inject</h4>
                  <p>Pinch the skin at your injection site. Insert the needle at a 45-degree angle (or 90 degrees if using a short insulin needle). Push the plunger slowly and steadily. Release the pinch, then withdraw the needle.</p>
                </div>
              </div>
              <div className="pg-step-item">
                <div className="pg-step-number" style={needsReconstitution.length === 0 ? { background: '#ffffff', color: '#1a1a1a' } : undefined}>7</div>
                <div className="pg-step-content">
                  <h4>Dispose Safely</h4>
                  <p>Place the used syringe immediately into a sharps container. Never recap, bend, or reuse needles.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Storage */}
        <section className="pg-section pg-section-alt">
          <div className="pg-container">
            <div className="v2-label"><span className="v2-dot" /> STORAGE</div>
            <h2>STORAGE &amp; HANDLING</h2>
            <div className="pg-divider"></div>

            <div className="pg-info-grid">
              <div className="pg-info-card">
                <h3>Before Reconstitution</h3>
                <p>Unreconstituted (powder) vials can be stored at room temperature or in the refrigerator. Avoid direct sunlight and heat.</p>
              </div>
              <div className="pg-info-card">
                <h3>After Reconstitution</h3>
                <p>Once mixed with bacteriostatic water, always store in the refrigerator (36–46°F). Most peptides are good for 4–6 weeks once reconstituted.</p>
              </div>
              <div className="pg-info-card">
                <h3>Never Freeze</h3>
                <p>Do not freeze reconstituted peptides. Freezing can damage the peptide structure and make it ineffective.</p>
              </div>
              <div className="pg-info-card">
                <h3>Keep It Clean</h3>
                <p>Always swab the vial top with alcohol before each use. Use a new syringe for every injection. Never touch the needle.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dosing Schedule */}
        <section className="pg-section">
          <div className="pg-container">
            <div className="v2-label"><span className="v2-dot" /> SCHEDULE</div>
            <h2>YOUR DOSING SCHEDULE</h2>
            <div className="pg-divider"></div>
            <p className="pg-body-text">Follow your prescribed frequency. Consistency is key for results.</p>

            <div className="pg-schedule-cards">
              {selectedVials.map(v => (
                <div key={v.id} className="pg-schedule-card">
                  <div className="pg-schedule-name">{v.name}</div>
                  <div className="pg-schedule-details">
                    <div><span>Dose:</span> {v.dosage}</div>
                    <div><span>Frequency:</span> {v.frequency}</div>
                    <div><span>Injections in Vial:</span> {v.injectionsPerVial}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pg-tip-box">
              <strong>Tip:</strong> Inject at the same time each day for best results. Many patients prefer mornings or before bed — follow your provider&apos;s recommendation.
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="pg-section pg-section-alt">
          <div className="pg-container">
            <div className="v2-label"><span className="v2-dot" /> SAFETY</div>
            <h2>IMPORTANT INFORMATION</h2>
            <div className="pg-divider"></div>

            <div className="pg-safety-grid">
              <div className="pg-safety-card pg-warning">
                <h4>Contact Us If You Experience:</h4>
                <ul>
                  <li>Significant redness, swelling, or warmth at the injection site</li>
                  <li>Signs of infection (pus, red streaks, fever)</li>
                  <li>Allergic reaction (hives, difficulty breathing, swelling of face/throat)</li>
                  <li>Persistent nausea or dizziness after injection</li>
                </ul>
              </div>
              <div className="pg-safety-card pg-normal">
                <h4>Normal &amp; Expected:</h4>
                <ul>
                  <li>Mild redness or slight bruising at the injection site</li>
                  <li>Small bump that resolves within an hour</li>
                  <li>Mild itching at the injection site</li>
                  <li>Slight pinch during injection</li>
                </ul>
                <p className="pg-safety-note">These are normal subcutaneous injection reactions and typically resolve quickly on their own.</p>
              </div>
            </div>

            <div className="pg-disclaimer">
              <p><strong>Important:</strong> Do not adjust your dose without consulting your provider. These treatments are prescribed as part of your individualized protocol.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pg-section pg-section-inverted pg-cta-section">
          <div className="pg-container">
            <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}><span className="v2-dot" /> SUPPORT</div>
            <h2>QUESTIONS? WE&apos;RE HERE.</h2>
            <p className="pg-body-text" style={{ textAlign: 'center', margin: '0 auto 2rem' }}>If anything is unclear about reconstitution, injection technique, or your dosing schedule — reach out. We&apos;re happy to walk you through it.</p>
            <div className="pg-cta-buttons">
              <a href="tel:+19499973988" className="pg-btn-primary">CALL (949) 997-3988</a>
              <a href="sms:+19499973988" className="pg-btn-outline">TEXT US</a>
            </div>
            <p className="pg-cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
          </div>
        </section>
      </div>

      <style jsx>{styles}</style>
    </Layout>
  );
}

const styles = `
  .pg-page { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased; background: #ffffff; color: #171717; overflow-x: hidden; }
  .pg-container { max-width: 800px; margin: 0 auto; padding: 0 2rem; }
  .pg-section { padding: 6rem 2rem; }
  .pg-section-alt { background: #fafafa; padding: 6rem 2rem; }
  .pg-section-inverted { background: #1a1a1a; color: #ffffff; }
  .pg-page h1 { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; color: #171717; margin-bottom: 1.5rem; }
  .pg-page h2 { font-size: 2rem; font-weight: 900; letter-spacing: -0.02em; line-height: 0.95; text-transform: uppercase; color: #171717; margin-bottom: 1rem; }
  .pg-page h3 { font-size: 1.125rem; font-weight: 700; color: #171717; }
  .pg-section-inverted h1, .pg-section-inverted h2, .pg-section-inverted h3, .pg-section-inverted h4 { color: #ffffff; }
  .pg-body-text { font-size: 1.0625rem; font-weight: 400; line-height: 1.7; color: #737373; max-width: 600px; }
  .pg-section-inverted .pg-body-text { color: rgba(255, 255, 255, 0.55); }
  .pg-divider { width: 48px; height: 1px; background: #e0e0e0; margin: 1.25rem 0; }
  .pg-section-inverted .pg-divider { background: rgba(255, 255, 255, 0.12); }
  .pg-hero { padding: 6rem 2rem 5rem; }
  .pg-hero-rule { width: 48px; height: 1px; background: #e0e0e0; margin-bottom: 1.5rem; }

  .pg-hero-vials { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 2rem; }
  .pg-hero-vial-tag { display: flex; flex-direction: column; padding: 1rem 1.5rem; background: #ffffff; border: 1px solid #e0e0e0; }
  .pg-vial-name { font-weight: 700; font-size: 0.95rem; color: #171717; }
  .pg-vial-detail { font-size: 0.8rem; color: #737373; margin-top: 0.25rem; }

  .pg-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem; }
  .pg-info-card { background: #ffffff; border: 1px solid #e0e0e0; padding: 1.75rem; }
  .pg-info-card h3 { font-size: 1rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 0.75rem; }
  .pg-info-card p { font-size: 0.9rem; color: #737373; line-height: 1.7; }

  .pg-vial-cards { display: flex; flex-direction: column; gap: 1.5rem; margin-top: 2rem; }
  .pg-vial-card { background: #ffffff; border: 1px solid #e0e0e0; overflow: hidden; }
  .pg-vial-card-header { padding: 1.5rem 1.75rem 1.25rem; border-bottom: 1px solid #e0e0e0; display: flex; align-items: baseline; gap: 0.75rem; }
  .pg-vial-card-header h3 { font-size: 1.25rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; margin: 0; }
  .pg-vial-subtitle { font-size: 0.85rem; color: #737373; }
  .pg-vial-card-body { padding: 0; }
  .pg-vial-row { display: flex; justify-content: space-between; padding: 0.75rem 1.75rem; border-bottom: 1px solid #f0f0f0; font-size: 0.9rem; }
  .pg-vial-row:last-child { border-bottom: none; }
  .pg-vial-row span:first-child { color: #737373; }
  .pg-vial-row span:last-child { font-weight: 600; color: #171717; text-align: right; }
  .pg-vial-row-highlight { background: #fafafa; }
  .pg-vial-row-highlight span:last-child { font-weight: 700; }
  .pg-vial-card-desc { padding: 1.25rem 1.75rem; margin: 0; font-size: 0.85rem; color: #737373; line-height: 1.6; border-top: 1px solid #e0e0e0; background: #fafafa; }

  .pg-steps-list { margin-top: 2rem; }
  .pg-step-item { display: flex; gap: 1rem; padding: 1.25rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .pg-section:not(.pg-section-inverted) .pg-step-item { border-bottom-color: #e0e0e0; }
  .pg-step-item:last-child { border-bottom: none; }
  .pg-step-number { width: 2rem; height: 2rem; background: #ffffff; color: #1a1a1a; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0; }
  .pg-section:not(.pg-section-inverted) .pg-step-number { background: #1a1a1a; color: #ffffff; }
  .pg-step-content h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem; }
  .pg-step-content p { font-size: 0.9rem; color: rgba(255,255,255,0.7); line-height: 1.7; }
  .pg-section:not(.pg-section-inverted) .pg-step-content p { color: #737373; }

  .pg-recon-volumes { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 1.5rem; margin-top: 2rem; margin-bottom: 0.5rem; }
  .pg-recon-volumes h4 { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; color: rgba(255,255,255,0.5); margin-bottom: 1rem; }
  .pg-recon-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 0.95rem; }
  .pg-recon-row:last-child { border-bottom: none; }
  .pg-recon-row span:first-child { color: rgba(255,255,255,0.7); }
  .pg-recon-row span:last-child { font-weight: 700; color: #ffffff; }

  .pg-recon-note { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 1.25rem; margin-top: 1.5rem; font-size: 0.875rem; color: rgba(255,255,255,0.6); line-height: 1.6; }
  .pg-recon-note strong { color: #ffffff; }

  .pg-dose-callout { background: #fafafa; border: 1px solid #e0e0e0; padding: 0.75rem 1rem; margin-top: 0.75rem; font-size: 0.85rem; color: #171717; line-height: 1.6; }
  .pg-section-inverted .pg-dose-callout { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); color: #ffffff; }

  .pg-schedule-cards { display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem; }
  .pg-schedule-card { background: #ffffff; border: 1px solid #e0e0e0; padding: 1.5rem 1.75rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; }
  .pg-schedule-name { font-weight: 900; font-size: 1.125rem; text-transform: uppercase; letter-spacing: -0.01em; flex-shrink: 0; }
  .pg-schedule-details { font-size: 0.875rem; color: #737373; line-height: 1.8; text-align: right; }
  .pg-schedule-details span { font-weight: 600; color: #171717; }

  .pg-tip-box { background: #ffffff; border-left: 3px solid #1a1a1a; padding: 1.25rem 1.5rem; margin-top: 2rem; font-size: 0.9rem; color: #737373; line-height: 1.7; }
  .pg-tip-box strong { color: #171717; }

  .pg-safety-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem; }
  .pg-safety-card { background: #ffffff; border: 1px solid #e0e0e0; padding: 1.5rem; }
  .pg-safety-card h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: #171717; }
  .pg-safety-card ul { list-style: none; padding: 0; margin: 0; }
  .pg-safety-card li { font-size: 0.875rem; color: #737373; padding: 0.375rem 0; padding-left: 1.25rem; position: relative; line-height: 1.5; }
  .pg-safety-card.pg-warning li::before { content: "✕"; position: absolute; left: 0; color: #171717; font-weight: 600; }
  .pg-safety-card.pg-normal li::before { content: "•"; position: absolute; left: 0; color: #808080; font-weight: 700; }
  .pg-safety-note { font-size: 0.8125rem; color: #737373; margin-top: 0.75rem; padding-left: 0; }
  .pg-disclaimer { background: #ffffff; border: 1px solid #e0e0e0; padding: 1.25rem; margin-top: 1.5rem; }
  .pg-disclaimer p { font-size: 0.8125rem; color: #737373; line-height: 1.6; margin: 0; }

  .pg-cta-section { text-align: center; }
  .pg-cta-buttons { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .pg-btn-primary { display: inline-block; background: #ffffff; color: #1a1a1a; padding: 0.875rem 2rem; text-decoration: none; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; transition: background 0.2s, transform 0.2s; }
  .pg-btn-primary:hover { background: #e0e0e0; transform: translateY(-1px); }
  .pg-btn-outline { display: inline-block; background: transparent; color: #ffffff; padding: 0.875rem 2rem; border: 1px solid rgba(255,255,255,0.3); text-decoration: none; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; transition: all 0.2s; }
  .pg-btn-outline:hover { background: #ffffff; color: #1a1a1a; }
  .pg-btn-dark { display: inline-block; background: #1a1a1a; color: #ffffff; padding: 0.875rem 2rem; text-decoration: none; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; transition: background 0.2s; }
  .pg-btn-dark:hover { background: #333333; }
  .pg-cta-location { font-size: 0.9rem; color: rgba(255,255,255,0.5); }

  @media (max-width: 768px) {
    .pg-page h1 { font-size: 2rem; }
    .pg-page h2 { font-size: 1.5rem; }
    .pg-hero { padding: 3.5rem 2rem; }
    .pg-hero-vials { flex-direction: column; }
    .pg-section { padding: 3.5rem 1.5rem; }
    .pg-section-alt { padding: 3.5rem 1.5rem; }
    .pg-info-grid, .pg-safety-grid { grid-template-columns: 1fr; }
    .pg-schedule-card { flex-direction: column; gap: 0.75rem; }
    .pg-schedule-details { text-align: left; }
    .pg-cta-buttons { flex-direction: column; align-items: center; }
    .pg-vial-row { flex-direction: column; gap: 0.25rem; }
    .pg-vial-row span:last-child { text-align: left; }
    .pg-recon-row { flex-direction: column; gap: 0.25rem; }
  }
`;
