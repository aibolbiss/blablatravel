const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep production verification separate when a dev server is running.
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
};
module.exports = withNextIntl(nextConfig);
