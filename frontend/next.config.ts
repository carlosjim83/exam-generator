import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // In monorepo setup, set outputFileTracingRoot to include shared node_modules
  outputFileTracingRoot: path.join(__dirname, '../'),

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
