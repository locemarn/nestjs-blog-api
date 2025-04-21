/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeletePostCommandHandler } from './delete-post.handler';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from 'src/domain/post/repositories/post.repository.interface';
import { EventBus } from '@nestjs/cqrs';
import { Post, PostProps } from 'src/domain/post/entities/post.entity';
import { PostContentVo } from 'src/domain/post/value-objects/post-content.vo';
import { PostTitleVo } from 'src/domain/post/value-objects/post-title.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { Test } from '@nestjs/testing';
import { PostDeletedEvent } from 'src/domain/post/events/post-deleted.event';
import { DeletePostCommand } from './delete-post.command';
import { PostNotFoundException } from 'src/domain/post/exceptions/post.exceptions';

const mockPostRepository = { findById: vi.fn(), delete: vi.fn() };
const mockEventBus = { publish: vi.fn() };

describe('DeletePostCommandHandler', () => {
  let handler: DeletePostCommandHandler;
  let repository: IPostRepository;
  let eventBus: EventBus;

  // --- Test Data ---
  const postId = Identifier.create(101);
  const authorId = Identifier.create(1);
  const date = new Date();
  const postProps: PostProps = {
    // Data for mock findById result
    title: PostTitleVo.create('Post To Delete'),
    content: PostContentVo.create('Content'),
    published: true,
    userId: authorId,
    categoryIds: [],
    created_at: date,
    updated_at: date,
  };
  const postToDelete = Post.create(postProps, postId);
  // --- End Test Data ---

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        DeletePostCommandHandler,
        {
          provide: POST_REPOSITORY_TOKEN,
          useValue: mockPostRepository,
        },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();

    handler = moduleRef.get<DeletePostCommandHandler>(DeletePostCommandHandler);
    repository = moduleRef.get<IPostRepository>(POST_REPOSITORY_TOKEN);
    eventBus = moduleRef.get<EventBus>(EventBus);
  });

  it('should delete post and publish event successfully', async () => {
    // Arrange
    mockPostRepository.findById.mockResolvedValue(postToDelete);
    mockPostRepository.delete.mockResolvedValue(true);
    const command = { postId: postId.Value as number };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(mockPostRepository.findById).toHaveBeenCalledWith(
      postId.Value as number,
    );
    expect(mockPostRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockPostRepository.delete).toHaveBeenCalledWith(
      postId.Value as number,
    );
    expect(mockPostRepository.delete).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(PostDeletedEvent),
    );
    const publishedEvent = mockEventBus.publish.mock
      .calls[0][0] as PostDeletedEvent;
    expect(publishedEvent.aggregateId).toBe(postId.Value);
    expect(result).toEqual({ success: true });
  });

  it('should throw PostNotFoundException if post does not exist', async () => {
    // Arrange
    mockPostRepository.findById.mockResolvedValue(null);
    const command = new DeletePostCommand(999);

    await expect(handler.execute(command)).rejects.toThrow(
      PostNotFoundException,
    );
    await expect(handler.execute(command)).rejects.toThrow(
      'Post with ID 999 not found for deletion.',
    );

    expect(mockPostRepository.delete).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should return {success: false} and not publish event if deletion fails', async () => {
    // Arrange
    mockPostRepository.findById.mockResolvedValue(postToDelete);
    mockPostRepository.delete.mockResolvedValue(false);
    const command = new DeletePostCommand(postId.Value as number);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(mockPostRepository.findById).toHaveBeenCalledWith(
      postId.Value as number,
    );
    expect(mockPostRepository.delete).toHaveBeenCalledWith(
      postId.Value as number,
    );
    expect(mockEventBus.publish).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false });
  });

  it('should re-throw other errors from repository delete', async () => {
    // Arrange
    mockPostRepository.findById.mockResolvedValue(postToDelete);
    const dbError = new Error('Unexpected database connection error');
    mockPostRepository.delete.mockRejectedValue(dbError);
    const command = new DeletePostCommand(postId.Value as number);

    await expect(handler.execute(command)).rejects.toThrow(dbError);

    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
