// /pages/admin/site-map.js
// Visual site map — click through every page on the site
// Auto-discovers pages from the filesystem so new pages appear automatically

import { useState } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { ExternalLink, Search, Monitor, Smartphone, Eye } from 'lucide-react';
import fs from 'fs';
import path from 'path';

// ── Category definitions ──

const CATEGORIES = {
  'Public Pages': {
    description: 'Main public-facing pages',
    match: (p) => ['/', '/home-v2', '/services', '/reviews', '/gift-cards', '/grand-opening', '/society-oc', '/clinic-tv', '/30days', '/compare-labs', '/thank-you', '/privacy-policy', '/refund-policy', '/terms-of-use'].includes(p),
    order: 1,
  },
  'Services': {
    description: 'Service detail pages',
    match: (p) => ['/iv-therapy', '/hyperbaric-oxygen-therapy', '/red-light-therapy', '/nad-therapy', '/methylene-blue', '/peptide-therapy', '/hormone-optimization', '/injection-therapy', '/weight-loss', '/injury-recovery', '/exosome-therapy', '/prp-therapy', '/lab-panels', '/labs', '/oxygen', '/understanding-peptides', '/book-iv', '/book-recovery', '/schedule-iv'].includes(p),
    order: 2,
  },
  'Products': {
    description: 'Individual product/treatment pages',
    match: (p) => ['/aod-9604', '/ghk-cu-cream', '/hrt-membership', '/tesamorelin-ipamorelin', '/toradol', '/wl-support'].includes(p),
    order: 3,
  },
  'Treatment Guides': {
    description: 'Patient treatment guides sent after purchase',
    match: (p) => p.endsWith('-guide') || p.endsWith('-guide-page'),
    order: 4,
  },
  'Assessment & Intake': {
    description: 'Patient assessment flows and intake forms',
    match: (p) => ['/range-assessment', '/cellular-energy-assessment', '/cellular-energy-maintenance', '/cellular-energy-reset', '/cellular-energy-sales-script', '/cellular-energy-science', '/energy-check', '/intake', '/lab-prep', '/quiz', '/symptom-questionnaire', '/check-in'].includes(p) || p.startsWith('/start'),
    order: 5,
  },
  'Trials & Promos': {
    description: 'Trial offers and promotional pages',
    match: (p) => p.startsWith('/hbot-trial') || p.startsWith('/rlt-trial') || p.startsWith('/superbowl'),
    order: 6,
  },
  'Consent Forms': {
    description: 'Patient consent forms',
    match: (p) => p.startsWith('/consent/'),
    order: 7,
  },
  'Patient Portal': {
    description: 'Patient-facing portal pages',
    match: (p) => p.startsWith('/portal') || p.startsWith('/p/') || p.startsWith('/my') || p.startsWith('/onboard') || p.startsWith('/questionnaire') || p.startsWith('/track') || p.startsWith('/hrt/') || p.startsWith('/forms') || p.startsWith('/invoice') || p.startsWith('/optin') || p.startsWith('/patient') || p.startsWith('/patients') || p.startsWith('/gift/'),
    order: 8,
  },
  'Dashboard': {
    description: 'Dashboard views',
    match: (p) => p.startsWith('/dashboard') || p.startsWith('/tracker'),
    order: 9,
  },
  'Staff App': {
    description: 'Mobile staff app pages',
    match: (p) => p.startsWith('/app'),
    order: 10,
  },
  'Auth & System': {
    description: 'Login, auth, and system pages',
    match: (p) => ['/login', '/reset-password', '/staff-chat', '/front-desk'].includes(p),
    order: 11,
  },
};

// ── Filesystem scanner ──

function scanPages(dir, base = '') {
  const routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip api, admin, _next, node_modules
      if (['api', 'admin', '_next', 'node_modules'].includes(entry.name)) continue;
      routes.push(...scanPages(fullPath, `${base}/${entry.name}`));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (!['.js', '.jsx', '.tsx'].includes(ext)) continue;

      const basename = path.basename(entry.name, ext);

      // Skip internal Next.js files
      if (basename.startsWith('_')) continue;

      let route;
      if (basename === 'index') {
        route = base || '/';
      } else if (basename.startsWith('[') && basename.endsWith(']')) {
        route = `${base}/${basename}`;
      } else {
        route = `${base}/${basename}`;
      }

      routes.push(route);
    }
  }

  return routes;
}

function categorizeRoutes(routes) {
  const categorized = {};
  const uncategorized = [];

  // Initialize categories
  Object.keys(CATEGORIES).forEach((cat) => {
    categorized[cat] = [];
  });

  routes.forEach((route) => {
    let matched = false;
    for (const [catName, catDef] of Object.entries(CATEGORIES)) {
      if (catDef.match(route)) {
        categorized[catName].push(route);
        matched = true;
        break;
      }
    }
    if (!matched) {
      uncategorized.push(route);
    }
  });

  // Add uncategorized if any
  if (uncategorized.length > 0) {
    categorized['Other'] = uncategorized;
  }

  return categorized;
}

export async function getServerSideProps() {
  const pagesDir = path.join(process.cwd(), 'pages');
  const allRoutes = scanPages(pagesDir);

  // Sort alphabetically
  allRoutes.sort((a, b) => a.localeCompare(b));

  const categorized = categorizeRoutes(allRoutes);

  return {
    props: {
      categorized,
      totalCount: allRoutes.length,
    },
  };
}

// ── Page Component ──

export default function SiteMap({ categorized, totalCount }) {
  const [search, setSearch] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : '';

  // Filter routes by search
  const filteredCategories = {};
  let filteredCount = 0;

  Object.entries(categorized).forEach(([cat, routes]) => {
    const filtered = routes.filter((r) =>
      r.toLowerCase().includes(search.toLowerCase())
    );
    if (filtered.length > 0) {
      filteredCategories[cat] = filtered;
      filteredCount += filtered.length;
    }
  });

  // Sort categories by order
  const sortedCategories = Object.entries(filteredCategories).sort((a, b) => {
    const orderA = CATEGORIES[a[0]]?.order || 99;
    const orderB = CATEGORIES[b[0]]?.order || 99;
    return orderA - orderB;
  });

  const isDynamic = (route) => route.includes('[');

  return (
    <AdminLayout title="Site Map">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
              {filteredCount} pages across {sortedCategories.length} categories
            </p>
          </div>
          <div style={{ position: 'relative', width: 300 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input
              type="text"
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...sharedStyles.input,
                paddingLeft: 36,
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* Preview Panel */}
        {previewUrl && (
          <div style={{
            ...sharedStyles.card,
            marginBottom: 24,
            padding: 0,
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px',
              borderBottom: '1px solid #333',
              background: '#1a1a1a',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Eye size={16} color="#888" />
                <span style={{ color: '#ccc', fontSize: 14 }}>{previewUrl}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setPreviewMode('desktop')}
                  style={{
                    background: previewMode === 'desktop' ? '#333' : 'transparent',
                    border: '1px solid #444',
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    color: previewMode === 'desktop' ? '#fff' : '#888',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Desktop view"
                >
                  <Monitor size={14} />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  style={{
                    background: previewMode === 'mobile' ? '#333' : 'transparent',
                    border: '1px solid #444',
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    color: previewMode === 'mobile' ? '#fff' : '#888',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Mobile view"
                >
                  <Smartphone size={14} />
                </button>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'transparent',
                    border: '1px solid #444',
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    color: '#888',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    textDecoration: 'none',
                  }}
                  title="Open in new tab"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #444',
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    color: '#888',
                    fontSize: 14,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              background: '#2a2a2a',
              padding: previewMode === 'mobile' ? '20px 0' : 0,
            }}>
              <iframe
                src={previewUrl}
                style={{
                  width: previewMode === 'mobile' ? 390 : '100%',
                  height: previewMode === 'mobile' ? 700 : 600,
                  border: previewMode === 'mobile' ? '1px solid #444' : 'none',
                  borderRadius: previewMode === 'mobile' ? 12 : 0,
                  background: '#fff',
                }}
                title="Page preview"
              />
            </div>
          </div>
        )}

        {/* Category Grid */}
        {sortedCategories.map(([category, routes]) => (
          <div key={category} style={{ ...sharedStyles.card, marginBottom: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>
                {category}
                <span style={{ color: '#666', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
                  {routes.length}
                </span>
              </h3>
              {CATEGORIES[category]?.description && (
                <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>
                  {CATEGORIES[category].description}
                </p>
              )}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 8,
            }}>
              {routes.map((route) => (
                <div
                  key={route}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#1a1a1a',
                    borderRadius: 8,
                    border: '1px solid #2a2a2a',
                  }}
                >
                  <span style={{
                    color: isDynamic(route) ? '#888' : '#ccc',
                    fontSize: 14,
                    fontFamily: 'monospace',
                    fontStyle: isDynamic(route) ? 'italic' : 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    marginRight: 8,
                  }}>
                    {route}
                  </span>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {!isDynamic(route) && (
                      <button
                        onClick={() => setPreviewUrl(route)}
                        style={{
                          background: '#2a2a2a',
                          border: '1px solid #333',
                          borderRadius: 6,
                          padding: '4px 8px',
                          cursor: 'pointer',
                          color: '#aaa',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: 12,
                        }}
                        title="Preview"
                      >
                        <Eye size={13} />
                      </button>
                    )}
                    <a
                      href={isDynamic(route) ? undefined : route}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#2a2a2a',
                        border: '1px solid #333',
                        borderRadius: 6,
                        padding: '4px 8px',
                        cursor: isDynamic(route) ? 'default' : 'pointer',
                        color: isDynamic(route) ? '#555' : '#aaa',
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        fontSize: 12,
                      }}
                      title={isDynamic(route) ? 'Dynamic route — needs a parameter' : 'Open in new tab'}
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
