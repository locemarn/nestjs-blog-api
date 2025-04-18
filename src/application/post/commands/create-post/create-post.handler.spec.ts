import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { EventBus, QueryBus } from '@nestjs/cqrs';

// Command/Handler/DTOs
import { CreatePostCommandHandler } from './create-post.handler';
import { CreatePostCommand } from './create-post.command';
import { CreatePostInputDto } from './create-post.dto';

// Domain Interfaces/Tokens/Entities/VOs/Exceptions
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../../../../domain/post/repositories/post.repository.interface';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../../../domain/user/repositories/user.repository.interface';
import { Identifier } from '../../../../domain/shared/identifier';
import { Post } from '../../../../domain/post/entities/post.entity';
import {
  Role,
  User,
  UserProps,
} from '../../../../domain/user/entities/user.entity';
import { PostTitleVo } from '../../../../domain/post/value-objects/post-title.vo';
import { PostContentVo } from '../../../../domain/post/value-objects/post-content.vo';
import { PostOutputDto } from '../../queries/get-post-by-id/get-post-by-id.dto';

// Other Application Layer elements
import { PostMapper } from '../../mappers/post.mapper';
import { GetPostByIdQuery } from '../../queries/get-post-by-id/get-post-by-id.query';
import { mock } from 'node:test';
import { a } from 'vitest/dist/chunks/suite.d.FvehnV49';

// --- Mocks ---
const mockPostRepository = {
  save: vi.fn(),
};
const mockUserRepository = {
  findById: vi.fn(),
};
const mockEventBus = {
  publish: vi.fn(),
  publishAll: vi.fn(),
};
const mockQueryBus = { execute: vi.fn() };

describe('CreatePostCommandHandler', () => {
  let handler: CreatePostCommandHandler;
  let eventBus: EventBus;

  // let postRepo: IPostRepository;
  // let userRepo: IUserRepository;
  // let queryBus: QueryBus;
  // let postMapper: PostMapper;

  // --- test Data Setup ---
  const authorId = Identifier.create(1);
  const categoryId1 = Identifier.create(10);
  const savedPostId = Identifier.create(101);
  const dateNow = new Date();

  const createMockAuthor = (id: Identifier): User => {
    const props: UserProps = {
      email: `author-${id.Value}@test.com`,
      username: `author-${id.Value}`,
      password: 'hash',
      role: Role.USER,
      created_at: dateNow,
      updated_at: dateNow,
    };
    return User.create(props, id);
  };
  const mockAuthor = createMockAuthor(authorId);

  const commandInput: CreatePostInputDto = {
    title: 'New Post Title',
    content: 'New Post Content',
    published: false,
    authorId: authorId.Value as number,
    categoryIds: [categoryId1.Value] as number[],
  };
  const command = new CreatePostCommand(commandInput);

  // Expected Results
  const mockPostReturnedBySave = Post.create(
    {
      title: PostTitleVo.create(commandInput.title),
      content: PostContentVo.create(commandInput.content),
      userId: authorId,
      categoryIds: [categoryId1] as unknown as Identifier[],
      published: commandInput.published as boolean,
      created_at: expect.any(Date) as Date,
      updated_at: expect.any(Date) as Date,
    },
    savedPostId,
  );

  // Expected DTO returned by mockQueryBus.execute
  const expectedOutputDto: PostOutputDto = {
    id: savedPostId.Value as number,
    title: commandInput.title,
    content: commandInput.content,
    published: commandInput.published as boolean,
    authorId: commandInput.authorId,
    categoryIds: [categoryId1.Value] as number[],
    created_at: dateNow,
    updated_at: dateNow,
  };
  // --- End Test Data Setup ---

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreatePostCommandHandler,
        PostMapper,
        { provide: USER_REPOSITORY_TOKEN, useValue: mockUserRepository },
        { provide: POST_REPOSITORY_TOKEN, useValue: mockPostRepository },
        // { provide: EventBus, useValue: mockEventBus },
        { provide: 'EventBus', useValue: mockEventBus },
        { provide: 'QueryBus', useValue: mockQueryBus },
      ],
    }).compile();

    handler = moduleRef.get(CreatePostCommandHandler);
    eventBus = moduleRef.get<EventBus>('EventBus');
    // userRepo = moduleRef.get(USER_REPOSITORY_TOKEN);
    // postRepo = moduleRef.get(POST_REPOSITORY_TOKEN);
    // queryBus = moduleRef.get<QueryBus>('QueryBus');
    // postMapper = moduleRef.get(PostMapper);

    // Default mock implementations
    mockUserRepository.findById.mockResolvedValue(mockAuthor);
    mockPostRepository.save.mockResolvedValue(mockPostReturnedBySave);
    mockQueryBus.execute.mockResolvedValue(expectedOutputDto);
    mockQueryBus.execute.mockResolvedValue(expectedOutputDto);
    // vi.spyOn(mockPostReturnedBySave, 'publishEvents').mockResolvedValue(
    //   undefined,
    // );
  });

  it('should create post successfully', async () => {
    // mockUserRepository.findById.mockResolvedValue(mockAuthor);
    // mockPostRepository.save.mockResolvedValue(mockPostReturnedBySave);
    // mockQueryBus.execute.mockResolvedValue(expectedOutputDto);
    // mockQueryBus.execute.mockResolvedValue(expectedOutputDto);
    const publishEventsSpy = vi
      .spyOn(mockPostReturnedBySave, 'publishEvents')
      .mockResolvedValue(undefined);

    // --- End Diagnostic Logs ---
    const result = await handler.execute(command);

    expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    const savedEntityArgs = mockPostRepository.save.mock.calls[0][0] as Post;
    expect(savedEntityArgs).toBeInstanceOf(Post);
    expect(savedEntityArgs.title.Value).toBe(commandInput.title);
    expect(savedEntityArgs.content.Value).toBe(commandInput.content);
    expect(savedEntityArgs.authorId.equals(authorId)).toBeTruthy();
    expect(savedEntityArgs.categoryIds[0].equals(categoryId1)).toBeTruthy();
    expect(savedEntityArgs.isPublished).toBe(commandInput.published);

    expect(publishEventsSpy).toHaveBeenCalledWith(eventBus);

    expect(mockQueryBus.execute).toHaveBeenCalledWith(
      new GetPostByIdQuery(savedPostId.Value as number),
    );

    expect(result).toEqual(expectedOutputDto);
  });

  it('should throw UserNotFoundException if author does not exist', async () => {
    mockUserRepository.findById.mockResolvedValue(null);
    await expect(handler.execute(command)).rejects.toThrow(
      `User not found matching criteria: Author with ID ${authorId.Value} not found.`,
    );
    expect(mockPostRepository.save).not.toHaveBeenCalled();
    expect(mockQueryBus.execute).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should propagate domain validation exceptions (e.g., invalid title)', async () => {
    const invalidInput = { ...commandInput, title: '' };
    const invalidCommand = new CreatePostCommand(invalidInput);
    mockUserRepository.findById.mockResolvedValue(mockAuthor);

    await expect(handler.execute(invalidCommand)).rejects.toThrow(
      'Post title cannot be empty',
    );
    expect(mockPostRepository.save).not.toHaveBeenCalled();
  });

  it('should throw error if fetching the created post via QueryBus fails', async () => {
    mockUserRepository.findById.mockResolvedValue(mockAuthor);
    mockPostRepository.save.mockResolvedValue(mockPostReturnedBySave);
    mockQueryBus.execute.mockResolvedValue(null);
    const publishEventsSpy = vi
      .spyOn(mockPostReturnedBySave, 'publishEvents')
      .mockResolvedValue(undefined);

    await expect(handler.execute(command)).rejects.toThrow(
      `Failed to fetch newly created post with ID: ${savedPostId.Value}.`,
    );

    expect(mockPostRepository.save).toHaveBeenCalledTimes(1);
    expect(publishEventsSpy).toHaveBeenCalledWith(eventBus);
    expect(mockQueryBus.execute).toHaveBeenCalledWith(
      new GetPostByIdQuery(savedPostId.Value as number),
    );
    expect(publishEventsSpy).toHaveBeenCalledTimes(1);
    expect(mockQueryBus.execute).toHaveBeenCalledTimes(1);
  });
});
