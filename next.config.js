/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/injury-recovery',
        destination: '/book?reason=injury',
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig
