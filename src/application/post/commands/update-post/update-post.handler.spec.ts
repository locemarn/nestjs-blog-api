import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdatePostCommandHandler } from './update-post.handler';
import { POST_REPOSITORY_TOKEN } from 'src/domain/post/repositories/post.repository.interface';
import { Identifier } from 'src/domain/shared/identifier';
import { Post, PostProps } from 'src/domain/post/entities/post.entity';
import { PostTitleVo } from 'src/domain/post/value-objects/post-title.vo';
import { PostContentVo } from 'src/domain/post/value-objects/post-content.vo';
import { PostOutputDto } from '../../queries/get-post-by-id/get-post-by-id.dto';
import { Test } from '@nestjs/testing';
import { POST_MAPPER_TOKEN } from '../../mappers/post.mapper';
import { UpdatePostCommand } from './update-post.command';
import { UpdatePostInputDto } from './update-post.dto';
import { PostNotFoundException } from 'src/domain/post/exceptions/post.exceptions';
import { EventBus, QueryBus } from '@nestjs/cqrs';

// --- Mocks ---
const mockPostRepository = {
  findById: vi.fn(),
  save: vi.fn(),
};
const mockEventBus = {
  publish: vi.fn(),
  publishAll: vi.fn(),
};
const mockQueryBus = {
  execute: vi.fn(),
};
const mockPostMapper = {
  toDto: vi.fn(),
  toDtos: vi.fn(),
};

describe('UpdatePostHandler', () => {
  let handler: UpdatePostCommandHandler;
  // let repository: IPostRepository;
  // let eventBus: EventBus;
  // let queryBus: QueryBus;
  // let postMapper: PostMapper;

  // --- Test Data ---
  const postId = Identifier.create(101);
  const authorId = Identifier.create(1);
  const catId1 = Identifier.create(10);
  const catId2 = Identifier.create(20);
  const date = new Date();

  const initialPostProps: PostProps = {
    title: PostTitleVo.create('Initial Title'),
    content: PostContentVo.create('Initial Content'),
    published: false,
    userId: authorId,
    categoryIds: [catId1, catId2],
    created_at: date,
    updated_at: date,
  };
  // Create a fresh instance for each test using a helper
  const createInitialPostEntity = () => Post.create(initialPostProps, postId);

  // Expected Dto
  const expectedPostDto: PostOutputDto = {
    id: postId.Value as number,
    title: 'Updated Title',
    content: 'Updated Content',
    published: true,
    authorId: authorId.Value as number,
    categoryIds: [catId1.Value] as number[],
    created_at: date,
    updated_at: date,
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UpdatePostCommandHandler,
        { provide: EventBus, useValue: mockEventBus },
        { provide: QueryBus, useValue: mockQueryBus },
        { provide: POST_REPOSITORY_TOKEN, useValue: mockPostRepository },
        { provide: POST_MAPPER_TOKEN, useValue: mockPostMapper },
      ],
    }).compile();
    handler = moduleRef.get<UpdatePostCommandHandler>(UpdatePostCommandHandler);
    // repository = moduleRef.get<IPostRepository>(POST_REPOSITORY_TOKEN);
    // eventBus = moduleRef.get<EventBus>(EventBus);
    // queryBus = moduleRef.get<QueryBus>(QueryBus);
    // postMapper = moduleRef.get<PostMapper>(POST_MAPPER_TOKEN);
  });

  it('should update a title, content, published status and categories', async () => {
    const initialPost = createInitialPostEntity();

    mockPostRepository.findById.mockResolvedValue(initialPost);

    mockPostRepository.save.mockImplementation((post: Post) => post);

    mockQueryBus.execute.mockResolvedValue(expectedPostDto);
    const publishEventSpy = vi
      .spyOn(initialPost, 'publishEvents')
      .mockResolvedValue(undefined);
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);
    const updateInput: UpdatePostInputDto = {
      title: 'Updated Title',
      content: 'Updated Content',
      publish: true,
      categoyIds: [+catId2.Value],
    };

    const command = new UpdatePostCommand(+postId.Value, updateInput);

    const result = await handler.execute(command);

    expect(mockPostRepository.findById).toHaveBeenCalledWith(+postId.Value);

    expect(mockPostRepository.save).toHaveBeenCalledTimes(1);
    const saveEntityArgs = mockPostRepository.save.mock.calls[0][0] as Post;
    expect(saveEntityArgs).toBeInstanceOf(Post);
    expect(saveEntityArgs.title.Value).toBe(updateInput.title);
    expect(saveEntityArgs.content.Value).toBe(updateInput.content);
    expect(saveEntityArgs.isPublished).toBe(updateInput.publish);
    expect(saveEntityArgs.categoryIds).toHaveLength(2);
    expect(saveEntityArgs.updated_at.getTime()).toBeGreaterThan(
      result.updated_at.getTime(),
    );

    expect(publishEventSpy).toHaveBeenCalled();
    expect(publishEventSpy).toHaveBeenCalledTimes(1);

    expect(mockQueryBus.execute).toHaveBeenCalledTimes(1);
    expect(mockQueryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: +postId.Value,
      }),
    );

    expect(result).toEqual(expectedPostDto);
  });

  it('should only update provided fields (e.g., only title)', async () => {
    const initialPost = createInitialPostEntity();
    mockPostRepository.findById.mockResolvedValue(initialPost);
    mockPostRepository.save.mockImplementation((post: Post) => post);
    mockQueryBus.execute.mockResolvedValue({
      ...expectedPostDto,
      title: 'Only Title Updated',
      content: initialPostProps.content.Value,
      published: initialPostProps.published,
      categoryIds: initialPostProps.categoryIds.map((id) => id.Value),
    });
    const publishEventSpy = vi
      .spyOn(initialPost, 'publishEvents')
      .mockResolvedValue(undefined);
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);

    const updateInput: UpdatePostInputDto = {
      title: 'Updated Title',
      publish: true,
    };
    const command = new UpdatePostCommand(+postId.Value, updateInput);
    const result = await handler.execute(command);

    expect(mockPostRepository.findById).toHaveBeenCalledWith(+postId.Value);
    expect(mockPostRepository.save).toHaveBeenCalledTimes(1);

    const saveEntityArgs = mockPostRepository.save.mock.calls[0][0] as Post;
    expect(saveEntityArgs).toBeInstanceOf(Post);
    expect(saveEntityArgs.title.Value).toBe(updateInput.title);
    expect(saveEntityArgs.content.Value).toBe(initialPostProps.content.Value);
    // expect(saveEntityArgs.isPublished).toBe(initialPostProps.published);
    expect(saveEntityArgs.categoryIds).toHaveLength(2);
    expect(saveEntityArgs.updated_at.getTime()).toBeGreaterThan(
      result.updated_at.getTime(),
    );

    expect(publishEventSpy).toHaveBeenCalled();
    expect(publishEventSpy).toHaveBeenCalledTimes(1);

    expect(mockQueryBus.execute).toHaveBeenCalledTimes(1);
    expect(mockQueryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: +postId.Value,
      }),
    );

    expect(result).toEqual({
      ...expectedPostDto,
      title: 'Only Title Updated',
      content: initialPostProps.content.Value,
      published: initialPostProps.published,
      categoryIds: initialPostProps.categoryIds.map((id) => id.Value),
    });
    expect(result).not.toEqual(expectedPostDto);
  });

  // it('should update published status to false', async () => {
  //   const initialPost = { ...initialPostProps, published: true };
  //   console.log(
  //     'should update published status to false initialPost --->',
  //     initialPost,
  //   );
  //   mockPostRepository.findById.mockResolvedValue({
  //     ...initialPost,
  //     published: true,
  //   });
  //   mockPostRepository.save.mockImplementation((post: Post) => post);
  //   mockQueryBus.execute.mockResolvedValue({
  //     ...expectedPostDto,
  //     publish: true,
  //   });
  //   vi.spyOn(initialPost, 'publishEvents' as never).mockResolvedValue(
  //     undefined,
  //   );
  //   vi.useFakeTimers();
  //   vi.advanceTimersByTime(100);

  //   expect(initialPost.isPublished).toBeFalsy();

  //   const updateInput: UpdatePostInputDto = {
  //     publish: false,
  //   };
  //   const command = new UpdatePostCommand(+postId.Value, updateInput);
  //   await handler.execute(command);

  //   expect(mockPostRepository.findById).toHaveBeenCalledWith(+postId.Value);
  //   expect(mockPostRepository.save).toHaveBeenCalledTimes(1);

  //   const saveEntityArgs = mockPostRepository.save.mock.calls[0][0] as Post;
  //   expect(saveEntityArgs.isPublished).toBeTruthy();
  //   expect(saveEntityArgs.updated_at.getTime()).toBeGreaterThan(date.getTime());
  // });

  it('should throw PostNotFoundException if post to update does not exist', async () => {
    mockPostRepository.findById.mockResolvedValue(null);
    const updateInput: UpdatePostInputDto = {
      title: 'Updated Title',
    };
    const command = new UpdatePostCommand(999, updateInput);

    await expect(handler.execute(command)).rejects.toThrow(
      PostNotFoundException,
    );
    await expect(handler.execute(command)).rejects.toThrow(
      'Post with ID 999 not found',
    );

    expect(mockPostRepository.save).not.toHaveBeenCalled();
    expect(mockQueryBus.execute).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should propagate domain validation exceptions (e.g., invalid title)', async () => {
    const initialPost = createInitialPostEntity();
    mockPostRepository.findById.mockResolvedValue(initialPost);
    const updateInput: UpdatePostInputDto = { title: '' };
    const command = new UpdatePostCommand(+postId.Value, updateInput);

    await expect(handler.execute(command)).rejects.toThrow(
      'Post title cannot be empty',
    );

    expect(mockPostRepository.save).not.toHaveBeenCalled();
  });
});
