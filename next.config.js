/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/start', destination: '/range-assessment', permanent: true },
      { source: '/start/energy', destination: '/range-assessment?path=energy', permanent: true },
      { source: '/start/injury', destination: '/range-assessment?path=injury', permanent: true },
      { source: '/start/energy-checkout', destination: '/range-assessment?path=energy', permanent: true },
    ];
  },
};

module.exports = nextConfig;
