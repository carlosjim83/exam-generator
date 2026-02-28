import { container } from '@config/container.js';
import type {
  ClassDeletedEvent,
  DocumentDeletedEvent,
  DocumentUploadedEvent,
} from '@domain/events/DocumentEvents.js';

import { eventBus } from './EventBus.js';
import { createClassDeletedEventHandler } from './handlers/ClassDeletedEventHandler.js';
import { createDocumentDeletedEventHandler } from './handlers/DocumentDeletedEventHandler.js';
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

  // Register DocumentDeletedEventHandler
  const documentDeletedHandler = createDocumentDeletedEventHandler(
    container.documentRepository,
    container.classDocumentRepository,
    container.storageService
  );
  eventBus.subscribe<DocumentDeletedEvent>('document.deleted', (event) =>
    documentDeletedHandler.handle(event)
  );

  // Register ClassDeletedEventHandler
  const classDeletedHandler = createClassDeletedEventHandler(
    container.classDocumentRepository,
    container.studentEnrollmentRepository,
    container.invitationRepository
  );
  eventBus.subscribe<ClassDeletedEvent>('class.deleted', (event) =>
    classDeletedHandler.handle(event)
  );

  console.log('✅ Event handlers registered');
}
