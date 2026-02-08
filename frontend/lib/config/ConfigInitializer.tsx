/**
 * ConfigInitializer
 *
 * Client component that initializes runtime configuration on app startup.
 * Must be included in the root layout to ensure config is loaded
 * before any API services are used.
 */

'use client';

import { useEffect } from 'react';
import { configManager } from './config-manager';

export function ConfigInitializer() {
  useEffect(() => {
    // Initialize config as soon as the component mounts
    configManager.initialize().catch((error) => {
      console.error('[ConfigInitializer] Failed to initialize config:', error);
    });
  }, []);

  // This component renders nothing
  return null;
}
