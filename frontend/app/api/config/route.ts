/**
 * Runtime Configuration API Route
 *
 * This endpoint provides runtime configuration to the client-side code.
 * Unlike NEXT_PUBLIC_* variables which are baked into the build,
 * these values are read from environment variables at runtime,
 * allowing configuration changes without rebuilding the Docker image.
 *
 * This solves the problem of hardcoded URLs in Docker builds.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Disable caching

export async function GET() {
  const config = {
    apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    environment: process.env.NODE_ENV || 'development',
  };

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
