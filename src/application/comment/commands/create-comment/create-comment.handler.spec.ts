/* eslint-disable @typescript-eslint/unbound-method */
import 'reflect-metadata';
import { EventBus, QueryBus } from '@nestjs/cqrs';
import {
  COMMENT_REPOSITORY_TOKEN,
  ICommentRepository,
} from '../../../../../src/domain/comment/repositories/comment.repository.interface';
import { CommentContent } from 'src/domain/comment/value-objects/comment-content.vo';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../../../../../src/domain/post/repositories/post.repository.interface';
import { PostContentVo } from '../../../../domain/post/value-objects/post-content.vo';
import { PostTitleVo } from 'src/domain/post/value-objects/post-title.vo';
import { Role, User } from 'src/domain/user/entities/user.entity';
import { IUserRepository } from 'src/domain/user/repositories/user.repository.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';
import { CommentOutputDto } from '../../queries/dto/comment.output.dto';
import { CreateCommentCommand } from './create-comment.command';
import { CreateCommentInputDto } from './create-comment.dto';
import { CreateCommentCommandHandler } from './create-comment.handler';
import { Identifier } from 'src/domain/shared/identifier';
import { Post } from 'src/domain/post/entities/post.entity';
import { Comment } from 'src/domain/comment/entities/comment.entity';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ArgumentNotProvidedException,
  UserNotFoundException,
} from 'src/domain/exceptions/domain.exceptions';
import { PostNotFoundException } from 'src/domain/post/exceptions/post.exceptions';

// --- Mocks ---
const mockCommentRepository: DeepMockProxy<ICommentRepository> =
  mockDeep<ICommentRepository>();
const mockUserRepository: DeepMockProxy<IUserRepository> =
  mockDeep<IUserRepository>();
const mockPostRepository: DeepMockProxy<IPostRepository> =
  mockDeep<IPostRepository>();
const mockEventBus = {
  publish: vi.fn(),
  publishAll: vi.fn(),
};
const mockQueryBus = {
  execute: vi.fn(),
};
// --- End Mocks ---

describe('CreateCommentCommandHandler', () => {
  // --- Variables ---
  let handler: CreateCommentCommandHandler;
  let commentRepositoryMock: DeepMockProxy<ICommentRepository>;
  let userRepositoryMock: DeepMockProxy<IUserRepository>;
  let postRepositoryMock: DeepMockProxy<IPostRepository>;
  let eventBusMock: typeof mockEventBus;
  let queryBusMock: typeof mockQueryBus;

  // --- Test Data Setup ---
  const authorId = Identifier.create(1);
  const postId = Identifier.create(10);
  const savedCommentId = Identifier.create(101);
  const dateNow = new Date();

  const createMockAuthor = (id: Identifier): User =>
    User.create(
      {
        email: `a-${id.Value}@b.c`,
        username: `author-${id.Value}`,
        password: 'hashedPassword',
        role: Role.USER,
        created_at: dateNow,
        updated_at: dateNow,
      },
      id,
    );
  const mockAuthor = createMockAuthor(authorId);

  const createMockPost = (id: Identifier, author: Identifier): Post =>
    Post.create(
      {
        title: PostTitleVo.create('Post Title'),
        content: PostContentVo.create('Post Content'),
        userId: author,
        published: true,
        categoryIds: [],
        created_at: dateNow,
        updated_at: dateNow,
      },
      id,
    );
  const mockPost = createMockPost(postId, authorId);

  const validCommandInput: CreateCommentInputDto = {
    content: 'This is a valid comment!',
    postId: postId.Value,
    authorId: authorId.Value,
  };
  const validCommand = new CreateCommentCommand(validCommandInput);

  // Simulate entity created *inside* the handler by Comment.create() for valid input
  const entityCreatedInternally = Comment.create({
    content: CommentContent.create(validCommandInput.content),
    userId: authorId,
    postId: postId,
  });
  const expectedEvents = [...entityCreatedInternally.domainEvents];

  // Mock entity instance returned by the repository *after* saving
  const mockSavedCommentEntity = Comment.create(
    {
      ...entityCreatedInternally._props,
      created_at: dateNow,
      updated_at: dateNow,
    },
    savedCommentId,
  );
  mockSavedCommentEntity['_domainEvents'] = expectedEvents; // Put events onto the mock

  // Expected DTO returned by queryBus.execute mock
  const expectedOutputDto: CommentOutputDto = {
    id: savedCommentId.Value,
    content: validCommandInput.content,
    postId: postId.Value,
    authorId: authorId.Value,
    created_at: dateNow,
    updated_at: dateNow,
    replies: [],
  };
  // --- End Test Data Setup ---

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCommentCommandHandler,
        {
          provide: COMMENT_REPOSITORY_TOKEN,
          useFactory: () => mockCommentRepository,
        },
        {
          provide: 'IUserRepository',
          useFactory: () => mockUserRepository,
        },
        {
          provide: POST_REPOSITORY_TOKEN,
          useFactory: () => mockPostRepository,
        },
        {
          provide: EventBus,
          useFactory: () => mockEventBus,
        },
        {
          provide: QueryBus,
          useFactory: () => mockQueryBus,
        },
      ],
    }).compile();

    handler = moduleRef.get<CreateCommentCommandHandler>(
      CreateCommentCommandHandler,
    );

    commentRepositoryMock = moduleRef.get(COMMENT_REPOSITORY_TOKEN);
    userRepositoryMock = moduleRef.get('IUserRepository');
    postRepositoryMock = moduleRef.get(POST_REPOSITORY_TOKEN);
    eventBusMock = moduleRef.get(EventBus);
    queryBusMock = moduleRef.get(QueryBus);
  });

  // --- SUCCESS PATH ---
  it('should create comment successfully and return DTO', async () => {
    // Arrange
    userRepositoryMock.findById.mockResolvedValue(mockAuthor);
    postRepositoryMock.findById.mockResolvedValue(mockPost);
    commentRepositoryMock.saveComment.mockResolvedValue(mockSavedCommentEntity);
    queryBusMock.execute.mockResolvedValue(expectedOutputDto);
    const publishSpy = vi.spyOn(mockSavedCommentEntity, 'publishEvents');

    // Act
    const result = await handler.execute(validCommand);

    // Assert: Check interactions
    expect(userRepositoryMock.findById).toHaveBeenCalledWith(authorId);
    expect(postRepositoryMock.findById).toHaveBeenCalledWith(postId.Value);
    expect(commentRepositoryMock.saveComment).toHaveBeenCalledTimes(1);
    const actualCommentArg = commentRepositoryMock.saveComment.mock.calls[0][0];
    expect(actualCommentArg.id.Value).toBe(0); // Check default ID
    expect(actualCommentArg._props.content.Value).toBe(
      validCommandInput.content,
    );

    // Assert: Event Publication
    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledWith(eventBusMock);
    expect(eventBusMock.publish).toHaveBeenCalledTimes(expectedEvents.length);

    // Assert: QueryBus Call
    expect(queryBusMock.execute).toHaveBeenCalledWith(
      expect.objectContaining({ commentId: savedCommentId.Value }),
    );

    // Assert: Final Result
    expect(result).toEqual(expectedOutputDto);
  });

  // --- FAILURE PATHS ---
  it('should throw UserNotFoundException if author does not exist', async () => {
    // Arrange
    userRepositoryMock.findById.mockResolvedValue(null); // User not found
    postRepositoryMock.findById.mockResolvedValue(mockPost);
    const publishSpy = vi.spyOn(mockSavedCommentEntity, 'publishEvents');

    // Act & Assert
    await expect(handler.execute(validCommand)).rejects.toThrow(
      UserNotFoundException,
    );
    expect(commentRepositoryMock.saveComment).not.toHaveBeenCalled();
    expect(queryBusMock.execute).not.toHaveBeenCalled();
    expect(publishSpy).not.toHaveBeenCalled();
    expect(eventBusMock.publish).not.toHaveBeenCalled();
  });

  it('should throw PostNotFoundException if post does not exist', async () => {
    // Arrange
    userRepositoryMock.findById.mockResolvedValue(mockAuthor);
    postRepositoryMock.findById.mockResolvedValue(null); // Post not found
    const publishSpy = vi.spyOn(mockSavedCommentEntity, 'publishEvents');

    // Act & Assert
    await expect(handler.execute(validCommand)).rejects.toThrow(
      PostNotFoundException,
    );
    expect(commentRepositoryMock.saveComment).not.toHaveBeenCalled();
    expect(queryBusMock.execute).not.toHaveBeenCalled();
    expect(publishSpy).not.toHaveBeenCalled();
    expect(eventBusMock.publish).not.toHaveBeenCalled();
  });

  // --- NEW TEST CASES ---

  it('should throw error if comment repository fails to save', async () => {
    // Arrange
    const saveError = new Error('Database save failed');
    userRepositoryMock.findById.mockResolvedValue(mockAuthor);
    postRepositoryMock.findById.mockResolvedValue(mockPost);
    // Mock repository save to throw an error
    commentRepositoryMock.saveComment.mockRejectedValue(saveError);
    const publishSpy = vi.spyOn(mockSavedCommentEntity, 'publishEvents'); // Spy needed

    // Act & Assert
    await expect(handler.execute(validCommand)).rejects.toThrow(saveError);

    // Verify save was called, but subsequent steps were not
    expect(commentRepositoryMock.saveComment).toHaveBeenCalledTimes(1);
    expect(publishSpy).not.toHaveBeenCalled(); // Events should not be published if save fails
    expect(eventBusMock.publish).not.toHaveBeenCalled();
    expect(queryBusMock.execute).not.toHaveBeenCalled(); // DTO fetch should not happen
  });

  it('should throw error if query bus fails after saving', async () => {
    // Arrange
    const queryError = new Error('QueryBus execution failed');
    userRepositoryMock.findById.mockResolvedValue(mockAuthor);
    postRepositoryMock.findById.mockResolvedValue(mockPost);
    commentRepositoryMock.saveComment.mockResolvedValue(mockSavedCommentEntity);
    // Mock queryBus to throw an error
    queryBusMock.execute.mockRejectedValue(queryError);
    const publishSpy = vi.spyOn(mockSavedCommentEntity, 'publishEvents');

    // Act & Assert
    await expect(handler.execute(validCommand)).rejects.toThrow(queryError);

    // Verify prior steps succeeded
    expect(commentRepositoryMock.saveComment).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(queryBusMock.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw error if query bus returns null after saving', async () => {
    // Arrange
    userRepositoryMock.findById.mockResolvedValue(mockAuthor);
    postRepositoryMock.findById.mockResolvedValue(mockPost);
    commentRepositoryMock.saveComment.mockResolvedValue(mockSavedCommentEntity);
    // Mock queryBus to return null
    queryBusMock.execute.mockResolvedValue(null);
    const publishSpy = vi.spyOn(mockSavedCommentEntity, 'publishEvents');

    // Act & Assert
    // Check for the specific Error thrown by the handler in this case
    await expect(handler.execute(validCommand)).rejects.toThrow(
      `Failed to fetch newly created comment with ID: ${savedCommentId.Value}.`,
    );

    // Verify prior steps succeeded
    expect(commentRepositoryMock.saveComment).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(queryBusMock.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw validation error if CommentContent VO creation fails', async () => {
    // Arrange
    const invalidInput: CreateCommentInputDto = {
      ...validCommandInput,
      content: '',
    }; // Example invalid content
    const invalidCommand = new CreateCommentCommand(invalidInput);
    const validationError = new ArgumentNotProvidedException(
      'Comment content is required.',
    ); // Or whatever your VO throws

    // Mock the VO's create method to throw (if it's static)
    // This requires mocking the static method itself
    const createSpy = vi
      .spyOn(CommentContent, 'create')
      .mockImplementation(() => {
        throw validationError;
      });

    userRepositoryMock.findById.mockResolvedValue(mockAuthor); // Assume these pass for this test
    postRepositoryMock.findById.mockResolvedValue(mockPost);

    // Act & Assert
    await expect(handler.execute(invalidCommand)).rejects.toThrow(
      validationError,
    );

    // Ensure repositories/buses were not called
    expect(commentRepositoryMock.saveComment).not.toHaveBeenCalled();
    expect(queryBusMock.execute).not.toHaveBeenCalled();
    expect(eventBusMock.publish).not.toHaveBeenCalled();

    // Restore the original static method after the test
    createSpy.mockRestore();
  });
});
