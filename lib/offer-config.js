// lib/offer-config.js
// New patient offer definitions. Single source of truth for offer data
// used by the homepage section, checkout API, and success page.

export const NEW_PATIENT_OFFERS = [
  {
    id: 'intro-iv',
    name: 'Intro Range IV',
    priceCents: 14900,
    priceDisplay: '$149',
    regularPriceCents: 22500,
    regularPriceDisplay: '$225',
    serviceSlug: 'range-iv',
    durationMinutes: 60,
    maxPerPatient: 1,
    shortDescription: 'Our signature IV — your choice of 5 vitamins and minerals, customized for you.',
    bullets: [
      'Custom blend of 5 vitamins & minerals delivered via IV',
      'Brief health screening with a nurse practitioner before your drip',
      '45–90 minute session, one intro visit per new patient',
    ],
    stripePriceId: 'price_1TYFNyAghIShmfnksxGnOFWk',
    consentTypes: ['hipaa', 'iv'],
  },
  {
    id: 'intro-hbot',
    name: 'Intro Hyperbaric Session',
    priceCents: 9900,
    priceDisplay: '$99',
    regularPriceCents: 18500,
    regularPriceDisplay: '$185',
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
    regularPriceCents: 25500,
    regularPriceDisplay: '$255',
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
