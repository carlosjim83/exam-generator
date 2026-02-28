import type { DocumentUploadedEvent } from '@domain/events/DocumentEvents.js';

import { eventBus } from './EventBus.js';
import { createDocumentUploadedEventHandler } from './handlers/DocumentUploadedEventHandler.js';

/**
 * Bootstrap Event Handlers
 *
 * Registers all event handlers with the EventBus.
 * This should be called once during application startup.
 *
 * Architecture:
 * - Event handlers are registered here
 * - EventBus routes events to handlers
 * - Handlers execute asynchronously in background
 */
export function bootstrapEventHandlers(): void {
  console.log('📡 Bootstrapping event handlers...');

  // Register DocumentUploadedEventHandler
  const documentUploadedHandler = createDocumentUploadedEventHandler();
  eventBus.subscribe<DocumentUploadedEvent>('document.uploaded', (event) =>
    documentUploadedHandler.handle(event)
  );

  console.log('✅ Event handlers registered');
}
