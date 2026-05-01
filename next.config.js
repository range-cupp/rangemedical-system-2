/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure markdown welcome-email files are bundled into serverless functions
  outputFileTracingIncludes: {
    '/api/daily/**': ['./emails/welcome/**'],
    '/api/cron/daily-welcome': ['./emails/welcome/**'],
  },
  async redirects() {
    return [
      { source: '/range-assessment', destination: '/assessment', permanent: true },
      { source: '/start', destination: '/assessment', permanent: true },
      { source: '/start/energy', destination: '/assessment', permanent: true },
      { source: '/start/injury', destination: '/assessment', permanent: true },
      { source: '/start/energy-checkout', destination: '/assessment', permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Subdomain routing for daily.range-medical.com.
        // Only rewrite the user-facing pages — leave /api/*, /_next/*, etc. as-is
        // so the form can POST to /api/daily/subscribe over the same origin.
        {
          source: '/',
          has: [{ type: 'host', value: 'daily.range-medical.com' }],
          destination: '/daily',
        },
        {
          source: '/unsubscribe',
          has: [{ type: 'host', value: 'daily.range-medical.com' }],
          destination: '/daily/unsubscribe',
        },
      ],
    };
  },
};

module.exports = nextConfig;
