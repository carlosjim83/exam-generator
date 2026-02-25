import { EventEmitter } from 'events';

import type { DomainEvent } from '@domain/events/DocumentEvents.js';

/**
 * EventBus
 *
 * Simple event bus built on Node.js EventEmitter.
 * Provides type-safe event publishing and subscription.
 *
 * Architecture:
 * - Singleton pattern for global event bus
 * - Type-safe event names
 * - Async event handlers
 * - Error handling for failed handlers
 *
 * Future improvements:
 * - Can be replaced with BullMQ for production
 * - Add retry logic
 * - Add dead letter queue
 * - Add event persistence
 */
export class EventBus {
  private static instance: EventBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
    // Increase max listeners (default is 10)
    this.emitter.setMaxListeners(50);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Publish an event
   * Events are processed asynchronously
   */
  public publish<T extends DomainEvent>(event: T): void {
    console.log(`📢 Event published: ${event.eventName}`, {
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt,
    });

    // Emit event asynchronously
    setImmediate(() => {
      this.emitter.emit(event.eventName, event);
    });
  }

  /**
   * Subscribe to an event
   * Handler is called asynchronously when event is published
   */
  public subscribe<T extends DomainEvent>(
    eventName: string,
    handler: (event: T) => Promise<void> | void
  ): void {
    this.emitter.on(eventName, async (event: T) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`❌ Error handling event ${eventName}:`, error);
        // In production, you'd want to:
        // - Log to monitoring service (Sentry, etc.)
        // - Retry the event
        // - Send to dead letter queue
      }
    });
  }

  /**
   * Unsubscribe from an event
   */
  public unsubscribe(eventName: string, handler: Function): void {
    this.emitter.off(eventName, handler as any);
  }

  /**
   * Clear all listeners (useful for testing)
   */
  public clear(): void {
    this.emitter.removeAllListeners();
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static reset(): void {
    if (EventBus.instance) {
      EventBus.instance.clear();
      EventBus.instance = null as any;
    }
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();
