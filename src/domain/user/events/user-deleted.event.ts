import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class UserDeletedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: string | number;

  constructor(userId: Identifier) {
    this.occurredOn = new Date();
    this.aggregateId = userId.Value;
  }
}
