/**
 * Runtime Configuration Client
 *
 * Fetches runtime configuration from the server at `/api/config`.
 * This allows changing configuration (like API URLs) without rebuilding the app.
 *
 * The configuration is cached in memory after the first fetch to avoid
 * unnecessary API calls.
 */

interface RuntimeConfig {
  apiUrl: string;
  environment: string;
}

let configCache: RuntimeConfig | null = null;
let configPromise: Promise<RuntimeConfig> | null = null;

/**
 * Fetches runtime configuration from the server.
 * Results are cached to avoid multiple API calls.
 */
export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  // Return cached config if available
  if (configCache) {
    return configCache;
  }

  // Return existing promise if fetch is in progress
  if (configPromise) {
    return configPromise;
  }

  // Start new fetch
  configPromise = fetch('/api/config', {
    cache: 'no-store',
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch config: ${res.statusText}`);
      }
      return res.json();
    })
    .then((config: RuntimeConfig) => {
      configCache = config;
      configPromise = null;
      return config;
    })
    .catch((error) => {
      console.error('[RuntimeConfig] Failed to load runtime config:', error);
      configPromise = null;

      // Fallback to build-time config (NEXT_PUBLIC_API_URL) if available
      // Do NOT use localhost:3001 as fallback - this causes production failures
      const buildTimeApiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const fallbackConfig: RuntimeConfig = {
        apiUrl: buildTimeApiUrl,
        environment: process.env.NODE_ENV || 'development',
      };

      configCache = fallbackConfig;
      return fallbackConfig;
    });

  return configPromise;
}

/**
 * Gets the API base URL from runtime configuration.
 * Falls back to NEXT_PUBLIC_API_URL if config fetch fails.
 */
export async function getApiUrl(): Promise<string> {
  const config = await getRuntimeConfig();
  return config.apiUrl;
}

/**
 * Clears the config cache.
 * Useful for testing or when you need to force a config refresh.
 */
export function clearConfigCache(): void {
  configCache = null;
  configPromise = null;
}
