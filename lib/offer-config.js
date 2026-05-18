// lib/offer-config.js
// New patient offer definitions. Single source of truth for offer data
// used by the homepage section, checkout API, and success page.

export const NEW_PATIENT_OFFERS = [
  {
    id: 'intro-iv',
    name: 'Intro IV Visit',
    priceCents: 14900,
    priceDisplay: '$149',
    serviceSlug: 'range-iv',
    durationMinutes: 60,
    maxPerPatient: 1,
    shortDescription: 'Try an IV session and see how you feel. One visit, no commitment.',
    bullets: [
      '60-minute IV infusion (your provider picks the best formula for you)',
      'Quick vitals and health screening before your drip',
      'One intro visit per new patient',
    ],
    stripePriceId: 'price_1TYFNyAghIShmfnksxGnOFWk',
    consentTypes: ['hipaa', 'iv'],
  },
  {
    id: 'intro-hbot',
    name: 'Intro Hyperbaric Session',
    priceCents: 9900,
    priceDisplay: '$99',
    serviceSlug: 'hbot',
    durationMinutes: 60,
    maxPerPatient: 1,
    shortDescription: 'Experience a full hyperbaric oxygen session at an intro price.',
    bullets: [
      '60-minute pressurized oxygen session',
      'Staff walkthrough so you know what to expect',
      'One intro session per new patient',
    ],
    stripePriceId: 'price_1TYFO4AghIShmfnkGJFutYTl',
    consentTypes: ['hipaa', 'hbot'],
  },
  {
    id: 'intro-rlt',
    name: '3 Red Light Sessions',
    priceCents: 9900,
    priceDisplay: '$99',
    serviceSlug: 'red-light-therapy',
    durationMinutes: 20,
    maxPerPatient: 1,
    shortDescription: 'Three sessions to feel the difference. Use them within 30 days.',
    bullets: [
      '3 red light therapy sessions (20 minutes each)',
      'Use within 30 days of purchase',
      'One intro pack per new patient',
    ],
    stripePriceId: 'price_1TYFOBAghIShmfnkKsGCpQFB',
    consentTypes: ['hipaa'],
  },
];

export function getOfferById(id) {
  return NEW_PATIENT_OFFERS.find(o => o.id === id) || null;
}
