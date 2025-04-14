import { IEvent } from '@nestjs/cqrs';

export interface IDomainEvent extends IEvent {
  readonly aggregateId: string | number; // ID of the entity the event relates to
  readonly occurredOn: Date;
}
