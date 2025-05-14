/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import 'reflect-metadata'; // Ensure this is the first import
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

// Domain & Application Imports
import {
  COMMENT_REPOSITORY_TOKEN, // Import the Symbol token
  ICommentRepository,
} from 'src/domain/comment/repositories/comment.repository.interface';
import { Comment } from 'src/domain/comment/entities/comment.entity';
import { CommentContent } from 'src/domain/comment/value-objects/comment-content.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { ArgumentNotProvidedException } from 'src/domain/exceptions/domain.exceptions'; // Adjust if needed

import { UpdateCommentCommandHandler } from './update-comment.handler';
import { UpdateCommentCommand } from './update-comment.command';
import { CommentMapper } from '../../mappers/comment.mapper';
import { CommentOutputDto } from '../../queries/dto/comment.output.dto';

// --- Helper Function for Creating Mock Comments ---
const createMockComment = (
  id: Identifier,
  authorId: Identifier,
  content: string,
  createdAt: Date,
  updatedAt: Date,
): Comment => {
  const comment = Comment.create(
    {
      content: CommentContent.create(content),
      userId: authorId, // Match domain entity property
      postId: Identifier.create(10), // Example postId
      created_at: createdAt,
      updated_at: updatedAt,
      responses: [],
    },
    id,
  );
  vi.spyOn(comment, 'updateContent').mockReturnThis();
  vi.spyOn(comment, 'publishEvents').mockResolvedValue(undefined);
  return comment;
};

describe('UpdateCommentCommandHandler (using Test.createTestingModule)', () => {
  // --- Declare variables using `let` ---
  let handler: UpdateCommentCommandHandler;
  let mockCommentRepository: DeepMockProxy<ICommentRepository>;
  let mockCommentMapper: DeepMockProxy<CommentMapper>;
  let mockEventBus: DeepMockProxy<EventBus>;

  // --- Test Data (Constants) ---
  const commentIdValue = 101;
  const authorIdValue = 1;
  const nonAuthorIdValue = 2;
  const dateNow = new Date();
  const initialContent = 'Initial comment content.';
  const updatedContent = 'Updated comment content!';

  const commentId = Identifier.create(commentIdValue);
  const authorId = Identifier.create(authorIdValue);
  // const nonAuthorId = Identifier.create(nonAuthorIdValue);
  const dateAfterUpdate = new Date(Date.now() + 1000);

  const validCommand = new UpdateCommentCommand(
    commentIdValue,
    authorIdValue,
    updatedContent,
  );
  const nonAuthorCommand = new UpdateCommentCommand(
    commentIdValue,
    nonAuthorIdValue,
    updatedContent,
  );

  const expectedOutputDtoBase: Omit<CommentOutputDto, 'updated_at'> = {
    id: commentIdValue,
    content: updatedContent,
    postId: 10,
    authorId: authorIdValue,
    created_at: dateNow,
    replies: [],
  };

  // Mock Entity Placeholders
  let mockInitialComment: Comment;
  let mockSavedComment: Comment;

  beforeEach(async () => {
    vi.resetAllMocks(); // Reset standard vi mocks

    // Create fresh mock instances using mockDeep
    // No need to assign here if using moduleRef.get below
    const repositoryMockInstance = mockDeep<ICommentRepository>();
    const mapperMockInstance = mockDeep<CommentMapper>();
    const eventBusMockInstance = mockDeep<EventBus>();

    // Create fresh mock entity instances
    mockInitialComment = createMockComment(
      commentId,
      authorId,
      initialContent,
      dateNow,
      dateNow,
    );
    mockSavedComment = createMockComment(
      commentId,
      authorId,
      updatedContent,
      dateNow,
      dateAfterUpdate,
    );

    // --- Setup Testing Module ---
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCommentCommandHandler, // The class under test

        // Provide mocks for dependencies using correct tokens/classes
        {
          provide: COMMENT_REPOSITORY_TOKEN, // Provide repo mock using the Symbol token
          useValue: repositoryMockInstance,
        },
        {
          provide: CommentMapper, // Provide mapper mock using the Class
          useValue: mapperMockInstance,
        },
        {
          provide: EventBus, // Provide EventBus mock using the Class
          useValue: eventBusMockInstance,
        },
      ],
    }).compile();

    // --- Get Instances from Module ---
    handler = moduleRef.get<UpdateCommentCommandHandler>(
      UpdateCommentCommandHandler,
    );
    mockCommentRepository = moduleRef.get(COMMENT_REPOSITORY_TOKEN);
    mockCommentMapper = moduleRef.get(CommentMapper);
    mockEventBus = moduleRef.get(EventBus);
  });

  // --- Test Cases ---

  it('should update comment successfully and return DTO', async () => {
    // Arrange
    const expectedDto: CommentOutputDto = {
      ...expectedOutputDtoBase,
      updated_at: dateAfterUpdate,
    };
    // Configure mock behaviors for this specific test
    mockCommentRepository.findById
      .mockResolvedValueOnce(mockInitialComment)
      .mockResolvedValueOnce(mockSavedComment);
    mockCommentRepository.update.mockResolvedValue(mockSavedComment);
    mockCommentMapper.toDto.mockReturnValue(expectedDto);

    const updateContentSpy = vi.spyOn(mockInitialComment, 'updateContent');
    const publishEventsSpy = vi.spyOn(mockSavedComment, 'publishEvents');

    // Act
    const result = await handler.execute(validCommand);

    // Assert (Same assertions as before)
    expect(mockCommentRepository.findById).toHaveBeenCalledTimes(2);
    expect(mockCommentRepository.findById).toHaveBeenNthCalledWith(
      1,
      commentId,
    );
    expect(updateContentSpy).toHaveBeenCalledTimes(1);
    expect(updateContentSpy).toHaveBeenCalledWith(
      expect.objectContaining({ Value: updatedContent }),
    );
    expect(mockCommentRepository.update).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.update).toHaveBeenCalledWith(
      mockInitialComment,
    );
    expect(publishEventsSpy).toHaveBeenCalledTimes(1);
    expect(publishEventsSpy).toHaveBeenCalledWith(mockEventBus);
    expect(mockCommentRepository.findById).toHaveBeenNthCalledWith(
      2,
      commentId,
    );
    expect(mockCommentMapper.toDto).toHaveBeenCalledTimes(1);
    expect(mockCommentMapper.toDto).toHaveBeenCalledWith(mockSavedComment);
    expect(result).toEqual(expectedDto);
  });

  it('should throw NotFoundException if comment does not exist', async () => {
    // Arrange
    mockCommentRepository.findById.mockResolvedValue(
      null as unknown as Comment,
    );

    // Act & Assert
    const expectedError = new NotFoundException(
      `Comment with ID ${commentIdValue} not found.`,
    );
    await expect(handler.execute(validCommand)).rejects.toThrow(expectedError);

    // Verify interactions
    expect(mockCommentRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.findById).toHaveBeenCalledWith(commentId);
    expect(mockCommentRepository.update).not.toHaveBeenCalled();
    expect(mockCommentMapper.toDto).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if user is not the author', async () => {
    // Arrange
    mockCommentRepository.findById.mockResolvedValueOnce(mockInitialComment); // Needs to find comment

    // Act & Assert
    const expectedError = new ForbiddenException(
      'You are not allowed to update this comment.',
    );
    await expect(handler.execute(nonAuthorCommand)).rejects.toThrow(
      expectedError,
    );

    // Verify interactions
    expect(mockCommentRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.findById).toHaveBeenCalledWith(commentId);
    expect(mockInitialComment.updateContent).not.toHaveBeenCalled();
    expect(mockCommentRepository.update).not.toHaveBeenCalled();
    expect(mockCommentMapper.toDto).not.toHaveBeenCalled();
  });

  it('should throw validation error if CommentContent VO creation fails', async () => {
    // Arrange
    const invalidContent = '';
    const invalidCommand = new UpdateCommentCommand(
      commentIdValue,
      authorIdValue,
      invalidContent,
    );
    const validationError = new ArgumentNotProvidedException(
      'Comment content cannot be empty',
    ); // Use your actual error

    mockCommentRepository.findById.mockResolvedValueOnce(mockInitialComment); // Fetch needs to succeed

    const createSpy = vi
      .spyOn(CommentContent, 'create')
      .mockImplementation(() => {
        throw validationError;
      });

    // Act & Assert
    await expect(handler.execute(invalidCommand)).rejects.toThrow(
      validationError,
    );

    // Verify interactions
    expect(mockCommentRepository.findById).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(invalidContent);
    expect(mockInitialComment.updateContent).not.toHaveBeenCalled();
    expect(mockCommentRepository.update).not.toHaveBeenCalled();
    expect(mockCommentMapper.toDto).not.toHaveBeenCalled();

    createSpy.mockRestore();
  });

  it('should throw error if comment repository update fails', async () => {
    // Arrange
    const updateError = new Error('Database update failed');
    mockCommentRepository.findById.mockResolvedValueOnce(mockInitialComment);
    mockCommentRepository.update.mockRejectedValue(updateError);

    const updateContentSpy = vi.spyOn(mockInitialComment, 'updateContent');

    // Act & Assert
    await expect(handler.execute(validCommand)).rejects.toThrow(updateError);

    // Verify interactions
    expect(mockCommentRepository.findById).toHaveBeenCalledTimes(1);
    expect(updateContentSpy).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.update).toHaveBeenCalledTimes(1);
    expect(mockCommentMapper.toDto).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled(); // Or check spy
  });

  it('should throw error if fetching comment fails after successful update', async () => {
    // Arrange
    mockCommentRepository.findById
      .mockResolvedValueOnce(mockInitialComment)
      .mockResolvedValueOnce(null as unknown as Comment);
    mockCommentRepository.update.mockResolvedValue(mockSavedComment);

    const publishEventsSpy = vi.spyOn(mockSavedComment, 'publishEvents');

    // Act & Assert
    const expectedError = new Error(
      `Failed to retrieve updated comment details for ID: ${commentIdValue}`,
    );
    await expect(handler.execute(validCommand)).rejects.toThrow(expectedError);

    // Verify interactions
    expect(mockCommentRepository.findById).toHaveBeenCalledTimes(2);
    expect(mockCommentRepository.update).toHaveBeenCalledTimes(1);
    expect(publishEventsSpy).toHaveBeenCalledTimes(1);
    expect(mockCommentMapper.toDto).not.toHaveBeenCalled();
  });
});
