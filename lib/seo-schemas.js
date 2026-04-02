// lib/seo-schemas.js
// Centralized JSON-LD schema generators for SEO
// Used by both static service pages and dynamic location pages

import { CLINIC, getAllCityNames } from './location-seo';

/**
 * Build MedicalBusiness schema with all served cities
 */
export function buildMedicalBusinessSchema(options = {}) {
  const { cityFocus } = options;

  const allCities = getAllCityNames();
  const areaServed = [
    ...allCities.map((name) => ({ '@type': 'City', name })),
    { '@type': 'AdministrativeArea', name: 'Orange County' },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': ['MedicalBusiness', 'MedicalClinic'],
    name: CLINIC.name,
    url: CLINIC.url,
    telephone: CLINIC.phone,
    image: CLINIC.image,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CLINIC.address,
      addressLocality: CLINIC.city,
      addressRegion: CLINIC.state,
      postalCode: CLINIC.zip,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: CLINIC.lat,
      longitude: CLINIC.lng,
    },
    areaServed,
    priceRange: '$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: CLINIC.ratingValue,
      reviewCount: CLINIC.reviewCount,
      bestRating: '5',
    },
    openingHoursSpecification: CLINIC.hours.map(h => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    ...(cityFocus
      ? { description: `${CLINIC.name} serves patients from ${cityFocus} at our ${CLINIC.city} clinic.` }
      : {}),
  };
}

/**
 * Build MedicalTherapy schema for a specific service
 */
export function buildMedicalTherapySchema(options) {
  const { name, alternateName, description, url, cityFocus } = options;

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalTherapy',
    name,
    ...(alternateName ? { alternateName } : {}),
    description,
    url,
    provider: {
      '@type': 'MedicalBusiness',
      name: CLINIC.name,
      url: CLINIC.url,
    },
    areaServed: cityFocus
      ? { '@type': 'City', name: cityFocus }
      : { '@type': 'City', name: `${CLINIC.city}, ${CLINIC.state}` },
  };
}

/**
 * Build FAQPage schema from FAQ array
 */
export function buildFAQSchema(faqs) {
  if (!faqs || faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Build BreadcrumbList schema
 * items: array of { name, url } objects
 */
export function buildBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Build complete JSON-LD array for a location page
 */
export function buildLocationPageSchemas(options) {
  const { serviceTitle, serviceDescription, serviceUrl, cityName, faqs, breadcrumbs } = options;

  const schemas = [
    buildMedicalBusinessSchema({ cityFocus: cityName }),
    buildMedicalTherapySchema({
      name: serviceTitle,
      description: serviceDescription,
      url: serviceUrl,
      cityFocus: cityName,
    }),
  ];

  const faqSchema = buildFAQSchema(faqs);
  if (faqSchema) schemas.push(faqSchema);

  if (breadcrumbs) {
    schemas.push(buildBreadcrumbSchema(breadcrumbs));
  }

  return schemas;
}
