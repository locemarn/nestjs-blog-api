import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserCreatedEvent } from '../../../domain/user/events/user-created.event';

@Injectable()
@EventsHandler(UserCreatedEvent)
export class LogUserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  private readonly logger = new Logger(LogUserCreatedHandler.name);

  handle(event: UserCreatedEvent) {
    this.logger.log(
      `User Created - ID: ${event.aggregateId}, Occurred: ${event.occurredOn}`,
    );
    // Add more complex logic here, e.g.:
    // - Send welcome email
    // - Update read models/projections
    // - Notify other services
  }
}
