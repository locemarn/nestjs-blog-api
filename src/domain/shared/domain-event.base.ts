import { Identifier } from './identifier'; // Assuming Identifier is in the same shared folder

/**
 * Represents a base class for domain events.
 * Domain events signify something significant that happened within the domain.
 */
export abstract class DomainEvent {
  /**
   * The identifier of the aggregate root that this event relates to.
   */
  public readonly aggregateId: Identifier;

  /**
   * The timestamp when the event occurred.
   */
  public readonly occurredOn: Date;

  /**
   * Creates an instance of DomainEvent.
   * @param aggregateId The identifier of the aggregate root.
   */
  protected constructor(aggregateId: Identifier) {
    this.aggregateId = aggregateId;
    this.occurredOn = new Date();
  }
}
