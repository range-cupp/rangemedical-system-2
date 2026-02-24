// /components/BookingTab.js
// Booking Tab - Staff booking interface via Cal.com
// Range Medical
// CREATED: 2026-02-22
// UPDATED: 2026-02-24 - Category groups by slug, cascading dropdowns

import { formatPhone } from '../lib/format-utils';

import { useState, useEffect } from 'react';

// ============================================
// SERVICE CATEGORIES (by Cal.com slug)
// ============================================
const SERVICE_CATEGORIES = {
  'Lab / Blood Draw': [
    'new-patient-blood-draw',
    'follow-up-blood-draw',
    'initial-lab-review',
    'follow-up-lab-review',
    'initial-lab-review-telemedicine',
    'follow-up-lab-review-telemedicine',
    'follow-up-lab-review-phone',
  ],
  'Injections': [
    'range-injections',
    'nad-injection',
    'injection-testosterone',
    'injection-weight-loss',
    'injection-peptide',
    'injection-medical',
  ],
  'Therapies': [
    'hbot',
    'red-light-therapy',
  ],
  'IV Therapy': [
    'range-iv',
    'nad-iv-250',
    'nad-iv-500',
    'nad-iv-750',
    'nad-iv-1000',
    'vitamin-c-iv',
    'specialty-iv',
  ],
  'Consultations': [
    'initial-consultation',
    'initial-consultation-peptide',
    'follow-up-consultation',
  ],
};

const CATEGORY_COLORS = {
  'Lab / Blood Draw': { bg: '#dbeafe', text: '#1e40af' },
  'Injections': { bg: '#fef3c7', text: '#92400e' },
  'Therapies': { bg: '#d1fae5', text: '#065f46' },
  'IV Therapy': { bg: '#ede9fe', text: '#5b21b6' },
  'Consultations': { bg: '#fce7f3', text: '#9d174d' },
};

const CATEGORY_ORDER = ['Lab / Blood Draw', 'Injections', 'Therapies', 'IV Therapy', 'Consultations'];

// ============================================
// CASCADING DROPDOWN CONFIGS
// ============================================
const INJECTION_TIERS = [
  { label: 'Standard ($35)', value: 'Standard ($35)' },
  { label: 'Premium ($50)', value: 'Premium ($50)' },
];

const INJECTION_TYPES_BY_TIER = {
  'Standard ($35)': [
    'B12 (Methylcobalamin)', 'B-Complex', 'Vitamin D3', 'Biotin',
    'Amino Blend', 'NAC', 'BCAA',
  ],
  'Premium ($50)': [
    'L-Carnitine', 'Glutathione (200mg)', 'MIC-B12 (Skinny Shot)',
  ],
};

const NAD_DOSES = [
  '50mg ($25)', '75mg ($37.50)', '100mg ($50)', '125mg ($62.50)', '150mg ($75)',
];

const SPECIALTY_IV_TYPES = [
  'Glutathione', 'Methylene Blue', 'MB + Vitamin C + Magnesium Combo',
  'Exosome', 'BYO', 'Hydration',
];

// ============================================
// HELPERS
// ============================================

function groupServicesByCategory(eventTypes) {
  const slugMap = {};
  eventTypes.forEach(et => { slugMap[et.slug] = et; });

  return CATEGORY_ORDER
    .map(cat => {
      const slugs = SERVICE_CATEGORIES[cat] || [];
      const services = slugs.map(s => slugMap[s]).filter(Boolean);
      return services.length > 0 ? { category: cat, services } : null;
    })
    .filter(Boolean);
}

function needsCascading(slug) {
  return slug === 'range-injections' || slug === 'nad-injection' || slug === 'specialty-iv';
}

export default function BookingTab({ preselectedPatient = null }) {
  // Booking flow state
  const [step, setStep] = useState(preselectedPatient ? 2 : 1); // 1=patient, 2=service, 3=datetime, 4=confirm
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);

  // Cascading dropdown state
  const [injectionTier, setInjectionTier] = useState('');
  const [injectionType, setInjectionType] = useState('');
  const [nadDose, setNadDose] = useState('');
  const [ivType, setIvType] = useState('');

  // Data state
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchTimer, setSearchTimer] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [slots, setSlots] = useState({});
  const [loadingEventTypes, setLoadingEventTypes] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Right panel state
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingView, setBookingView] = useState('day'); // day or week
  const [bookingDate, setBookingDate] = useState(getTodayDate());
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState(null);
  const [rescheduleSlots, setRescheduleSlots] = useState({});
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);

  function getTodayDate() {
    return new Date().toLocaleDateString('en-CA');
  }

  // Fetch event types on mount
  useEffect(() => {
    fetchEventTypes();
    fetchUpcomingBookings();
  }, []);

  // Handle preselected patient
  useEffect(() => {
    if (preselectedPatient) {
      setSelectedPatient(preselectedPatient);
      setStep(2);
    }
  }, [preselectedPatient]);

  // Refetch bookings when view/date changes
  useEffect(() => {
    fetchUpcomingBookings();
  }, [bookingDate, bookingView]);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchEventTypes = async () => {
    setLoadingEventTypes(true);
    try {
      const res = await fetch('/api/bookings/event-types');
      const json = await res.json();
      if (json.success) {
        setEventTypes(json.eventTypes || []);
      }
    } catch (err) {
      console.error('Error fetching event types:', err);
    } finally {
      setLoadingEventTypes(false);
    }
  };

  const fetchSlots = async (eventTypeId, date) => {
    setLoadingSlots(true);
    setSlots({});
    try {
      const res = await fetch(`/api/bookings/slots?eventTypeId=${eventTypeId}&date=${date}`);
      const json = await res.json();
      if (json.success) {
        setSlots(json.slots || {});
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchUpcomingBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch(`/api/bookings/list?date=${bookingDate}&range=${bookingView}`);
      const json = await res.json();
      if (json.success) {
        setUpcomingBookings(json.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // ============================================
  // PATIENT SEARCH
  // ============================================

  const handlePatientSearch = (query) => {
    setPatientSearch(query);
    if (searchTimer) clearTimeout(searchTimer);
    if (query.length < 2) {
      setPatientResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients?search=${encodeURIComponent(query)}`);
        const json = await res.json();
        setPatientResults(json.patients || json.data || []);
      } catch (err) {
        console.error('Patient search error:', err);
      }
    }, 300);
    setSearchTimer(timer);
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch('');
    setPatientResults([]);
    setStep(2);
  };

  // ============================================
  // SERVICE SELECTION
  // ============================================

  const selectService = (service) => {
    setSelectedService(service);
    // Reset cascading state
    setInjectionTier('');
    setInjectionType('');
    setNadDose('');
    setIvType('');

    if (needsCascading(service.slug)) {
      // Stay on step 2 — show cascading dropdowns
    } else {
      setStep(3);
      fetchSlots(service.id, selectedDate);
    }
  };

  const handleCascadingComplete = () => {
    setStep(3);
    fetchSlots(selectedService.id, selectedDate);
  };

  const isCascadingComplete = () => {
    if (!selectedService) return false;
    const slug = selectedService.slug;
    if (slug === 'range-injections') return injectionTier && injectionType;
    if (slug === 'nad-injection') return !!nadDose;
    if (slug === 'specialty-iv') return !!ivType;
    return true;
  };

  const getServiceDetailsForBooking = () => {
    if (!selectedService) return null;
    const slug = selectedService.slug;
    if (slug === 'range-injections' && injectionTier && injectionType) {
      return { injectionTier, injectionType };
    }
    if (slug === 'nad-injection' && nadDose) {
      return { nadDose };
    }
    if (slug === 'specialty-iv' && ivType) {
      return { ivType };
    }
    return null;
  };

  const getServiceDetailsSummary = () => {
    const details = getServiceDetailsForBooking();
    if (!details) return null;
    if (details.injectionTier) return `${details.injectionTier} — ${details.injectionType}`;
    if (details.nadDose) return `NAD+ ${details.nadDose}`;
    if (details.ivType) return details.ivType;
    return null;
  };

  // ============================================
  // DATE/TIME
  // ============================================

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setSelectedSlot(null);
    if (selectedService) {
      fetchSlots(selectedService.id, newDate);
    }
  };

  const navigateDate = (direction) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + direction);
    const newDate = d.toLocaleDateString('en-CA');
    handleDateChange(newDate);
  };

  // ============================================
  // BOOKING
  // ============================================

  const handleBook = async () => {
    if (!selectedPatient || !selectedService || !selectedSlot) return;
    setBooking(true);
    try {
      const serviceDetails = getServiceDetailsForBooking();
      const detailsSummary = getServiceDetailsSummary();
      const fullNotes = [notes, detailsSummary].filter(Boolean).join(' | ');

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTypeId: selectedService.id,
          start: selectedSlot.start,
          patientId: selectedPatient.id,
          patientName: selectedPatient.name,
          patientEmail: selectedPatient.email,
          patientPhone: selectedPatient.phone,
          serviceName: selectedService.title,
          serviceSlug: selectedService.slug,
          durationMinutes: selectedService.length,
          notes: fullNotes,
          serviceDetails
        })
      });
      const json = await res.json();
      if (json.success) {
        setStep(1);
        setSelectedPatient(null);
        setSelectedService(null);
        setSelectedSlot(null);
        setNotes('');
        setSelectedDate(getTodayDate());
        setInjectionTier('');
        setInjectionType('');
        setNadDose('');
        setIvType('');
        fetchUpcomingBookings();
        alert('Booking created successfully!');
      } else {
        alert('Booking failed: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Booking failed: ' + err.message);
    } finally {
      setBooking(false);
    }
  };

  // ============================================
  // CANCEL / RESCHEDULE
  // ============================================

  const handleCancel = async (bookingId) => {
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      const json = await res.json();
      if (json.success) {
        setCancelConfirm(null);
        fetchUpcomingBookings();
      } else {
        alert('Cancel failed: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  const fetchRescheduleSlots = async (eventTypeId, date) => {
    setLoadingRescheduleSlots(true);
    setRescheduleSlots({});
    try {
      const res = await fetch(`/api/bookings/slots?eventTypeId=${eventTypeId}&date=${date}`);
      const json = await res.json();
      if (json.success) {
        setRescheduleSlots(json.slots || {});
      }
    } catch (err) {
      console.error('Error fetching reschedule slots:', err);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleModal || !rescheduleSlot) return;
    try {
      const res = await fetch('/api/bookings/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: rescheduleModal.id,
          newStart: rescheduleSlot.start
        })
      });
      const json = await res.json();
      if (json.success) {
        setRescheduleModal(null);
        setRescheduleSlot(null);
        setRescheduleDate('');
        fetchUpcomingBookings();
      } else {
        alert('Reschedule failed: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Reschedule error:', err);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const getLocalHourMinute = (isoString) => {
    if (!isoString) return { hour: 8, minute: 0 };
    const parts = new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Los_Angeles'
    });
    const [h, m] = parts.split(':').map(Number);
    return { hour: h, minute: m };
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateLong = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSlotsList = (slotsObj) => {
    const all = [];
    Object.values(slotsObj || {}).forEach(daySlots => {
      if (Array.isArray(daySlots)) {
        all.push(...daySlots);
      }
    });
    return all;
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={styles.container}>
      <div style={styles.twoColumn}>
        {/* LEFT PANEL - Book Appointment */}
        <div style={styles.leftPanel}>
          <h3 style={styles.panelTitle}>Book Appointment</h3>

          {/* Step indicators */}
          <div style={styles.steps}>
            {[
              { num: 1, label: 'Patient' },
              { num: 2, label: 'Service' },
              { num: 3, label: 'Date & Time' },
              { num: 4, label: 'Confirm' }
            ].map(s => (
              <div
                key={s.num}
                style={{
                  ...styles.stepItem,
                  ...(step >= s.num ? styles.stepActive : {}),
                  ...(step === s.num ? styles.stepCurrent : {}),
                  cursor: step > s.num ? 'pointer' : 'default'
                }}
                onClick={() => { if (step > s.num) setStep(s.num); }}
              >
                <span style={styles.stepNum}>{s.num}</span>
                <span style={styles.stepLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Step 1: Patient Search */}
          {step === 1 && (
            <div style={styles.stepContent}>
              <label style={styles.label}>Search Patient</label>
              {selectedPatient ? (
                <div style={styles.selectedCard}>
                  <div>
                    <div style={styles.selectedName}>{selectedPatient.name}</div>
                    {selectedPatient.email && <div style={styles.selectedDetail}>{selectedPatient.email}</div>}
                    {selectedPatient.phone && <div style={styles.selectedDetail}>{formatPhone(selectedPatient.phone)}</div>}
                  </div>
                  <button
                    style={styles.clearBtn}
                    onClick={() => { setSelectedPatient(null); setStep(1); }}
                  >
                    x
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    placeholder="Type patient name..."
                    style={styles.input}
                    autoFocus
                  />
                  {patientResults.length > 0 && (
                    <div style={styles.searchResults}>
                      {patientResults.slice(0, 8).map(p => (
                        <div
                          key={p.id}
                          style={styles.searchResult}
                          onClick={() => selectPatient(p)}
                        >
                          <span style={styles.resultName}>{p.name}</span>
                          {p.phone && <span style={styles.resultPhone}>{formatPhone(p.phone)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {selectedPatient && (
                <button style={styles.nextBtn} onClick={() => setStep(2)}>
                  Next: Select Service
                </button>
              )}
            </div>
          )}

          {/* Step 2: Service Selection */}
          {step === 2 && (
            <div style={styles.stepContent}>
              <label style={styles.label}>Select Service</label>
              {loadingEventTypes ? (
                <div style={styles.loadingText}>Loading services...</div>
              ) : (
                <div>
                  {groupServicesByCategory(eventTypes).map(({ category, services }) => {
                    const color = CATEGORY_COLORS[category] || { bg: '#f3f4f6', text: '#374151' };
                    return (
                      <div key={category} style={{ marginBottom: '20px' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: color.bg,
                          color: color.text,
                          marginBottom: '10px'
                        }}>
                          {category}
                        </div>
                        <div style={styles.serviceGrid}>
                          {services.map(et => (
                            <div
                              key={et.id}
                              style={{
                                ...styles.serviceCard,
                                borderLeft: `3px solid ${color.text}`,
                                ...(selectedService?.id === et.id ? styles.serviceCardSelected : {})
                              }}
                              onClick={() => selectService(et)}
                            >
                              <div style={styles.serviceName}>{et.title}</div>
                              <div style={styles.serviceDuration}>{et.length} min</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Cascading Dropdowns */}
                  {selectedService && needsCascading(selectedService.slug) && (
                    <div style={styles.cascadingSection}>
                      {/* Range Injections: Tier + Type */}
                      {selectedService.slug === 'range-injections' && (
                        <>
                          <label style={styles.label}>Injection Tier</label>
                          <select
                            value={injectionTier}
                            onChange={(e) => { setInjectionTier(e.target.value); setInjectionType(''); }}
                            style={styles.selectInput}
                          >
                            <option value="">Select tier...</option>
                            {INJECTION_TIERS.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>

                          {injectionTier && (
                            <>
                              <label style={{ ...styles.label, marginTop: '12px' }}>Injection Type</label>
                              <select
                                value={injectionType}
                                onChange={(e) => setInjectionType(e.target.value)}
                                style={styles.selectInput}
                              >
                                <option value="">Select type...</option>
                                {(INJECTION_TYPES_BY_TIER[injectionTier] || []).map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </>
                          )}
                        </>
                      )}

                      {/* NAD+ Injection: Dose */}
                      {selectedService.slug === 'nad-injection' && (
                        <>
                          <label style={styles.label}>NAD+ Dose</label>
                          <select
                            value={nadDose}
                            onChange={(e) => setNadDose(e.target.value)}
                            style={styles.selectInput}
                          >
                            <option value="">Select dose...</option>
                            {NAD_DOSES.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </>
                      )}

                      {/* Specialty IV: Type */}
                      {selectedService.slug === 'specialty-iv' && (
                        <>
                          <label style={styles.label}>IV Type</label>
                          <select
                            value={ivType}
                            onChange={(e) => setIvType(e.target.value)}
                            style={styles.selectInput}
                          >
                            <option value="">Select IV type...</option>
                            {SPECIALTY_IV_TYPES.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </>
                      )}

                      <button
                        style={{ ...styles.nextBtn, opacity: isCascadingComplete() ? 1 : 0.5, marginTop: '16px' }}
                        onClick={handleCascadingComplete}
                        disabled={!isCascadingComplete()}
                      >
                        Next: Select Date & Time
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div style={styles.stepContent}>
              <label style={styles.label}>Select Date</label>
              <div style={styles.dateNav}>
                <button style={styles.dateNavBtn} onClick={() => navigateDate(-1)}>&larr;</button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  style={styles.dateInput}
                />
                <button style={styles.dateNavBtn} onClick={() => navigateDate(1)}>&rarr;</button>
              </div>
              <div style={styles.dateLabel}>{formatDateLong(selectedDate)}</div>

              <label style={{ ...styles.label, marginTop: '16px' }}>Available Times</label>
              {loadingSlots ? (
                <div style={styles.loadingText}>Loading available times...</div>
              ) : (
                <div style={styles.slotsGrid}>
                  {getSlotsList(slots).length === 0 ? (
                    <div style={styles.noSlots}>No available times for this date</div>
                  ) : (
                    getSlotsList(slots).map((slot, i) => (
                      <button
                        key={i}
                        style={{
                          ...styles.slotBtn,
                          ...(selectedSlot?.start === slot.start ? styles.slotBtnSelected : {})
                        }}
                        onClick={() => { setSelectedSlot(slot); setStep(4); }}
                      >
                        {formatTime(slot.start)}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div style={styles.stepContent}>
              <label style={styles.label}>Confirm Booking</label>
              <div style={styles.summaryCard}>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Patient</span>
                  <span style={styles.summaryValue}>{selectedPatient?.name}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Service</span>
                  <span style={styles.summaryValue}>{selectedService?.title}</span>
                </div>
                {getServiceDetailsSummary() && (
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Details</span>
                    <span style={styles.summaryValue}>{getServiceDetailsSummary()}</span>
                  </div>
                )}
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Duration</span>
                  <span style={styles.summaryValue}>{selectedService?.length} min</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Date</span>
                  <span style={styles.summaryValue}>{formatDateLong(selectedDate)}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Time</span>
                  <span style={styles.summaryValue}>{formatTime(selectedSlot?.start)}</span>
                </div>
              </div>

              <label style={{ ...styles.label, marginTop: '16px' }}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add booking notes..."
                style={styles.textarea}
                rows={3}
              />

              <button
                style={{ ...styles.bookBtn, opacity: booking ? 0.6 : 1 }}
                onClick={handleBook}
                disabled={booking}
              >
                {booking ? 'Creating Booking...' : 'Book Appointment'}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL - Upcoming Bookings */}
        <div style={styles.rightPanel}>
          <div style={styles.rightHeader}>
            <h3 style={styles.panelTitle}>Upcoming Bookings</h3>
            <div style={styles.viewToggle}>
              <button
                style={{ ...styles.toggleBtn, ...(bookingView === 'day' ? styles.toggleBtnActive : {}) }}
                onClick={() => setBookingView('day')}
              >
                Day
              </button>
              <button
                style={{ ...styles.toggleBtn, ...(bookingView === 'week' ? styles.toggleBtnActive : {}) }}
                onClick={() => setBookingView('week')}
              >
                Week
              </button>
            </div>
          </div>

          <div style={styles.dateNav}>
            <button style={styles.dateNavBtn} onClick={() => {
              const d = new Date(bookingDate + 'T12:00:00');
              d.setDate(d.getDate() - (bookingView === 'week' ? 7 : 1));
              setBookingDate(d.toLocaleDateString('en-CA'));
            }}>&larr;</button>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              style={styles.dateInput}
            />
            <button style={styles.dateNavBtn} onClick={() => {
              const d = new Date(bookingDate + 'T12:00:00');
              d.setDate(d.getDate() + (bookingView === 'week' ? 7 : 1));
              setBookingDate(d.toLocaleDateString('en-CA'));
            }}>&rarr;</button>
          </div>

          {loadingBookings ? (
            <div style={styles.loadingText}>Loading bookings...</div>
          ) : bookingView === 'day' ? (
            /* DAY VIEW — Time-grid calendar */
            <div style={styles.calendarWrapper} onClick={() => setSelectedBlock(null)}>
              <div style={styles.calendarGrid}>
                {/* Hour lines */}
                {Array.from({ length: 11 }, (_, i) => {
                  const hour = 8 + i;
                  const label = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                  return (
                    <div key={hour} style={{ ...styles.hourRow, top: `${i * 60}px` }}>
                      <span style={styles.hourLabel}>{label}</span>
                      <div style={styles.hourLine} />
                    </div>
                  );
                })}

                {/* Booking blocks */}
                {upcomingBookings.map(b => {
                  const { hour, minute } = getLocalHourMinute(b.start_time);
                  const topPx = (hour - 8) * 60 + minute;
                  const duration = b.duration_minutes || 30;
                  const heightPx = Math.max(24, duration);
                  const isScheduled = b.status === 'scheduled';
                  const accentColor = isScheduled ? '#2563eb' : '#16a34a';

                  return (
                    <div
                      key={b.id}
                      style={{
                        ...styles.bookingBlock,
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        borderLeftColor: accentColor,
                        backgroundColor: isScheduled ? '#eff6ff' : '#f0fdf4'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBlock(selectedBlock?.id === b.id ? null : b);
                      }}
                    >
                      <div style={styles.blockPatient}>{b.patient_name}</div>
                      {heightPx >= 40 && <div style={styles.blockService}>{b.service_name}</div>}
                      {heightPx >= 54 && <div style={styles.blockTime}>{formatTime(b.start_time)} ({duration}m)</div>}
                    </div>
                  );
                })}

                {/* Current time indicator (today only) */}
                {bookingDate === getTodayDate() && (() => {
                  const now = new Date();
                  const parts = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'America/Los_Angeles' });
                  const [h, m] = parts.split(':').map(Number);
                  const topPx = (h - 8) * 60 + m;
                  if (topPx < 0 || topPx > 600) return null;
                  return (
                    <div style={{ ...styles.currentTimeLine, top: `${topPx}px` }}>
                      <div style={styles.currentTimeDot} />
                    </div>
                  );
                })()}
              </div>

              {/* Click popover */}
              {selectedBlock && (() => {
                const { hour, minute } = getLocalHourMinute(selectedBlock.start_time);
                const topPx = (hour - 8) * 60 + minute;
                const duration = selectedBlock.duration_minutes || 30;
                const blockBottom = topPx + Math.max(24, duration);
                return (
                  <div
                    style={{ ...styles.blockPopover, top: `${blockBottom + 4}px` }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
                      {selectedBlock.patient_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2px' }}>
                      {selectedBlock.service_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
                      {formatTime(selectedBlock.start_time)} ({duration}m)
                    </div>
                    <div style={styles.popoverActions}>
                      <button
                        style={styles.actionBtn}
                        onClick={() => {
                          setRescheduleModal(selectedBlock);
                          setRescheduleDate(selectedBlock.booking_date);
                          fetchRescheduleSlots(selectedBlock.calcom_event_type_id, selectedBlock.booking_date);
                          setSelectedBlock(null);
                        }}
                      >
                        Reschedule
                      </button>
                      <button
                        style={{ ...styles.actionBtn, ...styles.cancelBtn }}
                        onClick={() => {
                          setCancelConfirm(selectedBlock);
                          setSelectedBlock(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div style={styles.noBookings}>No bookings for this week</div>
          ) : (
            /* WEEK VIEW — Card list */
            <div style={styles.bookingsList}>
              {upcomingBookings.map(b => (
                <div key={b.id} style={styles.bookingCard}>
                  <div style={styles.bookingTime}>
                    {formatTime(b.start_time)}
                    {b.duration_minutes && <span style={styles.bookingDuration}> ({b.duration_minutes}m)</span>}
                  </div>
                  <div style={styles.bookingInfo}>
                    <div style={styles.bookingPatient}>{b.patient_name}</div>
                    <div style={styles.bookingService}>{b.service_name}</div>
                  </div>
                  <div style={styles.bookingMeta}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: b.status === 'confirmed' ? '#dcfce7' : b.status === 'scheduled' ? '#dbeafe' : '#f3f4f6',
                      color: b.status === 'confirmed' ? '#166534' : b.status === 'scheduled' ? '#1e40af' : '#374151'
                    }}>
                      {b.status}
                    </span>
                    {b.booking_date !== bookingDate && (
                      <div style={styles.bookingDateSmall}>{formatDate(b.booking_date)}</div>
                    )}
                  </div>
                  <div style={styles.bookingActions}>
                    <button
                      style={styles.actionBtn}
                      onClick={() => {
                        setRescheduleModal(b);
                        setRescheduleDate(b.booking_date);
                        fetchRescheduleSlots(b.calcom_event_type_id, b.booking_date);
                      }}
                      title="Reschedule"
                    >
                      Reschedule
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.cancelBtn }}
                      onClick={() => setCancelConfirm(b)}
                      title="Cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelConfirm && (
        <div style={styles.modalOverlay} onClick={() => setCancelConfirm(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Cancel Booking</h3>
            <p style={styles.modalText}>
              Cancel <strong>{cancelConfirm.patient_name}</strong>'s booking for{' '}
              <strong>{cancelConfirm.service_name}</strong> on{' '}
              {formatDateLong(cancelConfirm.booking_date)} at {formatTime(cancelConfirm.start_time)}?
            </p>
            <div style={styles.modalActions}>
              <button style={styles.modalCancelBtn} onClick={() => setCancelConfirm(null)}>Keep Booking</button>
              <button
                style={styles.modalConfirmBtn}
                onClick={() => handleCancel(cancelConfirm.id)}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div style={styles.modalOverlay} onClick={() => { setRescheduleModal(null); setRescheduleSlot(null); }}>
          <div style={{ ...styles.modal, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Reschedule Booking</h3>
            <p style={styles.modalText}>
              Reschedule <strong>{rescheduleModal.patient_name}</strong> — {rescheduleModal.service_name}
            </p>

            <label style={styles.label}>New Date</label>
            <div style={styles.dateNav}>
              <button style={styles.dateNavBtn} onClick={() => {
                const d = new Date(rescheduleDate + 'T12:00:00');
                d.setDate(d.getDate() - 1);
                const nd = d.toLocaleDateString('en-CA');
                setRescheduleDate(nd);
                setRescheduleSlot(null);
                fetchRescheduleSlots(rescheduleModal.calcom_event_type_id, nd);
              }}>&larr;</button>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  setRescheduleSlot(null);
                  fetchRescheduleSlots(rescheduleModal.calcom_event_type_id, e.target.value);
                }}
                style={styles.dateInput}
              />
              <button style={styles.dateNavBtn} onClick={() => {
                const d = new Date(rescheduleDate + 'T12:00:00');
                d.setDate(d.getDate() + 1);
                const nd = d.toLocaleDateString('en-CA');
                setRescheduleDate(nd);
                setRescheduleSlot(null);
                fetchRescheduleSlots(rescheduleModal.calcom_event_type_id, nd);
              }}>&rarr;</button>
            </div>

            <label style={{ ...styles.label, marginTop: '12px' }}>New Time</label>
            {loadingRescheduleSlots ? (
              <div style={styles.loadingText}>Loading times...</div>
            ) : (
              <div style={styles.slotsGrid}>
                {getSlotsList(rescheduleSlots).length === 0 ? (
                  <div style={styles.noSlots}>No available times</div>
                ) : (
                  getSlotsList(rescheduleSlots).map((slot, i) => (
                    <button
                      key={i}
                      style={{
                        ...styles.slotBtn,
                        ...(rescheduleSlot?.start === slot.start ? styles.slotBtnSelected : {})
                      }}
                      onClick={() => setRescheduleSlot(slot)}
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))
                )}
              </div>
            )}

            <div style={styles.modalActions}>
              <button style={styles.modalCancelBtn} onClick={() => { setRescheduleModal(null); setRescheduleSlot(null); }}>
                Cancel
              </button>
              <button
                style={{ ...styles.modalConfirmBtn, opacity: rescheduleSlot ? 1 : 0.5 }}
                onClick={handleReschedule}
                disabled={!rescheduleSlot}
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    padding: '0'
  },
  twoColumn: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start'
  },
  leftPanel: {
    flex: '1',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    minHeight: '500px'
  },
  rightPanel: {
    width: '420px',
    flexShrink: 0,
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    minHeight: '500px'
  },
  panelTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827'
  },
  rightHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },

  // Steps
  steps: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    padding: '4px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px'
  },
  stepItem: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#9ca3af',
    transition: 'all 0.15s'
  },
  stepActive: {
    color: '#374151'
  },
  stepCurrent: {
    backgroundColor: 'white',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    color: '#111827',
    fontWeight: '500'
  },
  stepNum: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#e5e7eb',
    color: '#6b7280'
  },
  stepLabel: {
    fontSize: '13px'
  },

  // Step content
  stepContent: {
    minHeight: '300px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  },

  // Patient search
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10,
    maxHeight: '280px',
    overflowY: 'auto',
    marginTop: '4px'
  },
  searchResult: {
    padding: '10px 12px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f3f4f6'
  },
  resultName: {
    fontWeight: '500',
    color: '#111827',
    fontSize: '14px'
  },
  resultPhone: {
    color: '#6b7280',
    fontSize: '13px'
  },
  selectedCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px'
  },
  selectedName: {
    fontWeight: '600',
    color: '#166534',
    fontSize: '15px'
  },
  selectedDetail: {
    fontSize: '13px',
    color: '#4b5563',
    marginTop: '2px'
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 8px'
  },
  nextBtn: {
    marginTop: '16px',
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },

  // Service grid
  serviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '10px'
  },
  serviceCard: {
    padding: '14px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  serviceCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    boxShadow: '0 0 0 2px #2563eb'
  },
  serviceName: {
    fontWeight: '500',
    fontSize: '14px',
    color: '#111827',
    marginBottom: '4px'
  },
  serviceDuration: {
    fontSize: '13px',
    color: '#6b7280'
  },

  // Cascading dropdown section
  cascadingSection: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  selectInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    cursor: 'pointer'
  },

  // Date navigation
  dateNav: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '8px'
  },
  dateNavBtn: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#374151'
  },
  dateInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  },
  dateLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '16px'
  },

  // Slots grid
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px'
  },
  slotBtn: {
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    transition: 'all 0.15s'
  },
  slotBtnSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
    color: 'white'
  },
  noSlots: {
    gridColumn: '1 / -1',
    padding: '24px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px'
  },

  // Summary / confirm
  summaryCard: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '8px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  summaryLabel: {
    color: '#6b7280',
    fontSize: '14px'
  },
  summaryValue: {
    fontWeight: '500',
    color: '#111827',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box'
  },
  bookBtn: {
    marginTop: '16px',
    width: '100%',
    padding: '14px',
    backgroundColor: '#16a34a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // View toggle
  viewToggle: {
    display: 'flex',
    gap: '4px',
    padding: '3px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px'
  },
  toggleBtn: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#6b7280',
    fontWeight: '500'
  },
  toggleBtnActive: {
    backgroundColor: 'white',
    color: '#111827',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
  },

  // Bookings list
  bookingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px'
  },
  bookingCard: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  bookingTime: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#111827'
  },
  bookingDuration: {
    fontWeight: '400',
    color: '#6b7280',
    fontSize: '13px'
  },
  bookingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  bookingPatient: {
    fontWeight: '500',
    color: '#374151',
    fontSize: '14px'
  },
  bookingService: {
    color: '#6b7280',
    fontSize: '13px'
  },
  bookingMeta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  bookingDateSmall: {
    fontSize: '12px',
    color: '#6b7280'
  },
  bookingActions: {
    display: 'flex',
    gap: '8px',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '8px'
  },
  actionBtn: {
    padding: '6px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    color: '#374151'
  },
  cancelBtn: {
    color: '#dc2626',
    borderColor: '#fecaca'
  },
  noBookings: {
    padding: '40px 16px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px'
  },
  loadingText: {
    padding: '24px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px'
  },

  // Calendar grid (day view)
  calendarWrapper: {
    position: 'relative',
    marginTop: '12px',
    maxHeight: 'calc(100vh - 240px)',
    overflowY: 'auto',
    overflowX: 'hidden'
  },
  calendarGrid: {
    position: 'relative',
    height: '600px',
    marginLeft: '52px'
  },
  hourRow: {
    position: 'absolute',
    left: '-52px',
    right: 0,
    display: 'flex',
    alignItems: 'flex-start'
  },
  hourLabel: {
    width: '48px',
    flexShrink: 0,
    fontSize: '11px',
    color: '#9ca3af',
    textAlign: 'right',
    paddingRight: '8px',
    transform: 'translateY(-7px)',
    fontWeight: '500'
  },
  hourLine: {
    flex: 1,
    borderTop: '1px solid #e5e7eb'
  },
  bookingBlock: {
    position: 'absolute',
    left: '0',
    right: '8px',
    borderRadius: '6px',
    borderLeft: '3px solid',
    padding: '4px 8px',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'box-shadow 0.15s',
    zIndex: 1
  },
  blockPatient: {
    fontWeight: '600',
    fontSize: '12px',
    color: '#111827',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  blockService: {
    fontSize: '11px',
    color: '#6b7280',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  blockTime: {
    fontSize: '11px',
    color: '#9ca3af'
  },
  currentTimeLine: {
    position: 'absolute',
    left: '-4px',
    right: '0',
    height: '2px',
    backgroundColor: '#dc2626',
    zIndex: 2
  },
  currentTimeDot: {
    position: 'absolute',
    left: '-4px',
    top: '-4px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#dc2626'
  },
  blockPopover: {
    position: 'absolute',
    left: '0',
    right: '8px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    zIndex: 10
  },
  popoverActions: {
    display: 'flex',
    gap: '8px'
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
  },
  modalTitle: {
    margin: '0 0 12px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827'
  },
  modalText: {
    color: '#4b5563',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 20px 0'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  },
  modalCancelBtn: {
    padding: '10px 20px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151'
  },
  modalConfirmBtn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#dc2626',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};
