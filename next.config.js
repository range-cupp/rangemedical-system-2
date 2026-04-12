/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/range-assessment', destination: '/assessment', permanent: true },
      { source: '/start', destination: '/assessment', permanent: true },
      { source: '/start/energy', destination: '/assessment', permanent: true },
      { source: '/start/injury', destination: '/assessment', permanent: true },
      { source: '/start/energy-checkout', destination: '/assessment', permanent: true },
    ];
  },
};

module.exports = nextConfig;
