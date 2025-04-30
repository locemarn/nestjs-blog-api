/* eslint-disable @typescript-eslint/unbound-method */
import 'reflect-metadata';
import { EventBus } from '@nestjs/cqrs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

// Domain & Application Imports
import { ICommentRepository } from 'src/domain/comment/repositories/comment.repository.interface';
import { Comment } from 'src/domain/comment/entities/comment.entity';
import { CommentContent } from 'src/domain/comment/value-objects/comment-content.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { ArgumentNotProvidedException } from 'src/domain/exceptions/domain.exceptions';

import { UpdateCommentCommandHandler } from './update-comment.handler';
import { UpdateCommentCommand } from './update-comment.command';
import { CommentMapper } from '../../mappers/comment.mapper';
import { CommentOutputDto } from '../../queries/dto/comment.output.dto';

// --- Helper Function ---
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
      userId: authorId,
      postId: Identifier.create(10),
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

describe('UpdateCommentCommandHandler', () => {
  // --- Variables ---
  let handler: UpdateCommentCommandHandler;
  let mockCommentRepository: DeepMockProxy<ICommentRepository>;
  let mockCommentMapper: DeepMockProxy<CommentMapper>;
  let mockEventBus: DeepMockProxy<EventBus>;

  // --- Test Data ---
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

  const expectedOutputDto: CommentOutputDto = {
    id: commentIdValue,
    content: updatedContent,
    postId: 10,
    authorId: authorIdValue,
    created_at: dateNow,
    updated_at: dateAfterUpdate,
    replies: [],
  };

  let mockInitialComment: Comment;
  let mockSavedComment: Comment;

  beforeEach(() => {
    vi.resetAllMocks();

    // Create fresh mock instances
    mockCommentRepository = mockDeep<ICommentRepository>();
    mockCommentMapper = mockDeep<CommentMapper>();
    mockEventBus = mockDeep<EventBus>();

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

    // Manually Instantiate the Handler
    handler = new UpdateCommentCommandHandler(
      mockCommentRepository,
      mockCommentMapper,
      mockEventBus,
    );
  });

  // --- Test Cases ---

  it('should update comment successfully and return DTO', async () => {
    // Arrange
    mockCommentRepository.findById
      .mockResolvedValueOnce(mockInitialComment)
      .mockResolvedValueOnce(mockSavedComment);
    mockCommentRepository.update.mockResolvedValue(mockSavedComment);
    mockCommentMapper.toDto.mockReturnValue(expectedOutputDto);

    const updateContentSpy = vi.spyOn(mockInitialComment, 'updateContent');
    const publishEventsSpy = vi.spyOn(mockSavedComment, 'publishEvents');

    // Act
    const result = await handler.execute(validCommand);

    // Assert (Assertions from previous correct version)
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
    expect(result).toEqual(expectedOutputDto);
  });

  it('should throw NotFoundException if comment does not exist', async () => {
    // Arrange
    mockCommentRepository.findById.mockResolvedValue(
      null as unknown as Comment,
    );

    // Act & Assert
    // Combine checks into one execution
    await expect(handler.execute(validCommand)).rejects.toThrow(
      new NotFoundException(`Comment with ID ${commentIdValue} not found.`),
    );

    // Verify interactions (findById is called only ONCE now)
    expect(mockCommentRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.findById).toHaveBeenCalledWith(commentId);
    expect(mockCommentRepository.update).not.toHaveBeenCalled();
    expect(mockCommentMapper.toDto).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if user is not the author', async () => {
    // Arrange
    // *** Explicitly mock findById for THIS test to succeed ***
    mockCommentRepository.findById.mockResolvedValueOnce(mockInitialComment);

    // Act & Assert
    // Combine checks into one execution
    await expect(handler.execute(nonAuthorCommand)).rejects.toThrow(
      new ForbiddenException('You are not allowed to update this comment.'),
    );

    // Verify interactions
    expect(mockCommentRepository.findById).toHaveBeenCalledTimes(1); // Called once
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

    // *** Explicitly mock findById for THIS test to succeed before validation ***
    mockCommentRepository.findById.mockResolvedValueOnce(mockInitialComment);

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
    // *** Explicitly mock findById for THIS test ***
    mockCommentRepository.findById.mockResolvedValueOnce(mockInitialComment);
    mockCommentRepository.update.mockRejectedValue(updateError); // Update fails

    const updateContentSpy = vi.spyOn(mockInitialComment, 'updateContent');

    // Act & Assert
    await expect(handler.execute(validCommand)).rejects.toThrow(updateError);

    // Verify interactions
    expect(mockCommentRepository.findById).toHaveBeenCalledTimes(1);
    expect(updateContentSpy).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.update).toHaveBeenCalledTimes(1);
    expect(mockCommentMapper.toDto).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled(); // Or check publish spy
  });

  it('should throw error if fetching comment fails after successful update', async () => {
    // Arrange
    // *** Explicitly mock findById sequence for THIS test ***
    mockCommentRepository.findById
      .mockResolvedValueOnce(mockInitialComment) // First findById OK
      .mockResolvedValueOnce(null as unknown as Comment); // Second findById fails!
    mockCommentRepository.update.mockResolvedValue(mockSavedComment); // Update OK

    const publishEventsSpy = vi.spyOn(mockSavedComment, 'publishEvents');

    // Act & Assert
    // Combine checks into one execution
    await expect(handler.execute(validCommand)).rejects.toThrow(
      new Error(
        `Failed to retrieve updated comment details for ID: ${commentIdValue}`,
      ),
    );

    // Verify interactions (findById is called only TWICE now)
    expect(mockCommentRepository.findById).toHaveBeenCalledTimes(2);
    expect(mockCommentRepository.update).toHaveBeenCalledTimes(1);
    expect(publishEventsSpy).toHaveBeenCalledTimes(1);
    expect(mockCommentMapper.toDto).not.toHaveBeenCalled();
  });
});
