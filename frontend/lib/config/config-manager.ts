/**
 * Configuration Manager (Singleton)
 *
 * Provides synchronous access to runtime configuration.
 * Must be initialized early in the app lifecycle (e.g., in root layout or _app).
 *
 * This solves the problem of async config fetching in synchronous service constructors.
 */

import { getRuntimeConfig } from './runtime-config';

class ConfigManager {
  private static instance: ConfigManager;
  private apiUrl: string = 'http://localhost:3001'; // Default fallback
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Initialize configuration (async).
   * Should be called once at app startup.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = getRuntimeConfig()
      .then((config) => {
        this.apiUrl = config.apiUrl;
        this.initialized = true;
        console.log('[ConfigManager] Initialized with API URL:', this.apiUrl);
      })
      .catch((error) => {
        console.error('[ConfigManager] Failed to initialize, using fallback:', error);
        // Keep default fallback value
        this.initialized = true;
      });

    return this.initPromise;
  }

  /**
   * Get API base URL (synchronous).
   * Returns fallback if not yet initialized.
   */
  public getApiUrl(): string {
    if (!this.initialized) {
      console.warn(
        '[ConfigManager] Accessed before initialization, returning fallback. Call initialize() early in your app.'
      );
    }
    return this.apiUrl;
  }

  /**
   * Check if config has been initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset config (useful for testing)
   */
  public reset(): void {
    this.initialized = false;
    this.initPromise = null;
    this.apiUrl = 'http://localhost:3001';
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();
