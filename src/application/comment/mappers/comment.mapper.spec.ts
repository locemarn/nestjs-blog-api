import { beforeEach, describe, expect, it } from 'vitest';
import { CommentMapper } from './comment.mapper';
import {
  Comment,
  CommentProps,
} from 'src/domain/comment/entities/comment.entity';
import { Identifier } from 'src/domain/shared/identifier';
import { CommentContent } from 'src/domain/comment/value-objects/comment-content.vo';
import {
  CommentResponse,
  CommentResponseProps,
} from 'src/domain/comment/entities/comment-response.entity';
import { CommentResponseOutputDto } from '../queries/dto/comment-response.output.dto';
import { CommentOutputDto } from '../queries/dto/comment.output.dto';

describe('CommentMapper', () => {
  const mapper = new CommentMapper();
  let commentEntity: Comment;
  let responseEntity1: CommentResponse;
  let responseEntity2: CommentResponse;

  const commentId = Identifier.create(1);
  const postId = Identifier.create(10);
  const authorId = Identifier.create(100);
  const responderId1 = Identifier.create(101);
  const responderId2 = Identifier.create(102);
  const responseId1 = Identifier.create(201);
  const responseId2 = Identifier.create(202);
  const date = new Date();

  beforeEach(() => {
    // mapper: new CommentMapper();

    // Create mock response entities
    const respProps1: CommentResponseProps = {
      content: CommentContent.create('Reply 1'),
      userId: responderId1,
      commentId: commentId,
      postId: postId,
      created_at: date,
      updated_at: date,
    };
    responseEntity1 = CommentResponse.create(respProps1, responseId1);
    const respProps2: CommentResponseProps = {
      content: CommentContent.create('Reply 2'),
      userId: responderId2,
      commentId: commentId,
      postId: postId,
      created_at: date,
      updated_at: date,
    };
    responseEntity2 = CommentResponse.create(respProps2, responseId2);

    // Create mock comment entity WITH responses attached
    const commentProps: CommentProps = {
      content: CommentContent.create('Main comment'),
      userId: authorId,
      postId: postId,
      responses: [responseEntity1, responseEntity2],
      created_at: date,
      updated_at: date,
    };
    commentEntity = Comment.create(commentProps, commentId);
  });

  it('should map CommentResponse entity to CommentResponseOutputDto', () => {
    // const mapper = new CommentMapper();

    const expectedDto: CommentResponseOutputDto = {
      id: responseId1.Value,
      content: 'Reply 1',
      authorId: responderId1.Value,
      commentId: commentId.Value,
      postId: postId.Value,
      created_at: date,
      updated_at: date,
    };
    const actualDto = mapper.toResponseDto(responseEntity1);
    expect(actualDto).toEqual(expectedDto);
  });

  it('should map Comment entity with NO responses correctly', () => {
    const commentPropsNoReplies: CommentProps = {
      content: CommentContent.create('No replies'),
      userId: authorId,
      postId: postId,
      created_at: date,
      updated_at: date,
    };
    const commentNoReplies = Comment.create(commentPropsNoReplies, commentId);
    const expectedDto: CommentOutputDto = {
      id: commentId.Value,
      content: 'No replies',
      authorId: authorId.Value,
      postId: postId.Value,
      created_at: date,
      updated_at: date,
      replies: [], // Expect empty array
    };
    const actualDto = mapper.toDto(commentNoReplies);
    expect(actualDto?.replies).toEqual([]);
    expect(actualDto).toEqual(expectedDto);
  });

  it('should handle null input for toDto and toResponseDto', () => {
    expect(mapper.toDto(null)).toBeNull();
    expect(mapper.toResponseDto(null)).toBeNull();
  });

  it('should map array of Comment entities in toDtos', () => {
    const dtos = mapper.toDtos([commentEntity]);
    expect(dtos).toHaveLength(1);
    expect(dtos[0].id).toBe(commentId.Value);
    expect(dtos[0].replies).toHaveLength(2);
  });

  it('should handle null/empty array in toDtos', () => {
    expect(mapper.toDtos(null)).toEqual([]);
    expect(mapper.toDtos([])).toEqual([]);
  });
});
