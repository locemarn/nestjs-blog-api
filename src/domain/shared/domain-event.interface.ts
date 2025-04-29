/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { IEvent } from '@nestjs/cqrs';
import { Identifier } from './identifier';

export interface IDomainEvent extends IEvent {
  readonly aggregateId: Identifier | number | string | any;
  readonly occurredOn: Date;
}
