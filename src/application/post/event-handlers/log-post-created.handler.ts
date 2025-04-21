import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PostCreatedEvent } from 'src/domain/post/events/post-created.event';

@Injectable()
@EventsHandler(PostCreatedEvent)
export class LogPostCreatedHandler implements IEventHandler<PostCreatedEvent> {
  private readonly logger = new Logger(LogPostCreatedHandler.name);

  handle(event: PostCreatedEvent) {
    this.logger.log(
      `User Created - ID: ${event.aggregateId}, Occurred: ${event.occurredOn.toISOString()}`,
    );
    // Add more complex logic here, e.g.:
    // - Send welcome email
    // - Update read models/projections
    // - Notify other services
  }
}
