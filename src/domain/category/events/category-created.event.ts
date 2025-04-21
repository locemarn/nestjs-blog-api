import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class CategoryCreatedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: number | string; // Category ID
  readonly name: string;

  constructor(categoryId: Identifier, name: string) {
    this.occurredOn = new Date();
    this.aggregateId = categoryId.Value;
    this.name = name;
  }
}
