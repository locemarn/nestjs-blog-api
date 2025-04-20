/* eslint-disable @typescript-eslint/no-unused-vars */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublishPostCommandHandler } from './publish-post.handler';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from 'src/domain/post/repositories/post.repository.interface';
import { EventBus, QueryBus } from '@nestjs/cqrs';
import { Identifier } from 'src/domain/shared/identifier';
import { Post, PostProps } from 'src/domain/post/entities/post.entity';
import { PostTitleVo } from 'src/domain/post/value-objects/post-title.vo';
import { PostContentVo } from 'src/domain/post/value-objects/post-content.vo';
import { PostOutputDto } from '../../queries/get-post-by-id/get-post-by-id.dto';
import { Test } from '@nestjs/testing';
import { POST_MAPPER_TOKEN, PostMapper } from '../../mappers/post.mapper';
import { PublishPostCommand } from './publish-post.command';
import { PostNotFoundException } from 'src/domain/post/exceptions/post.exceptions';

// --- Mocks ---
const mockPostRepository = { findById: vi.fn(), save: vi.fn() };
const mockEventBus = { publish: vi.fn() };
const mockQueryBus = { execute: vi.fn() };

describe('PublishPostCommandHandler', () => {
  let handler: PublishPostCommandHandler;
  let repository: IPostRepository;
  let eventBus: EventBus;
  let queryBus: QueryBus;

  const postId = Identifier.create(101);
  const authorId = Identifier.create(1);
  const date = new Date();
  const unpublishedPostProps: PostProps = {
    title: PostTitleVo.create('Post Title'),
    content: PostContentVo.create('Post Content'),
    published: false,
    userId: authorId,
    categoryIds: [],
    created_at: date,
    updated_at: date,
  };
  const createDraftPostEntity = () => Post.create(unpublishedPostProps, postId);

  const publishePostProps: PostProps = {
    ...unpublishedPostProps,
    published: true,
  };
  const publishedPostEntity = Post.create(publishePostProps, postId);

  const expectedOutputDto: PostOutputDto = {
    id: postId.Value as number,
    title: 'Draft Post',
    content: 'Some draft content',
    published: true,
    authorId: authorId.Value as number,
    categoryIds: [],
    created_at: date,
    updated_at: expect.any(Date) as Date,
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PublishPostCommandHandler,
        PostMapper,
        { provide: POST_MAPPER_TOKEN, useExisting: PostMapper },
        { provide: POST_REPOSITORY_TOKEN, useValue: mockPostRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: 'QueryBus', useValue: mockQueryBus },
      ],
    }).compile();

    handler = moduleRef.get<PublishPostCommandHandler>(
      PublishPostCommandHandler,
    );
    repository = moduleRef.get(POST_REPOSITORY_TOKEN);
    eventBus = moduleRef.get<EventBus>(EventBus);
    queryBus = moduleRef.get('QueryBus');
  });

  it('should publish an unpublish post successfully', async () => {
    const draftPost = createDraftPostEntity();
    mockPostRepository.findById.mockResolvedValue(draftPost);
    mockPostRepository.save.mockImplementation((postToSave: Post) => {
      expect(postToSave.isPublished).toBeTruthy();
      return postToSave;
    });
    mockQueryBus.execute.mockResolvedValue(expectedOutputDto);
    const publishEventSpy = vi
      .spyOn(draftPost, 'publishEvents')
      .mockResolvedValue(undefined);
    const domainPublishSpy = vi.spyOn(draftPost, 'publish');

    const command = new PublishPostCommand(postId.Value as number);

    const result = await handler.execute(command);

    expect(mockPostRepository.findById).toHaveBeenCalledWith(
      postId.Value as number,
    );

    expect(domainPublishSpy).toHaveBeenCalledTimes(1);
    expect(mockPostRepository.save).toHaveBeenCalledWith(draftPost);
    expect(mockPostRepository.save).toHaveBeenCalledTimes(1);
    expect(publishEventSpy).toHaveBeenCalledTimes(1);
    expect(mockQueryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: postId.Value,
      }),
    );
    expect(result).toEqual(expectedOutputDto);
  });

  it('should throw PostNotFoundException if post does not exist', async () => {
    mockPostRepository.findById.mockResolvedValue(null);
    const command = new PublishPostCommand(999);

    await expect(handler.execute(command)).rejects.toThrowError(
      PostNotFoundException,
    );
    expect(mockPostRepository.findById).toHaveBeenCalledWith(999);
    expect(mockPostRepository.save).not.toHaveBeenCalled();
    expect(mockQueryBus.execute).not.toHaveBeenCalled();
  });

  it('should throw PostIsAlreadyPublishedException if post is already exist', async () => {
    mockPostRepository.findById.mockResolvedValue(publishedPostEntity);
    const command = new PublishPostCommand(postId.Value as number);

    await expect(handler.execute(command)).rejects.toThrowError(
      'Post with ID 101 is already published.',
    );

    expect(mockPostRepository.save).not.toHaveBeenCalled();
    expect(mockQueryBus.execute).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
