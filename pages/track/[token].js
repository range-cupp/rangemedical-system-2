// /pages/track/[token].js
// Patient-facing injection tracker

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PatientTracker() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState(null); // null, 'instructions', or 'about'
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/patient/tracker?token=${token}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Protocol not found. Please check your link.');
      }
    } catch (err) {
      setError('Unable to load your protocol. Please try again.');
    }
    setLoading(false);
  };

  // Determine if a day is an "off" day based on frequency
  const isOffDay = (dayNumber, frequency) => {
    if (!frequency) return false;
    
    // 5 days on / 2 days off - days 6, 7, 13, 14, 20, 21, etc. are off
    if (frequency.includes('5 days on')) {
      const dayInCycle = ((dayNumber - 1) % 7) + 1;
      return dayInCycle === 6 || dayInCycle === 7;
    }
    
    // 1x weekly - only day 1, 8, 15, 22, etc. are injection days
    if (frequency === '1x weekly') {
      return ((dayNumber - 1) % 7) !== 0;
    }
    
    // 2x weekly - days 1, 4, 8, 11, 15, 18, etc. (every 3-4 days)
    if (frequency === '2x weekly') {
      const dayInCycle = ((dayNumber - 1) % 7) + 1;
      return dayInCycle !== 1 && dayInCycle !== 4;
    }
    
    // 3x weekly - days 1, 3, 5, 8, 10, 12, etc. (Mon/Wed/Fri pattern)
    if (frequency === '3x weekly') {
      const dayInCycle = ((dayNumber - 1) % 7) + 1;
      return dayInCycle !== 1 && dayInCycle !== 3 && dayInCycle !== 5;
    }
    
    // Every other day
    if (frequency === 'Every other day') {
      return dayNumber % 2 === 0;
    }
    
    return false;
  };

  // Get simple explanation for a peptide
  const getPeptideExplanation = (peptideName) => {
    if (!peptideName) return null;
    const name = peptideName.toLowerCase();

    // BPC-157
    if (name.includes('bpc')) {
      return {
        name: 'BPC-157',
        what: 'BPC-157 is a healing peptide. It is made from a protein found in your stomach. Your body uses it to help fix damaged tissue.',
        how: 'This peptide helps your body heal faster. It works by sending signals to cells that repair muscles, tendons, and other tissues. It also helps reduce swelling.',
        benefits: [
          'Helps heal muscles and tendons',
          'Supports gut health',
          'May reduce discomfort from injuries',
          'Helps your body recover faster'
        ],
        note: 'Results vary from person to person. Most people start to notice changes within 2-4 weeks of consistent use.'
      };
    }

    // TB-500
    if (name.includes('tb-500') || name.includes('tb500') || name.includes('thymosin beta')) {
      return {
        name: 'TB-500',
        what: 'TB-500 is a healing peptide. It copies a protein your body already makes called Thymosin Beta-4. This protein helps your cells grow and heal.',
        how: 'TB-500 helps new blood vessels form. It also helps cells move to where they are needed. This speeds up how fast your body can fix itself.',
        benefits: [
          'Supports tissue repair',
          'Helps with flexibility',
          'May reduce recovery time',
          'Supports healthy inflammation response'
        ],
        note: 'Results vary from person to person. Many people combine TB-500 with BPC-157 for better results.'
      };
    }

    // Wolverine Blend (BPC + TB)
    if (name.includes('wolverine')) {
      return {
        name: 'Wolverine Blend',
        what: 'The Wolverine Blend combines two healing peptides: BPC-157 and TB-500. Together, they work as a team to help your body heal.',
        how: 'BPC-157 helps repair tissue from the inside. TB-500 helps new cells grow and move where they are needed. Using both gives your body more tools to heal.',
        benefits: [
          'Faster recovery from workouts',
          'Helps heal muscles and tendons',
          'Supports joint health',
          'May reduce discomfort from injuries'
        ],
        note: 'Results vary from person to person. This blend is popular with active people who want to recover faster.'
      };
    }

    // GHK-Cu
    if (name.includes('ghk')) {
      return {
        name: 'GHK-Cu',
        what: 'GHK-Cu is a peptide with copper attached to it. Your body makes this naturally, but you make less as you get older.',
        how: 'GHK-Cu tells your skin to make more collagen. Collagen is what keeps your skin firm and smooth. It also helps your skin heal and stay healthy.',
        benefits: [
          'Supports healthy, firm skin',
          'May improve skin texture',
          'Helps with skin healing',
          'Supports hair health'
        ],
        note: 'Results vary from person to person. Many people see changes in their skin within 4-8 weeks.'
      };
    }

    // GLOW blend
    if (name.includes('glow')) {
      return {
        name: 'GLOW Blend',
        what: 'The GLOW Blend combines GHK-Cu with healing peptides BPC-157 and TB-500. It is made to support your skin from the inside.',
        how: 'GHK-Cu helps your skin make collagen. BPC-157 and TB-500 help your skin heal and stay healthy. Together, they support a healthy glow.',
        benefits: [
          'Supports skin health',
          'Helps with skin firmness',
          'May improve skin texture',
          'Supports overall healing'
        ],
        note: 'Results vary from person to person. Drink plenty of water and protect your skin from the sun for best results.'
      };
    }

    // AOD-9604
    if (name.includes('aod')) {
      return {
        name: 'AOD-9604',
        what: 'AOD-9604 is a peptide that comes from growth hormone. It is the part that helps your body use fat for energy.',
        how: 'This peptide sends signals to fat cells. It tells them to release stored fat so your body can burn it. It does not affect blood sugar or muscle.',
        benefits: [
          'Supports fat metabolism',
          'Does not affect muscle',
          'Does not raise blood sugar',
          'May support weight management goals'
        ],
        note: 'Results vary from person to person. Works best with healthy eating and regular movement.'
      };
    }

    // MOTS-C
    if (name.includes('mots')) {
      return {
        name: 'MOTS-C',
        what: 'MOTS-C is a peptide made by your mitochondria. Mitochondria are the parts of your cells that make energy.',
        how: 'MOTS-C helps your cells use sugar for energy better. It also helps your muscles work better during exercise.',
        benefits: [
          'Supports energy levels',
          'Helps with exercise performance',
          'Supports healthy metabolism',
          'May help with blood sugar balance'
        ],
        note: 'Results vary from person to person. Many people feel more energy within 2-3 weeks.'
      };
    }

    // GLP-1 variants
    if (name.includes('glp-1') || name.includes('semaglutide') || name.includes('tirzepatide')) {
      return {
        name: 'GLP-1 Peptide',
        what: 'GLP-1 peptides copy a hormone your gut makes after you eat. This hormone helps control hunger and blood sugar.',
        how: 'GLP-1 slows down how fast food leaves your stomach. This helps you feel full longer. It also helps your body manage blood sugar better.',
        benefits: [
          'Helps reduce appetite',
          'Supports feeling full longer',
          'Helps with blood sugar balance',
          'Supports weight management goals'
        ],
        note: 'Results vary from person to person. Eat slowly and stop when you feel full. Drink plenty of water.'
      };
    }

    // Epithalon
    if (name.includes('epithalon') || name.includes('epitalon')) {
      return {
        name: 'Epithalon',
        what: 'Epithalon is a peptide that supports your telomeres. Telomeres are caps on the ends of your DNA that protect it.',
        how: 'As you age, telomeres get shorter. Epithalon may help support telomere health. This is linked to healthy aging.',
        benefits: [
          'Supports healthy aging',
          'May support sleep quality',
          'Supports cellular health',
          'May support energy levels'
        ],
        note: 'Results vary from person to person. This peptide is often used as part of a longevity plan.'
      };
    }

    // Thymosin Alpha-1
    if (name.includes('thymosin alpha') || name.includes('ta-1') || name.includes('ta1')) {
      return {
        name: 'Thymosin Alpha-1',
        what: 'Thymosin Alpha-1 is a peptide that supports your immune system. Your thymus gland makes it naturally.',
        how: 'This peptide helps your immune cells work better. It helps your body find and fight things that should not be there.',
        benefits: [
          'Supports immune function',
          'Helps your body stay healthy',
          'Supports recovery',
          'May help during times of stress'
        ],
        note: 'Results vary from person to person. Often used to support overall wellness.'
      };
    }

    // PT-141
    if (name.includes('pt-141')) {
      return {
        name: 'PT-141',
        what: 'PT-141 is a peptide that works in your brain. It affects the pathways that control arousal and desire.',
        how: 'PT-141 activates receptors in your brain. This can help increase feelings of desire. It works differently than other treatments.',
        benefits: [
          'May support healthy desire',
          'Works through the brain',
          'Can be used as needed',
          'Works for both men and women'
        ],
        note: 'Results vary from person to person. Take as directed by your provider.'
      };
    }

    // Sermorelin / GHRH peptides
    if (name.includes('sermorelin') || name.includes('tesamorelin') || name.includes('cjc') || name.includes('ipamorelin') || name.includes('ghrp')) {
      return {
        name: 'Growth Hormone Support',
        what: 'This peptide helps your body make more of its own growth hormone. Growth hormone helps with energy, sleep, and recovery.',
        how: 'It sends a signal to your pituitary gland. This gland then releases more growth hormone naturally. Your body controls how much it makes.',
        benefits: [
          'Supports natural growth hormone levels',
          'May improve sleep quality',
          'Supports recovery from exercise',
          'May support energy and focus'
        ],
        note: 'Results vary from person to person. Best taken at night before bed. Avoid eating 2 hours before your dose.'
      };
    }

    // Selank
    if (name.includes('selank')) {
      return {
        name: 'Selank',
        what: 'Selank is a peptide that supports your brain. It was made to help with focus and calm.',
        how: 'Selank works on pathways in your brain that affect mood and focus. It may help you feel more calm and clear.',
        benefits: [
          'Supports focus and clarity',
          'May help with feeling calm',
          'Supports memory',
          'Does not cause drowsiness'
        ],
        note: 'Results vary from person to person. Often used as a nasal spray.'
      };
    }

    // Semax
    if (name.includes('semax')) {
      return {
        name: 'Semax',
        what: 'Semax is a peptide that supports brain function. It was made to help with focus and mental energy.',
        how: 'Semax supports the growth of brain cells. It also helps protect your brain and supports clear thinking.',
        benefits: [
          'Supports mental clarity',
          'May help with focus',
          'Supports brain health',
          'May support memory'
        ],
        note: 'Results vary from person to person. Often used as a nasal spray.'
      };
    }

    // NAD+
    if (name.includes('nad')) {
      return {
        name: 'NAD+',
        what: 'NAD+ is a molecule your cells need to make energy. Your body makes less of it as you age.',
        how: 'NAD+ helps your mitochondria work better. Mitochondria are like batteries in your cells. More NAD+ means more energy.',
        benefits: [
          'Supports cellular energy',
          'May help with mental clarity',
          'Supports healthy aging',
          'May improve recovery'
        ],
        note: 'Results vary from person to person. Many people feel more energy and clarity within days.'
      };
    }

    // Default for unknown peptides
    return {
      name: peptideName,
      what: 'This is a peptide therapy chosen for your specific health goals. Peptides are small proteins that send signals to your cells.',
      how: 'Your provider selected this peptide based on your needs. It works by giving your body specific instructions to support your health goals.',
      benefits: [
        'Supports your specific health goals',
        'Works naturally with your body',
        'Chosen based on your needs'
      ],
      note: 'Results vary from person to person. Follow your dosing schedule for best results. Contact us with any questions.'
    };
  };

  const toggleDay = async (day, isCompleted, isOff) => {
    // Don't allow toggling off days
    if (isOff) return;
    
    setSaving(day);
    
    try {
      const res = await fetch(`/api/patient/tracker?token=${token}`, {
        method: isCompleted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day })
      });

      if (res.ok) {
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error toggling day:', err);
    }
    
    setSaving(null);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Head>
          <title>Loading... | Range Medical</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div style={styles.loading}>Loading your protocol...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Head>
          <title>Error | Range Medical</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div style={styles.errorContainer}>
          <div style={styles.logo}>RANGE MEDICAL</div>
          <div style={styles.errorMessage}>{error}</div>
          <p style={styles.errorHelp}>
            If you need help, text us at (949) 997-3988
          </p>
        </div>
      </div>
    );
  }

  const { protocol, days, dosingInstructions, completionRate } = data;
  
  // Calculate actual injection days (excluding off days)
  const frequency = protocol.doseFrequency;
  const injectionDays = days.filter(d => !isOffDay(d.day, frequency));
  const completedInjections = days.filter(d => d.completed && !isOffDay(d.day, frequency)).length;
  const totalInjections = injectionDays.length;
  const adjustedCompletionRate = totalInjections > 0 ? Math.round((completedInjections / totalInjections) * 100) : 0;

  return (
    <div style={styles.container}>
      <Head>
        <title>Injection Tracker | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#000000" />
      </Head>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>RANGE MEDICAL</div>
          <div style={styles.greeting}>Hi {protocol.patientName?.split(' ')[0]}!</div>
        </div>
      </div>

      <div style={styles.content}>
        {/* Protocol Summary Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.protocolName}>{protocol.programName}</div>
            <div style={styles.peptides}>
              {protocol.primaryPeptide}
              {protocol.secondaryPeptide && ` + ${protocol.secondaryPeptide}`}
            </div>
            {frequency && (
              <div style={styles.frequency}>{frequency}</div>
            )}
          </div>
          
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <div style={styles.statValue}>{protocol.currentDay > protocol.totalDays ? protocol.totalDays : protocol.currentDay}</div>
              <div style={styles.statLabel}>Day</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>{completedInjections}/{totalInjections}</div>
              <div style={styles.statLabel}>Injections</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>{adjustedCompletionRate}%</div>
              <div style={styles.statLabel}>Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={styles.progressContainer}>
            <div style={{...styles.progressBar, width: `${adjustedCompletionRate}%`}} />
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabContainer}>
          <button 
            style={{
              ...styles.tabButton,
              ...(activeTab === 'instructions' ? styles.tabButtonActive : {})
            }}
            onClick={() => setActiveTab(activeTab === 'instructions' ? null : 'instructions')}
          >
            Dosing Instructions
          </button>
          <button 
            style={{
              ...styles.tabButton,
              ...(activeTab === 'about' ? styles.tabButtonActive : {})
            }}
            onClick={() => setActiveTab(activeTab === 'about' ? null : 'about')}
          >
            About Your Peptide
          </button>
        </div>

        {/* Instructions Panel */}
        {activeTab === 'instructions' && (
          <div style={styles.infoPanel}>
            <pre style={styles.instructionsText}>{dosingInstructions}</pre>
          </div>
        )}

        {/* About Peptide Panel */}
        {activeTab === 'about' && (
          <div style={styles.infoPanel}>
            {(() => {
              const primaryInfo = getPeptideExplanation(protocol.primaryPeptide);
              const secondaryInfo = protocol.secondaryPeptide ? getPeptideExplanation(protocol.secondaryPeptide) : null;
              
              return (
                <>
                  {primaryInfo && (
                    <div style={styles.peptideSection}>
                      <h3 style={styles.peptideTitle}>{primaryInfo.name}</h3>
                      
                      <div style={styles.peptideBlock}>
                        <div style={styles.peptideLabel}>What is it?</div>
                        <p style={styles.peptideText}>{primaryInfo.what}</p>
                      </div>
                      
                      <div style={styles.peptideBlock}>
                        <div style={styles.peptideLabel}>How does it work?</div>
                        <p style={styles.peptideText}>{primaryInfo.how}</p>
                      </div>
                      
                      <div style={styles.peptideBlock}>
                        <div style={styles.peptideLabel}>Potential Benefits</div>
                        <ul style={styles.benefitsList}>
                          {primaryInfo.benefits.map((benefit, i) => (
                            <li key={i} style={styles.benefitItem}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div style={styles.peptideNote}>
                        {primaryInfo.note}
                      </div>
                    </div>
                  )}
                  
                  {secondaryInfo && secondaryInfo.name !== primaryInfo?.name && (
                    <div style={{...styles.peptideSection, marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e0e0e0'}}>
                      <h3 style={styles.peptideTitle}>{secondaryInfo.name}</h3>
                      
                      <div style={styles.peptideBlock}>
                        <div style={styles.peptideLabel}>What is it?</div>
                        <p style={styles.peptideText}>{secondaryInfo.what}</p>
                      </div>
                      
                      <div style={styles.peptideBlock}>
                        <div style={styles.peptideLabel}>How does it work?</div>
                        <p style={styles.peptideText}>{secondaryInfo.how}</p>
                      </div>
                      
                      <div style={styles.peptideBlock}>
                        <div style={styles.peptideLabel}>Potential Benefits</div>
                        <ul style={styles.benefitsList}>
                          {secondaryInfo.benefits.map((benefit, i) => (
                            <li key={i} style={styles.benefitItem}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div style={styles.peptideNote}>
                        {secondaryInfo.note}
                      </div>
                    </div>
                  )}
                  
                  <div style={styles.disclaimer}>
                    This information is for educational purposes only. It is not medical advice. Always follow your provider's instructions. Contact Range Medical with any questions about your treatment.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Injection Grid */}
        <div style={styles.sectionTitle}>
          Tap each day when you complete your injection
        </div>
        
        {frequency && (frequency.includes('days off') || frequency.includes('weekly') || frequency === 'Every other day') && (
          <div style={styles.offDayLegend}>
            <span style={styles.legendItem}><span style={styles.legendDotGrey}></span> Rest day (no injection)</span>
            <span style={styles.legendItem}><span style={styles.legendDotGreen}></span> Completed</span>
          </div>
        )}

        <div style={styles.daysGrid}>
          {days.map((day) => {
            const isOff = isOffDay(day.day, frequency);
            return (
              <button
                key={day.day}
                style={{
                  ...styles.dayButton,
                  ...(isOff ? styles.dayOff : {}),
                  ...(day.completed && !isOff ? styles.dayCompleted : {}),
                  ...(day.isCurrent && !day.completed && !isOff ? styles.dayCurrent : {}),
                  ...(day.isFuture && !isOff ? styles.dayFuture : {}),
                  opacity: saving === day.day ? 0.5 : 1,
                  cursor: isOff ? 'default' : 'pointer'
                }}
                onClick={() => toggleDay(day.day, day.completed, isOff)}
                disabled={saving !== null || isOff}
              >
                <div style={{...styles.dayNumber, ...(isOff ? styles.dayNumberOff : {})}}>Day {day.day}</div>
                <div style={{...styles.dayDate, ...(isOff ? styles.dayDateOff : {})}}>
                  {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                {day.completed && !isOff && <div style={styles.checkmark}>✓</div>}
                {isOff && <div style={styles.offLabel}>OFF</div>}
                {day.isCurrent && !day.completed && !isOff && <div style={styles.todayBadge}>TODAY</div>}
              </button>
            );
          })}
        </div>

        {/* Status Message */}
        {protocol.status === 'completed' && (
          <div style={styles.completedMessage}>
            Protocol Complete! Great job staying consistent.
          </div>
        )}

        {protocol.status === 'active' && adjustedCompletionRate === 100 && (
          <div style={styles.completedMessage}>
            All injections logged! You're doing amazing.
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <p>Questions? Text us anytime</p>
          <a href="sms:+19499973988" style={styles.phoneLink}>(949) 997-3988</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#666666'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    padding: '20px',
    textAlign: 'center'
  },
  errorMessage: {
    fontSize: '18px',
    color: '#000000',
    marginTop: '20px'
  },
  errorHelp: {
    fontSize: '14px',
    color: '#666666',
    marginTop: '10px'
  },
  header: {
    backgroundColor: '#000000',
    color: 'white',
    padding: '20px',
    paddingTop: '40px'
  },
  headerInner: {
    maxWidth: '900px',
    margin: '0 auto'
  },
  logo: {
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '2px',
    opacity: 0.9
  },
  greeting: {
    fontSize: '24px',
    fontWeight: '600',
    marginTop: '10px'
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    paddingBottom: '100px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e0e0e0',
    marginBottom: '20px'
  },
  cardHeader: {
    marginBottom: '24px'
  },
  protocolName: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#000000'
  },
  peptides: {
    fontSize: '16px',
    color: '#666666',
    marginTop: '6px'
  },
  frequency: {
    fontSize: '14px',
    color: '#888888',
    marginTop: '4px'
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '24px'
  },
  stat: {
    textAlign: 'center'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#000000'
  },
  statLabel: {
    fontSize: '13px',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: '4px'
  },
  progressContainer: {
    height: '12px',
    backgroundColor: '#e5e5e5',
    borderRadius: '6px',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: '6px',
    transition: 'width 0.3s ease'
  },
  instructionsButton: {
    display: 'block',
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#000000',
    backgroundColor: '#ffffff',
    border: '2px solid #000000',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    marginBottom: '20px'
  },
  tabContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  tabButton: {
    flex: 1,
    padding: '14px 16px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#000000',
    backgroundColor: '#ffffff',
    border: '2px solid #000000',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease'
  },
  tabButtonActive: {
    backgroundColor: '#000000',
    color: '#ffffff'
  },
  infoPanel: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid #e0e0e0',
    marginBottom: '20px'
  },
  instructionsPanel: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid #e0e0e0',
    marginBottom: '20px'
  },
  instructionsText: {
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#333333',
    whiteSpace: 'pre-wrap',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0
  },
  sectionTitle: {
    fontSize: '15px',
    color: '#666666',
    textAlign: 'center',
    marginBottom: '12px'
  },
  offDayLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#666666'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendDotGrey: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    backgroundColor: '#e0e0e0'
  },
  legendDotGreen: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    backgroundColor: '#10b981'
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '10px'
  },
  dayButton: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
    padding: '8px'
  },
  dayCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    color: 'white'
  },
  dayCurrent: {
    borderColor: '#000000',
    borderWidth: '3px',
    boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)'
  },
  dayFuture: {
    opacity: 0.6
  },
  dayOff: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
    cursor: 'default'
  },
  dayNumber: {
    fontSize: '13px',
    fontWeight: '700'
  },
  dayNumberOff: {
    color: '#aaaaaa'
  },
  dayDate: {
    fontSize: '10px',
    marginTop: '2px',
    opacity: 0.8
  },
  dayDateOff: {
    color: '#aaaaaa'
  },
  checkmark: {
    position: 'absolute',
    top: '4px',
    right: '6px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  offLabel: {
    position: 'absolute',
    bottom: '4px',
    fontSize: '8px',
    fontWeight: '700',
    color: '#aaaaaa',
    letterSpacing: '0.5px'
  },
  todayBadge: {
    position: 'absolute',
    bottom: '4px',
    fontSize: '8px',
    fontWeight: '700',
    color: '#000000',
    letterSpacing: '0.5px'
  },
  completedMessage: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#10b981',
    fontWeight: '600',
    margin: '24px 0',
    padding: '16px',
    backgroundColor: '#ecfdf5',
    borderRadius: '8px'
  },
  peptideSection: {
  },
  peptideTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#000000',
    marginBottom: '16px',
    marginTop: '0'
  },
  peptideBlock: {
    marginBottom: '16px'
  },
  peptideLabel: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#000000',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  peptideText: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#333333',
    margin: '0'
  },
  benefitsList: {
    margin: '0',
    paddingLeft: '20px'
  },
  benefitItem: {
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#333333'
  },
  peptideNote: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#666666',
    fontStyle: 'italic',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e0e0e0'
  },
  disclaimer: {
    fontSize: '12px',
    lineHeight: '1.6',
    color: '#888888',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #e0e0e0',
    textAlign: 'center'
  },
  footer: {
    textAlign: 'center',
    padding: '30px 0',
    color: '#666666',
    fontSize: '14px'
  },
  phoneLink: {
    color: '#000000',
    fontWeight: '600',
    fontSize: '18px',
    textDecoration: 'none'
  }
};
