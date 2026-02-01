import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Optimize images
  images: {
    unoptimized: false,
    remotePatterns: [],
  },

  // Disable X-Powered-By header for security
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // React strict mode
  reactStrictMode: true,

  // Environment variables available in browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

export default nextConfig;
