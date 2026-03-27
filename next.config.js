/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        './public/documents/**',
        './public/docs/**',
        './public/grand-opening/**',
        './public/extension/**',
        './instagram/**',
        './scripts/**',
        './migrations/**',
        './ads/**',
        './range-medical/**',
        './.claude/**',
      ],
    },
  },
};

module.exports = nextConfig;
