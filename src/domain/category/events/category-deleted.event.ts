import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class CategoryDeletedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: number | string; // Category ID

  constructor(categoryId: Identifier) {
    this.occurredOn = new Date();
    this.aggregateId = categoryId.Value;
  }
}
