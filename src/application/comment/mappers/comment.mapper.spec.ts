import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentMapper } from './comment.mapper';
import {
  Comment,
  CommentProps,
} from 'src/domain/comment/entities/comment.entity';
import { Identifier } from 'src/domain/shared/identifier';
import { CommentContent } from 'src/domain/comment/value-objects/comment-content.vo';
import {
  CommentResponse,
  CommentResponseProps as DomainCommentResponseProps,
} from 'src/domain/comment/entities/comment-response.entity';
import { CommentResponseOutputDto } from '../queries/dto/comment-response.output.dto';
import { CommentOutputDto } from '../queries/dto/comment.output.dto';

describe('CommentMapper', () => {
  const mapper = new CommentMapper();

  // --- Test Data Setup ---
  // Primitive values for DTO comparisons
  const commentIdVal = 1;
  const postIdVal = 10;
  const authorIdVal = 100;
  const responderId1Val = 101;
  const responderId2Val = 102;
  const responseId1Val = 201;
  const responseId2Val = 202;

  // Identifier instances
  const commentId = Identifier.create(commentIdVal);
  const postId = Identifier.create(postIdVal);
  const authorId = Identifier.create(authorIdVal);
  const responderId1 = Identifier.create(responderId1Val);
  const responderId2 = Identifier.create(responderId2Val);
  const responseId1 = Identifier.create(responseId1Val);
  const responseId2 = Identifier.create(responseId2Val);

  let fixedDate: Date;

  // Test entities
  let commentEntity: Comment;
  let responseEntity1: CommentResponse;
  let responseEntity2: CommentResponse;

  // Types for entity creation arguments (matching entity static `create` methods)
  type CommentResponseCreationArgs = Omit<
    DomainCommentResponseProps,
    'created_at' | 'updated_at'
  > & { created_at?: Date; updated_at?: Date };
  type CommentCreationArgs = Omit<
    CommentProps,
    'responses' | 'created_at' | 'updated_at'
  > & { responses?: CommentResponse[]; created_at?: Date; updated_at?: Date };

  beforeEach(() => {
    fixedDate = new Date('2024-05-15T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);

    // Create CommentResponse instances
    const respArgs1: CommentResponseCreationArgs = {
      content: CommentContent.create('Reply 1'),
      userId: responderId1,
      commentId: commentId,
      created_at: fixedDate,
      updated_at: fixedDate,
    };
    responseEntity1 = CommentResponse.create(respArgs1, responseId1);

    const respArgs2: CommentResponseCreationArgs = {
      content: CommentContent.create('Reply 2'),
      userId: responderId2,
      commentId: commentId,
      created_at: fixedDate,
      updated_at: fixedDate,
    };
    responseEntity2 = CommentResponse.create(respArgs2, responseId2);

    // Create Comment instance
    const commentCreationArgs: CommentCreationArgs = {
      content: CommentContent.create('Main comment'),
      userId: authorId,
      postId: postId,
      responses: [responseEntity1, responseEntity2],
      created_at: fixedDate,
      updated_at: fixedDate,
    };
    commentEntity = Comment.create(commentCreationArgs, commentId);

    expect(responseEntity1.created_at).toEqual(fixedDate);
    expect(responseEntity1.updated_at).toEqual(fixedDate);
    expect(commentEntity._props.created_at).toEqual(fixedDate);
    expect(commentEntity._props.updated_at).toEqual(fixedDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should map CommentResponse entity to CommentResponseOutputDto correctly', () => {
    const expectedDto: CommentResponseOutputDto = {
      id: responseId1Val,
      content: 'Reply 1',
      authorId: responderId1Val,
      commentId: commentIdVal,
      created_at: fixedDate,
      updated_at: fixedDate,
    };
    const actualDto = mapper.toResponseDto(responseEntity1);
    expect(actualDto).toEqual(expectedDto);
  });

  it('should map Comment entity with NO responses correctly', () => {
    const commentArgsNoReplies: CommentCreationArgs = {
      content: CommentContent.create('No replies'),
      userId: authorId,
      postId: postId,
      created_at: fixedDate,
      updated_at: fixedDate,
      responses: [],
    };
    const specificCommentId = Identifier.create(99);
    const commentNoReplies = Comment.create(
      commentArgsNoReplies,
      specificCommentId,
    );

    expect(commentNoReplies.created_at).toEqual(fixedDate);
    expect(commentNoReplies.updated_at).toEqual(fixedDate);

    const expectedDto: CommentOutputDto = {
      id: specificCommentId.Value,
      content: 'No replies',
      authorId: authorIdVal,
      postId: postIdVal,
      created_at: fixedDate,
      updated_at: fixedDate,
      replies: [],
    };
    const actualDto = mapper.toDto(commentNoReplies);

    expect(actualDto).not.toBeNull();
    if (actualDto) {
      expect(actualDto.replies).toEqual([]);
      expect(actualDto).toEqual(expectedDto);
    }
  });

  it('should handle null input for toDto and toResponseDto', () => {
    expect(mapper.toDto(null)).toBeNull();
    expect(mapper.toResponseDto(null)).toBeNull();
  });

  it.only('should map array of Comment entities in toDtos', () => {
    expect(commentEntity._props.created_at).toEqual(fixedDate);
    expect(commentEntity._props.updated_at).toEqual(fixedDate);
    expect(commentEntity.postId.Value).toEqual(postIdVal);

    const dtos = mapper.toDtos([commentEntity]);

    expect(dtos).toHaveLength(1);
    if (dtos.length === 1 && dtos[0]) {
      expect(dtos[0].id).toBe(commentEntity.id.Value);
      expect(dtos[0].postId).toBe(postIdVal);
      expect(dtos[0].replies).toHaveLength(2);
      expect(dtos[0].replies[0].id).toBe(responseId1Val);
      expect(dtos[0].replies[0].commentId).toBe(commentIdVal);
    }
  });

  it('should handle null/empty array in toDtos', () => {
    expect(mapper.toDtos(null)).toEqual([]);
    expect(mapper.toDtos([])).toEqual([]);
  });
});
