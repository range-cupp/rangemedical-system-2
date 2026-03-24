// pages/api/sitemap.xml.js
// Dynamic sitemap that auto-includes all service pages, location pages, guides, and public pages

import { LOCATION_SERVICES, CITIES } from '../../lib/location-seo';
import { todayPacific } from '../../lib/date-utils';

const BASE_URL = 'https://www.range-medical.com';
const TODAY = todayPacific();

// Static pages with their priorities
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/range-assessment', priority: '0.9', changefreq: 'monthly' },
  { path: '/quiz', priority: '0.9', changefreq: 'monthly' },

  // Main service pages
  { path: '/hormone-optimization', priority: '0.9', changefreq: 'monthly' },
  { path: '/weight-loss', priority: '0.9', changefreq: 'monthly' },
  { path: '/peptide-therapy', priority: '0.9', changefreq: 'monthly' },
  { path: '/iv-therapy', priority: '0.9', changefreq: 'monthly' },
  { path: '/hyperbaric-oxygen-therapy', priority: '0.9', changefreq: 'monthly' },
  { path: '/red-light-therapy', priority: '0.9', changefreq: 'monthly' },
  { path: '/prp-therapy', priority: '0.9', changefreq: 'monthly' },
  { path: '/exosome-therapy', priority: '0.9', changefreq: 'monthly' },
  { path: '/lab-panels', priority: '0.8', changefreq: 'monthly' },
  { path: '/nad-therapy', priority: '0.9', changefreq: 'monthly' },
  { path: '/injection-therapy', priority: '0.9', changefreq: 'monthly' },
  { path: '/injury-recovery', priority: '0.9', changefreq: 'monthly' },
  { path: '/cellular-energy-reset', priority: '0.8', changefreq: 'monthly' },

  // Supporting pages
  { path: '/services', priority: '0.8', changefreq: 'monthly' },
  { path: '/reviews', priority: '0.7', changefreq: 'monthly' },
  { path: '/lab-prep', priority: '0.7', changefreq: 'monthly' },

  // Legal
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms-of-use', priority: '0.3', changefreq: 'yearly' },
  { path: '/refund-policy', priority: '0.3', changefreq: 'yearly' },
];

function generateUrl(path, priority, changefreq) {
  return `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export default function handler(req, res) {
  // Generate location page URLs
  const locationUrls = [];
  for (const serviceSlug of LOCATION_SERVICES) {
    for (const citySlug of Object.keys(CITIES)) {
      locationUrls.push(
        generateUrl(`/${serviceSlug}-${citySlug}`, '0.7', 'monthly')
      );
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map((p) => generateUrl(p.path, p.priority, p.changefreq)).join('\n')}
${locationUrls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.status(200).send(sitemap);
}
