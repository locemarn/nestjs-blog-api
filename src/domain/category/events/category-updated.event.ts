import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class CategoryUpdatedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: number | string; // Category ID
  readonly newName: string;
  readonly oldName: string;

  constructor(categoryId: Identifier, newName: string, oldName: string) {
    this.occurredOn = new Date();
    this.aggregateId = categoryId.Value;
    this.newName = newName;
    this.oldName = oldName;
  }
}
