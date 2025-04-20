/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnpublishPostCommandHandler } from './unpublish-post.handler';
import { POST_REPOSITORY_TOKEN } from 'src/domain/post/repositories/post.repository.interface';
import { EventBus } from '@nestjs/cqrs';
import { Post, PostProps } from 'src/domain/post/entities/post.entity';
import { PostContentVo } from 'src/domain/post/value-objects/post-content.vo';
import { PostTitleVo } from 'src/domain/post/value-objects/post-title.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { PostOutputDto } from '../../queries/get-post-by-id/get-post-by-id.dto';
import { Test } from '@nestjs/testing';
import { POST_MAPPER_TOKEN, PostMapper } from '../../mappers/post.mapper';
import { UnpublishPostCommand } from './unpublish-post.command';
import { GetPostByIdQuery } from '../../queries/get-post-by-id/get-post-by-id.query';

const mockPostRepository = { findById: vi.fn(), save: vi.fn() };
const mockEventBus = { publish: vi.fn(), publishAll: vi.fn() };
const mockQueryBus = { execute: vi.fn() };

describe('UnpublishPostCommandHandler', () => {
  let handler: UnpublishPostCommandHandler;
  // let repository: IPostRepository;
  // let eventBus: EventBus;
  // let queryBus: QueryBus;

  // --- Test Data ---
  const postId = Identifier.create(101);
  const authorId = Identifier.create(1);
  const date = new Date();
  const publishedPostProps: PostProps = {
    // Start published
    title: PostTitleVo.create('Published Post'),
    content: PostContentVo.create('Content'),
    published: true,
    userId: authorId,
    categoryIds: [],
    created_at: date,
    updated_at: date,
  };
  const createPublishedPostEntity = () =>
    Post.create(publishedPostProps, postId);

  const unpublishedPostProps: PostProps = {
    ...publishedPostProps,
    published: false,
  }; // For already unpublished test
  const unpublishedPostEntity = Post.create(unpublishedPostProps, postId);

  // DTO reflecting the state *after* successful unpublishing
  const expectedOutputDto: PostOutputDto = {
    id: postId.Value as number,
    title: 'Published Post',
    content: 'Content',
    published: false, // Should be false now
    authorId: authorId.Value as number,
    categoryIds: [],
    created_at: date,
    updated_at: expect.any(Date) as Date,
  };
  // --- End Test Data ---

  beforeEach(async () => {
    vi.restoreAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UnpublishPostCommandHandler,
        PostMapper,
        { provide: POST_MAPPER_TOKEN, useExisting: PostMapper },
        { provide: POST_REPOSITORY_TOKEN, useValue: mockPostRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: 'QueryBus', useValue: mockQueryBus },
      ],
    }).compile();
    handler = moduleRef.get<UnpublishPostCommandHandler>(
      UnpublishPostCommandHandler,
    );
    // repository = moduleRef.get(POST_REPOSITORY_TOKEN);
    // eventBus = moduleRef.get(EventBus);
    // queryBus = moduleRef.get('QueryBus');
  });

  it('should unpublish a published post successfully', async () => {
    // Arrange
    const publishedPost = createPublishedPostEntity();
    mockPostRepository.findById.mockResolvedValue(publishedPost);
    mockPostRepository.save.mockImplementation((p: Post) => p);
    mockQueryBus.execute.mockResolvedValue(expectedOutputDto);
    const publishEventsSpy = vi
      .spyOn(publishedPost, 'publishEvents')
      .mockResolvedValue(undefined);
    const domainUnpublishSpy = vi.spyOn(publishedPost, 'unpublish');
    const command = new UnpublishPostCommand(postId.Value as number);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(mockPostRepository.findById).toHaveBeenCalledWith(postId.Value);
    expect(domainUnpublishSpy).toHaveBeenCalledTimes(1); // Check domain method call
    expect(mockPostRepository.save).toHaveBeenCalledTimes(1);
    expect(mockPostRepository.save).toHaveBeenCalledWith(publishedPost);
    expect(publishEventsSpy).toHaveBeenCalledTimes(1);
    // expect(publishEventsSpy).toHaveBeenCalledWith(eventBus);
    expect(mockQueryBus.execute).toHaveBeenCalledWith(
      new GetPostByIdQuery(postId.Value as number),
    );
    expect(result).toEqual(expectedOutputDto);
    expect(result.published).toBeFalsy();
  });

  it('should throw PostNotFoundException if post does not exist', async () => {
    mockPostRepository.findById.mockResolvedValue(null);
    const command = new UnpublishPostCommand(999);
    await expect(handler.execute(command)).rejects.toThrow(
      'Post not found matching criteria: ID: 999',
    );
    expect(mockPostRepository.save).not.toHaveBeenCalled();
  });

  it('should throw PostIsNotPublishedException if post is already unpublished', async () => {
    // Arrange: Simulate finding an already unpublished post
    mockPostRepository.findById.mockResolvedValue(unpublishedPostEntity);
    const command = new UnpublishPostCommand(postId.Value as number);

    // Act & Assert: Expect the handler to throw the specific domain exception
    await expect(handler.execute(command)).rejects.toThrow(
      'Post with ID 101 is not published.',
    );
    await expect(handler.execute(command)).rejects.toThrow(
      `Post with ID ${postId.Value} is not published.`,
    ); // Check message if desired

    // Assert that save and publish were not called because of the exception
    expect(mockPostRepository.save).not.toHaveBeenCalled();
    // You probably don't need the spy for publishEvents in this specific test case
    // const publishEventsSpy = vi.spyOn(unpublishedPostEntity, 'publishEvents');
    // expect(publishEventsSpy).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled(); // Check the mock directly
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
    expect(mockQueryBus.execute).not.toHaveBeenCalled(); // QueryBus shouldn't be called either
  });
});
