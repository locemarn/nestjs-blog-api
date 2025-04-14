import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class UserCreatedEvent implements IDomainEvent {
  aggregateId: string | number;
  occurredOn: Date;

  constructor(userId: Identifier) {
    this.occurredOn = new Date();
    this.aggregateId = userId.Value;
  }
}
