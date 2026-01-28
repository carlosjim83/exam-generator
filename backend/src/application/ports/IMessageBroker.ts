import { DomainEvent } from '@domain/events/DomainEvent.js';

export interface IMessageBroker {
  /**
   * Publishes a domain event to the message broker.
   * @param topic The topic or queue name to publish to.
   * @param event The domain event payload.
   */
  publish(topic: string, event: DomainEvent): Promise<void>;
}
