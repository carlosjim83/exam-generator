import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * SubscriptionId Value Object
 * Represents a unique identifier for a Subscription
 */
export class SubscriptionId {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('SubscriptionId cannot be empty');
    }

    if (!uuidValidate(value)) {
      throw new Error('SubscriptionId must be a valid UUID');
    }
  }

  static create(value: string): SubscriptionId {
    return new SubscriptionId(value);
  }

  static generate(): SubscriptionId {
    return new SubscriptionId(uuidv4());
  }

  equals(other: SubscriptionId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
