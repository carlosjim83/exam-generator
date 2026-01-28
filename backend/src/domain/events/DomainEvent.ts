// This is a base interface for all domain events.
// Specific events will extend this.
export interface DomainEvent {
  aggregateId: string;
  occurredAt: Date;
  // Add other common properties if needed
}
