// lib/location-seo.js
// Single source of truth for location-based SEO data
// Add a new city here and all location pages + sitemap auto-generate

import { servicePages } from '../data/servicePageData';

export const CLINIC = {
  name: 'Range Medical',
  phone: '(949) 997-3988',
  address: '1901 Westcliff Dr. Suite 10',
  city: 'Newport Beach',
  state: 'CA',
  zip: '92660',
  lat: 33.6189,
  lng: -117.9298,
  url: 'https://www.range-medical.com',
  image: 'https://www.range-medical.com/brand/range_logo_transparent_black.png',
  ratingValue: '5.0',
  reviewCount: '10',
  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '07:00', closes: '18:00' },
    { days: ['Saturday'], opens: '09:00', closes: '14:00' },
  ],
};

export const CITIES = {
  'costa-mesa': {
    name: 'Costa Mesa',
    slug: 'costa-mesa',
    state: 'CA',
    county: 'Orange County',
    lat: 33.6634,
    lng: -117.9034,
    zip: '92627',
    drivingMinutes: 5,
    drivingDirection: 'south',
    landmarks: ['South Coast Plaza', 'The LAB Anti-Mall', 'Triangle Square'],
    description: 'Serving Costa Mesa residents near South Coast Plaza and the Eastside.',
  },
  'irvine': {
    name: 'Irvine',
    slug: 'irvine',
    state: 'CA',
    county: 'Orange County',
    lat: 33.6846,
    lng: -117.8265,
    zip: '92618',
    drivingMinutes: 15,
    drivingDirection: 'east',
    landmarks: ['Irvine Spectrum Center', 'UCI', 'Great Park'],
    description: 'Convenient access for Irvine residents via the 73 or 405.',
  },
  'huntington-beach': {
    name: 'Huntington Beach',
    slug: 'huntington-beach',
    state: 'CA',
    county: 'Orange County',
    lat: 33.6595,
    lng: -117.9988,
    zip: '92648',
    drivingMinutes: 15,
    drivingDirection: 'northwest',
    landmarks: ['Huntington Beach Pier', 'Pacific City', 'Bella Terra'],
    description: 'Easy drive from Huntington Beach down the PCH or 405.',
  },
  'laguna-beach': {
    name: 'Laguna Beach',
    slug: 'laguna-beach',
    state: 'CA',
    county: 'Orange County',
    lat: 33.5427,
    lng: -117.7854,
    zip: '92651',
    drivingMinutes: 20,
    drivingDirection: 'south',
    landmarks: ['Laguna Beach Main Beach', 'Montage Laguna Beach', 'Heisler Park'],
    description: 'Serving Laguna Beach residents along the coast.',
  },
  'dana-point': {
    name: 'Dana Point',
    slug: 'dana-point',
    state: 'CA',
    county: 'Orange County',
    lat: 33.4672,
    lng: -117.6981,
    zip: '92629',
    drivingMinutes: 25,
    drivingDirection: 'south',
    landmarks: ['Dana Point Harbor', 'Doheny State Beach', 'The Lantern District'],
    description: 'Accessible for Dana Point residents via PCH or the 5.',
  },
  'san-clemente': {
    name: 'San Clemente',
    slug: 'san-clemente',
    state: 'CA',
    county: 'Orange County',
    lat: 33.4270,
    lng: -117.6120,
    zip: '92672',
    drivingMinutes: 30,
    drivingDirection: 'south',
    landmarks: ['San Clemente Pier', 'Outlets at San Clemente', 'T-Street Beach'],
    description: 'South Orange County access for San Clemente residents. Second location coming soon.',
  },
  'tustin': {
    name: 'Tustin',
    slug: 'tustin',
    state: 'CA',
    county: 'Orange County',
    lat: 33.7458,
    lng: -117.8262,
    zip: '92780',
    drivingMinutes: 15,
    drivingDirection: 'northeast',
    landmarks: ['Tustin Legacy', 'The District at Tustin Legacy', 'Old Town Tustin'],
    description: 'Quick access for Tustin residents via the 55 freeway.',
  },
  'lake-forest': {
    name: 'Lake Forest',
    slug: 'lake-forest',
    state: 'CA',
    county: 'Orange County',
    lat: 33.6469,
    lng: -117.6891,
    zip: '92630',
    drivingMinutes: 20,
    drivingDirection: 'southeast',
    landmarks: ['Lake Forest Sports Park', 'The Arbor', 'Pittsford Park'],
    description: 'Serving Lake Forest and Foothill Ranch via the 5 or 405.',
  },
  'mission-viejo': {
    name: 'Mission Viejo',
    slug: 'mission-viejo',
    state: 'CA',
    county: 'Orange County',
    lat: 33.5965,
    lng: -117.6590,
    zip: '92691',
    drivingMinutes: 25,
    drivingDirection: 'southeast',
    landmarks: ['Lake Mission Viejo', 'The Shops at Mission Viejo', 'Oso Creek Trail'],
    description: 'Easy 5-freeway access for Mission Viejo residents.',
  },
  'laguna-niguel': {
    name: 'Laguna Niguel',
    slug: 'laguna-niguel',
    state: 'CA',
    county: 'Orange County',
    lat: 33.5225,
    lng: -117.7076,
    zip: '92677',
    drivingMinutes: 20,
    drivingDirection: 'south',
    landmarks: ['Laguna Niguel Regional Park', 'The Ritz-Carlton', 'Crown Valley Community Park'],
    description: 'Convenient for Laguna Niguel residents via Crown Valley Parkway.',
  },
};

// Services that get location pages (must exist in servicePageData.js or have fallback data)
export const LOCATION_SERVICES = [
  'hormone-optimization',
  'weight-loss',
  'peptide-therapy',
  'iv-therapy',
  'hyperbaric-oxygen-therapy',
  'red-light-therapy',
  'prp-therapy',
  'exosome-therapy',
  'lab-panels',
  'nad-therapy',
  'injection-therapy',
  'injury-recovery',
];

// Fallback data for services not in servicePageData.js
const SERVICE_FALLBACKS = {
  'nad-therapy': {
    title: 'NAD+ Therapy',
    subtitle: 'Cellular energy restoration through NAD+ infusions.',
    seo: {
      description: 'NAD+ therapy for cellular energy, brain function, and anti-aging.',
      keywords: 'NAD+ therapy, NAD infusion, anti-aging, cellular energy',
    },
    isThisForYou: {
      items: [
        { emoji: '🔋', title: 'Low Energy', description: 'Fatigue that supplements and sleep don\'t fix.' },
        { emoji: '🧠', title: 'Brain Fog', description: 'Mental clarity and focus have declined.' },
        { emoji: '⏳', title: 'Anti-Aging', description: 'Support cellular health and longevity.' },
        { emoji: '🏃', title: 'Recovery', description: 'Faster recovery from training or illness.' },
      ],
    },
    howItWorks: {
      steps: [
        { title: 'Book Session', description: 'Schedule your NAD+ infusion online or by phone.' },
        { title: 'IV Infusion', description: 'NAD+ delivered directly to your bloodstream (2-4 hours).' },
        { title: 'Cellular Boost', description: 'NAD+ supports mitochondrial function and DNA repair.' },
        { title: 'Ongoing Plan', description: 'Your provider recommends a schedule based on your goals.' },
      ],
    },
    faqs: [
      { question: 'What is NAD+?', answer: 'NAD+ (nicotinamide adenine dinucleotide) is a coenzyme essential for cellular energy production and DNA repair.' },
      { question: 'How long does an infusion take?', answer: 'NAD+ infusions typically take 2-4 hours depending on the dose.' },
      { question: 'How often should I get NAD+?', answer: 'Most patients do a loading phase of 3-5 sessions, then monthly maintenance.' },
    ],
  },
  'injection-therapy': {
    title: 'Injection Therapy',
    subtitle: 'Targeted vitamin and nutrient injections for fast results.',
    seo: {
      description: 'Vitamin injections including B12, glutathione, and amino acid shots.',
      keywords: 'vitamin injections, B12 shots, glutathione injection, amino acids',
    },
    isThisForYou: {
      items: [
        { emoji: '⚡', title: 'Quick Boost', description: 'Need fast energy or immune support.' },
        { emoji: '💪', title: 'Fitness', description: 'Amino acid support for training and recovery.' },
        { emoji: '✨', title: 'Skin Health', description: 'Glutathione for skin brightening and detox.' },
        { emoji: '🔋', title: 'Low Energy', description: 'B12 and nutrient support for fatigue.' },
      ],
    },
    howItWorks: {
      steps: [
        { title: 'Choose Injection', description: 'Pick from our menu of vitamin and nutrient shots.' },
        { title: 'Quick Visit', description: 'Injections take just a few minutes.' },
        { title: 'Feel It', description: 'Most people feel effects within hours.' },
        { title: 'Repeat', description: 'Weekly or as needed based on your goals.' },
      ],
    },
    faqs: [
      { question: 'Do injections hurt?', answer: 'Most patients describe a brief pinch. The injection itself takes seconds.' },
      { question: 'How often can I get injections?', answer: 'Most vitamin injections can be done weekly. Your provider will recommend a schedule.' },
      { question: 'Do I need an appointment?', answer: 'Walk-ins welcome for established patients. New patients should call ahead.' },
    ],
  },
  'injury-recovery': {
    title: 'Injury Recovery',
    subtitle: 'Regenerative treatments to accelerate healing and reduce pain.',
    seo: {
      description: 'Injury recovery treatments including PRP, peptides, and regenerative therapies.',
      keywords: 'injury recovery, sports medicine, PRP therapy, regenerative medicine, pain treatment',
    },
    isThisForYou: {
      items: [
        { emoji: '🩹', title: 'Slow Healing', description: 'An injury that\'s taking longer than expected.' },
        { emoji: '🦵', title: 'Joint Pain', description: 'Chronic joint issues limiting your activity.' },
        { emoji: '🏃', title: 'Sports Injury', description: 'Need to get back to training faster.' },
        { emoji: '⚡', title: 'Avoid Surgery', description: 'Looking for non-surgical options first.' },
      ],
    },
    howItWorks: {
      steps: [
        { title: 'Assessment', description: 'Discuss your injury, imaging, and recovery goals.' },
        { title: 'Treatment Plan', description: 'Your provider recommends the best regenerative approach.' },
        { title: 'Treatment', description: 'PRP, peptides, exosomes, or combination therapy.' },
        { title: 'Recovery', description: 'Guided recovery with progress monitoring.' },
      ],
    },
    faqs: [
      { question: 'What injuries do you treat?', answer: 'Joint pain, tendon injuries, ligament strains, chronic pain, post-surgical recovery, and sports injuries.' },
      { question: 'Is this covered by insurance?', answer: 'Regenerative treatments are typically not covered. We can provide documentation for HSA/FSA reimbursement.' },
      { question: 'How many treatments will I need?', answer: 'Many conditions improve with 1-3 treatments. Your provider will recommend a plan based on your specific injury.' },
    ],
  },
};

/**
 * Get service data from servicePageData.js or fallbacks
 */
export function getServiceData(serviceSlug) {
  if (servicePages[serviceSlug]) {
    return servicePages[serviceSlug];
  }
  if (SERVICE_FALLBACKS[serviceSlug]) {
    return SERVICE_FALLBACKS[serviceSlug];
  }
  return null;
}

/**
 * Format service slug into display name
 */
export function formatServiceName(slug) {
  const service = getServiceData(slug);
  if (service && service.title) return service.title;

  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate all location page paths for getStaticPaths
 */
export function getAllLocationPaths() {
  const paths = [];
  for (const serviceSlug of LOCATION_SERVICES) {
    for (const citySlug of Object.keys(CITIES)) {
      paths.push({
        params: { locationPage: `${serviceSlug}-${citySlug}` },
      });
    }
  }
  return paths;
}

/**
 * Parse a locationPage slug into service + city
 * Returns null if no valid match
 */
export function parseLocationSlug(slug) {
  // Try matching against known city slugs (from longest to shortest to avoid partial matches)
  const citySlugs = Object.keys(CITIES).sort((a, b) => b.length - a.length);

  for (const citySlug of citySlugs) {
    if (slug.endsWith(`-${citySlug}`)) {
      const serviceSlug = slug.slice(0, slug.length - citySlug.length - 1);
      if (LOCATION_SERVICES.includes(serviceSlug)) {
        return { serviceSlug, citySlug };
      }
    }
  }
  return null;
}

/**
 * Generate city-specific intro paragraph
 */
export function generateCityIntro(serviceTitle, city) {
  const templates = [
    `Looking for ${serviceTitle.toLowerCase()} near ${city.name}? Range Medical in Newport Beach is just ${city.drivingMinutes} minutes ${city.drivingDirection} and serves patients from across ${city.county}. Whether you're coming from ${city.landmarks[0]} or anywhere in ${city.name}, our clinic offers free parking and a comfortable, private setting.`,
    `${city.name} residents looking for expert ${serviceTitle.toLowerCase()} are just a short drive from our Newport Beach clinic. Located ${city.drivingMinutes} minutes ${city.drivingDirection} on Westcliff Drive, Range Medical provides personalized care with licensed providers, comprehensive lab work, and ongoing support.`,
  ];

  // Use a deterministic selection based on city + service
  const index = (city.slug.length + serviceTitle.length) % templates.length;
  return templates[index];
}

/**
 * Generate city-specific FAQ
 */
export function generateCityFAQ(city) {
  return [
    {
      question: `How far is Range Medical from ${city.name}?`,
      answer: `Our Newport Beach clinic is approximately ${city.drivingMinutes} minutes ${city.drivingDirection} of ${city.name}. We're located at ${CLINIC.address}, ${CLINIC.city}, ${CLINIC.state} ${CLINIC.zip}, with free parking available on-site.`,
    },
    {
      question: `Do you accept patients from ${city.name}?`,
      answer: `Yes. We serve patients from across ${city.county}, including ${city.name} and surrounding areas. Many of our patients drive from ${city.landmarks.slice(0, 2).join(' and ')} for our specialized services.`,
    },
  ];
}

/**
 * Build full page data for a location page
 */
export function getLocationPageData(serviceSlug, citySlug) {
  const city = CITIES[citySlug];
  const service = getServiceData(serviceSlug);
  if (!city || !service) return null;

  const serviceTitle = service.title;
  const cityName = city.name;
  const canonicalUrl = `${CLINIC.url}/${serviceSlug}-${citySlug}`;

  // Merge service FAQs with city-specific FAQs
  const allFaqs = [...(service.faqs || []), ...generateCityFAQ(city)];

  return {
    service: {
      slug: serviceSlug,
      title: serviceTitle,
      subtitle: service.subtitle,
      badge: service.badge || '',
      isThisForYou: service.isThisForYou,
      howItWorks: service.howItWorks,
      pricing: service.pricing || null,
      tools: service.tools || null,
    },
    city: {
      ...city,
    },
    seo: {
      title: `${serviceTitle} in ${cityName} | Near ${cityName} | Range Medical`,
      description: `${serviceTitle} for ${cityName} residents. ${city.drivingMinutes}-minute drive to our Newport Beach clinic. Licensed providers, comprehensive labs, and personalized treatment plans.`,
      canonical: canonicalUrl,
      keywords: `${serviceTitle.toLowerCase()} ${cityName}, ${serviceTitle.toLowerCase()} near ${cityName}, ${serviceTitle.toLowerCase()} ${city.county}, ${(service.seo?.keywords || '').split(',').slice(0, 3).join(',')}`,
    },
    intro: generateCityIntro(serviceTitle, city),
    faqs: allFaqs,
  };
}

/**
 * Get all city names for areaServed schemas
 */
export function getAllCityNames() {
  return [
    CLINIC.city,
    ...Object.values(CITIES).map((c) => c.name),
  ];
}
