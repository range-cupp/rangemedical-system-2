// /pages/hrt/[token].js
// HRT Patient Landing Page — personalized dashboard with protocol info, labs, booking
// Range Medical

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function HRTPortal() {
  const router = useRouter();
  const { token } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeBookingTab, setActiveBookingTab] = useState(null);
  const [expandedGuide, setExpandedGuide] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/hrt-portal/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load');
      }
      const result = await res.json();
      setData(result);

      // Set default booking tab
      if (result.protocol.deliveryMethod === 'in_clinic') {
        setActiveBookingTab('injection');
      } else {
        setActiveBookingTab('blood_draw');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelBooking = async (bookingUid) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingBooking(bookingUid);
    try {
      const res = await fetch(`/api/hrt-portal/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_booking', bookingUid })
      });
      if (res.ok) {
        await fetchData();
      } else {
        alert('Failed to cancel booking. Please call (949) 997-3988.');
      }
    } catch {
      alert('Failed to cancel booking. Please call (949) 997-3988.');
    } finally {
      setCancellingBooking(null);
    }
  };

  // Build schedule display string
  const getScheduleDisplay = (protocol) => {
    if (protocol.scheduledDays && Array.isArray(protocol.scheduledDays) && protocol.scheduledDays.length > 0) {
      return protocol.scheduledDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(' & ');
    }
    if (protocol.frequency) return protocol.frequency;
    if (protocol.injectionMethod === 'subq') return 'Daily';
    return '2x per week';
  };

  // Get delivery method display
  const getDeliveryDisplay = (protocol) => {
    if (protocol.deliveryMethod === 'in_clinic') return 'In-Clinic';
    if (protocol.deliveryMethod === 'take_home') return 'Take-Home';
    return protocol.deliveryMethod || '';
  };

  // Get injection method display
  const getInjectionMethodDisplay = (protocol) => {
    if (protocol.injectionMethod === 'im') return 'Intramuscular (IM)';
    if (protocol.injectionMethod === 'subq') return 'Subcutaneous (SubQ)';
    return '';
  };

  // Build Cal.com embed URL
  const getCalUrl = (eventSlug) => {
    if (!data) return '';
    const params = new URLSearchParams({
      embed: 'true',
      layout: 'month_view',
      theme: 'light'
    });
    if (data.patient.name) params.set('name', data.patient.name);
    if (data.patient.email) params.set('email', data.patient.email);
    return `https://range-medical.cal.com/range-team/${eventSlug}?${params.toString()}`;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' });
  };

  // Format datetime for bookings
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const d = new Date(dateTimeStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    });
  };

  // Get injection guide content
  const getInjectionGuide = (protocol) => {
    if (protocol.deliveryMethod === 'in_clinic') {
      return {
        title: 'Your In-Clinic Injection Schedule',
        content: [
          'Your injections are administered by our clinical team at Range Medical.',
          `Schedule: ${getScheduleDisplay(protocol)}`,
          'Each visit takes about 10-15 minutes.',
          'No appointment needed for regular injections — just walk in during clinic hours.',
          'If you need to adjust your schedule, call us at (949) 997-3988.'
        ]
      };
    }
    if (protocol.injectionMethod === 'subq') {
      return {
        title: 'Your Daily SubQ Injection Guide',
        content: [
          'Inject subcutaneously (under the skin) in your abdomen or outer thigh.',
          'Rotate injection sites to prevent tissue irritation.',
          'Clean the injection site with an alcohol swab before injecting.',
          'Pinch a fold of skin, insert the needle at a 45-degree angle.',
          'Inject slowly and hold for 5-10 seconds before withdrawing.',
          'Store your medication at room temperature, away from direct sunlight.',
          'If you miss a dose, take it as soon as you remember and continue your regular schedule.'
        ]
      };
    }
    if (protocol.supplyType && protocol.supplyType.includes('prefilled')) {
      return {
        title: 'How to Self-Inject: Pre-Filled Syringe',
        content: [
          'Remove the pre-filled syringe from the packaging.',
          'Clean the injection site (upper outer quadrant of the glute or outer thigh) with an alcohol swab.',
          'Remove the needle cap and hold the syringe like a dart.',
          'Insert the needle at a 90-degree angle with a quick, firm motion.',
          'Aspirate briefly (pull back on the plunger to check for blood).',
          'If no blood appears, inject slowly and steadily.',
          'Withdraw the needle and apply gentle pressure with a cotton ball.',
          'Dispose of the syringe in a sharps container.',
          'Store unused syringes at room temperature.'
        ]
      };
    }
    return {
      title: 'How to Self-Inject: Drawing from a Vial',
      content: [
        'Wash your hands thoroughly before starting.',
        'Clean the top of the vial with an alcohol swab.',
        'Draw air into the syringe equal to your dose amount.',
        'Insert the needle into the vial and inject the air.',
        'Turn the vial upside down and draw your prescribed dose.',
        'Tap the syringe to move air bubbles to the top and push them out.',
        'Switch to the injection needle if using a drawing needle.',
        'Clean the injection site (upper outer glute or outer thigh) with alcohol.',
        'Insert at a 90-degree angle, aspirate briefly, then inject slowly.',
        'Withdraw and apply pressure. Dispose of the needle in a sharps container.',
        'Store vial at room temperature, away from light.'
      ]
    };
  };

  // FAQ data
  const faqs = [
    {
      q: 'When should I get my blood drawn?',
      a: 'Your lab schedule is shown above in the Lab Timeline section. Generally, your first follow-up labs are at 8 weeks, then every 12 weeks after that. Fasting for 8-12 hours is recommended (water is fine). Morning appointments work best.'
    },
    {
      q: "What's included with my Range IV?",
      a: 'Your monthly Range IV includes a custom blend of 5 vitamins and minerals tailored to how you\'re feeling that day. Sessions are approximately 60 minutes. You can add extras for a small upcharge. It\'s a $225 value included with your HRT membership.'
    },
    {
      q: 'How do I store my medication?',
      a: 'Store your medication at room temperature (68-77°F), away from direct sunlight and moisture. Do not refrigerate unless specifically instructed. Keep out of reach of children.'
    },
    {
      q: 'What if I miss an injection?',
      a: 'If you miss a dose, take it as soon as you remember. If it\'s close to your next scheduled dose, skip the missed one and continue your regular schedule. Don\'t double up. If you\'re unsure, call us at (949) 997-3988.'
    },
    {
      q: 'Who do I contact with questions?',
      a: 'Call or text us at (949) 997-3988. You can also email info@range-medical.com. We\'re happy to help with anything — dosage questions, side effects, scheduling, or general wellness questions.'
    },
    {
      q: 'How do I cancel or reschedule an appointment?',
      a: 'You can cancel upcoming appointments directly from this page using the cancel button in the My Appointments section. To reschedule, cancel the existing appointment and book a new time. You can also call us at (949) 997-3988.'
    }
  ];

  // Booking tabs configuration
  const getBookingTabs = (protocol) => {
    const tabs = [];
    if (protocol.deliveryMethod === 'in_clinic') {
      tabs.push({ id: 'injection', label: 'Injection', slug: 'injection-testosterone', desc: 'Book your testosterone injection appointment (15 min)' });
    }
    tabs.push({ id: 'blood_draw', label: 'Blood Draw', slug: 'follow-up-blood-draw', desc: 'Book your follow-up blood draw (15 min, fasting recommended)' });
    tabs.push({ id: 'iv', label: 'Range IV', slug: 'range-iv', desc: 'Book your complimentary monthly Range IV (60 min)' });
    return tabs;
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Head>
          <title>HRT Dashboard | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </Head>
        <div style={styles.page}>
          <div style={styles.header}>
            <h1 style={styles.headerTitle}>RANGE MEDICAL</h1>
          </div>
          <div style={{ ...styles.container, textAlign: 'center', padding: '80px 20px' }}>
            <div style={styles.spinner} />
            <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading your dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Head>
          <title>HRT Dashboard | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </Head>
        <div style={styles.page}>
          <div style={styles.header}>
            <h1 style={styles.headerTitle}>RANGE MEDICAL</h1>
          </div>
          <div style={{ ...styles.container, textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ fontSize: '18px', color: '#111', fontWeight: 600 }}>Page not found</p>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>This link may be expired or invalid. Please contact Range Medical at (949) 997-3988.</p>
          </div>
        </div>
      </>
    );
  }

  const { patient, protocol, labSchedule, bookings, ivStatus } = data;
  const guide = getInjectionGuide(protocol);
  const bookingTabs = getBookingTabs(protocol);

  return (
    <>
      <Head>
        <title>Your HRT Dashboard | Range Medical</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>RANGE MEDICAL</h1>
          <p style={styles.headerSub}>Hormone Optimization</p>
        </div>

        <div style={styles.container}>
          {/* Greeting */}
          <div style={styles.greeting}>
            <h2 style={styles.greetingTitle}>Hi {patient.firstName}, here&apos;s your HRT dashboard</h2>
            <p style={styles.greetingText}>Everything you need for your hormone optimization program in one place.</p>
          </div>

          {/* My Protocol Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>💊</span>
              <h3 style={styles.cardTitle}>My Protocol</h3>
            </div>
            <div style={styles.protocolGrid}>
              <div style={styles.protocolItem}>
                <span style={styles.protocolLabel}>Medication</span>
                <span style={styles.protocolValue}>{protocol.medication || 'Testosterone Cypionate'}</span>
              </div>
              {protocol.dose && (
                <div style={styles.protocolItem}>
                  <span style={styles.protocolLabel}>Dosage</span>
                  <span style={styles.protocolValue}>{protocol.dose}</span>
                </div>
              )}
              <div style={styles.protocolItem}>
                <span style={styles.protocolLabel}>Schedule</span>
                <span style={styles.protocolValue}>{getScheduleDisplay(protocol)}</span>
              </div>
              <div style={styles.protocolItem}>
                <span style={styles.protocolLabel}>Setting</span>
                <span style={styles.protocolValue}>{getDeliveryDisplay(protocol)}</span>
              </div>
              {protocol.deliveryMethod === 'take_home' && protocol.injectionMethod && (
                <div style={styles.protocolItem}>
                  <span style={styles.protocolLabel}>Method</span>
                  <span style={styles.protocolValue}>{getInjectionMethodDisplay(protocol)}</span>
                </div>
              )}
              {protocol.startDate && (
                <div style={styles.protocolItem}>
                  <span style={styles.protocolLabel}>Started</span>
                  <span style={styles.protocolValue}>{formatDate(protocol.startDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Lab Timeline Card */}
          {labSchedule && labSchedule.length > 0 && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>🩸</span>
                <h3 style={styles.cardTitle}>Lab Timeline</h3>
              </div>
              <div style={styles.labTimeline}>
                {labSchedule.map((draw, idx) => (
                  <div key={idx} style={styles.labRow}>
                    <div style={{
                      ...styles.labDot,
                      backgroundColor: draw.status === 'completed' ? '#16a34a' : draw.status === 'overdue' ? '#dc2626' : '#2563eb'
                    }}>
                      {draw.status === 'completed' ? '✓' : draw.status === 'overdue' ? '!' : (idx + 1)}
                    </div>
                    <div style={styles.labInfo}>
                      <div style={styles.labLabel}>{draw.label}</div>
                      <div style={styles.labDate}>
                        {draw.status === 'completed'
                          ? `Completed ${formatDate(draw.completedDate)}`
                          : draw.weekLabel
                        }
                      </div>
                    </div>
                    <div style={{
                      ...styles.labBadge,
                      backgroundColor: draw.status === 'completed' ? '#dcfce7' : draw.status === 'overdue' ? '#fef2f2' : '#eff6ff',
                      color: draw.status === 'completed' ? '#16a34a' : draw.status === 'overdue' ? '#dc2626' : '#2563eb'
                    }}>
                      {draw.status === 'completed' ? 'Done' : draw.status === 'overdue' ? 'Overdue' : 'Upcoming'}
                    </div>
                    {(draw.status === 'upcoming' || draw.status === 'overdue') && (
                      <button
                        onClick={() => {
                          setActiveBookingTab('blood_draw');
                          document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={styles.bookBtn}
                      >
                        Book
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p style={styles.labNote}>Labs are included with your HRT membership. Fast 8-12 hours before your blood draw (water is fine).</p>
            </div>
          )}

          {/* Range IV Status Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>💧</span>
              <h3 style={styles.cardTitle}>Monthly Range IV</h3>
            </div>
            {ivStatus.usedThisMonth ? (
              <div style={styles.ivStatus}>
                <div style={{ ...styles.ivBadge, backgroundColor: '#dcfce7', color: '#16a34a' }}>
                  ✓ IV completed {formatDate(ivStatus.lastDate)}
                </div>
                <p style={styles.ivText}>Your next Range IV will be available around {formatDate(ivStatus.nextEligible)}.</p>
              </div>
            ) : (
              <div style={styles.ivStatus}>
                <div style={{ ...styles.ivBadge, backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  Your monthly Range IV is ready!
                </div>
                <p style={styles.ivText}>Your HRT membership includes a custom Range IV every month ($225 value). Book yours below!</p>
                <button
                  onClick={() => {
                    setActiveBookingTab('iv');
                    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={styles.bookIvBtn}
                >
                  Book Range IV
                </button>
              </div>
            )}
          </div>

          {/* Book Appointments Section */}
          <div id="booking-section" style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>📅</span>
              <h3 style={styles.cardTitle}>Book an Appointment</h3>
            </div>

            {/* Tab Selector */}
            <div style={styles.tabBar}>
              {bookingTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveBookingTab(tab.id)}
                  style={{
                    ...styles.tab,
                    backgroundColor: activeBookingTab === tab.id ? '#000' : '#f5f5f5',
                    color: activeBookingTab === tab.id ? '#fff' : '#404040'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Tab Description */}
            {bookingTabs.map(tab => (
              activeBookingTab === tab.id && (
                <div key={tab.id}>
                  <p style={styles.tabDesc}>{tab.desc}</p>
                  <div style={styles.calendarEmbed}>
                    <iframe
                      src={getCalUrl(tab.slug)}
                      style={{ width: '100%', height: '650px', border: 'none', overflow: 'hidden' }}
                      scrolling="no"
                    />
                  </div>
                </div>
              )
            ))}
          </div>

          {/* My Appointments Card */}
          {bookings && bookings.length > 0 && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>📋</span>
                <h3 style={styles.cardTitle}>My Appointments</h3>
              </div>
              <div style={styles.appointmentList}>
                {bookings.map(booking => (
                  <div key={booking.id} style={styles.appointmentRow}>
                    <div style={styles.appointmentInfo}>
                      <div style={styles.appointmentTitle}>{booking.title || 'Appointment'}</div>
                      <div style={styles.appointmentTime}>{formatDateTime(booking.startTime)}</div>
                      {booking.provider && (
                        <div style={styles.appointmentProvider}>with {booking.provider}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleCancelBooking(booking.uid)}
                      disabled={cancellingBooking === booking.uid}
                      style={styles.cancelBtn}
                    >
                      {cancellingBooking === booking.uid ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                ))}
              </div>
              <p style={styles.rescheduleNote}>Need to reschedule? Cancel the existing appointment and book a new time above.</p>
            </div>
          )}

          {/* Injection Guide Card */}
          <div style={styles.card}>
            <button
              onClick={() => setExpandedGuide(!expandedGuide)}
              style={styles.collapsibleHeader}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={styles.cardIcon}>💉</span>
                <h3 style={styles.cardTitle}>{guide.title}</h3>
              </div>
              <span style={styles.chevron}>{expandedGuide ? '▲' : '▼'}</span>
            </button>
            {expandedGuide && (
              <div style={styles.guideContent}>
                <ol style={styles.guideList}>
                  {guide.content.map((step, idx) => (
                    <li key={idx} style={styles.guideStep}>{step}</li>
                  ))}
                </ol>
                <div style={styles.guideCallout}>
                  <p style={{ margin: 0, fontWeight: 600 }}>Need a walkthrough?</p>
                  <p style={{ margin: '4px 0 0', color: '#6b7280' }}>Come by the clinic anytime and our team will guide you through the process in person.</p>
                </div>
              </div>
            )}
          </div>

          {/* FAQs Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>❓</span>
              <h3 style={styles.cardTitle}>Frequently Asked Questions</h3>
            </div>
            <div style={styles.faqList}>
              {faqs.map((faq, idx) => (
                <div key={idx} style={styles.faqItem}>
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    style={styles.faqQuestion}
                  >
                    <span>{faq.q}</span>
                    <span style={styles.chevron}>{expandedFaq === idx ? '▲' : '▼'}</span>
                  </button>
                  {expandedFaq === idx && (
                    <p style={styles.faqAnswer}>{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <p style={styles.footerQuestion}>Questions? We&apos;re here to help.</p>
            <a href="tel:+19499973988" style={styles.footerPhone}>(949) 997-3988</a>
            <p style={styles.footerAddress}>Range Medical &bull; 1901 Westcliff Dr, Suite 10, Newport Beach, CA</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  header: {
    backgroundColor: '#000',
    padding: '28px 20px',
    textAlign: 'center'
  },
  headerTitle: {
    margin: 0,
    color: '#fff',
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '0.1em'
  },
  headerSub: {
    margin: '6px 0 0',
    color: '#a3a3a3',
    fontSize: '13px'
  },
  container: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '20px 16px 40px'
  },
  greeting: {
    marginBottom: '24px'
  },
  greetingTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: '#111'
  },
  greetingText: {
    margin: '8px 0 0',
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: 1.5
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '0',
    border: '1px solid #e5e7eb',
    padding: '24px',
    marginBottom: '16px'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px'
  },
  cardIcon: {
    fontSize: '20px'
  },
  cardTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: '#111'
  },
  protocolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '16px'
  },
  protocolItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  protocolLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  protocolValue: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111'
  },
  labTimeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  labRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  labDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 700,
    flexShrink: 0
  },
  labInfo: {
    flex: 1,
    minWidth: 0
  },
  labLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111'
  },
  labDate: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '2px'
  },
  labBadge: {
    padding: '3px 10px',
    borderRadius: '0',
    fontSize: '12px',
    fontWeight: 600,
    flexShrink: 0
  },
  bookBtn: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '0',
    cursor: 'pointer',
    flexShrink: 0
  },
  labNote: {
    margin: '16px 0 0',
    fontSize: '13px',
    color: '#9ca3af',
    lineHeight: 1.5
  },
  ivStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  ivBadge: {
    padding: '10px 16px',
    borderRadius: '0',
    fontSize: '14px',
    fontWeight: 600
  },
  ivText: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.5
  },
  bookIvBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '0',
    cursor: 'pointer',
    alignSelf: 'flex-start'
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '0',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  tabDesc: {
    margin: '0 0 12px',
    fontSize: '14px',
    color: '#6b7280'
  },
  calendarEmbed: {
    borderRadius: '0',
    overflow: 'hidden',
    border: '1px solid #e5e7eb'
  },
  appointmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  appointmentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#fafafa',
    borderRadius: '0',
    gap: '12px'
  },
  appointmentInfo: {
    flex: 1,
    minWidth: 0
  },
  appointmentTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111'
  },
  appointmentTime: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '2px'
  },
  appointmentProvider: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '2px'
  },
  cancelBtn: {
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#fff',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    borderRadius: '0',
    cursor: 'pointer',
    flexShrink: 0
  },
  rescheduleNote: {
    margin: '12px 0 0',
    fontSize: '13px',
    color: '#9ca3af'
  },
  collapsibleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 0,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left'
  },
  chevron: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  guideContent: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6'
  },
  guideList: {
    margin: 0,
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  guideStep: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#404040'
  },
  guideCallout: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#f0f9ff',
    borderRadius: '0',
    fontSize: '14px',
    color: '#111'
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column'
  },
  faqItem: {
    borderBottom: '1px solid #f3f4f6'
  },
  faqQuestion: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '14px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 600,
    color: '#111',
    gap: '12px'
  },
  faqAnswer: {
    margin: '0 0 14px',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#6b7280'
  },
  footer: {
    textAlign: 'center',
    padding: '32px 0',
    marginTop: '8px'
  },
  footerQuestion: {
    margin: 0,
    fontSize: '14px',
    color: '#9ca3af'
  },
  footerPhone: {
    display: 'block',
    margin: '8px 0 0',
    fontSize: '18px',
    fontWeight: 700,
    color: '#111',
    textDecoration: 'none'
  },
  footerAddress: {
    margin: '12px 0 0',
    fontSize: '12px',
    color: '#9ca3af'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#000',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto'
  }
};
