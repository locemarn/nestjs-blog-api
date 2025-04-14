import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class UserUpdatedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: string | number;
  readonly _updatedField: string[];
  // Add fields that changed if needed (e.g., which properties were updated)
  // readonly updatedFields: string[];

  constructor(userId: Identifier, updatedField: string[]) {
    this.occurredOn = new Date();
    this.aggregateId = userId.Value;
    this._updatedField = updatedField || [];
  }
}
