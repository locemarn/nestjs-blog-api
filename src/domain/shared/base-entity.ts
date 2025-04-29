import { IEventPublisher } from '@nestjs/cqrs';
import { IDomainEvent } from './domain-event.interface';
import { Identifier } from './identifier';
import { DomainEvent } from './domain-event.base';

export abstract class BaseEntity<TProps> {
  protected readonly _id: Identifier;
  public readonly _props: TProps;
  private _domainEvents: IDomainEvent[] = [];

  protected constructor(props: TProps, id?: Identifier) {
    this._id = id ?? Identifier.create(0);
    this._props = props;
  }

  get id(): Identifier {
    return this._id;
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return Object.freeze([...this._domainEvents]);
  }

  protected addDomainEvent(domainEvent: IDomainEvent): void {
    this._domainEvents.push(domainEvent);
    // Log event addition if needed:
    console.info(
      `${domainEvent.constructor.name} added for Aggregate ${this.constructor.name} ID ${this.id.Value}`,
    );
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }

  public async publishEvents(eventPublisher: IEventPublisher): Promise<void> {
    await Promise.all(
      this._domainEvents.map(async (event) => {
        console.info(
          `Publishing Domain Event: ${event.constructor.name} for Aggregate ${this.constructor.name} ID ${this.id.Value}`,
        );
        await eventPublisher.publish(event);
      }),
    );
    this.clearEvents();
  }

  public equals(object?: BaseEntity<TProps>): boolean {
    if (!object) return false;
    if (this === object) return true;
    if (!(object instanceof BaseEntity)) return false;
    return this._id.equals(object._id);
  }
}
